"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Download, Mail, Key, Car, FileText, Heart, Save, Clock } from "lucide-react"
import api from '@/lib/api'
import { useStageTimer } from '@/components/useStageTimer'
import { useRouter } from "next/navigation"

interface CustomerData {
  firstName?: string
  lastName?: string
  email1?: string
  cellPhone?: string
}

interface VehicleData {
  year?: string | number
  make?: string
  model?: string
  vin?: string
  currentMileage?: string
  color?: string
}

interface QuoteData {
  offerAmount?: number
  accessToken?: string
}

interface OfferDecisionData {
  finalAmount?: number
  decision?: string
}

interface TransactionData {
  billOfSale?: {
    salePrice?: number
    saleDate?: string
  }
  paymentStatus?: string
}

interface CompletionData {
  thankYouSent?: boolean
  sentAt?: string
  leaveBehinds?: {
    vehicleLeft?: boolean
    keysHandedOver?: boolean
    documentsReceived?: boolean
  }
  pdfGenerated?: boolean
  completedAt?: string
  titleConfirmation?: boolean
}

interface CaseData {
  id?: string
  _id?: string
  customer?: CustomerData
  vehicle?: VehicleData
  quote?: QuoteData
  offerDecision?: OfferDecisionData
  transaction?: TransactionData
  completion?: CompletionData
  status?: string
  currentStage?: number
  stageStatuses?: { [key: number]: string }
}

interface CompletionProps {
  vehicleData: CaseData
  onUpdate: (data: Partial<CaseData>) => void
  onComplete: () => void
  isEstimator?: boolean
  token?: string
}

export function Completion({ vehicleData, onUpdate, onComplete, isEstimator = false, token }: CompletionProps) {
  const [thankYouSent, setThankYouSent] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [leaveBehinds, setLeaveBehinds] = useState({
    vehicleLeft: false,
    keysHandedOver: false,
    documentsReceived: false,
  })
  const [titleConfirmation, setTitleConfirmation] = useState(false)
  const { toast } = useToast()
  const [isCompleting, setIsCompleting] = useState(false)
  const router = useRouter()
  // Stage timer for completion stage with case ID and stage name
  const caseId = vehicleData._id;
  const timer = useStageTimer(caseId, 'completion')

  // Load existing completion data when component mounts
  useEffect(() => {
    if (vehicleData.completion) {
      setThankYouSent(vehicleData.completion.thankYouSent || false)
      setLeaveBehinds({
        vehicleLeft: vehicleData.completion.leaveBehinds?.vehicleLeft || false,
        keysHandedOver: vehicleData.completion.leaveBehinds?.keysHandedOver || false,
        documentsReceived: vehicleData.completion.leaveBehinds?.documentsReceived || false,
      })
      setTitleConfirmation(vehicleData.completion.titleConfirmation || false)
    }
  }, [vehicleData.completion])

  // Start timer when component mounts (if not already started from saved data)
  useEffect(() => {
    if (!timer.startTime && !timer.isLoading) {
      timer.start()
    }
  }, [timer])

  // Calculate final amount from various sources
  const finalAmount = 
    vehicleData.offerDecision?.finalAmount || 
    vehicleData.quote?.offerAmount || 
    vehicleData.transaction?.billOfSale?.salePrice || 
    0

  // Get customer name
  const customerName = vehicleData.customer 
    ? `${vehicleData.customer.firstName || ''} ${vehicleData.customer.lastName || ''}`.trim()
    : 'Unknown Customer'

  // Get vehicle description
  const vehicleDescription = vehicleData.vehicle
    ? `${vehicleData.vehicle.year || ''} ${vehicleData.vehicle.make || ''} ${vehicleData.vehicle.model || ''}`.trim()
    : 'Unknown Vehicle'

  const handleLeaveBehindsChange = (item: string, checked: boolean) => {
    const newLeaveBehinds = {
      ...leaveBehinds,
      [item]: checked,
    }
    setLeaveBehinds(newLeaveBehinds)
    
    // Auto-save the checklist
    saveCompletionData({
      leaveBehinds: newLeaveBehinds
    })
  }

  const saveCompletionData = async (completionData: Partial<CompletionData>) => {
    try {
      setIsSaving(true)
      const caseId = vehicleData.id || vehicleData._id
      
      if (!caseId) {
        console.error("Case ID not found")
        return
      }

      const dataToSave = {
        thankYouSent,
        sentAt: thankYouSent ? new Date().toISOString() : undefined,
        leaveBehinds,
        pdfGenerated: true,
        completedAt: new Date().toISOString(),
        ...completionData
      }

      const response = await api.saveCompletionData(caseId, dataToSave)
      
      if (response.success) {
        // Update local state with the response data
        onUpdate({ completion: response.data?.completion as CompletionData })
        
        if (!isSaving) {
          toast({
            title: "Data Saved",
            description: "Completion data has been saved successfully.",
          })
        }
      }
    } catch (error) {
      console.error('Error saving completion data:', error)
      if (!isSaving) {
        const errorData = api.handleError(error)
        toast({
          title: "Error Saving Data",
          description: errorData.error,
          variant: "destructive",
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendThankYou = async () => {
    try {
      const caseId = vehicleData.id || vehicleData._id

      if (!caseId) {
        throw new Error("Case ID not found")
      }

      // Stop timer and get timing data (now handles saving automatically)
      const timingData = await timer.stop()
      console.log('Stage timing data:', timingData)

      let response;
      
      if (isEstimator) {
        // For estimators, use the case ID-based endpoint 
        response = await api.completeCaseByCaseId(caseId);
      } else if (token) {
        // For token-based access, use the token-based endpoint
        response = await api.completeCaseWithToken(token);
        console.log('handleSendThankYou - response:', response);
      } else {
        // For authenticated users, use the separate endpoints
        
        // Update case status and send thank you email
        await api.updateCaseStatus(caseId, 'completed');

        setThankYouSent(true)
        await saveCompletionData({
          thankYouSent: true,
          sentAt: new Date().toISOString()
        })

        toast({
          title: "Thank You Sent",
          description: "Thank you message and case file sent to customer.",
        })

        onComplete()
        return;
      }

      // For estimators and token-based access
      setThankYouSent(true)
      await saveCompletionData({
        thankYouSent: true,
        sentAt: new Date().toISOString()
      })

      toast({
        title: "Thank You Sent",
        description: "Thank you message and case file sent to customer.",
      })

      onComplete()
    } catch (error) {
      const errorData = api.handleError(error);
      toast({
        title: "Error Sending Thank You",
        description: errorData.error,
        variant: "destructive",
      })
    }
  }

  const handleDownloadCaseFile = async () => {
    try {
      setIsGeneratingPDF(true)
      
      const caseId = vehicleData.id || vehicleData._id

      if (!caseId) {
        throw new Error("Case ID not found")
      }

      let pdfBlob: Blob;
      
      if (isEstimator) {
        // For estimators, use the case ID-based endpoint
        pdfBlob = await api.generateCaseFile(caseId);
      } else if (token) {
        // For token-based access, use the token-based endpoint
        pdfBlob = await api.generateCaseFileWithToken(token);
      } else {
        // For authenticated users, use the regular endpoint
        pdfBlob = await api.generateCaseFile(caseId);
      }
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `case-${caseId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Case File Downloaded",
        description: "Complete case file has been downloaded successfully.",
      })
    } catch (error) {
      console.error('Error downloading case file:', error)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const allLeaveBehindsComplete = Object.values(leaveBehinds).every(Boolean) && titleConfirmation

  const handleComplete = async () => {
    try {
      setIsCompleting(true)

      const caseId = vehicleData.id || vehicleData._id

      if (!caseId) {
        throw new Error("Case ID not found")
      }

      // Stop timer and get timing data (now handles saving automatically)
      const timingData = await timer.stop()
      console.log('Stage timing data:', timingData)

      // Save final completion data
      await saveCompletionData({
        thankYouSent: true,
        sentAt: new Date().toISOString(),
        leaveBehinds,
        pdfGenerated: true,
        completedAt: new Date().toISOString()
      })

      let response;
      
      if (isEstimator) {
        // For estimators, use the case ID-based endpoint
        response = await api.completeCaseByCaseId(caseId);
      } else if (token) {
        // For token-based access, use the token-based endpoint
        response = await api.completeCaseWithToken(token);
      } else {
        // For authenticated users, use the regular endpoint
        response = await api.completeCase(caseId);
      }

      // Update local state with completed case data
      onUpdate({
        ...response.data?.case as CaseData
      })

      // Update stage statuses to mark stage 7 as complete
      const currentStageStatuses = vehicleData.stageStatuses || {};
      const stageData = {
        currentStage: vehicleData.currentStage || 8, // Preserve current stage or default to 8
        stageStatuses: {
          ...currentStageStatuses,
          7: 'complete' // Mark stage 7 (Completion) as complete
        }
      };
      
      // Update stage statuses in the database
      if (caseId) {
        try {
          await api.updateCaseStageByCaseId(caseId, stageData);
          console.log('Successfully updated stage statuses');
        } catch (error) {
          console.error('Failed to update stage statuses:', error);
        }
      }

      toast({
        title: "Case Completed",
        description: "Case file has been generated and process is complete.",
      })

      onComplete()

      router.push('/')

    } catch (error) {
      const errorData = api.handleError(error);
      toast({
        title: "Error Completing Case",
        description: errorData.error,
        variant: "destructive",
      })
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
          <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-green-800">Transaction Complete!</h1>
        <p className="text-muted-foreground mt-2">Vehicle purchase has been successfully completed</p>
      </div>

      {/* Transaction Summary */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-green-800 text-base md:text-lg">Final Transaction Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div>
              <Label className="text-xs md:text-sm font-medium text-green-700">Customer</Label>
              <p className="text-base md:text-lg font-semibold">{customerName}</p>
            </div>
            <div>
              <Label className="text-xs md:text-sm font-medium text-green-700">Vehicle</Label>
              <p className="text-base md:text-lg font-semibold">{vehicleDescription}</p>
            </div>
            <div>
              <Label className="text-xs md:text-sm font-medium text-green-700">VIN</Label>
              <p className="text-base md:text-lg font-semibold">{vehicleData.vehicle?.vin || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-xs md:text-sm font-medium text-green-700">Final Amount</Label>
              <p className="text-xl md:text-2xl font-bold text-green-600">${finalAmount.toLocaleString()}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-3 md:gap-4 text-center">
            <div>
              <Badge className="bg-green-100 text-green-800 mb-2 text-xs">Inspection</Badge>
              <p className="text-xs md:text-sm">Completed</p>
            </div>
            <div>
              <Badge className="bg-green-100 text-green-800 mb-2 text-xs">Payment</Badge>
              <p className="text-xs md:text-sm">{vehicleData.transaction?.paymentStatus === 'completed' ? 'Completed' : 'Processing'}</p>
            </div>
            <div>
              <Badge className="bg-green-100 text-green-800 mb-2 text-xs">Status</Badge>
              <p className="text-xs md:text-sm">Complete</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stage Timer */}
      <Card className="hidden">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Clock className="h-4 w-4 md:h-5 md:w-5" />
            Completion Stage Timer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 md:p-4 border rounded-lg">
            <div>
              <h4 className="font-medium text-sm md:text-base">Time Elapsed</h4>
              <p className="text-xs md:text-sm text-muted-foreground">Time spent on completion stage</p>
            </div>
            <div className="text-right">
              <p className="text-2xl md:text-3xl font-bold text-blue-600">{timer.elapsedFormatted}</p>
              <p className="text-xs text-muted-foreground">Started: {timer.startTime?.toLocaleTimeString() || 'Not started'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave-Behind Checklist */}
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Car className="h-4 w-4 md:h-5 md:w-5" />
            Leave-Behind Checklist
            {isSaving && (
              <div className="flex items-center gap-2 text-xs md:text-sm text-blue-600">
                <Save className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                Saving...
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">Ensure all items are completed before customer leaves:</p>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="vehicleLeft"
                checked={leaveBehinds.vehicleLeft}
                onChange={(e) => handleLeaveBehindsChange("vehicleLeft", e.target.checked)}
                className="rounded"
              />
              <label htmlFor="vehicleLeft" className="flex items-center gap-2 text-xs md:text-sm">
                <Car className="h-3 w-3 md:h-4 md:w-4" />
                Vehicle left at designated location
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="keysHandedOver"
                checked={leaveBehinds.keysHandedOver}
                onChange={(e) => handleLeaveBehindsChange("keysHandedOver", e.target.checked)}
                className="rounded"
              />
              <label htmlFor="keysHandedOver" className="flex items-center gap-2 text-xs md:text-sm">
                <Key className="h-3 w-3 md:h-4 md:w-4" />
                All keys handed over (including spare keys)
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="documentsReceived"
                checked={leaveBehinds.documentsReceived}
                onChange={(e) => handleLeaveBehindsChange("documentsReceived", e.target.checked)}
                className="rounded"
              />
              <label htmlFor="documentsReceived" className="flex items-center gap-2 text-xs md:text-sm">
                <FileText className="h-3 w-3 md:h-4 md:w-4" />
                All required documents received and verified
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="titleConfirmation"
                checked={titleConfirmation}
                onChange={(e) => {
                  setTitleConfirmation(e.target.checked)
                  saveCompletionData({
                    titleConfirmation: e.target.checked
                  })
                }}
                className="rounded"
              />
              <label htmlFor="titleConfirmation" className="flex items-center gap-2 text-xs md:text-sm">
                <FileText className="h-3 w-3 md:h-4 md:w-4" />
                Has the bank issued the title to VOS?
              </label>
            </div>
          </div>

          {allLeaveBehindsComplete && (
            <div className="p-2 md:p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs md:text-sm text-green-800 font-medium">
                ✓ All checklist items completed! Customer is ready to leave.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Follow-up */}
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Heart className="h-4 w-4 md:h-5 md:w-5" />
            Customer Follow-up
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <div className="p-3 md:p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2 text-sm md:text-base">Thank You & Review Request</h4>
            <p className="text-xs md:text-sm text-blue-700 mb-3">
              Send a personalized thank you message and request a review to help improve our service.
            </p>

            <Button onClick={handleSendThankYou} disabled={thankYouSent} className="w-full text-xs md:text-sm">
              <Mail className="h-3 w-3 md:h-4 md:w-4 mr-2" />
              {thankYouSent ? "Thank You Sent ✓" : "Send Thank You + Review Request"}
            </Button>
          </div>

          {thankYouSent && (
            <div className="p-2 md:p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                <p className="text-xs md:text-sm text-green-800 font-medium">Thank you message sent successfully!</p>
              </div>
              <p className="text-xs text-green-700 mt-1">
                Customer will receive an email with review links and contact information.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Case File Download */}
      <Card className="hidden">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Download className="h-4 w-4 md:h-5 md:w-5" />
            Case Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 border rounded-lg gap-3">
            <div>
              <h4 className="font-medium text-sm md:text-base">Complete Case File</h4>
              <p className="text-xs md:text-sm text-muted-foreground">Download all documents, photos, and transaction details</p>
            </div>
            <Button onClick={handleDownloadCaseFile} variant="outline" disabled={isGeneratingPDF} className="text-xs md:text-sm">
              <Download className="h-3 w-3 md:h-4 md:w-4 mr-2" />
              {isGeneratingPDF ? "Generating PDF..." : "Download PDF"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Completion Status */}
        <div className="flex justify-end">
          <Button 
            onClick={handleComplete} 
            disabled={isCompleting} 
            size="lg" 
            className="px-6 md:px-8 text-sm md:text-base"
          >
            {isCompleting ? "Completing..." : "Complete Case"}
          </Button>
        </div>
    </div>
  )
}
