"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CheckCircle, XCircle, Clock, MessageSquare, Flag, Eye, ExternalLink } from 'lucide-react'
import type { ApprovalRequest, Project, User as UserType, FeatureFlag, ApprovalStatus } from "../types"
import { approveRequest, rejectRequest } from "../lib/api-services"
import { handleApiError, showSuccessToast } from "../lib/toast-utils"

interface ApprovalCenterProps {
  approvals: ApprovalRequest[]
  projects: Project[]
  users: UserType[]
  flags: FeatureFlag[]
  currentUserId?: string
  onApprovalsChange?: (approvals: ApprovalRequest[]) => void
  selectedProject?: string
}

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
}

const statusColors = {
  pending: "default" as const,
  approved: "default" as const,
  rejected: "destructive" as const,
}

export function ApprovalCenter({ approvals, projects, users, flags, currentUserId = "00000000-0000-0000-0000-000000000000", onApprovalsChange, selectedProject }: ApprovalCenterProps) {
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState<ApprovalStatus | "all">("all")
  const [reviewingApproval, setReviewingApproval] = useState<ApprovalRequest | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)

  const getUserById = (userId?: string) => userId ? users.find((user) => user.id === userId) || null : null
  const getProjectById = (projectId?: string) => projectId ? projects.find((project) => project.id === projectId) || null : null
  const getFlagById = (flagId?: string) => flagId ? flags.find((flag) => flag.id === flagId) || null : null
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()

  const filteredApprovals = useMemo(() => {
    let filtered = approvals
    
    if (selectedProject) {
      filtered = filtered.filter(approval => approval.projectId === selectedProject)
    }
    
    if (selectedStatus !== "all") {
      filtered = filtered.filter(approval => approval.status === selectedStatus)
    }
    
    return filtered
  }, [approvals, selectedProject, selectedStatus])

  const sortedApprovals = filteredApprovals.sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1
    if (a.status !== "pending" && b.status === "pending") return 1
    return b.requestedAt.getTime() - a.requestedAt.getTime()
  })

  const handleReview = (approval: ApprovalRequest) => {
    // Navigate to the dedicated request page instead of opening modal
    router.push(`/requests/${approval.id}`)
  }

  const handleApprove = async (approvalId: string, comment: string) => {
    try {
      const updatedApproval = await approveRequest(approvalId, currentUserId, comment)
      const updatedApprovals = approvals.map(approval => 
        approval.id === approvalId ? updatedApproval : approval
      )
      onApprovalsChange?.(updatedApprovals)
      setShowReviewModal(false)
      showSuccessToast('Request approved successfully!')
    } catch (error) {
      handleApiError(error, 'Failed to approve request')
    }
  }

  const handleReject = async (approvalId: string, comment: string) => {
    try {
      const updatedApproval = await rejectRequest(approvalId, currentUserId, comment)
      const updatedApprovals = approvals.map(approval => 
        approval.id === approvalId ? updatedApproval : approval
      )
      onApprovalsChange?.(updatedApprovals)
      setShowReviewModal(false)
      showSuccessToast('Request rejected successfully!')
    } catch (error) {
      handleApiError(error, 'Failed to reject request')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Approval Center</h1>
          <p className="text-muted-foreground">Review and approve production flag changes</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={selectedStatus === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedStatus("all")}
        >
          All ({approvals.length})
        </Button>
        {(["pending", "approved", "rejected"] as ApprovalStatus[]).map((status) => {
          const Icon = statusIcons[status]
          const count = approvals.filter((a) => a.status === status).length

          return (
            <Button
              key={status}
              variant={selectedStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus(status)}
            >
              <Icon className="w-4 h-4 mr-1" />
              {status} ({count})
            </Button>
          )
        })}
      </div>

      <div className="space-y-4">
        {sortedApprovals.map((approval) => {
          const requester = getUserById(approval.requestedBy)
          const reviewer = approval.reviewedBy ? getUserById(approval.reviewedBy) : null
          const project = getProjectById(approval.projectId)
          const flag = getFlagById(approval.flagId)
          const StatusIcon = statusIcons[approval.status]

          return (
            <Card key={approval.id} className={approval.status === "pending" ? "border-orange-200" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      <CardTitle className="text-lg">{flag?.name}</CardTitle>
                      <Badge variant={statusColors[approval.status]} className="gap-1">
                        <StatusIcon className="w-3 h-3" />
                        {approval.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {project?.name} • Requested by {requester?.name}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm text-muted-foreground">
                      {approval.requestedAt.toLocaleDateString()}
                    </div>
                    <Button 
                      onClick={() => handleReview(approval)}
                      variant={approval.status === "pending" ? "default" : "outline"}
                      className="gap-2"
                    >
                      {approval.status === "pending" ? (
                        <>
                          <Eye className="w-4 h-4" />
                          Review
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          View
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {requester ? getInitials(requester.name) : "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{requester?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      requested {approval.requestedAt.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="bg-muted rounded p-3">
                  <div className="text-sm font-medium mb-2">Requested Changes:</div>
                  <div className="text-xs space-y-1">
                    {approval.changes ? (
                      <>
                        <div>
                          <span className="font-medium">Environment:</span> {approval.changes.environment || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Action:</span> {approval.changes.action || 'N/A'}
                        </div>
                        {approval.changes.oldValue && (
                          <div>
                            <span className="font-medium">Before:</span>
                            <div className="bg-background p-2 rounded mt-1">
                              <pre className="text-xs overflow-auto">{JSON.stringify(approval.changes.oldValue, null, 2)}</pre>
                            </div>
                          </div>
                        )}
                        {approval.changes.newValue && (
                          <div>
                            <span className="font-medium">After:</span>
                            <div className="bg-background p-2 rounded mt-1">
                              <pre className="text-xs overflow-auto">{JSON.stringify(approval.changes.newValue, null, 2)}</pre>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-muted-foreground">No change details available</div>
                    )}
                  </div>
                </div>

                {approval.status !== "pending" && approval.reviewedBy && (
                  <div className="border-t pt-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {reviewer ? getInitials(reviewer.name) : "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{reviewer?.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {approval.status} {approval.reviewedAt?.toLocaleString()}
                        </div>
                        {approval.comments && (
                          <div className="mt-2 text-sm bg-muted p-2 rounded">
                            <MessageSquare className="w-3 h-3 inline mr-1" />
                            {approval.comments}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {sortedApprovals.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No approvals found</h3>
            <p className="text-muted-foreground">
              {selectedStatus !== "all"
                ? `No ${selectedStatus} approval requests`
                : "Production changes requiring approval will appear here"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
