"use client"

import { Badge } from "@/components/ui/badge"
import { ArrowRight, Plus, Minus, Pencil, Power, ListChecks, Target } from "lucide-react"
import { RuleBuilder } from "./rule-builder"
import type { GlobalAttribute, Rule, TrafficSplit } from "../types"

interface VisualChangeViewProps {
  oldValue: any
  newValue: any
  attributes: GlobalAttribute[]
  action?: string
}

type SnapshotKind = "config" | "primitive" | "trafficSplits" | "empty"

interface NormalizedSnapshot {
  kind: SnapshotKind
  enabled?: boolean
  defaultValue?: any
  hasDefaultValue: boolean
  rules?: Rule[]
  trafficSplits?: TrafficSplit[]
  primitive?: any
}

function normalizeSnapshot(v: any): NormalizedSnapshot {
  if (v === null || v === undefined) return { kind: "empty", hasDefaultValue: false }
  if (Array.isArray(v)) return { kind: "trafficSplits", trafficSplits: v as TrafficSplit[], hasDefaultValue: false }
  if (typeof v === "object") {
    return {
      kind: "config",
      enabled: typeof v.enabled === "boolean" ? v.enabled : undefined,
      defaultValue: v.defaultValue,
      hasDefaultValue: Object.prototype.hasOwnProperty.call(v, "defaultValue"),
      rules: Array.isArray(v.rules) ? (v.rules as Rule[]) : undefined,
      trafficSplits: Array.isArray(v.trafficSplits) ? (v.trafficSplits as TrafficSplit[]) : undefined,
    }
  }
  return { kind: "primitive", primitive: v, hasDefaultValue: false }
}

function display(v: any): string {
  if (v === undefined) return "—"
  if (v === null) return "null"
  if (typeof v === "boolean") return v ? "true" : "false"
  if (typeof v === "object") return JSON.stringify(v)
  return String(v)
}

function ValueChip({ value, tone = "neutral" }: { value: any; tone?: "old" | "new" | "neutral" }) {
  const cls =
    tone === "old"
      ? "bg-red-50 text-red-700 border-red-200 line-through"
      : tone === "new"
        ? "bg-green-50 text-green-700 border-green-200"
        : "bg-gray-50 text-gray-700 border-gray-200"
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono max-w-full truncate ${cls}`}>
      {display(value)}
    </span>
  )
}

function StatusPill({ enabled, tone = "neutral" }: { enabled?: boolean; tone?: "old" | "new" | "neutral" }) {
  if (enabled === undefined) return <ValueChip value={undefined} tone={tone} />
  const on = enabled
  const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium"
  const color = on
    ? "bg-green-100 text-green-800 border-green-300"
    : "bg-gray-100 text-gray-600 border-gray-300"
  return (
    <span className={`${base} ${color}`}>
      <Power className="w-3 h-3" />
      {on ? "On" : "Off"}
    </span>
  )
}

function ChangeRow({
  label,
  changed,
  before,
  after,
}: {
  label: string
  changed: boolean
  before: React.ReactNode
  after: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 py-1.5 flex-wrap">
      <span className="w-28 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      {changed ? (
        <div className="flex items-center gap-2 flex-wrap">
          {before}
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {after}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {after}
          <span className="text-[11px] text-muted-foreground">unchanged</span>
        </div>
      )}
    </div>
  )
}

function SectionHeader({ icon: Icon, title, right }: { icon: any; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
        <Icon className="w-4 h-4 text-gray-500" />
        {title}
      </div>
      {right}
    </div>
  )
}

type RuleDiffStatus = "added" | "removed" | "modified" | "unchanged"

const RULE_STATUS_META: Record<
  RuleDiffStatus,
  { label: string; stripe: string; badge: string; icon: any }
> = {
  added: { label: "Added", stripe: "border-l-green-500", badge: "bg-green-100 text-green-800 border-green-200", icon: Plus },
  removed: { label: "Removed", stripe: "border-l-red-500", badge: "bg-red-100 text-red-800 border-red-200", icon: Minus },
  modified: { label: "Modified", stripe: "border-l-amber-500", badge: "bg-amber-100 text-amber-800 border-amber-200", icon: Pencil },
  unchanged: { label: "Unchanged", stripe: "border-l-gray-300", badge: "bg-gray-100 text-gray-600 border-gray-200", icon: ListChecks },
}

interface RuleDiffItem {
  status: RuleDiffStatus
  rule: Rule
  prev?: Rule
}

function diffRules(oldRules: Rule[] = [], newRules: Rule[] = []): RuleDiffItem[] {
  const oldById = new Map(oldRules.map((r) => [r.id, r]))
  const newById = new Map(newRules.map((r) => [r.id, r]))
  const items: RuleDiffItem[] = []

  newRules.forEach((rule) => {
    const prev = oldById.get(rule.id)
    if (!prev) {
      items.push({ status: "added", rule })
    } else {
      const changed = JSON.stringify(prev) !== JSON.stringify(rule)
      items.push({ status: changed ? "modified" : "unchanged", rule, prev })
    }
  })

  oldRules.forEach((rule) => {
    if (!newById.has(rule.id)) items.push({ status: "removed", rule })
  })

  return items
}

function RuleDiffCard({ item, attributes }: { item: RuleDiffItem; attributes: GlobalAttribute[] }) {
  const meta = RULE_STATUS_META[item.status]
  const Icon = meta.icon
  return (
    <div className={`border border-l-4 ${meta.stripe} rounded-md bg-white p-3 space-y-2`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm">{item.rule.name || "Untitled rule"}</span>
        <Badge variant="outline" className={`text-[10px] gap-1 ${meta.badge}`}>
          <Icon className="w-3 h-3" />
          {meta.label}
        </Badge>
      </div>

      <div className={item.status === "removed" ? "opacity-70" : ""}>
        <RuleBuilder rule={item.rule} attributes={attributes} readonly />
      </div>

      {item.status === "modified" && item.prev && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">
            Show previous version
          </summary>
          <div className="mt-2 border rounded-md bg-red-50/50 p-2 opacity-80">
            <RuleBuilder rule={item.prev} attributes={attributes} readonly />
          </div>
        </details>
      )}
    </div>
  )
}

export function VisualChangeView({ oldValue, newValue, attributes, action }: VisualChangeViewProps) {
  const oldN = normalizeSnapshot(oldValue)
  const newN = normalizeSnapshot(newValue)

  // --- Case 1: primitive-only change (e.g. enable_flag → newValue: true) ---
  const bothScalarish =
    (oldN.kind === "primitive" || oldN.kind === "empty") &&
    (newN.kind === "primitive" || newN.kind === "empty")

  if (bothScalarish && !(oldN.kind === "empty" && newN.kind === "empty")) {
    const before = oldN.primitive
    const after = newN.primitive
    const isBool = typeof after === "boolean" || typeof before === "boolean"
    return (
      <div className="rounded-lg border bg-white p-6 flex flex-col items-center gap-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {isBool ? "Flag status" : "New value"}
        </div>
        <div className="flex items-center gap-4">
          {oldN.kind !== "empty" &&
            (isBool ? <StatusPill enabled={Boolean(before)} tone="old" /> : <ValueChip value={before} tone="old" />)}
          {oldN.kind !== "empty" && <ArrowRight className="w-5 h-5 text-muted-foreground" />}
          {isBool ? <StatusPill enabled={Boolean(after)} tone="new" /> : <ValueChip value={after} tone="new" />}
        </div>
      </div>
    )
  }

  // NOTE: Traffic-split visualization is intentionally hidden for now — the
  // traffic-split feature isn't exposed in the UI yet. Such changes fall
  // through to the "no structured changes" state (reviewers use the Diff
  // view). Re-enable the traffic sections here once the feature ships.

  // --- Case 2: full config object diff ---
  const statusChanged = oldN.enabled !== newN.enabled && oldN.enabled !== undefined
  const showStatus = newN.enabled !== undefined || oldN.enabled !== undefined
  const defaultChanged =
    (oldN.hasDefaultValue || newN.hasDefaultValue) &&
    JSON.stringify(oldN.defaultValue) !== JSON.stringify(newN.defaultValue)
  const showDefault = oldN.hasDefaultValue || newN.hasDefaultValue

  const ruleItems = diffRules(oldN.rules, newN.rules)
  const ruleCounts = ruleItems.reduce(
    (acc, it) => {
      acc[it.status] += 1
      return acc
    },
    { added: 0, removed: 0, modified: 0, unchanged: 0 } as Record<RuleDiffStatus, number>,
  )
  const hasRules = ruleItems.length > 0

  if (!showStatus && !showDefault && !hasRules) {
    return (
      <div className="rounded-lg border bg-white p-6 text-sm text-muted-foreground text-center">
        No structured changes to visualize. Switch to the <span className="font-medium">Diff</span> view for raw details.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {(showStatus || showDefault) && (
        <div className="rounded-lg border bg-white p-4 space-y-1">
          <SectionHeader icon={Target} title="Configuration" />
          <div className="pt-1">
            {showStatus && (
              <ChangeRow
                label="Status"
                changed={statusChanged}
                before={<StatusPill enabled={oldN.enabled} tone="old" />}
                after={<StatusPill enabled={newN.enabled} tone="new" />}
              />
            )}
            {showDefault && (
              <ChangeRow
                label="Default value"
                changed={defaultChanged}
                before={<ValueChip value={oldN.defaultValue} tone="old" />}
                after={<ValueChip value={newN.defaultValue} tone="new" />}
              />
            )}
          </div>
        </div>
      )}

      {hasRules && (
        <div className="rounded-lg border bg-white p-4 space-y-3">
          <SectionHeader
            icon={ListChecks}
            title="Targeting rules"
            right={
              <div className="flex items-center gap-1.5 text-[11px]">
                {ruleCounts.added > 0 && <span className="text-green-700">+{ruleCounts.added} added</span>}
                {ruleCounts.modified > 0 && <span className="text-amber-700">~{ruleCounts.modified} modified</span>}
                {ruleCounts.removed > 0 && <span className="text-red-700">-{ruleCounts.removed} removed</span>}
              </div>
            }
          />
          <div className="space-y-2">
            {ruleItems.map((item, idx) => (
              <RuleDiffCard key={item.rule.id || idx} item={item} attributes={attributes} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
