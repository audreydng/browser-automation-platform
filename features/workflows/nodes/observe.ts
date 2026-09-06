import type { Stagehand } from "@browserbasehq/stagehand"

export async function observe({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  const matches = await stagehand.observe(instruction)

  // Stagehand also hands back method/arguments for replaying a match through
  // act; the node surfaces only what identifies each element.
  return {
    matches: matches.map(({ selector, description }) => ({
      selector,
      description,
    })),
  }
}
