"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Rule, GlobalAttribute, ComparisonOperator } from "../types"

interface RuleBuilderProps {
  rule: Rule
  attributes: GlobalAttribute[]
  readonly?: boolean
}

const operatorLabels: Record<ComparisonOperator, string> = {
  equals: "equals",
  not_equals: "not equals",
  greater_than: "greater than",
  less_than: "less than",
  contains: "contains",
  in: "is in",
  not_in: "is not in",
  percentage_split: "percentage split",
}

export function RuleBuilder({ rule, attributes, readonly = false }: RuleBuilderProps) {
  const getAttributeName = (attributeId: string) => {
    const attribute = attributes.find((attr) => attr.id === attributeId)
    return attribute?.name || "Unknown"
  }

  return (
    <div className="space-y-3">
      {rule.conditions.map((condition, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            {index > 0 && (
              <Badge variant="outline" className="text-xs">
                {rule.logicalOperator}
              </Badge>
            )}
            <Badge variant="secondary">{getAttributeName(condition.attributeId)}</Badge>
            <Badge variant="outline">{operatorLabels[condition.operator]}</Badge>
            {condition.operator !== "percentage_split" && (
              <>
                {condition.operator === "in" || condition.operator === "not_in" ? (
                  <div className="flex flex-wrap gap-1">
                    {(condition.listValues || []).map((value, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {value}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <Badge variant="secondary">
                    {typeof condition.value === "string" ? `"${condition.value}"` : String(condition.value)}
                  </Badge>
                )}
              </>
            )}
          </div>

          {/* Show percentage splits if this condition uses them */}
          {condition.operator === "percentage_split" && condition.percentageSplits && (
            <div className="ml-4 space-y-2 border-l-2 border-muted pl-4">
              <div className="text-xs font-medium text-muted-foreground">Percentage Distribution:</div>
              {condition.percentageSplits.map((split, splitIndex) => (
                <div key={splitIndex} className="flex items-center gap-3 text-xs">
                  <div className="w-12 text-right font-mono">{split.percentage}%</div>
                  <Progress value={split.percentage} className="flex-1 h-2" />
                  <Badge variant="outline" className="text-xs">
                    {JSON.stringify(split.value)}
                  </Badge>
                  {split.label && (
                    <Badge variant="secondary" className="text-xs">
                      {split.label}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
