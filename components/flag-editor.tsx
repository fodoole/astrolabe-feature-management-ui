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
}

export function FlagEditor({
  projects,
  flags,
  attributes,
  selectedProject,
  selectedFlag,
  onSelectFlag,
}: FlagEditorProps) {
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>("development")
  const [showNewFlagModal, setShowNewFlagModal] = useState(false)
  const [showNewRuleModal, setShowNewRuleModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showEditRuleModal, setShowEditRuleModal] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setHasUnsavedChanges(false)
  }, [selectedFlag])

  const projectFlags = selectedProject ? flags.filter((flag) => flag.projectId === selectedProject) : flags

  const currentFlag = selectedFlag ? flags.find((flag) => flag.id === selectedFlag) : null

  const currentEnvironmentConfig = currentFlag?.environments.find((env) => env.environment === selectedEnvironment)

  const handleCreateFlag = async (flagData: {
    name: string
    key: string
    description: string
    dataType: FlagDataType
    projectId: string
  }) => {
    try {
      const project = projects.find(p => p.id === flagData.projectId)
      if (!project) throw new Error("Project not found")
        const flagPayload = {
          key:flagData.key,
          name: flagData.name,
          description: flagData.description,
          data_type: flagData.dataType,
          project_id: flagData.projectId, 
          created_by:  "00000000-0000-0000-0000-000000000000",
          project_key: project.key,
        };
      await createFeatureFlag(flagPayload)
      
      console.log("Flag created successfully:", flagData)
    } catch (error) {
      console.error("Error creating flag:", error)
      alert("Failed to create flag. Please try again.")
    }
  }

  const handleCreateRule = (ruleData: {
    name: string
    conditions: RuleCondition[]
    logicalOperator: LogicalOperator
    returnValue?: any
    trafficSplits?: any[]
  }) => {
    console.log("Creating rule:", ruleData)
    setHasUnsavedChanges(true)
  }

  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule)
    setShowEditRuleModal(true)
  }

  const handleUpdateRule = (ruleId: string, updates: Partial<Rule>) => {
    console.log("Updating rule:", ruleId, updates)
    setHasUnsavedChanges(true)
  }

  const handleDeleteRule = (ruleId: string) => {
    console.log("Deleting rule:", ruleId)
    setHasUnsavedChanges(true)
  }

  const handleSaveChanges = async () => {
    if (!currentFlag || !selectedProject) return
    
    try {
      setIsSaving(true)
      const project = projects.find(p => p.id === selectedProject)
      if (!project) throw new Error("Project not found")
      
      const sdkConfig = transformFlagToSDKFormat(currentFlag)
      await saveFlagDefinition(project.key, currentFlag.key, sdkConfig)
      
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
        <Button onClick={() => setShowNewFlagModal(true)} disabled={!selectedProject}>
          <Plus className="w-4 h-4 mr-2" />
          New Flag
        </Button>
      </div>

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
                          <Switch checked={currentEnvironmentConfig?.enabled || false} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Default Value</label>
                          <div className="mt-1 p-2 bg-muted rounded text-sm font-mono">
                            {JSON.stringify(currentEnvironmentConfig?.defaultValue)}
                          </div>
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

                  {/* Traffic Splits */}
                  {currentEnvironmentConfig?.trafficSplits && currentEnvironmentConfig.trafficSplits.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Traffic Splits</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {currentEnvironmentConfig.trafficSplits.map((split, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded">
                              <div className="flex items-center gap-3">
                                <div className="w-16 text-sm font-medium">{split.percentage}%</div>
                                <div className="text-sm font-mono">{JSON.stringify(split.value)}</div>
                              </div>
                              <div
                                className="h-2 bg-primary rounded"
                                style={{ width: `${split.percentage}%`, maxWidth: "100px" }}
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
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
