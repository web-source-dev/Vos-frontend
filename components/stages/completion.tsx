"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Download, Mail, Key, Car, FileText, Heart, Save, Clock, XCircle } from "lucide-react"
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
  offerDecision?: OfferDecisionData
}

interface OfferDecisionData {
  finalAmount?: number
  decision?: string
  reason?: string
  declinedAt?: string
}

interface TransactionData {
  billOfSale?: {
    salePrice?: number
    saleDate?: string
  }
  paymentStatus?: string
  // Payoff confirmation fields
  payoffStatus?: 'pending' | 'confirmed' | 'completed' | 'not_required'
  payoffConfirmedAt?: string
  payoffCompletedAt?: string
  payoffConfirmedBy?: string
  payoffNotes?: string
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
  const [isCaseClosed, setIsCaseClosed] = useState(false)
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

  console.log('vehicleData', vehicleData)
  // Check if offer was declined - check both quote.offerDecision and case.offerDecision
  const isOfferDeclined = vehicleData.quote?.offerDecision?.decision === 'declined' || 
                         vehicleData.offerDecision?.decision === 'declined'

  // Check if payoff confirmation is required (not 'not_required')
  const isPayoffRequired = vehicleData.transaction?.payoffStatus && 
                          vehicleData.transaction.payoffStatus !== 'not_required'

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

      // Send appropriate email based on offer status
      const emailType = isOfferDeclined ? 'declined-followup' : 'thank-you';
      const emailResponse = await api.sendCustomerEmail(caseId, emailType);
      
      if (!emailResponse.success) {
        throw new Error(emailResponse.error || 'Failed to send thank you email');
      }

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
        
        // Update case status
        await api.updateCaseStatus(caseId, 'completed');

        setThankYouSent(true)
        await saveCompletionData({
          thankYouSent: true,
          sentAt: new Date().toISOString()
        })

        toast({
          title: isOfferDeclined ? "Follow-up Sent" : "Thank You Sent",
          description: isOfferDeclined 
            ? "Professional follow-up message sent to customer." 
            : "Thank you message and case file sent to customer.",
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
        title: isOfferDeclined ? "Follow-up Sent" : "Thank You Sent",
        description: isOfferDeclined 
          ? "Professional follow-up message sent to customer." 
          : "Thank you message and case file sent to customer.",
      })

      onComplete()
    } catch (error) {
      const errorData = api.handleError(error);
      toast({
        title: isOfferDeclined ? "Error Sending Follow-up" : "Error Sending Thank You",
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

  const allLeaveBehindsComplete = Object.values(leaveBehinds).every(Boolean) && 
                                 (isPayoffRequired ? titleConfirmation : true)

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

      // For declined offers, set the case status to 'quote-declined' first
      if (isOfferDeclined) {
        await api.updateCaseStatus(caseId, 'quote-declined');
        setIsCaseClosed(true);
        
        // Update local state to reflect the closed status
        onUpdate({
          status: 'quote-declined'
        });
      }

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
        currentStage: vehicleData.currentStage || 6, // Preserve current stage or default to 8
        stageStatuses: {
          ...currentStageStatuses,
          6: 'complete' // Mark stage 7 (Completion) as complete
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
        title: isOfferDeclined ? "Case Closed" : "Case Completed",
        description: isOfferDeclined 
          ? "Declined offer case has been closed successfully." 
          : "Case file has been generated and process is complete.",
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
      {/* Show declined offer screen */}
      {isOfferDeclined ? (
        <div className="text-center">
          <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-red-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
            <XCircle className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-red-800">Offer Declined - Case Closed</h1>
          <p className="text-muted-foreground mt-2">Customer has declined the offer and the case has been closed</p>
        </div>
      ) : (
        <div className="text-center">
          <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
            <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-green-800">Transaction Complete!</h1>
          <p className="text-muted-foreground mt-2">Vehicle purchase has been successfully completed</p>
        </div>
      )}

      {/* Transaction Summary */}
      <Card className={isOfferDeclined ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className={isOfferDeclined ? "text-red-800 text-base md:text-lg" : "text-green-800 text-base md:text-lg"}>
            {isOfferDeclined ? "Declined Offer Summary" : "Final Transaction Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div>
              <Label className={isOfferDeclined ? "text-xs md:text-sm font-medium text-red-700" : "text-xs md:text-sm font-medium text-green-700"}>Customer</Label>
              <p className="text-base md:text-lg font-semibold">{customerName}</p>
            </div>
            <div>
              <Label className={isOfferDeclined ? "text-xs md:text-sm font-medium text-red-700" : "text-xs md:text-sm font-medium text-green-700"}>Vehicle</Label>
              <p className="text-base md:text-lg font-semibold">{vehicleDescription}</p>
            </div>
            <div>
              <Label className={isOfferDeclined ? "text-xs md:text-sm font-medium text-red-700" : "text-xs md:text-sm font-medium text-green-700"}>VIN</Label>
              <p className="text-base md:text-lg font-semibold">{vehicleData.vehicle?.vin || 'Not provided'}</p>
            </div>
            <div>
              <Label className={isOfferDeclined ? "text-xs md:text-sm font-medium text-red-700" : "text-xs md:text-sm font-medium text-green-700"}>
                {isOfferDeclined ? "Declined Amount" : "Final Amount"}
              </Label>
              <p className={`text-xl md:text-2xl font-bold ${isOfferDeclined ? "text-red-600" : "text-green-600"}`}>
                ${finalAmount.toLocaleString()}
              </p>
            </div>
          </div>

          <Separator />

          {isOfferDeclined ? (
            <div className="space-y-3">
              {vehicleData.offerDecision?.reason && (
                <div className="p-3 bg-white border border-red-200 rounded">
                  <p className="text-sm font-medium text-red-800 mb-1">Customer's Reason for Declining:</p>
                  <p className="text-sm text-red-700">{vehicleData.offerDecision.reason}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 md:gap-4 text-center">
                <div>
                  <Badge className="bg-red-100 text-red-800 mb-2 text-xs">Inspection</Badge>
                  <p className="text-xs md:text-sm">Completed</p>
                </div>
                <div>
                  <Badge className="bg-red-100 text-red-800 mb-2 text-xs">Status</Badge>
                  <p className="text-xs md:text-sm">Declined</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 md:gap-4 text-center">
                <div>
                <Badge className="bg-green-100 text-green-800 mb-2 text-xs">Intake</Badge>
                <p className="text-xs md:text-sm">Completed</p>
              </div>
              <div>
                <Badge className="bg-green-100 text-green-800 mb-2 text-xs">Inspection</Badge>
                <p className="text-xs md:text-sm">Completed</p>
              </div>
              <div>
                <Badge className="bg-green-100 text-green-800 mb-2 text-xs">Paperwork</Badge>
                <p className="text-xs md:text-sm">{vehicleData.transaction?.paymentStatus === 'completed' ? 'Completed' : 'Processing'}</p>
              </div>
              <div>
                <Badge className="bg-green-100 text-green-800 mb-2 text-xs">Payment</Badge>
                <p className="text-xs md:text-sm">Completed</p>
              </div>
            </div>
          )}
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

      {/* Leave-Behind Checklist - Only show for completed transactions */}
      {!isOfferDeclined && (
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

              {isPayoffRequired && (
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
              )}
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
      )}

      {/* Declined Offer Summary - Only show for declined offers */}
      {isOfferDeclined && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg text-red-800">
              <XCircle className="h-4 w-4 md:h-5 md:w-5" />
              Declined Offer Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <div className="p-3 md:p-4 bg-white border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2 text-sm md:text-base">Case Closure Details</h4>
              <div className="space-y-2 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-red-700">Status:</span>
                  <Badge className="bg-red-100 text-red-800">Case Closed</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700">Decision Date:</span>
                  <span className="text-red-800">
                    {vehicleData.offerDecision?.declinedAt 
                      ? new Date(vehicleData.offerDecision.declinedAt).toLocaleDateString()
                      : new Date().toLocaleDateString()
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700">Final Stage:</span>
                  <span className="text-red-800">Offer Decision</span>
                </div>
              </div>
            </div>

            {vehicleData.offerDecision?.reason && (
              <div className="p-3 md:p-4 bg-white border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2 text-sm md:text-base">Customer's Reason for Declining</h4>
                <p className="text-sm text-red-700 italic">"{vehicleData.offerDecision.reason}"</p>
              </div>
            )}

            <div className="p-3 md:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2 text-sm md:text-base">Next Steps</h4>
              <ul className="text-xs md:text-sm text-yellow-700 space-y-1">
                <li>• Case has been automatically closed</li>
                <li>• Customer retains ownership of their vehicle</li>
                <li>• No further action required from VOS</li>
                <li>• Consider following up with customer in the future</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Follow-up */}
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Heart className="h-4 w-4 md:h-5 md:w-5" />
            {isOfferDeclined ? "Customer Follow-up (Declined)" : "Customer Follow-up"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          {isOfferDeclined ? (
            <div className="p-3 md:p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2 text-sm md:text-base">Follow-up for Declined Offer</h4>
              <p className="text-xs md:text-sm text-orange-700 mb-3">
                Send a professional follow-up message to maintain good customer relations and potentially re-engage in the future.
              </p>

              <Button onClick={handleSendThankYou} disabled={thankYouSent} className="w-full text-xs md:text-sm bg-orange-600 hover:bg-orange-700">
                <Mail className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                {thankYouSent ? "Follow-up Sent ✓" : "Send Professional Follow-up"}
              </Button>
            </div>
          ) : (
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
          )}

          {thankYouSent && (
            <div className="p-2 md:p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                <p className="text-xs md:text-sm text-green-800 font-medium">
                  {isOfferDeclined ? "Follow-up message sent successfully!" : "Thank you message sent successfully!"}
                </p>
              </div>
              <p className="text-xs text-green-700 mt-1">
                {isOfferDeclined 
                  ? "Customer will receive a professional follow-up email maintaining good relations."
                  : "Customer will receive an email with review links and contact information."
                }
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
      {isCaseClosed ? (
        <div className="flex justify-center">
          <div className="p-4 md:p-6 bg-green-50 border border-green-200 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              <h3 className="text-lg md:text-xl font-semibold text-green-800">Case Closed</h3>
            </div>
            <p className="text-sm md:text-base text-green-700">
              The declined offer case has been successfully closed with status: <strong>quote-declined</strong>
            </p>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button 
            onClick={handleComplete} 
            disabled={isCompleting} 
            size="lg" 
            className={`px-6 md:px-8 text-sm md:text-base ${
              isOfferDeclined 
                ? "bg-red-600 hover:bg-red-700" 
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isCompleting 
              ? "Completing..." 
              : isOfferDeclined 
                ? "Close Case" 
                : "Complete Case"
            }
          </Button>
        </div>
      )}
    </div>
  )
}
