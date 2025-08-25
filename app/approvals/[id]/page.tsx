"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ApprovalCenter } from "../../../components/approval-center"
import { BreadcrumbNav } from "../../../components/breadcrumb-nav"
import AuthWrapper from "../../../components/auth-wrapper"
import { 
  fetchUsers,
  fetchProjects,
  fetchFeatureFlags,
  fetchApprovals
} from "../../../lib/api-services"
import type { User, Project, FeatureFlag, ApprovalRequest } from "../../../types"

export default function ApprovalDetailPage() {
  const params = useParams()
  const approvalId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([])
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [currentApproval, setCurrentApproval] = useState<ApprovalRequest | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [
          usersData,
          projectsData,
          approvalsData
        ] = await Promise.all([
          fetchUsers(),
          fetchProjects(),
          fetchApprovals()
        ])
        
        setUsers(usersData)
        setProjects(projectsData)
        setApprovals(approvalsData)
        
        const approval = approvalsData.find(a => a.id === approvalId)
        setCurrentApproval(approval || null)
        
        if (projectsData.length > 0) {
          const allFlags = await Promise.all(
            projectsData.map(project => fetchFeatureFlags(project.key))
          )
          setFeatureFlags(allFlags.flat())
        }
      } catch (err) {
        console.error('Failed to load data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [approvalId])

  if (loading) {
    return (
      <AuthWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AuthWrapper>
    )
  }

  if (error) {
    return (
      <AuthWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">Error: {error}</p>
          </div>
        </div>
      </AuthWrapper>
    )
  }

  if (!currentApproval) {
    return (
      <AuthWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Approval request not found</p>
          </div>
        </div>
      </AuthWrapper>
    )
  }

  return (
    <AuthWrapper>
      <div className="container mx-auto p-6">
        <BreadcrumbNav items={[
          { label: "Dashboard", href: "/" },
          { label: "Approvals", href: "/approvals" },
          { label: `Request #${approvalId.slice(-8)}` }
        ]} />
        <ApprovalCenter
          approvals={approvals}
          projects={projects}
          users={users}
          flags={featureFlags}
          currentUserId="00000000-0000-0000-0000-000000000000"
          onApprovalsChange={setApprovals}
        />
      </div>
    </AuthWrapper>
  )
}
