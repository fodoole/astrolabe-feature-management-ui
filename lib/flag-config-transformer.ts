import type { FeatureFlag, EnvironmentConfig, Rule, RuleCondition } from '../types'

export interface SDKFlagConfig {
  key: string
  environments: SDKEnvironmentConfig[]
}

export interface SDKEnvironmentConfig {
  environment: string
  enabled: boolean
  defaultValue?: unknown
  rules?: SDKRuleConfig[]
}

export interface SDKRuleConfig {
  id?: string
  name?: string
  enabled?: boolean
  logicalOperator?: string
  conditions?: SDKCondition[]
  returnValue?: unknown
}

export interface SDKCondition {
  attributeName: string
  operator: string
  value?: unknown
  listValues?: unknown[]
}

export function transformFlagToSDKFormat(flag: FeatureFlag): SDKFlagConfig {
  return {
    key: flag.key,
    environments: flag.environments.map(transformEnvironmentToSDK)
  }
}

function transformEnvironmentToSDK(env: EnvironmentConfig): SDKEnvironmentConfig {
  return {
    environment: env.environment,
    enabled: env.enabled,
    defaultValue: env.defaultValue,
    rules: env.rules.map(transformRuleToSDK)
  }
}

function transformRuleToSDK(rule: Rule): SDKRuleConfig {
  return {
    name: rule.name,
    enabled: rule.enabled,
    logicalOperator: rule.logicalOperator,
    conditions: rule.conditions.map(transformConditionToSDK),
    returnValue: rule.returnValue
  }
}

function transformConditionToSDK(condition: RuleCondition): SDKCondition {
  return {
    attributeName: condition.attributeName,
    operator: condition.operator,
    value: condition.value,
    listValues: condition.listValues
  }
}
