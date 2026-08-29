import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <div className="flex size-full items-center justify-center gap-2 text-sm text-muted-foreground">
      <Spinner />
      <span>Loading workflow…</span>
    </div>
  )
}
