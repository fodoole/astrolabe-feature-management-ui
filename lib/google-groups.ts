import { google } from 'googleapis'

const ALLOWED_GROUPS = ['eng-leads@qeen.ai','engineering@qeen.ai', 'product-team@qeen.ai','sales@qeen.ai']

export async function checkGroupMembership(userEmail: string): Promise<boolean> {
  try {
    // Initialize Google Admin SDK with service account credentials
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/admin.directory.group.readonly'],
      // Subject should be an admin user who can read group memberships
      subject: process.env.GOOGLE_ADMIN_EMAIL,
    })

    const admin = google.admin({ version: 'directory_v1', auth })

    // Check membership in each allowed group
    for (const groupEmail of ALLOWED_GROUPS) {
      try {
        await admin.members.get({
          groupKey: groupEmail,
          memberKey: userEmail,
        })
        // If we get here without error, user is a member
        return true
      } catch (error: any) {
        // 404 means user is not a member of this group, continue to next group
        if (error.code !== 404) {
          console.error(`Error checking group ${groupEmail}:`, error)
        }
      }
    }

    return false
  } catch (error) {
    console.error('Error checking group membership:', error)
    return false
  }
}
