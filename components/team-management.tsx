"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, Settings } from "lucide-react"
import type { Team, User } from "../types"
import { NewTeamModal } from "./modals/new-team-modal"
import { ManageTeamModal } from "./modals/manage-team-modal"

interface TeamManagementProps {
  teams: Team[]
  users: User[]
}

export function TeamManagement({ teams, users }: TeamManagementProps) {
  const [showNewTeamModal, setShowNewTeamModal] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [managingTeam, setManagingTeam] = useState<Team | null>(null)

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
          <p className="text-muted-foreground">Manage your organization teams</p>
        </div>
        <Button onClick={() => setShowNewTeamModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Team
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <Card key={team.id} className="hover:shadow-md transition-shadow">
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
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Team created and ready for project assignments</div>
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
