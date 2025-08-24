"use client"

import type React from "react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { Team } from "../../types"

interface NewProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teams: Team[]
  onCreateProject: (project: { name: string; key: string; description: string; teamIds: string[] }) => void
}

export function NewProjectModal({ open, onOpenChange, teams, onCreateProject }: NewProjectModalProps) {
  const [name, setName] = useState("")
  const [key, setKey] = useState("")
  const [description, setDescription] = useState("")
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && key.trim()) {
      onCreateProject({
        name: name.trim(),
        key: key.trim(),
        description: description.trim(),
        teamIds: selectedTeams,
      })
      setName("")
      setKey("")
      setDescription("")
      setSelectedTeams([])
      onOpenChange(false)
    }
  }

  const handleTeamToggle = (teamId: string) => {
    setSelectedTeams((prev) => (prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]))
  }

  const generateKey = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .replace(/^_+|_+$/g, "")
  }

  const handleNameChange = (value: string) => {
    setName(value)
    // Auto-generate key if it hasn't been manually edited
    if (!key || key === generateKey(name)) {
      setKey(generateKey(value))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Add a new project to organize your feature flags and team access.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="key">Project Key</Label>
              <Input
                id="key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g., e_commerce_platform"
                required
              />
              <p className="text-xs text-muted-foreground">Used to identify this project in APIs and SDKs</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter project description"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>Assign Teams</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {teams.map((team) => (
                  <div key={team.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={team.id}
                      checked={selectedTeams.includes(team.id)}
                      onCheckedChange={() => handleTeamToggle(team.id)}
                    />
                    <Label htmlFor={team.id} className="text-sm font-normal">
                      {team.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
