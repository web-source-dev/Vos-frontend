"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, Clock, AlertCircle, Mail, ExternalLink } from "lucide-react"
import api from "@/lib/api"
import type { Case } from "@/lib/types"

interface VeriffDialogProps {
  isOpen: boolean
  onClose: () => void
  caseData: Case
  onVerificationComplete: () => void
}

export function VeriffDialog({ isOpen, onClose, caseData, onVerificationComplete }: VeriffDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null)
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Check if Veriff session already exists
  const existingSession = caseData.veriffSession

  const startPolling = useCallback((sessionId: string) => {
    const interval = setInterval(async () => {
      try {
        // Get the correct case ID
        console.log('Polling Veriff session status for case ID:', sessionId)
        const caseId = caseData.id || caseData._id
        
        if (!caseId) {
          console.error('Case ID not found for polling')
          clearInterval(interval)
          setPollingInterval(null)
          return
        }
        
        const response = await api.getVeriffSessionStatus(caseId)
        if (response.success && response.data) {
          setVerificationStatus(response.data.status)
          
          // If verification is complete, stop polling and notify parent
          if (['approved', 'declined', 'expired', 'abandoned'].includes(response.data.status)) {
            clearInterval(interval)
            setPollingInterval(null)
            onVerificationComplete()
            
            if (response.data.status === 'approved') {
              toast({
                title: "ID Verification Complete",
                description: "Customer's identity has been successfully verified.",
              })
            } else {
              toast({
                title: "ID Verification Failed",
                description: `Verification status: ${response.data.status}`,
                variant: "destructive",
              })
            }
          }
        }
      } catch (error) {
        console.error('Error polling Veriff status:', error)
      }
    }, 5000) // Poll every 5 seconds

    setPollingInterval(interval)
  }, [caseData, onVerificationComplete, toast])
  useEffect(() => {
    if (isOpen && existingSession?.sessionId) {
      setSessionId(existingSession.sessionId)
      setVerificationStatus(existingSession.status || 'created')
      // Start polling for status updates
      const caseId = caseData.id || caseData._id
      if (caseId) {
        startPolling(existingSession.sessionId)
      }
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [isOpen, existingSession, caseData, startPolling, pollingInterval])


  const handleCreateSession = async () => {
    try {
      setIsLoading(true)
      
      // Get the correct case ID
      const caseId = caseData.id || caseData._id
      
      if (!caseId) {
        throw new Error('Case ID not found')
      }
      
      console.log('Creating Veriff session for case ID:', caseId)
      
      const response = await api.createVeriffSession(caseId)
      
      if (response.success && response.data) {
        setSessionId(response.data.sessionId)
        setVerificationUrl(response.data.verificationUrl)
        setVerificationStatus('created')
        
        // Start polling for status updates
        startPolling(response.data.sessionId)
        
        toast({
          title: "Verification Session Created",
          description: "An email has been sent to the customer with the verification link.",
        })
      } else {
        throw new Error(response.error || 'Failed to create verification session')
      }
    } catch (error) {
      console.error('Error creating Veriff session:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create verification session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenVerification = () => {
    if (verificationUrl) {
      window.open(verificationUrl, '_blank')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'declined':
      case 'expired':
      case 'abandoned':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'declined':
      case 'expired':
      case 'abandoned':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Verified'
      case 'declined':
        return 'Declined'
      case 'expired':
        return 'Expired'
      case 'abandoned':
        return 'Abandoned'
      case 'pending':
        return 'Pending Verification'
      case 'created':
        return 'Session Created'
      default:
        return 'Unknown'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            ID Verification
          </DialogTitle>
          <DialogDescription>
            Verify customer identity using Veriff&apos;s secure verification service
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Information */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Name:</span> {
                  typeof caseData.customer === 'string' 
                    ? 'Customer ID' 
                    : `${caseData.customer?.firstName || ''} ${caseData.customer?.lastName || ''}`
                }</p>
                <p><span className="font-medium">Email:</span> {
                  typeof caseData.customer === 'string' 
                    ? 'N/A' 
                    : caseData.customer?.email1 || 'N/A'
                }</p>
                <p><span className="font-medium">Phone:</span> {
                  typeof caseData.customer === 'string' 
                    ? 'N/A' 
                    : caseData.customer?.cellPhone || 'N/A'
                }</p>
              </div>
            </CardContent>
          </Card>

          {/* Verification Status */}
          {verificationStatus && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Verification Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  {getStatusIcon(verificationStatus)}
                  <Badge className={getStatusColor(verificationStatus)}>
                    {getStatusText(verificationStatus)}
                  </Badge>
                </div>
                {sessionId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Session ID: {sessionId.slice(0, 8)}...
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {!existingSession?.sessionId && !sessionId ? (
              <Button 
                onClick={handleCreateSession} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Creating Session..." : "Send Verification Email"}
              </Button>
            ) : verificationUrl ? (
              <Button 
                onClick={handleOpenVerification}
                variant="outline"
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Verification Link
              </Button>
            ) : null}

            {verificationStatus === 'pending' && (
              <p className="text-xs text-gray-500 text-center">
                Waiting for customer to complete verification...
              </p>
            )}

            {verificationStatus === 'approved' && (
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-600 font-medium">
                  ID verification completed successfully!
                </p>
              </div>
            )}

            {['declined', 'expired', 'abandoned'].includes(verificationStatus || '') && (
              <div className="text-center">
                <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-red-600 font-medium">
                  Verification failed or expired
                </p>
                <Button 
                  onClick={handleCreateSession} 
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Customer will receive an email with a secure verification link</p>
            <p>• They can complete verification on their mobile device</p>
            <p>• Status will update automatically once completed</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 