export interface AIQuestion {
    text: string;
    marks: number;
    topic: string;
    concept: string;
}

export async function extractQuestionsWithOllama(rawText: string): Promise<AIQuestion[]> {
    const OLLAMA_URL = 'http://localhost:11434/api/generate';
    const MODEL = 'llama3'; // or 'mistral' - ensure user has this pulled

    // Chunking: LLMs have context limits. We parse page by page or chunks if text is huge.
    // For now, assuming standard exam paper (2-4 pages) fits in Llama3 context (8k).

    const prompt = `
    You are an expert exam paper parser.
    Extract ALL questions from the following text.
    
    Output purely a JSON array of objects. No markdown, no preambles.
    Format:
    [
      { 
        "text": "Exact text of the question", 
        "marks": 10, 
        "topic": "Unit I or Chapter Name (inferred from context)", 
        "concept": "Short keywords summarizing the core topic (e.g. '8086 Architecture')"
      }
    ]

    Rules:
    1. Ignore instruction text like "Answer any 5".
    2. If a question has sub-parts (a, b), keep them together or separate if they are distinct topics. usage: "1a) Question text".
    3. Infer markings if available (e.g. "(16)", "[10 marks]"). Default to 0 if not found.
    4. "concept" field is CRITICAL. It must be a short 2-3 word summary of what the question is specifically about (for finding duplicates later).
    
    Input Text:
    ${rawText}
    `;

    try {
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                prompt: prompt,
                stream: false,
                format: "json" // Force JSON mode
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const jsonStr = data.response;

        // Parse the JSON string from the LLM
        const questions: AIQuestion[] = JSON.parse(jsonStr);
        return questions;

    } catch (error) {
        console.error("AI Extraction Failed:", error);
        return []; // Fallback to empty (caller should handle)
    }
}
