
import { askOllama } from '../lib/ollama/client';

async function testOllama() {
    console.log("Testing Ollama Connection...");
    try {
        const res = await askOllama(
            "Are 'Define CPU' and 'What is a Central Processing Unit?' the same question?",
            "You are a helpful assistant.",
            "{ \"answer\": boolean }"
        );
        console.log("Response:", JSON.stringify(res, null, 2));

        if (!res.success) {
            console.error("Ollama Check FAILED.");
        } else {
            console.log("Ollama Check PASSED.");
        }
    } catch (e) {
        console.error("Crash:", e);
    }
}

testOllama();
