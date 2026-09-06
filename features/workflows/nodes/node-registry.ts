import type { Node } from "@xyflow/react"
import {
  Bot,
  Eye,
  Globe,
  MousePointerClick,
  Pointer,
  ScanText,
  type LucideIcon,
} from "lucide-react"

export type StepNodeKind = "trigger" | "action"

// One editable field on a node, rendered in the inspector.
export type NodeField = {
  key: string
  label: string
  placeholder?: string
  multiline?: boolean
  required?: boolean
}

export type NodeOutputs = {
  key: string
  label: string
}

// A node type's manifest entry. Add a node by adding an entry to nodeRegistry.
export type NodeDefinition = {
  type: string
  kind: StepNodeKind
  label: string
  icon: LucideIcon
  accent: string // Tailwind classes for the icon chip color
  fields: NodeField[]
  outputs: NodeOutputs[]
}

export const nodeRegistry = {
  start: {
    type: "start",
    kind: "trigger",
    label: "Start",
    icon: MousePointerClick,
    accent: "bg-blue-500 text-white",
    fields: [],
    outputs: [],
  },
  "open-url": {
    type: "open-url",
    kind: "action",
    label: "Open URL",
    icon: Globe,
    accent: "bg-emerald-500 text-white",
    fields: [
      { key: "url", label: "URL", placeholder: "https://youtube.com", required: true },
      { key: "description", label: "Description", placeholder: "Optional", multiline: true },
    ],
    outputs: [
      { key: "url", label: "URL" },
      { key: "title", label: "Title" },
    ],
  },
  act: {
    type: "act",
    kind: "action",
    label: "Act",
    icon: Pointer,
    accent: "bg-violet-500 text-white",
    fields: [
      {
        key: "instruction",
        label: "Instruction",
        placeholder: "Click the sign in button",
        multiline: true,
        required: true,
      },
    ],
    outputs: [
      { key: "success", label: "Success" },
      { key: "message", label: "Message" },
      { key: "url", label: "URL" },
    ],
  },
  extract: {
    type: "extract",
    kind: "action",
    label: "Extract",
    icon: ScanText,
    accent: "bg-amber-500 text-white",
    fields: [
      {
        key: "instruction",
        label: "Instruction",
        placeholder: "The price of the first product",
        multiline: true,
        required: true,
      },
    ],
    outputs: [{ key: "extraction", label: "Extracted data" }],
  },
  observe: {
    type: "observe",
    kind: "action",
    label: "Observe",
    icon: Eye,
    accent: "bg-rose-500 text-white",
    fields: [
      {
        key: "instruction",
        label: "Instruction",
        placeholder: "The sign in button",
        multiline: true,
        required: true,
      },
    ],
    // Observe returns a list, so alongside the whole array the registry offers
    // paths into the first match — the common case for feeding a later node.
    outputs: [
      { key: "matches", label: "Matches" },
      { key: "matches[0].selector", label: "First match · Selector" },
      { key: "matches[0].description", label: "First match · Description" },
    ],
  },
  agent: {
    type: "agent",
    kind: "action",
    label: "Agent",
    icon: Bot,
    accent: "bg-slate-800 text-white",
    fields: [
      {
        key: "instruction",
        label: "Instruction",
        placeholder: "Search for wireless headphones and open the top result",
        multiline: true,
        required: true,
      },
    ],
    outputs: [
      { key: "success", label: "Success" },
      { key: "message", label: "Message" },
      { key: "completed", label: "Completed" },
    ],
  },
} satisfies Record<string, NodeDefinition>

export type NodeType = keyof typeof nodeRegistry

// Plain JSON only (synced through Liveblocks later). type keys into the registry;
// kind and title are denormalized so the server can read them without the registry.
export type StepNodeData = {
  type: NodeType
  kind: StepNodeKind
  title: string
  values: Record<string, string>
}

export type StepNodeType = Node<StepNodeData, "step">

export type ActionNodeType = {
  [K in NodeType]: (typeof nodeRegistry)[K]["kind"] extends "action" ? K : never
}[NodeType]
