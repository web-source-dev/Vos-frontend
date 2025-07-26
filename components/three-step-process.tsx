"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, ArrowRight, ArrowLeft } from "lucide-react"
import { QuotePreparation } from "./stages/quote-preparation"
import { OfferDecision } from "./stages/offer-decision"
import { BillOfSale } from "./stages/bill-of-sale"
import { useStageTimer } from "./useStageTimer"
// Using any types to avoid conflicts with existing stage component interfaces
type CaseData = any

interface ThreeStepProcessProps {
  vehicleData: CaseData
  onUpdate: (data: CaseData) => void
  onComplete: () => void
  isEstimator?: boolean
  isAdmin?: boolean
  isAgent?: boolean
  initialStep?: number
}

export function ThreeStepProcess({ 
  vehicleData, 
  onUpdate, 
  onComplete, 
  isEstimator = false, 
  isAdmin = false,
  isAgent = false,
  initialStep = 1
}: ThreeStepProcessProps) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isProcessStarted, setIsProcessStarted] = useState(false)

  // Initialize timer for quoteAndDecision stage
  const timer = useStageTimer(vehicleData.id || vehicleData._id, 'quoteAndDecision')

  // Define the steps
  const steps = [
    { id: 1, title: "Quote Preparation", description: "Prepare vehicle quote" },
    { id: 2, title: "Offer Decision", description: "Customer decision on offer" },
    { id: 3, title: "Bill of Sale", description: "Complete bill of sale" }
  ]

  // Start timer when component mounts if not already started
  useEffect(() => {
    const caseId = vehicleData.id || vehicleData._id
    if (!isProcessStarted && caseId && !timer.startTime) {
      console.log('Starting quoteAndDecision timer for case:', caseId)
      timer.start()
      setIsProcessStarted(true)
    }
  }, [vehicleData.id, vehicleData._id, isProcessStarted, timer.startTime])

  // Update completed steps based on vehicle data
  useEffect(() => {
    const completed: number[] = []
    
    // Check if quote is ready or beyond
    if (vehicleData.quote?.status === 'ready' || 
        vehicleData.quote?.status === 'presented' || 
        vehicleData.quote?.status === 'accepted' || 
        vehicleData.quote?.status === 'declined') {
      completed.push(1)
    }
    
    // Check if offer decision is made
    if (vehicleData.offerDecision?.decision === 'accepted' || 
        vehicleData.offerDecision?.decision === 'declined' ||
        vehicleData.quote?.offerDecision?.decision === 'accepted' ||
        vehicleData.quote?.offerDecision?.decision === 'declined') {
      completed.push(2)
    }
    
    // Check if bill of sale is completed
    if (vehicleData.transaction?.billOfSale) {
      completed.push(3)
    }
    
    setCompletedSteps(completed)
  }, [vehicleData])

  // Handle initialStep prop changes
  useEffect(() => {
    if (initialStep >= 1 && initialStep <= 3) {
      setCurrentStep(initialStep)
    }
  }, [initialStep])

  const handleStepComplete = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    } else {
      // When all three steps are complete, stop the timer and call onComplete
      console.log('Completing quoteAndDecision stage, stopping timer')
      await timer.stop()
      onComplete()
    }
  }

  const handleStepChange = (step: number) => {
    // Allow navigation to any step (1-3)
    if (step >= 1 && step <= 3) {
      setCurrentStep(step)
    }
  }

  const getStepStatus = (stepId: number) => {
    if (completedSteps.includes(stepId)) {
      return 'completed'
    } else if (stepId === currentStep) {
      return 'active'
    } else {
      return 'pending'
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <QuotePreparation
            vehicleData={vehicleData}
            onUpdate={onUpdate}
            onComplete={handleStepComplete}
            isEstimator={isEstimator}
            isAdmin={isAdmin}
            isAgent={isAgent}
          />
        )
      case 2:
        return (
          <OfferDecision
            vehicleData={vehicleData}
            onUpdate={onUpdate}
            onComplete={handleStepComplete}
            onStageChange={handleStepChange}
            isEstimator={isEstimator}
          />
        )
      case 3:
        return (
          <BillOfSale
            vehicleData={vehicleData}
            onUpdate={onUpdate}
            onComplete={handleStepComplete}
            isEstimator={isEstimator}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Navigation */}
      <Card className="sticky top-0 z-10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id)
              const isCompleted = status === 'completed'
              const isActive = status === 'active'
              
              return (
                <div key={step.id} className="flex items-center">
                  {/* Step Circle */}
                  <button
                    onClick={() => handleStepChange(step.id)}
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isActive
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-gray-100 border-gray-300 text-gray-500 hover:border-gray-400'
                    }`}
                    disabled={false}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <span className="font-semibold">{step.id}</span>
                    )}
                  </button>
                  
                  {/* Step Info */}
                  <div className="ml-4">
                    <h3 className={`font-semibold ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-500">{step.description}</p>
                  </div>
                  
                  {/* Arrow */}
                  {index < steps.length - 1 && (
                    <ArrowRight className="h-6 w-6 text-gray-300 mx-6" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Timer Display */}
      <Card className="hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                Quote & Decision Timer
              </Badge>
              <span className="text-sm text-gray-600">
                {timer.elapsedFormatted}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Step {currentStep} of {steps.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <div className="min-h-[600px]">
        {renderStepContent()}
      </div>

      {/* Step Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => handleStepChange(currentStep - 1)}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous Step
        </Button>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            Step {currentStep} of {steps.length}
          </Badge>
          
          {currentStep < 3 && (
            <Button
              variant="outline"
              onClick={() => handleStepChange(currentStep + 1)}
              disabled={false}
              className="flex items-center gap-2"
            >
              Next Step
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 