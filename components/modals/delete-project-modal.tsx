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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import type { Project } from "../../types"

interface DeleteProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
  flagCount: number
  onConfirmDelete: () => Promise<void> | void
  isDeleting?: boolean
}

export function DeleteProjectModal({
  open,
  onOpenChange,
  project,
  flagCount,
  onConfirmDelete,
  isDeleting = false,
}: DeleteProjectModalProps) {
  const [confirmName, setConfirmName] = useState("")

  useEffect(() => {
    if (open) setConfirmName("")
  }, [open, project?.id])

  if (!project) return null

  const matches = confirmName.trim() === project.name

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!matches || isDeleting) return
    await onConfirmDelete()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Delete Project
          </DialogTitle>
          <DialogDescription>
            This permanently deletes the project and everything scoped to it. This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Deleting <strong>{project.name}</strong>
                {project.key ? (
                  <>
                    {" "}
                    (<code>{project.key}</code>)
                  </>
                ) : null}{" "}
                will also delete its{" "}
                <strong>
                  {flagCount} feature flag{flagCount === 1 ? "" : "s"}
                </strong>
                , along with their definitions, global attributes, and approval
                history.
              </AlertDescription>
            </Alert>

            <div className="grid gap-2">
              <Label htmlFor="confirm-project-name">
                Type <strong>{project.name}</strong> to confirm
              </Label>
              <Input
                id="confirm-project-name"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={project.name}
                autoComplete="off"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!matches || isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
