"use client"

import { useState, useEffect } from "react"
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
import { ProjectOverview } from "./components/project-overview"
import { TeamManagement } from "./components/team-management"
import { AttributeManager } from "./components/attribute-manager"
import { FlagEditor } from "./components/flag-editor"
import { ChangeLog } from "./components/change-log"
import { ApprovalCenter } from "./components/approval-center"
import { FlagDashboard } from "./components/flag-dashboard"
import { GetStarted } from "./components/get-started"
import { 
  fetchUsers,
  fetchTeams,
  fetchProjects,
  fetchFeatureFlags,
  fetchGlobalAttributes,
  fetchApprovals
} from "./lib/api-services"
import type { User, Team, Project, FeatureFlag, GlobalAttribute, ApprovalRequest } from "./types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AstrolabeHeader } from "./components/astrolabe-header"

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: Flag },
  { id: "get-started", label: "Get Started", icon: BookOpen },
  { id: "projects", label: "Projects", icon: Flag },
  { id: "teams", label: "Teams", icon: Users },
  { id: "attributes", label: "Attributes", icon: Database },
  { id: "flags", label: "Flag Editor", icon: Settings },
  { id: "changelog", label: "Change Log", icon: FileText },
  { id: "approvals", label: "Approvals", icon: CheckCircle },
]

export default function FeatureFlagDashboard() {
  const [activeTab, setActiveTab] = useState("get-started")
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([])
  const [globalAttributes, setGlobalAttributes] = useState<GlobalAttribute[]>([])
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [
          usersData,
          teamsData,
          projectsData,
          attributesData,
          approvalsData
        ] = await Promise.all([
          fetchUsers(),
          fetchTeams(),
          fetchProjects(),
          fetchGlobalAttributes(),
          fetchApprovals()
        ])
        
        setUsers(usersData)
        setTeams(teamsData)
        setProjects(projectsData)
        setGlobalAttributes(attributesData)
        setApprovals(approvalsData)
        
        if (projectsData.length > 0 && !selectedProject) {
          setSelectedProject(projectsData[0].id)
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

  useEffect(() => {
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
    
    loadFeatureFlags()
  }, [selectedProject, projects])

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
                  <SidebarMenuButton onClick={() => setActiveTab(item.id)} isActive={activeTab === item.id}>
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
              {activeTab !== "get-started" && (
                <>
                  <div className="h-4 w-px bg-border" />
                  <Select value={selectedProject || ""} onValueChange={setSelectedProject}>
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
              {activeTab !== "get-started" && selectedProject && projects.find((p) => p.id === selectedProject)?.name}
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
                    onSelectProject={setSelectedProject}
                    onNavigateToFlags={() => setActiveTab("flags")}
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
                    onSelectFlag={setSelectedFlag}
                  />
                )}
                {activeTab === "changelog" && (
                  <ChangeLog
                    changeLogs={[]}
                    projects={projects}
                    users={users}
                    flags={featureFlags}
                  />
                )}
                {activeTab === "approvals" && (
                  <ApprovalCenter
                    approvals={approvals}
                    projects={projects}
                    users={users}
                    flags={featureFlags}
                    currentUserId="00000000-0000-0000-0000-000000000000"
                    onApprovalsChange={setApprovals}
                  />
                )}

                {activeTab === "dashboard" && (
                  <FlagDashboard
                    projects={projects}
                    flags={featureFlags}
                    attributes={globalAttributes}
                    selectedProject={selectedProject}
                    selectedFlag={selectedFlag}
                    onSelectFlag={setSelectedFlag}
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
