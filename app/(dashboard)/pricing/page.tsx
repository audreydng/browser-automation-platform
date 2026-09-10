import { PricingTable } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

// The plans are organization plans, so the subscriber is the active org rather
// than the person signed in. Without one there is nothing for
// <PricingTable for="organization" /> to bill, and it renders empty — so send
// them to pick an org first.
export default async function PricingPage() {
  const { orgId } = await auth()

  if (!orgId) {
    redirect("/choose-organizations")
  }

  // The dashboard shell clips its own overflow, so this page owns its scroll.
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Plans</h1>
        <p className="pt-1.5 text-sm text-muted-foreground">
          Subscriptions belong to your organization — everyone in it shares the
          same plan.
        </p>
        <div className="pt-8">
          {/* Renders the org plans from Clerk and opens Clerk's own checkout
              drawer on selection, so subscribing needs no code of ours. */}
          <PricingTable for="organization" highlightedPlan="pro" />
        </div>
      </div>
    </div>
  )
}
