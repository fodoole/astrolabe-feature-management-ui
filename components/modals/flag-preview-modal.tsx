"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, RefreshCw, User, Code } from 'lucide-react'
import type { FeatureFlag, GlobalAttribute, Environment, EnvironmentConfig } from "../../types"

interface FlagPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flag: FeatureFlag | null
  environment: Environment
  attributes: GlobalAttribute[]
}

export function FlagPreviewModal({ open, onOpenChange, flag, environment, attributes }: FlagPreviewModalProps) {
  const [userAttributes, setUserAttributes] = useState<Record<string, any>>({})
  const [evaluationResult, setEvaluationResult] = useState<any>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

  if (!flag) return null

  const environmentConfig = flag.environments.find(env => env.environment === environment)
  
  const handleAttributeChange = (attributeId: string, value: string) => {
    const attribute = attributes.find(attr => attr.id === attributeId)
    if (!attribute) return

    let parsedValue: any = value
    try {
      if (attribute.type === "boolean") {
        parsedValue = value.toLowerCase() === "true"
      } else if (attribute.type === "number") {
        parsedValue = Number.parseFloat(value) || 0
      }
    } catch (error) {
      // Keep as string if parsing fails
    }

    setUserAttributes(prev => ({
      ...prev,
      [attributeId]: parsedValue
    }))
  }

  const evaluateFlag = async () => {
    if (!environmentConfig) return

    setIsEvaluating(true)
    
    // Simulate flag evaluation logic
    await new Promise(resolve => setTimeout(resolve, 500))

    let result = {
      value: environmentConfig.defaultValue,
      reason: "default_value",
      matchedRule: null as any,
      timestamp: new Date().toISOString()
    }

    // Check rules in order
    if (environmentConfig.rules && environmentConfig.enabled) {
      for (const rule of environmentConfig.rules) {
        if (!rule.enabled) continue

        let ruleMatches = true
        let matchDetails: any[] = []

        // Evaluate conditions
        for (const condition of rule.conditions) {
          const attribute = attributes.find(attr => attr.id === condition.attributeId)
          const userValue = userAttributes[condition.attributeId]
          
          let conditionMatches = false
          let conditionDetail = {
            attribute: attribute?.name || "unknown",
            operator: condition.operator,
            expectedValue: condition.value,
            actualValue: userValue,
            matches: false
          }

          if (userValue !== undefined) {
            switch (condition.operator) {
              case "equals":
                conditionMatches = userValue === condition.value
                break
              case "not_equals":
                conditionMatches = userValue !== condition.value
                break
              case "greater_than":
                conditionMatches = Number(userValue) > Number(condition.value)
                break
              case "less_than":
                conditionMatches = Number(userValue) < Number(condition.value)
                break
              case "contains":
                conditionMatches = String(userValue).includes(String(condition.value))
                break
              case "in":
                if (condition.listValues) {
                  conditionMatches = condition.listValues.includes(String(userValue))
                }
                break
              case "not_in":
                if (condition.listValues) {
                  conditionMatches = !condition.listValues.includes(String(userValue))
                }
                break
              case "modulus_equals":
                if (condition.modulusValue) {
                  const remainder = Number(userValue) % condition.modulusValue
                  conditionMatches = remainder === Number(condition.value)
                  conditionDetail.expectedValue = `% ${condition.modulusValue} = ${condition.value}`
                  conditionDetail.actualValue = `${userValue} % ${condition.modulusValue} = ${remainder}`
                }
                break
            }
          }

          conditionDetail.matches = conditionMatches
          matchDetails.push(conditionDetail)

          if (rule.logicalOperator === "AND" && !conditionMatches) {
            ruleMatches = false
            break
          } else if (rule.logicalOperator === "OR" && conditionMatches) {
            ruleMatches = true
          }
        }

        if (rule.logicalOperator === "OR" && rule.conditions.length > 0) {
          ruleMatches = matchDetails.some(detail => detail.matches)
        }

        // If no conditions, rule always matches (default rule)
        if (rule.conditions.length === 0) {
          ruleMatches = true
        }

        if (ruleMatches) {
          result.matchedRule = {
            name: rule.name,
            conditions: matchDetails
          }

          // Handle traffic splits vs simple return value
          if (rule.trafficSplits && rule.trafficSplits.length > 0) {
            // Use user_id for consistent traffic splitting
            const userId = userAttributes["5"] || userAttributes["user_id"] || 0
            const hash = Math.abs(Number(userId)) % 100
            
            let cumulativePercentage = 0
            for (const split of rule.trafficSplits) {
              cumulativePercentage += split.percentage
              if (hash < cumulativePercentage) {
                result.value = split.value
                result.reason = "traffic_split"
                break
              }
            }
          } else {
            result.value = rule.returnValue
            result.reason = "matched_rule"
          }
          break
        }
      }
    }

    if (!environmentConfig.enabled) {
      result.reason = "flag_disabled"
      result.value = environmentConfig.defaultValue
    }

    setEvaluationResult(result)
    setIsEvaluating(false)
  }

  const presetUsers = [
    {
      name: "Premium US User",
      attributes: { "1": "US", "3": true, "2": 28, "5": 12345 }
    },
    {
      name: "Free UK User", 
      attributes: { "1": "UK", "3": false, "2": 22, "5": 67890 }
    },
    {
      name: "Premium DE User",
      attributes: { "1": "DE", "3": true, "2": 35, "5": 11111 }
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Preview: {flag.name}
          </DialogTitle>
          <DialogDescription>
            Test how this flag evaluates for different user attributes in {environment}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="test" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="test">Test Evaluation</TabsTrigger>
            <TabsTrigger value="code">Code Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="test" className="space-y-6">
            {/* Quick Presets */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Quick Test Users</Label>
              <div className="flex gap-2 flex-wrap">
                {presetUsers.map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setUserAttributes(preset.attributes)}
                  >
                    <User className="w-3 h-3 mr-1" />
                    {preset.name}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserAttributes({})}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </div>
            </div>

            {/* User Attributes Input */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">User Attributes</Label>
              <div className="grid grid-cols-2 gap-4">
                {attributes.map((attribute) => (
                  <div key={attribute.id} className="space-y-1">
                    <Label className="text-xs">{attribute.name} ({attribute.type})</Label>
                    <Input
                      value={userAttributes[attribute.id] || ""}
                      onChange={(e) => handleAttributeChange(attribute.id, e.target.value)}
                      placeholder={
                        attribute.type === "boolean" ? "true/false" :
                        attribute.type === "number" ? "123" :
                        attribute.possibleValues ? attribute.possibleValues[0] : "value"
                      }
                      className="text-sm"
                    />
                    {attribute.possibleValues && (
                      <div className="flex gap-1 flex-wrap">
                        {attribute.possibleValues.slice(0, 3).map((value) => (
                          <Badge
                            key={value}
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-muted"
                            onClick={() => handleAttributeChange(attribute.id, value)}
                          >
                            {value}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Evaluate Button */}
            <Button onClick={evaluateFlag} disabled={isEvaluating} className="w-full">
              {isEvaluating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Evaluate Flag
                </>
              )}
            </Button>

            {/* Results */}
            {evaluationResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Evaluation Result</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Returned Value</Label>
                      <div className="font-mono text-lg p-2 bg-muted rounded">
                        {JSON.stringify(evaluationResult.value)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Reason</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={
                          evaluationResult.reason === "matched_rule" ? "default" :
                          evaluationResult.reason === "traffic_split" ? "secondary" :
                          evaluationResult.reason === "flag_disabled" ? "destructive" : "outline"
                        }>
                          {evaluationResult.reason.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {evaluationResult.matchedRule && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Matched Rule: {evaluationResult.matchedRule.name}</Label>
                      <div className="space-y-1">
                        {evaluationResult.matchedRule.conditions.map((condition: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                            <Badge variant={condition.matches ? "default" : "secondary"} className="text-xs">
                              {condition.matches ? "✓" : "✗"}
                            </Badge>
                            <span>{condition.attribute}</span>
                            <span className="text-muted-foreground">{condition.operator}</span>
                            <span className="font-mono">{JSON.stringify(condition.expectedValue)}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-mono">{JSON.stringify(condition.actualValue)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Evaluated at: {new Date(evaluationResult.timestamp).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="code" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Python SDK</Label>
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm font-mono">
                  <pre>{`# Check if flag is enabled
if ff.is_enabled("${flag.key}", user_attributes={
    ${Object.entries(userAttributes).map(([key, value]) => {
      const attr = attributes.find(a => a.id === key)
      return `"${attr?.name || key}": ${JSON.stringify(value)}`
    }).join(',\n    ')}
}):
    # Flag is enabled
    pass

# Get flag value
value = ff.get_value("${flag.key}", 
    user_attributes={...},
    default_value=${JSON.stringify(environmentConfig?.defaultValue)}
)`}</pre>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Node.js SDK</Label>
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm font-mono">
                  <pre>{`// Check if flag is enabled
if (ff.isEnabled("${flag.key}", {
    ${Object.entries(userAttributes).map(([key, value]) => {
      const attr = attributes.find(a => a.id === key)
      return `${attr?.name || key}: ${JSON.stringify(value)}`
    }).join(',\n    ')}
})) {
    // Flag is enabled
}

// Get flag value
const value = ff.getValue("${flag.key}", 
    userAttributes,
    ${JSON.stringify(environmentConfig?.defaultValue)} // default
);`}</pre>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
