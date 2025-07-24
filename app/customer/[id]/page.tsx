"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { VosLayout } from "@/components/vos-layout"
import { IntakeForm } from "@/components/stages/intake-form"
import { ScheduleInspection } from "@/components/stages/schedule-inspection"
import { InspectionForm } from "@/components/stages/inspection-form"
import { QuotePreparation } from "@/components/stages/quote-preparation"
import { OfferDecision } from "@/components/stages/offer-decision"
import { Paperwork } from "@/components/stages/paperwork"
import { Completion } from "@/components/stages/completion"
import { CaseSummary } from "@/components/stages/case-summary"
import { useAuth } from "@/lib/auth"
import api from "@/lib/api"
import { Case, Inspection } from "@/lib/types"

interface CustomerDetailProps {
  params: {
    id: string
  }
}

// Extended case data interface for the component
interface CaseData extends Case {
  inspection?: Inspection & { accessToken?: string };
}
// Interface for inspection submission data that matches the API expectations


export default function CustomerDetail({ params }: CustomerDetailProps) {
  const router = useRouter()
  const { isAdmin, isAgent, isEstimator, isInspector } = useAuth()
  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [currentStage, setCurrentStage] = useState(0) // 0 means summary view
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Role-based stage access - moved to useCallback to fix dependency warning
  const getAccessibleStages = useCallback(() => {
    if (isAdmin || isAgent || isEstimator) return [1, 2, 3, 4, 5, 6, 7]; // Admin, agent and estimator can access all stages
    if (isInspector) return [3]; // Inspector can only access inspection stage
    return []; // No access
  }, [isAdmin, isAgent, isEstimator, isInspector])

  // Fetch case data based on the ID
  useEffect(() => {
    const fetchCase = async () => {
      try {
        const response = await api.getCase(params.id);
        if (response.success && response.data) {
          // Cast the response data to CaseData to handle the union types
          const caseData = response.data as CaseData;
          setCaseData(caseData);
          
          // Always start with summary view (stage 0)
          setCurrentStage(0);
        } else {
          setError("Failed to fetch case data");
          router.push('/');
        }
      } catch (err) {
        console.error("Error fetching case:", err);
        setError("Error loading case data");
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCase();
  }, [params.id, router, getAccessibleStages]);

  const updateCaseData = async (data: Partial<CaseData>) => {
    setCaseData((prev: CaseData | null) => prev ? { ...prev, ...data } : null);
  }

  const updateStageStatus = async (stage: number, status: string) => {
    setCaseData((prev: CaseData | null) => prev ? {
      ...prev,
      stageStatuses: {
        ...prev.stageStatuses,
        [stage]: status as 'active' | 'complete' | 'pending',
      },
    } : null);
  }

  const advanceToStage = async (stage: number) => {
    const previousStage = currentStage;
    setCurrentStage(stage);
    updateStageStatus(stage, "active");
    
    if (previousStage < stage) {
      // Only update the case's current stage in the database if we're moving forward
      // This ensures progress is not lost when navigating back to previous stages
      if (stage > 1) {
        updateStageStatus(previousStage, "complete");
      }
      setCaseData((prev: CaseData | null) => prev ? { ...prev, currentStage: stage } : null);
      
      // Update case stage in the backend
      try {
        if (caseData) {
          await api.updateCaseStage(caseData.id || "", {
            currentStage: stage,
            stageStatuses: {
              ...caseData.stageStatuses,
              [stage]: "active",
              ...(stage > 1 ? { [previousStage]: "complete" } : {})
            }
          });
        }
      } catch (error) {
        console.error("Error updating case stage:", error);
      }
    }
    // If going backward, we don't update the currentStage in the database
    // This way the progress bar continues to show the maximum progress reached
  }

  const handleBackToDashboard = () => {
    router.push('/');
  }

  const canAccessStage = (stage: number) => {
    // Summary stage (0) is always accessible
    if (stage === 0) {
      return true;
    }
    return getAccessibleStages().includes(stage);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-gray-900 mb-3 md:mb-4"></div>
          <p className="text-gray-600 text-sm md:text-base">Loading case data...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4 text-sm md:text-base">{error || "Case not found"}</p>
          <button
            className="px-3 py-2 md:px-4 md:py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm md:text-base"
            onClick={() => router.push('/')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Check if user has access to this case
  if (!canAccessStage(currentStage)) {
    const accessibleStages = getAccessibleStages();
    
    // If user has any accessible stages, redirect to the highest one they can access
    if (accessibleStages.length > 0) {
      const highestAccessibleStage = Math.max(...accessibleStages);
      setCurrentStage(highestAccessibleStage);
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-gray-900 mb-3 md:mb-4"></div>
            <p className="text-gray-600 text-sm md:text-base">Redirecting to accessible stage...</p>
          </div>
        </div>
      );
    }
    
    // If no accessible stages, show error
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4 text-sm md:text-base">You don&apos;t have access to this case.</p>
          <button
            className="px-3 py-2 md:px-4 md:py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm md:text-base"
            onClick={() => router.push('/')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const renderCurrentStage = () => {
    switch (currentStage) {
      case 0:
        return (
          <CaseSummary
            vehicleData={caseData}
            onStageChange={setCurrentStage}
            accessibleStages={getAccessibleStages()}
          />
        )

      case 1:
        return (
          <IntakeForm
            vehicleData={caseData}
            onUpdate={updateCaseData}
            onComplete={() => advanceToStage(2)}
          />
        )

      case 2:
        return (
          <ScheduleInspection
            vehicleData={caseData}
            onUpdate={updateCaseData}
            onComplete={() => advanceToStage(3)}
          />
        )

      case 3:
          return (
            <InspectionForm
              vehicleData={caseData}
              onUpdate={updateCaseData}
              onComplete={() => advanceToStage(4)}
              onOpenInspectorView={() => router.push(`/inspection/${caseData.inspection?.accessToken}`)}
            />
          )

      case 4:
        return (
          <QuotePreparation
            vehicleData={caseData}
            onUpdate={updateCaseData}
            onComplete={() => advanceToStage(5)}
            isEstimator={isEstimator}
            isAdmin={isAdmin}
            isAgent={isAgent}
          />
        )

      case 5:
        return (
          <OfferDecision
            vehicleData={caseData}
            onUpdate={updateCaseData}
            onComplete={() => advanceToStage(6)}
            onStageChange={setCurrentStage}
            isEstimator={isEstimator}
          />
        )

      case 6:
        // Map caseData to the local CaseData interface expected by Paperwork
        const mappedCaseData: CaseData = {
          id: caseData.id,
          _id: (caseData as CaseData)._id,
          customer: typeof caseData.customer === 'object' ? caseData.customer : undefined,
          vehicle: typeof caseData.vehicle === 'object' ? caseData.vehicle : undefined,
          offerDecision: (caseData as CaseData).offerDecision,
          quote: typeof caseData.quote === 'object' ? caseData.quote : undefined,
          transaction: typeof caseData.transaction === 'object' ? caseData.transaction : undefined,
          currentStage: caseData.currentStage,
          status: caseData.status,
          stageStatuses: caseData.stageStatuses,
        }

        return (
          <Paperwork
            vehicleData={mappedCaseData}
            onUpdate={updateCaseData}
            onComplete={() => advanceToStage(7)}
            isEstimator={isEstimator}
            isAdmin={isAdmin}
            isAgent={isAgent}
          />
        )

      case 7:
        return (
          <Completion 
            vehicleData={caseData} 
            onUpdate={updateCaseData} 
            onComplete={() => advanceToStage(8)} 
            isEstimator={isEstimator}
          />
        )

      default:
        return (
          <IntakeForm
            vehicleData={caseData}
            onUpdate={updateCaseData}
            onComplete={() => advanceToStage(2)}
          />
        )
    }
  }

  return (
    <VosLayout
      currentStage={currentStage}
      maxStage={caseData.currentStage}
      vehicleData={caseData}
      onStageChange={setCurrentStage}
      onBackToDashboard={handleBackToDashboard}
      accessibleStages={getAccessibleStages()}
    >
      <div className="space-y-4 md:space-y-6">
        {renderCurrentStage()}
      </div>
    </VosLayout>
  )
} 