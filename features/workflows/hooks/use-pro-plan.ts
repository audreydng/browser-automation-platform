"use client"

import { useCallback } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

import { PRICING_PATH, PRO_PLAN } from "@/features/workflows/lib/pro-plan"

export { PRICING_PATH }

// Whether the active org is on pro, and how to send someone off to upgrade.
//
// Read `isLoaded` before acting on `isPro`: until Clerk resolves the session,
// `isPro` is false only because nothing is known yet. Gate what a click *does*
// on `isPro`, but gate what the UI *shows* on `isLoaded && !isPro` — otherwise
// paying orgs get a locked-looking UI flashed at them on every load.
export function useProPlan() {
  const { has, isLoaded, orgId } = useAuth()
  const router = useRouter()

  const upgrade = useCallback(() => {
    router.push(PRICING_PATH)
  }, [router])

  return {
    // The subscription belongs to the org, so with no active org there is no
    // subscription to find — check that before trusting the plan.
    isPro: isLoaded && !!orgId && (has?.({ plan: PRO_PLAN }) ?? false),
    isLoaded,
    upgrade,
    pricingPath: PRICING_PATH,
  }
}
