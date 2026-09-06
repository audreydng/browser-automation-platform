import type { Stagehand } from "@browserbasehq/stagehand"

export async function agent({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  // The v3 agent is AISDK tool-based, so it drives the run's existing model
  // rather than needing a separate computer-use one.
  const result = await stagehand.agent().execute(instruction)

  // `success` is the agent's own verdict on the task; `completed` says whether
  // it finished under its own steam instead of hitting the step limit.
  return {
    success: result.success,
    message: result.message,
    completed: result.completed,
  }
}
