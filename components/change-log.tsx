"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FileText, Search, Calendar } from "lucide-react"
import type { ChangeLog as ChangeLogType, Project, User as UserType, FeatureFlag } from "../types"

interface ChangeLogProps {
  changeLogs: ChangeLogType[]
  projects: Project[]
  users: UserType[]
  flags: FeatureFlag[]
}

export function ChangeLog({ changeLogs, projects, users, flags }: ChangeLogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<string>("all")

  const getUserById = (userId: string) => users.find((user) => user.id === userId)
  const getProjectById = (projectId: string) => projects.find((project) => project.id === projectId)
  const getFlagById = (flagId: string) => flags.find((flag) => flag.id === flagId)
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()

  const filteredLogs = changeLogs.filter((log) => {
    const user = getUserById(log.userId)
    const project = getProjectById(log.projectId)
    const flag = getFlagById(log.flagId)

    const matchesSearch =
      searchQuery === "" ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag?.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesProject = selectedProject === "all" || log.projectId === selectedProject
    const matchesUser = selectedUser === "all" || log.userId === selectedUser

    return matchesSearch && matchesProject && matchesUser
  })

  const sortedLogs = filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Change Log</h1>
          <p className="text-muted-foreground">Track all changes to your flags</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search changes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {sortedLogs.map((log) => {
          const user = getUserById(log.userId)
          const project = getProjectById(log.projectId)
          const flag = getFlagById(log.flagId)

          return (
            <Card key={log.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="text-sm">{user ? getInitials(user.name) : "??"}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{user?.name}</span>
                      <span className="text-muted-foreground">•</span>
                      <Badge variant="outline">{log.action}</Badge>
                      {log.environment && <Badge variant="secondary">{log.environment}</Badge>}
                      <span className="text-muted-foreground">•</span>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {log.timestamp.toLocaleDateString()} {log.timestamp.toLocaleTimeString()}
                      </div>
                    </div>

                    <div className="text-sm">
                      <span className="text-muted-foreground">Flag:</span>{" "}
                      <span className="font-medium">{flag?.name}</span>
                      <span className="text-muted-foreground"> in </span>
                      <span className="font-medium">{project?.name}</span>
                    </div>

                    {log.description && <p className="text-sm text-muted-foreground">{log.description}</p>}

                    {(log.beforeSnapshot || log.afterSnapshot) && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          View change details
                        </summary>
                        <div className="mt-2 space-y-2 bg-muted rounded p-3">
                          {log.beforeSnapshot && (
                            <div>
                              <div className="font-medium text-muted-foreground mb-1">Before:</div>
                              <pre className="text-xs overflow-auto">{JSON.stringify(log.beforeSnapshot, null, 2)}</pre>
                            </div>
                          )}
                          {log.afterSnapshot && (
                            <div>
                              <div className="font-medium text-muted-foreground mb-1">After:</div>
                              <pre className="text-xs overflow-auto">{JSON.stringify(log.afterSnapshot, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {sortedLogs.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No changes found</h3>
            <p className="text-muted-foreground">Changes to your flags will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}
