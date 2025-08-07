"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from 'lucide-react'
import type { RuleCondition, GlobalAttribute, ComparisonOperator } from "../types"
import { ListValueInput } from "./list-value-input"
import { PercentageSplitBuilder } from "./percentage-split-builder"

interface RuleConditionEditorProps {
  condition: RuleCondition
  attributes: GlobalAttribute[]
  flagDataType: string
  onUpdate: (field: keyof RuleCondition, value: any) => void
  onRemove: () => void
  showLogicalOperator?: boolean
  logicalOperator?: "AND" | "OR"
  onLogicalOperatorChange?: (operator: "AND" | "OR") => void
}

export function RuleConditionEditor({
  condition,
  attributes,
  flagDataType,
  onUpdate,
  onRemove,
  showLogicalOperator = false,
  logicalOperator = "AND",
  onLogicalOperatorChange
}: RuleConditionEditorProps) {
  const attribute = attributes.find(attr => attr.id === condition.attributeId)
  
  const getAvailableOperators = (attributeType?: string): ComparisonOperator[] => {
    const baseOperators: ComparisonOperator[] = ["equals", "not_equals"]
    
    if (attributeType === "number") {
      return [...baseOperators, "greater_than", "less_than", "in", "not_in", "percentage_split"]
    } else if (attributeType === "string") {
      return [...baseOperators, "contains", "in", "not_in"]
    } else if (attributeType === "boolean") {
      return baseOperators
    }
    
    return baseOperators
  }

  const isListOperator = (operator: ComparisonOperator) => {
    return operator === "in" || operator === "not_in"
  }

  const handleListValuesChange = (values: string[]) => {
    onUpdate("listValues", values)
  }

  const renderValueInput = () => {
    if (condition.operator === "percentage_split") {
      return (
        <PercentageSplitBuilder
          splits={condition.percentageSplits || []}
          onSplitsChange={(splits) => onUpdate("percentageSplits", splits)}
          flagDataType={flagDataType}
        />
      )
    }

    if (isListOperator(condition.operator)) {
      return (
        <ListValueInput
          values={condition.listValues || []}
          onValuesChange={handleListValuesChange}
          placeholder={`Add ${attribute?.type || 'value'}`}
        />
      )
    }

    return (
      <Input
        value={condition.value || ""}
        onChange={(e) => onUpdate("value", e.target.value)}
        placeholder={
          attribute?.type === "boolean" ? "true/false" :
          attribute?.type === "number" ? "123" :
          attribute?.possibleValues ? attribute.possibleValues[0] : "value"
        }
        className="flex-1"
      />
    )
  }

  return (
    <div className="space-y-3 p-4 border rounded">
      <div className="flex items-center gap-2">
        {showLogicalOperator && (
          <Select
            value={logicalOperator}
            onValueChange={(value: "AND" | "OR") => onLogicalOperatorChange?.(value)}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">AND</SelectItem>
              <SelectItem value="OR">OR</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Select
          value={condition.attributeId}
          onValueChange={(value) => onUpdate("attributeId", value)}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select attribute" />
          </SelectTrigger>
          <SelectContent>
            {attributes.map((attr) => (
              <SelectItem key={attr.id} value={attr.id}>
                {attr.name} ({attr.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={condition.operator}
          onValueChange={(value: ComparisonOperator) => onUpdate("operator", value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getAvailableOperators(attribute?.type).map((op) => (
              <SelectItem key={op} value={op}>
                {op === "not_in" ? "not in" : op.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="button" variant="outline" size="sm" onClick={onRemove}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {condition.operator !== "percentage_split" && (
        <div className="ml-6">
          {renderValueInput()}
        </div>
      )}

      {condition.operator === "percentage_split" && renderValueInput()}
    </div>
  )
}
