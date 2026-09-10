// The pro gate's two constants, kept in a module with no "use client" or
// "server-only" directive so both sides of the gate can share them — the server
// action that enforces it and the client hook that reflects it. A slug that
// drifts between the two fails silently: has() just returns false.

// "pro" is an organization plan. The `org:` prefix scopes the check to the org
// side of the session's plan claim — the slug in Clerk is plain "pro", the
// prefix belongs to the check. Unscoped, it would also match a user plan of the
// same name if user billing is ever turned on.
export const PRO_PLAN = "org:pro"

// Where a non-pro org goes to subscribe.
export const PRICING_PATH = "/pricing"
