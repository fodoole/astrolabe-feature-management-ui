"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Users, Flag, Activity } from "lucide-react"
import { useState } from "react"
import { NewProjectModal } from "./modals/new-project-modal"
import { createProject } from "../lib/api-services"
import type { Project, Team, User, FeatureFlag } from "../types"

interface ProjectOverviewProps {
  projects: Project[]
  teams: Team[]
  users: User[]
  flags: FeatureFlag[]
  onSelectProject: (projectId: string) => void
  onNavigateToFlags?: () => void
  onProjectsChange?: (projects: Project[]) => void
}

export function ProjectOverview({
  projects,
  teams,
  users,
  flags,
  onSelectProject,
  onNavigateToFlags,
  onProjectsChange,
}: ProjectOverviewProps) {
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)

  const getProjectStats = (projectId: string) => {
    const projectFlags = flags.filter((flag) => flag.projectId === projectId)
    const activeFlags = projectFlags.filter((flag) => flag.environments.some((env) => env.enabled))
    return {
      totalFlags: projectFlags.length,
      activeFlags: activeFlags.length,
    }
  }

  const getProjectTeams = (teamIds: string[]) => {
    return teams.filter((team) => teamIds.includes(team.id))
  }

  const handleProjectClick = (projectId: string) => {
    onSelectProject(projectId)
    // Navigate to flag editor - we'll need to pass this function from the parent
    onNavigateToFlags?.()
  }

  const handleCreateProject = async (projectData: { name: string; key: string; description: string; teamIds: string[] }) => {
    try {
      const newProject = await createProject({
        name: projectData.name,
        key: projectData.key,
        description: projectData.description,
        teamIds: projectData.teamIds
      })
      
      if (onProjectsChange) {
        onProjectsChange([...projects, newProject])
      }
      
      setShowNewProjectModal(false)
    } catch (error) {
      console.error("Failed to create project:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your Astrolabe projects</p>
        </div>
        <Button onClick={() => setShowNewProjectModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const stats = getProjectStats(project.id)
          const projectTeams = getProjectTeams(project.teamIds)

          return (
            <Card
              key={project.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleProjectClick(project.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{project.key}</code>
                  </div>
                  <Badge variant="outline">
                    <Activity className="w-3 h-3 mr-1" />
                    {stats.activeFlags}/{stats.totalFlags}
                  </Badge>
                </div>
                <CardDescription>{project.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      <span>Feature Flags</span>
                    </div>
                    <span className="font-medium">{stats.totalFlags}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Teams</span>
                    </div>
                    <span className="font-medium">{projectTeams.length}</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {projectTeams.map((team) => (
                      <Badge key={team.id} variant="secondary" className="text-xs">
                        {team.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <Flag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-4">Create your first project to get started with Astrolabe</p>
          <Button onClick={() => setShowNewProjectModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>
      )}

      <NewProjectModal
        open={showNewProjectModal}
        onOpenChange={setShowNewProjectModal}
        teams={teams}
        onCreateProject={handleCreateProject}
      />
    </div>
  )
}
