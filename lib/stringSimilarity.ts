/**
 * Calculates the Dice Coefficient between two strings.
 * Returns a value between 0 (no similarity) and 1 (exact match).
 * Good for finding similar questions.
 */
export function diceCoefficient(s1: string, s2: string): number {
    const cleanS1 = s1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanS2 = s2.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (cleanS1 === cleanS2) return 1;
    if (cleanS1.length < 2 || cleanS2.length < 2) return 0;

    const bigrams1 = new Map<string, number>();
    for (let i = 0; i < cleanS1.length - 1; i++) {
        const bigram = cleanS1.substring(i, i + 2);
        bigrams1.set(bigram, (bigrams1.get(bigram) || 0) + 1);
    }

    let intersection = 0;
    for (let i = 0; i < cleanS2.length - 1; i++) {
        const bigram = cleanS2.substring(i, i + 2);
        if (bigrams1.has(bigram) && bigrams1.get(bigram)! > 0) {
            intersection++;
            bigrams1.set(bigram, bigrams1.get(bigram)! - 1);
        }
    }

    return (2 * intersection) / (cleanS1.length - 1 + cleanS2.length - 1);
}
