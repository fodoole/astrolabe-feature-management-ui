"use client"

import { useState } from "react"
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
import type { Team, User, UserRole } from "../../types"

interface ManageTeamModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team: Team | null
  users: User[]
  onUpdateTeam: (teamId: string, updates: Partial<Team>) => void
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

  if (!team) return null

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getUserById = (userId: string) => users.find((user) => user.id === userId)

  const availableUsers = users.filter((user) => !team.members.some((member) => member.userId === user.id))

  const handleAddMember = () => {
    if (selectedUserId && selectedRole) {
      const updatedMembers = [...team.members, { userId: selectedUserId, role: selectedRole }]
      onUpdateTeam(team.id, { members: updatedMembers })
      setSelectedUserId("")
      setSelectedRole("viewer")
    }
  }

  const handleRemoveMember = (userId: string) => {
    const updatedMembers = team.members.filter((member) => member.userId !== userId)
    onUpdateTeam(team.id, { members: updatedMembers })
  }

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    const updatedMembers = team.members.map((member) =>
      member.userId === userId ? { ...member, role: newRole } : member,
    )
    onUpdateTeam(team.id, { members: updatedMembers })
  }

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
              {team.members.map((member) => {
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
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
