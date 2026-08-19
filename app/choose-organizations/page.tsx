import { TaskChooseOrganization } from "@clerk/nextjs"

export default function ChooseOrganizationsPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <TaskChooseOrganization redirectUrlComplete="/" />
    </div>
  )
}
