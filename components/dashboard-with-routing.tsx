"use client"
// Helper to convert null to undefined for updateURL
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCurrentUser } from "../hooks/useCurrentUser"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Flag, Users, Settings, FileText, CheckCircle, Database, BookOpen } from 'lucide-react'
import { ProjectOverview } from "./project-overview"
import { TeamManagement } from "./team-management"
import { AttributeManager } from "./attribute-manager"
import { FlagEditor } from "./flag-editor"
import { ChangeLog } from "./change-log"
import { ApprovalCenter } from "./approval-center"
import { FlagDashboard } from "./flag-dashboard"
import { GetStarted } from "./get-started"
import {
  fetchUsers,
  fetchTeams,
  fetchTeamsByProject,
  fetchProjects,
  fetchFeatureFlags,
  fetchGlobalAttributes,
  fetchApprovals
} from "../lib/api-services"
import type { User, Team, Project, FeatureFlag, GlobalAttribute, ApprovalRequest } from "../types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AstrolabeHeader } from "./astrolabe-header"

const navigationItems = [
  // { id: "dashboard", label: "Dashboard", icon: Flag },
  { id: "get-started", label: "Get Started", icon: BookOpen },
  { id: "projects", label: "Projects", icon: Flag },
  { id: "teams", label: "Teams", icon: Users },
  { id: "attributes", label: "Attributes", icon: Database },
  { id: "flags", label: "Flag Editor", icon: Settings },
  { id: "approvals", label: "Change Requests", icon: CheckCircle },
]

interface DashboardWithRoutingProps {
  searchParams: {
    tab?: string
    project?: string
    flag?: string
  }
}

export default function DashboardWithRouting({ searchParams }: DashboardWithRoutingProps) {
  const { userId } = useCurrentUser()
  const router = useRouter()
  const currentSearchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState(searchParams.tab || "get-started")
  const [selectedProject, setSelectedProject] = useState<string | null>(searchParams.project || null)
  const [selectedFlag, setSelectedFlag] = useState<string | null>(searchParams.flag || null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [projectTeams, setProjectTeams] = useState<Team[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([])
  const [globalAttributes, setGlobalAttributes] = useState<GlobalAttribute[]>([])
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  // User filter state for ApprovalCenter
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Update URL when tab or project changes
  const updateURL = (newTab?: string, newProject?: string, newFlag?: string) => {
    const params = new URLSearchParams(currentSearchParams.toString())

    if (newTab !== undefined) {
      if (newTab) {
        params.set('tab', newTab)
      } else {
        params.delete('tab')
      }
    }

    if (newProject !== undefined) {
      if (newProject) {
        params.set('project', newProject)
      } else {
        params.delete('project')
      }
    }

    if (newFlag !== undefined) {
      if (newFlag) {
        params.set('flag', newFlag)
      } else {
        params.delete('flag')
      }
    }

    const newURL = params.toString() ? `/?${params.toString()}` : '/'
    router.push(newURL, { scroll: false })
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    updateURL(tabId, nullToUndefined(selectedProject), nullToUndefined(selectedFlag))
  }

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId)
    updateURL(activeTab, nullToUndefined(projectId), nullToUndefined(selectedFlag))
  }

  const handleFlagChange = (flagId: string | null) => {
    setSelectedFlag(flagId)
    updateURL(activeTab, nullToUndefined(selectedProject), nullToUndefined(flagId))
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [
          usersData,
          teamsData,
          projectsData,
          attributesData
        ] = await Promise.all([
          fetchUsers(),
          fetchTeams(),
          fetchProjects(),
          fetchGlobalAttributes()
        ])

        setUsers(usersData)
        setTeams(teamsData)
        setProjects(projectsData)
        setGlobalAttributes(attributesData)

        // Set default project if none selected and projects exist
        if (projectsData.length > 0 && !selectedProject) {
          const defaultProject = projectsData[0].id
          setSelectedProject(defaultProject)
          updateURL(activeTab, nullToUndefined(defaultProject), nullToUndefined(selectedFlag))
        }
      } catch (err) {
        console.error('Failed to load data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const loadFeatureFlags = async () => {
    if (selectedProject) {
      try {
        const project = projects.find(p => p.id === selectedProject)
        const flagsData = await fetchFeatureFlags(project?.key)
        setFeatureFlags(flagsData)
      } catch (err) {
        console.error('Failed to load feature flags:', err)
      }
    }
  }

  useEffect(() => {
    loadFeatureFlags()
  }, [selectedProject, projects])

  useEffect(() => {
    const loadProjectTeams = async () => {
      if (selectedProject) {
        try {
          const projectTeamsData = await fetchTeamsByProject(selectedProject, true)
          setProjectTeams(projectTeamsData)
        } catch (err) {
          console.error('Failed to load project teams:', err)
        }
      } else {
        setProjectTeams([])
      }
    }

    loadProjectTeams()
  }, [selectedProject])

  useEffect(() => {
    const loadApprovals = async () => {
      try {
        const approvalsData = await fetchApprovals(undefined, selectedProject || undefined)
        setApprovals(approvalsData)
      } catch (err) {
        console.error('Failed to load approvals:', err)
      }
    }

    if (activeTab === "approvals" || activeTab === "dashboard") {
      loadApprovals()
    }
  }, [activeTab, selectedProject])

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <AstrolabeHeader />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton onClick={() => handleTabChange(item.id)} isActive={activeTab === item.id}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              {activeTab !== "get-started" && activeTab !== "projects" && activeTab !== "teams" && (
                <>
                  <div className="h-4 w-px bg-border" />
                  <Select value={selectedProject || ""} onValueChange={handleProjectChange}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {activeTab !== "get-started" && activeTab !== "projects" && activeTab !== "teams" && selectedProject && projects.find((p) => p.id === selectedProject)?.name}
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-destructive mb-4">Error: {error}</p>
                  <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
              </div>
            )}
            {!loading && !error && (
              <>
                {activeTab === "get-started" && <GetStarted />}

                {activeTab === "projects" && (
                  <ProjectOverview
                    projects={projects}
                    teams={teams}
                    users={users}
                    flags={featureFlags}
                    onSelectProject={handleProjectChange}
                    onNavigateToFlags={() => handleTabChange("flags")}
                    onProjectsChange={setProjects}
                  />
                )}
                {activeTab === "teams" && <TeamManagement teams={teams} users={users} onTeamsChange={setTeams} />}
                {activeTab === "attributes" && <AttributeManager attributes={globalAttributes} onAttributesChange={setGlobalAttributes} />}
                {activeTab === "flags" && (
                  <FlagEditor
                    projects={projects}
                    flags={featureFlags}
                    attributes={globalAttributes}
                    selectedProject={selectedProject}
                    selectedFlag={selectedFlag}
                    onSelectFlag={handleFlagChange}
                    onFlagsChange={loadFeatureFlags}
                  />
                )}
                {activeTab === "approvals" && (
                  <ApprovalCenter
                    approvals={approvals}
                    projects={projects}
                    users={users}
                    flags={featureFlags}
                    currentUserId={userId || undefined}
                    onApprovalsChange={setApprovals}
                    selectedProject={selectedProject || undefined}
                    selectedUser={selectedUser || undefined}
                    onUserChange={setSelectedUser}
                  />
                )}

                {activeTab === "dashboard" && (
                  <FlagDashboard
                    projects={projects}
                    flags={featureFlags}
                    attributes={globalAttributes}
                    approvals={approvals}
                    selectedProject={selectedProject}
                    selectedFlag={selectedFlag}
                    onSelectFlag={handleFlagChange}
                  />
                )}
              </>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
