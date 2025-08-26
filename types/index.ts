export type UserRole = "admin" | "user"

export type AttributeType = "string" | "number" | "boolean"

export type FlagDataType = "boolean" | "string" | "number" | "json"

export type Environment = "development" | "staging" | "production"

export type LogicalOperator = "AND" | "OR"

export type ComparisonOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than"
  | "contains"
  | "in"
  | "not_in"
  | "modulus_equals"

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface TeamMember {
  userId: string
  role: UserRole
}

export interface Team {
  id: string
  name: string
  members: TeamMember[]
  memberCount?: number
}

export interface TeamWithMembers {
  id: string
  name: string
  members: TeamMember[]
}

export interface Project {
  id: string
  key: string
  name: string
  description?: string
  teamIds: string[]
  createdAt: Date
  updatedAt: Date
}

export interface GlobalAttribute {
  id: string
  name: string
  type: AttributeType
  description?: string
  possibleValues?: string[] // For enum-like attributes
}

export interface RuleCondition {
  attributeId: string
  operator: ComparisonOperator
  value: string | number | boolean
  listValues?: string[] // For "in" and "not_in" operators
  modulusValue?: number // For "modulus_equals" operator (the divisor)
}

export interface TrafficSplit {
  percentage: number
  value: any
  label?: string
}

export interface Rule {
  id: string
  name: string
  conditions: RuleCondition[]
  logicalOperator: LogicalOperator
  returnValue?: any // Optional when using traffic splits
  enabled: boolean
  trafficSplits?: TrafficSplit[] // Rule-level traffic splits
}

export interface EnvironmentConfig {
  environment: Environment
  enabled: boolean
  defaultValue: any
  rules: Rule[]
  trafficSplits: TrafficSplit[] // Environment-level traffic splits
}

export interface FeatureFlag {
  id: string
  key: string
  name: string
  description?: string
  dataType: FlagDataType
  projectId: string
  environments: EnvironmentConfig[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
  status: ApprovalStatus
}

export interface ChangeLog {
  id: string
  flagId: string
  projectId: string
  userId: string
  timestamp: Date
  action: string
  beforeSnapshot: any
  afterSnapshot: any
  environment?: Environment
  description?: string
}

export interface ApprovalRequest {
  id: string
  flagId?: string
  projectId: string
  requestedBy: string
  requestedAt: Date
  status: ApprovalStatus
  reviewedBy?: string
  reviewedAt?: Date
  comments?: string
  changes: any
  project?: {
    id: string
    name: string
  }
  flag?: {
    id: string
    name: string
  }
  requestedByUser?: {
    id: string
    name: string
  }
  reviewedByUser?: {
    id: string
    name: string
  }
}

export type ApprovalStatus = "pending" | "approved" | "rejected"

export interface Role {
  id: string
  name: string
}
