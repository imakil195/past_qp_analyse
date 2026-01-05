
import Question, { IQuestion } from '@/models/Question';
import { calculateCosineSimilarity } from './similarity';
import { askOllama } from '../ollama/client';
import mongoose from 'mongoose';

// Thresholds
const MATCH_THRESHOLD_AUTO = 0.80; // High confidence match
const MATCH_THRESHOLD_CHECK = 0.25; // VERY AGGRESSIVE: Catch loosely-worded questions (25-80% similarity)

// Normalizer
export function normalizeTextForConcept(text: string): string {
    return text.toLowerCase()
        // Remove question numbers like "1.", "1)", "a)", "1. a)" at START of string
        // Also handling generic numbers inside if desired, but prompt says "Remove question numbering" which implies structure
        // We will be aggressive: Remove all leading digits/letters followed by ) or .
        .replace(/^[\d\w]+[\.\)]\s*/g, '')
        .replace(/^[\d\w]+\s+[\d\w]+[\.\)]\s*/g, '') // "1 a)" pattern
        .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Collapse whitespace
        .trim();
}

/**
 * Assigns a conceptId to a new question by checking against existing questions in the subject.
 * Returns the assigned conceptId (existing or new).
 */
export async function assignConceptId(
    text: string,
    subjectId: string,
    existingQuestionsCache?: { normalizedText: string, conceptId: string, text?: string }[]
): Promise<string> {
    const normalized = normalizeTextForConcept(text);

    // If no cache provided, fetch all questions for subject (lightweight projection)
    const candidates = existingQuestionsCache || await Question.find(
        { subjectId },
        { normalizedText: 1, conceptId: 1, text: 1 }
    ).lean();

    // 1. Try Find Match
    for (const candidate of candidates) {
        if (!candidate.normalizedText || !candidate.conceptId) continue;

        const similarity = calculateCosineSimilarity(normalized, candidate.normalizedText);

        if (similarity >= MATCH_THRESHOLD_AUTO) {
            return candidate.conceptId;
        }

        if (similarity >= MATCH_THRESHOLD_CHECK) {
            // AI Check
            try {
                const result = await askOllama<{ isSame: boolean }>(
                    `Q1: "${text}"\nQ2: "${candidate.text || candidate.normalizedText}"\n\nAre these the same question?`,
                    `Output JSON { "isSame": boolean }`,
                    `{ "isSame": boolean }`
                );
                if (result.success && result.data?.isSame) {
                    return candidate.conceptId;
                }
            } catch (e) {
                // Fallback math (AI is down)
                // LOWERED TO 25% to catch more variations like:
                // "Explain X" vs "What is X" (~35% similarity)
                // "Define Y" vs "Describe Y" (~32% similarity)
                if (similarity >= 0.25) return candidate.conceptId;
            }
        }
    }

    // 2. No Match -> New Concept
    return new mongoose.Types.ObjectId().toString();
}
