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
import { toast } from 'sonner'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from 'lucide-react'
import type { GlobalAttribute, LogicalOperator, RuleCondition } from "../../types"
import { RuleConditionEditor } from "../rule-condition-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
    
    if (!name.trim()) {
      toast.error("Rule name is required")
      return
    }

    if (conditions.length === 0) {
      toast.error("At least one condition is required")
      return
    }

    if (!returnValue.trim()) {
      toast.error("Return value is required")
      return
    }

    let parsedReturnValue: any = returnValue
    try {
      if (flagDataType === "boolean") {
        parsedReturnValue = returnValue.toLowerCase() === "true"
      } else if (flagDataType === "number") {
        parsedReturnValue = Number.parseFloat(returnValue)
      } else if (flagDataType === "json") {
        parsedReturnValue = JSON.parse(returnValue)
      }
    } catch (error) {
      toast.error("Invalid return value format")
      return
    }

    onCreateRule({
      name: name.trim(),
      conditions,
      logicalOperator,
      returnValue: parsedReturnValue,
    })

    // Reset form
    setName("")
    setConditions([])
    setLogicalOperator("AND")
    setReturnValue("")
    onOpenChange(false)
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
    setConditions(updated)
  }

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Rule</DialogTitle>
          <DialogDescription>Define conditions and return behavior for this targeting rule.</DialogDescription>
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
                      onUpdate={(field, value) => updateCondition(index, field, value)}
                      onRemove={() => removeCondition(index)}
                      showLogicalOperator={index > 0}
                      logicalOperator={logicalOperator}
                      onLogicalOperatorChange={setLogicalOperator}
                    />
                  ))}
                </div>
              )}

              {conditions.length === 0 && (
                <div className="bg-muted/50 border border-muted rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">
                    Click "Add Condition" to define targeting rules for this rule.
                  </div>
                </div>
              )}
            </div>

            {/* Return Value Configuration */}
            <div className="grid gap-2">
              <Label htmlFor="returnValue">Return Value</Label>
              {flagDataType === "boolean" ? (
                <Select 
                  value={String(returnValue)} 
                  onValueChange={setReturnValue}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select true/false" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">true</SelectItem>
                    <SelectItem value="false">false</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="returnValue"
                  value={returnValue}
                  onChange={(e) => setReturnValue(e.target.value)}
                  placeholder={
                    flagDataType === "number"
                      ? "123"
                      : flagDataType === "json"
                        ? '{"key": "value"}'
                        : "string value"
                  }
                  required
                />
              )}
              <p className="text-xs text-muted-foreground">
                {flagDataType === "boolean" 
                  ? "Boolean value to return when this rule matches"
                  : `Value to return when this rule matches (type: ${flagDataType})`
                }
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Rule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
