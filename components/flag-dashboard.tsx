"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Plus, Flag, Search, Eye, Settings, Activity, TrendingUp, Users } from "lucide-react"
import type { Project, FeatureFlag, GlobalAttribute, Environment } from "../types"
import { NewFlagModal } from "./modals/new-flag-modal"
import type { FlagDataType } from "../types"

interface FlagDashboardProps {
  projects: Project[]
  flags: FeatureFlag[]
  attributes: GlobalAttribute[]
  selectedProject: string | null
  selectedFlag: string | null
  onSelectFlag: (flagId: string) => void
}

export function FlagDashboard({
  projects,
  flags,
  attributes,
  selectedProject,
  selectedFlag,
  onSelectFlag,
}: FlagDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>("production")
  const [showNewFlagModal, setShowNewFlagModal] = useState(false)

  const selectedProjectData = selectedProject ? projects.find((p) => p.id === selectedProject) : null
  const projectFlags = selectedProject ? flags.filter((flag) => flag.projectId === selectedProject) : []

  const filteredFlags = projectFlags.filter(
    (flag) =>
      flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getEnvironmentStatus = (flag: FeatureFlag, environment: Environment) => {
    const envConfig = flag.environments.find((env) => env.environment === environment)
    return {
      enabled: envConfig?.enabled || false,
      hasRules: (envConfig?.rules?.length || 0) > 0,
      hasTrafficSplit: (envConfig?.trafficSplits?.length || 0) > 0,
    }
  }

  const getProjectStats = () => {
    const totalFlags = projectFlags.length
    const activeFlags = projectFlags.filter((flag) => flag.environments.some((env) => env.enabled)).length
    const productionFlags = projectFlags.filter(
      (flag) => flag.environments.find((env) => env.environment === "production")?.enabled,
    ).length
    const flagsWithRules = projectFlags.filter((flag) =>
      flag.environments.some((env) => (env.rules?.length || 0) > 0),
    ).length

    return { totalFlags, activeFlags, productionFlags, flagsWithRules }
  }

  const handleCreateFlag = async (flagData: {
    name: string
    key: string
    description: string
    dataType: FlagDataType
    projectId: string
  }) => {
    try {
      console.log("Creating flag:", flagData)
    } catch (error) {
      console.error("Failed to create flag:", error)
    }
  }

  if (!selectedProject) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Astrolabe Dashboard</h1>
          <p className="text-muted-foreground">Select a project from the dropdown above to view its feature flags</p>
        </div>

        <div className="text-center py-12">
          <Flag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No project selected</h3>
          <p className="text-muted-foreground">Choose a project to manage its feature flags</p>
        </div>
      </div>
    )
  }

  const stats = getProjectStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{selectedProjectData?.name}</h1>
          <p className="text-muted-foreground">{selectedProjectData?.description}</p>
        </div>
        <Button onClick={() => setShowNewFlagModal(true)} disabled={!selectedProject}>
          <Plus className="w-4 h-4 mr-2" />
          New Flag
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flags</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFlags}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Flags</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeFlags}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalFlags > 0 ? Math.round((stats.activeFlags / stats.totalFlags) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productionFlags}</div>
            <p className="text-xs text-muted-foreground">Live in production</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Rules</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.flagsWithRules}</div>
            <p className="text-xs text-muted-foreground">Have targeting rules</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Environment Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search flags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(["development", "staging", "production"] as Environment[]).map((env) => (
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

      {/* Feature Flags List */}
      <div className="space-y-4">
        {filteredFlags.map((flag) => {
          const envStatus = getEnvironmentStatus(flag, selectedEnvironment)
          const allEnvStatuses = {
            development: getEnvironmentStatus(flag, "development"),
            staging: getEnvironmentStatus(flag, "staging"),
            production: getEnvironmentStatus(flag, "production"),
          }

          return (
            <Card key={flag.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{flag.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {flag.dataType}
                      </Badge>
                      <Badge variant={envStatus.enabled ? "default" : "secondary"}>
                        {selectedEnvironment}: {envStatus.enabled ? "ON" : "OFF"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">{flag.key}</code>
                      {envStatus.hasRules && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Users className="w-3 h-3" />
                          Rules
                        </Badge>
                      )}
                      {envStatus.hasTrafficSplit && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Split
                        </Badge>
                      )}
                    </div>
                    {flag.description && <CardDescription>{flag.description}</CardDescription>}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Enabled</span>
                      <Switch checked={envStatus.enabled} />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onSelectFlag(flag.id)}>
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Environment Status Overview */}
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(allEnvStatuses).map(([env, status]) => (
                      <div key={env} className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">
                          {env.charAt(0).toUpperCase() + env.slice(1)}
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${status.enabled ? "bg-green-500" : "bg-gray-300"}`} />
                          <span className="text-xs">{status.enabled ? "ON" : "OFF"}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Current Environment Details */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">
                        {selectedEnvironment.charAt(0).toUpperCase() + selectedEnvironment.slice(1)} Configuration
                      </h4>
                      <Button variant="ghost" size="sm" onClick={() => onSelectFlag(flag.id)}>
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>

                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Default Value:</span>
                        <code className="text-xs bg-muted px-1 rounded">
                          {JSON.stringify(
                            flag.environments.find((e) => e.environment === selectedEnvironment)?.defaultValue,
                          )}
                        </code>
                      </div>

                      {envStatus.hasRules && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Targeting Rules:</span>
                          <span className="text-xs">
                            {flag.environments.find((e) => e.environment === selectedEnvironment)?.rules?.length || 0}{" "}
                            active
                          </span>
                        </div>
                      )}

                      {envStatus.hasTrafficSplit && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Traffic Split:</span>
                          <span className="text-xs">
                            {flag.environments.find((e) => e.environment === selectedEnvironment)?.trafficSplits
                              ?.length || 0}{" "}
                            variants
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filteredFlags.length === 0 && (
          <div className="text-center py-12">
            {searchQuery ? (
              <>
                <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No flags found</h3>
                <p className="text-muted-foreground">No feature flags match your search criteria</p>
              </>
            ) : (
              <>
                <Flag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No feature flags yet</h3>
                <p className="text-muted-foreground mb-4">Create your first feature flag to get started</p>
                <Button onClick={() => setShowNewFlagModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Flag
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      {selectedProject && (
        <NewFlagModal
          open={showNewFlagModal}
          onOpenChange={setShowNewFlagModal}
          projectId={selectedProject}
          onCreateFlag={handleCreateFlag}
        />
      )}
    </div>
  )
}
