// Fetch a single team by ID, including members
export async function fetchTeamById(teamId: string): Promise<Team> {
  const response = await apiRequest<any>(`/teams/${teamId}?include=members`)
  return {
    id: response.id,
    name: response.name,
    members: Array.isArray(response.members)
      ? response.members.map((member: any) => {
        // Support both camelCase and snake_case for role name
        const roleName = (member as any).roleName || (member as any).role_name;
        // Support both camelCase and snake_case for userId
        const userId = (member as any).userId || (member as any).user_id;
        const roleId = (member as any).roleId || (member as any).role_id;
        return {
          userId,
          email: member.email,
          role: roleName ? String(roleName).toLowerCase() : 'user',
          name: member.name,
          roleId: roleId
        }
      })
      : []
  }
}
import { apiRequest, PaginatedResponse } from './api-client'
import type {
  User,
  Team,
  TeamWithMembers,
  Project,
  FeatureFlag,
  GlobalAttribute,
  ApprovalRequest,
  ApprovalStatus,
  AttributeType,
  UserRole,
  Role
} from '../types'
import type { SDKFlagConfig } from './flag-config-transformer'

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
  member_count: number
}

export interface TeamMemberDTO {
  user_id: string
  role_name: string
}

export interface TeamWithMembersDTO {
  id: string
  name: string
  members: TeamMemberDTO[]
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
  status: string
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
  entityId: string
  entityType: string
  entityName: string
  projectId: string
  projectName: string
  requestedBy: string
  requestedByName: string
  requestedAt: string
  status: string
  reviewedBy?: string
  reviewedByName?: string
  reviewedAt?: string
  action: string
  beforeSnapshot?: any
  afterSnapshot?: any
  comments?: string
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
      members: [],
      memberCount: typeof (team as any).memberCount === 'number'
        ? (team as any).memberCount
        : (typeof (team as any).member_count === 'number' ? (team as any).member_count : 0)
    }))
  } catch (error) {
    console.error('Error fetching teams:', error)
    return []
  }
}

export async function fetchTeamsByProject(projectId: string, includeMembers = false): Promise<Team[]> {
  try {
    const url = includeMembers
      ? `/projects/${projectId}/teams?include=members`
      : `/projects/${projectId}/teams`
    const response = await apiRequest<PaginatedResponse<TeamDTO | TeamWithMembersDTO>>(url)
    console.log('fetchTeamsByProject response:', response)

    if (!response || !response.items) {
      console.warn('Unexpected response structure for project teams:', response)
      return []
    }

    return response.items.map(team => ({
      id: team.id,
      name: team.name,
      members: 'members' in team ? team.members.map(member => ({
        userId: member.user_id,
        role: member.role_name.toLowerCase() as UserRole
      })) : []
    }))
  } catch (error) {
    console.error('Error fetching teams by project:', error)
    return []
  }
}

export async function fetchProjects(limit = 100, offset = 0): Promise<Project[]> {
  try {
    const response = await apiRequest<{ projects: ProjectDTO[], totalCount: number }>(`/projects/?limit=${limit}&offset=${offset}`)
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

    const response = await apiRequest<{ featureFlags: FeatureFlagDTO[], totalCount: number }>(endpoint)
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
      status: flag.status,
      createdAt: new Date(flag.createdAt),
      updatedAt: new Date(flag.updatedAt),
      createdBy: flag.createdBy
    }))
  } catch (error) {
    console.error('Error fetching feature flags:', error)
    return []
  }
}

export async function fetchGlobalAttributes(limit = 100, offset = 0, search?: string): Promise<GlobalAttribute[]> {
  try {
    let endpoint = `/global-attributes/?limit=${limit}&offset=${offset}`
    if (search && search.trim()) {
      endpoint += `&search=${encodeURIComponent(search.trim())}`
    }
    
    const response = await apiRequest<{ globalAttributes: GlobalAttributeDTO[], totalCount: number }>(endpoint)
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

export async function fetchApprovals(status?: string, projectId?: string, userId?: string, limit = 100, offset = 0): Promise<ApprovalRequest[]> {
  try {
    let endpoint = `/approvals/?limit=${limit}&offset=${offset}`
    if (status) {
      endpoint += `&status=${status}`
    }
    if (projectId) {
      endpoint += `&project_id=${projectId}`
    }
    if (userId) {
      endpoint += `&user_id=${userId}`
    }
    const response = await apiRequest<{ approvalRequests: ApprovalRequestDTO[], totalCount: number }>(endpoint)
    console.log('fetchApprovals response:', response)
    console.log('First approval item:', response.approvalRequests[0])

    if (!response || !response.approvalRequests) {
      console.warn('Unexpected response structure for approvals:', response)
      return []
    }

    return response.approvalRequests.map(approval => {
      console.log('Mapping approval:', approval)
      return {
        id: approval.id,
        flagId: approval.entityType === 'feature_flag' ? approval.entityId : undefined,
        projectId: approval.projectId,
        requestedBy: approval.requestedBy,
        requestedAt: new Date(approval.requestedAt),
        status: approval.status as any,
        reviewedBy: approval.reviewedBy,
        reviewedAt: approval.reviewedAt ? new Date(approval.reviewedAt) : undefined,
        comments: approval.comments,
        changes: {
          environment: 'production',
          action: approval.action,
          newValue: approval.afterSnapshot,
          oldValue: approval.beforeSnapshot
        }
      }
    })
  } catch (error) {
    console.error('Error fetching approvals:', error)
    return []
  }
}

export async function getApprovalById(approvalId: string): Promise<ApprovalRequest> {
  const response = await apiRequest<any>(`/approvals/${approvalId}`)
  console.log('resp: ', response)
  return {
    id: response.id,
    flagId: response.entityType === 'feature_flag' ? response.entity_id : undefined,
    projectId: response.projectId,
    requestedBy: response.requestedBy,
    requestedAt: new Date(response.requestedAt),
    status: response.status as any,
    reviewedBy: response.reviewedBy,
    reviewedAt: response.reviewedAt ? new Date(response.reviewedAt) : undefined,
    comments: response.comments,
    changes: {
      environment: 'production', // Default since not provided in API
      action: response.action,
      newValue: response.afterSnapshot,
      oldValue: response.beforeSnapshot
    },
    project: {
      id: response.projectId,
      name: response.projectName
    },
    flag: response.entityType === 'feature_flag' ? {
      id: response.entityId,
      name: response.entityName
    } : undefined,
    requestedByUser: {
      id: response.requestedBy,
      name: response.requestedByName
    },
    reviewedByUser: response.reviewedBy ? {
      id: response.reviewedBy,
      name: response.reviewedByName || 'Unknown Reviewer'
    } : undefined
  }
}

export async function createProject(data: { name: string; key: string; description?: string; teamIds?: string[] }): Promise<Project> {
  const response = await apiRequest<ProjectDTO>('/projects/', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      team_ids: data.teamIds || []
    })
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

export async function createFeatureFlag(data: any): Promise<FeatureFlag> {
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

export async function createTeam(data: { name: string }): Promise<Team> {
  const response = await apiRequest<TeamDTO>('/teams/', {
    method: 'POST',
    body: JSON.stringify(data)
  })

  return {
    id: response.id,
    name: response.name,
    members: []
  }
}

export async function createGlobalAttributeApproval(data: {
  projectId: string
  requestedBy: string
  name: string
  type: AttributeType
  description?: string
  possibleValues?: string[]
}): Promise<ApprovalRequest> {
  const response = await apiRequest<ApprovalRequestDTO>(`/global-attributes/?requested_by=${encodeURIComponent(data.requestedBy)}`, {
    method: 'POST',
    body: JSON.stringify({
      project_id: data.projectId,
      name: data.name,
      type: data.type,
      description: data.description,
      possible_values: data.possibleValues
    })
  })

  return {
    id: response.id,
    flagId: response.entityType === 'feature_flag' ? response.entityId : undefined,
    projectId: response.projectId,
    requestedBy: response.requestedBy,
    requestedAt: new Date(response.requestedAt),
    status: response.status as any,
    reviewedBy: response.reviewedBy,
    reviewedAt: response.reviewedAt ? new Date(response.reviewedAt) : undefined,
    comments: response.comments,
    changes: {
      environment: 'production',
      action: response.action,
      newValue: response.afterSnapshot,
      oldValue: response.beforeSnapshot
    }
  }
}

export async function createGlobalAttribute(data: {
  name: string
  type: AttributeType
  description?: string
  possibleValues?: string[]
}): Promise<GlobalAttribute> {
  const response = await apiRequest<GlobalAttributeDTO>('/global-attributes/', {
    method: 'POST',
    body: JSON.stringify(data)
  })

  return {
    id: response.id,
    name: response.name,
    type: response.type as AttributeType,
    description: response.description,
    possibleValues: data.possibleValues
  }
}

export async function updateTeam(teamId: string, data: { name?: string }): Promise<Team> {
  const response = await apiRequest<TeamDTO>(`/teams/${teamId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })

  return {
    id: response.id,
    name: response.name,
    members: []
  }
}

export async function approveRequest(requestId: string, reviewerId: string, comment?: string): Promise<ApprovalRequest> {
  const response = await apiRequest<ApprovalRequestDTO>(`/approvals/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'approved',
      reviewer_id: reviewerId,
      comments: comment
    })
  })

  return {
    id: response.id,
    flagId: response.entityType === 'feature_flag' ? response.entityId : undefined,
    projectId: response.projectId,
    requestedBy: response.requestedBy,
    requestedAt: new Date(response.requestedAt),
    status: response.status as any,
    reviewedBy: response.reviewedBy,
    reviewedAt: response.reviewedAt ? new Date(response.reviewedAt) : undefined,
    comments: response.comments,
    changes: {
      environment: 'production',
      action: response.action,
      newValue: response.afterSnapshot,
      oldValue: response.beforeSnapshot
    }
  }
}

export async function rejectRequest(requestId: string, reviewerId: string, comment?: string): Promise<ApprovalRequest> {
  const response = await apiRequest<ApprovalRequestDTO>(`/approvals/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'rejected',
      reviewer_id: reviewerId,
      comments: comment
    })
  })

  return {
    id: response.id,
    flagId: response.entityType === 'feature_flag' ? response.entityId : undefined,
    projectId: response.projectId,
    requestedBy: response.requestedBy,
    requestedAt: new Date(response.requestedAt),
    status: response.status as any,
    reviewedBy: response.reviewedBy,
    reviewedAt: response.reviewedAt ? new Date(response.reviewedAt) : undefined,
    comments: response.comments,
    changes: {
      environment: 'production',
      action: response.action,
      newValue: response.afterSnapshot,
      oldValue: response.beforeSnapshot
    }
  }
}

export async function createApprovalRequest(data: {
  entityType: string
  entityId: string
  projectId: string
  requestedBy: string
  action: string
  beforeSnapshot?: any
  afterSnapshot?: any
  comments?: string
}): Promise<ApprovalRequest> {
  const response = await apiRequest<ApprovalRequestDTO>('/approvals/', {
    method: 'POST',
    body: JSON.stringify({
      entity_type: data.entityType,
      entity_id: data.entityId,
      project_id: data.projectId,
      requested_by: data.requestedBy,
      action: data.action,
      before_snapshot: data.beforeSnapshot,
      after_snapshot: data.afterSnapshot,
      comments: data.comments
    })
  })

  return {
    id: response.id,
    flagId: response.entityType === 'feature_flag' ? response.entityId : undefined,
    projectId: response.projectId,
    requestedBy: response.requestedBy,
    requestedAt: new Date(response.requestedAt),
    status: response.status as any,
    reviewedBy: response.reviewedBy,
    reviewedAt: response.reviewedAt ? new Date(response.reviewedAt) : undefined,
    comments: response.comments,
    changes: {
      environment: 'production',
      action: response.action,
      newValue: response.afterSnapshot,
      oldValue: response.beforeSnapshot
    }
  }
}

export async function getFlagDefinition(
  projectKey: string,
  flagKey: string
): Promise<SDKFlagConfig> {
  const response = await apiRequest<SDKFlagConfig>(
    `/feature-flags/${projectKey}/${flagKey}/definition`
  )
  return response
}

export function getFlagApprovalStatus(flagId: string, approvals: ApprovalRequest[]): ApprovalStatus | null {
  const flagApproval = approvals.find(approval => approval.flagId === flagId)
  return flagApproval?.status || null
}

export interface RoleDTO {
  id: string
  name: string
}

export async function fetchRoles(): Promise<Role[]> {
  const response = await apiRequest<RoleDTO[]>('/roles/')
  return response.map(role => ({
    id: role.id,
    name: role.name
  }))
}


export async function updateTeamMembers(
  teamId: string,
  payload: { upserts: Array<{ user_id: string, role_id: string }>, removes: string[] }
): Promise<TeamWithMembers> {
  // Log the users and roles being sent to the backend
  // eslint-disable-next-line no-console
  console.info('[updateTeamMembers] Sending to backend:', {
    upserts: payload.upserts.map(u => ({ user_id: u.user_id, role_id: u.role_id })),
    removes: payload.removes
  })
  const response = await apiRequest<TeamWithMembersDTO>(`/teams/${teamId}/members`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })

  return {
    id: response.id,
    name: response.name,
    members: response.members.map(member => {
      // Support both camelCase and snake_case keys for robustness
      const roleName = (member as any).roleName || (member as any).role_name;
      const userId = (member as any).userId || (member as any).user_id;
      if (!roleName) {
        // eslint-disable-next-line no-console
        console.warn('Member missing role_name/roleName:', member)
        return {
          userId,
          role: 'unknown' as UserRole // fallback value, adjust as needed
        }
      }
      return {
        userId,
        role: roleName.toLowerCase() as UserRole
      }
    })
  }
}
