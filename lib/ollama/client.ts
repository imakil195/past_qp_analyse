
// Simple wrapper for local Ollama instance
// Enforces strictly controlled JSON interaction

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = 'llama2'; // Or specific model provided by user

export interface OllamaResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export async function askOllama<T>(
    prompt: string,
    systemPrompt: string,
    schemaDescription: string
): Promise<OllamaResponse<T>> {
    try {
        const payload = {
            model: DEFAULT_MODEL,
            format: 'json', // CRITICAL: Force JSON mode
            stream: false,
            options: {
                temperature: 0.1, // Deterministic
                seed: 42
            },
            messages: [
                { role: 'system', content: `${systemPrompt} \n\nIMPORTANT: You must output strictly valid JSON matching this schema: ${schemaDescription}` },
                { role: 'user', content: prompt }
            ]
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            throw new Error(`Ollama API error: ${res.statusText}`);
        }

        const json = await res.json();
        const content = json.message?.content;

        if (!content) throw new Error("Empty response from Ollama");

        // Parse JSON safely
        try {
            const parsedData = JSON.parse(content) as T;
            return { success: true, data: parsedData };
        } catch (e) {
            console.error("Failed to parse Ollama JSON:", content);
            return { success: false, error: "Invalid JSON response" };
        }

    } catch (e: any) {
        console.error("Ollama Call Failed:", e.message);
        // Fallback or retry logic could go here
        return { success: false, error: e.message };
    }
}
