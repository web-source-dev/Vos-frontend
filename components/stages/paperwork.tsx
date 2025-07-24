"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { FileText, CreditCard, Upload, CheckCircle, X, Loader2, Clock } from "lucide-react"
import api from '@/lib/api'
import Image from "next/image"
import { useStageTimer } from "@/components/useStageTimer"

import { Customer, Vehicle, Quote } from "@/lib/types";

interface OfferDecisionData {
  finalAmount?: number
}


interface TransactionData {
  billOfSale?: BillOfSaleData
  bankDetails?: BankDetailsData
  preferredPaymentMethod?: string
  documents?: DocumentData
  paymentStatus?: string
  submittedAt?: string
  // Payoff confirmation fields
  payoffStatus?: 'pending' | 'confirmed' | 'completed' | 'not_required'
  payoffConfirmedAt?: string
  payoffCompletedAt?: string
  payoffConfirmedBy?: string
  payoffNotes?: string
}

interface BillOfSaleData {
  sellerName?: string
  sellerAddress?: string
  sellerCity?: string
  sellerState?: string
  sellerZip?: string
  sellerPhone?: string
  sellerEmail?: string
  sellerDLNumber?: string
  sellerDLState?: string
  vehicleVIN?: string
  vehicleYear?: string
  vehicleMake?: string
  vehicleModel?: string
  vehicleMileage?: string
  vehicleColor?: string
  vehicleBodyStyle?: string
  vehicleTitleNumber?: string
  vehicleLicensePlate?: string
  vehicleLicenseState?: string
  saleDate?: string
  saleTime?: string
  salePrice?: number
  paymentMethod?: string
  odometerReading?: string
  odometerAccurate?: boolean
  titleStatus?: string
  knownDefects?: string
  asIsAcknowledgment?: boolean
  sellerDisclosure?: boolean
  buyerDisclosure?: boolean
  notaryRequired?: boolean
  notaryName?: string
  notaryCommissionExpiry?: string
  witnessName?: string
  witnessPhone?: string
}

interface BankDetailsData {
  bankName?: string
  loanNumber?: string
  payoffAmount?: number
}

interface DocumentData {
  [key: string]: string | null
}

interface CaseData {
  id?: string;
  _id?: string;
  customer?: Customer;
  vehicle?: Vehicle;
  offerDecision?: OfferDecisionData;
  quote?: Quote;
  transaction?: TransactionData;
  currentStage?: number;
  status?: string;
  stageStatuses?: {
    [key: number]: 'active' | 'complete' | 'pending';
  };
}

interface PaperworkProps {
  vehicleData: CaseData;
  onUpdate: (data: Partial<CaseData>) => void;
  onComplete: () => void;
  isEstimator?: boolean;
  isAdmin?: boolean;
  isAgent?: boolean;
}

export function Paperwork({ vehicleData, onUpdate, onComplete,isAdmin = false,isAgent = false, isEstimator = false }: PaperworkProps) {
  const [billOfSale, setBillOfSale] = useState({
    // Seller Information
    sellerName: "",
    sellerAddress: "",
    sellerCity: "",
    sellerState: "",
    sellerZip: "",
    sellerPhone: "",
    sellerEmail: "",
    sellerDLNumber: "",
    sellerDLState: "",
    
    // Buyer Information
    buyerName: "VOS - Vehicle Offer Service",
    buyerAddress: "123 Business Ave",
    buyerCity: "Business City",
    buyerState: "BC",
    buyerZip: "12345",
    buyerBusinessLicense: "VOS-12345-AB",
    buyerRepName: "Agent Smith",
    
    // Vehicle Details
    vehicleVIN: "",
    vehicleYear: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleMileage: "",
    vehicleColor: "",
    vehicleBodyStyle: "",
    vehicleTitleNumber: "",
    vehicleLicensePlate: "",
    vehicleLicenseState: "",
    
    // Transaction Details
    saleDate: new Date().toISOString().split("T")[0],
    saleTime: new Date().toTimeString().split(" ")[0].slice(0, 5),
    salePrice: 0,
    paymentMethod: "ACH Transfer",
    odometerReading: "",
    odometerAccurate: true,
    titleStatus: "clean",
    
    // Disclosures
    knownDefects: "",
    asIsAcknowledgment: false,
    sellerDisclosure: false,
    buyerDisclosure: false,
    
    // Legal
    notaryRequired: false,
    notaryName: "",
    notaryCommissionExpiry: "",
    witnessName: "",
    witnessPhone: "",
  })

  const [documentsUploaded, setDocumentsUploaded] = useState<{
    [key: string]: boolean;
  }>({
    signedBillOfSale: false,
  })

  const [documentPreviews, setDocumentPreviews] = useState<{
    [key: string]: string | null;
  }>({
    signedBillOfSale: null,
  })

  const [paymentStatus, setPaymentStatus] = useState("pending") // pending, processing, completed
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasExistingData, setHasExistingData] = useState(false)
  const { toast } = useToast()

  // Add new state variables for tracking saved state
  const [formSaved, setFormSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState<string>("Wire");

  // Add payoff confirmation state
  const [payoffStatus, setPayoffStatus] = useState<'pending' | 'confirmed' | 'completed' | 'not_required'>('not_required');
  const [payoffNotes, setPayoffNotes] = useState<string>('');
  const [isConfirmingPayoff, setIsConfirmingPayoff] = useState(false);

  // Stage timer with case ID and stage name
  const caseId = vehicleData._id;
  const timer = useStageTimer(caseId, 'paperwork');

  // Start timer when component mounts (only if not already started from saved data)
  useEffect(() => {
    if (!timer.startTime && !timer.isLoading) {
      timer.start();
    }
  }, [timer.startTime, timer.isLoading]);

  // Load existing paperwork data on component mount
  useEffect(() => {
    const loadExistingData = () => {
      // Always pre-populate with case data first
      const prePopulatedBillOfSale = {
        sellerName: (vehicleData.customer && typeof vehicleData.customer === 'object' && 'firstName' in vehicleData.customer && 'lastName' in vehicleData.customer)
          ? `${vehicleData.customer.firstName} ${vehicleData.customer.lastName}`
          : "",
        sellerPhone: (vehicleData.customer && typeof vehicleData.customer === 'object' && 'cellPhone' in vehicleData.customer)
          ? vehicleData.customer.cellPhone : "",
        sellerEmail: (vehicleData.customer && typeof vehicleData.customer === 'object' && 'email1' in vehicleData.customer)
          ? vehicleData.customer.email1 : "",
        vehicleVIN: (vehicleData.vehicle && typeof vehicleData.vehicle === 'object' && 'vin' in vehicleData.vehicle)
          ? vehicleData.vehicle.vin : "",
        vehicleYear: (vehicleData.vehicle && typeof vehicleData.vehicle === 'object' && 'year' in vehicleData.vehicle)
          ? vehicleData.vehicle.year : "",
        vehicleMake: (vehicleData.vehicle && typeof vehicleData.vehicle === 'object' && 'make' in vehicleData.vehicle)
          ? vehicleData.vehicle.make : "",
        vehicleModel: (vehicleData.vehicle && typeof vehicleData.vehicle === 'object' && 'model' in vehicleData.vehicle)
          ? vehicleData.vehicle.model : "",
        vehicleMileage: (vehicleData.vehicle && typeof vehicleData.vehicle === 'object' && 'currentMileage' in vehicleData.vehicle)
          ? vehicleData.vehicle.currentMileage : "",
        vehicleColor: (vehicleData.vehicle && typeof vehicleData.vehicle === 'object' && 'color' in vehicleData.vehicle)
          ? vehicleData.vehicle.color : "",
        vehicleBodyStyle: (vehicleData.vehicle && typeof vehicleData.vehicle === 'object' && 'bodyStyle' in vehicleData.vehicle)
          ? vehicleData.vehicle.bodyStyle : "",
        vehicleTitleNumber: (vehicleData.vehicle && typeof vehicleData.vehicle === 'object' && 'titleNumber' in vehicleData.vehicle)
          ? vehicleData.vehicle.titleNumber : "",
        vehicleLicensePlate: (vehicleData.vehicle && typeof vehicleData.vehicle === 'object' && 'licensePlate' in vehicleData.vehicle)
          ? vehicleData.vehicle.licensePlate : "",
        vehicleLicenseState: (vehicleData.vehicle && typeof vehicleData.vehicle === 'object' && 'licenseState' in vehicleData.vehicle)
          ? vehicleData.vehicle.licenseState : "",
        odometerReading: (vehicleData.vehicle && typeof vehicleData.vehicle === 'object' && 'currentMileage' in vehicleData.vehicle)
          ? vehicleData.vehicle.currentMileage : "",
        titleStatus: (vehicleData.vehicle && typeof vehicleData.vehicle === 'object' && 'titleStatus' in vehicleData.vehicle)
          ? vehicleData.vehicle.titleStatus : "clean",
        knownDefects: (vehicleData.vehicle && typeof vehicleData.vehicle === 'object' && 'knownDefects' in vehicleData.vehicle)
          ? vehicleData.vehicle.knownDefects : "",
        salePrice: vehicleData.offerDecision?.finalAmount || vehicleData.quote?.offerAmount || 0,
        saleDate: new Date().toISOString().split("T")[0], // Always set current date
        saleTime: new Date().toTimeString().split(" ")[0].slice(0, 5), // Always set current time
      }

      if (vehicleData.transaction?.billOfSale) {
        // Override with existing transaction data, but preserve pre-populated data for missing fields
        setBillOfSale(prev => {
          return {
            ...prev,
            ...Object.fromEntries(Object.entries(prePopulatedBillOfSale).map(([k, v]) => [k, v ?? ""])),
            ...Object.fromEntries(Object.entries(vehicleData.transaction?.billOfSale || {}).map(([k, v]) => [k, v ?? ""])),
            vehicleVIN: vehicleData.vehicle?.vin || vehicleData.transaction?.billOfSale?.vehicleVIN || "",
            vehicleYear: vehicleData.vehicle?.year || vehicleData.transaction?.billOfSale?.vehicleYear || "",
            vehicleMake: vehicleData.vehicle?.make || vehicleData.transaction?.billOfSale?.vehicleMake || "",
            vehicleModel: vehicleData.vehicle?.model || vehicleData.transaction?.billOfSale?.vehicleModel || "",
            vehicleColor: vehicleData.vehicle?.color || vehicleData.transaction?.billOfSale?.vehicleColor || "",
            vehicleBodyStyle: vehicleData.vehicle?.bodyStyle || vehicleData.transaction?.billOfSale?.vehicleBodyStyle || "",
            vehicleLicensePlate: vehicleData.vehicle?.licensePlate || vehicleData.transaction?.billOfSale?.vehicleLicensePlate || "",
            vehicleLicenseState: vehicleData.vehicle?.licenseState || vehicleData.transaction?.billOfSale?.vehicleLicenseState || "",
            vehicleTitleNumber: vehicleData.vehicle?.titleNumber || vehicleData.transaction?.billOfSale?.vehicleTitleNumber || "",
            saleDate: vehicleData.transaction?.billOfSale?.saleDate || new Date().toISOString().split("T")[0],
            saleTime: vehicleData.transaction?.billOfSale?.saleTime || new Date().toTimeString().split(" ")[0].slice(0, 5),
            titleStatus: vehicleData.transaction?.billOfSale?.titleStatus || vehicleData.vehicle?.titleStatus || "clean",
            odometerReading: vehicleData.transaction?.billOfSale?.odometerReading || vehicleData.vehicle?.currentMileage || "",
            odometerAccurate: vehicleData.transaction?.billOfSale?.odometerAccurate ?? true,
            knownDefects: vehicleData.transaction?.billOfSale?.knownDefects || vehicleData.vehicle?.knownDefects || "",
          };
        });
        setHasExistingData(true)
      } else {
        // Use pre-populated data
        setBillOfSale(prev => {
          return {
            ...prev,
            ...Object.fromEntries(Object.entries(prePopulatedBillOfSale).map(([k, v]) => [k, v ?? ""])),
            vehicleVIN: prePopulatedBillOfSale.vehicleVIN || "",
            vehicleYear: prePopulatedBillOfSale.vehicleYear || "",
            vehicleMake: prePopulatedBillOfSale.vehicleMake || "",
            vehicleModel: prePopulatedBillOfSale.vehicleModel || "",
            vehicleMileage: prePopulatedBillOfSale.vehicleMileage || "",
            vehicleColor: prePopulatedBillOfSale.vehicleColor || "",
            vehicleBodyStyle: prePopulatedBillOfSale.vehicleBodyStyle || "",
            titleStatus: prePopulatedBillOfSale.titleStatus || "clean",
            knownDefects: prePopulatedBillOfSale.knownDefects || "",
            vehicleTitleNumber: prePopulatedBillOfSale.vehicleTitleNumber || "",
          };
        });
      }

      if (vehicleData.transaction?.documents) {
        const documents = vehicleData.transaction.documents;
        setDocumentsUploaded(prev => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(documents).map(([key, value]) => [key, Boolean(value)])
          )
        }))
        
        // Set document previews if files exist - fix URL paths
        const previews: { [key: string]: string | null } = {}
        Object.keys(documents).forEach(key => {
          if (documents[key]) {
            // Fix URL paths to include backend base URL
            const documentPath = documents[key]
            if (documentPath && typeof documentPath === 'string' && !documentPath.startsWith('http')) {
              // Add backend base URL if it's a relative path
              const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
              previews[key] = `${baseUrl}${documentPath}`
            } else if (documentPath && typeof documentPath === 'string') {
              // Use the path as is if it's already a full URL
              previews[key] = documentPath
            }
          }
        })
        setDocumentPreviews(prev => ({
          ...prev,
          ...previews
        }))
      }

      // Set payment status - if transaction exists and is completed, show completed
      if (vehicleData.transaction?.paymentStatus) {
        setPaymentStatus(vehicleData.transaction.paymentStatus)
      } else if (vehicleData.transaction?.submittedAt) {
        // If transaction exists but no payment status, assume completed
        setPaymentStatus("completed")
      }

      // Initialize payoff status from existing transaction data
      if (vehicleData.transaction?.payoffStatus) {
        setPayoffStatus(vehicleData.transaction.payoffStatus);
      } else if (vehicleData.transaction?.bankDetails?.payoffAmount && Number(vehicleData.transaction.bankDetails.payoffAmount) > 0) {
        // If there's a payoff amount but no status, set to pending
        setPayoffStatus('pending');
      }

      // Initialize payoff notes from existing transaction data
      if (vehicleData.transaction?.payoffNotes) {
        setPayoffNotes(vehicleData.transaction.payoffNotes);
      }

      // If there's transaction data, set formSaved to true
      if (vehicleData.transaction) {
        setFormSaved(true);
      }

      setIsLoading(false)
    }

    loadExistingData()
  }, []);

  // Ensure vehicle information is properly loaded from previous stages
  useEffect(() => {
    if (vehicleData?.vehicle && billOfSale) {
      // Add additional vehicle data that might not have been loaded in initial load
      setBillOfSale(prev => ({
        ...prev,
        vehicleVIN: vehicleData.vehicle?.vin || prev.vehicleVIN,
        vehicleYear: vehicleData.vehicle?.year || prev.vehicleYear,
        vehicleMake: vehicleData.vehicle?.make || prev.vehicleMake,
        vehicleModel: vehicleData.vehicle?.model || prev.vehicleModel,
        vehicleColor: vehicleData.vehicle?.color || prev.vehicleColor,
        vehicleBodyStyle: vehicleData.vehicle?.bodyStyle || prev.vehicleBodyStyle,
        vehicleLicensePlate: vehicleData.vehicle?.licensePlate || prev.vehicleLicensePlate,
        vehicleLicenseState: vehicleData.vehicle?.licenseState || prev.vehicleLicenseState,
        vehicleTitleNumber: vehicleData.vehicle?.titleNumber || prev.vehicleTitleNumber,
        odometerReading: vehicleData.vehicle?.currentMileage || prev.odometerReading,
      }));
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading paperwork data...</p>
        </div>
      </div>
    )
  }

  const renderDocumentPreview = (docType: string) => {
    const preview = documentPreviews[docType]
    const isUploaded = documentsUploaded[docType]
    
    if (!isUploaded) return null

    const isImage = docType === 'idRescan' || docType === 'titlePhoto' || docType === 'sellerSignature'
    
    return (
      <div className="mt-2 p-3 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {docType === "idRescan" ? "ID Rescan" : 
             docType === "signedBillOfSale" ? "Signed Bill of Sale" : 
             docType === "titlePhoto" ? "Vehicle Title" : 
             docType === "insuranceDeclaration" ? "Insurance Declaration" : 
             docType === "sellerSignature" ? "Seller's Signature" : 
             "Additional Document"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeDocument(docType)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {isImage && preview ? (
          <Image 
            src={preview} 
            alt={`${docType} preview`}
            width={400}
            height={128}
            className="w-full h-32 object-cover rounded border"
            onError={(e) => {
              console.error('Image failed to load:', preview)
              // Fallback to document icon if image fails to load
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.classList.remove('hidden')
            }}
          />
        ) : null}
        
        {(!isImage || !preview) && (
          <div className="flex items-center justify-center h-32 bg-white border rounded">
            <FileText className="h-8 w-8 text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">
              {isImage ? "Image uploaded" : "Document uploaded"}
            </span> 
          </div>
        )}
      </div>
    )
  }

  const handleBillOfSaleChange = (field: string, value: string | boolean | number) => {
    setBillOfSale((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const removeDocument = (docType: string) => {
    setDocumentsUploaded(prev => ({
      ...prev,
      [docType]: false
    }))
    
    if (documentPreviews[docType]) {
      URL.revokeObjectURL(documentPreviews[docType]!)
      setDocumentPreviews(prev => ({
        ...prev,
        [docType]: null
      }))
    }
  }

  const handlePrintBillOfSale = async () => {
    if (!formSaved) {
      toast({
        title: 'Data not saved',
        description: 'Please save your data before printing the bill of sale.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsGeneratingPDF(true)
      
      // Get the case ID
      const caseId = vehicleData.id || vehicleData._id
      
      if (!caseId) {
        throw new Error("Case ID not found")
      }

      // For estimators, save the current paperwork data first to ensure the PDF has the latest information
      if (isEstimator || isAdmin || isAgent) {
        const paperworkData = {
          billOfSale,
          preferredPaymentMethod,
          submittedAt: new Date(),
          status: "pending",
        }

        try {
          await api.savePaperworkByCaseId(caseId, paperworkData)
          toast({
            title: "Data Saved",
            description: "Paperwork data saved before generating bill of sale.",
          })
        } catch (error) {
          console.error('Error saving paperwork data:', error)
          // Continue with PDF generation even if save fails
        }
      }

      // Generate Bill of Sale PDF
      const pdfBlob = await api.generateBillOfSalePDF(caseId)
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `bill-of-sale-${caseId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Bill of Sale Generated",
        description: "Bill of Sale PDF has been downloaded successfully.",
      })
    } catch (error) {
      console.error('Error generating bill of sale:', error)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleUploadSignedDocument = async (file: File) => {
    try {
      const caseId = vehicleData.id || vehicleData._id
      if (!caseId) {
        throw new Error("Case ID not found")
      }

      // Upload the signed document
      const response = await api.uploadDocument(file)
      
      if (response.success && response.data) {
        // Update document previews
        setDocumentPreviews(prev => ({
          ...prev,
          signedBillOfSale: response.data?.path || ''
        }))
        
        // Mark as uploaded
        setDocumentsUploaded(prev => ({
          ...prev,
          signedBillOfSale: true
        }))

        toast({
          title: "Document Uploaded",
          description: "Signed bill of sale uploaded successfully.",
        })
      } else {
        throw new Error(response.error || 'Failed to upload document')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload document. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleComplete = async () => {
   
    try {
      // Check if payoff confirmation is required
      const hasPayoff = vehicleData.transaction?.bankDetails?.payoffAmount && Number(vehicleData.transaction.bankDetails.payoffAmount) > 0;
      const payoffStatus = vehicleData.transaction?.payoffStatus;
      
      if (hasPayoff && payoffStatus !== 'completed' && payoffStatus !== 'not_required') {
        toast({
          title: 'Payoff Confirmation Required',
          description: 'Please confirm the payoff status before completing the transaction.',
          variant: 'destructive'
        });
        return;
      }

      const completeData = {
        billOfSale,
        preferredPaymentMethod,
        documentsUploaded,
        documents: documentPreviews,
        submittedAt: new Date(),
        status: "completed",
        paymentStatus: "completed"
      }

      // Save complete data
      let response;
      const saveCaseId = vehicleData.id || vehicleData._id;
      if ((isEstimator || isAdmin || isAgent) && saveCaseId) {
        response = await api.savePaperworkByCaseId(saveCaseId, completeData);
      } else if (vehicleData.quote && vehicleData.quote.accessToken && vehicleData.quote.accessToken !== '') {
        response = await api.updatePaperwork(vehicleData.quote.accessToken, JSON.stringify(completeData));
      } else {
        throw new Error('No valid case ID or access token found for paperwork submission');
      }

      if (!response || !response.success) {
        throw new Error('Failed to save complete paperwork data');
      }

      // Update case data with complete transaction
      if (response.data) {
        let updatedTransaction;
        if ('transaction' in response.data) {
          updatedTransaction = response.data.transaction;
        } else {
          updatedTransaction = response.data;
        }
        
        onUpdate({
          ...vehicleData,
          transaction: updatedTransaction as TransactionData
        });
      }

      // Update stage statuses to mark stage 6 as complete
      const currentStageStatuses = vehicleData.stageStatuses || {};
      const stageData = {
        currentStage: vehicleData.currentStage || 7, // Preserve current stage or default to 7
        stageStatuses: {
          ...currentStageStatuses,
          6: 'complete' // Mark stage 6 (Paperwork) as complete
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

      // Send stage time data to API
      if (caseId && timer.startTime) {
        try {
          const endTime = new Date();
          await api.updateStageTime(caseId, 'paperwork', timer.startTime, endTime);
          console.log('Successfully sent stage time data');
        } catch (error) {
          console.error('Failed to send stage time data:', error);
        }
      }

      // Proceed to next stage
      onComplete();
      
      toast({
        title: "Paperwork Complete",
        description: "All documentation and payment processing completed successfully.",
      });
    } catch (error) {
      console.error('Error completing paperwork:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete paperwork. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleSaveData = async () => {
    try {
      setSaving(true);
      
      // Save only the basic paperwork data without documents or payment status
      const paperworkData = {
        billOfSale,
        preferredPaymentMethod,
        submittedAt: new Date(),
      }

      // Save to database
      let response;
      const saveCaseId = vehicleData.id || vehicleData._id;
      if ((isEstimator || isAdmin || isAgent) && saveCaseId) {
        response = await api.savePaperworkByCaseId(saveCaseId, paperworkData);
      } else if (vehicleData.quote && vehicleData.quote.accessToken && vehicleData.quote.accessToken !== '') {
        response = await api.updatePaperwork(vehicleData.quote.accessToken, JSON.stringify(paperworkData));
      } else {
        throw new Error('No valid case ID or access token found for paperwork submission');
      }

      if (response && response.success) {
        // Mark form as saved
        setFormSaved(true);
        
        // Update case data
        if (response.data) {
          // Check response type to properly access transaction data
          let updatedTransaction;
          if ('transaction' in response.data) {
            // For savePaperworkByCaseId response
            updatedTransaction = response.data.transaction;
          } else {
            // For updatePaperwork response
            updatedTransaction = response.data;
          }
          
          onUpdate({
            ...vehicleData,
            transaction: updatedTransaction as TransactionData
          });
        }
        // Show success message
        toast({
          title: 'Success!',
          description: 'Paperwork data saved successfully',
        });
      } else {
        throw new Error(response?.error || 'Failed to save paperwork data');
      }
    } catch (error) {
      console.error('Error saving paperwork data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save paperwork data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmPayoff = async () => {
    try {
      setIsConfirmingPayoff(true);
      
      const caseId = vehicleData.id || vehicleData._id;
      if (!caseId) {
        throw new Error('No valid case ID found for payoff confirmation');
      }

      const response = await api.confirmPayoff(caseId, payoffStatus, payoffNotes);

      if (response && response.success) {
        // Update case data with updated transaction
        if (response.data) {
          onUpdate({
            ...vehicleData,
            transaction: response.data.transaction as TransactionData
          });
        }
        
        toast({
          title: 'Payoff Status Updated',
          description: `Payoff status has been updated to ${payoffStatus}`,
        });
      } else {
        throw new Error(response?.error || 'Failed to confirm payoff');
      }
    } catch (error) {
      console.error('Error confirming payoff:', error);
      toast({
        title: 'Error',
        description: 'Failed to confirm payoff. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsConfirmingPayoff(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Paperwork & Payment</h2>
          <p className="text-muted-foreground">
            Complete Bill of Sale and payment information
          </p>
        </div>
        
        <div className="flex items-center gap-2">          
          <Badge
            className={
              paymentStatus === "completed"
                ? "bg-green-100 text-green-800"
                : paymentStatus === "processing"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-yellow-100 text-yellow-800"
            }
          >
            {paymentStatus === "completed" ? "Payment Sent" : paymentStatus === "processing" ? "Processing" : "Pending"}
          </Badge>
          
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timer.elapsedFormatted}
          </Badge>
        </div>
      </div>

      {/* Signing Dialog */}
      {/* Removed as per edit hint */}

      {/* Transaction Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Customer:</span> {vehicleData.customer?.firstName} {vehicleData.customer?.lastName}
            </div>
            <div>
              <span className="font-medium">Vehicle:</span> {vehicleData.vehicle?.year} {vehicleData.vehicle?.make}{" "}
              {vehicleData.vehicle?.model}
            </div>
            <div>
              <span className="font-medium">VIN:</span> {vehicleData.vehicle?.vin}
            </div>
            <div>
              <span className="font-medium">Final Amount:</span>
              <span className="text-green-600 font-semibold ml-1">
                ${(vehicleData.offerDecision?.finalAmount || vehicleData.quote?.offerAmount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bill of Sale - Seller Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Seller Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sellerName">Full Legal Name *</Label>
                <Input
                  id="sellerName"
                  value={billOfSale.sellerName}
                  onChange={(e) => handleBillOfSaleChange("sellerName", e.target.value)}
                  placeholder="Customer&apos;s full legal name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sellerAddress">Address *</Label>
                <Input
                  id="sellerAddress"
                  value={billOfSale.sellerAddress}
                  onChange={(e) => handleBillOfSaleChange("sellerAddress", e.target.value)}
                  placeholder="Street address"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="sellerCity">City *</Label>
                  <Input
                    id="sellerCity"
                    value={billOfSale.sellerCity}
                    onChange={(e) => handleBillOfSaleChange("sellerCity", e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerState">State *</Label>
                  <Input
                    id="sellerState"
                    value={billOfSale.sellerState}
                    onChange={(e) => handleBillOfSaleChange("sellerState", e.target.value)}
                    placeholder="ST"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerZip">ZIP *</Label>
                  <Input
                    id="sellerZip"
                    value={billOfSale.sellerZip}
                    onChange={(e) => handleBillOfSaleChange("sellerZip", e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sellerPhone">Phone *</Label>
                  <Input
                    id="sellerPhone"
                    value={billOfSale.sellerPhone}
                    onChange={(e) => handleBillOfSaleChange("sellerPhone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerEmail">Email *</Label>
                  <Input
                    id="sellerEmail"
                    value={billOfSale.sellerEmail}
                    onChange={(e) => handleBillOfSaleChange("sellerEmail", e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sellerDLNumber">Driver&apos;s License # *</Label>
                  <Input
                    id="sellerDLNumber"
                    value={billOfSale.sellerDLNumber}
                    onChange={(e) => handleBillOfSaleChange("sellerDLNumber", e.target.value)}
                    placeholder="DL Number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerDLState">DL State *</Label>
                  <Input
                    id="sellerDLState"
                    value={billOfSale.sellerDLState}
                    onChange={(e) => handleBillOfSaleChange("sellerDLState", e.target.value)}
                    placeholder="ST"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bill of Sale - Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleYear">Year *</Label>
                <Input
                  id="vehicleYear"
                  value={billOfSale.vehicleYear}
                  onChange={(e) => handleBillOfSaleChange("vehicleYear", e.target.value)}
                  placeholder="2020"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleMake">Make *</Label>
                <Input
                  id="vehicleMake"
                  value={billOfSale.vehicleMake}
                  onChange={(e) => handleBillOfSaleChange("vehicleMake", e.target.value)}
                  placeholder="Toyota"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleModel">Model *</Label>
                <Input
                  id="vehicleModel"
                  value={billOfSale.vehicleModel}
                  onChange={(e) => handleBillOfSaleChange("vehicleModel", e.target.value)}
                  placeholder="Camry"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleColor">Color *</Label>
                <Input
                  id="vehicleColor"
                  value={billOfSale.vehicleColor}
                  onChange={(e) => handleBillOfSaleChange("vehicleColor", e.target.value)}
                  placeholder="Silver"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vehicleVIN">VIN *</Label>
              <Input
                id="vehicleVIN"
                value={billOfSale.vehicleVIN}
                onChange={(e) => handleBillOfSaleChange("vehicleVIN", e.target.value)}
                placeholder="1HGBH41JXMN109186"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleLicensePlate">License Plate #</Label>
                <Input
                  id="vehicleLicensePlate"
                  value={billOfSale.vehicleLicensePlate}
                  onChange={(e) => handleBillOfSaleChange("vehicleLicensePlate", e.target.value)}
                  placeholder="ABC123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleLicenseState">State</Label>
                <Input
                  id="vehicleLicenseState"
                  value={billOfSale.vehicleLicenseState}
                  onChange={(e) => handleBillOfSaleChange("vehicleLicenseState", e.target.value)}
                  placeholder="State"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleBodyStyle">Body Style</Label>
                <Input
                  id="vehicleBodyStyle"
                  value={billOfSale.vehicleBodyStyle}
                  onChange={(e) => handleBillOfSaleChange("vehicleBodyStyle", e.target.value)}
                  placeholder="Sedan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleTitleNumber">Title Number</Label>
                <Input
                  id="vehicleTitleNumber"
                  value={billOfSale.vehicleTitleNumber}
                  onChange={(e) => handleBillOfSaleChange("vehicleTitleNumber", e.target.value)}
                  placeholder="Title #"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="saleDate">Sale Date *</Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={billOfSale.saleDate}
                  onChange={(e) => handleBillOfSaleChange("saleDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saleTime">Sale Time</Label>
                <Input
                  id="saleTime"
                  type="time"
                  value={billOfSale.saleTime}
                  onChange={(e) => handleBillOfSaleChange("saleTime", e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="salePrice">Sale Price *</Label>
              <Input
                id="salePrice"
                type="number"
                value={billOfSale.salePrice}
                onChange={(e) => handleBillOfSaleChange("salePrice", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={billOfSale.paymentMethod}
                onValueChange={(value) => handleBillOfSaleChange("paymentMethod", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACH Transfer">ACH Transfer</SelectItem>
                  <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="odometerReading">Odometer Reading (Miles) *</Label>
              <Input
                id="odometerReading"
                value={billOfSale.odometerReading}
                onChange={(e) => handleBillOfSaleChange("odometerReading", e.target.value)}
                placeholder="Current mileage"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="odometerAccurate" 
                checked={billOfSale.odometerAccurate}
                onCheckedChange={(checked) => handleBillOfSaleChange("odometerAccurate", Boolean(checked))}
              />
              <Label htmlFor="odometerAccurate" className="text-sm">
                I certify that the odometer reading reflects the actual mileage
              </Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="titleStatus">Title Status *</Label>
              <Select
                value={billOfSale.titleStatus}
                onValueChange={(value) => handleBillOfSaleChange("titleStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select title status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clean">Clean Title</SelectItem>
                  <SelectItem value="salvage">Salvage Title</SelectItem>
                  <SelectItem value="rebuilt">Rebuilt Title</SelectItem>
                  <SelectItem value="lemon">Lemon Law Buyback</SelectItem>
                  <SelectItem value="flood">Flood Damaged</SelectItem>
                  <SelectItem value="junk">Junk Title</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="knownDefects">Known Defects or Issues</Label>
              <Textarea
                id="knownDefects"
                value={billOfSale.knownDefects}
                onChange={(e) => handleBillOfSaleChange("knownDefects", e.target.value)}
                placeholder="List any known mechanical issues, damage, or defects..."
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="asIsAcknowledgment" 
                checked={billOfSale.asIsAcknowledgment}
                onCheckedChange={(checked) => handleBillOfSaleChange("asIsAcknowledgment", Boolean(checked))}
              />
              <Label htmlFor="asIsAcknowledgment" className="text-sm">
                <span className="font-medium">AS-IS STATEMENT: </span>
                I understand that this vehicle is being sold &quot;AS-IS&quot; with no warranties, expressed or implied.
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preferredPaymentMethod">Preferred Payment Method *</Label>
              <Select
                value={preferredPaymentMethod}
                onValueChange={setPreferredPaymentMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wire">Wire</SelectItem>
                  <SelectItem value="ACH">ACH</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Bank Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={vehicleData.transaction?.bankDetails?.bankName || ""}
                onChange={(e) => {
                  const updatedTransaction = {
                    ...vehicleData.transaction,
                    bankDetails: {
                      ...vehicleData.transaction?.bankDetails,
                      bankName: e.target.value
                    }
                  };
                  onUpdate({ transaction: updatedTransaction });
                }}
                placeholder="Enter bank name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="loanNumber">Loan Number</Label>
              <Input
                id="loanNumber"
                value={vehicleData.transaction?.bankDetails?.loanNumber || ""}
                onChange={(e) => {
                  const updatedTransaction = {
                    ...vehicleData.transaction,
                    bankDetails: {
                      ...vehicleData.transaction?.bankDetails,
                      loanNumber: e.target.value
                    }
                  };
                  onUpdate({ transaction: updatedTransaction });
                }}
                placeholder="Enter loan number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payoffAmount">Payoff Amount</Label>
              <Input
                id="payoffAmount"
                type="number"
                value={vehicleData.transaction?.bankDetails?.payoffAmount || ""}
                onChange={(e) => {
                  const updatedTransaction = {
                    ...vehicleData.transaction,
                    bankDetails: {
                      ...vehicleData.transaction?.bankDetails,
                      payoffAmount: parseFloat(e.target.value) || 0
                    }
                  };
                  onUpdate({ transaction: updatedTransaction });
                }}
                placeholder="0.00"
              />
            </div>
          </CardContent>
        </Card>

      </div>



                {/* Save Button Section - moved above Required Documents */}
                {!hasExistingData && (
          <Card className="border-blue-200 bg-blue-50 w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5" />
                Save Paperwork
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleSaveData}
                disabled={saving || formSaved}
                className="w-full"
                variant="default"
                size="lg"
              >
                {saving ? "Saving..." : formSaved ? "Saved" : "Save Paperwork"}
              </Button>
              {formSaved && (
                <div className="text-green-600 text-sm mt-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Paperwork data saved successfully.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(formSaved || hasExistingData) && ( 
      <>

      
        {/* Payoff Confirmation */}
        <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payoff Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payoffStatus">Payoff Status</Label>
                <Select
                  value={payoffStatus}
                  onValueChange={(value: 'pending' | 'confirmed' | 'completed' | 'not_required') => setPayoffStatus(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payoff status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending - Bill of Sale signed, awaiting bank contact</SelectItem>
                    <SelectItem value="confirmed">Confirmed - Payoff amount verified with bank</SelectItem>
                    <SelectItem value="completed">Completed - Payoff processed and completed</SelectItem>
                    <SelectItem value="not_required">Not Required - No payoff needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payoffNotes">Payoff Notes</Label>
                <Textarea
                  id="payoffNotes"
                  value={payoffNotes}
                  onChange={(e) => setPayoffNotes(e.target.value)}
                  placeholder="Enter any notes about the payoff process..."
                  rows={3}
                />
              </div>
              
              <Button
                onClick={handleConfirmPayoff}
                disabled={isConfirmingPayoff}
                className="w-full"
                variant="default"
              >
                {isConfirmingPayoff ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating Payoff Status...
                  </>
                ) : (
                  'Update Payoff Status'
                )}
              </Button>
              
              {vehicleData.transaction?.payoffStatus && (
                <div className="text-sm text-gray-600">
                  <p><strong>Current Status:</strong> {vehicleData.transaction.payoffStatus}</p>
                  {vehicleData.transaction.payoffConfirmedAt && (
                    <p><strong>Confirmed:</strong> {new Date(vehicleData.transaction.payoffConfirmedAt).toLocaleString()}</p>
                  )}
                  {vehicleData.transaction.payoffCompletedAt && (
                    <p><strong>Completed:</strong> {new Date(vehicleData.transaction.payoffCompletedAt).toLocaleString()}</p>
                  )}
                  {vehicleData.transaction.payoffNotes && (
                    <p><strong>Notes:</strong> {vehicleData.transaction.payoffNotes}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        {/* Document Upload */}
        <Card className="border-blue-200 bg-blue-50 w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Required Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Signed Bill of Sale *</Label>
              <div className="flex gap-2">
                <Button onClick={handlePrintBillOfSale} className="flex-1">
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Print Bill of Sale
                    </>
                  )}
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadSignedDocument(file);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Signed
                  </Button>
                </div>
              </div>
              {renderDocumentPreview("signedBillOfSale")}
            </div>
          </CardContent>
        </Card>
      {paymentStatus === "completed" && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Payment Initiated</h3>
                <p className="text-sm text-green-700">
                  ACH transfer of ${billOfSale.salePrice.toLocaleString()} has been successfully initiated. Funds will
                  arrive in 1-2 business days.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}



      <div className="flex justify-between">
        <div></div>

        <Button 
          onClick={handleComplete} 
          size="lg" 
          className="px-8"
          disabled={
            Boolean(
              vehicleData.transaction?.bankDetails?.payoffAmount && 
              Number(vehicleData.transaction.bankDetails.payoffAmount) > 0 && 
              vehicleData.transaction?.payoffStatus !== 'completed' && 
              vehicleData.transaction?.payoffStatus !== 'not_required'
            )
          }
        >
          {(() => {
            const hasPayoff = vehicleData.transaction?.bankDetails?.payoffAmount && Number(vehicleData.transaction.bankDetails.payoffAmount) > 0;
            const payoffStatus = vehicleData.transaction?.payoffStatus;
            
            if (hasPayoff && payoffStatus !== 'completed' && payoffStatus !== 'not_required') {
              return 'Complete Payoff First';
            }
            return 'Continue to Completion';
          })()}
        </Button>
      </div>
      </>
      )}
    </div>
  )
}