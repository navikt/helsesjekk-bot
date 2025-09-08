import { logger } from '@navikt/next-logger'

import { getTeamByAdGroupAndTeamId } from '../../../../../../../db'
import { userHasAdGroup } from '../../../../../../../auth/authentication'
import { getTeamsScoredAsks } from '../../../../../../../db/score'

export async function GET(
    _request: Request,
    ctx: RouteContext<'/team/[groupId]/[teamId]/results/export/json'>,
): Promise<Response> {
    const params = await ctx.params
    const team = await getTeamByAdGroupAndTeamId(params.groupId, params.teamId)
    if (!team) {
        logger.warn(`Someone tried exporting JSON for ${params.teamId}, but didn't have access. :sus:`)
        return new Response(null, { status: 404 })
    }

    if (!(await userHasAdGroup(team.assosiatedGroup))) {
        if (!team) {
            logger.warn(
                `Someone tried exporting JSON for ${params.teamId}, but wasn't in the AD group even, even :sus:-ier`,
            )
            return new Response(null, { status: 404 })
        }
    }

    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.set(
        'Content-Disposition',
        `attachment; filename="helsesjekk-export-${params.teamId}-${new Date().toISOString()}.json"`,
    )

    const scoredAsks = await getTeamsScoredAsks(params.teamId)

    return new Response(JSON.stringify(scoredAsks), { headers })
}
