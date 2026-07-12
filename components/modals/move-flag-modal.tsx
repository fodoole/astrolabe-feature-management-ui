"use client"

import type React from "react"

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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowRightLeft } from "lucide-react"
import type { FeatureFlag, Project } from "../../types"

interface MoveFlagModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flag: FeatureFlag | null
  projects: Project[]
  onConfirmMove: (targetProjectId: string) => Promise<void> | void
  isMoving?: boolean
}

export function MoveFlagModal({
  open,
  onOpenChange,
  flag,
  projects,
  onConfirmMove,
  isMoving = false,
}: MoveFlagModalProps) {
  const [targetProjectId, setTargetProjectId] = useState("")

  useEffect(() => {
    if (open) setTargetProjectId("")
  }, [open, flag?.id])

  if (!flag) return null

  const currentProject = projects.find((p) => p.id === flag.projectId)
  // Only offer projects other than the one the flag currently lives in.
  const targetProjects = projects.filter((p) => p.id !== flag.projectId)
  const targetProject = projects.find((p) => p.id === targetProjectId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetProjectId || isMoving) return
    await onConfirmMove(targetProjectId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Move Feature Flag
          </DialogTitle>
          <DialogDescription>
            Move <strong>{flag.name}</strong> to a different project. Its stored
            definition and approval history move with it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Current project</Label>
              <p className="text-sm text-muted-foreground">
                {currentProject ? currentProject.name : "Unknown"}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="target-project">Move to project</Label>
              <Select
                value={targetProjectId}
                onValueChange={setTargetProjectId}
              >
                <SelectTrigger id="target-project">
                  <SelectValue placeholder="Select a destination project" />
                </SelectTrigger>
                <SelectContent>
                  {targetProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {targetProjects.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No other projects are available to move this flag to.
                </p>
              )}
            </div>

            {targetProject && (
              <Alert className="border-amber-200 bg-amber-50">
                <ArrowRightLeft className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Confirm moving <strong>{flag.name}</strong> from{" "}
                  <strong>{currentProject?.name ?? "its current project"}</strong>{" "}
                  to <strong>{targetProject.name}</strong>. If a flag with the
                  key <code>{flag.key}</code> already exists in{" "}
                  {targetProject.name}, the move will be rejected.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isMoving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!targetProjectId || isMoving}>
              {isMoving ? "Moving..." : "Move Flag"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
