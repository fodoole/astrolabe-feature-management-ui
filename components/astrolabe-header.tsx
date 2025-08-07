"use client"

import { Navigation } from "lucide-react"

export function AstrolabeHeader() {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
        <Navigation className="w-5 h-5 text-primary-foreground" />
      </div>
      <div>
        <h1 className="text-xl font-bold">Astrolabe</h1>
        <p className="text-xs text-muted-foreground">Feature Management</p>
      </div>
    </div>
  )
}
