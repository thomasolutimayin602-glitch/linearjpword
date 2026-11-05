import type { SessionProgress, SessionRecord } from '../types'

type ResumeSource = Pick<
  SessionRecord,
  'senseIds' | 'correct' | 'wrong' | 'completedSenses' | 'progress'
>

export interface ResumeCursor {
  queue: number[]
  current: number | null
  modePos: number
  passWrong: boolean
  feedback: SessionProgress['feedback']
  done: SessionProgress['done']
}

/** Restore the exact drill cursor, falling back to the remaining session senses. */
export function resolveSessionCursor(
  session: ResumeSource,
  isResumable: (senseId: number) => boolean,
): ResumeCursor {
  const saved = session.progress
  let queue = [...(saved?.queue ?? [])]
  let current = saved?.current ?? null
  let modePos = saved?.modePos ?? 0
  let passWrong = saved?.passWrong ?? false
  let feedback = saved?.feedback ? { ...saved.feedback } : null
  let done = saved?.done
    ? { ...saved.done }
    : {
        correct: session.correct,
        wrong: session.wrong,
        sensePasses: session.completedSenses ?? 0,
      }

  if (current === null || !isResumable(current)) {
    const pending = (session.senseIds ?? []).filter(isResumable)
    current = queue.find(isResumable) ?? pending[0] ?? null
    queue = queue.filter(id => id !== current && isResumable(id))
    if (!saved) queue = pending.filter(id => id !== current)
    modePos = 0
    passWrong = false
    feedback = null
    done = {
      correct: session.correct,
      wrong: session.wrong,
      sensePasses: session.completedSenses ?? 0,
    }
  } else {
    queue = queue.filter(id => id !== current && isResumable(id))
  }

  return { queue, current, modePos, passWrong, feedback, done }
}
