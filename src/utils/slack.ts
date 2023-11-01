export function createPermalink(channelId: string, ts: string): string {
    return `https://nav-it.slack.com/archives/${channelId}/p${ts.replace('.', '')}`
}
