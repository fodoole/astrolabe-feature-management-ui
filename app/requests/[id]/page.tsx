import { Suspense } from "react"
import { RequestDetailsPage } from "@/components/request-details-page"

interface RequestPageProps {
  params: {
    id: string
  }
}

export default async function RequestPage({ params }: RequestPageProps) {
  const p = await params
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RequestDetailsPage requestId={p.id} />
    </Suspense>
  )
}
