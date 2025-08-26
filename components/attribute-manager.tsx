"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Database, Search, Type, Hash, ToggleLeft } from "lucide-react"
import type { GlobalAttribute, AttributeType } from "../types"
import { NewAttributeModal } from "./modals/new-attribute-modal"
import { createGlobalAttribute } from "../lib/api-services"
import { handleApiError, showSuccessToast } from "../lib/toast-utils"

interface AttributeManagerProps {
  attributes: GlobalAttribute[]
  onAttributesChange?: (attributes: GlobalAttribute[]) => void
}

const typeIcons = {
  string: Type,
  number: Hash,
  boolean: ToggleLeft,
}

const typeColors = {
  string: "blue" as const,
  number: "green" as const,
  boolean: "purple" as const,
}

export function AttributeManager({ attributes, onAttributesChange }: AttributeManagerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<AttributeType | "all">("all")
  const [showNewAttributeModal, setShowNewAttributeModal] = useState(false)

  const filteredAttributes = attributes.filter((attr) => {
    const matchesSearch =
      attr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attr.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === "all" || attr.type === selectedType
    return matchesSearch && matchesType
  })

  const handleCreateAttribute = async (attributeData: {
    name: string
    type: AttributeType
    description: string
    possibleValues?: string[]
  }) => {
    try {
      const newAttribute = await createGlobalAttribute(attributeData)
      if (onAttributesChange) {
        onAttributesChange([...attributes, newAttribute])
      }
      showSuccessToast('Global attribute created successfully!')
    } catch (error) {
      handleApiError(error, 'Failed to create attribute')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Global Attributes</h1>
          <p className="text-muted-foreground">Manage reusable attributes for flag targeting</p>
        </div>
        <Button onClick={() => setShowNewAttributeModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Attribute
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search attributes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("all")}
          >
            All Types
          </Button>
          {(["string", "number", "boolean"] as AttributeType[]).map((type) => {
            const Icon = typeIcons[type]
            return (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(type)}
              >
                <Icon className="w-4 h-4 mr-1" />
                {type}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAttributes.map((attribute) => {
          const Icon = typeIcons[attribute.type]

          return (
            <Card key={attribute.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium">{attribute.name}</CardTitle>
                  <Badge variant="outline" className="gap-1">
                    <Icon className="w-3 h-3" />
                    {attribute.type}
                  </Badge>
                </div>
                {attribute.description && <CardDescription>{attribute.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                {attribute.possibleValues && attribute.possibleValues.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Possible Values:</div>
                    <div className="flex flex-wrap gap-1">
                      {attribute.possibleValues.slice(0, 3).map((value) => (
                        <Badge key={value} variant="secondary" className="text-xs">
                          {value}
                        </Badge>
                      ))}
                      {attribute.possibleValues.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{attribute.possibleValues.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredAttributes.length === 0 && (
        <div className="text-center py-12">
          <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {searchQuery || selectedType !== "all" ? "No matching attributes" : "No attributes yet"}
          </h3>
          <p className="text-muted-foreground mb-4">Create your first global attribute to use in flag rules</p>
          {!searchQuery && selectedType === "all" && (
            <Button onClick={() => setShowNewAttributeModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Attribute
            </Button>
          )}
        </div>
      )}

      <NewAttributeModal
        open={showNewAttributeModal}
        onOpenChange={setShowNewAttributeModal}
        onCreateAttribute={handleCreateAttribute}
      />
    </div>
  )
}
