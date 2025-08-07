"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X } from 'lucide-react'
import type { GlobalAttribute, ComparisonOperator, LogicalOperator, RuleCondition, PercentageSplit } from "../../types"
import { PercentageSplitBuilder } from "../percentage-split-builder"
import { RuleConditionEditor } from "../rule-condition-editor"

interface NewRuleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attributes: GlobalAttribute[]
  flagDataType: string
  onCreateRule: (rule: {
    name: string
    conditions: RuleCondition[]
    logicalOperator: LogicalOperator
    returnValue: any
  }) => void
}

export function NewRuleModal({ open, onOpenChange, attributes, flagDataType, onCreateRule }: NewRuleModalProps) {
  const [name, setName] = useState("")
  const [conditions, setConditions] = useState<RuleCondition[]>([])
  const [logicalOperator, setLogicalOperator] = useState<LogicalOperator>("AND")
  const [returnValue, setReturnValue] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && conditions.length > 0) {
      // For percentage split conditions, we don't need a single return value
      const hasPercentageSplit = conditions.some((c) => c.operator === "percentage_split")
      
      if (!hasPercentageSplit && !returnValue.trim()) {
        alert("Return value is required for non-percentage split rules")
        return
      }

      let parsedReturnValue: any = returnValue

      if (!hasPercentageSplit) {
        try {
          if (flagDataType === "boolean") {
            parsedReturnValue = returnValue.toLowerCase() === "true"
          } else if (flagDataType === "number") {
            parsedReturnValue = Number.parseFloat(returnValue)
          } else if (flagDataType === "json") {
            parsedReturnValue = JSON.parse(returnValue)
          }
        } catch (error) {
          alert("Invalid return value format")
          return
        }
      }

      onCreateRule({
        name: name.trim(),
        conditions,
        logicalOperator,
        returnValue: hasPercentageSplit ? null : parsedReturnValue,
      })

      setName("")
      setConditions([])
      setLogicalOperator("AND")
      setReturnValue("")
      onOpenChange(false)
    }
  }

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        attributeId: "",
        operator: "equals",
        value: "",
      },
    ])
  }

  const updateCondition = (index: number, field: keyof RuleCondition, value: any) => {
    const updated = [...conditions]
    updated[index] = { ...updated[index], [field]: value }
    
    // Reset percentage splits if operator changes away from percentage_split
    if (field === "operator" && value !== "percentage_split") {
      updated[index].percentageSplits = undefined
    }
    
    setConditions(updated)
  }

  const updateConditionSplits = (index: number, splits: PercentageSplit[]) => {
    const updated = [...conditions]
    updated[index] = { ...updated[index], percentageSplits: splits }
    setConditions(updated)
  }

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const getAttributeById = (id: string) => attributes.find((attr) => attr.id === id)

  const hasPercentageSplit = conditions.some((c) => c.operator === "percentage_split")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Rule</DialogTitle>
          <DialogDescription>Define conditions that determine when this rule should apply.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Premium Users A/B Test"
                required
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Conditions</Label>
                <Button type="button" onClick={addCondition} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Condition
                </Button>
              </div>

              {conditions.length > 0 && (
                <div className="space-y-4">
                  {conditions.map((condition, index) => (
                    <RuleConditionEditor
                      key={index}
                      condition={condition}
                      attributes={attributes}
                      flagDataType={flagDataType}
                      onUpdate={(field, value) => updateCondition(index, field, value)}
                      onRemove={() => removeCondition(index)}
                      showLogicalOperator={index > 0}
                      logicalOperator={logicalOperator}
                      onLogicalOperatorChange={setLogicalOperator}
                    />
                  ))}
                </div>
              )}
            </div>

            {conditions.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-900 mb-1">💡 Default Rule</div>
                <div className="text-xs text-blue-700">
                  Every flag should have at least one rule. Add conditions above, or this will serve as a default rule that always matches and returns the specified value.
                </div>
              </div>
            )}

            {/* Return Value - only show if no percentage splits */}
            {!hasPercentageSplit && (
              <div className="grid gap-2">
                <Label htmlFor="returnValue">Return Value</Label>
                <Input
                  id="returnValue"
                  value={returnValue}
                  onChange={(e) => setReturnValue(e.target.value)}
                  placeholder={
                    flagDataType === "boolean"
                      ? "true or false"
                      : flagDataType === "number"
                        ? "123"
                        : flagDataType === "json"
                          ? '{"key": "value"}'
                          : "string value"
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Value to return when this rule matches (type: {flagDataType})
                </p>
              </div>
            )}

            {hasPercentageSplit && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="text-sm font-medium text-blue-900 mb-1">Percentage Split Rule</div>
                <div className="text-xs text-blue-700">
                  This rule uses percentage splits, so return values are defined within each split configuration above.
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={conditions.length === 0}>
              Create Rule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
