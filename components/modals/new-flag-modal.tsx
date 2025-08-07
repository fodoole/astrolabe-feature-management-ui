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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FlagDataType } from "../../types"

interface NewFlagModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onCreateFlag: (flag: {
    name: string
    key: string
    description: string
    dataType: FlagDataType
    projectId: string
  }) => void
}

export function NewFlagModal({ open, onOpenChange, projectId, onCreateFlag }: NewFlagModalProps) {
  const [name, setName] = useState("")
  const [key, setKey] = useState("")
  const [description, setDescription] = useState("")
  const [dataType, setDataType] = useState<FlagDataType>("boolean")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && key.trim()) {
      onCreateFlag({
        name: name.trim(),
        key: key.trim(),
        description: description.trim(),
        dataType,
        projectId,
      })
      setName("")
      setKey("")
      setDescription("")
      setDataType("boolean")
      onOpenChange(false)
    }
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
    if (!key || key === generateKey(name)) {
      setKey(generateKey(value))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Feature Flag</DialogTitle>
          <DialogDescription>Add a new feature flag to control functionality in your application.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Flag Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., New Checkout Flow"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="key">Flag Key</Label>
              <Input
                id="key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g., new_checkout_flow"
                required
              />
              <p className="text-xs text-muted-foreground">Used in your code to reference this flag</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dataType">Data Type</Label>
              <Select value={dataType} onValueChange={(value: FlagDataType) => setDataType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boolean">Boolean (true/false)</SelectItem>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="json">JSON Object</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this flag controls"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Flag</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
