export function scoreToEmoji(score: number): string {
    if (score < 2.6) {
        return '🔴'
    } else if (score < 4) {
        return '🟡'
    } else {
        return '🟢'
    }
}
