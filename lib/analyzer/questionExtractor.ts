

export interface ExtractedQuestionData {
    text: string;
    marks: number;
    questionNumber: string;
    unit: string;
    topic: string;
    isAlternative?: boolean; // True if it's an "OR" question
}

// Robust Regex Patterns
const RE_PATTERNS = {
    // Matches: 1., 1), Q1, Q.1, 1(a), (a), 5 a, 6 b (number space letter)
    QUESTION_START: /^(?:Q\.?\s*)?(\d+)(?:\s+([a-z])|\.([a-z])|[).])\s*/i,
    // (10), [10], 10 marks, 10m
    MARKS: /[(\\[]\s*(\d+)\s*(?:marks|m|pts)?[)\\]]\s*$/i,
    // Unit headers
    UNIT_HEADER: /^(?:UNIT|MODULE|PART|SECTION)\s*[-:]?\s*([IVX0-9]+|[A-Z])/i,
    // OR separators
    OR_SEPARATOR: /^(?:\s*OR\s*|\(OR\))$/i,
    // Noise to ignore
    NOISE: /^(?:Page|Contd|Sem|Subject|Time|Max Marks|Duration|Branch|Course|Programme|College|Institute|Affiliated|Month|Year|Instructions|Answer any|S\.N\.|Total|Reg\.?\s*No|Autonomous|Examination|Note|Missing|Bloom|USN|Section)/i
};

// Clean unwanted patterns from question text
function cleanQuestionText(text: string): string {
    return text
        // Remove Bloom level indicators: L1, L2, L3, L4, etc.
        .replace(/\bL\d+\b/gi, '')
        // Remove isolated single/double digit numbers at the end (likely marks)
        .replace(/\s+\d{1,2}\s*$/g, '')
        // Remove patterns like "L3 6", "L2 10", etc.
        .replace(/\bL\d+\s+\d{1,2}\b/gi, '')
        // Remove multiple spaces
        .replace(/\s+/g, ' ')
        .trim();
}

export function extractQuestions(text: string): ExtractedQuestionData[] {
    const questions: ExtractedQuestionData[] = [];

    // 1. Pre-process / Clean Text
    // Normalize newlines, remove artifacts
    let lines = text
        .replace(/\r\n/g, '\n')
        // Specific fix for "Page (0) Break" artifacts
        .replace(/[-]*\s*Page\s*\(?\d+\)?\s*Break\s*[-]*|Page\s*\d+\s*(?:of\s*\d+)?/gi, '')
        .split('\n')
        .map(l => l.trim())
        .filter(l => {
            if (l.length < 3) return false;
            // Filter lines that are mostly separators (e.g. "----------")
            if (/^[-=_*]{3,}$/.test(l)) return false;
            if (RE_PATTERNS.NOISE.test(l)) return false;

            // Aggressive Academic Noise Filter
            const noisePhrases = [
                'college of engineering', 'institute of technology', 'university',
                'semester', 'examination', 'supplementary', 'regular',
                'important note', 'general instructions', 'answer any five',
                'time:', 'date:', 'max marks:', 'marks:', 'course code',
                'page', 'blank page', 'rough work', 'malpractice',
                'diagonal cross lines', 'revealing of identification',
                'suitably assumed', 'missing data'
            ];

            const lowerLine = l.toLowerCase();
            if (noisePhrases.some(phrase => lowerLine.includes(phrase))) return false;

            // Specific check for "Answer any..." 
            if (/^Answer\s+any\s+/i.test(l)) return false;

            // Check for specific disclaimer phrases anywhere in the line
            const disclaimers = [
                'malpractice', 'diagonal cross lines', 'revealing of identification',
                'suitably assumed', 'missing data', 'blank page', 'rough work'
            ];
            if (disclaimers.some(d => l.toLowerCase().includes(d))) return false;

            return true;
        });

    let currentUnit = "General";
    let currentBuffer = "";
    let currentQNum = "";
    let currentMarks = 0;

    // State machine helpers
    const commitQuestion = () => {
        if (currentBuffer.length > 5) { // Lowered from 10 to catch shorter questions
            questions.push({
                text: cleanQuestionText(currentBuffer), // Clean the text before storing
                marks: currentMarks,
                questionNumber: currentQNum || `Q${questions.length + 1}`,
                unit: currentUnit,
                topic: "General" // Will be filled by Topic Mapper later
            });
        }
        // Reset
        currentBuffer = "";
        currentQNum = "";
        currentMarks = 0;
    };

    // 2. Multi-Pass Parsing
    for (const line of lines) {
        // A. Check for Structure (Unit/OR)
        const unitMatch = line.match(RE_PATTERNS.UNIT_HEADER);
        if (unitMatch) {
            commitQuestion();
            currentUnit = `Unit ${unitMatch[1]}`;
            continue;
        }

        if (RE_PATTERNS.OR_SEPARATOR.test(line)) {
            // It's an OR separator
            commitQuestion();
            continue;
        }

        // B. Check for Question Start
        const qMatch = line.match(RE_PATTERNS.QUESTION_START);

        if (qMatch) {
            // New Question Identified
            commitQuestion();

            // Start new buffer
            let content = line;
            // qMatch[1] = number, qMatch[2] or qMatch[3] = optional letter (space or dot separated)
            const number = qMatch[1];
            const letter = qMatch[2] || qMatch[3] || '';
            currentQNum = letter ? `${number}${letter}` : number;

            // Extract marks immediately if present
            const mMatch = line.match(RE_PATTERNS.MARKS);
            if (mMatch) {
                currentMarks = parseInt(mMatch[1]);
                content = content.replace(mMatch[0], '').trim();
            }

            // Clean the numbering from the content for storage
            // e.g. "5 a What is..." -> "What is..."
            currentBuffer = content.replace(RE_PATTERNS.QUESTION_START, '').trim();

        } else {
            // Continuation of previous question OR embedded sub-question
            // Check for marks on this line (isolated marks line)
            const mMatch = line.match(RE_PATTERNS.MARKS);
            if (mMatch && line.length < 15) {
                currentMarks = parseInt(mMatch[1]);
            } else {
                // Check if this line contains an embedded sub-question pattern
                // Pattern: "... text. 7 b Define..." or "... text. (12 Marks) b Write..."
                const embeddedSubQ = line.match(/^(.+?)[\.\?!]\s+(\d+)\s+([a-z])\s+(.+)/i);
                const embeddedWithMarks = line.match(/^(.+?)\s+\(?\d+\s*Marks?\)?\s+([a-z])\s+(.+)/i);

                if (embeddedSubQ) {
                    // Complete current question with the text before the sub-question
                    if (currentBuffer) {
                        currentBuffer += " " + embeddedSubQ[1];
                        commitQuestion();
                    }

                    // Start new question with the embedded sub-question
                    currentQNum = embeddedSubQ[2] + embeddedSubQ[3]; // e.g., "7b"
                    currentBuffer = embeddedSubQ[4].trim();
                    currentMarks = 0;
                } else if (embeddedWithMarks) {
                    // Pattern: "(12 Marks) b Write..." within continuation
                    if (currentBuffer) {
                        commitQuestion();
                    }
                    currentQNum = currentQNum.replace(/[a-z]$/i, '') + embeddedWithMarks[2]; // e.g., "7b"
                    currentBuffer = embeddedWithMarks[3].trim();
                    currentMarks = 0;
                } else {
                    // Just continuation content
                    if (currentBuffer) {
                        // Merge with space or hyphen fix
                        if (currentBuffer.endsWith('-')) {
                            currentBuffer = currentBuffer.slice(0, -1) + line;
                        } else {
                            currentBuffer += " " + line;
                        }
                    } else {
                        // Orphan text - allow if it looks like a question
                        const hasQuestionWords = /\b(what|why|how|explain|define|describe|discuss|list|name|write|draw|state|derive|prove|show|calculate|find)\b/i.test(line);
                        if (line.length > 25 && hasQuestionWords) {
                            currentBuffer = line;
                        }
                    }
                }
            }
        }
    }

    commitQuestion(); // Final flush

    // 3. Post-Process Normalization: Merge split sentences and remove noise
    return questions.filter(q => {
        // Must have at least some meaningful text
        if (q.text.length < 5) return false;
        // Check for missed headers
        if (/^(Unit|Section|Part)\s+\w+$/i.test(q.text)) return false;
        return true;
    });
}
