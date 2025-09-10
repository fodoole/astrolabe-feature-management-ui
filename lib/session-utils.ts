'use client'

import { useSession } from 'next-auth/react'
import { useMemo, useCallback } from 'react'
import type { Session } from 'next-auth'

/**
 * Hook that returns the current user's backend ID from the session
 * This is the recommended way to get the user ID in React components
 * 
 * @example
 * function MyComponent() {
 *   const userId = useUserId();
 *   // Use userId safely with null checks
 * }
 * 
 * @returns The backend user ID as string or null if not available
 */
export function useUserId(): string | null {
    const { data: session, status } = useSession()

    return useMemo(() => {
        // If session is loading or user isn't authenticated yet
        if (!session?.user) return null

        const userId = session.user.id

        // Make sure we have a valid ID
        if (typeof userId !== 'string' || !userId) {
            return null
        }

        return userId
    }, [session])
}

/**
 * Hook that provides user session information and utilities
 * Centralizes authentication state and permission checks
 * 
 * @example
 * function AdminPanel() {
 *   const { isAuthenticated, hasPermission, userEmail } = useUserSession();
 *   
 *   if (!isAuthenticated) return <LoginPrompt />;
 *   if (!hasPermission('admin_access')) return <AccessDenied />;
 *   
 *   return <div>Welcome Admin: {userEmail}</div>;
 * }
 * 
 * @returns Object with user data and helper functions
 */
export function useUserSession() {
    const { data: session, status } = useSession()

    const userId = useMemo(() => session?.user?.id || null, [session])
    const userEmail = useMemo(() => session?.user?.email || null, [session])
    const userRoles = useMemo(() => session?.user?.roles || null, [session])
    const userPermissions = useMemo(() => session?.user?.permissions || null, [session])
    const userGroups = useMemo(() => session?.user?.google_groups || [], [session])

    // Check if user has a specific permission - memoized for performance
    const hasPermission = useCallback((permission: string) => {
        if (!session?.user?.permissions) return false
        return session.user.permissions.includes(permission)
    }, [session])

    // Check if user has a specific role - memoized for performance
    const hasRole = useCallback((role: string) => {
        if (!session?.user?.roles) return false
        return session.user.roles === role
    }, [session])

    // Check if user belongs to a specific Google group - memoized for performance
    const inGroup = useCallback((group: string) => {
        if (!session?.user?.google_groups) return false
        return session.user.google_groups.includes(group)
    }, [session])

    return {
        userId,
        userEmail,
        userRoles,
        userPermissions,
        userGroups,
        isAuthenticated: status === 'authenticated',
        isLoading: status === 'loading',
        hasPermission,
        hasRole,
        inGroup,
        session,
    }
}

/**
 * Function to safely get user ID from session (for non-hook contexts)
 * Use this in event handlers, callbacks, or any non-React hook context
 * 
 * @example
 * const handleSubmit = (e) => {
 *   e.preventDefault();
 *   const userId = getUserIdFromSession(session);
 *   if (!userId) {
 *     showError('Not authenticated');
 *     return;
 *   }
 *   submitForm({ userId, ...formData });
 * };
 * 
 * @param session The session object from NextAuth
 * @returns The backend user ID as string or null if not available
 */
export function getUserIdFromSession(session: Session | null | undefined): string | null {
    // Get the user ID from the session (backend ID)
    const userId = session?.user?.id

    if (typeof userId !== 'string' || !userId) {
        return null // Return null when no user ID is found or invalid
    }

    return userId
}
