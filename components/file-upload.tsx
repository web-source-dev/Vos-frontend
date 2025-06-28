"use client"

import type React from "react"

import { useState } from "react"
import { Upload, type File, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  label: string
  accept?: string
  onUpload: (file: File) => void
  className?: string
  disabled?: boolean
}

export function FileUpload({ label, accept = "*", onUpload, className, disabled }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploaded, setIsUploaded] = useState(false)

  const handleFileSelect = (file: File) => {
    if (file) {
      setIsUploaded(true)
      onUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg p-4 text-center transition-colors",
        isDragOver && !disabled ? "border-blue-400 bg-blue-50" : "border-gray-300",
        isUploaded ? "border-green-400 bg-green-50" : "",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-gray-400",
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={disabled}
      />

      <div className="flex flex-col items-center gap-2">
        {isUploaded ? (
          <>
            <CheckCircle className="h-8 w-8 text-green-600" />
            <p className="text-sm font-medium text-green-800">{label}</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">Drag & drop or click to select</p>
          </>
        )}
      </div>
    </div>
  )
}
