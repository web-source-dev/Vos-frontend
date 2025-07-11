"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { DollarSign, FileText, CheckCircle, Edit, RefreshCw, Info, Upload, Loader2, AlertTriangle, Wrench, Car, ClipboardList } from "lucide-react"
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
  overallScore?: number
  maxPossibleScore?: number
  inspector?: InspectorData
  inspectionNotes?: string
  recommendations?: string[]
  safetyIssues?: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    location: string
    estimatedCost: number
  }>
  maintenanceItems?: Array<{
    priority: 'low' | 'medium' | 'high'
    description: string
    estimatedCost: number
    recommendedAction: string
  }>
  vinVerification?: {
    vinNumber: string
    vinMatch: 'yes' | 'no' | 'not_verified'
  }
  sections?: Array<{
    id: string
    name: string
    rating?: number
    score?: number
    maxScore?: number
    completed?: boolean
  }>
}

interface OBD2ScanData {
  scanDate?: string;
  filePath?: string;
  extractedCodes?: string[];
  criticalCodes?: Array<{
    code: string;
    description: string;
    criticality: number;
    estimatedRepairCost: string;
  }>;
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
  obd2Scan?: OBD2ScanData;
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
  stageStatuses?: { [key: number]: string }
  currentStage?: number
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
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [pricingData, setPricingData] = useState<{
    estimatedValue: number;
    source: string;
    lastUpdated: string;
  } | null>(null)
  const { toast } = useToast()
  
  const canManageQuote = isEstimator || isAdmin || isAgent;
  const existingQuote = vehicleData.quote;

  // Helper functions for inspection metrics
  const calculateAverageConditionRating = () => {
    if (!vehicleData.inspection?.sections) return 0;
    const ratings = vehicleData.inspection.sections
      .filter(section => section.rating && section.completed)
      .map(section => section.rating!);
    return ratings.length > 0 ? Math.round(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) : 0;
  };

  const calculateTotalRepairCost = () => {
    let totalCost = 0;
    
    // Add safety issues costs
    if (vehicleData.inspection?.safetyIssues) {
      totalCost += vehicleData.inspection.safetyIssues.reduce((sum, issue) => sum + (issue.estimatedCost || 0), 0);
    }
    
    // Add maintenance items costs
    if (vehicleData.inspection?.maintenanceItems) {
      totalCost += vehicleData.inspection.maintenanceItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
    }
    
    // Add OBD2 critical codes costs
    if (existingQuote?.obd2Scan?.criticalCodes) {
      existingQuote.obd2Scan.criticalCodes.forEach(code => {
        const costString = code.estimatedRepairCost || '';
        
        // Handle price ranges like "$150 - $1000"
        if (costString.includes('-')) {
          const range = costString.split('-').map(part => part.trim());
          const minCost = parseFloat(range[0]?.replace(/[^0-9.-]/g, '') || '0');
          const maxCost = parseFloat(range[1]?.replace(/[^0-9.-]/g, '') || '0');
          
          // Use the average of min and max, or just max if min is 0
          const cost = minCost > 0 && maxCost > 0 ? (minCost + maxCost) / 2 : Math.max(minCost, maxCost);
          
          if (!isNaN(cost)) {
            totalCost += cost;
          }
        } else {
          // Handle single price like "$500"
          const cost = parseFloat(costString.replace(/[^0-9.-]/g, '') || '0');
          if (!isNaN(cost)) {
            totalCost += cost;
          }
        }
      });
    }
    
    return totalCost;
  };

  const getFlaggedIssues = () => {
    const issues = [];
    
    // VIN mismatch
    if (vehicleData.inspection?.vinVerification?.vinMatch === 'no') {
      issues.push('VIN Mismatch - Vehicle VIN does not match documentation');
    }
    
    // Critical safety issues
    if (vehicleData.inspection?.safetyIssues) {
      const criticalIssues = vehicleData.inspection.safetyIssues.filter(issue => issue.severity === 'critical');
      criticalIssues.forEach(issue => {
        issues.push(`Critical Safety Issue: ${issue.description} (${issue.location})`);
      });
    }
    
    // High priority maintenance items
    if (vehicleData.inspection?.maintenanceItems) {
      const highPriorityItems = vehicleData.inspection.maintenanceItems.filter(item => item.priority === 'high');
      highPriorityItems.forEach(item => {
        issues.push(`High Priority Maintenance: ${item.description}`);
      });
    }
    
    return issues;
  };

  const formatCostSummary = () => {
    const totalCost = calculateTotalRepairCost();
    
    // Check if we have any OBD2 codes with ranges
    const hasRanges = existingQuote?.obd2Scan?.criticalCodes?.some(code => 
      code.estimatedRepairCost?.includes('-')
    );
    
    if (hasRanges && totalCost > 0) {
      // If we have ranges, show the calculated average with a note
      return {
        display: `$${totalCost.toLocaleString()}`,
        note: 'Average of repair cost ranges'
      };
    } else {
      return {
        display: `$${totalCost.toLocaleString()}`,
        note: 'Total estimated repair costs'
      };
    }
  };
  
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
        description: "Failed to fetch vehicle pricing from MarketCheck API. Please ensure your MarketCheck API key is configured correctly.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPricing(false);
    }
  }, [vehicleData.vehicle?.vin, toast]);

  // OBD2 scan upload and processing state
  const [isUploadingOBD2Scan, setIsUploadingOBD2Scan] = useState(false);
  const [obd2ScanData, setOBD2ScanData] = useState<OBD2ScanData | null>(null);

  // Handle OBD2 scan upload
  const handleOBD2ScanUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;
    
    const file = event.target.files[0];
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File Type",
        description: "Only PDF files are accepted for OBD2 scans.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingOBD2Scan(true);

    try {
      // Upload the file
      const caseId = vehicleData.id || vehicleData._id;
      if (!caseId) {
        throw new Error("Case ID not found");
      }

      // Use the API function to upload and process the OBD2 scan
      const response = await api.uploadOBD2ScanToCase(caseId, file);
      
      if (response.success && response.data) {
        // Update state with OBD2 scan data
        setOBD2ScanData({
          scanDate: new Date().toISOString(),
          filePath: response.data!.filePath,
          extractedCodes: response.data!.extractedCodes,
          criticalCodes: response.data!.matchingCodes
            .filter((code: any) => code.criticality >= 4)
            .map((code: any) => ({
              code: code.code,
              description: code.description,
              criticality: code.criticality,
              estimatedRepairCost: code.estimatedRepairCost || ''
            }))
        });

        // Update quote data
        setQuoteData(prev => ({
          ...prev,
          obd2Scan: {
            scanDate: new Date().toISOString(),
            filePath: response.data!.filePath,
            extractedCodes: response.data!.extractedCodes,
            criticalCodes: response.data!.matchingCodes
              .filter((code: any) => code.criticality >= 4)
              .map((code: any) => ({
                code: code.code,
                description: code.description,
                criticality: code.criticality,
                estimatedRepairCost: code.estimatedRepairCost || ''
              }))
          }
        }));

        toast({
          title: "OBD2 Scan Uploaded",
          description: `Successfully processed scan. Found ${response.data!.extractedCodes.length} codes, ${response.data!.criticalCodesFound} critical.`,
        });
      } else {
        throw new Error(response.error || 'Failed to upload OBD2 scan');
      }
    } catch (error) {
      console.error('Error uploading OBD2 scan:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload and process OBD2 scan.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingOBD2Scan(false);
    }
  };

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

        // Update stage statuses to mark stage 4 as complete and stage 5 as active
        const currentStageStatuses = vehicleData.stageStatuses || {};
        const stageData = {
          currentStage: vehicleData.currentStage || 5, // Preserve current stage or default to 5
          stageStatuses: {
            ...currentStageStatuses,
            4: 'complete', // Mark stage 4 (Quote Preparation) as complete
            5: 'active'    // Mark stage 5 (Offer Decision) as active
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

  const handleGenerateQuoteSummary = async () => {
    if (!quoteData.offerAmount) {
      toast({
        title: "Missing Offer Amount",
        description: "Please enter an offer amount before generating the quote summary.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGeneratingSummary(true)
      const caseId = vehicleData.id || vehicleData._id;
      
      if (!caseId) {
        throw new Error("Case ID not found");
      }

      // Prepare current quote data to send to backend
      const currentQuoteData = {
        offerAmount: quoteData.offerAmount ? Number(quoteData.offerAmount) : undefined,
        estimatedValue: quoteData.estimatedValue ? Number(quoteData.estimatedValue) : undefined,
        expiryDate: quoteData.expiryDate,
        notes: quoteData.notes,
        obd2Scan: obd2ScanData || existingQuote?.obd2Scan
      };

      // Generate quote summary PDF with current data
      const response = await api.generateQuoteSummary(caseId, currentQuoteData);
      
      if (response.success && response.data) {
        // Create a blob from the PDF data
        const blob = new Blob([response.data], { type: 'application/pdf' });
        
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `quote-summary-${caseId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Quote Summary Generated",
          description: "Quote summary PDF has been downloaded successfully.",
        })
      } else {
        throw new Error(response.error || "Failed to generate quote summary");
      }
    } catch (error) {
      console.error('Error generating quote summary:', error);
      toast({
        title: "Error Generating Summary",
        description: error instanceof Error ? error.message : "Failed to generate quote summary.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingSummary(false)
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
        <CardContent className="space-y-6">
          {/* Basic Vehicle Information */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Car className="h-4 w-4" />
              Vehicle Information
            </h4>
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
                <span className="font-medium">Inspector:</span> {vehicleData.inspection?.inspector?.firstName} {vehicleData.inspection?.inspector?.lastName}
              </div>
            </div>
          </div>

          {/* Inspection Summary Metrics */}
          {vehicleData.inspection?.completed && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Inspection Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{vehicleData.inspection.overallRating || 'N/A'}/5</div>
                  <div className="text-xs text-blue-700">Overall Rating</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{calculateAverageConditionRating()}/5</div>
                  <div className="text-xs text-green-700">Avg Condition</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{vehicleData.inspection.overallScore || 'N/A'}/{vehicleData.inspection.maxPossibleScore || 'N/A'}</div>
                  <div className="text-xs text-purple-700">Total Score</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{vehicleData.inspection.sections?.length || 0}</div>
                  <div className="text-xs text-orange-700">Sections</div>
                </div>
              </div>
            </div>
          )}

          {/* General Condition Remarks */}
          {vehicleData.inspection?.inspectionNotes && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">General Condition Remarks</h4>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {vehicleData.inspection.inspectionNotes}
              </div>
            </div>
          )}

          {/* Flagged Issues */}
          {getFlaggedIssues().length > 0 && (
            <div>
              <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Flagged Issues
              </h4>
              <div className="space-y-2">
                {getFlaggedIssues().map((issue, index) => (
                  <div key={index} className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OBD2 Scan Summary */}
          {existingQuote?.obd2Scan && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                OBD2 Scan Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-600">{existingQuote.obd2Scan.extractedCodes?.length || 0}</div>
                  <div className="text-xs text-gray-700">Total Codes</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">{existingQuote.obd2Scan.criticalCodes?.length || 0}</div>
                  <div className="text-xs text-red-700">Critical Codes</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-bold text-yellow-600">
                    {existingQuote.obd2Scan.criticalCodes?.filter(code => code.criticality >= 4).length || 0}
                  </div>
                  <div className="text-xs text-yellow-700">High Priority</div>
                </div>
              </div>
            </div>
          )}

          {/* Cost Summary Panel */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Cost Summary
            </h4>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-amber-800">
                  <span className="font-medium">Estimated Repair Cost Based on OBD2 Scan & Inspection:</span>
                </div>
                <div className="text-2xl font-bold text-amber-900">
                  {formatCostSummary().display}
                </div>
              </div>
              <div className="text-xs text-amber-700 mt-2">
                {formatCostSummary().note} - includes safety issues, maintenance items, and OBD2 critical codes
              </div>
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
            <div className="flex items-center gap-2">
              <Label htmlFor="expiryDate">Quote Expiry Date *</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">
                      <Info className="h-3 w-3 text-blue-600" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      All quotes are valid for 48 hours from the time they&apos;re issued. If not accepted within that window, a new inspection may be required and the quote is subject to change based on updated vehicle condition.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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

          {/* OBD2 Scan Upload and Results */}
          <div className="mt-6 border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">OBD2 Diagnostic Scan</h3>
              
              {canManageQuote && (
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleOBD2ScanUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploadingOBD2Scan}
                  />
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={isUploadingOBD2Scan}
                  >
                    {isUploadingOBD2Scan ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload OBD2 Scan (PDF)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Show information about uploaded scan if available */}
            {(obd2ScanData || existingQuote?.obd2Scan) && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium">OBD2 Scan Results</h4>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-600 mb-1">
                      <strong>Date:</strong> {new Date(obd2ScanData?.scanDate || existingQuote?.obd2Scan?.scanDate || '').toLocaleDateString()}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <strong>Total Codes:</strong> {obd2ScanData?.extractedCodes?.length || existingQuote?.obd2Scan?.extractedCodes?.length || 0}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <strong>Critical Codes:</strong> {obd2ScanData?.criticalCodes?.length || existingQuote?.obd2Scan?.criticalCodes?.length || 0}
                    </p>
                    {(obd2ScanData?.filePath || existingQuote?.obd2Scan?.filePath) && (
                      <p className="mt-2">
                        <a 
                          href={(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + (obd2ScanData?.filePath || existingQuote?.obd2Scan?.filePath || '')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          View Full Scan Report
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                {/* Critical OBD2 Codes Section */}
                {((obd2ScanData?.criticalCodes && obd2ScanData.criticalCodes.length > 0) || 
                  (existingQuote?.obd2Scan?.criticalCodes && existingQuote.obd2Scan.criticalCodes.length > 0)) && (
                  <div className="border border-red-200 rounded-lg overflow-hidden">
                    <div className="bg-red-50 p-3 border-b border-red-200">
                      <h4 className="font-medium text-red-800">Critical OBD2 Scan Codes</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Criticality</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Est. Repair</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(obd2ScanData?.criticalCodes || existingQuote?.obd2Scan?.criticalCodes || []).map((code, index) => (
                            <tr key={index} className="bg-white">
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">{code.code}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">{code.description}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                                    code.criticality === 5 ? 'bg-red-600' :
                                    code.criticality === 4 ? 'bg-orange-500' : 'bg-yellow-400'
                                  }`}></span>
                                  {code.criticality}/5
                                </div>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                {code.estimatedRepairCost ? code.estimatedRepairCost : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quote Summary Button */}
          <div className="mt-6 border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Quote Summary</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">
                      <Info className="h-3 w-3 text-blue-600" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Generate a comprehensive quote summary sheet that includes vehicle condition, inspection results, OBD2 codes, and market value for customer review.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <Button
              variant="outline"
              onClick={handleGenerateQuoteSummary}
              disabled={!quoteData.offerAmount || isGeneratingSummary}
              className="w-full flex items-center justify-center gap-2"
            >
              {isGeneratingSummary ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Summary...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Generate Quote Summary
                </>
              )}
            </Button>
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
