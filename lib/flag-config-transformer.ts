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
  attributeId: string
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
    attributeId: condition.attributeId,
    operator: condition.operator,
    value: condition.value,
    listValues: condition.listValues
  }
}

// Derived attribute metadata the backend enriches onto each condition
// (attribute_key/attribute_type, camelCased to attributeKey/attributeType when
// fetched through the api-client). These are re-derived from attributeId on
// every approval, so they persist in the stored "before" snapshot but never
// appear in the freshly-serialized "after" — producing a phantom diff on every
// edit. Strip them from both snapshots before diffing/rendering so reviewers
// only see real changes.
const DERIVED_CONDITION_KEYS = ['attributeKey', 'attributeType', 'attribute_key', 'attribute_type']

function stripDerivedConditionKeys(rules: any[]): any[] {
  return rules.map((rule) => {
    if (!rule || !Array.isArray(rule.conditions)) return rule
    return {
      ...rule,
      conditions: rule.conditions.map((condition: any) => {
        if (!condition || typeof condition !== 'object') return condition
        const cleaned = { ...condition }
        for (const key of DERIVED_CONDITION_KEYS) delete cleaned[key]
        return cleaned
      }),
    }
  })
}

// Accepts either a full flag snapshot ({ environments: [...] }) or a single
// environment config ({ rules: [...] }) and returns a copy with derived
// attribute metadata removed from every condition.
export function stripDerivedAttributeMetadata(snapshot: any): any {
  if (!snapshot || typeof snapshot !== 'object') return snapshot
  if (Array.isArray(snapshot.environments)) {
    return {
      ...snapshot,
      environments: snapshot.environments.map((env: any) =>
        env && Array.isArray(env.rules) ? { ...env, rules: stripDerivedConditionKeys(env.rules) } : env
      ),
    }
  }
  if (Array.isArray(snapshot.rules)) {
    return { ...snapshot, rules: stripDerivedConditionKeys(snapshot.rules) }
  }
  return snapshot
}
