"use client"

import React from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Lock, ExternalLink } from "lucide-react"
import Link from "next/link"
import type { ApprovalRequest } from "../types"

interface PendingApprovalBannerProps {
  approval: ApprovalRequest
}

export function PendingApprovalBanner({ approval }: PendingApprovalBannerProps) {
  return (
    <Alert className="border-orange-200 bg-orange-50 mb-4">
      <Lock className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        <div className="flex items-center justify-between">
          <span>Changes are pending approval and cannot be edited until reviewed.</span>
          <Button asChild variant="outline" size="sm" className="ml-4">
            <Link href={`/approvals/${approval.id}`}>
              View Approval Request
              <ExternalLink className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
