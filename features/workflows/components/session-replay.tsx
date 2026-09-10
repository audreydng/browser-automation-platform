"use client"

import { useEffect, useRef, useState } from "react"
import Hls from "hls.js"
import * as Sentry from "@sentry/nextjs"

import { Spinner } from "@/components/ui/spinner"
import { errorAttributes } from "@/lib/sentry"
import { cn } from "@/lib/utils"

// Browserbase finishes writing a recording some time after its session closes,
// so the route answers 202 until it lands. Poll gently, and give up eventually —
// a session that was never recorded 404s forever, and the route can't tell that
// apart from one still processing.
const POLL_INTERVAL_MS = 3_000
const POLL_TIMEOUT_MS = 2 * 60_000

type ReplayState = "waiting" | "ready" | "unavailable" | "error"

// How this browser can play an HLS stream: Safari does it natively, everyone
// else needs MediaSource for hls.js to feed. Probed once, and only on the
// client — neither API exists during the server render.
function detectPlayback(): "native" | "hls" | "none" | "unknown" {
  if (typeof document === "undefined") return "unknown"

  const probe = document.createElement("video")
  if (probe.canPlayType("application/vnd.apple.mpegurl")) return "native"

  return Hls.isSupported() ? "hls" : "none"
}

// Plays back what the browser did during a run, given the session it drove.
export function SessionReplay({
  sessionId,
  className,
}: {
  sessionId: string
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playback] = useState(detectPlayback)
  const [state, setState] = useState<ReplayState>("waiting")
  const [message, setMessage] = useState<string>()

  const src = `/api/replays/${encodeURIComponent(sessionId)}`

  // Point at a different session and the old one's state has to go, before it
  // renders one session's error over another's video.
  const [polledSrc, setPolledSrc] = useState(src)
  if (src !== polledSrc) {
    setPolledSrc(src)
    setState("waiting")
    setMessage(undefined)
  }

  // Wait for the recording to exist before handing it to a player — pointing
  // hls.js at a 202 would just make it retry on its own terms and report the
  // wait as a playback failure.
  useEffect(() => {
    const controller = new AbortController()
    const deadline = Date.now() + POLL_TIMEOUT_MS
    let timer: ReturnType<typeof setTimeout> | undefined

    const poll = async () => {
      try {
        const response = await fetch(src, {
          signal: controller.signal,
          cache: "no-store",
        })

        if (response.ok) {
          setState("ready")
          return
        }

        if (response.status === 202) {
          if (Date.now() >= deadline) {
            // Either never recorded or Browserbase is slower than our deadline —
            // the rate of these says which, and whether the deadline is right.
            Sentry.logger.warn("Session replay unavailable after waiting", {
              "browserbase.session_id": sessionId,
              "replay.wait_ms": POLL_TIMEOUT_MS,
            })
            setState("unavailable")
            return
          }

          timer = setTimeout(poll, POLL_INTERVAL_MS)
          return
        }

        Sentry.logger.error("Session replay request failed", {
          "browserbase.session_id": sessionId,
          "http.response.status_code": response.status,
        })
        setState("error")
        setMessage(`The replay request failed (${response.status}).`)
      } catch (error) {
        // An abort is this effect being cleaned up, not a failure worth showing.
        if (controller.signal.aborted) return

        Sentry.logger.error("Session replay request failed", {
          ...errorAttributes(error),
          "browserbase.session_id": sessionId,
        })
        setState("error")
        setMessage(error instanceof Error ? error.message : String(error))
      }
    }

    poll()

    return () => {
      controller.abort()
      if (timer) clearTimeout(timer)
    }
  }, [src, sessionId])

  // Attach the playlist once it is there. hls.js re-fetches the same URL, which
  // is cheap next to the segments and keeps the manifest out of React state.
  useEffect(() => {
    if (state !== "ready") return

    const video = videoRef.current
    if (!video) return

    if (playback === "native") {
      video.src = src
      return
    }

    // "none" renders a message instead of a player, so there is nothing to
    // attach to.
    if (playback !== "hls") return

    const hls = new Hls()
    hls.loadSource(src)
    hls.attachMedia(video)
    hls.on(Hls.Events.ERROR, (_event, data) => {
      // hls.js recovers from non-fatal errors by itself; only a fatal one ends
      // playback for good.
      if (!data.fatal) return

      Sentry.logger.error("Session replay playback failed", {
        "browserbase.session_id": sessionId,
        "hls.error_type": data.type,
        "hls.error_details": data.details,
      })
      setState("error")
      setMessage(data.details)
    })

    return () => hls.destroy()
  }, [state, src, playback, sessionId])

  if (state === "ready" && playback !== "none") {
    return (
      <video
        ref={videoRef}
        controls
        playsInline
        className={cn("size-full bg-black", className)}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 p-4 text-xs text-muted-foreground",
        className
      )}
    >
      {state === "waiting" && (
        <>
          <Spinner className="size-3.5" />
          Waiting for the recording…
        </>
      )}
      {state === "unavailable" && "No recording available for this session."}
      {state === "ready" && playback === "none" && (
        <span className="text-destructive">
          This browser can&apos;t play HLS video.
        </span>
      )}
      {state === "error" && (
        <span className="text-destructive">
          Could not load the replay. {message}
        </span>
      )}
    </div>
  )
}
