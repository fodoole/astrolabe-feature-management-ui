'use client'

import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from './ui/button'
import { Card } from './ui/card'

// Safe JWT decode (no verification, for debugging only)
function decodeJwt(token?: string) {
    if (!token) return null
    try {
        const payload = token.split('.')[1]
        if (!payload) return { error: 'Missing payload section' }
        const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        return JSON.parse(decodeURIComponent(
            json.split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
        ))
    } catch (e) {
        return { error: 'Decode failed' }
    }
}


