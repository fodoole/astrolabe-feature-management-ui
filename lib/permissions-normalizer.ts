import { NormalizedPermissions, PermissionAction } from '@/types'

// Helper to coerce different backend representations to real boolean
function toBool(v: any): boolean {
    return v === true || v === 'true' || v === 1 || v === '1'
}

export function normalizePermissions(blob: any): NormalizedPermissions {
    if (!blob || typeof blob !== 'object') {
        return { resources: {}, _raw: blob }
    }
    const resources: Record<string, PermissionAction[]> = {}
    const envPerms: Record<string, PermissionAction[]> = {}

    const mapCrud = (key: string) => {
        const node = blob[key]
        if (node && typeof node === 'object') {
            const acts: PermissionAction[] = []
            if (toBool(node.create)) acts.push('create')
            if (toBool(node.read)) acts.push('read')
            if (toBool(node.update)) acts.push('update')
            if (toBool(node.delete)) acts.push('delete')
            if (acts.length) {
                resources[key] = acts
            }
        }
    }

        ;['attributes', 'teams', 'projects', 'flags'].forEach(mapCrud)

    if (blob.approvals) {
        const acts: PermissionAction[] = []
        if (toBool(blob.approvals.request)) acts.push('request')
        if (toBool(blob.approvals.approve)) acts.push('approve')
        if (acts.length) resources['approvals'] = acts
        if (toBool(blob.can_approve_staging) || toBool(blob.approvals.approve_staging)) {
            envPerms['staging'] = [...(envPerms['staging'] || []), 'approve']
        }
        if (toBool(blob.can_approve_production) || toBool(blob.approvals.approve_production)) {
            envPerms['production'] = [...(envPerms['production'] || []), 'approve']
        }
    }

    if (toBool(blob.can_create_flags)) {
        resources['flags'] = [...(resources['flags'] || []), 'create', 'read']
    }
    if (toBool(blob.can_read_only)) {
        ;['flags', 'projects', 'attributes', 'teams'].forEach(r => {
            if (!resources[r]) resources[r] = ['read']
            else if (!resources[r].includes('read')) resources[r].push('read')
        })
    }

    // Baseline read access for core resources (all users)
    ;['flags', 'projects', 'attributes', 'teams'].forEach(r => {
        if (!resources[r]) resources[r] = ['read']
        else if (!resources[r].includes('read')) resources[r].push('read')
    })

    const normalized: NormalizedPermissions = {
        resources,
        environments: Object.keys(envPerms).length ? envPerms : undefined,
        _raw: blob
    }
    return normalized
}

export function hasPermission(perms: NormalizedPermissions | null, resource: string, action: PermissionAction, opts?: { environment?: string }) {
    if (!perms) return false
    if (opts?.environment) {
        const envActs = perms.environments?.[opts.environment]
        if (envActs?.includes(action)) return true
    }
    const acts = perms.resources[resource]
    return !!acts && acts.includes(action)
}
