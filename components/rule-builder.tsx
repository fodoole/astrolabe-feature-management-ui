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
  modulus_equals: "modulus equals",
}

export function RuleBuilder({ rule, attributes, readonly = false }: RuleBuilderProps) {
  const getAttributeName = (attributeId: string) => {
    const attribute = attributes.find((attr) => attr.id === attributeId)
    return attribute?.name || "Unknown"
  }

  return (
    <div className="space-y-4">
      {/* Conditions */}
      {rule.conditions.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground">Conditions:</div>
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
                
                {condition.operator === "in" || condition.operator === "not_in" ? (
                  <div className="flex flex-wrap gap-1">
                    {(condition.listValues || []).map((value, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {value}
                      </Badge>
                    ))}
                  </div>
                ) : condition.operator === "modulus_equals" ? (
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      % {condition.modulusValue}
                    </Badge>
                    <span className="text-xs text-muted-foreground">=</span>
                    <Badge variant="secondary" className="text-xs">
                      {String(condition.value)}
                    </Badge>
                  </div>
                ) : (
                  <Badge variant="secondary">
                    {typeof condition.value === "string" ? `"${condition.value}"` : String(condition.value)}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Return Value or Traffic Splits */}
      {rule.trafficSplits && rule.trafficSplits.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Traffic Distribution:</div>
          <div className="space-y-2">
            {rule.trafficSplits.map((split, splitIndex) => (
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
        </div>
      ) : (
        rule.returnValue !== undefined && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Return Value:</div>
            <Badge variant="outline" className="text-sm">
              {JSON.stringify(rule.returnValue)}
            </Badge>
          </div>
        )
      )}
    </div>
  )
}
