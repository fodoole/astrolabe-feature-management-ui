import Link from 'next/link'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Access Denied
          </CardTitle>
          <CardDescription className="text-gray-600">
            You arrived here by mistake
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-500">
            Your email address is not authorized to access this application. 
            Only members of the tech teams can access this feature management system.
          </p>
          <div className="pt-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/" className="flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Link>
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            If you believe this is an error, please contact your system administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
