"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {  Mail, CheckCircle, X, Clock, Edit } from "lucide-react"
import api from '@/lib/api'

// TypeScript interfaces for offer decision data
interface CustomerData {
  firstName?: string
  lastName?: string
}

interface VehicleData {
  year?: string
  make?: string
  model?: string
}

interface InspectionData {
  overallRating?: number
}

interface OfferDecisionData {
  decision?: string
  reason?: string
  acceptedAt?: string
  declinedAt?: string
  finalAmount?: number
  status?: string
}

interface QuoteData {
  offerAmount?: number
  offerDecision?: OfferDecisionData
  accessToken?: string
  expiryDate?: string
  notes?: string
}

interface CaseData {
  id?: string
  _id?: string
  customer?: CustomerData
  vehicle?: VehicleData
  inspection?: InspectionData
  quote?: QuoteData
  offerDecision?: OfferDecisionData
  stageStatuses?: { [key: number]: string } // Added for stage statuses
  currentStage?: number // Added for current stage
}

interface OfferDecisionProps {
  vehicleData: CaseData
  onUpdate: (data: CaseData) => void
  onComplete: () => void
  onStageChange?: (stage: number) => void
  isEstimator?: boolean
}

export function OfferDecision({ vehicleData, onUpdate, onComplete, onStageChange, isEstimator = false }: OfferDecisionProps) {
  const [decision, setDecision] = useState("")
  const [showDeclineDialog, setShowDeclineDialog] = useState(false)
  const [declineReason, setDeclineReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const { toast } = useToast()

  const quote = vehicleData.quote || {}
  const offerAmount = quote.offerAmount || 0
  const offerDecision = quote.offerDecision || vehicleData.offerDecision

  // Initialize decision state from existing data
  useEffect(() => {
    if (offerDecision?.decision && offerDecision.decision !== 'pending') {
      setDecision(offerDecision.decision)

      
      if (offerDecision.reason) {
        setDeclineReason(offerDecision.reason)
      }
    } else {
      // Reset decision state if it's pending or no decision
      setDecision("")
    }
  }, [offerDecision])

  const handleAccept = async () => {
    try {
      setIsSubmitting(true)
      console.log('handleAccept called');
      const decisionData = {
        decision: "accepted",
        acceptedAt: new Date().toISOString(),
        finalAmount: offerAmount,
        status: "title-pending",
      }

      console.log('Decision data:', decisionData);
      console.log('Vehicle data:', vehicleData);
      console.log('Is estimator:', isEstimator);

      // Always use case ID-based endpoint for authenticated users
      const caseId = vehicleData.id || vehicleData._id;
      console.log('Using case ID:', caseId);
      if (!caseId) {
        throw new Error("Case ID not found");
      }
      
      const response = await api.updateOfferDecisionByCaseId(caseId, decisionData);
      console.log('API response:', response);

      if (response.success) {
        console.log('API call successful, updating UI');
        onUpdate({
          ...vehicleData,
          offerDecision: response.data as unknown as OfferDecisionData,
        })

        // Update stage statuses to mark stage 5 as complete and stage 6 as active
        const currentStageStatuses = vehicleData.stageStatuses || {};
        const stageData = {
          currentStage: vehicleData.currentStage || 6, // Preserve current stage or default to 6
          stageStatuses: {
            ...currentStageStatuses,
            5: 'complete', // Mark stage 5 (Offer Decision) as complete
            6: 'active'    // Mark stage 6 (Paperwork) as active
          }
        };
        
        console.log('Stage data to update:', stageData);
        
        // Update stage statuses in the database
        try {
          const stageResponse = await api.updateCaseStageByCaseId(caseId, stageData);
          console.log('Stage update response:', stageResponse);
        } catch (error) {
          console.error('Failed to update stage statuses:', error);
        }
        
        setDecision("accepted");
        toast({
          title: "Offer Accepted",
          description: `Customer accepted the offer of $${offerAmount.toLocaleString()}. Title documentation pending.`,
        });
        
        // Call onComplete to advance to next stage
        onComplete();
      } else {
        console.error('API call failed:', response.error);
        throw new Error(response.error || "Failed to update offer decision");
      }
    } catch (error) {
      console.error('Error in handleAccept:', error);
      const errorData = api.handleError(error)
      toast({
        title: "Error",
        description: errorData.error,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDecline = async () => {
    try {
      setIsSubmitting(true)
      console.log('handleDecline called');
      const decisionData = {
        decision: "declined",
        declinedAt: new Date().toISOString(),
        reason: declineReason,
        status: "closed",
      }

      console.log('Decline decision data:', decisionData);
      console.log('Vehicle data:', vehicleData);
      console.log('Is estimator:', isEstimator);

      // Always use case ID-based endpoint for authenticated users
      const caseId = vehicleData.id || vehicleData._id;
      console.log('Using case ID for decline:', caseId);
      if (!caseId) {
        throw new Error("Case ID not found");
      }
      
      const response = await api.updateOfferDecisionByCaseId(caseId, decisionData);
      console.log('Decline API response:', response);

      if (response.success) {
        console.log('Decline API call successful, updating UI');
        if (response.data) {
          onUpdate({ 
            ...vehicleData,
            quote: response.data as unknown as QuoteData 
          });
        }
        setDecision("declined");
        setShowDeclineDialog(false);
        
        // For declined offers, mark stage 5 as complete but don't advance to stage 6
        const currentStageStatuses = vehicleData.stageStatuses || {};
        const stageData = {
          currentStage: vehicleData.currentStage || 5, // Keep at current stage
          stageStatuses: {
            ...currentStageStatuses,
            5: 'complete' // Mark stage 5 (Offer Decision) as complete
          }
        };
        
        console.log('Stage data for declined offer:', stageData);
        
        // Update stage statuses in the database
        try {
          const stageResponse = await api.updateCaseStageByCaseId(caseId, stageData);
          console.log('Stage update response for declined offer:', stageResponse);
        } catch (error) {
          console.error('Failed to update stage statuses for declined offer:', error);
        }
        
        toast({
          title: "Offer Declined",
          description: "Customer has declined the offer. Case marked as closed.",
        });
        
        // For declined offers, don't call onComplete - case is closed
      } else {
        console.error('Decline API call failed:', response.error);
        throw new Error(response.error || "Failed to update offer decision");
      }
    } catch (error) {
      console.error('Error in handleDecline:', error);
      const errorData = api.handleError(error)
      toast({
        title: "Error",
        description: errorData.error,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendEmail = async () => {
    try {
      setIsSendingEmail(true)
      const caseId = vehicleData.id || vehicleData._id;
      
      if (!caseId) {
        throw new Error("Case ID not found");
      }
      
      const response = await api.sendCustomerEmail(caseId, 'quote');
      
      if (response.success) {
        toast({
          title: "Email Sent",
          description: "Quote has been sent to customer via email.",
        });
      } else {
        throw new Error(response.error || "Failed to send email");
      }
    } catch (error) {
      const errorData = api.handleError(error);
      toast({
        title: "Error Sending Email",
        description: errorData.error,
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  }

  const handleComplete = async () => {
    if (decision !== "accepted") {
      toast({
        title: "Cannot Proceed",
        description: "Customer must accept the offer to continue to paperwork.",
        variant: "destructive",
      })
      return
    }

    try {
      // Update stage statuses to mark stage 5 as complete
      const currentStageStatuses = vehicleData.stageStatuses || {};
      const stageData = {
        currentStage: vehicleData.currentStage || 6, // Preserve current stage or default to 6
        stageStatuses: {
          ...currentStageStatuses,
          5: 'complete' // Mark stage 5 (Offer Decision) as complete
        }
      };
      
      // Update stage statuses in the database
      const caseId = vehicleData.id || vehicleData._id;
      if (caseId) {
        try {
          await api.updateCaseStageByCaseId(caseId, stageData);
          console.log('Successfully updated stage statuses');
        } catch (error) {
          console.error('Failed to update stage statuses:', error);
        }
      }
      
      onComplete()
      toast({
        title: "Proceeding to Paperwork",
        description: "Moving to the paperwork stage.",
      })
    } catch (error) {
      const errorData = api.handleError(error)
      toast({
        title: "Error",
        description: errorData.error,
        variant: "destructive",
      })
    }
  }

  const handleChangeQuote = () => {
    if (onStageChange) {
      onStageChange(4); // Go back to Quote Preparation stage
      toast({
        title: "Changing Quote",
        description: "Navigating to quote preparation to modify the offer.",
      });
    }
  }

  const getStatusBadge = () => {
    const currentDecision = decision || offerDecision?.decision;
    switch (currentDecision) {
      case "accepted":
        return <Badge className="bg-green-100 text-green-800">Accepted - Title Pending</Badge>
      case "declined":
        return <Badge className="bg-red-100 text-red-800">Declined</Badge>
      case "negotiating":
        return <Badge className="bg-orange-100 text-orange-800">Negotiating</Badge>
      case "pending":
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Decision</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Offer & Decision</h1>
          <p className="text-muted-foreground">
            {isEstimator ? "Capture customer decision and proceed to paperwork" : "Present offer to customer and capture their decision"}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Quote Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Offer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Customer</Label>
                <p className="text-lg">{vehicleData.customer?.firstName} {vehicleData.customer?.lastName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Vehicle</Label>
                <p className="text-lg">
                  {vehicleData.vehicle?.year} {vehicleData.vehicle?.make} {vehicleData.vehicle?.model}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Inspection Rating</Label>
                <p className="text-lg">{vehicleData.inspection?.overallRating || "N/A"}/5</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-6 bg-green-50 rounded-lg text-center">
                <Label className="text-sm font-medium text-green-700">Offer Amount</Label>
                <p className="text-3xl font-bold text-green-600">${offerAmount.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Expires</Label>
                <p className="text-lg">
                  {quote.expiryDate ? new Date(quote.expiryDate).toLocaleDateString() : "Not set"}
                </p>
              </div>
            </div>
          </div>

          {quote.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <Label className="text-sm font-medium">Additional Notes</Label>
              <p className="text-sm mt-1">{quote.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decision Actions */}
      {(!decision || decision === "pending") && (
        <div className="space-y-4">
          {/* Change Quote Button */}

          <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-blue-200 hover:bg-blue-50 transition-colors">
            <CardContent className="p-6 text-center">
              <Edit className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-blue-800 mb-2">Restart Quote</h3>
              <p className="text-sm text-blue-700 mb-4">Restart the quote process</p>
              <Button 
                onClick={handleChangeQuote} 
                variant="outline" 
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                disabled={isSubmitting}
              >
                <Edit className="h-4 w-4 mr-2" />
                Restart Quote
              </Button>
            </CardContent>
          </Card>
            <Card className="border-green-200 hover:bg-green-50 transition-colors">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-green-800 mb-2">Accept Offer</h3>
              <p className="text-sm text-green-700 mb-4">Customer accepts the current offer amount</p>
              <Button onClick={handleAccept} className="w-full bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                Accept ${offerAmount.toLocaleString()}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-200 hover:bg-red-50 transition-colors">
            <CardContent className="p-6 text-center">
              <X className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="font-semibold text-red-800 mb-2">Decline Offer</h3>
              <p className="text-sm text-red-700 mb-4">Customer declines the current offer</p>
              <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full border-red-300 text-red-700" disabled={isSubmitting}>
                    Decline Offer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Decline</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Are you sure the customer wants to decline this offer? This will close the case.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="declineReason">Reason for Decline (Optional)</Label>
                      <Textarea
                        id="declineReason"
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        placeholder="Customer's reason for declining..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowDeclineDialog(false)} className="flex-1" disabled={isSubmitting}>
                        Cancel
                      </Button>
                      <Button onClick={handleDecline} variant="destructive" className="flex-1" disabled={isSubmitting}>
                        Confirm Decline
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
          </div>
        </div>
      )}

      {/* Pending State */}
      {(!decision || decision === "pending") && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800">Awaiting Customer Decision</h3>
                <p className="text-sm text-blue-700">
                  {isEstimator 
                    ? "Capture the customer's decision using the buttons above."
                    : "Present the offer to the customer and capture their response using the buttons above."
                  }
                </p>
              </div>
              <Button 
                onClick={handleSendEmail} 
                variant="outline" 
                size="sm" 
                disabled={isSendingEmail || isSubmitting}
              >
                <Mail className="h-4 w-4 mr-2" />
                {isSendingEmail ? "Sending..." : "Send via Email"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decision Results */}
      {decision === "accepted" && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Offer Accepted!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-green-700">
                Customer has accepted the offer of <strong>${offerAmount.toLocaleString()}</strong>.
              </p>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  📋 <strong>Next Step:</strong> Customer must provide vehicle title within 48 hours to proceed with
                  payment.
                </p>
              </div>
              <div className="text-sm text-green-600">
                Accepted on {offerDecision?.acceptedAt 
                  ? new Date(offerDecision.acceptedAt).toLocaleDateString() 
                  : new Date().toLocaleDateString()
                } 
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {decision === "declined" && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Offer Declined</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-red-700">
                Customer has declined the offer of <strong>${offerAmount.toLocaleString()}</strong>.
              </p>

              {declineReason && (
                <div className="p-3 bg-white rounded-lg border">
                  <Label className="text-sm font-medium">Reason for Decline</Label>
                  <p className="text-sm mt-1">{declineReason}</p>
                </div>
              )}

              <div className="text-sm text-red-600">
                Declined on {offerDecision?.declinedAt 
                  ? new Date(offerDecision.declinedAt).toLocaleDateString() 
                  : new Date().toLocaleDateString()
                }
              </div>

              <Badge className="bg-red-100 text-red-800">Case Closed</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleComplete} disabled={decision !== "accepted" || isSubmitting} size="lg" className="px-8">
          Continue to Paperwork
        </Button>
      </div>
    </div>
  )
}
