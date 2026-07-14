"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from 'lucide-react'

type ListValue = string | number | boolean

interface ListValueInputProps {
  values: ListValue[]
  onValuesChange: (values: ListValue[]) => void
  placeholder?: string
  suggestions?: string[]
}

export function ListValueInput({ values, onValuesChange, placeholder = "Add value", suggestions }: ListValueInputProps) {
  const [newValue, setNewValue] = useState("")

  const addValue = () => {
    const trimmedValue = newValue.trim()
    // Compare with String() so that already-added numeric/boolean values
    // (which are stored coerced) are correctly detected as duplicates.
    if (trimmedValue && !values.some(v => String(v) === trimmedValue)) {
      onValuesChange([...values, trimmedValue])
      setNewValue("")
    }
  }

  // Remove by index rather than by value: values can be coerced to
  // numbers/booleans upstream and may contain duplicates, so value-based
  // filtering is unreliable (and NaN never equals itself).
  const removeValue = (indexToRemove: number) => {
    onValuesChange(values.filter((_, i) => i !== indexToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addValue()
    }
  }

  const remainingSuggestions = (suggestions || []).filter(s => !values.some(v => String(v) === s))

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
          {values.map((value, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {String(value)}
              <button
                type="button"
                aria-label={`Remove ${String(value)}`}
                className="cursor-pointer hover:text-destructive"
                onClick={() => removeValue(index)}
              >
                <X className="w-3 h-3" />
              </button>
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
