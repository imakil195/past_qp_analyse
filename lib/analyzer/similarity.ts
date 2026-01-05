
import { getTokens } from './nlp';

// Build a simple Term Frequency map
function getTermFrequency(tokens: string[]): Map<string, number> {
    const tf = new Map<string, number>();
    tokens.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
    return tf;
}

// Calculate Cosine Similarity between two token lists
export function calculateCosineSimilarity(text1: string, text2: string): number {
    const tokens1 = getTokens(text1);
    const tokens2 = getTokens(text2);

    if (tokens1.length === 0 || tokens2.length === 0) return 0;

    const tf1 = getTermFrequency(tokens1);
    const tf2 = getTermFrequency(tokens2);

    // Get unique terms from both
    const allTerms = new Set([...tf1.keys(), ...tf2.keys()]);

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    allTerms.forEach(term => {
        const val1 = tf1.get(term) || 0;
        const val2 = tf2.get(term) || 0;

        dotProduct += val1 * val2;
        mag1 += val1 * val1;
        mag2 += val2 * val2;
    });

    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);

    if (mag1 === 0 || mag2 === 0) return 0;

    return dotProduct / (mag1 * mag2);
}

// Grouping Logic
export interface QuestionGroup {
    mainQuestion: string;
    variants: string[];
    ids: string[];
}

import { askOllama } from '../ollama/client';

// ... (keep NLP imports and functions)

// Thresholds
const MATH_THRESHOLD_AUTO = 0.75; // Strong match -> Auto group
const MATH_THRESHOLD_CHECK = 0.50; // Weak match -> Ask AI (was 0.60, lowered for better recall)

interface AISimilarityResponse {
    isSame: boolean;
    reason?: string;
}

// AI Validation Helper
async function askOllamaAreSame(q1: string, q2: string): Promise<boolean> {
    const prompt = `Question 1: "${q1}"\nQuestion 2: "${q2}"\n\nAre these two questions asking for the same core concept or answer? Ignore minor wording differences.`;
    const system = `You are an expert exam question analyzer. Output boolean true only if the questions are semantically identical.`;

    // Call Ollama with 2s timeout optimization (mock via client options if needed, here we depend on client default)
    const result = await askOllama<AISimilarityResponse>(
        prompt,
        system,
        `{ "isSame": boolean }`
    );

    if (result.success && result.data) {
        return result.data.isSame;
    }
    return false; // Fail safe
}

export async function groupSimilarQuestions(questions: { id: string, text: string }[]): Promise<QuestionGroup[]> {
    const groups: QuestionGroup[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < questions.length; i++) {
        const q1 = questions[i];
        if (processed.has(q1.id)) continue;

        const currentGroup: QuestionGroup = {
            mainQuestion: q1.text,
            variants: [q1.text],
            ids: [q1.id]
        };
        processed.add(q1.id);

        for (let j = i + 1; j < questions.length; j++) {
            const q2 = questions[j];
            if (processed.has(q2.id)) continue;

            const similarity = calculateCosineSimilarity(q1.text, q2.text);

            if (similarity >= MATH_THRESHOLD_AUTO) {
                // High confidence - group deterministically
                currentGroup.variants.push(q2.text);
                currentGroup.ids.push(q2.id);
                processed.add(q2.id);
            }
            else if (similarity >= MATH_THRESHOLD_CHECK) {
                // Borderline - USE AI VALIDATION
                // Optimization: If Ollama is down, fallback to a stricter math check 
                // to ensure we still catch obvious matches without blocking.

                try {
                    const result = await askOllama<AISimilarityResponse>(
                        `Question 1: "${q1.text}"\nQuestion 2: "${q2.text}"\n\nAre these two questions asking for the same core concept?`,
                        `Output valid JSON: { "isSame": boolean }`,
                        `{ "isSame": boolean }`
                    );

                    if (result.success && result.data) {
                        if (result.data.isSame) {
                            currentGroup.variants.push(q2.text);
                            currentGroup.ids.push(q2.id);
                            processed.add(q2.id);
                        }
                    } else {
                        // FALLBACK if AI fails/times out
                        // Use a medium-high math threshold (e.g. 0.65)
                        if (similarity >= 0.65) {
                            currentGroup.variants.push(q2.text);
                            currentGroup.ids.push(q2.id);
                            processed.add(q2.id);
                        }
                    }
                } catch (e) {
                    // Fallback on crash
                    if (similarity >= 0.65) {
                        currentGroup.variants.push(q2.text);
                        currentGroup.ids.push(q2.id);
                        processed.add(q2.id);
                    }
                }
            }
        }
        groups.push(currentGroup);
    }

    return groups.sort((a, b) => b.variants.length - a.variants.length);
}
