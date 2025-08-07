"use client"

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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Flag, User, Calendar } from 'lucide-react'
import type { ApprovalRequest, Project, User as UserType, FeatureFlag } from "../../types"

interface ReviewApprovalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  approval: ApprovalRequest | null
  project: Project | null
  user: UserType | null
  flag: FeatureFlag | null
  onApprove: (approvalId: string, comment: string) => void
  onReject: (approvalId: string, comment: string) => void
}

export function ReviewApprovalModal({
  open,
  onOpenChange,
  approval,
  project,
  user,
  flag,
  onApprove,
  onReject,
}: ReviewApprovalModalProps) {
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!approval || !project || !user || !flag) return null

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      await onApprove(approval.id, comment)
      setComment("")
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    setIsSubmitting(true)
    try {
      await onReject(approval.id, comment)
      setComment("")
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5" />
            Review Approval Request
          </DialogTitle>
          <DialogDescription>
            Review the requested changes and provide your decision
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Summary */}
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Request Details</h4>
              <Badge variant="outline">Pending Review</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Project:</span>
                <div className="font-medium">{project.name}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Flag:</span>
                <div className="font-medium">{flag.name}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Requested by:</span>
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3" />
                  {user.name}
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

          {/* Proposed Changes */}
          <div className="space-y-3">
            <h4 className="font-medium">Proposed Changes</h4>
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Environment:</span>
                <Badge variant="secondary">{approval.changes.environment}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Action:</span>
                <Badge variant="outline">{approval.changes.action.replace('_', ' ')}</Badge>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">New Configuration:</span>
                <div className="bg-slate-900 text-slate-100 p-3 rounded text-xs font-mono overflow-auto">
                  <pre>{JSON.stringify(approval.changes.newValue, null, 2)}</pre>
                </div>
              </div>
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

          {/* Risk Assessment */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">⚠️ Review Checklist</h4>
            <div className="text-sm text-yellow-800 space-y-1">
              <div>• Does this change align with the current release plan?</div>
              <div>• Have the potential impacts been considered?</div>
              <div>• Are the targeting rules appropriate for the audience?</div>
              <div>• Is this change safe for the {approval.changes.environment} environment?</div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
