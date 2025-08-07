"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Users, Crown, Edit, Eye } from "lucide-react"
import type { Team, User } from "../types"
import { NewTeamModal } from "./modals/new-team-modal"
import { ManageTeamModal } from "./modals/manage-team-modal"

interface TeamManagementProps {
  teams: Team[]
  users: User[]
}

const roleIcons = {
  owner: Crown,
  editor: Edit,
  viewer: Eye,
}

const roleColors = {
  owner: "destructive" as const,
  editor: "default" as const,
  viewer: "secondary" as const,
}

export function TeamManagement({ teams, users }: TeamManagementProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [showNewTeamModal, setShowNewTeamModal] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [managingTeam, setManagingTeam] = useState<Team | null>(null)

  const getUserById = (userId: string) => {
    return users.find((user) => user.id === userId)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleCreateTeam = (teamData: { name: string }) => {
    console.log("Creating team:", teamData)
    // In a real app, this would make an API call
  }

  const handleUpdateTeam = (teamId: string, updates: Partial<Team>) => {
    console.log("Updating team:", teamId, updates)
    // In a real app, this would make an API call
  }

  const handleManageTeam = (team: Team) => {
    setManagingTeam(team)
    setShowManageModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground">Manage team members and their permissions</p>
        </div>
        <Button onClick={() => setShowNewTeamModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Team
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {teams.map((team) => (
          <Card key={team.id} className={selectedTeam === team.id ? "ring-2 ring-primary" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {team.name}
                  </CardTitle>
                  <CardDescription>
                    {team.members.length} member{team.members.length !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleManageTeam(team)}>
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {team.members.map((member) => {
                  const user = getUserById(member.userId)
                  const roleIcon = roleIcons[member.role]

                  return (
                    <div key={member.userId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">{user ? getInitials(user.name) : "??"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{user?.name}</div>
                          <div className="text-xs text-muted-foreground">{user?.email}</div>
                        </div>
                      </div>
                      <Badge variant={roleColors[member.role]} className="gap-1">
                        {roleIcon && <roleIcon className="w-3 h-3" />}
                        {member.role}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No teams yet</h3>
          <p className="text-muted-foreground mb-4">Create your first team to organize access to your flags</p>
          <Button onClick={() => setShowNewTeamModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        </div>
      )}

      <NewTeamModal open={showNewTeamModal} onOpenChange={setShowNewTeamModal} onCreateTeam={handleCreateTeam} />

      <ManageTeamModal
        open={showManageModal}
        onOpenChange={setShowManageModal}
        team={managingTeam}
        users={users}
        onUpdateTeam={handleUpdateTeam}
      />
    </div>
  )
}
