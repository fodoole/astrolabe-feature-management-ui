"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Columns2, FileText, GitCompare, LayoutGrid } from "lucide-react"
import { VisualChangeView } from "./proposed-changes-visual"
import type { GlobalAttribute } from "../types"

type ViewMode = "visual" | "diff" | "split" | "raw"

interface ProposedChangesDiffProps {
  oldValue: any
  newValue: any
  environment?: string
  action?: string
  attributes?: GlobalAttribute[]
}

interface DiffLine {
  type: "eq" | "add" | "del"
  text: string
  leftNo?: number
  rightNo?: number
}

function diffLines(a: string[], b: string[]): DiffLine[] {
  const n = a.length
  const m = b.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: "eq", text: a[i], leftNo: i + 1, rightNo: j + 1 })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "del", text: a[i], leftNo: i + 1 })
      i++
    } else {
      out.push({ type: "add", text: b[j], rightNo: j + 1 })
      j++
    }
  }
  while (i < n) {
    out.push({ type: "del", text: a[i], leftNo: i + 1 })
    i++
  }
  while (j < m) {
    out.push({ type: "add", text: b[j], rightNo: j + 1 })
    j++
  }
  return out
}

function getEnvList(oldValue: any, newValue: any, fallback?: string): string[] {
  const envs = new Set<string>()
  const collect = (v: any) => {
    if (!v) return
    if (Array.isArray(v?.environments)) {
      v.environments.forEach((e: any) => e?.environment && envs.add(e.environment))
    } else if (v?.environment) {
      envs.add(v.environment)
    }
  }
  collect(oldValue)
  collect(newValue)
  if (envs.size === 0 && fallback) envs.add(fallback)
  if (envs.size === 0) envs.add("config")
  return Array.from(envs)
}

function getEnvConfig(value: any, env: string): any {
  if (!value) return null
  if (Array.isArray(value?.environments)) {
    return value.environments.find((e: any) => e.environment === env) || null
  }
  if (!value?.environment || value.environment === env) return value
  return null
}

const ENV_BADGE_CLASS: Record<string, string> = {
  production: "bg-red-100 text-red-800 border-red-200",
  staging: "bg-yellow-100 text-yellow-800 border-yellow-200",
  development: "bg-blue-100 text-blue-800 border-blue-200",
}

function envBadgeClass(env: string) {
  return ENV_BADGE_CLASS[env] || "bg-gray-100 text-gray-800 border-gray-200"
}

interface EnvDiffStats {
  added: number
  removed: number
}

function computeDiff(oldVal: any, newVal: any) {
  const oldStr = oldVal ? JSON.stringify(oldVal, null, 2) : ""
  const newStr = newVal ? JSON.stringify(newVal, null, 2) : ""
  const lines = diffLines(oldStr.split("\n"), newStr.split("\n"))
  const stats: EnvDiffStats = {
    added: lines.filter((l) => l.type === "add").length,
    removed: lines.filter((l) => l.type === "del").length,
  }
  return { oldStr, newStr, lines, stats }
}

function UnifiedDiff({ lines }: { lines: DiffLine[] }) {
  if (lines.length === 0) {
    return <div className="text-sm text-muted-foreground p-3">No content.</div>
  }
  return (
    <div className="border rounded-md overflow-hidden bg-white">
      <pre className="text-xs font-mono overflow-x-auto max-h-[480px]">
        {lines.map((line, idx) => {
          const bg =
            line.type === "add"
              ? "bg-green-50"
              : line.type === "del"
                ? "bg-red-50"
                : "bg-white"
          const marker =
            line.type === "add" ? "+" : line.type === "del" ? "-" : " "
          const markerColor =
            line.type === "add"
              ? "text-green-700"
              : line.type === "del"
                ? "text-red-700"
                : "text-gray-400"
          return (
            <div key={idx} className={`flex ${bg}`}>
              <span className="select-none w-10 text-right pr-2 text-gray-400 border-r border-gray-100 shrink-0">
                {line.leftNo ?? ""}
              </span>
              <span className="select-none w-10 text-right pr-2 text-gray-400 border-r border-gray-100 shrink-0">
                {line.rightNo ?? ""}
              </span>
              <span className={`select-none w-5 text-center shrink-0 ${markerColor}`}>
                {marker}
              </span>
              <span className="whitespace-pre flex-1 pr-2">{line.text}</span>
            </div>
          )
        })}
      </pre>
    </div>
  )
}

function SplitDiff({ lines }: { lines: DiffLine[] }) {
  // Build aligned rows: when del+add appear consecutively, pair them; otherwise empty side.
  type Row = { left?: DiffLine; right?: DiffLine }
  const rows: Row[] = []
  let k = 0
  while (k < lines.length) {
    const line = lines[k]
    if (line.type === "eq") {
      rows.push({ left: line, right: line })
      k++
    } else if (line.type === "del") {
      // Group consecutive dels and following adds, then pair them in order
      const dels: DiffLine[] = []
      const adds: DiffLine[] = []
      while (k < lines.length && lines[k].type === "del") {
        dels.push(lines[k])
        k++
      }
      while (k < lines.length && lines[k].type === "add") {
        adds.push(lines[k])
        k++
      }
      const max = Math.max(dels.length, adds.length)
      for (let p = 0; p < max; p++) {
        rows.push({ left: dels[p], right: adds[p] })
      }
    } else {
      // unmatched leading add
      const adds: DiffLine[] = []
      while (k < lines.length && lines[k].type === "add") {
        adds.push(lines[k])
        k++
      }
      adds.forEach((a) => rows.push({ left: undefined, right: a }))
    }
  }

  const renderCell = (line: DiffLine | undefined, side: "left" | "right") => {
    if (!line) {
      return <div className="bg-gray-50 min-h-[18px]" />
    }
    const bg =
      line.type === "add"
        ? "bg-green-50"
        : line.type === "del"
          ? "bg-red-50"
          : "bg-white"
    const no = side === "left" ? line.leftNo : line.rightNo
    return (
      <div className={`flex ${bg}`}>
        <span className="select-none w-10 text-right pr-2 text-gray-400 border-r border-gray-100 shrink-0">
          {no ?? ""}
        </span>
        <span className="whitespace-pre flex-1 pl-2 pr-2">{line.text}</span>
      </div>
    )
  }

  return (
    <div className="border rounded-md overflow-hidden bg-white">
      <div className="grid grid-cols-2 text-xs font-mono max-h-[480px] overflow-auto">
        <div className="border-r border-gray-200">
          <div className="sticky top-0 bg-gray-100 px-2 py-1 text-[11px] font-sans text-gray-600 border-b border-gray-200 z-10">
            Before
          </div>
          {rows.map((r, idx) => (
            <div key={idx}>{renderCell(r.left, "left")}</div>
          ))}
        </div>
        <div>
          <div className="sticky top-0 bg-gray-100 px-2 py-1 text-[11px] font-sans text-gray-600 border-b border-gray-200 z-10">
            After
          </div>
          {rows.map((r, idx) => (
            <div key={idx}>{renderCell(r.right, "right")}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RawView({ oldStr, newStr }: { oldStr: string; newStr: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <div className="text-xs font-medium text-muted-foreground mb-1">Before</div>
        <pre className="text-xs font-mono bg-gray-50 border rounded-md p-2 overflow-x-auto max-h-[480px]">
          {oldStr || "(empty)"}
        </pre>
      </div>
      <div>
        <div className="text-xs font-medium text-muted-foreground mb-1">After</div>
        <pre className="text-xs font-mono bg-gray-50 border rounded-md p-2 overflow-x-auto max-h-[480px]">
          {newStr || "(empty)"}
        </pre>
      </div>
    </div>
  )
}

export function ProposedChangesDiff({
  oldValue,
  newValue,
  environment,
  action,
  attributes = [],
}: ProposedChangesDiffProps) {
  const [view, setView] = useState<ViewMode>("visual")

  const envs = useMemo(
    () => getEnvList(oldValue, newValue, environment),
    [oldValue, newValue, environment],
  )

  const envData = useMemo(() => {
    return envs.map((env) => {
      const oldEnv = getEnvConfig(oldValue, env)
      const newEnv = getEnvConfig(newValue, env)
      return { env, oldEnv, newEnv, ...computeDiff(oldEnv, newEnv) }
    })
  }, [envs, oldValue, newValue])

  const [activeEnv, setActiveEnv] = useState(envs[0])

  const viewButton = (mode: ViewMode, label: string, Icon: any) => (
    <Button
      key={mode}
      type="button"
      variant={view === mode ? "default" : "outline"}
      size="sm"
      className="h-8 gap-1.5"
      onClick={() => setView(mode)}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </Button>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">Proposed Changes</h4>
          {action && (
            <Badge variant="outline" className="text-xs">
              {action.replace(/_/g, " ")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {viewButton("visual", "Visual", LayoutGrid)}
          {viewButton("diff", "Diff", GitCompare)}
          {viewButton("split", "Side by side", Columns2)}
          {viewButton("raw", "Raw", FileText)}
        </div>
      </div>

      <Tabs value={activeEnv} onValueChange={setActiveEnv}>
        {envs.length > 1 && (
          <TabsList className="h-auto flex-wrap gap-1">
            {envData.map(({ env, stats }) => (
              <TabsTrigger key={env} value={env} className="gap-2">
                <span
                  className={`px-1.5 py-0.5 rounded border text-[10px] uppercase tracking-wide ${envBadgeClass(env)}`}
                >
                  {env}
                </span>
                {(stats.added > 0 || stats.removed > 0) && (
                  <span className="flex items-center gap-1 text-[11px]">
                    {stats.added > 0 && (
                      <span className="text-green-700">+{stats.added}</span>
                    )}
                    {stats.removed > 0 && (
                      <span className="text-red-700">-{stats.removed}</span>
                    )}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        {envData.map(({ env, oldEnv, newEnv, oldStr, newStr, lines, stats }) => (
          <TabsContent key={env} value={env} className="space-y-3">
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <Badge
                variant="outline"
                className={`text-[10px] uppercase ${envBadgeClass(env)}`}
              >
                {env}
              </Badge>
              {stats.added === 0 && stats.removed === 0 ? (
                <span className="text-muted-foreground">No differences</span>
              ) : (
                <>
                  <span className="text-green-700 font-medium">
                    +{stats.added} additions
                  </span>
                  <span className="text-red-700 font-medium">
                    -{stats.removed} deletions
                  </span>
                </>
              )}
            </div>

            {view === "visual" && (
              <VisualChangeView
                oldValue={oldEnv}
                newValue={newEnv}
                attributes={attributes}
                action={action}
              />
            )}
            {view === "diff" && <UnifiedDiff lines={lines} />}
            {view === "split" && <SplitDiff lines={lines} />}
            {view === "raw" && <RawView oldStr={oldStr} newStr={newStr} />}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
