export function createPermalink(channelId: string, ts: string): string {
    return `${createChannelPermalink(channelId)}/p${ts.replace('.', '')}`
}

export function createChannelPermalink(channelId: string): string {
    return `https://nav-it.slack.com/archives/${channelId}`
}
