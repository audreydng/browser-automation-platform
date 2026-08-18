"use client"

import { Button } from "@/components/ui/button"
import { SignInButton, SignUpButton, useUser, UserButton } from "@clerk/nextjs"
import { toast } from "sonner"

export default function Page() {
  const { isLoaded, isSignedIn } = useUser()

  return (
    <div className="flex min-h-svh flex-col p-6">
      <header className="flex items-center justify-between gap-4">
        <div className="text-sm font-medium">Browser Automation</div>
        <div className="flex items-center gap-2">
          {isLoaded && !isSignedIn ? (
            <>
              <SignInButton mode="modal">
                <Button variant="outline">Sign in</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>Sign up</Button>
              </SignUpButton>
            </>
          ) : null}
          {isLoaded && isSignedIn ? <UserButton /> : null}
        </div>
      </header>
      <main className="flex flex-1 items-center">
        <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
          <div>
            <h1 className="font-medium">Project ready!</h1>
            <p>You may now add components and start building.</p>
            <p>We&apos;ve already added the button component for you.</p>
            <Button className="mt-2" onClick={() => toast("Button clicked!")}>
              Button
            </Button>
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            (Press <kbd>d</kbd> to toggle dark mode)
          </div>
        </div>
      </main>
    </div>
  )
}
