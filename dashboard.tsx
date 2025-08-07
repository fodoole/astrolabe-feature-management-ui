"use client"

import { useState } from "react"
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
import { Flag, Users, Settings, FileText, CheckCircle, Database, BookOpen } from 'lucide-react'
import { ProjectOverview } from "./components/project-overview"
import { TeamManagement } from "./components/team-management"
import { AttributeManager } from "./components/attribute-manager"
import { FlagEditor } from "./components/flag-editor"
import { ChangeLog } from "./components/change-log"
import { ApprovalCenter } from "./components/approval-center"
import { FlagDashboard } from "./components/flag-dashboard"
import { GetStarted } from "./components/get-started"
import { mockData } from "./data/mock-data"
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
  const [selectedProject, setSelectedProject] = useState<string | null>(mockData.projects[0]?.id || null)
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null)

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
                      {mockData.projects.map((project) => (
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
              {activeTab !== "get-started" && selectedProject && mockData.projects.find((p) => p.id === selectedProject)?.name}
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            {activeTab === "get-started" && <GetStarted />}
            
            {activeTab === "projects" && (
              <ProjectOverview
                projects={mockData.projects}
                teams={mockData.teams}
                users={mockData.users}
                flags={mockData.flags}
                onSelectProject={setSelectedProject}
                onNavigateToFlags={() => setActiveTab("flags")}
              />
            )}
            {activeTab === "teams" && <TeamManagement teams={mockData.teams} users={mockData.users} />}
            {activeTab === "attributes" && <AttributeManager attributes={mockData.attributes} />}
            {activeTab === "flags" && (
              <FlagEditor
                projects={mockData.projects}
                flags={mockData.flags}
                attributes={mockData.attributes}
                selectedProject={selectedProject}
                selectedFlag={selectedFlag}
                onSelectFlag={setSelectedFlag}
              />
            )}
            {activeTab === "changelog" && (
              <ChangeLog
                changeLogs={mockData.changeLogs}
                projects={mockData.projects}
                users={mockData.users}
                flags={mockData.flags}
              />
            )}
            {activeTab === "approvals" && (
              <ApprovalCenter
                approvals={mockData.approvals}
                projects={mockData.projects}
                users={mockData.users}
                flags={mockData.flags}
              />
            )}

            {/* Default view - Feature Flags for selected project */}
            {activeTab === "dashboard" && (
              <FlagDashboard
                projects={mockData.projects}
                flags={mockData.flags}
                attributes={mockData.attributes}
                selectedProject={selectedProject}
                selectedFlag={selectedFlag}
                onSelectFlag={setSelectedFlag}
              />
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
