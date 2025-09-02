interface UserSyncData {
  name: string
  email: string
  avatar_url: string | null
  provider: string
  provider_id: string
  google_groups?: string[]
}

export async function syncUserWithBackend(userData: UserSyncData) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  
  try {
    const response = await fetch(`${apiUrl}/api/v1/users/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to sync user: ${response.statusText}`)
    }
    
    const syncedUser = await response.json()
    console.log('User synced successfully:', syncedUser)
    return syncedUser
  } catch (error) {
    console.error('Error syncing user with backend:', error)
    throw error
  }
}
