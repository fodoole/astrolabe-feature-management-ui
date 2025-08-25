"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { FlagEditor } from "../../../components/flag-editor"
import { BreadcrumbNav } from "../../../components/breadcrumb-nav"
import AuthWrapper from "../../../components/auth-wrapper"
import { 
  fetchProjects,
  fetchFeatureFlags,
  fetchGlobalAttributes,
  fetchApprovals
} from "../../../lib/api-services"
import type { Project, FeatureFlag, GlobalAttribute, ApprovalRequest } from "../../../types"

export default function FlagDetailPage() {
  const params = useParams()
  const flagId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  
  const [projects, setProjects] = useState<Project[]>([])
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([])
  const [globalAttributes, setGlobalAttributes] = useState<GlobalAttribute[]>([])
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [currentFlag, setCurrentFlag] = useState<FeatureFlag | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [
          projectsData,
          attributesData,
          approvalsData
        ] = await Promise.all([
          fetchProjects(),
          fetchGlobalAttributes(),
          fetchApprovals()
        ])
        
        setProjects(projectsData)
        setGlobalAttributes(attributesData)
        setApprovals(approvalsData)
        
        if (projectsData.length > 0) {
          const allFlags = await Promise.all(
            projectsData.map(project => fetchFeatureFlags(project.key))
          )
          const flatFlags = allFlags.flat()
          setFeatureFlags(flatFlags)
          
          const flag = flatFlags.find(f => f.id === flagId)
          if (flag) {
            setCurrentFlag(flag)
            setSelectedProject(flag.projectId)
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [flagId])

  const loadFeatureFlags = async () => {
    if (selectedProject) {
      try {
        const project = projects.find(p => p.id === selectedProject)
        const flagsData = await fetchFeatureFlags(project?.key)
        setFeatureFlags(flagsData)
      } catch (err) {
        console.error('Failed to load feature flags:', err)
      }
    }
  }

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

  if (!currentFlag) {
    return (
      <AuthWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Flag not found</p>
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
          { label: "Flags", href: "/flags" },
          { label: currentFlag.name }
        ]} />
        <FlagEditor
          projects={projects}
          flags={featureFlags}
          attributes={globalAttributes}
          selectedProject={selectedProject}
          selectedFlag={flagId}
          onSelectFlag={() => {}}
          onFlagsChange={loadFeatureFlags}
          approvals={approvals}
        />
      </div>
    </AuthWrapper>
  )
}
