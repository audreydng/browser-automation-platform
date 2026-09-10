"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"
import { TriangleAlertIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    // Next.js catches this before Sentry's global handlers can see it
    Sentry.captureException(error)
  }, [error])

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TriangleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>Unable to load workflow</EmptyTitle>
        <EmptyDescription>
          Something went wrong while loading this workflow.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button type="button" onClick={unstable_retry}>
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  )
}
