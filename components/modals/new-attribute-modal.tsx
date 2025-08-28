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
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import type { AttributeType } from "../../types"

interface NewAttributeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateAttribute: (attribute: {
    name: string
    type: AttributeType
    description: string
    possibleValues?: string[]
  }) => void
}

export function NewAttributeModal({ open, onOpenChange, onCreateAttribute }: NewAttributeModalProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState<AttributeType>("string")
  const [description, setDescription] = useState("")
  const [possibleValues, setPossibleValues] = useState<string[]>([])
  const [newValue, setNewValue] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onCreateAttribute({
        name: name.trim(),
        type,
        description: description.trim(),
        possibleValues: possibleValues.length > 0 ? possibleValues : undefined,
      })
      setName("")
      setType("string")
      setDescription("")
      setPossibleValues([])
      setNewValue("")
      onOpenChange(false)
    }
  }

  const handleNameChange = (value: string) => {
    // Only allow lowercase letters, numbers, and underscores, limit to 100 chars
    const sanitizedName = value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 100)
    setName(sanitizedName)
  }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Attribute</DialogTitle>
          <DialogDescription>Add a new global attribute for use in feature flag targeting rules.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Attribute Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., user_country, subscription_tier"
                required
              />
              <p className="text-sm text-gray-500">Limited to 100 characters. Only lowercase letters, numbers, and underscores are allowed.</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Data Type</Label>
              <Select value={type} onValueChange={(value: AttributeType) => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this attribute represents"
                rows={2}
              />
            </div>

            {type === "string" && (
              <div className="grid gap-2">
                <Label>Possible Values (Optional)</Label>
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
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Attribute</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
