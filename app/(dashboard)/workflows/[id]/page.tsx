export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Workflow ID</p>
        <h1 className="text-2xl font-semibold">{id}</h1>
      </div>
    </main>
  )
}
