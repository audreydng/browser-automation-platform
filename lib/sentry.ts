// Log attributes for a caught error. Only the type and digest: messages are
// unstable (and can carry user input), and a Server Action failure reaches the
// client with its message stripped in production anyway. The digest is the id
// Next.js also prints next to the error in the server logs.
export function errorAttributes(error: unknown): Record<string, string> {
  const attributes: Record<string, string> = {
    "error.type": error instanceof Error ? error.name : typeof error,
  }

  if (
    error instanceof Error &&
    "digest" in error &&
    typeof error.digest === "string"
  ) {
    attributes["error.digest"] = error.digest
  }

  return attributes
}
