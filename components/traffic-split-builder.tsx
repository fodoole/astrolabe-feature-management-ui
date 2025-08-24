"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, AlertTriangle, Lock } from 'lucide-react'
import type { TrafficSplit, FlagDataType } from "../types"

interface TrafficSplitBuilderProps {
  splits: TrafficSplit[]
  onSplitsChange: (splits: TrafficSplit[]) => void
  flagDataType: FlagDataType
}

export function TrafficSplitBuilder({ splits, onSplitsChange, flagDataType }: TrafficSplitBuilderProps) {
  const [newSplit, setNewSplit] = useState({ percentage: 0, value: "", label: "" })

  const isBoolean = flagDataType === "boolean"
  const totalPercentage = splits.reduce((sum, split) => sum + split.percentage, 0)
  const remainingPercentage = 100 - totalPercentage

  // For boolean flags, automatically manage the second split
  useEffect(() => {
    if (isBoolean && splits.length === 1) {
      const firstSplit = splits[0]
      const complementValue = !firstSplit.value
      const complementPercentage = 100 - firstSplit.percentage
      
      if (complementPercentage > 0) {
        const complementSplit: TrafficSplit = {
          percentage: complementPercentage,
          value: complementValue,
          label: complementValue ? "True" : "False"
        }
        
        onSplitsChange([firstSplit, complementSplit])
      }
    }
  }, [splits, isBoolean, onSplitsChange])

  const addSplit = () => {
    if (isBoolean && splits.length >= 2) {
      return // Boolean flags can only have 2 splits
    }

    if (newSplit.percentage <= 0 || newSplit.percentage > remainingPercentage) {
      alert(`Percentage must be between 1 and ${remainingPercentage}`)
      return
    }

    if (!newSplit.value.trim()) {
      alert("Value is required")
      return
    }

    let parsedValue: any = newSplit.value
    try {
      if (flagDataType === "boolean") {
        parsedValue = newSplit.value === "true"
      } else if (flagDataType === "number") {
        parsedValue = Number.parseFloat(newSplit.value)
      } else if (flagDataType === "json") {
        parsedValue = JSON.parse(newSplit.value)
      }
    } catch (error) {
      alert("Invalid value format")
      return
    }

    const newTrafficSplit: TrafficSplit = {
      percentage: newSplit.percentage,
      value: parsedValue,
      label: newSplit.label || (isBoolean ? (parsedValue ? "True" : "False") : undefined)
    }

    onSplitsChange([...splits, newTrafficSplit])
    setNewSplit({ percentage: 0, value: "", label: "" })
  }

  const removeSplit = (index: number) => {
    if (isBoolean) {
      // For boolean flags, removing any split removes both
      onSplitsChange([])
    } else {
      const updatedSplits = splits.filter((_, i) => i !== index)
      onSplitsChange(updatedSplits)
    }
  }

  const updateSplit = (index: number, field: keyof TrafficSplit, value: any) => {
    if (isBoolean && field === "value") {
      // For boolean flags, don't allow editing the complement split value
      const isComplementSplit = index === 1
      if (isComplementSplit) return
    }

    const updatedSplits = [...splits]
    updatedSplits[index] = { ...updatedSplits[index], [field]: value }

    // For boolean flags, update the complement split automatically
    if (isBoolean && field === "percentage" && index === 0) {
      const complementPercentage = 100 - value
      if (updatedSplits[1]) {
        updatedSplits[1] = { ...updatedSplits[1], percentage: complementPercentage }
      }
    }

    onSplitsChange(updatedSplits)
  }

  const renderValueInput = (value: any, onChange: (value: string) => void, disabled = false) => {
    if (isBoolean) {
      return (
        <Select 
          value={String(value)} 
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger className="text-xs font-mono">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">true</SelectItem>
            <SelectItem value="false">false</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    return (
      <Input
        value={JSON.stringify(value)}
        onChange={(e) => {
          try {
            let parsedValue = e.target.value
            if (flagDataType === "number") {
              parsedValue = String(Number.parseFloat(e.target.value))
            } else if (flagDataType === "json") {
              parsedValue = JSON.stringify(JSON.parse(e.target.value))
            }
            onChange(parsedValue)
          } catch (error) {
            // Keep the raw value for now
          }
        }}
        className="text-xs font-mono"
        placeholder="Value"
        disabled={disabled}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Traffic Splits</Label>
        <div className="text-xs text-muted-foreground">
          {isBoolean ? "Boolean A/B Test" : `Total: ${totalPercentage}% | Remaining: ${remainingPercentage}%`}
        </div>
      </div>

      {isBoolean && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <div className="text-sm font-medium text-blue-900 mb-1">Boolean Traffic Split</div>
          <div className="text-xs text-blue-700">
            Boolean flags support exactly 2 splits: true and false. The second split is automatically calculated.
          </div>
        </div>
      )}

      {/* Existing Splits */}
      {splits.length > 0 && (
        <div className="space-y-3">
          {splits.map((split, index) => {
            const isComplementSplit = isBoolean && index === 1
            
            return (
              <div key={index} className="flex items-center gap-3 p-3 border rounded">
                <div className="w-16">
                  <Input
                    type="number"
                    value={split.percentage}
                    onChange={(e) => updateSplit(index, "percentage", parseInt(e.target.value) || 0)}
                    className="text-xs text-center"
                    min="1"
                    max="99"
                    disabled={isComplementSplit}
                  />
                </div>
                <div className="flex-1">
                  <Progress value={split.percentage} className="h-2" />
                </div>
                <div className="w-32">
                  {renderValueInput(
                    split.value,
                    (value) => {
                      let parsedValue: any = value
                      if (isBoolean) {
                        parsedValue = value === "true"
                      }
                      updateSplit(index, "value", parsedValue)
                    },
                    isComplementSplit
                  )}
                </div>
                <div className="w-24">
                  <Input
                    value={split.label || ""}
                    onChange={(e) => updateSplit(index, "label", e.target.value)}
                    className="text-xs"
                    placeholder="Label"
                    disabled={isComplementSplit}
                  />
                </div>
                <div className="w-8 flex justify-center">
                  {isComplementSplit ? (
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSplit(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add New Split */}
      {(!isBoolean || splits.length === 0) && remainingPercentage > 0 && (
        <div className="space-y-3 p-3 border-2 border-dashed rounded">
          <Label className="text-xs font-medium">
            {isBoolean ? "Add Boolean Split" : "Add Traffic Split"}
          </Label>
          <div className="flex items-center gap-2">
            <div className="w-20">
              <Input
                type="number"
                value={newSplit.percentage || ""}
                onChange={(e) => setNewSplit({ ...newSplit, percentage: parseInt(e.target.value) || 0 })}
                placeholder="%"
                className="text-xs text-center"
                min="1"
                max={isBoolean ? 99 : remainingPercentage}
              />
            </div>
            <div className="flex-1">
              {isBoolean ? (
                <Select 
                  value={newSplit.value} 
                  onValueChange={(value) => setNewSplit({ ...newSplit, value })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">true</SelectItem>
                    <SelectItem value="false">false</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={newSplit.value}
                  onChange={(e) => setNewSplit({ ...newSplit, value: e.target.value })}
                  placeholder={
                    flagDataType === "number" ? "123" :
                    flagDataType === "json" ? '{"key": "value"}' :
                    "string value"
                  }
                  className="text-xs"
                />
              )}
            </div>
            <div className="w-24">
              <Input
                value={newSplit.label}
                onChange={(e) => setNewSplit({ ...newSplit, label: e.target.value })}
                placeholder={isBoolean ? (newSplit.value === "true" ? "True" : "False") : "Label"}
                className="text-xs"
              />
            </div>
            <Button
              type="button"
              onClick={addSplit}
              size="sm"
              disabled={newSplit.percentage <= 0 || !newSplit.value.trim()}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          
          {isBoolean && newSplit.percentage > 0 && newSplit.value && (
            <div className="text-xs text-muted-foreground">
              Complement split: {100 - newSplit.percentage}% → {newSplit.value === "true" ? "false" : "true"}
            </div>
          )}
        </div>
      )}

      {/* Validation Warning */}
      {!isBoolean && totalPercentage !== 100 && splits.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <span className="text-yellow-800">
            Traffic splits should total 100%. Current total: {totalPercentage}%
          </span>
        </div>
      )}

      {splits.length === 0 && (
        <div className="text-xs text-muted-foreground text-center py-4">
          {isBoolean 
            ? "Add a boolean split to create an A/B test between true and false values."
            : "No traffic splits configured. Add splits to distribute traffic between different values."
          }
        </div>
      )}
    </div>
  )
}
