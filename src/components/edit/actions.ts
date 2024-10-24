'use server'

import { revalidatePath } from 'next/cache'

import {
    setTeamName,
    setRevealTime,
    setAskTime,
    setTeamStatus,
    setTeamFrequency,
    addQuestionToTeam,
    deleteQuestionFromTeam,
    toggleQuestionRequiredInTeam,
} from '../../db'
import { userHasAdGroup } from '../../auth/authentication'
import { raise } from '../../utils/ts-utils'

export async function editTeamName(groupId: string, teamId: string, formData: FormData): Promise<void> {
    if (!(await userHasAdGroup(groupId))) {
        throw new Error('User does not have access to edit team name')
    }

    const name = formData.get('new_name')?.toString() ?? raise(new Error('Missing new_name in form data'))

    console.info(`User is editing team name, new name: ${name}`)

    await setTeamName(teamId, name)

    revalidatePath(`/team/${groupId}`)
}

export async function editTime(
    groupId: string,
    teamId: string,
    type: 'ask' | 'reveal',
    formData: FormData,
): Promise<void> {
    if (!(await userHasAdGroup(groupId))) {
        throw new Error('User does not have access to edit team name')
    }

    const hour = formData.get('hour')?.toString() ?? raise(new Error('Missing hour in form data'))
    const day = formData.get('day')?.toString() ?? raise(new Error('Missing day in form data'))

    console.info(`User is editing ${type}, new time: ${day} ${hour}`)

    if (type === 'ask') {
        await setAskTime(teamId, Number(hour), Number(day))
    } else {
        await setRevealTime(teamId, Number(hour), Number(day))
    }

    revalidatePath(`/team/${groupId}`)
}

export async function toggleTeamStatus(groupId: string, teamId: string, active: boolean): Promise<void> {
    if (!(await userHasAdGroup(groupId))) {
        throw new Error('User does not have access to edit team name')
    }

    console.info(`User is toggling team status for team ${teamId}, new status: ${active}`)

    await setTeamStatus(teamId, active)

    revalidatePath(`/team/${groupId}`)
}

export async function addQuestion(groupId: string, teamId: string, formData: FormData): Promise<void> {
    if (!(await userHasAdGroup(groupId))) {
        throw new Error('User does not have access to edit team name')
    }

    // TODO ZOD this
    const question = {
        question: formData.get('question')?.toString() ?? raise(new Error('Missing question in form data')),
        type: formData.get('type')?.toString() ?? raise(new Error('Missing type in form data')),
        high: formData.get('high')?.toString() ?? raise(new Error('Missing high in form data')),
        mid: formData.get('mid')?.toString() ?? raise(new Error('Missing mid in form data')),
        low: formData.get('low')?.toString() ?? raise(new Error('Missing low in form data')),
        required: formData.get('required') === 'required',
    }

    console.info(`User is adding question of type: ${question.type}`)

    await addQuestionToTeam(teamId, question)

    revalidatePath(`/team/${groupId}`)
}

export async function toggleQuestionRequired(
    groupId: string,
    teamId: string,
    questionId: string,
    required: boolean,
): Promise<void> {
    if (!(await userHasAdGroup(groupId))) {
        throw new Error('User does not have access to edit team name')
    }

    console.info(`User is toggling requiredness for question for team ${teamId} ${questionId}`)

    await toggleQuestionRequiredInTeam(teamId, questionId, required)

    revalidatePath(`/team/${groupId}`)
}

export async function deleteQuestion(groupId: string, teamId: string, questionId: string): Promise<void> {
    if (!(await userHasAdGroup(groupId))) {
        throw new Error('User does not have access to edit team name')
    }

    console.info(`User is deleting question for team ${teamId} ${questionId}`)

    await deleteQuestionFromTeam(teamId, questionId)

    revalidatePath(`/team/${groupId}`)
}

export async function editFrequency(
    groupId: string,
    teamId: string,
    frequency: number,
    weekSkew: number,
): Promise<void> {
    if (!(await userHasAdGroup(groupId))) {
        throw new Error('User does not have access to edit team name')
    }

    console.info(`User is editing frequency for team ${teamId}, new frequency: ${frequency}, skew: ${weekSkew}`)

    await setTeamFrequency(teamId, frequency, weekSkew)

    revalidatePath(`/team/${groupId}`)
}
