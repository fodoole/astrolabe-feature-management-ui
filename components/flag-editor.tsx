"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Plus, Flag, Settings, Eye, Code, Trash2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import type {
  Project,
  FeatureFlag,
  GlobalAttribute,
  Environment,
  FlagDataType,
  RuleCondition,
  LogicalOperator,
  Rule,
} from "../types"
import { RuleBuilder } from "./rule-builder"
import { NewFlagModal } from "./modals/new-flag-modal"
import { NewRuleModal } from "./modals/new-rule-modal"
import { FlagPreviewModal } from "./modals/flag-preview-modal"
import { EditRuleModal } from "./modals/edit-rule-modal"
import { transformFlagToSDKFormat } from "../lib/flag-config-transformer"
import { saveFlagDefinition, createFeatureFlag } from "../lib/api-services"

interface FlagEditorProps {
  projects: Project[]
  flags: FeatureFlag[]
  attributes: GlobalAttribute[]
  selectedProject: string | null
  selectedFlag: string | null
  onSelectFlag: (flagId: string) => void
  onFlagsChange: () => Promise<void>
}

export function FlagEditor({
  projects,
  flags,
  attributes,
  selectedProject,
  selectedFlag,
  onSelectFlag,
  onFlagsChange,
}: FlagEditorProps) {
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>("development")
  const [showNewFlagModal, setShowNewFlagModal] = useState(false)
  const [showNewRuleModal, setShowNewRuleModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showEditRuleModal, setShowEditRuleModal] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreatingFlag, setIsCreatingFlag] = useState(false)
  const [createFlagMessage, setCreateFlagMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [localFlags, setLocalFlags] = useState<FeatureFlag[]>([])

  useEffect(() => {
    setHasUnsavedChanges(false)
    setLocalFlags(flags)
  }, [selectedFlag, flags])

  const projectFlags = selectedProject ? localFlags.filter((flag) => flag.projectId === selectedProject) : localFlags

  const currentFlag = selectedFlag ? localFlags.find((flag) => flag.id === selectedFlag) : null

  // Debug flag structure
  console.log("Current flag environments:", currentFlag?.environments)
  console.log("Selected environment:", selectedEnvironment)
  
  // More detailed debugging
  if (currentFlag?.environments) {
    console.log("Available environment names:", currentFlag.environments.map(env => env.environment))
    console.log("Environment types:", currentFlag.environments.map(env => typeof env.environment))
    console.log("Looking for environment:", selectedEnvironment, "type:", typeof selectedEnvironment)
    console.log("Environment match found:", currentFlag.environments.some(env => env.environment === selectedEnvironment))
    console.log("Full environments array:", JSON.stringify(currentFlag.environments, null, 2))
  }
  
  // Find or create the current environment config
  let currentEnvironmentConfig = currentFlag?.environments?.find((env) => env.environment === selectedEnvironment)
  
  // If environment doesn't exist, create it
  if (currentFlag && !currentEnvironmentConfig) {
    console.log(`Environment ${selectedEnvironment} not found, creating it...`)
    const newEnvironmentConfig = {
      environment: selectedEnvironment,
      enabled: false,
      defaultValue: currentFlag.dataType === 'boolean' ? false : 
                   currentFlag.dataType === 'string' ? '' :
                   currentFlag.dataType === 'number' ? 0 : null,
      rules: [],
      trafficSplits: []
    }
    
    // Update the local flags to include the missing environment
    setLocalFlags(prevFlags => 
      prevFlags.map(flag => {
        if (flag.id === currentFlag.id) {
          return {
            ...flag,
            environments: [...flag.environments, newEnvironmentConfig]
          }
        }
        return flag
      })
    )
    
    currentEnvironmentConfig = newEnvironmentConfig
  }
  
  // Debug current environment config
  console.log("Current environment config:", currentEnvironmentConfig)
  console.log("Current environment rules:", currentEnvironmentConfig?.rules)

  const handleCreateFlag = async (flagData: {
    name: string
    key: string
    description: string
    dataType: FlagDataType
    projectId: string
  }) => {
    try {
      setIsCreatingFlag(true)
      setCreateFlagMessage(null)
      
      const project = projects.find(p => p.id === flagData.projectId)
      if (!project) throw new Error("Project not found")
      
      const flagPayload = {
        key: flagData.key,
        name: flagData.name,
        description: flagData.description,
        data_type: flagData.dataType,
        project_id: flagData.projectId, 
        created_by: "00000000-0000-0000-0000-000000000000",
        project_key: project.key,
      };
      
      await createFeatureFlag(flagPayload)
      
      // Refresh the flags list
      await onFlagsChange()
      
      setCreateFlagMessage({ type: 'success', text: `Flag "${flagData.name}" created successfully!` })
      
      // Clear success message after 3 seconds
      setTimeout(() => setCreateFlagMessage(null), 3000)
      
      console.log("Flag created successfully:", flagData)
    } catch (error) {
      console.error("Error creating flag:", error)
      setCreateFlagMessage({ type: 'error', text: 'Failed to create flag. Please try again.' })
    } finally {
      setIsCreatingFlag(false)
    }
  }

  const handleCreateRule = (ruleData: {
    name: string
    conditions: RuleCondition[]
    logicalOperator: LogicalOperator
    returnValue?: any
  }) => {
    if (!currentFlag || !selectedProject) return
    
    const newRule: Rule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: ruleData.name,
      conditions: ruleData.conditions,
      logicalOperator: ruleData.logicalOperator,
      returnValue: ruleData.returnValue,
      enabled: true,
      trafficSplits: []
    }
    
    console.log("Creating rule:", newRule)
    console.log("Current flag:", currentFlag)
    console.log("Selected environment:", selectedEnvironment)
    
    setLocalFlags(prevFlags => {
      const updatedFlags = prevFlags.map(flag => {
        if (flag.id === currentFlag.id) {
          const updatedFlag = {
            ...flag,
            environments: flag.environments.map(env => {
              if (env.environment === selectedEnvironment) {
                console.log("Adding rule to environment:", env.environment)
                console.log("Current rules:", env.rules)
                console.log("Current rules length:", env.rules?.length || 0)
                const updatedEnv = {
                  ...env,
                  rules: [...(env.rules || []), newRule]
                }
                console.log("Updated rules:", updatedEnv.rules)
                console.log("Updated rules length:", updatedEnv.rules?.length || 0)
                return updatedEnv
              }
              return env
            })
          }
          console.log("Updated flag:", updatedFlag)
          return updatedFlag
        }
        return flag
      })
      console.log("All updated flags:", updatedFlags)
      return updatedFlags
    })
    
    setHasUnsavedChanges(true)
    console.log("Rule creation completed")
  }

  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule)
    setShowEditRuleModal(true)
  }

  const handleUpdateRule = (ruleId: string, updates: Partial<Rule>) => {
    if (!currentFlag) return
    
    setLocalFlags(prevFlags => 
      prevFlags.map(flag => {
        if (flag.id === currentFlag.id) {
          return {
            ...flag,
            environments: flag.environments.map(env => {
              if (env.environment === selectedEnvironment) {
                return {
                  ...env,
                  rules: env.rules.map(rule => 
                    rule.id === ruleId ? { ...rule, ...updates } : rule
                  )
                }
              }
              return env
            })
          }
        }
        return flag
      })
    )
    
    setHasUnsavedChanges(true)
    console.log("Rule updated:", ruleId, updates)
  }

  const handleDeleteRule = (ruleId: string) => {
    if (!currentFlag) return
    
    setLocalFlags(prevFlags => 
      prevFlags.map(flag => {
        if (flag.id === currentFlag.id) {
          return {
            ...flag,
            environments: flag.environments.map(env => {
              if (env.environment === selectedEnvironment) {
                return {
                  ...env,
                  rules: env.rules.filter(rule => rule.id !== ruleId)
                }
              }
              return env
            })
          }
        }
        return flag
      })
    )
    
    setHasUnsavedChanges(true)
    console.log("Rule deleted:", ruleId)
  }

  const handleToggleEnvironment = (enabled: boolean) => {
    if (!currentFlag) return
    
    setLocalFlags(prevFlags => 
      prevFlags.map(flag => {
        if (flag.id === currentFlag.id) {
          return {
            ...flag,
            environments: flag.environments.map(env => {
              if (env.environment === selectedEnvironment) {
                return {
                  ...env,
                  enabled
                }
              }
              return env
            })
          }
        }
        return flag
      })
    )
    
    setHasUnsavedChanges(true)
  }

  const handleUpdateDefaultValue = (defaultValue: any) => {
    if (!currentFlag) return
    
    setLocalFlags(prevFlags => 
      prevFlags.map(flag => {
        if (flag.id === currentFlag.id) {
          return {
            ...flag,
            environments: flag.environments.map(env => {
              if (env.environment === selectedEnvironment) {
                return {
                  ...env,
                  defaultValue
                }
              }
              return env
            })
          }
        }
        return flag
      })
    )
    
    setHasUnsavedChanges(true)
  }

  const handleSaveChanges = async () => {
    if (!currentFlag || !selectedProject) return
    
    try {
      setIsSaving(true)
      const project = projects.find(p => p.id === selectedProject)
      if (!project) throw new Error("Project not found")
      
      // Use the local flag state for saving
      const sdkConfig = transformFlagToSDKFormat(currentFlag)
      await saveFlagDefinition(project.key, currentFlag.key, sdkConfig)
      
      // Update the original flags state with local changes
      await onFlagsChange()
      
      setHasUnsavedChanges(false)
      console.log("Flag definition saved successfully")
    } catch (error) {
      console.error("Error saving flag definition:", error)
      alert("Failed to save flag definition. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!selectedProject) {
    return (
      <div className="text-center py-12">
        <Flag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Select a project</h3>
        <p className="text-muted-foreground">Choose a project from the sidebar to manage its flags</p>
      </div>
    )
  }

  const selectedProjectData = projects.find((p) => p.id === selectedProject)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flags</h1>
          <p className="text-muted-foreground">
            {selectedProjectData?.name} • {projectFlags.length} flags
          </p>
        </div>
        <Button onClick={() => setShowNewFlagModal(true)} disabled={!selectedProject || isCreatingFlag}>
          <Plus className="w-4 h-4 mr-2" />
          {isCreatingFlag ? "Creating..." : "New Flag"}
        </Button>
      </div>

      {/* Success/Error Message */}
      {createFlagMessage && (
        <Alert className={createFlagMessage.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <AlertCircle className={`h-4 w-4 ${createFlagMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
          <AlertDescription className={createFlagMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {createFlagMessage.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flag List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {projectFlags.map((flag) => (
              <div
                key={flag.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedFlag === flag.id ? "bg-muted border-primary" : ""
                }`}
                onClick={() => onSelectFlag(flag.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-sm">{flag.name}</div>
                  <Badge variant="outline" className="text-xs">
                    {flag.dataType}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mb-2">{flag.key}</div>
                <div className="flex gap-1">
                  {flag.environments.map((env) => (
                    <Badge key={env.environment} variant={env.enabled ? "default" : "secondary"} className="text-xs">
                      {env.environment.charAt(0).toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}

            {projectFlags.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Flag className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm">No flags yet</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Flag Details */}
        <div className="lg:col-span-2">
          {currentFlag ? (
            <div className="space-y-4">
              {hasUnsavedChanges && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You have unsaved changes. Click Save to persist your changes.
                    <Button 
                      onClick={handleSaveChanges} 
                      disabled={isSaving}
                      className="ml-2"
                      size="sm"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              <Tabs value={selectedEnvironment} onValueChange={(value) => setSelectedEnvironment(value as Environment)}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="development">Development</TabsTrigger>
                    <TabsTrigger value="staging">Staging</TabsTrigger>
                    <TabsTrigger value="production">Production</TabsTrigger>
                  </TabsList>
                <Button variant="outline" size="sm" onClick={() => setShowPreviewModal(true)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>

              {(["development", "staging", "production"] as Environment[]).map((env) => (
                <TabsContent key={env} value={env} className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Flag className="w-5 h-5" />
                            {currentFlag.name}
                          </CardTitle>
                          <CardDescription>{currentFlag.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Enabled</span>
                          <Switch 
                            checked={currentEnvironmentConfig?.enabled || false} 
                            onCheckedChange={handleToggleEnvironment}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Default Value</label>
                          <div className="mt-1 p-2 bg-muted rounded text-sm font-mono cursor-pointer hover:bg-muted/80" 
                               onClick={() => {
                                 const newValue = prompt('Enter new default value:', JSON.stringify(currentEnvironmentConfig?.defaultValue))
                                 if (newValue !== null) {
                                   try {
                                     const parsedValue = JSON.parse(newValue)
                                     handleUpdateDefaultValue(parsedValue)
                                   } catch {
                                     handleUpdateDefaultValue(newValue)
                                   }
                                 }
                               }}>
                            {JSON.stringify(currentEnvironmentConfig?.defaultValue)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Click to edit</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rules Section */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Targeting Rules</CardTitle>
                        <Button size="sm" onClick={() => setShowNewRuleModal(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Rule
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {currentEnvironmentConfig?.rules && currentEnvironmentConfig.rules.length > 0 ? (
                        <div className="space-y-4">
                          {currentEnvironmentConfig.rules.map((rule, index) => (
                            <div key={rule.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{rule.name}</span>
                                  <Badge variant={rule.enabled ? "default" : "secondary"}>
                                    {rule.enabled ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleEditRule(rule)}>
                                    <Settings className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              <RuleBuilder rule={rule} attributes={attributes} readonly={true} />

                              <div className="mt-3 p-2 bg-muted rounded">
                                <div className="text-xs text-muted-foreground mb-1">Return Value:</div>
                                <div className="font-mono text-sm">{JSON.stringify(rule.returnValue)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Settings className="w-8 h-8 mx-auto mb-2" />
                          <div className="text-sm">No targeting rules configured</div>
                          <div className="text-xs">Add rules to control who sees this flag</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                </TabsContent>
              ))}
              </Tabs>
            </div>
          ) : (
            <div className="text-center py-12">
              <Code className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a flag</h3>
              <p className="text-muted-foreground">Choose a feature flag to view and edit its configuration</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedProject && (
        <NewFlagModal
          open={showNewFlagModal}
          onOpenChange={setShowNewFlagModal}
          projectId={selectedProject}
          onCreateFlag={handleCreateFlag}
          isCreating={isCreatingFlag}
        />
      )}

      {currentFlag && (
        <>
          <NewRuleModal
            open={showNewRuleModal}
            onOpenChange={setShowNewRuleModal}
            attributes={attributes}
            flagDataType={currentFlag.dataType}
            onCreateRule={handleCreateRule}
          />

          <FlagPreviewModal
            open={showPreviewModal}
            onOpenChange={setShowPreviewModal}
            flag={currentFlag}
            environment={selectedEnvironment}
            attributes={attributes}
          />

          <EditRuleModal
            open={showEditRuleModal}
            onOpenChange={setShowEditRuleModal}
            rule={editingRule}
            attributes={attributes}
            flagDataType={currentFlag.dataType}
            onUpdateRule={handleUpdateRule}
            onDeleteRule={handleDeleteRule}
          />
        </>
      )}
    </div>
  )
}
