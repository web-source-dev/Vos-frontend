"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileUpload } from "@/components/file-upload"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { FileText, CreditCard, Upload, CheckCircle, Printer, Eye, X, Camera } from "lucide-react"
import api from '@/lib/api'
import Image from "next/image"

import { VeriffResult } from '@/lib/veriff-types';

// TypeScript interfaces for paperwork data
interface CustomerData {
  firstName?: string
  lastName?: string
  cellPhone?: string
  email1?: string
}

interface VehicleData {
  year?: string
  make?: string
  model?: string
  vin?: string
  currentMileage?: string
  color?: string
  bodyStyle?: string
  titleNumber?: string
  licensePlate?: string
  licenseState?: string
  titleStatus?: string
  knownDefects?: string
}

interface OfferDecisionData {
  finalAmount?: number
}

interface QuoteData {
  offerAmount?: number
}

interface TransactionData {
  billOfSale?: BillOfSaleData
  bankDetails?: BankDetailsData
  taxInfo?: TaxInfoData
  documents?: DocumentData
  paymentStatus?: string
  submittedAt?: string
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
  accountHolderName?: string
  routingNumber?: string
  accountNumber?: string
  accountType?: string
  bankName?: string
  bankPhone?: string
  accountOpenedDate?: string
  electronicConsentAgreed?: boolean
}

interface TaxInfoData {
  ssn?: string
  taxId?: string
  reportedIncome?: boolean
  form1099Agreed?: boolean
}

interface DocumentData {
  [key: string]: string | null
}

interface CaseData {
  id?: string
  _id?: string
  customer?: CustomerData
  vehicle?: VehicleData
  offerDecision?: OfferDecisionData
  quote?: QuoteData
  transaction?: TransactionData
  currentStage?: number
  status?: string
}

interface PaperworkProps {
  vehicleData: CaseData
  onUpdate: (data: CaseData) => void
  onComplete: () => void
  isEstimator?: boolean
}

export function Paperwork({ vehicleData, onUpdate, onComplete, isEstimator = false }: PaperworkProps) {
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'declined' | 'error'>('pending')
  const [isVerifying, setIsVerifying] = useState(false)
  const veriffContainerRef = useRef<HTMLDivElement>(null)
  
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

  const [bankDetails, setBankDetails] = useState({
    accountHolderName: "",
    routingNumber: "",
    accountNumber: "",
    accountType: "checking",
    bankName: "",
    bankPhone: "",
    accountOpenedDate: "",
    electronicConsentAgreed: false,
  })

  const [taxInfo, setTaxInfo] = useState({
    ssn: "",
    taxId: "",
    reportedIncome: false,
    form1099Agreed: false,
  })

  const [documentsUploaded, setDocumentsUploaded] = useState<{
    [key: string]: boolean;
  }>({
    idRescan: false,
    signedBillOfSale: false,
    titlePhoto: false,
    insuranceDeclaration: false,
    sellerSignature: false,
    additionalDocument: false,
  })

  const [documentPreviews, setDocumentPreviews] = useState<{
    [key: string]: string | null;
  }>({
    idRescan: null,
    signedBillOfSale: null,
    titlePhoto: null,
    insuranceDeclaration: null,
    sellerSignature: null,
    additionalDocument: null,
  })

  const [paymentStatus, setPaymentStatus] = useState("pending") // pending, processing, completed
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasExistingData, setHasExistingData] = useState(false)
  const { toast } = useToast()

  // Initialize Veriff SDK
  useEffect(() => {
    const loadVeriffSDK = async () => {
      try {
        // Load Veriff SDK scripts (using the version provided by Veriff)
        const scripts = [
          'https://cdn.veriff.me/sdk/js/1.5/veriff.min.js',
          'https://cdn.veriff.me/incontext/js/v1/veriff.js'
        ];

        for (const src of scripts) {
          const script = document.createElement('script');
          script.src = src;
          script.async = true;
          document.head.appendChild(script);
        }

        // Wait for scripts to load
        setTimeout(() => {
          console.log('Veriff SDK scripts loaded successfully');
        }, 1000);
      } catch (error) {
        console.error('Failed to load Veriff SDK:', error);
      }
    };

    loadVeriffSDK();
  }, []);

  // Load existing paperwork data on component mount
  useEffect(() => {
    const loadExistingData = () => {
      // Always pre-populate with case data first
      const prePopulatedBillOfSale = {
        sellerName: vehicleData.customer?.firstName && vehicleData.customer?.lastName 
          ? `${vehicleData.customer.firstName} ${vehicleData.customer.lastName}` 
          : "",
        sellerPhone: vehicleData.customer?.cellPhone || "",
        sellerEmail: vehicleData.customer?.email1 || "",
        vehicleVIN: vehicleData.vehicle?.vin || "",
        vehicleYear: vehicleData.vehicle?.year || "",
        vehicleMake: vehicleData.vehicle?.make || "",
        vehicleModel: vehicleData.vehicle?.model || "",
        vehicleMileage: vehicleData.vehicle?.currentMileage || "",
        vehicleColor: vehicleData.vehicle?.color || "",
        vehicleBodyStyle: vehicleData.vehicle?.bodyStyle || "",
        vehicleTitleNumber: vehicleData.vehicle?.titleNumber || "",
        vehicleLicensePlate: vehicleData.vehicle?.licensePlate || "",
        vehicleLicenseState: vehicleData.vehicle?.licenseState || "",
        odometerReading: vehicleData.vehicle?.currentMileage || "",
        titleStatus: vehicleData.vehicle?.titleStatus || "clean",
        knownDefects: vehicleData.vehicle?.knownDefects || "",
        salePrice: vehicleData.offerDecision?.finalAmount || vehicleData.quote?.offerAmount || 0,
        saleDate: new Date().toISOString().split("T")[0], // Always set current date
        saleTime: new Date().toTimeString().split(" ")[0].slice(0, 5), // Always set current time
      }

      // Pre-populate bank details with current date for account opened
      const prePopulatedBankDetails = {
        accountOpenedDate: new Date().toISOString().slice(0, 7), // Current year-month
      }

      if (vehicleData.transaction?.billOfSale) {
        // Override with existing transaction data, but preserve pre-populated data for missing fields
        setBillOfSale(prev => ({
          ...prev,
          ...prePopulatedBillOfSale,
          ...vehicleData.transaction?.billOfSale,
          // Ensure these fields are always populated from case data
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
        }))
        setHasExistingData(true)
      } else {
        // Use pre-populated data
        setBillOfSale(prev => ({
          ...prev,
          ...prePopulatedBillOfSale
        }))
      }

      if (vehicleData.transaction?.bankDetails) {
        setBankDetails(prev => ({
          ...prev,
          ...prePopulatedBankDetails,
          ...vehicleData.transaction!.bankDetails,
          // Ensure account opened date is preserved
          accountOpenedDate: vehicleData.transaction!.bankDetails!.accountOpenedDate || new Date().toISOString().slice(0, 7),
        }))
      } else {
        setBankDetails(prev => ({
          ...prev,
          ...prePopulatedBankDetails
        }))
      }

      if (vehicleData.transaction?.taxInfo) {
        setTaxInfo(prev => ({
          ...prev,
          ...vehicleData.transaction!.taxInfo
        }))
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
        console.log('Loading documents:', documents)
        Object.keys(documents).forEach(key => {
          if (documents[key]) {
            // Fix URL paths to include backend base URL
            const documentPath = documents[key]
            console.log(`Document ${key}:`, documentPath, typeof documentPath)
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

      setIsLoading(false)
    }

    loadExistingData()
  }, [vehicleData])

  const handleBillOfSaleChange = (field: string, value: string | boolean | number) => {
    setBillOfSale((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleBankDetailsChange = (field: string, value: string | boolean) => {
    setBankDetails((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleTaxInfoChange = (field: string, value: string | boolean) => {
    setTaxInfo((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleDocumentUpload = async (docType: string, file: File) => {
    // Special handling for ID rescan - trigger Veriff verification
    if (docType === "idRescan") {
      await handleVeriffVerification()
      return
    }

    try {
      // Create preview URL for the file
      const previewUrl = URL.createObjectURL(file)
      setDocumentPreviews(prev => ({
        ...prev,
        [docType]: previewUrl
      }))

      // Upload file to server
      const response = await api.uploadDocument(file)
      
      if (response.success) {
        setDocumentsUploaded((prev) => ({
          ...prev,
          [docType]: true,
        }))
        
        // Update the preview with the actual server path
        if (response.data?.path) {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
          const serverUrl = `${baseUrl}${response.data.path}`
          setDocumentPreviews(prev => ({
            ...prev,
            [docType]: serverUrl
          }))
        }

        toast({
          title: "Document Uploaded",
          description: `${docType === "idRescan" ? "ID Rescan" : docType === "signedBillOfSale" ? "Signed Bill of Sale" : docType === "titlePhoto" ? "Vehicle Title" : docType === "insuranceDeclaration" ? "Insurance Declaration" : docType === "sellerSignature" ? "Seller's Signature" : "Additional Document"} uploaded successfully.`,
        })
      }
    } catch (error) {
      const errorData = api.handleError(error)
      toast({
        title: "Upload Failed",
        description: errorData.error,
        variant: "destructive",
      })
    }
  }

  const handleVeriffVerification = async () => {
    setIsVerifying(true)
    setVerificationStatus('pending')
    
    try {
      // Create Veriff session
      const response = await api.createVeriffSession({
        person: {
          givenName: vehicleData.customer?.firstName || 'John',
          lastName: vehicleData.customer?.lastName || 'Doe',
          email: vehicleData.customer?.email1 || 'customer@example.com',
        },
        document: {
          type: 'DRIVERS_LICENSE',
          country: 'US',
        },
      })

      if (!response.success) {
        throw new Error('Failed to create verification session')
      }

      // Launch Veriff modal using the session URL
      if (window.Veriff && response.data?.url) {
        const veriff = window.Veriff({
          host: 'https://stationapi.veriff.com',
          parentId: veriffContainerRef.current?.id || 'veriff-container',
          onSession: function(err: Error | null, response: Record<string, unknown>) {
            if (err) {
              console.error('Veriff session error:', err);
              setVerificationStatus('error');
              setIsVerifying(false);
              toast({
                title: "Verification Error",
                description: "Failed to start identity verification.",
                variant: "destructive",
              });
            } else {
              console.log('Veriff session created:', response);
            }
          },
          onVeriff: (response: VeriffResult) => {
            console.log('Veriff response:', response);
            handleVerificationResult(response);
          },
        });

        // Set person parameters
        veriff.setParams({
          person: {
            givenName: vehicleData.customer?.firstName || 'John',
            lastName: vehicleData.customer?.lastName || 'Doe'
          },
          vendorData: vehicleData.id || vehicleData._id || 'case_id'
        });

        // Mount the Veriff widget
        veriff.mount();
      }
    } catch (error) {
      console.error('Error starting Veriff verification:', error);
      setVerificationStatus('error');
      setIsVerifying(false);
      toast({
        title: "Verification Error",
        description: "Failed to start identity verification. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleVerificationResult = async (response: VeriffResult) => {
    try {
      const resultResponse = await fetch('/api/veriff/result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: response.sessionId,
          verificationData: response,
        }),
      });

      if (!resultResponse.ok) {
        throw new Error('Failed to process verification result');
      }

      const result = await resultResponse.json();
      
      if (result.status === 'approved') {
        setVerificationStatus('approved');
        setIsVerifying(false);
        
        // Mark ID rescan as uploaded and create a placeholder image
        setDocumentsUploaded(prev => ({
          ...prev,
          idRescan: true
        }));
        
        // Create a placeholder image for the verified ID
        const placeholderUrl = 'data:image/svg+xml;base64,' + btoa(`
          <svg width="400" height="128" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f0f9ff"/>
            <rect x="10" y="10" width="80" height="100" fill="#3b82f6" rx="5"/>
            <text x="50" y="70" text-anchor="middle" fill="white" font-family="Arial" font-size="12">ID</text>
            <text x="120" y="40" fill="#1e40af" font-family="Arial" font-size="14" font-weight="bold">Identity Verified</text>
            <text x="120" y="60" fill="#64748b" font-family="Arial" font-size="12">${vehicleData.customer?.firstName} ${vehicleData.customer?.lastName}</text>
            <text x="120" y="80" fill="#64748b" font-family="Arial" font-size="12">Veriff Verification Complete</text>
            <circle cx="350" cy="30" r="15" fill="#10b981"/>
            <text x="350" y="35" text-anchor="middle" fill="white" font-family="Arial" font-size="12">✓</text>
          </svg>
        `);
        
        setDocumentPreviews(prev => ({
          ...prev,
          idRescan: placeholderUrl
        }));

        toast({
          title: "Identity Verified",
          description: "Your identity has been verified successfully!",
        });
      } else {
        setVerificationStatus('declined');
        setIsVerifying(false);
        toast({
          title: "Verification Failed",
          description: "Identity verification was not successful. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing verification result:', error);
      setVerificationStatus('error');
      setIsVerifying(false);
      toast({
        title: "Error",
        description: "Failed to process verification result.",
        variant: "destructive",
      });
    }
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
    try {
      setIsGeneratingPDF(true)
      
      // Get the case ID
      const caseId = vehicleData.id || vehicleData._id
      
      if (!caseId) {
        throw new Error("Case ID not found")
      }

      // For estimators, save the current paperwork data first to ensure the PDF has the latest information
      if (isEstimator) {
        const paperworkData = {
          billOfSale,
          bankDetails,
          taxInfo,
          documentsUploaded,
          documents: documentPreviews,
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
      const errorData = api.handleError(error)
      toast({
        title: "Error Generating Bill of Sale",
        description: errorData.error,
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleVerifyAndSubmit = async () => {
    if (
      !billOfSale.sellerName ||
      !billOfSale.sellerAddress ||
      !bankDetails.accountHolderName ||
      !bankDetails.routingNumber ||
      !bankDetails.accountNumber ||
      !billOfSale.odometerReading
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive",
      })
      return
    }

    if ((!documentsUploaded.idRescan && verificationStatus !== 'approved') || !documentsUploaded.signedBillOfSale) {
      toast({
        title: "Missing Documents",
        description: "Please complete identity verification and upload all required documents before submitting.",
        variant: "destructive",
      })
      return
    }

    if (!billOfSale.asIsAcknowledgment) {
      toast({
        title: "Agreement Required",
        description: "Please acknowledge the as-is disclosure before proceeding.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const paperworkData = {
        billOfSale,
        bankDetails,
        taxInfo,
        documentsUploaded,
        documents: documentPreviews,
        submittedAt: new Date(),
        status: "processing",
      }

      console.log('=== PAPERWORK SUBMISSION START ===');
      console.log('paperworkData:', JSON.stringify(paperworkData, null, 2));

      // Save to backend if estimator
      if (isEstimator) {
        const caseId = vehicleData.id || vehicleData._id
        console.log('Saving paperwork for case ID:', caseId)
        console.log('Vehicle data:', vehicleData)
        
        if (caseId) {
          try {
            console.log('Calling savePaperworkByCaseId with caseId:', caseId);
            const response = await api.savePaperworkByCaseId(caseId, paperworkData)
            console.log('API Response:', response);
            
            if (response.success && response.data) {
              console.log('Paperwork saved successfully');
              // Update both paperwork and vehicle data
              const updatedVehicleData = {
                ...vehicleData,
                vehicle: {
                  ...vehicleData.vehicle,
                  color: billOfSale.vehicleColor,
                  licensePlate: billOfSale.vehicleLicensePlate,
                  licenseState: billOfSale.vehicleLicenseState,
                  bodyStyle: billOfSale.vehicleBodyStyle,
                  titleNumber: billOfSale.vehicleTitleNumber,
                  titleStatus: billOfSale.titleStatus,
                  knownDefects: billOfSale.knownDefects,
                },
                transaction: response.data.transaction as TransactionData,
                currentStage: 7,
                status: 'completed'
              }
              
              console.log('Updated vehicle data:', updatedVehicleData);
              onUpdate(updatedVehicleData)
            } else {
              console.error('API returned success: false', response);
              throw new Error(response.error || 'Failed to save paperwork');
            }
          } catch (error) {
            console.error('Error saving paperwork:', error)
            throw error
          }
        } else {
          throw new Error('Case ID not found in vehicle data')
        }
      } else {
        // For non-estimators, just update local state
        const updatedVehicleData = {
          ...vehicleData,
          transaction: {
            billOfSale,
            bankDetails,
            taxInfo,
            documents: documentPreviews,
            paymentStatus: "processing"
          }
        }
        onUpdate(updatedVehicleData)
      }

      setPaymentStatus("processing")

      // Simulate processing delay
      setTimeout(() => {
        setPaymentStatus("completed")
        toast({
          title: "Payment Processing",
          description: "ACH transfer has been initiated. Payment will be processed within 1-2 business days.",
        })
      }, 2000)

      console.log('=== PAPERWORK SUBMISSION SUCCESS ===');

    } catch (error) {
      console.error('=== PAPERWORK SUBMISSION ERROR ===');
      console.error('Error in handleVerifyAndSubmit:', error);
      const errorData = api.handleError(error)
      toast({
        title: "Error Saving Paperwork",
        description: errorData.error,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleComplete = () => {
    if (paymentStatus !== "completed") {
      toast({
        title: "Payment Not Processed",
        description: "Please complete payment processing before proceeding.",
        variant: "destructive",
      })
      return
    }

    onComplete()
    toast({
      title: "Paperwork Complete",
      description: "All documentation and payment processing completed successfully.",
    })
  }

  const isFormValid =
    billOfSale.sellerName &&
    billOfSale.sellerAddress &&
    bankDetails.accountHolderName &&
    bankDetails.routingNumber &&
    bankDetails.accountNumber &&
    (documentsUploaded.idRescan || verificationStatus === 'approved') &&
    documentsUploaded.signedBillOfSale &&
    billOfSale.asIsAcknowledgment

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Paperwork & Payment</h1>
          <p className="text-muted-foreground">Complete sale documentation and payment processing</p>
          {hasExistingData && (
            <div className="flex items-center gap-2 mt-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-600">Existing paperwork data loaded</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrintBillOfSale}
            disabled={isGeneratingPDF}
            variant="outline"
            size="sm"
          >
            <Printer className="h-4 w-4 mr-2" />
            {isGeneratingPDF ? "Generating..." : "Print Bill of Sale"}
          </Button>
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
        </div>
      </div>

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
              ACH Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountHolderName">Account Holder Name *</Label>
              <Input
                id="accountHolderName"
                value={bankDetails.accountHolderName}
                onChange={(e) => handleBankDetailsChange("accountHolderName", e.target.value)}
                placeholder="Full name on account"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  value={bankDetails.bankName}
                  onChange={(e) => handleBankDetailsChange("bankName", e.target.value)}
                  placeholder="Bank name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankPhone">Bank Phone</Label>
                <Input
                  id="bankPhone"
                  value={bankDetails.bankPhone}
                  onChange={(e) => handleBankDetailsChange("bankPhone", e.target.value)}
                  placeholder="Bank phone number"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="routingNumber">Routing Number *</Label>
              <Input
                id="routingNumber"
                value={bankDetails.routingNumber}
                onChange={(e) => handleBankDetailsChange("routingNumber", e.target.value)}
                placeholder="9-digit routing number"
                maxLength={9}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number *</Label>
              <Input
                id="accountNumber"
                type="password"
                value={bankDetails.accountNumber}
                onChange={(e) => handleBankDetailsChange("accountNumber", e.target.value)}
                placeholder="Account number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accountType">Account Type</Label>
              <Select
                value={bankDetails.accountType}
                onValueChange={(value) => handleBankDetailsChange("accountType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accountOpenedDate">Account Opened (approx.)</Label>
              <Input
                id="accountOpenedDate"
                type="month"
                value={bankDetails.accountOpenedDate}
                onChange={(e) => handleBankDetailsChange("accountOpenedDate", e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="electronicConsentAgreed" 
                checked={bankDetails.electronicConsentAgreed}
                onCheckedChange={(checked) => handleBankDetailsChange("electronicConsentAgreed", Boolean(checked))}
              />
              <Label htmlFor="electronicConsentAgreed" className="text-sm">
                I authorize electronic funds transfer to my account and acknowledge that I am authorized to sign on this account.
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Tax Information */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <p className="text-sm">
                The IRS requires us to collect tax identification information for transactions exceeding $600. The appropriate tax documents (Form 1099-MISC) will be issued based on the information provided.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="ssn">Social Security Number</Label>
                <Input
                  id="ssn"
                  type="password"
                  value={taxInfo.ssn}
                  onChange={(e) => handleTaxInfoChange("ssn", e.target.value)}
                  placeholder="XXX-XX-XXXX"
                />
                <p className="text-xs text-muted-foreground">Required for individuals</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID Number (EIN)</Label>
                <Input
                  id="taxId"
                  value={taxInfo.taxId}
                  onChange={(e) => handleTaxInfoChange("taxId", e.target.value)}
                  placeholder="Business Tax ID"
                />
                <p className="text-xs text-muted-foreground">Required for businesses</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="form1099Agreed" 
                checked={taxInfo.form1099Agreed}
                onCheckedChange={(checked) => handleTaxInfoChange("form1099Agreed", Boolean(checked))}
              />
              <Label htmlFor="form1099Agreed" className="text-sm">
                I understand that the information provided will be used to issue tax forms as required by law.
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Bill of Sale Generation */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Bill of Sale Generation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
              <div>
                <h4 className="font-medium">Generate Bill of Sale PDF</h4>
                <p className="text-sm text-muted-foreground">
                  Create a professional bill of sale document with all current information
                </p>
              </div>
              <Button 
                onClick={handlePrintBillOfSale} 
                variant="outline" 
                disabled={isGeneratingPDF}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                {isGeneratingPDF ? "Generating..." : "Print Bill of Sale"}
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
        {/* Document Upload */}
        <Card className="border-blue-200 bg-blue-50 w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Required Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>ID Verification *</Label>
                <Button
                  onClick={() => handleVeriffVerification()}
                  disabled={isVerifying}
                  variant="outline"
                  className={`w-full h-12 border-2 border-dashed ${
                    isVerifying
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : verificationStatus === 'approved'
                        ? "border-green-300 bg-green-50 text-green-700"
                        : documentsUploaded.idRescan 
                          ? "border-green-300 bg-green-50 text-green-700"
                          : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isVerifying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Verifying Identity...</span>
                      </>
                    ) : verificationStatus === 'approved' ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>✓ Identity Verified</span>
                      </>
                    ) : documentsUploaded.idRescan ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>✓ ID Uploaded</span>
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4" />
                        <span>Verify Identity with Veriff</span>
                      </>
                    )}
                  </div>
                </Button>
                
                {isVerifying && (
                  <div className="mt-2 p-3 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-blue-700">Verifying identity with Veriff...</span>
                    </div>
                  </div>
                )}
                
                {verificationStatus === 'approved' && (
                  <div className="mt-2 p-3 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">Identity verified successfully!</span>
                    </div>
                  </div>
                )}
                
                {renderDocumentPreview("idRescan")}
              </div>
              
              <div className="space-y-2">
                <Label>Signed Bill of Sale *</Label>
                <FileUpload
                  label={documentsUploaded.signedBillOfSale ? "✓ Bill of Sale Uploaded" : "Upload Signed Document"}
                  accept="image/*,application/pdf"
                  onUpload={(file) => handleDocumentUpload("signedBillOfSale", file)}
                  className={documentsUploaded.signedBillOfSale ? "border-green-300 bg-green-50" : ""}
                />
                {renderDocumentPreview("signedBillOfSale")}
              </div>
              
              <div className="space-y-2">
                <Label>Vehicle Title Photo *</Label>
                <FileUpload
                  label={documentsUploaded.titlePhoto ? "✓ Title Uploaded" : "Upload Title Photo"}
                  accept="image/*,application/pdf"
                  onUpload={(file) => handleDocumentUpload("titlePhoto", file)}
                  className={documentsUploaded.titlePhoto ? "border-green-300 bg-green-50" : ""}
                />
                {renderDocumentPreview("titlePhoto")}
              </div>
              
              <div className="space-y-2">
                <Label>Insurance Declaration (if applicable)</Label>
                <FileUpload
                  label={documentsUploaded.insuranceDeclaration ? "✓ Insurance Uploaded" : "Upload Insurance"}
                  accept="image/*,application/pdf"
                  onUpload={(file) => handleDocumentUpload("insuranceDeclaration", file)}
                  className={documentsUploaded.insuranceDeclaration ? "border-green-300 bg-green-50" : ""}
                />
                {renderDocumentPreview("insuranceDeclaration")}
              </div>
              
              <div className="space-y-2">
                <Label>Digital Signature *</Label>
                <FileUpload
                  label={documentsUploaded.sellerSignature ? "✓ Signature Uploaded" : "Upload Signature"}
                  accept="image/*"
                  onUpload={(file) => handleDocumentUpload("sellerSignature", file)}
                  className={documentsUploaded.sellerSignature ? "border-green-300 bg-green-50" : ""}
                />
                {renderDocumentPreview("sellerSignature")}
              </div>
              
              <div className="space-y-2">
                <Label>Additional Document (Optional)</Label>
                <FileUpload
                  label={documentsUploaded.additionalDocument ? "✓ Document Uploaded" : "Upload Document"}
                  accept="image/*,application/pdf"
                  onUpload={(file) => handleDocumentUpload("additionalDocument", file)}
                  className={documentsUploaded.additionalDocument ? "border-green-300 bg-green-50" : ""}
                />
                {renderDocumentPreview("additionalDocument")}
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Payment Status */}
      {paymentStatus === "processing" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <div>
                <h3 className="font-semibold text-blue-800">Processing Payment</h3>
                <p className="text-sm text-blue-700">ACH transfer is being processed. This may take a few moments...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
        <Button
          onClick={handleVerifyAndSubmit}
          disabled={!isFormValid || paymentStatus !== "pending" || isSubmitting}
          variant="outline"
          size="lg"
        >
          {isSubmitting ? "Saving..." : paymentStatus === "pending" ? "Verify & Submit" : "Payment Submitted"}
        </Button>

        <Button onClick={handleComplete} disabled={paymentStatus !== "completed"} size="lg" className="px-8">
          Continue to Completion
        </Button>
      </div>

      {/* Veriff Container - Hidden but required for SDK */}
      <div 
        id="veriff-container" 
        ref={veriffContainerRef}
        className="hidden"
      />
    </div>
  )
}