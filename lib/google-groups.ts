import { google } from 'googleapis'

const ALLOWED_GROUPS = ['eng-leads@qeen.ai','engineering@qeen.ai', 'product-team@qeen.ai','sales@qeen.ai']
const ALLOWED_DOMAIN = '@qeen.ai'

export async function getUserGoogleGroups(userEmail: string): Promise<string[]> {
  const enableGroupsCheck = process.env.ENABLE_GOOGLE_GROUPS_CHECK === 'true'
  
  if (!enableGroupsCheck) {
    return userEmail.endsWith(ALLOWED_DOMAIN) ? ['engineering@qeen.ai'] : []
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/admin.directory.group.readonly'],
      subject: process.env.GOOGLE_ADMIN_EMAIL,
    })

    const admin = google.admin({ version: 'directory_v1', auth })
    const userGroups: string[] = []

    for (const groupEmail of ALLOWED_GROUPS) {
      try {
        await admin.members.get({
          groupKey: groupEmail,
          memberKey: userEmail,
        })
        userGroups.push(groupEmail)
      } catch (error: any) {
        if (error.code !== 404) {
          console.error(`Error checking group ${groupEmail}:`, error)
        }
      }
    }

    return userGroups
  } catch (error) {
    console.error('Error fetching user groups:', error)
    return userEmail.endsWith(ALLOWED_DOMAIN) ? ['engineering@qeen.ai'] : []
  }
}

export async function checkGroupMembership(userEmail: string): Promise<boolean> {
  const groups = await getUserGoogleGroups(userEmail)
  return groups.length > 0
}
