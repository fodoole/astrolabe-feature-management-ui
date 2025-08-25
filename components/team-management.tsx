"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, Settings } from "lucide-react"
import type { Team, User } from "../types"
import { NewTeamModal } from "./modals/new-team-modal"
import { ManageTeamModal } from "./modals/manage-team-modal"
import { createTeam, updateTeam, updateTeamMembers } from "../lib/api-services"
import { handleApiError, showSuccessToast } from "../lib/toast-utils"

interface TeamManagementProps {
  teams: Team[]
  users: User[]
  onTeamsChange?: (teams: Team[]) => void
}

export function TeamManagement({ teams, users, onTeamsChange }: TeamManagementProps) {
  const [showNewTeamModal, setShowNewTeamModal] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [managingTeam, setManagingTeam] = useState<Team | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleCreateTeam = async (teamData: { name: string }) => {
    setIsCreating(true)
    try {
      const newTeam = await createTeam(teamData)
      const updatedTeams = [...teams, newTeam]
      onTeamsChange?.(updatedTeams)
      setShowNewTeamModal(false)
      showSuccessToast('Team created successfully!')
    } catch (error) {
      handleApiError(error, 'Failed to create team')
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateTeam = async (teamId: string, updates: Partial<Team> | { upserts: Array<{user_id: string, role_id: string}>, removes: string[] }) => {
    setIsUpdating(true)
    try {
      if ('upserts' in updates || 'removes' in updates) {
        const updatedTeam = await updateTeamMembers(teamId, updates as { upserts: Array<{user_id: string, role_id: string}>, removes: string[] })
        const updatedTeams = teams.map(team => 
          team.id === teamId ? { ...team, members: updatedTeam.members } : team
        )
        onTeamsChange?.(updatedTeams)
      } else if (updates.name && !updates.members) {
        const updatedTeam = await updateTeam(teamId, { name: updates.name })
        const updatedTeams = teams.map(team => 
          team.id === teamId ? { ...team, name: updatedTeam.name } : team
        )
        onTeamsChange?.(updatedTeams)
      }
      else if (updates.members) {
        const currentTeam = teams.find(team => team.id === teamId)
        if (!currentTeam) throw new Error("Team not found")
        
        const currentMemberIds = new Set(currentTeam.members.map(m => m.userId))
        const newMemberIds = new Set(updates.members.map(m => m.userId))
        
        const upserts = updates.members.map(member => ({
          user_id: member.userId,
          role_id: member.role
        }))
        
        const removes = currentTeam.members
          .filter(member => !newMemberIds.has(member.userId))
          .map(member => member.userId)
        
        const updatedTeam = await updateTeamMembers(teamId, { upserts, removes })
        const updatedTeams = teams.map(team => 
          team.id === teamId ? { ...team, members: updatedTeam.members } : team
        )
        onTeamsChange?.(updatedTeams)
      }
      
      setShowManageModal(false)
      showSuccessToast('Team updated successfully!')
    } catch (error) {
      handleApiError(error, 'Failed to update team')
    } finally {
      setIsUpdating(false)
    }
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
        <Button onClick={() => setShowNewTeamModal(true)} disabled={isCreating}>
          <Plus className="w-4 h-4 mr-2" />
          {isCreating ? "Creating..." : "New Team"}
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
          <Button onClick={() => setShowNewTeamModal(true)} disabled={isCreating}>
            <Plus className="w-4 h-4 mr-2" />
            {isCreating ? "Creating..." : "Create Team"}
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
