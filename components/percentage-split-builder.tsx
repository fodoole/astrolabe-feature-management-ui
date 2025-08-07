"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, X, Percent } from 'lucide-react'
import type { PercentageSplit } from "../types"

interface PercentageSplitBuilderProps {
  splits: PercentageSplit[]
  onSplitsChange: (splits: PercentageSplit[]) => void
  flagDataType: string
}

export function PercentageSplitBuilder({ splits, onSplitsChange, flagDataType }: PercentageSplitBuilderProps) {
  const [newSplitPercentage, setNewSplitPercentage] = useState("")
  const [newSplitValue, setNewSplitValue] = useState("")
  const [newSplitLabel, setNewSplitLabel] = useState("")

  const totalPercentage = splits.reduce((sum, split) => sum + split.percentage, 0)
  const remainingPercentage = 100 - totalPercentage

  const addSplit = () => {
    const percentage = Number.parseFloat(newSplitPercentage)
    if (percentage > 0 && percentage <= remainingPercentage && newSplitValue.trim()) {
      let parsedValue: any = newSplitValue

      try {
        if (flagDataType === "boolean") {
          parsedValue = newSplitValue.toLowerCase() === "true"
        } else if (flagDataType === "number") {
          parsedValue = Number.parseFloat(newSplitValue)
        } else if (flagDataType === "json") {
          parsedValue = JSON.parse(newSplitValue)
        }
      } catch (error) {
        alert("Invalid value format")
        return
      }

      const newSplit: PercentageSplit = {
        percentage,
        value: parsedValue,
        label: newSplitLabel.trim() || undefined,
      }

      onSplitsChange([...splits, newSplit])
      setNewSplitPercentage("")
      setNewSplitValue("")
      setNewSplitLabel("")
    }
  }

  const removeSplit = (index: number) => {
    onSplitsChange(splits.filter((_, i) => i !== index))
  }

  const updateSplit = (index: number, field: keyof PercentageSplit, value: any) => {
    const updatedSplits = [...splits]
    updatedSplits[index] = { ...updatedSplits[index], [field]: value }
    onSplitsChange(updatedSplits)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Percent className="w-4 h-4" />
          Percentage Split Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Splits */}
        {splits.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Current Splits</Label>
            {splits.map((split, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded">
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="number"
                    value={split.percentage}
                    onChange={(e) => updateSplit(index, "percentage", Number.parseFloat(e.target.value) || 0)}
                    className="w-20"
                    min="0"
                    max="100"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                  <span className="text-sm">→</span>
                  <Input
                    value={JSON.stringify(split.value)}
                    onChange={(e) => {
                      try {
                        let parsedValue = e.target.value
                        if (flagDataType === "boolean") {
                          parsedValue = e.target.value.toLowerCase() === "true"
                        } else if (flagDataType === "number") {
                          parsedValue = Number.parseFloat(e.target.value) || 0
                        } else if (flagDataType === "json") {
                          parsedValue = JSON.parse(e.target.value)
                        }
                        updateSplit(index, "value", parsedValue)
                      } catch (error) {
                        // Invalid JSON, keep as string for now
                      }
                    }}
                    className="flex-1"
                    placeholder="Return value"
                  />
                  {split.label && (
                    <Badge variant="outline" className="text-xs">
                      {split.label}
                    </Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => removeSplit(index)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total: {totalPercentage}%</span>
              <span className="text-muted-foreground">Remaining: {remainingPercentage}%</span>
            </div>

            {totalPercentage > 100 && (
              <div className="text-sm text-red-600">⚠️ Total percentage exceeds 100%</div>
            )}
          </div>
        )}

        {/* Add New Split */}
        {remainingPercentage > 0 && (
          <div className="space-y-3 border-t pt-4">
            <Label className="text-sm font-medium">Add New Split</Label>
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-3">
                <Input
                  type="number"
                  value={newSplitPercentage}
                  onChange={(e) => setNewSplitPercentage(e.target.value)}
                  placeholder="25"
                  min="0"
                  max={remainingPercentage}
                />
                <Label className="text-xs text-muted-foreground">Percentage</Label>
              </div>
              <div className="col-span-4">
                <Input
                  value={newSplitValue}
                  onChange={(e) => setNewSplitValue(e.target.value)}
                  placeholder={
                    flagDataType === "boolean"
                      ? "true"
                      : flagDataType === "number"
                        ? "123"
                        : flagDataType === "json"
                          ? '{"key": "value"}'
                          : "value"
                  }
                />
                <Label className="text-xs text-muted-foreground">Return Value</Label>
              </div>
              <div className="col-span-3">
                <Input
                  value={newSplitLabel}
                  onChange={(e) => setNewSplitLabel(e.target.value)}
                  placeholder="Label (optional)"
                />
                <Label className="text-xs text-muted-foreground">Label</Label>
              </div>
              <div className="col-span-2">
                <Button
                  onClick={addSplit}
                  disabled={
                    !newSplitPercentage ||
                    !newSplitValue ||
                    Number.parseFloat(newSplitPercentage) <= 0 ||
                    Number.parseFloat(newSplitPercentage) > remainingPercentage
                  }
                  className="w-full"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Usage Example */}
        <div className="bg-muted p-3 rounded text-xs">
          <div className="font-medium mb-1">How it works:</div>
          <div className="text-muted-foreground">
            When this condition matches, users will be randomly assigned to different return values based on the
            percentage splits. This is useful for A/B testing or gradual rollouts within a specific user segment.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
