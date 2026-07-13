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
import type { FeatureFlag } from "../../types"

interface DeleteFlagModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flag: FeatureFlag | null
  onConfirmDelete: () => Promise<void> | void
  isDeleting?: boolean
}

export function DeleteFlagModal({
  open,
  onOpenChange,
  flag,
  onConfirmDelete,
  isDeleting = false,
}: DeleteFlagModalProps) {
  const [confirmName, setConfirmName] = useState("")

  // Reset the typed confirmation whenever the dialog opens or the target changes.
  useEffect(() => {
    if (open) setConfirmName("")
  }, [open, flag?.id])

  if (!flag) return null

  const matches = confirmName.trim() === flag.name

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
            Delete Feature Flag
          </DialogTitle>
          <DialogDescription>
            This permanently deletes the flag, its stored definition, and its
            approval history. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                You are about to delete <strong>{flag.name}</strong>
                {flag.key ? (
                  <>
                    {" "}
                    (<code>{flag.key}</code>)
                  </>
                ) : null}
                .
              </AlertDescription>
            </Alert>

            <div className="grid gap-2">
              <Label htmlFor="confirm-flag-name">
                Type <strong>{flag.name}</strong> to confirm
              </Label>
              <Input
                id="confirm-flag-name"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={flag.name}
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
              {isDeleting ? "Deleting..." : "Delete Flag"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
