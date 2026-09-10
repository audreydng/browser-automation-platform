"use client"

import { useState, useTransition } from "react"
import { Lock, MoreHorizontal, Play, Square, Trash2 } from "lucide-react"
import { unstable_rethrow } from "next/navigation"
import { useReactFlow, useStore } from "@xyflow/react"
import * as Sentry from "@sentry/nextjs"
import { toast } from "sonner"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResizablePanel } from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { errorAttributes } from "@/lib/sentry"
import { cn } from "@/lib/utils"

import {
  cancelWorkflowRunAction,
  deleteWorkflowAction,
  runWorkflowAction,
} from "@/features/workflows/actions"
import { NodeIcon } from "@/features/workflows/components/node-icon"
import { useWorkflowRunsWithSteps } from "@/features/workflows/components/workflow-runs-provider"
import { useProPlan } from "@/features/workflows/hooks/use-pro-plan"
import { useUpstreamConnections } from "@/features/workflows/hooks/use-upstream-connections"
import { validateGraph } from "@/features/workflows/lib/validate-graph"

import {
  nodeRegistry,
  type NodeDefinition,
  type NodeField,
  type NodeType,
  type StepNodeKind,
  type StepNodeType,
} from "@/features/workflows/nodes/node-registry"

// This file builds up to the RightSidebar component exported at the bottom: a
// header with workflow actions (delete, run), then two tabs — a Toolbar for
// adding nodes and an Editor for tweaking the selected node. Each helper below is
// defined just above the block that uses it.

// ---------------------------------------------------------------------------
// Shared pieces — used by both the Toolbar and the Editor.
// ---------------------------------------------------------------------------

// A titled, scrollable panel. Each tab renders its content inside one.
function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-y border-border bg-card px-3 py-1.5 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Editor tab — edits the fields of the selected node.
// ---------------------------------------------------------------------------

// A single editor field for a node property.
function Field({
  field,
  value,
  onChange,
  onFocus,
}: {
  field: NodeField
  value: string
  onChange: (value: string) => void
  onFocus: () => void
}) {
  const Control = field.multiline ? Textarea : Input

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={field.key} className="text-xs">
        {field.label}
        {field.required && <span className="text-destructive"> *</span>}
      </Label>
      <Control
        id={field.key}
        value={value}
        placeholder={field.placeholder}
        required={field.required}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
      />
    </div>
  )
}

// The Editor tab: one input per field on the selected node, or an empty state.
function Inspector({ node }: { node: StepNodeType | undefined }) {
  const { updateNodeData } = useReactFlow<StepNodeType>()
  const connections = useUpstreamConnections(node)
  const [lastEditedField, setLastEditedField] = useState<{
    nodeId: string
    fieldKey: string
  }>()

  if (!node) {
    return (
      <Section title="Editor">
        <p className="p-3 text-sm text-muted-foreground">No node selected</p>
      </Section>
    )
  }

  const { type, title, values } = node.data
  const def: NodeDefinition = nodeRegistry[type]

  const insertConnection = (connectionValue: string) => {
    const fieldKey =
      lastEditedField?.nodeId === node.id &&
      def.fields.some((field) => field.key === lastEditedField.fieldKey)
        ? lastEditedField.fieldKey
        : def.fields[0]?.key

    if (!fieldKey) return

    updateNodeData(node.id, {
      values: {
        ...values,
        [fieldKey]: `${values[fieldKey] ?? ""}${connectionValue}`,
      },
    })
  }

  return (
    <Section title={title} icon={<NodeIcon type={type} />}>
      <div className="flex flex-col gap-3 p-3">
        {def.fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">No properties</p>
        ) : (
          def.fields.map((field) => (
            <Field
              key={field.key}
              field={field}
              value={values[field.key] ?? ""}
              onFocus={() => {
                setLastEditedField({ nodeId: node.id, fieldKey: field.key })
              }}
              onChange={(value) => {
                updateNodeData(node.id, {
                  values: { ...values, [field.key]: value },
                })
              }}
            />
          ))
        )}
      </div>
      {/* Connection chips insert upstream values into the last-focused field. */}
      {connections.length > 0 && (
        <div className="border-t border-border p-3">
          <p className="mb-2 text-xs font-medium">Connections</p>
          <div className="flex flex-wrap gap-1.5">
            {connections.map((connection) => (
              <Button
                key={`${connection.label}:${connection.value}`}
                type="button"
                variant="outline"
                size="xs"
                className="rounded-full pl-1"
                disabled={def.fields.length === 0}
                title={`Insert ${connection.value}`}
                onClick={() => insertConnection(connection.value)}
              >
                <NodeIcon
                  type={connection.type}
                  className="size-4 rounded-full"
                />
                {connection.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Toolbar tab — adds nodes to the canvas, grouped by kind.
// ---------------------------------------------------------------------------

// The Toolbar's groups, one accordion section per node kind.
const sections: { kind: StepNodeKind; label: string }[] = [
  { kind: "trigger", label: "Triggers" },
  { kind: "action", label: "Actions" },
]

// Every node type from the registry, filtered into the groups below. Typed as
// NodeDefinition rather than the registry's literal types, so optional fields
// like `premium` are readable on every entry, not just the ones that set them.
const definitions: NodeDefinition[] = Object.values(nodeRegistry)

// The Toolbar tab: a button per node type that adds it to the canvas. Premium
// node types are locked for orgs that are not on pro, and clicking one sends
// them to upgrade instead of adding it.
function Palette() {
  const { getNodes, screenToFlowPosition, setNodes } =
    useReactFlow<StepNodeType>()
  const flowElement = useStore((state) => state.domNode)
  const { isPro, isLoaded, upgrade } = useProPlan()

  const add = (type: NodeType) => {
    const def: NodeDefinition = nodeRegistry[type]
    const nodes = getNodes()

    if (def.premium && !isPro) {
      // Still resolving the session: do nothing rather than guess. Adding the
      // node would leak it to a free org, and redirecting would bounce a paying
      // one off to a pricing page it does not need.
      if (isLoaded) {
        toast.error(`${def.label} is a pro node. Upgrade to use it.`)
        upgrade()
      }
      return
    }

    if (def.kind === "trigger" && nodes.some((node) => node.data.kind === "trigger")) {
      toast.error("A workflow can only have one trigger node.")
      return
    }

    if (!flowElement) {
      return
    }

    const bounds = flowElement.getBoundingClientRect()
    const position = screenToFlowPosition({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    })
    const nodesOfType = nodes.filter((node) => node.data.type === type)
    const numberedTitles = new Map(
      nodesOfType.map((node, index) => [node.id, `${def.label} ${index + 1}`])
    )
    const title =
      nodesOfType.length === 0
        ? def.label
        : `${def.label} ${nodesOfType.length + 1}`
    const values = Object.fromEntries(
      def.fields.map((field) => [field.key, ""])
    )

    const node: StepNodeType = {
      id: crypto.randomUUID(),
      type: "step",
      position,
      origin: [0.5, 0.5],
      data: {
        type,
        kind: def.kind,
        title,
        values,
      },
    }

    setNodes((currentNodes) => [
      ...currentNodes.map((currentNode) => {
        const title = numberedTitles.get(currentNode.id)

        return title
          ? { ...currentNode, data: { ...currentNode.data, title } }
          : currentNode
      }),
      node,
    ])
  }

  return (
    <Section title="Toolbar">
      <Accordion
        type="multiple"
        defaultValue={sections.map((s) => s.kind)}
        className="px-3 py-2"
      >
        {sections.map((section) => (
          <AccordionItem
            key={section.kind}
            value={section.kind}
            className="not-last:border-b-0"
          >
            <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:no-underline">
              {section.label}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-0.5">
              {definitions
                .filter((def) => def.kind === section.kind)
                .map((def) => {
                  // Show the lock only once we know the org is not on pro, so a
                  // pro org never sees one flash while the session loads.
                  const locked = Boolean(def.premium) && isLoaded && !isPro

                  return (
                    <Button
                      key={def.type}
                      variant="ghost"
                      onClick={() => add(def.type as NodeType)}
                      title={
                        locked
                          ? `${def.label} is available on the pro plan`
                          : undefined
                      }
                      className={cn(
                        "justify-start gap-2.5 px-1.5 text-xs",
                        locked && "text-muted-foreground"
                      )}
                    >
                      <NodeIcon
                        type={def.type as NodeType}
                        className={cn(locked && "opacity-40")}
                      />
                      {def.label}
                      {locked && (
                        <Lock className="ml-auto size-3 text-muted-foreground" />
                      )}
                    </Button>
                  )
                })}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Header — workflow-level actions shown above the tabs.
// ---------------------------------------------------------------------------

// The "..." menu for workflow-level actions.
function ActionsMenu({ workflowId }: { workflowId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteWorkflowAction(workflowId)
      } catch (error) {
        unstable_rethrow(error)
        Sentry.logger.error("Workflow delete failed", {
          ...errorAttributes(error),
          "workflow.id": workflowId,
        })
        toast.error("Could not delete workflow.")
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          className="text-xs [&_svg:not([class*='size-'])]:size-3.5"
          onSelect={(event) => {
            event.preventDefault()
            handleDelete()
          }}
        >
          <Trash2 />
          Delete workflow
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Kicks off a run of the current workflow, or stops the one in flight. At most
// one run is live at a time, so the button toggles on that run.
function RunButton({ workflowId }: { workflowId: string }) {
  const { getNodes, getEdges } = useReactFlow<StepNodeType>()
  const runs = useWorkflowRunsWithSteps()
  const [isPending, startTransition] = useTransition()
  // The run this client just triggered, held until the realtime subscription
  // reports it. Without it the button flips back to Run in the gap between the
  // action returning and the run showing up, inviting a second run.
  const [startedRunId, setStartedRunId] = useState<string>()
  // The run a stop was sent for, so the button stays disabled until the
  // subscription reports it cancelled.
  const [stoppingRunId, setStoppingRunId] = useState<string>()

  const liveRunId =
    runs.find((run) => run.isLive)?.id ??
    (startedRunId && !runs.some((run) => run.id === startedRunId)
      ? startedRunId
      : undefined)
  const isStopping = liveRunId !== undefined && liveRunId === stoppingRunId

  function run() {
    const graph = { nodes: getNodes(), edges: getEdges() }
    const problems = validateGraph(graph)
    if (problems.length > 0) {
      toast.error("Cannot run workflow: " + problems.join(", "))
      return
    }

    startTransition(async () => {
      try {
        const handle = await runWorkflowAction({ id: workflowId, graph })
        setStartedRunId(handle.id)
        toast.success("Workflow run started.")
      } catch (error) {
        unstable_rethrow(error)
        Sentry.logger.error("Workflow run failed to start", {
          ...errorAttributes(error),
          "workflow.id": workflowId,
        })
        toast.error("Could not start workflow run.")
      }
    })
  }

  function stop(runId: string) {
    setStoppingRunId(runId)
    startTransition(async () => {
      try {
        await cancelWorkflowRunAction(runId)
        // Stop waiting on the subscription for a run we triggered; if it does
        // report the run, its own status takes over.
        setStartedRunId(undefined)
        toast.success("Workflow run stopped.")
      } catch (error) {
        unstable_rethrow(error)
        setStoppingRunId(undefined)
        Sentry.logger.error("Workflow run failed to stop", {
          ...errorAttributes(error),
          "workflow.id": workflowId,
          "workflow.run_id": runId,
        })
        toast.error("Could not stop workflow run.")
      }
    })
  }

  if (liveRunId) {
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled={isPending || isStopping}
        onClick={() => stop(liveRunId)}
      >
        <Square fill="currentColor" />
        {isStopping ? "Stopping" : "Stop"}
      </Button>
    )
  }

  return (
    <Button size="sm" variant="secondary" disabled={isPending} onClick={run}>
      <Play fill="primary" />
      Run
    </Button>
  )
}

// ---------------------------------------------------------------------------
// The sidebar itself — header on top, then the Toolbar / Editor tabs.
// ---------------------------------------------------------------------------

export function RightSidebar({ workflowId }: { workflowId: string }) {
  const [tab, setTab] = useState("toolbar")

  // TODO: read the currently selected node from React Flow.
  const selected = useStore((state) => state.nodes.find((node) => node.selected)) as StepNodeType | undefined
  // TODO: auto-switch to the Editor tab when the selection changes.
  const [prevSelectedId, setPrevSelectedId] = useState(selected?.id)
  if (selected && selected.id !== prevSelectedId) {
    setTab("editor")
    setPrevSelectedId(selected.id)
  }
  return (
    <ResizablePanel
      className="bg-background"
      defaultSize="16rem"
      minSize="14rem"
      maxSize="36rem"
      groupResizeBehavior="preserve-pixel-size"
    >
      <Tabs value={tab} onValueChange={setTab} className="size-full gap-0">
        <div className="flex items-center justify-between border-b border-border p-2">
          <ActionsMenu workflowId={workflowId} />
          <RunButton workflowId={workflowId} />
        </div>
        <TabsList className="m-2 w-fit bg-background">
          <TabsTrigger
            value="toolbar"
            className="flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            Toolbar
          </TabsTrigger>
          <TabsTrigger
            value="editor"
            className="flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            Editor
          </TabsTrigger>
        </TabsList>
        <TabsContent value="toolbar" className="flex min-h-0 flex-col">
          <Palette />
        </TabsContent>
        <TabsContent value="editor" className="flex min-h-0 flex-col">
          <Inspector node={selected} />
        </TabsContent>
      </Tabs>
    </ResizablePanel>
  )
}
