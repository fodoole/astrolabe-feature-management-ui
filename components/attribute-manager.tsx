"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useUserId, getUserIdFromSession } from "../lib/session-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Plus, Database, Search, Type, Hash, ToggleLeft, ChevronLeft, ChevronRight, Loader2, Clock, Pencil } from "lucide-react"
import type { GlobalAttribute, AttributeType } from "../types"
import { NewAttributeModal } from "./modals/new-attribute-modal"
import { EditPossibleValuesModal } from "./modals/edit-possible-values-modal"
import { createGlobalAttribute, fetchGlobalAttributes, updateGlobalAttributePossibleValues } from "../lib/api-services"
import { handleApiError, showSuccessToast } from "../lib/toast-utils"
import { useAccess, requirePermission } from '@/lib/permissions'


interface AttributeManagerProps {
  attributes: GlobalAttribute[]
  onAttributesChange?: (attributes: GlobalAttribute[]) => void
}

const typeIcons = {
  string: Type,
  number: Hash,
  boolean: ToggleLeft,
}

// Removed unused typeColors

const ITEMS_PER_PAGE = 10

export function AttributeManager({
  attributes: initialAttributes,
  onAttributesChange,
}: AttributeManagerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<AttributeType | "all">("all")
  const [showNewAttributeModal, setShowNewAttributeModal] = useState(false)
  const [editingAttribute, setEditingAttribute] = useState<GlobalAttribute | null>(null)
  const [attributes, setAttributes] = useState<GlobalAttribute[]>(initialAttributes)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)

  // Track the most recently created attribute to show pending approval alert
  const [recentlyCreatedAttribute, setRecentlyCreatedAttribute] = useState<(GlobalAttribute & { project_id?: string }) | null>(null)
  const access = useAccess()
  const { data: session } = useSession()




  const loadAttributes = useCallback(async (search: string = "", page: number = 1) => {
    setIsLoading(true)
    try {
      const offset = (page - 1) * ITEMS_PER_PAGE
      // Fetch one extra item to check if there are more pages
      const result = await fetchGlobalAttributes(ITEMS_PER_PAGE + 1, offset, search)
      // If we got more than ITEMS_PER_PAGE, there are more pages
      const hasMore = result.length > ITEMS_PER_PAGE
      setHasNextPage(hasMore)
      // Only show the first ITEMS_PER_PAGE items
      const displayItems = result.slice(0, ITEMS_PER_PAGE)
      setAttributes(displayItems)
    } catch (error) {
      console.error('Error loading attributes:', error)
      setHasNextPage(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      loadAttributes(searchQuery, 1)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, loadAttributes])

  // Load attributes when page changes
  useEffect(() => {
    loadAttributes(searchQuery, currentPage)
  }, [currentPage, searchQuery, loadAttributes])


  // Clear the recently created attribute after 1 minute
  useEffect(() => {
    if (recentlyCreatedAttribute) {
      const timer = setTimeout(() => {
        setRecentlyCreatedAttribute(null)
      }, 60000)

      return () => clearTimeout(timer)
    }
  }, [recentlyCreatedAttribute])


  const filteredAttributes = selectedType === "all"
    ? attributes
    : attributes.filter(attr => attr.type === selectedType)

  const hasPrevPage = currentPage > 1

  const handleCreateAttribute = async (attributeData: {
    name: string
    type: AttributeType
    description: string
    possibleValues?: string[]
  }) => {
    if (!requirePermission(access, 'attributes', 'create', { label: 'attributes' })) return
    try {
      // Prepare payload for backend: use possible_values, and only include if defined
      const backendUserId = getUserIdFromSession(session)

      // If backend user ID is not available, show a warning and prevent the operation
      if (!backendUserId) {
        console.error('Cannot create attribute: Backend user ID not available in session')
        handleApiError(new Error('User authentication issue - please sign out and sign in again'),
          'Cannot create attribute: Your user ID is not available')
        return
      }

      const payload: any = {
        name: attributeData.name,
        type: attributeData.type,
        description: attributeData.description,
        requested_by: backendUserId
      }

      if (attributeData.possibleValues && attributeData.possibleValues.length > 0) {
        payload.possible_values = attributeData.possibleValues
      }
      const newAttribute = await createGlobalAttribute(payload)
      // Set the recently created attribute to show the approval status
      setRecentlyCreatedAttribute(newAttribute)
      // Refresh the current page to show the new attribute
      await loadAttributes(searchQuery, currentPage)
      if (onAttributesChange) {
        onAttributesChange([...attributes, newAttribute])
      }
      showSuccessToast('Global attribute created successfully!')
    } catch (error) {
      handleApiError(error, 'Failed to create attribute')
    }
  }

  const handleSavePossibleValues = async (possibleValues: string[]) => {
    if (!editingAttribute) return
    if (!requirePermission(access, 'attributes', 'update', { label: 'attributes' })) return
    try {
      const updated = await updateGlobalAttributePossibleValues(editingAttribute.id, possibleValues)
      setEditingAttribute(null)
      setAttributes((prev) => prev.map((attr) => (attr.id === updated.id ? { ...attr, possibleValues: updated.possibleValues } : attr)))
      showSuccessToast('Suggestions updated successfully!')
    } catch (error) {
      handleApiError(error, 'Failed to update suggestions')
    }
  }

  return (
    <div className="space-y-6">
      {/* Approval Status Alert for Recently Created Attribute */}
      {recentlyCreatedAttribute && (
        <Alert className="border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 flex-1">
              <div className="flex items-center justify-between">
                <span>
                  Your attribute <strong>{recentlyCreatedAttribute.name}</strong> is <strong>pending approval</strong>.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100"
                  onClick={() => {
                    const project_id = recentlyCreatedAttribute?.project_id
                    if (project_id) {
                      window.open(`/?tab=approvals&project=${project_id}`, '_blank')
                    } else {
                      window.open(`/?tab=approvals`, '_blank')
                    }
                  }}
                >
                  View Requests
                </Button>
              </div>
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Global Attributes</h1>
          <p className="text-muted-foreground">Manage reusable attributes for flag targeting</p>
        </div>
        <Button onClick={() => {
          if (!requirePermission(access, 'attributes', 'create', { label: 'attributes' })) return
          setShowNewAttributeModal(true)
        }} disabled={access.loading || !access.can('attributes', 'create')}>
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

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading attributes...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAttributes.map((attribute) => {
              const Icon = typeIcons[attribute.type]

              return (
                <Card key={attribute.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-medium">{attribute.name}</CardTitle>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="gap-1">
                          <Icon className="w-3 h-3" />
                          {attribute.type}
                        </Badge>
                        {attribute.type === "string" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {/* span keeps the tooltip working when the button is disabled */}
                              <span tabIndex={0}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  aria-label="Edit suggestions"
                                  disabled={access.loading || !access.can('attributes', 'update')}
                                  onClick={() => {
                                    if (!requirePermission(access, 'attributes', 'update', { label: 'suggestions' })) return
                                    setEditingAttribute(attribute)
                                  }}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {access.can('attributes', 'update')
                                ? "Edit suggestions"
                                : "Only administrators can edit suggestions"}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    {attribute.description && <CardDescription>{attribute.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    {attribute.possibleValues && attribute.possibleValues.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-2">Suggestions:</div>
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

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!hasPrevPage}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!hasNextPage}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          {filteredAttributes.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery || selectedType !== "all" ? "No matching attributes" : "No attributes yet"}
              </h3>
              <p className="text-muted-foreground mb-4">Create your first global attribute to use in flag rules</p>
              {!searchQuery && selectedType === "all" && (
                <Button onClick={() => {
                  if (!requirePermission(access, 'attributes', 'create', { label: 'attributes' })) return
                  setShowNewAttributeModal(true)
                }} disabled={access.loading || !access.can('attributes', 'create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Attribute
                </Button>
              )}
            </div>
          )}
        </>
      )}

      <NewAttributeModal
        open={showNewAttributeModal}
        onOpenChange={setShowNewAttributeModal}
        onCreateAttribute={handleCreateAttribute}
      />

      <EditPossibleValuesModal
        open={editingAttribute !== null}
        onOpenChange={(open) => {
          if (!open) setEditingAttribute(null)
        }}
        attribute={editingAttribute}
        onSave={handleSavePossibleValues}
      />
    </div>
  )
}