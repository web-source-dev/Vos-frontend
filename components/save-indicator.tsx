"use client"

import { CheckCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SaveIndicatorProps {
  isSaving: boolean
  className?: string
}

export function SaveIndicator({ isSaving, className }: SaveIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      {isSaving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-blue-600">Saving...</span>
        </>
      ) : (
        <>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-green-600">Saved</span>
        </>
      )}
    </div>
  )
}
