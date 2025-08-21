import { apiRequest, PaginatedResponse } from './api-client'
import type { 
  User, 
  Team, 
  Project, 
  FeatureFlag, 
  GlobalAttribute, 
  ApprovalRequest 
} from '../types'

export interface UserDTO {
  id: string
  name: string
  email: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

export interface TeamDTO {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface ProjectDTO {
  id: string
  key: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface FeatureFlagDTO {
  id: string
  key: string
  name: string
  description?: string
  dataType: string
  projectId: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface GlobalAttributeDTO {
  id: string
  name: string
  type: string
  description?: string
}

export interface ApprovalRequestDTO {
  id: string
  flagId: string
  projectId: string
  requestedBy: string
  requestedAt: string
  status: string
  reviewedBy?: string
  reviewedAt?: string
  comments?: string
  changes: any
}

export async function fetchUsers(limit = 100, offset = 0): Promise<User[]> {
  try {
    const response = await apiRequest<UserDTO[]>(`/users/?limit=${limit}&offset=${offset}`)
    console.log('fetchUsers response:', response)
    
    if (!Array.isArray(response)) {
      console.warn('Unexpected response structure for users:', response)
      return []
    }
    
    return response.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatarUrl
    }))
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

export async function fetchTeams(limit = 100, offset = 0): Promise<Team[]> {
  try {
    const response = await apiRequest<PaginatedResponse<TeamDTO>>(`/teams/?limit=${limit}&offset=${offset}`)
    console.log('fetchTeams response:', response)
    
    if (!response || !response.items) {
      console.warn('Unexpected response structure for teams:', response)
      return []
    }
    
    return response.items.map(team => ({
      id: team.id,
      name: team.name,
      members: []
    }))
  } catch (error) {
    console.error('Error fetching teams:', error)
    return []
  }
}

export async function fetchProjects(limit = 100, offset = 0): Promise<Project[]> {
  try {
    const response = await apiRequest<{projects: ProjectDTO[], totalCount: number}>(`/projects/?limit=${limit}&offset=${offset}`)
    console.log('fetchProjects response:', response)
    
    if (!response || !response.projects) {
      console.warn('Unexpected response structure for projects:', response)
      return []
    }
    
    return response.projects.map(project => ({
      id: project.id,
      key: project.key,
      name: project.name,
      description: project.description,
      teamIds: [],
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt)
    }))
  } catch (error) {
    console.error('Error fetching projects:', error)
    return []
  }
}

export async function fetchFeatureFlags(projectKey?: string, limit = 100, offset = 0): Promise<FeatureFlag[]> {
  try {
    let endpoint = `/feature-flags/?limit=${limit}&offset=${offset}`
    if (projectKey) {
      endpoint += `&project_key=${projectKey}`
    }
    
    const response = await apiRequest<{featureFlags: FeatureFlagDTO[], totalCount: number}>(endpoint)
    console.log('fetchFeatureFlags response:', response)
    
    if (!response || !response.featureFlags) {
      console.warn('Unexpected response structure for feature flags:', response)
      return []
    }
    
    return response.featureFlags.map(flag => ({
      id: flag.id,
      key: flag.key,
      name: flag.name,
      description: flag.description,
      dataType: flag.dataType as any,
      projectId: flag.projectId,
      environments: [],
      createdAt: new Date(flag.createdAt),
      updatedAt: new Date(flag.updatedAt),
      createdBy: flag.createdBy
    }))
  } catch (error) {
    console.error('Error fetching feature flags:', error)
    return []
  }
}

export async function fetchGlobalAttributes(limit = 100, offset = 0): Promise<GlobalAttribute[]> {
  try {
    const response = await apiRequest<{globalAttributes: GlobalAttributeDTO[], totalCount: number}>(`/global-attributes/?limit=${limit}&offset=${offset}`)
    console.log('fetchGlobalAttributes response:', response)
    
    if (!response || !response.globalAttributes) {
      console.warn('Unexpected response structure for global attributes:', response)
      return []
    }
    
    return response.globalAttributes.map(attr => ({
      id: attr.id,
      name: attr.name,
      type: attr.type as any,
      description: attr.description
    }))
  } catch (error) {
    console.error('Error fetching global attributes:', error)
    return []
  }
}

export async function fetchApprovals(status?: string, limit = 100, offset = 0): Promise<ApprovalRequest[]> {
  try {
    let endpoint = `/approvals/?limit=${limit}&offset=${offset}`
    if (status) {
      endpoint += `&status=${status}`
    }
    
    const response = await apiRequest<{approvalRequests: ApprovalRequestDTO[], totalCount: number}>(endpoint)
    console.log('fetchApprovals response:', response)
    
    if (!response || !response.approvalRequests) {
      console.warn('Unexpected response structure for approvals:', response)
      return []
    }
    
    return response.approvalRequests.map(approval => ({
      id: approval.id,
      flagId: approval.flagId,
      projectId: approval.projectId,
      requestedBy: approval.requestedBy,
      requestedAt: new Date(approval.requestedAt),
      status: approval.status as any,
      reviewedBy: approval.reviewedBy,
      reviewedAt: approval.reviewedAt ? new Date(approval.reviewedAt) : undefined,
      comments: approval.comments,
      changes: approval.changes
    }))
  } catch (error) {
    console.error('Error fetching approvals:', error)
    return []
  }
}

export async function createProject(data: { name: string; key: string; description?: string }): Promise<Project> {
  const response = await apiRequest<ProjectDTO>('/projects/', {
    method: 'POST',
    body: JSON.stringify(data)
  })
  
  return {
    id: response.id,
    key: response.key,
    name: response.name,
    description: response.description,
    teamIds: [],
    createdAt: new Date(response.createdAt),
    updatedAt: new Date(response.updatedAt)
  }
}

export async function createFeatureFlag(data: {
  name: string
  key: string
  description?: string
  dataType: string
  projectKey: string
}): Promise<FeatureFlag> {
  const response = await apiRequest<FeatureFlagDTO>('/feature-flags/', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      project_key: data.projectKey
    })
  })
  
  return {
    id: response.id,
    key: response.key,
    name: response.name,
    description: response.description,
    dataType: response.dataType as any,
    projectId: response.projectId,
    environments: [],
    createdAt: new Date(response.createdAt),
    updatedAt: new Date(response.updatedAt),
    createdBy: response.createdBy
  }
}
