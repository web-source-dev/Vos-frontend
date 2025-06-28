"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { DollarSign, FileText, CheckCircle, Edit, RefreshCw } from "lucide-react"
import api from '@/lib/api'

// TypeScript interfaces for quote preparation data
interface CustomerData {
  firstName: string
  lastName: string
}

interface VehicleData {
  year: string
  make: string
  model: string
  vin?: string
  currentMileage?: string
  estimatedValue?: number
  pricingSource?: string
  pricingLastUpdated?: string
}

interface InspectorData {
  firstName?: string
  lastName?: string
}

interface InspectionData {
  completed?: boolean
  overallRating?: number
  inspector?: InspectorData
}

interface QuoteData {
  offerAmount?: number
  estimatedValue?: number
  expiryDate?: string
  notes?: string
  status?: string
  accessToken?: string
  createdAt?: string
  updatedAt?: string
}

interface CaseData {
  id?: string
  _id?: string
  customer: CustomerData
  vehicle: VehicleData
  inspection?: InspectionData
  quote?: QuoteData
  createdAt?: string
  updatedAt?: string
}

interface QuotePreparationProps {
  vehicleData: CaseData
  onUpdate: (data: CaseData) => void
  onComplete: () => void
  isEstimator?: boolean
  isAdmin?: boolean
  isAgent?: boolean
}

export function QuotePreparation({ 
  vehicleData, 
  onUpdate, 
  onComplete, 
  isEstimator = false, 
  isAdmin = false,
  isAgent = false
}: QuotePreparationProps) {
  const [quoteData, setQuoteData] = useState({
    offerAmount: "",
    estimatedValue: "",
    expiryDate: "",
    notes: "",
    createdAt: "",
    updatedAt: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoadingPricing, setIsLoadingPricing] = useState(false)
  const [pricingData, setPricingData] = useState<{
    estimatedValue: number;
    source: string;
    lastUpdated: string;
  } | null>(null)
  const { toast } = useToast()
  
  const canManageQuote = isEstimator || isAdmin || isAgent;
  const existingQuote = vehicleData.quote;
  
  // Load existing quote data when component mounts or vehicleData changes
  useEffect(() => {
    if (existingQuote) {
      setQuoteData({
        offerAmount: existingQuote.offerAmount?.toString() || "",
        estimatedValue: existingQuote.estimatedValue?.toString() || "",
        expiryDate: existingQuote.expiryDate ? new Date(existingQuote.expiryDate).toISOString().split('T')[0] : "",
        notes: existingQuote.notes || "",
        createdAt: existingQuote.createdAt || "",
        updatedAt: existingQuote.updatedAt || "",
      });
      
      if (existingQuote.status === 'ready' || existingQuote.status === 'presented' || 
          existingQuote.status === 'accepted' || existingQuote.status === 'negotiating') {
        setIsUpdating(true);
      }
    }
  }, [existingQuote]);

  const fetchVehiclePricing = useCallback(async () => {
    if (!vehicleData.vehicle?.vin) {
      toast({
        title: "No VIN Available",
        description: "Vehicle VIN is required to fetch estimated value from MarketCheck API.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoadingPricing(true);
      const response = await api.getVehiclePricing(vehicleData.vehicle.vin);
      
      if (response.success && response.data) {
        setPricingData(response.data);
        // Update the quote data with the fetched estimated value
        setQuoteData(prev => ({
          ...prev,
          estimatedValue: response.data!.estimatedValue.toString()
        }));
        
        toast({
          title: "MarketCheck Pricing Retrieved",
          description: `Estimated value: $${response.data!.estimatedValue.toLocaleString()} from ${response.data!.source}`,
        });
      } else {
        toast({
          title: "MarketCheck API Error",
          description: response.error || "Failed to fetch vehicle pricing from MarketCheck API",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching vehicle pricing from MarketCheck:', error);
      toast({
        title: "MarketCheck API Error",
        description: "Failed to fetch vehicle pricing from MarketCheck API. Using fallback estimation.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPricing(false);
    }
  }, [vehicleData.vehicle?.vin, toast]);

  // Fetch vehicle pricing when component mounts or VIN changes
  useEffect(() => {
    if (vehicleData.vehicle?.vin) {
      // If vehicle already has estimated value, use it
      if (vehicleData.vehicle.estimatedValue && vehicleData.vehicle.estimatedValue > 0) {
        setPricingData({
          estimatedValue: vehicleData.vehicle.estimatedValue,
          source: vehicleData.vehicle.pricingSource || 'MarketCheck API',
          lastUpdated: vehicleData.vehicle.pricingLastUpdated || new Date().toISOString()
        });
        setQuoteData(prev => ({
          ...prev,
          estimatedValue: vehicleData.vehicle.estimatedValue!.toString()
        }));
      } else {
        // Otherwise fetch fresh pricing
        fetchVehiclePricing();
      }
    }
  }, [vehicleData.vehicle?.vin, vehicleData.vehicle?.estimatedValue, vehicleData.vehicle?.pricingSource, vehicleData.vehicle?.pricingLastUpdated, fetchVehiclePricing]);

  const handleQuoteChange = (field: string, value: string | number) => {
    setQuoteData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmitQuote = async () => {
    if (!quoteData.offerAmount || !quoteData.expiryDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in offer amount and expiry date.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      let response;
      const caseId = vehicleData.id || vehicleData._id;
      
      if (!caseId && !vehicleData.quote?.accessToken) {
        throw new Error("Cannot identify case - neither ID nor access token found");
      }
      
      // If user is admin, agent, or estimator and we have a case ID, use the case ID endpoint
      if (canManageQuote && caseId) {
        response = await api.updateQuoteByCaseId(caseId, {
          offerAmount: Number(quoteData.offerAmount),
          estimatedValue: Number(quoteData.estimatedValue),
          expiryDate: new Date(quoteData.expiryDate),
          notes: quoteData.notes,
          status: 'ready'
        });
      } 
      // Otherwise use the token-based endpoint
      else if (vehicleData.quote?.accessToken) {
        response = await api.submitQuote(
          vehicleData.quote.accessToken,
          {
            offerAmount: Number(quoteData.offerAmount),
            estimatedValue: Number(quoteData.estimatedValue),
            expiryDate: new Date(quoteData.expiryDate),
            notes: quoteData.notes,
            status: 'ready'
          }
        );
      } else {
        throw new Error("Cannot submit quote - no access method available");
      }

      if (response.success) {
        onUpdate({
          ...vehicleData,
          quote: response.data as unknown as QuoteData,
        })

        toast({
          title: isUpdating ? "Quote Updated" : "Quote Created",
          description: isUpdating 
            ? "Quote has been updated successfully." 
            : "Quote has been prepared and is ready for customer review.",
        })

        onComplete()
      }
    } catch (error) {
      const errorData = api.handleError(error)
      toast({
        title: isUpdating ? "Error Updating Quote" : "Error Creating Quote",
        description: errorData.error,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = () => {
    if (!existingQuote) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
          <FileText className="h-4 w-4 mr-2" />
          New Quote
        </Badge>
      )
    }
    
    switch (existingQuote.status) {
      case 'ready':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            Ready
          </Badge>
        )
      case 'presented':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            Presented
          </Badge>
        )
      case 'accepted':
        return (
          <Badge className="bg-green-100 text-green-800">
            Accepted
          </Badge>
        )
      case 'negotiating':
        return (
          <Badge className="bg-purple-100 text-purple-800">
            Negotiating
          </Badge>
        )
      case 'declined':
        return (
          <Badge className="bg-red-100 text-red-800">
            Declined
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <FileText className="h-4 w-4 mr-1" />
            Draft
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quote Preparation</h1>
          <p className="text-muted-foreground">
            {isUpdating ? "Update existing quote details" : "Prepare a new quote for customer"}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Vehicle & Inspection Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle & Inspection Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Customer:</span> {vehicleData.customer?.firstName} {vehicleData.customer?.lastName}
            </div>
            <div>
              <span className="font-medium">Vehicle:</span> {vehicleData.vehicle?.year} {vehicleData.vehicle?.make} {vehicleData.vehicle?.model}
            </div>
            <div>
              <span className="font-medium">VIN:</span> {vehicleData.vehicle?.vin || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">Mileage:</span> {vehicleData.vehicle?.currentMileage}
            </div>
            <div>
              <span className="font-medium">Inspection Rating:</span> {vehicleData.inspection?.overallRating || 'N/A'}/5
            </div>
            <div>
              <span className="font-medium">Inspector:</span> {vehicleData.inspection?.inspector?.firstName} {vehicleData.inspection?.inspector?.lastName}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning for non-estimators if no inspection */}
      {!vehicleData.inspection?.completed && !isEstimator && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-yellow-600">⚠️</div>
              <div>
                <h3 className="font-medium">Inspection Not Completed</h3>
                <p className="text-sm text-yellow-700">
                  The vehicle inspection has not been completed yet. Quote accuracy may be affected.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isUpdating && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Edit className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-medium">Updating Existing Quote</h3>
                <p className="text-sm text-blue-700">
                  You&apos;re editing a quote that was created on{" "}
                  {existingQuote?.createdAt 
                    ? new Date(existingQuote.createdAt).toLocaleDateString() 
                    : existingQuote?.updatedAt 
                    ? new Date(existingQuote.updatedAt).toLocaleDateString() 
                    : "an earlier date"}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Quote Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="offerAmount">Offer Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="offerAmount"
                  type="number"
                  value={quoteData.offerAmount}
                  onChange={(e) => handleQuoteChange('offerAmount', e.target.value)}
                  placeholder="25000"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Estimated Value</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <div className="flex items-center">
                  <div className="flex-1 pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                    {isLoadingPricing ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Fetching MarketCheck pricing...</span>
                      </div>
                    ) : pricingData ? (
                      <div>
                        <span className="font-semibold">${pricingData.estimatedValue.toLocaleString()}</span>
                        <div className="text-xs text-gray-500 mt-1">
                          {pricingData.source} • {new Date(pricingData.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">
                        {vehicleData.vehicle?.vin 
                          ? "Click refresh to fetch MarketCheck pricing" 
                          : "VIN required for MarketCheck pricing"
                        }
                      </span>
                    )}
                  </div>
                  {vehicleData.vehicle?.vin && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={fetchVehiclePricing}
                      disabled={isLoadingPricing}
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingPricing ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate">Quote Expiry Date *</Label>
            <Input
              id="expiryDate"
              type="date"
              value={quoteData.expiryDate}
              onChange={(e) => handleQuoteChange('expiryDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={quoteData.notes}
              onChange={(e) => handleQuoteChange('notes', e.target.value)}
              placeholder="Any additional notes about the vehicle condition or offer..."
              rows={3}
            />
          </div>

          <Button 
            onClick={handleSubmitQuote} 
            disabled={!quoteData.offerAmount || !quoteData.expiryDate || isSubmitting || (!canManageQuote && !vehicleData.quote?.accessToken)}
            className="w-full"
          >
            {isSubmitting ? "Submitting..." : isUpdating ? "Update Quote" : "Submit Quote"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
