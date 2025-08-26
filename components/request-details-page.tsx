"use client"

import { useState, useEffect } from "react"
import { useCurrentUser } from "../hooks/useCurrentUser"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Clock, MessageSquare, Flag, User, Calendar, ArrowLeft, Share2 } from 'lucide-react'
import type { ApprovalRequest } from "../types"
import { approveRequest, rejectRequest, getApprovalById } from "../lib/api-services"
import { handleApiError, showSuccessToast } from "../lib/toast-utils"

interface RequestDetailsPageProps {
  requestId: string
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

export function RequestDetailsPage({ requestId }: RequestDetailsPageProps) {
  const { userId } = useCurrentUser()
  const router = useRouter()
  const [approval, setApproval] = useState<ApprovalRequest | null>(null)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRequestData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Load only the approval request - it contains all the necessary data
        const approvalData = await getApprovalById(requestId)
        setApproval(approvalData)
      } catch (err) {
        setError('Failed to load request details')
        handleApiError(err, 'Failed to load request details')
      } finally {
        setIsLoading(false)
      }
    }

    loadRequestData()
  }, [requestId])

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()

  const handleApprove = async () => {
    if (!approval || !userId) return
    
    setIsSubmitting(true)
    try {
      const updatedApproval = await approveRequest(approval.id, userId, comment)
      setApproval(updatedApproval)
      setComment("")
      showSuccessToast('Request approved successfully!')
    } catch (error) {
      handleApiError(error, 'Failed to approve request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!approval || !userId) return
    
    setIsSubmitting(true)
    try {
      const updatedApproval = await rejectRequest(approval.id, userId, comment)
      setApproval(updatedApproval)
      setComment("")
      showSuccessToast('Request rejected successfully!')
    } catch (error) {
      handleApiError(error, 'Failed to reject request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showSuccessToast('Link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !approval) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Request Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {error || 'The requested approval could not be found.'}
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const StatusIcon = statusIcons[approval.status]

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Approval Request</h1>
            <p className="text-muted-foreground">Review and manage this approval request</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleShare} className="gap-2">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </div>

      {/* Request Card */}
      <Card className={approval.status === "pending" ? "border-orange-200" : ""}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4" />
                <CardTitle className="text-lg">{approval.flag?.name || 'Unknown Flag'}</CardTitle>
                <Badge variant={statusColors[approval.status]} className="gap-1">
                  <StatusIcon className="w-3 h-3" />
                  {approval.status}
                </Badge>
              </div>
              <CardDescription>
                {approval.project?.name || 'Unknown Project'} • Requested by {approval.requestedByUser?.name || 'Unknown User'}
              </CardDescription>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              {approval.requestedAt.toLocaleDateString()}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Request Summary */}
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Request Details</h4>
              <Badge variant="outline">{approval.status === 'pending' ? 'Pending Review' : approval.status}</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Project:</span>
                <div className="font-medium">{approval.project?.name || 'Unknown Project'}</div>
              </div>
              {approval.flag && (
                <div>
                  <span className="text-muted-foreground">Flag:</span>
                  <div className="font-medium">{approval.flag.name}</div>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Requested by:</span>
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3" />
                  {approval.requestedByUser?.name || 'Unknown User'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Requested:</span>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  {approval.requestedAt.toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Requester Info */}
          <div className="flex items-start gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs">
                {approval.requestedByUser?.name ? getInitials(approval.requestedByUser.name) : "??"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-sm font-medium">{approval.requestedByUser?.name || 'Unknown User'}</div>
              <div className="text-xs text-muted-foreground">
                requested {approval.requestedAt.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Proposed Changes */}
          <div className="space-y-3">
            <h4 className="font-medium">Proposed Changes</h4>
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Environment:</span>
                <Badge variant="secondary">{approval.changes?.environment || 'N/A'}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Action:</span>
                <Badge variant="outline">{approval.changes?.action?.replace('_', ' ') || 'N/A'}</Badge>
              </div>
              {approval.changes?.oldValue && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Previous Configuration:</span>
                  <div className="bg-slate-900 text-slate-100 p-3 rounded text-xs font-mono overflow-auto">
                    <pre>{JSON.stringify(approval.changes.oldValue, null, 2)}</pre>
                  </div>
                </div>
              )}
              {approval.changes?.newValue && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">New Configuration:</span>
                  <div className="bg-slate-900 text-slate-100 p-3 rounded text-xs font-mono overflow-auto">
                    <pre>{JSON.stringify(approval.changes.newValue, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Review Section - Only show for pending requests */}
          {approval.status === "pending" && userId && (
            <>
              {/* Risk Assessment */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">⚠️ Review Checklist</h4>
                <div className="text-sm text-yellow-800 space-y-1">
                  <div>• Does this change align with the current release plan?</div>
                  <div>• Have the potential impacts been considered?</div>
                  <div>• Are the targeting rules appropriate for the audience?</div>
                  <div>• Is this change safe for the {approval.changes?.environment || 'target'} environment?</div>
                </div>
              </div>

              {/* Review Comment */}
              <div className="space-y-2">
                <Label htmlFor="comment">Review Comment</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add your review comments (optional)..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Your comment will be visible to the requester and other team members
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="destructive" 
                  onClick={handleReject}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  {isSubmitting ? "Rejecting..." : "Reject"}
                </Button>
                <Button 
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isSubmitting ? "Approving..." : "Approve"}
                </Button>
              </div>
            </>
          )}

          {/* Review Result - Show for completed requests */}
          {approval.status !== "pending" && approval.reviewedByUser && (
            <div className="border-t pt-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">
                    {approval.reviewedByUser ? getInitials(approval.reviewedByUser.name) : "??"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-sm font-medium">{approval.reviewedByUser?.name || 'Unknown Reviewer'}</div>
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
    </div>
  )
}
