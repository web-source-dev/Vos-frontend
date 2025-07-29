"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { DollarSign, FileText, CheckCircle, Edit, RefreshCw, Info, Upload, Loader2, AlertTriangle, Wrench, Car, ClipboardList, Clock, User } from "lucide-react"
import api from '@/lib/api'


// TypeScript interfaces for quote preparation data
interface CustomerData {
  firstName: string
  lastName: string
  cellPhone?: string
  homePhone?: string
  email1?: string
  email2?: string
  email3?: string
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
  color?: string
  bodyStyle?: string
  licensePlate?: string
  licenseState?: string
  titleNumber?: string
  titleStatus?: string
  knownDefects?: string
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
  offerDecision?: {
    decision: 'accepted' | 'declined' | 'negotiating' | 'presented';
    reason?: string;
    decisionDate?: string;
  };
}

interface CaseData {
  id?: string
  _id?: string
  customer: CustomerData
  vehicle: VehicleData
  inspection?: InspectionData
  quote?: QuoteData
  transaction?: {
    billOfSale?: {
      sellerName?: string
      sellerAddress?: string
      sellerCity?: string
      sellerState?: string
      sellerZip?: string
      sellerPhone?: string
      sellerEmail?: string
      sellerDLNumber?: string
      sellerDLState?: string
    }
  }
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
  
  // Stage timer with case ID and stage name
  const caseId = vehicleData._id;
  
  
  const canManageQuote = isEstimator || isAdmin || isAgent;
  const existingQuote = vehicleData.quote;

  // Check if quote has already been decided (accepted or rejected)
  const isQuoteDecided = existingQuote?.offerDecision?.decision === 'accepted' || 
                        existingQuote?.offerDecision?.decision === 'declined' ||
                        existingQuote?.status === 'accepted' || 
                        existingQuote?.status === 'declined';



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
    
    // Add OBD2 critical codes costs (check both existing quote and local state)
    const obd2Codes = obd2ScanData?.criticalCodes || existingQuote?.obd2Scan?.criticalCodes;
    if (obd2Codes) {
      obd2Codes.forEach(code => {
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
    
    // Check if we have any OBD2 codes with ranges (check both existing quote and local state)
    const obd2Codes = obd2ScanData?.criticalCodes || existingQuote?.obd2Scan?.criticalCodes;
    const hasRanges = obd2Codes?.some(code => 
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
  }, [existingQuote, vehicleData.quote]);

  // Update local state when vehicleData changes (after parent component updates)
  useEffect(() => {
    if (vehicleData.quote) {
      const updatedQuote = vehicleData.quote;
      setQuoteData(prev => ({
        ...prev,
        offerAmount: updatedQuote.offerAmount?.toString() || prev.offerAmount,
        estimatedValue: updatedQuote.estimatedValue?.toString() || prev.estimatedValue,
        expiryDate: updatedQuote.expiryDate ? new Date(updatedQuote.expiryDate).toISOString().split('T')[0] : prev.expiryDate,
        notes: updatedQuote.notes || prev.notes,
        createdAt: updatedQuote.createdAt || prev.createdAt,
        updatedAt: updatedQuote.updatedAt || prev.updatedAt,
      }));
    }
  }, [vehicleData.quote]);

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

  // Update local OBD2 scan data when existing quote changes
  useEffect(() => {
    if (existingQuote?.obd2Scan && !obd2ScanData) {
      setOBD2ScanData(existingQuote.obd2Scan);
    }
  }, [existingQuote?.obd2Scan, obd2ScanData]);

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
            .filter((code: { criticality: number }) => code.criticality >= 4)
            .map((code: { code: string; description: string; criticality: number; estimatedRepairCost: string }) => ({
              code: code.code,
              description: code.description,
              criticality: code.criticality,
              estimatedRepairCost: code.estimatedRepairCost || ''
            }))
        });

        // Update quote data
        const updatedQuoteData = {
          ...quoteData,
          obd2Scan: {
            scanDate: new Date().toISOString(),
            filePath: response.data!.filePath,
            extractedCodes: response.data!.extractedCodes,
            criticalCodes: response.data!.matchingCodes
              .filter((code: { criticality: number }) => code.criticality >= 4)
              .map((code: { code: string; description: string; criticality: number; estimatedRepairCost: string }) => ({
                code: code.code,
                description: code.description,
                criticality: code.criticality,
                estimatedRepairCost: code.estimatedRepairCost || ''
              }))
          }
        };

        setQuoteData(updatedQuoteData);

        // Update parent component state to persist the OBD2 scan data
        const updatedCaseData = {
          ...vehicleData,
          quote: {
            ...vehicleData.quote,
            obd2Scan: updatedQuoteData.obd2Scan
          }
        };
        onUpdate(updatedCaseData);

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
        // Stop timer and get timing data (now handles saving automatically)
        const timingData = await stop();
        console.log('Stage timing data:', timingData);

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

        // Note: Stage advancement is now handled manually by the user clicking "Next Step"
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
        // Stop timer and get timing data (now handles saving automatically)
        const timingData = await stop();
        console.log('Stage timing data:', timingData);

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
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  // Seller and Vehicle Information state
  const [sellerInfo, setSellerInfo] = useState({
    sellerName: '',
    sellerAddress: '',
    sellerCity: '',
    sellerState: '',
    sellerZip: '',
    sellerPhone: '',
    sellerEmail: '',
    sellerDLNumber: '',
    sellerDLState: ''
  })

  const [vehicleInfo, setVehicleInfo] = useState({
    vehicleVIN: vehicleData.vehicle?.vin || '',
    vehicleYear: vehicleData.vehicle?.year || '',
    vehicleMake: vehicleData.vehicle?.make || '',
    vehicleModel: vehicleData.vehicle?.model || '',
    vehicleColor: vehicleData.vehicle?.color || '',
    vehicleBodyStyle: vehicleData.vehicle?.bodyStyle || '',
    vehicleLicensePlate: vehicleData.vehicle?.licensePlate || '',
    vehicleLicenseState: vehicleData.vehicle?.licenseState || '',
    vehicleTitleNumber: vehicleData.vehicle?.titleNumber || '',
    vehicleMileage: vehicleData.vehicle?.currentMileage || '',
    titleStatus: vehicleData.vehicle?.titleStatus || 'clean',
    knownDefects: vehicleData.vehicle?.knownDefects || ''
  })

  // Initialize seller and vehicle info from existing data
  useEffect(() => {
    // First, try to populate from existing bill of sale data
    if (vehicleData.transaction?.billOfSale) {
      const billOfSale = vehicleData.transaction.billOfSale
      setSellerInfo({
        sellerName: billOfSale.sellerName || '',
        sellerAddress: billOfSale.sellerAddress || '',
        sellerCity: billOfSale.sellerCity || '',
        sellerState: billOfSale.sellerState || '',
        sellerZip: billOfSale.sellerZip || '',
        sellerPhone: billOfSale.sellerPhone || '',
        sellerEmail: billOfSale.sellerEmail || '',
        sellerDLNumber: billOfSale.sellerDLNumber || '',
        sellerDLState: billOfSale.sellerDLState || ''
      })
    } 
    // If no bill of sale data, populate from customer information
    else if (vehicleData.customer) {
      const customer = vehicleData.customer
      setSellerInfo({
        sellerName: `${customer.firstName} ${customer.lastName}`,
        sellerAddress: '', // Customer address not typically stored
        sellerCity: '', // Customer city not typically stored
        sellerState: '', // Customer state not typically stored
        sellerZip: '', // Customer zip not typically stored
        sellerPhone: customer.cellPhone || customer.homePhone || '',
        sellerEmail: customer.email1 || '',
        sellerDLNumber: '', // Customer DL not typically stored
        sellerDLState: '' // Customer DL state not typically stored
      })
    }

    if (vehicleData.vehicle) {
      setVehicleInfo({
        vehicleVIN: vehicleData.vehicle.vin || '',
        vehicleYear: vehicleData.vehicle.year || '',
        vehicleMake: vehicleData.vehicle.make || '',
        vehicleModel: vehicleData.vehicle.model || '',
        vehicleColor: vehicleData.vehicle.color || '',
        vehicleBodyStyle: vehicleData.vehicle.bodyStyle || '',
        vehicleLicensePlate: vehicleData.vehicle.licensePlate || '',
        vehicleLicenseState: vehicleData.vehicle.licenseState || '',
        vehicleTitleNumber: vehicleData.vehicle.titleNumber || '',
        vehicleMileage: vehicleData.vehicle.currentMileage || '',
        titleStatus: vehicleData.vehicle.titleStatus || 'clean',
        knownDefects: vehicleData.vehicle.knownDefects || ''
      })
    }
  }, [vehicleData])

  const handleSellerInfoChange = (field: string, value: string) => {
    setSellerInfo(prev => ({ ...prev, [field]: value }))
  }

  const handleVehicleInfoChange = (field: string, value: string) => {
    setVehicleInfo(prev => ({ ...prev, [field]: value }))
  }
  // New consolidated save function that handles all three save operations
  const handleConsolidatedSave = async () => {
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

      // Step 1: Save seller and vehicle information
      const caseId = vehicleData.id || vehicleData._id
      if (!caseId) throw new Error("Case ID not found")

      const paperworkData = {
        billOfSale: {
          ...sellerInfo,
          ...vehicleInfo
        }
      }

      const paperworkResponse = await api.savePaperworkByCaseId(caseId, paperworkData)
      if (!paperworkResponse.success) {
        throw new Error(paperworkResponse.error || "Failed to save seller and vehicle information")
      }

      // Update local seller and vehicle info state to reflect saved data
      // The saved data is now in the response, so we can update our local state
      // This ensures the form fields remain filled with the saved data

      // Step 2: Submit quote
      let quoteResponse;
      
      if (!caseId && !vehicleData.quote?.accessToken) {
        throw new Error("Cannot identify case - neither ID nor access token found");
      }
      
      // If user is admin, agent, or estimator and we have a case ID, use the case ID endpoint
      if (canManageQuote && caseId) {
        quoteResponse = await api.updateQuoteByCaseId(caseId, {
          offerAmount: Number(quoteData.offerAmount),
          estimatedValue: Number(quoteData.estimatedValue),
          expiryDate: new Date(quoteData.expiryDate),
          notes: quoteData.notes,
          status: 'ready'
        });
      } 
      // Otherwise use the token-based endpoint
      else if (vehicleData.quote?.accessToken) {
        quoteResponse = await api.submitQuote(
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

      if (quoteResponse.success) {
        // Stop timer and get timing data (now handles saving automatically)
        const timingData = await stop();
        console.log('Stage timing data:', timingData);

        // Update local state to reflect the saved data
        const savedQuote = quoteResponse.data as unknown as QuoteData;
        
        // Update quote data state
        setQuoteData(prev => ({
          ...prev,
          offerAmount: savedQuote.offerAmount?.toString() || prev.offerAmount,
          estimatedValue: savedQuote.estimatedValue?.toString() || prev.estimatedValue,
          expiryDate: savedQuote.expiryDate ? new Date(savedQuote.expiryDate).toISOString().split('T')[0] : prev.expiryDate,
          notes: savedQuote.notes || prev.notes,
          createdAt: savedQuote.createdAt || prev.createdAt,
          updatedAt: savedQuote.updatedAt || prev.updatedAt,
        }));

        // Set updating flag to true since we now have saved data
        setIsUpdating(true);

        // Update parent component
        onUpdate({
          ...vehicleData,
          quote: savedQuote,
        })

        toast({
          title: "All Information Saved Successfully",
          description: "Seller information, vehicle information, and quote have been saved successfully. You can now proceed to the next step.",
        })
      } else {
        throw new Error(quoteResponse.error || "Failed to submit quote")
      }
    } catch (error) {
      const errorData = api.handleError(error)
      toast({
        title: "Error Saving Information",
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
    
    // Check if quote has been decided
    if (isQuoteDecided) {
      if (existingQuote.offerDecision?.decision === 'accepted' || existingQuote.status === 'accepted') {
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            Accepted
          </Badge>
        )
      } else {
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Declined
          </Badge>
        )
      }
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
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ]

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



      {isUpdating && !isQuoteDecided && (
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

          {/* Estimated Value Summary (MarketCheck Pricing) */}
          {vehicleData.vehicle?.vin && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Estimated Value Summary (MarketCheck Pricing)
              </h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-blue-800">
                    <span className="font-medium">Market Value Estimate:</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {isLoadingPricing ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Fetching...</span>
                      </div>
                    ) : pricingData ? (
                      <span>${pricingData.estimatedValue.toLocaleString()}</span>
                    ) : (
                      <span className="text-sm text-gray-500">Not available</span>
                    )}
                  </div>
                </div>
                {pricingData && (
                  <div className="text-xs text-blue-700 mt-2">
                    Source: {pricingData.source} • Last updated: {new Date(pricingData.lastUpdated).toLocaleDateString()}
                  </div>
                )}
                {vehicleData.vehicle?.vin && !pricingData && !isLoadingPricing && (
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={fetchVehiclePricing}
                      disabled={isLoadingPricing}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingPricing ? 'animate-spin' : ''}`} />
                      Fetch MarketCheck Pricing
                    </Button>
                  </div>
                )}
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
          {(obd2ScanData || existingQuote?.obd2Scan) && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                OBD2 Scan Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-600">
                    {(obd2ScanData?.extractedCodes || existingQuote?.obd2Scan?.extractedCodes)?.length || 0}
                  </div>
                  <div className="text-xs text-gray-700">Total Codes</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">
                    {(obd2ScanData?.criticalCodes || existingQuote?.obd2Scan?.criticalCodes)?.length || 0}
                  </div>
                  <div className="text-xs text-red-700">Critical Codes</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-bold text-yellow-600">
                    {(obd2ScanData?.criticalCodes || existingQuote?.obd2Scan?.criticalCodes)?.filter(code => code.criticality >= 4).length || 0}
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


      {/* OBD2 Diagnostic Scan - Moved to top priority */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            OBD2 Diagnostic Scan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between mb-4">
                      <div>
              <p className="text-sm text-muted-foreground">
                Upload OBD2 scan results to identify critical diagnostic codes that may affect vehicle value and offer amount.
              </p>
          </div>
              
              {canManageQuote && !isQuoteDecided && (
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
        </CardContent>
      </Card>

      {/* Seller Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Seller Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sellerName">Full Name *</Label>
              <Input
                id="sellerName"
                value={sellerInfo.sellerName}
                onChange={(e) => handleSellerInfoChange('sellerName', e.target.value)}
                placeholder="Enter seller's full name"
              />
            </div>
            <div>
              <Label htmlFor="sellerPhone">Phone Number</Label>
              <Input
                id="sellerPhone"
                value={sellerInfo.sellerPhone}
                onChange={(e) => handleSellerInfoChange('sellerPhone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="sellerEmail">Email Address</Label>
              <Input
                id="sellerEmail"
                type="email"
                value={sellerInfo.sellerEmail}
                onChange={(e) => handleSellerInfoChange('sellerEmail', e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="sellerDLNumber">Driver's License Number</Label>
              <Input
                id="sellerDLNumber"
                value={sellerInfo.sellerDLNumber}
                onChange={(e) => handleSellerInfoChange('sellerDLNumber', e.target.value)}
                placeholder="Enter DL number"
              />
            </div>
            <div>
              <Label htmlFor="sellerDLState">Driver's License State</Label>
              <Select value={sellerInfo.sellerDLState} onValueChange={(value) => handleSellerInfoChange('sellerDLState', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sellerAddress">Street Address</Label>
              <Input
                id="sellerAddress"
                value={sellerInfo.sellerAddress}
                onChange={(e) => handleSellerInfoChange('sellerAddress', e.target.value)}
                placeholder="Enter street address"
              />
            </div>
            <div>
              <Label htmlFor="sellerCity">City</Label>
              <Input
                id="sellerCity"
                value={sellerInfo.sellerCity}
                onChange={(e) => handleSellerInfoChange('sellerCity', e.target.value)}
                placeholder="Enter city"
              />
            </div>
            <div>
              <Label htmlFor="sellerState">State</Label>
              <Select value={sellerInfo.sellerState} onValueChange={(value) => handleSellerInfoChange('sellerState', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sellerZip">ZIP Code</Label>
              <Input
                id="sellerZip"
                value={sellerInfo.sellerZip}
                onChange={(e) => handleSellerInfoChange('sellerZip', e.target.value)}
                placeholder="Enter ZIP code"
              />
            </div>
          </div>
          {/* Save button removed - now consolidated with quote submission */}
        </CardContent>
      </Card>

      {/* Vehicle Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicle Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicleVIN">VIN Number</Label>
              <Input
                id="vehicleVIN"
                value={vehicleInfo.vehicleVIN}
                onChange={(e) => handleVehicleInfoChange('vehicleVIN', e.target.value)}
                placeholder="Enter VIN number"
              />
            </div>
            <div>
              <Label htmlFor="vehicleYear">Year</Label>
              <Input
                id="vehicleYear"
                value={vehicleInfo.vehicleYear}
                onChange={(e) => handleVehicleInfoChange('vehicleYear', e.target.value)}
                placeholder="Enter year"
              />
            </div>
            <div>
              <Label htmlFor="vehicleMake">Make</Label>
              <Input
                id="vehicleMake"
                value={vehicleInfo.vehicleMake}
                onChange={(e) => handleVehicleInfoChange('vehicleMake', e.target.value)}
                placeholder="Enter make"
              />
            </div>
            <div>
              <Label htmlFor="vehicleModel">Model</Label>
              <Input
                id="vehicleModel"
                value={vehicleInfo.vehicleModel}
                onChange={(e) => handleVehicleInfoChange('vehicleModel', e.target.value)}
                placeholder="Enter model"
              />
            </div>
            <div>
              <Label htmlFor="vehicleColor">Color</Label>
              <Input
                id="vehicleColor"
                value={vehicleInfo.vehicleColor}
                onChange={(e) => handleVehicleInfoChange('vehicleColor', e.target.value)}
                placeholder="Enter color"
              />
            </div>
            <div>
              <Label htmlFor="vehicleBodyStyle">Body Style</Label>
              <Input
                id="vehicleBodyStyle"
                value={vehicleInfo.vehicleBodyStyle}
                onChange={(e) => handleVehicleInfoChange('vehicleBodyStyle', e.target.value)}
                placeholder="Enter body style"
              />
            </div>
            <div>
              <Label htmlFor="vehicleLicensePlate">License Plate</Label>
              <Input
                id="vehicleLicensePlate"
                value={vehicleInfo.vehicleLicensePlate}
                onChange={(e) => handleVehicleInfoChange('vehicleLicensePlate', e.target.value)}
                placeholder="Enter license plate"
              />
            </div>
            <div>
              <Label htmlFor="vehicleLicenseState">License State</Label>
              <Select value={vehicleInfo.vehicleLicenseState} onValueChange={(value) => handleVehicleInfoChange('vehicleLicenseState', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vehicleTitleNumber">Title Number</Label>
              <Input
                id="vehicleTitleNumber"
                value={vehicleInfo.vehicleTitleNumber}
                onChange={(e) => handleVehicleInfoChange('vehicleTitleNumber', e.target.value)}
                placeholder="Enter title number"
              />
            </div>
            <div>
              <Label htmlFor="vehicleMileage">Current Mileage</Label>
              <Input
                id="vehicleMileage"
                value={vehicleInfo.vehicleMileage}
                onChange={(e) => handleVehicleInfoChange('vehicleMileage', e.target.value)}
                placeholder="Enter current mileage"
              />
            </div>
            <div>
              <Label htmlFor="titleStatus">Title Status</Label>
              <Select value={vehicleInfo.titleStatus} onValueChange={(value) => handleVehicleInfoChange('titleStatus', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select title status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clean">Clean</SelectItem>
                  <SelectItem value="salvage">Salvage</SelectItem>
                  <SelectItem value="rebuilt">Rebuilt</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 hidden">
              <Label htmlFor="knownDefects">Known Defects</Label>
              <Textarea
                id="knownDefects"
                value={vehicleInfo.knownDefects}
                onChange={(e) => handleVehicleInfoChange('knownDefects', e.target.value)}
                placeholder="Describe any known defects or issues with the vehicle"
                rows={3}
              />
            </div>
          </div>
          {/* Save button removed - now consolidated with quote submission */}
        </CardContent>
      </Card>

      {/* Quote Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Quote Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isQuoteDecided ? (
            <div className="space-y-4">
              {/* Quote Already Decided Message */}
              <div className={`p-4 rounded-lg border ${
                existingQuote?.offerDecision?.decision === 'accepted' || existingQuote?.status === 'accepted'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-3">
                  {existingQuote?.offerDecision?.decision === 'accepted' || existingQuote?.status === 'accepted' ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  )}
                  <div>
                    <h3 className="font-semibold">
                      {existingQuote?.offerDecision?.decision === 'accepted' || existingQuote?.status === 'accepted'
                        ? 'Quote Already Accepted'
                        : 'Quote Already Declined'
                      }
                    </h3>
                    <p className="text-sm mt-1">
                      {existingQuote?.offerDecision?.decision === 'accepted' || existingQuote?.status === 'accepted'
                        ? 'This quote has already been accepted by the customer and cannot be modified.'
                        : 'This quote has already been declined by the customer and cannot be modified.'
                      }
                    </p>
                    {existingQuote?.offerDecision?.decisionDate && (
                      <p className="text-xs mt-2 opacity-75">
                        Decision made on: {new Date(existingQuote.offerDecision.decisionDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Read-only Quote Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Offer Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <div className="pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                      ${existingQuote?.offerAmount?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Estimated Value</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <div className="pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                      ${existingQuote?.estimatedValue?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quote Expiry Date</Label>
                <div className="py-3 px-3 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                  {existingQuote?.expiryDate 
                    ? new Date(existingQuote.expiryDate).toLocaleDateString()
                    : 'N/A'
                  }
                </div>
              </div>

              {existingQuote?.notes && (
                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <div className="py-3 px-3 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                    {existingQuote.notes}
                  </div>
                </div>
              )}


            </div>
          ) : (
            <>
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


            </>
          )}
        </CardContent>
      </Card>

      {/* Quote Summary - Moved to separate card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quote Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Generate a comprehensive quote summary sheet that includes vehicle condition, inspection results, OBD2 codes, and market value for customer review.
              </p>
            </div>
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

            {/* Single Action Button */}
            <div className="pt-4 border-t">
              <Button
                onClick={isQuoteDecided ? onComplete : handleConsolidatedSave}
                disabled={isQuoteDecided ? false : (!quoteData.offerAmount || !quoteData.expiryDate || isSubmitting || (!canManageQuote && !vehicleData.quote?.accessToken))}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving All Information...
                  </>
                ) : isQuoteDecided ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Proceed Next
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    {isUpdating ? "Update" : "Submit"}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {isQuoteDecided 
                  ? "Proceed to the next stage of the process."
                  : "This will save seller information, vehicle information, and submit the quote."
                }
              </p>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
