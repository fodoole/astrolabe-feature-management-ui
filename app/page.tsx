import { Suspense } from "react"
import AuthWrapper from "@/components/auth-wrapper"
import DashboardWithRouting from "@/components/dashboard-with-routing"

interface PageProps {
  searchParams: Promise<{
    tab?: string
    project?: string
    flag?: string
  }>
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  
  return (
    <AuthWrapper>
      <Suspense fallback={<div>Loading...</div>}>
        <DashboardWithRouting searchParams={resolvedSearchParams} />
      </Suspense>
    </AuthWrapper>
  )
}
