import { Suspense } from "react"
import AuthWrapper from "@/components/auth-wrapper"
import DashboardWithRouting from "@/components/dashboard-with-routing"

interface PageProps {
  searchParams: {
    tab?: string
    project?: string
    flag?: string
  }
}

export default function Page({ searchParams }: PageProps) {
  return (
    <AuthWrapper>
      <Suspense fallback={<div>Loading...</div>}>
        <DashboardWithRouting searchParams={searchParams} />
      </Suspense>
    </AuthWrapper>
  )
}
