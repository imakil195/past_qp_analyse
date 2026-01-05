import { PorterStemmer, WordTokenizer } from 'natural';

// Academic Stopwords that don't add semantic value for similarity
// "Why", "How" are kept in some contexts but for similarity, we usually drop them
// unless we want to distinguish "Why X" from "What is X".
// Let's keep it academic-safe.
export const STOPWORDS = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by',
    'explain', 'define', 'describe', 'what', 'write', 'short', 'note', 'discuss', 'state', 'list',
    'mention', 'illustrate', 'expression', 'derive', 'about', 'briefly'
]);

// Technical terms to preserve (AllowList) to prevent over-stemming
// e.g. "bus" -> "bu" (bad), "tcp/ip" -> "tcpip" (ok)
const TECHNICAL_TERMS = new Set([
    'tcp', 'udp', 'sql', 'acid', 'osi', 'cpu', 'alu', 'dma', 'iot', 'api', 'url', 'http', 'html', 'css',
    'bfs', 'dfs', 'fifo', 'lifo'
]);

const tokenizer = new WordTokenizer();

export function cleanText(text: string): string {
    // 1. Lowercase
    let clean = text.toLowerCase();

    // 2. Preserve Technical Terms (basic handling)
    // We could replace them with tokens, but for now just ensuring they don't get messed up
    // by simple regex replacers. 

    // 3. Remove non-alphanumeric (but keep some chars if needed)
    clean = clean.replace(/[^a-z0-9\s]/g, ' ');

    // 4. Normalize whitespace
    return clean.replace(/\s+/g, ' ').trim();
}

/**
 * Returns a list of stemmed tokens for analysis
 */
export function getTokens(text: string): string[] {
    const cleaned = cleanText(text);
    const tokens = tokenizer.tokenize(cleaned);

    return tokens
        .filter(t => !STOPWORDS.has(t) && t.length > 2)
        .map(t => {
            if (TECHNICAL_TERMS.has(t)) return t;
            return PorterStemmer.stem(t);
        });
}

