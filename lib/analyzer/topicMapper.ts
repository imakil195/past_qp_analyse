
import { getTokens } from './nlp';
import { askOllama } from '../ollama/client';

export interface TopicDefinition {
    name: string;
    keywords: string[];
}

export interface Syllabus {
    units: Record<string, TopicDefinition>; // e.g. "Unit 1": { name: "Intro", keywords: [...] }
}

// MOCK SYLLABUS (Ideally this comes from DB or Config)
const DEFAULT_SYLLABUS: Syllabus = {
    units: {
        "Unit 1": {
            name: "Introduction & Basics",
            keywords: ["history", "scope", "definition", "characteristics", "introduction"]
        },
        "Unit 2": {
            name: "Core Concepts",
            keywords: ["architecture", "component", "diagram", "block", "structure"]
        },
        "Unit 3": {
            name: "Advanced Analysis",
            keywords: ["algorithm", "complexity", "time", "space", "big-o", "master", "theorem"]
        },
        "Unit 4": {
            name: "System Design",
            keywords: ["design", "uml", "pattern", "factory", "singleton", "observer"]
        },
        "Unit 5": {
            name: "Case Studies",
            keywords: ["case", "study", "implementation", "real-time", "example", "application"]
        }
    }
};

export async function mapQuestionToTopic(
    text: string,
    inferredUnit: string // "Unit 1", "General" etc. from Extractor
): Promise<{ topic: string, unit: string, confidence: number }> {

    // 1. Structural Mapping (Strongest)
    // If the PDF said "Unit 1", we trust it for the UNIT, but we want the Topic Name.
    if (inferredUnit && inferredUnit !== 'General' && DEFAULT_SYLLABUS.units[inferredUnit]) {
        return {
            unit: inferredUnit,
            topic: DEFAULT_SYLLABUS.units[inferredUnit].name,
            confidence: 1.0
        };
    }

    // 2. Keyword Voting (Deterministic Fallback)
    const tokens = getTokens(text);
    let bestUnit = "General";
    let maxOverlap = 0;

    for (const [unitKey, def] of Object.entries(DEFAULT_SYLLABUS.units)) {
        let overlap = 0;
        def.keywords.forEach(k => {
            if (tokens.includes(k)) overlap++;
        });

        if (overlap > maxOverlap) {
            maxOverlap = overlap;
            bestUnit = unitKey;
        }
    }

    if (maxOverlap >= 2) {
        return {
            unit: bestUnit,
            topic: DEFAULT_SYLLABUS.units[bestUnit].name,
            confidence: 0.8
        };
    }

    // 3. AI Fallback (Last Resort - only if asked or if config allows)
    // For now, we return General/Unmapped to be safe rather than hallucinating.
    // Or we could ask Ollama efficiently.

    /* 
    const aiRes = await askOllama<{ unit: string }>(...);
    if (aiRes.success) ...
    */

    return {
        unit: "General",
        topic: "General Concepts",
        confidence: 0.1
    };
}
