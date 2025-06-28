"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { InspectorView } from "@/components/inspector-view"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"
import { Inspection, InspectionSection } from "@/lib/types"

interface InspectionPageProps {
  params: Promise<{
    token: string
  }>
}

// Interface for inspection submission data that matches the API expectations
interface InspectionSubmissionData {
  sections: InspectionSection[];
  overallRating?: number;
  overallScore?: number;
  inspectionNotes?: string;
  recommendations?: string[];
  estimatedRepairCost?: number;
  estimatedRepairTime?: string;
}

export default function InspectionPage({ params }: InspectionPageProps) {
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { token } = React.use(params)

  useEffect(() => {
    const fetchInspection = async () => {
      try {
        setIsLoading(true)
        const response = await api.getInspectionByToken(token)
        
        if (response.success && response.data) {
          setInspection(response.data)
        } else {
          setError("Failed to load inspection. The token may be invalid or expired.")
        }
      } catch (error) {
        console.error("Error fetching inspection:", error)
        setError("An error occurred while loading the inspection data.")
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchInspection()
    }
  }, [token])

  const handleSubmitInspection = async (formattedData: InspectionSubmissionData) => {
    try {
      const response = await api.submitInspection(token, formattedData)
      
      if (response.success) {
        toast({
          title: "Inspection Submitted",
          description: "Vehicle inspection has been completed successfully.",
        })
        
        // Redirect to inspector dashboard after successful submission
        setTimeout(() => {
          router.push("/inspector/dashboard")
        }, 2000)
      } else {
        throw new Error(response.error || "Failed to submit inspection")
      }
    } catch (error: unknown) {
      console.error("Error submitting inspection:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to submit inspection data"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleBack = () => {
    router.push("/inspector/dashboard")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading inspection data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/inspector/dashboard")}
            className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (inspection && inspection.status === "completed") {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-green-800 mb-2">Inspection Complete</h2>
          <p className="text-green-700 mb-4">This inspection has already been completed.</p>
          <button
            onClick={() => router.push("/inspector/dashboard")}
            className="px-4 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
          >
            View Other Inspections
          </button>
        </div>
      </div>
    )
  }

  return (
    <InspectorView 
      vehicleData={{
        inspection,
        vehicle: inspection?.vehicle,
        customer: inspection?.customer
      }} 
      onSubmit={handleSubmitInspection}
      onBack={handleBack}
    />
  )
} 