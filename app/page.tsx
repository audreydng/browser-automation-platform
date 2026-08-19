import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <UserButton />
      <OrganizationSwitcher />
    </div>
  )
}
