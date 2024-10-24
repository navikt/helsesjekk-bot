'use client'

import React, { ReactElement, useState } from 'react'
import { Button, Checkbox } from '@navikt/ds-react'
import { useParams } from 'next/navigation'
import * as R from 'remeda'
import { Heading, Select, TextField } from '@navikt/ds-react'
import { PlusIcon, XMarkIcon } from '@navikt/aksel-icons'

import { questionTypeToText } from '../../utils/asked'
import { QuestionType } from '../../safe-types'

import { addQuestion } from './actions'

type Props = {
    teamId: string
}

function AddQuestion({ teamId }: Props): ReactElement {
    const params = useParams<{ groupId: string }>()
    const [adding, setAdding] = useState(false)
    const [saving, setSaving] = useState(false)

    return (
        <section aria-labelledby="question-main-header">
            <Heading id="question-main-header" size="medium" level="2" className="hidden">
                Legg til nytt spørsmål
            </Heading>
            {!adding ? (
                <>
                    <Button icon={<PlusIcon aria-hidden />} onClick={() => setAdding(true)}>
                        Nytt spørsmål
                    </Button>
                </>
            ) : (
                <>
                    <form
                        onSubmit={() => {
                            setSaving(true)
                        }}
                        action={async (data) => {
                            try {
                                await addQuestion(params.groupId, teamId, data)
                                setSaving(false)
                                setAdding(false)
                            } catch (e) {
                                setSaving(false)
                                console.error(new Error('Unable to add question', { cause: e }))
                            }
                        }}
                        className="flex flex-col gap-3 bg-bg-subtle p-4 rounded relative"
                    >
                        <Heading size="small" level="3" spacing className="flex items-center gap-2">
                            <PlusIcon aria-hidden />
                            Nytt spørsmål
                        </Heading>
                        <div className="flex justify-between items-end">
                            <Select
                                label="Kategori"
                                name="type"
                                className="max-w-xs grow"
                                disabled={saving}
                                defaultValue={QuestionType.TEAM_HEALTH}
                            >
                                {R.map(R.keys(QuestionType), (it) => (
                                    <option key={it} value={it}>
                                        {questionTypeToText(it as QuestionType)}
                                    </option>
                                ))}
                            </Select>
                            <Checkbox name="required" defaultChecked value="required" className="ml-4">
                                Påkrevd
                            </Checkbox>
                        </div>
                        <TextField
                            name="question"
                            className="grow"
                            label="Spørsmål"
                            placeholder="Hvordan ..."
                            autoFocus
                            required
                            type="text"
                            minLength={5}
                            disabled={saving}
                        />
                        <TextField
                            name="high"
                            className="grow"
                            placeholder="Det er helt tipp topp"
                            label={
                                <div>
                                    <span className="text-sm pr-2">🟢</span>
                                    <span className="mb-0.5">Bra svar</span>
                                </div>
                            }
                            required
                            type="text"
                            minLength={3}
                            disabled={saving}
                        />
                        <TextField
                            name="mid"
                            className="grow"
                            placeholder="Det er ikke spesielt bra"
                            label={
                                <div>
                                    <span className="text-sm pr-2">🟡</span>
                                    <span className="mb-2">Middels svar</span>
                                </div>
                            }
                            required
                            type="text"
                            minLength={3}
                            disabled={saving}
                        />
                        <TextField
                            name="low"
                            className="grow"
                            placeholder="Det er helt forferdelig"
                            label={
                                <div>
                                    <span className="text-sm pr-2">🔴</span>
                                    <span className="mb-0.5">Dårlig svar</span>
                                </div>
                            }
                            required
                            type="text"
                            minLength={3}
                            disabled={saving}
                        />

                        <div className="flex gap-3 mt-4">
                            <Button type="submit" variant="secondary-neutral" loading={saving}>
                                Lagre
                            </Button>
                            <Button
                                type="button"
                                variant="tertiary-neutral"
                                disabled={saving}
                                onClick={() => setAdding(false)}
                            >
                                Avbryt
                            </Button>
                        </div>
                        <Button
                            className="absolute top-2 right-2"
                            icon={<XMarkIcon />}
                            title="Lukk redigering"
                            onClick={() => setAdding(false)}
                            size="xsmall"
                            variant="tertiary-neutral"
                            disabled={saving}
                        />
                    </form>
                </>
            )}
        </section>
    )
}

export default AddQuestion
