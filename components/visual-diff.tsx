"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, Edit } from "lucide-react"

interface VisualDiffProps {
  oldValue: any
  newValue: any
  title?: string
}

interface DiffItem {
  key: string
  type: 'added' | 'removed' | 'modified' | 'unchanged'
  oldValue?: any
  newValue?: any
  path: string[]
}

function deepCompare(oldObj: any, newObj: any, path: string[] = []): DiffItem[] {
  const diffs: DiffItem[] = []
  
  if (oldObj === null || oldObj === undefined) {
    if (newObj !== null && newObj !== undefined) {
      if (typeof newObj === 'object') {
        Object.keys(newObj).forEach(key => {
          diffs.push(...deepCompare(undefined, newObj[key], [...path, key]))
        })
      } else {
        diffs.push({
          key: path.join('.') || 'root',
          type: 'added',
          newValue: newObj,
          path
        })
      }
    }
    return diffs
  }
  
  if (newObj === null || newObj === undefined) {
    if (typeof oldObj === 'object') {
      Object.keys(oldObj).forEach(key => {
        diffs.push(...deepCompare(oldObj[key], undefined, [...path, key]))
      })
    } else {
      diffs.push({
        key: path.join('.') || 'root',
        type: 'removed',
        oldValue: oldObj,
        path
      })
    }
    return diffs
  }
  
  if (typeof oldObj !== 'object' || typeof newObj !== 'object') {
    if (oldObj !== newObj) {
      if (oldObj === undefined) {
        diffs.push({
          key: path.join('.') || 'root',
          type: 'added',
          newValue: newObj,
          path
        })
      } else if (newObj === undefined) {
        diffs.push({
          key: path.join('.') || 'root',
          type: 'removed',
          oldValue: oldObj,
          path
        })
      } else {
        diffs.push({
          key: path.join('.') || 'root',
          type: 'modified',
          oldValue: oldObj,
          newValue: newObj,
          path
        })
      }
    }
    return diffs
  }
  
  if (Array.isArray(oldObj) || Array.isArray(newObj)) {
    if (!Array.isArray(oldObj)) {
      diffs.push({
        key: path.join('.') || 'root',
        type: 'modified',
        oldValue: oldObj,
        newValue: newObj,
        path
      })
    } else if (!Array.isArray(newObj)) {
      diffs.push({
        key: path.join('.') || 'root',
        type: 'modified',
        oldValue: oldObj,
        newValue: newObj,
        path
      })
    } else {
      if (JSON.stringify(oldObj) !== JSON.stringify(newObj)) {
        diffs.push({
          key: path.join('.') || 'root',
          type: 'modified',
          oldValue: oldObj,
          newValue: newObj,
          path
        })
      }
    }
    return diffs
  }
  
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])
  
  allKeys.forEach(key => {
    const oldVal = oldObj[key]
    const newVal = newObj[key]
    
    if (!(key in oldObj)) {
      diffs.push(...deepCompare(undefined, newVal, [...path, key]))
    } else if (!(key in newObj)) {
      diffs.push(...deepCompare(oldVal, undefined, [...path, key]))
    } else {
      diffs.push(...deepCompare(oldVal, newVal, [...path, key]))
    }
  })
  
  return diffs
}

function formatValue(value: any): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

function DiffLine({ diff }: { diff: DiffItem }) {
  const getIcon = () => {
    switch (diff.type) {
      case 'added':
        return <Plus className="w-3 h-3" />
      case 'removed':
        return <Minus className="w-3 h-3" />
      case 'modified':
        return <Edit className="w-3 h-3" />
      default:
        return null
    }
  }
  
  const getStyles = () => {
    switch (diff.type) {
      case 'added':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'removed':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'modified':
        return 'bg-amber-50 border-amber-200 text-amber-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }
  
  return (
    <div className={`border rounded p-2 text-xs font-mono ${getStyles()}`}>
      <div className="flex items-center gap-2 mb-1">
        {getIcon()}
        <span className="font-semibold">{diff.key}</span>
        <Badge variant="outline" className="text-xs">
          {diff.type}
        </Badge>
      </div>
      
      {diff.type === 'added' && (
        <div className="ml-5">
          <span className="text-green-600">+ </span>
          <span>{formatValue(diff.newValue)}</span>
        </div>
      )}
      
      {diff.type === 'removed' && (
        <div className="ml-5">
          <span className="text-red-600">- </span>
          <span>{formatValue(diff.oldValue)}</span>
        </div>
      )}
      
      {diff.type === 'modified' && (
        <div className="ml-5 space-y-1">
          <div>
            <span className="text-red-600">- </span>
            <span>{formatValue(diff.oldValue)}</span>
          </div>
          <div>
            <span className="text-green-600">+ </span>
            <span>{formatValue(diff.newValue)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export function VisualDiff({ oldValue, newValue, title = "Changes" }: VisualDiffProps) {
  const diffs = deepCompare(oldValue, newValue)
  const changedDiffs = diffs.filter(diff => diff.type !== 'unchanged')
  
  if (changedDiffs.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-2 bg-gray-50 rounded border">
        No changes detected
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{title}:</div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {changedDiffs.map((diff, index) => (
          <DiffLine key={`${diff.key}-${index}`} diff={diff} />
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        {changedDiffs.length} change{changedDiffs.length !== 1 ? 's' : ''} detected
      </div>
    </div>
  )
}
