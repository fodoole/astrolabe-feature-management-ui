"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Crown, Edit, Eye } from "lucide-react"
import type { Team, User, UserRole, Role, TeamMember } from "../../types"
import { fetchRoles } from "../../lib/api-services"

interface ManageTeamModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team: Team | null
  users: User[]
  onUpdateTeam: (teamId: string, updates: Partial<Team> | { upserts: Array<{user_id: string, role_id: string}>, removes: string[] }) => void
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

export function ManageTeamModal({ open, onOpenChange, team, users, onUpdateTeam }: ManageTeamModalProps) {
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedRole, setSelectedRole] = useState<UserRole>("viewer")
  const [roles, setRoles] = useState<Role[]>([])
  const [originalMembers, setOriginalMembers] = useState<TeamMember[]>([])
  const [currentMembers, setCurrentMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && team) {
      setOriginalMembers([...team.members])
      setCurrentMembers([...team.members])
      
      const loadRoles = async () => {
        try {
          const fetchedRoles = await fetchRoles()
          setRoles(fetchedRoles)
        } catch (error) {
          console.error('Failed to fetch roles:', error)
        }
      }
      loadRoles()
    }
  }, [open, team])

  if (!team) return null

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getUserById = (userId: string) => users.find((user) => user.id === userId)

  const availableUsers = users.filter((user) => !currentMembers.some((member: TeamMember) => member.userId === user.id))

  const getRoleIdByName = (roleName: UserRole): string => {
    const role = roles.find(r => r.name.toLowerCase() === roleName.toLowerCase())
    return role?.id || ""
  }

  const handleAddMember = () => {
    if (selectedUserId && selectedRole) {
      const updatedMembers = [...currentMembers, { userId: selectedUserId, role: selectedRole }]
      setCurrentMembers(updatedMembers)
      setSelectedUserId("")
      setSelectedRole("viewer")
    }
  }

  const handleRemoveMember = (userId: string) => {
    const updatedMembers = currentMembers.filter((member: TeamMember) => member.userId !== userId)
    setCurrentMembers(updatedMembers)
  }

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    const updatedMembers = currentMembers.map((member: TeamMember) =>
      member.userId === userId ? { ...member, role: newRole } : member,
    )
    setCurrentMembers(updatedMembers)
  }

  const handleDone = async () => {
    setIsLoading(true)
    try {
      const currentMemberIds = new Set(currentMembers.map((m: TeamMember) => m.userId))
      
      const upserts = currentMembers.map((member: TeamMember) => ({
        user_id: member.userId,
        role_id: getRoleIdByName(member.role)
      })).filter(upsert => upsert.role_id)
      
      const removes = originalMembers
        .filter((member: TeamMember) => !currentMemberIds.has(member.userId))
        .map((member: TeamMember) => member.userId)
      
      await onUpdateTeam(team.id, { upserts, removes })
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to update team members:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const hasChanges = JSON.stringify(originalMembers) !== JSON.stringify(currentMembers)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Team: {team.name}</DialogTitle>
          <DialogDescription>Add or remove team members and manage their roles.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Members */}
          <div>
            <Label className="text-sm font-medium">Current Members</Label>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {currentMembers.map((member) => {
                const user = getUserById(member.userId)
                const RoleIcon = roleIcons[member.role]

                return (
                  <div key={member.userId} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">{user ? getInitials(user.name) : "??"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{user?.name}</div>
                        <div className="text-xs text-muted-foreground">{user?.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(value: UserRole) => handleRoleChange(member.userId, value)}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={() => handleRemoveMember(member.userId)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Add New Member */}
          {availableUsers.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Add New Member</Label>
              <div className="mt-2 flex gap-2">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddMember} disabled={!selectedUserId}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDone} disabled={!hasChanges || isLoading}>
            {isLoading ? "Saving..." : "Done"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
