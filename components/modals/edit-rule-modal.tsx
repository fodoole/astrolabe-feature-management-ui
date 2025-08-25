"use client"

import { useState, useEffect } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, Settings } from 'lucide-react'
import type { Rule, GlobalAttribute, ComparisonOperator, LogicalOperator, RuleCondition } from "../../types"
import { RuleConditionEditor } from "../rule-condition-editor"

interface EditRuleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: Rule | null
  attributes: GlobalAttribute[]
  flagDataType: string
  onUpdateRule: (ruleId: string, updates: Partial<Rule>) => void
  onDeleteRule: (ruleId: string) => void
}

export function EditRuleModal({ 
  open, 
  onOpenChange, 
  rule, 
  attributes, 
  flagDataType, 
  onUpdateRule, 
  onDeleteRule 
}: EditRuleModalProps) {
  const [name, setName] = useState("")
  const [enabled, setEnabled] = useState(true)
  const [conditions, setConditions] = useState<RuleCondition[]>([])
  const [logicalOperator, setLogicalOperator] = useState<LogicalOperator>("AND")
  const [returnValue, setReturnValue] = useState("")

  useEffect(() => {
    if (rule) {
      setName(rule.name)
      setEnabled(rule.enabled)
      setConditions([...rule.conditions])
      setLogicalOperator(rule.logicalOperator)
      setReturnValue(JSON.stringify(rule.returnValue))
    }
  }, [rule])

  if (!rule) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
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

    onUpdateRule(rule.id, {
      name: name.trim(),
      enabled,
      conditions,
      logicalOperator,
      returnValue: parsedReturnValue,
    })

    onOpenChange(false)
  }

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete the rule "${rule.name}"?`)) {
      onDeleteRule(rule.id)
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
    
    setConditions(updated)
  }


  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const getAttributeById = (id: string) => attributes.find((attr) => attr.id === id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Edit Rule: {rule.name}
          </DialogTitle>
          <DialogDescription>Modify the conditions and behavior of this targeting rule.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="enabled" className="text-right">Enabled</Label>
              <div className="col-span-3">
                <Switch
                  id="enabled"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                />
              </div>
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
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="returnValue" className="text-right">Return Value</Label>
              {flagDataType === "boolean" ? (
                <Select 
                  value={String(returnValue)} 
                  onValueChange={setReturnValue}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
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
                  className="col-span-3"
                  required
                />
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete Rule
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
