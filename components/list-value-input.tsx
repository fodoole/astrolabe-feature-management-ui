"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from 'lucide-react'

interface ListValueInputProps {
  values: string[]
  onValuesChange: (values: string[]) => void
  placeholder?: string
  suggestions?: string[]
}

export function ListValueInput({ values, onValuesChange, placeholder = "Add value", suggestions }: ListValueInputProps) {
  const [newValue, setNewValue] = useState("")

  const addValue = () => {
    const trimmedValue = newValue.trim()
    if (trimmedValue && !values.includes(trimmedValue)) {
      onValuesChange([...values, trimmedValue])
      setNewValue("")
    }
  }

  const removeValue = (valueToRemove: string) => {
    onValuesChange(values.filter(v => v !== valueToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addValue()
    }
  }

  const remainingSuggestions = (suggestions || []).filter(s => !values.includes(s))

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" onClick={addValue} disabled={!newValue.trim()} size="sm">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {values.map((value) => (
            <Badge key={value} variant="secondary" className="gap-1">
              {value}
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={() => removeValue(value)}
              />
            </Badge>
          ))}
        </div>
      )}

      {remainingSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs text-muted-foreground">Suggestions:</span>
          {remainingSuggestions.map((suggestion) => (
            <Badge
              key={suggestion}
              variant="outline"
              className="gap-1 cursor-pointer hover:bg-accent"
              onClick={() => onValuesChange([...values, suggestion])}
            >
              <Plus className="w-3 h-3" />
              {suggestion}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
