
import { calculateCosineSimilarity, groupSimilarQuestions } from './similarity';

export interface QuestionData {
    text: string;
    marks: number;
    year: number;
    topic: string;
    unit?: string;
    conceptId?: string; // New Global ID
}

export interface RepeatedQuestionGroup {
    mainQuestion: string;
    count: number;
    occurrenceYears: number[];
    variants: QuestionData[];
}

export async function analyzeRepeatedQuestions(questions: QuestionData[], similarityThreshold: number = 0.75): Promise<RepeatedQuestionGroup[]> {
    // FIX: Group by Concept ID (O(N) operation)
    // This relies on upload logic assigning IDs correctly.

    const conceptMap = new Map<string, QuestionData[]>();
    const noIdQuestions: QuestionData[] = [];

    questions.forEach(q => {
        if (q.conceptId) {
            const list = conceptMap.get(q.conceptId) || [];
            list.push(q);
            conceptMap.set(q.conceptId, list);
        } else {
            noIdQuestions.push(q);
        }
    });

    const groups: RepeatedQuestionGroup[] = [];

    // Process Concept Groups
    for (const [id, variants] of conceptMap.entries()) {
        const years = [...new Set(variants.map(v => v.year))].sort((a, b) => b - a);

        // Pick longest text as main
        const main = variants.reduce((prev, curr) => prev.text.length > curr.text.length ? prev : curr).text;

        groups.push({
            mainQuestion: main,
            count: years.length, // Count unique YEARS, not total variants
            occurrenceYears: years,
            variants: variants
        });
    }

    // Process Legacy/No-ID questions (Fallback)
    if (noIdQuestions.length > 0) {
        // ... call legacy groupSimilarQuestions logic if needed 
        // For now, treating them as unique to encourage re-upload
        noIdQuestions.forEach(q => {
            groups.push({
                mainQuestion: q.text,
                count: 1,
                occurrenceYears: [q.year],
                variants: [q]
            });
        });
    }

    // Sort by count descending
    return groups.sort((a, b) => b.count - a.count);
}
