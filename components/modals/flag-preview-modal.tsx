"use client"

import { useState, useEffect } from "react"
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
import { Play, RefreshCw, User, Code, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { evaluateLiveFlag, evaluateFlagWithChanges, type FlagEvaluationResult } from "../../lib/api-services"
import type { FeatureFlag, GlobalAttribute, Environment, EnvironmentConfig } from "../../types"

interface FlagPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flag: FeatureFlag | null
  environment: Environment
  attributes: GlobalAttribute[]
  hasUnsavedChanges?: boolean
  projectKey?: string
}

export function FlagPreviewModal({ open, onOpenChange, flag, environment, attributes, hasUnsavedChanges = false, projectKey }: FlagPreviewModalProps) {
  const [userAttributes, setUserAttributes] = useState<Record<string, any>>({})
  const [evaluationResult, setEvaluationResult] = useState<FlagEvaluationResult | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>(environment)

  // Clear evaluation result when environment changes
  useEffect(() => {
    setEvaluationResult(null)
  }, [selectedEnvironment])

  // Clear evaluation result when modal closes
  useEffect(() => {
    if (!open) {
      setEvaluationResult(null)
    }
  }, [open])

  if (!flag) return null

  const environmentConfig = flag.environments.find(env => env.environment === selectedEnvironment)
  
  // Get attributes used in rules for the selected environment
  const getRelevantAttributes = () => {
    if (!environmentConfig?.rules || environmentConfig.rules.length === 0) {
      return [] // Show no attributes when no rules exist
    }
    
    const usedAttributeIds = new Set<string>()
    environmentConfig.rules.forEach(rule => {
      rule.conditions.forEach(condition => {
        usedAttributeIds.add(condition.attributeId)
      })
    })
    
    // If no attributes are used in conditions, show no attributes
    if (usedAttributeIds.size === 0) {
      return []
    }
    
    return attributes.filter(attr => usedAttributeIds.has(attr.id))
  }
  
  const relevantAttributes = getRelevantAttributes()
  
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
    if (!environmentConfig || !projectKey) return

    setIsEvaluating(true)
    
    try {
      // Convert attribute IDs to attribute keys for API call
      const userAttributesWithKeys: Record<string, any> = {}
      Object.entries(userAttributes).forEach(([attributeId, value]) => {
        const attribute = attributes.find(attr => attr.id === attributeId)
        if (attribute) {
          userAttributesWithKeys[attribute.name] = value
        }
      })
      
      let result: FlagEvaluationResult
      
      if (hasUnsavedChanges) {
        // Use project-level endpoint for unsaved changes
        const flagData = {
          key: flag.key,
          name: flag.name,
          dataType: flag.dataType,
          environments: [{
            environment: selectedEnvironment,
            enabled: environmentConfig.enabled,
            defaultValue: environmentConfig.defaultValue,
            rules: environmentConfig.rules || []
          }]
        }
        result = await evaluateFlagWithChanges(projectKey, flagData, selectedEnvironment, userAttributesWithKeys)
      } else {
        // Use flag-specific endpoint for live flags
        result = await evaluateLiveFlag(projectKey, flag.key, selectedEnvironment, userAttributesWithKeys)
      }
      
      setEvaluationResult(result)
    } catch (error) {
      console.error('Flag evaluation error:', error)
      setEvaluationResult({
        value: null,
        matchedRule: undefined,
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsEvaluating(false)
    }
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
            Test how this flag evaluates for different user attributes
          </DialogDescription>
        </DialogHeader>
        
        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Warning:</strong> This preview is using unsaved changes. Close this modal and discard changes to see the live version.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="test" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="test">Test Evaluation</TabsTrigger>
            <TabsTrigger value="code">Code Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="test" className="space-y-6">
            {/* Environment Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Environment *</Label>
              <div className="flex gap-2">
                {(['development', 'staging', 'production'] as Environment[]).map((env) => (
                  <Button
                    key={env}
                    variant={selectedEnvironment === env ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedEnvironment(env)}
                  >
                    {env.charAt(0).toUpperCase() + env.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* User Attributes Input */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                User Attributes
                {relevantAttributes.length < attributes.length && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (Showing {relevantAttributes.length} attributes used in {selectedEnvironment} rules)
                  </span>
                )}
              </Label>
              <div className="grid grid-cols-2 gap-4">
                {relevantAttributes.map((attribute) => (
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
            <Button 
              onClick={evaluateFlag} 
              disabled={isEvaluating || !selectedEnvironment} 
              className="w-full"
            >
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
                  <div>
                    <Label className="text-sm text-muted-foreground">Returned Value</Label>
                    <div className="font-mono text-lg p-2 bg-muted rounded">
                      {flag.dataType === 'json' ? 
                        JSON.stringify(evaluationResult.value, null, 2) : 
                        JSON.stringify(evaluationResult.value)
                      }
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
                  <pre>{`${flag.dataType === 'boolean' ? `# Get boolean flag value
value = ff.get_bool("${flag.key}", 
    user_attributes={
        ${Object.entries(userAttributes).map(([key, value]) => {
          const attr = attributes.find(a => a.id === key)
          return `"${attr?.name || key}": ${JSON.stringify(value)}`
        }).join(',\n        ')}
    },
    default_value=${JSON.stringify(environmentConfig?.defaultValue)}
)` : flag.dataType === 'string' ? `# Get string flag value
value = ff.get_string("${flag.key}", 
    user_attributes={
        ${Object.entries(userAttributes).map(([key, value]) => {
          const attr = attributes.find(a => a.id === key)
          return `"${attr?.name || key}": ${JSON.stringify(value)}`
        }).join(',\n        ')}
    },
    default_value=${JSON.stringify(environmentConfig?.defaultValue)}
)` : flag.dataType === 'number' ? `# Get number flag value
value = ff.get_number("${flag.key}", 
    user_attributes={
        ${Object.entries(userAttributes).map(([key, value]) => {
          const attr = attributes.find(a => a.id === key)
          return `"${attr?.name || key}": ${JSON.stringify(value)}`
        }).join(',\n        ')}
    },
    default_value=${JSON.stringify(environmentConfig?.defaultValue)}
)` : `# Get JSON flag value
value = ff.get_json("${flag.key}", 
    user_attributes={
        ${Object.entries(userAttributes).map(([key, value]) => {
          const attr = attributes.find(a => a.id === key)
          return `"${attr?.name || key}": ${JSON.stringify(value)}`
        }).join(',\n        ')}
    },
    default_value=${JSON.stringify(environmentConfig?.defaultValue)}
)`}`}</pre>
                </div>
              </div>

            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
