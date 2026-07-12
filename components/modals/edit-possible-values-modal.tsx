"use client"

import type React from "react"

import { useEffect, useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import type { GlobalAttribute } from "../../types"

interface EditPossibleValuesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attribute: GlobalAttribute | null
  onSave: (possibleValues: string[]) => void | Promise<void>
}

export function EditPossibleValuesModal({ open, onOpenChange, attribute, onSave }: EditPossibleValuesModalProps) {
  const [possibleValues, setPossibleValues] = useState<string[]>([])
  const [newValue, setNewValue] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setPossibleValues(attribute?.possibleValues || [])
      setNewValue("")
    }
  }, [open, attribute])

  const handleAddValue = () => {
    if (newValue.trim() && !possibleValues.includes(newValue.trim())) {
      setPossibleValues([...possibleValues, newValue.trim()])
      setNewValue("")
    }
  }

  const handleRemoveValue = (value: string) => {
    setPossibleValues(possibleValues.filter((v) => v !== value))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddValue()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave(possibleValues)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Possible Values</DialogTitle>
          <DialogDescription>
            Suggested values for <strong>{attribute?.name}</strong> when building flag rules. These are hints only and
            do not restrict what can be entered.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-2 py-4">
            <Label>Possible Values</Label>
            <div className="flex gap-2">
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a possible value"
              />
              <Button type="button" onClick={handleAddValue} disabled={!newValue.trim()}>
                Add
              </Button>
            </div>
            {possibleValues.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {possibleValues.map((value) => (
                  <Badge key={value} variant="secondary" className="gap-1">
                    {value}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => handleRemoveValue(value)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Values"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
