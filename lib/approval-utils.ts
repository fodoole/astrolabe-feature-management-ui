import type { ApprovalRequest, ApprovalStatus } from "../types"

export const getApprovalStatus = (flagId: string, approvals: ApprovalRequest[]): ApprovalStatus | null => {
  const flagApprovals = approvals.filter(approval => approval.flagId === flagId)
  if (flagApprovals.length === 0) return null
  
  const latestApproval = flagApprovals.sort((a, b) => 
    b.requestedAt.getTime() - a.requestedAt.getTime()
  )[0]
  
  return latestApproval.status
}

export const hasPendingApproval = (flagId: string, approvals: ApprovalRequest[]): boolean => {
  return getApprovalStatus(flagId, approvals) === "pending"
}

export const getPendingApproval = (flagId: string, approvals: ApprovalRequest[]): ApprovalRequest | null => {
  return approvals.find(approval => approval.flagId === flagId && approval.status === "pending") || null
}

export const getApprovalStatusColor = (status: ApprovalStatus) => {
  switch (status) {
    case "pending": return "default"
    case "approved": return "default" 
    case "rejected": return "destructive"
    default: return "default"
  }
}
