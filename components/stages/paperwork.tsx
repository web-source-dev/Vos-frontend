"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { FileText, CreditCard, Upload, CheckCircle, X, Camera, Send, FileSignature, Info, Loader2 } from "lucide-react"
import api from '@/lib/api'
import Image from "next/image"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/utils"
import {  pdfjs } from 'react-pdf'
import dynamic from 'next/dynamic'

import { VeriffResult, VeriffSessionResponse } from '@/lib/veriff-types';
import { Customer, Vehicle, Quote } from "@/lib/types";

// Dynamically import react-signature-canvas to avoid SSR issues
const SignaturePad = dynamic(() => import('react-signature-canvas'), { 
  ssr: false,
  loading: () => <div className="w-full h-[200px] bg-gray-100 animate-pulse rounded-lg" />
});

// Add import for SignatureCanvas type
import SignatureCanvas from 'react-signature-canvas';

interface OfferDecisionData {
  finalAmount?: number
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

interface TransactionData {
  billOfSale?: BillOfSaleData
  bankDetails?: BankDetailsData
  taxInfo?: TaxInfoData
  documents?: DocumentData
  paymentStatus?: string
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
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'declined' | 'error'>('pending')
  const [isVerifying, setIsVerifying] = useState(false)
  const veriffContainerRef = useRef<HTMLDivElement>(null)
  const [documentSigned, setDocumentSigned] = useState(false)
  
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

  // New state variables for Bill of Sale signing
  const [isSendingSignRequest, setIsSendingSignRequest] = useState(false)
  const [showSignDialog, setShowSignDialog] = useState(false)

  // Add new state variables for tracking saved state and signing status
  const [formSaved, setFormSaved] = useState(false);
  const [signingSent, setSigningSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingSigning, setSendingSigning] = useState(false);

  // State for PDF preview and seller signature
  const [sellerSignature, setSellerSignature] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const signaturePadRef = useRef<SignatureCanvas | null>(null);
  
  // New state variables for direct document signing
  const [signaturePosition, setSignaturePosition] = useState({ x: 0, y: 0, pageIndex: 0 });
  const [pdfDimensions, setPdfDimensions] = useState({ width: 800, height: 1100 });
  const [currentPage, setCurrentPage] = useState(1);
  const [isSigningMode, setIsSigningMode] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Add new state variables for customer signature status
  const [customerSignatureStatus, setCustomerSignatureStatus] = useState<{
    status: string;
    signedDocumentUrl?: string;
    signedAt?: string;
  } | null>(null);

  // Add new state variables for seller signature
  const [showSellerSignDialog, setShowSellerSignDialog] = useState(false);
  const [sellerSignatureStatus, setSellerSignatureStatus] = useState<{
    status: string;
    signedDocumentUrl?: string;
    signedAt?: string;
  } | null>(null);

  // Set up PDF.js worker
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

  // Load existing paperwork data on component mount
  useEffect(() => {
    const loadExistingData = () => {
      console.log('vehicleData', vehicleData, sellerSignature, pdfUrl, signedPdfUrl, pdfContainerRef, isSigningMode, currentPage, setPdfDimensions, setSignaturePosition, signaturePreview, setCurrentPage, setIsSendingSignRequest, isGeneratingPDF)

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

      // Pre-populate bank details with current date for account opened
      const prePopulatedBankDetails = {
        accountOpenedDate: new Date().toISOString().slice(0, 7), // Current year-month
      }

      if (vehicleData.transaction?.billOfSale) {
        // Override with existing transaction data, but preserve pre-populated data for missing fields
        setBillOfSale(prev => {
          // Create a properly typed object with all properties from the existing state
          return {
            ...prev,
            ...prePopulatedBillOfSale,
            ...(vehicleData.transaction?.billOfSale || {}),
            // Ensure these fields are always populated with strings to avoid type errors
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
            // Set default values for all required properties to avoid type errors
            titleStatus: vehicleData.transaction?.billOfSale?.titleStatus || vehicleData.vehicle?.titleStatus || "clean",
            odometerReading: vehicleData.transaction?.billOfSale?.odometerReading || vehicleData.vehicle?.currentMileage || "",
            odometerAccurate: vehicleData.transaction?.billOfSale?.odometerAccurate ?? true,
          };
        });
        setHasExistingData(true)
      } else {
        // Use pre-populated data
        setBillOfSale(prev => {
          return {
            ...prev,
            ...prePopulatedBillOfSale,
            // Ensure all required fields have string values
            vehicleVIN: prePopulatedBillOfSale.vehicleVIN || "",
            vehicleYear: prePopulatedBillOfSale.vehicleYear || "",
            vehicleMake: prePopulatedBillOfSale.vehicleMake || "",
            vehicleModel: prePopulatedBillOfSale.vehicleModel || "",
            vehicleMileage: prePopulatedBillOfSale.vehicleMileage || "",
            vehicleColor: prePopulatedBillOfSale.vehicleColor || "",
            vehicleBodyStyle: prePopulatedBillOfSale.vehicleBodyStyle || "",
            titleStatus: prePopulatedBillOfSale.titleStatus || "clean",
          };
        });
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

      // If there's transaction data, set formSaved to true
      if (vehicleData.transaction) {
        setFormSaved(true);
      }

      setIsLoading(false)
    }

    loadExistingData()
  }, []);
  // Add state for tracking real-time polling
  const [pollingSigningStatus, setPollingSigningStatus] = useState(false);
  const [pollingInterval, setPollingIntervalState] = useState<NodeJS.Timeout | null>(null);

  // Initialize documentSigned state based on existing transaction data
  useEffect(() => {
    if (vehicleData.transaction?.documents?.signedBillOfSale) {
      setDocumentSigned(true);
    }
  }, []);
  // Function to stop polling for signature updates
  const stopSignaturePolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingIntervalState(null);
    }
    setPollingSigningStatus(false);
  }, [pollingInterval]);

  const checkSigningStatus = useCallback(async () => {
    try {
      const caseId = vehicleData?.id || vehicleData?._id;
      if (!caseId) return;

      const response = await api.getSigningStatusByCaseId(caseId);
      console.log('Signing status:', response);
      
      // Track if this is a newly detected signature (for notification purposes)
      const previousStatus = customerSignatureStatus?.status;
      
      if (response.success && response.data) {
        setCustomerSignatureStatus(response.data);
        
        // If document is signed by customer, update state to reflect that
        if (response.data.status === 'signed' && response.data.signedDocumentUrl) {
          setSigningSent(true);
          setFormSaved(true);
          
          // Update the documents data to include the signed bill of sale
          setDocumentPreviews(prev => ({
            ...prev,
            signedBillOfSale: response.data?.signedDocumentUrl || null
          }));
          
          // Set document signed status
          setDocumentSigned(true);
          
          // Set the signed PDF URL for seller to sign on same document
          setSignedPdfUrl(response.data.signedDocumentUrl);
          
          // Show a notification if this is a newly detected signature
          if (previousStatus !== 'signed') {
            toast({
              title: "Customer Signature Received",
              description: "The customer has signed the document. You can now add your signature.",
              duration: 5000,
            });
            
            // Stop polling since we found the signature
            stopSignaturePolling();
          }
        }
      }
    } catch (error) {
      console.error('Error checking signing status:', error);
    }
  }, [vehicleData, customerSignatureStatus, toast, stopSignaturePolling]);

  // Check for customer and seller signatures when component mounts or when vehicleData changes
  useEffect(() => {
    if (vehicleData?.id || vehicleData?._id) {
      // Check for customer signature status
      checkSigningStatus();
    }
  }, []);

  // Effect to update UI when either signature status changes
  useEffect(() => {
    // If both signatures are present, update the document signed status
    if (
      customerSignatureStatus?.status === 'signed' && 
      sellerSignatureStatus?.status === 'signed'
    ) {
      setDocumentSigned(true);
      
      // Use the most recent signed document URL (which should have both signatures)
      if (sellerSignatureStatus?.signedDocumentUrl) {
                 setDocumentPreviews(prev => ({
           ...prev,
           signedBillOfSale: sellerSignatureStatus.signedDocumentUrl || null
         }));
        
        // Set the dual-signed flag in transaction
        if ((isEstimator || isAdmin || isAgent) && vehicleData?._id) {
          const paperworkData = {
            documents: {
              ...documentPreviews,
              signedBillOfSale: sellerSignatureStatus.signedDocumentUrl,
              dualSignedBillOfSale: true
            }
          };
          
          api.savePaperworkByCaseId(vehicleData._id, paperworkData)
            .then(response => {
              if (response.success) {
                console.log('Saved dual-signed document status');
              }
            })
            .catch(error => {
              console.error('Error saving dual-signed document status:', error);
            });
        }
      }
    } 
    // If only customer has signed, update UI to reflect that
    else if (
      customerSignatureStatus?.status === 'signed' && 
      sellerSignatureStatus?.status !== 'signed'
    ) {
      // Customer has signed but seller hasn't
      setSigningSent(true);
      
      if (customerSignatureStatus.signedDocumentUrl) {
                 setDocumentPreviews(prev => ({
           ...prev,
           signedBillOfSale: customerSignatureStatus.signedDocumentUrl || null
         }));
      }
    }
  }, []);

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
          onSession: function(err: Error | null, response: VeriffSessionResponse) {
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
    setIsSubmitting(true);
    try {
      // Set payment status to 'processing' and save paperwork
      setPaymentStatus('processing');
      const paymentData = {
        billOfSale,
        bankDetails,
        taxInfo,
        documentsUploaded,
        documents: documentPreviews,
        submittedAt: new Date(),
        status: 'processing',
        paymentStatus: 'processing',
      };
      let response;
      if ((isEstimator || isAdmin || isAgent) && vehicleData._id) {
        response = await api.savePaperworkByCaseId(vehicleData._id, paymentData);
      } else if (vehicleData.quote && vehicleData.quote.accessToken && vehicleData.quote.accessToken !== '') {
        response = await api.updatePaperwork(vehicleData.quote.accessToken, JSON.stringify(paymentData));
      }
      if (response && response.success) {
        setFormSaved(true);
        if (response.data) {
          let updatedTransaction;
          if ('transaction' in response.data) {
            updatedTransaction = response.data.transaction;
          } else {
            updatedTransaction = response.data;
          }
          onUpdate({
            ...vehicleData,
            transaction: updatedTransaction as TransactionData,
          });
        }
        toast({
          title: 'Payment Submitted',
          description: 'Payment is being processed. This may take a few moments.',
        });
        // Simulate payment processing delay, then mark as completed
        setTimeout(() => {
          setPaymentStatus('completed');
          toast({
            title: 'Payment Completed',
            description: 'Payment has been completed successfully.',
          });
        }, 2000); // 2 seconds for demo
      } else {
        throw new Error(response?.error || 'Failed to submit payment');
      }
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Failed to submit payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (paymentStatus !== "completed") {
      toast({
        title: "Payment Not Processed",
        description: "Please complete payment processing before proceeding.",
        variant: "destructive",
      })
      return
    }

    try {
      // First save the current paperwork data with documents
      const completeData = {
        billOfSale,
        bankDetails,
        taxInfo,
        documentsUploaded,
        documents: documentPreviews,
        submittedAt: new Date(),
        status: "completed",
        paymentStatus: "completed"
      }

      // Save complete data
      let response;
      if ((isEstimator || isAdmin || isAgent) && vehicleData.id) {
        response = await api.savePaperworkByCaseId(vehicleData.id, completeData);
      } else if (vehicleData.quote && vehicleData.quote.accessToken && vehicleData.quote.accessToken !== '') {
        response = await api.updatePaperwork(vehicleData.quote.accessToken, JSON.stringify(completeData));
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


  // Function to start polling for signature updates
  const startSignaturePolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Only start polling if we're not already doing so
    if (!pollingSigningStatus) {
      setPollingSigningStatus(true);
      
      // Check every 5 seconds for updates
      const interval = setInterval(() => {
        checkSigningStatus();
      }, 5000);
      
      setPollingIntervalState(interval);
      
      // Add console log for debugging
      console.log('Started polling for signature updates');
    }
  }, [pollingInterval, pollingSigningStatus, checkSigningStatus]);


  // Start polling when signing request is sent, stop when document is signed
  useEffect(() => {
    // Start polling when signing request is sent
    if (signingSent && !documentSigned) {
      startSignaturePolling();
    }
    
    // Stop polling when document is signed
    if (documentSigned && pollingSigningStatus) {
      stopSignaturePolling();
    }
    
    // Clean up on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  const handleSendSigningRequest = async () => {
    if (!formSaved) {
      toast({
        title: 'Data not saved',
        description: 'Please save your data before sending the signing request.',
        variant: 'destructive'
      });
      return;
    }
    
    if (!vehicleData.customer?.email1) {
      toast({
        title: "Missing customer email",
        description: "Customer email is required to send a signing request",
        variant: "destructive"
      })
      return
    }

    setSendingSigning(true)
    
    try {
      const caseId = vehicleData?.id || vehicleData?._id;
      if (!caseId) {
        throw new Error('Case ID is required');
      }
      
      // Prepare signing data
      const signingData = {
        recipientEmail: vehicleData.customer.email1,
        recipientName: `${vehicleData.customer.firstName} ${vehicleData.customer.lastName}`,
        documentType: 'bill-of-sale',
        signDirectlyOnDocument: true  // Flag to enable direct document signing
      };
      
      // Send the signing request
      const response = await api.createBillOfSaleSigningRequest(caseId, signingData);
      
      if (response.success && response.data) {
        setSigningSent(true);
        toast({
          title: 'Success!',
          description: `Signing request sent to ${signingData.recipientEmail}`,
        });
        
        // Start polling for signature status updates
        startSignaturePolling();
        
      } else {
        throw new Error(response.error || 'Failed to send signing request');
      }
    } catch (error) {
      console.error('Error sending signing request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send signing request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSendingSigning(false);
    }
  }


  const handleSaveData = async () => {
    try {
      setSaving(true);
      
      // Save only the basic paperwork data without documents or payment status
      const paperworkData = {
        billOfSale,
        bankDetails,
        taxInfo,
        submittedAt: new Date(),
        // Do NOT set status or paymentStatus here
      }

      console.log(vehicleData);
      // Save to database
      let response;
      if ((isEstimator || isAdmin || isAgent)  && vehicleData._id) {
        response = await api.savePaperworkByCaseId(vehicleData._id, paperworkData);
      } else if (vehicleData.quote && vehicleData.quote.accessToken && vehicleData.quote.accessToken !== '') {
        response = await api.updatePaperwork(vehicleData.quote.accessToken, JSON.stringify(paperworkData));
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

  // Load Bill of Sale PDF (signed or unsigned)
  useEffect(() => {
    // Prefer signed document if available
    if (documentPreviews.signedBillOfSale) {
      setSignedPdfUrl(documentPreviews.signedBillOfSale);
    } else if (vehicleData.id || vehicleData._id) {
      // Generate unsigned Bill of Sale PDF for preview
      const caseId = vehicleData.id || vehicleData._id;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      setPdfUrl(`${baseUrl}/api/cases/${caseId}/bill-of-sale`);
    }
  }, []);
  
  // Handler for seller signature save
  const handleSellerSignatureSave = async () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const dataUrl = signaturePadRef.current.getTrimmedCanvas().toDataURL('image/png');
      setSellerSignature(dataUrl);
      setSignaturePreview(dataUrl);
      setIsSigningMode(false);
      
      const caseId = vehicleData.id || vehicleData._id;
      if (!caseId) {
        toast({
          title: "Error",
          description: "Case ID not found",
          variant: "destructive"
        });
        return;
      }
      
      try {
        // Send the signature data to the backend for embedding in the PDF
        const signatureData = {
          signatureImage: dataUrl,
          signaturePosition: {
            x: signaturePosition.x / pdfDimensions.width,  // Normalize to 0-1 range
            y: signaturePosition.y / pdfDimensions.height, // Normalize to 0-1 range
            page: signaturePosition.pageIndex
          },
          signerType: 'seller' as const, // Use 'as const' instead of 'as seller'
          useCustomerSignedDocument: Boolean(customerSignatureStatus?.signedDocumentUrl) // Specify that we want to sign the customer-signed document
        };
        
        const response = await api.addSignatureToPdf(caseId.toString(), signatureData);
        
        if (response.success && response.data?.documentUrl) {
          // Update the document preview with the newly dual-signed document
          setSignedPdfUrl(response.data.documentUrl);
          setDocumentPreviews(prev => ({
            ...prev,
            signedBillOfSale: response.data?.documentUrl || ''
          }));
          
          // Update seller signature status
          setSellerSignatureStatus({
            status: 'signed',
            signedDocumentUrl: response.data.documentUrl,
            signedAt: new Date().toISOString()
          });
          
          // Make sure we update transaction data to include the dual-signed document
          const paperworkData = {
            documents: {
              ...documentPreviews,
              signedBillOfSale: response.data.documentUrl,
              dualSignedBillOfSale: true // Add a flag to indicate both signatures are present
            }
          };
          
          // Save the updated document to the transaction
          let saveResponse;
          if ((isEstimator || isAdmin || isAgent) && vehicleData._id) {
            saveResponse = await api.savePaperworkByCaseId(vehicleData._id, paperworkData);
            
            if (saveResponse.success) {
              // Update the case data with the updated transaction
              onUpdate({
                ...vehicleData,
                transaction: {
                  ...vehicleData.transaction,
                  documents: {
                    ...vehicleData.transaction?.documents,
                    signedBillOfSale: response.data.documentUrl,
                    dualSignedBillOfSale: 'true'
                  }
                }
              });
            }
          }
          
          toast({
            title: "Success",
            description: "Seller signature added to document successfully"
          });
          
          // Close the signature dialog
          setShowSellerSignDialog(false);
        } else {
          throw new Error(response.error || "Failed to add signature to document");
        }
      } catch (error) {
        console.error("Error adding signature to document:", error);
        toast({
          title: "Error",
          description: "Failed to add signature to document. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Empty Signature",
        description: "Please sign before saving",
        variant: "destructive"
      });
    }
  };

  // Handler to clear seller signature
  const handleSellerSignClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };
  // Handle starting seller document signing
  const startSellerSigning = () => {
    // If customer has signed, ensure we're using the customer-signed document
    if (customerSignatureStatus?.signedDocumentUrl) {
      setSignedPdfUrl(customerSignatureStatus.signedDocumentUrl);
    }
    
    setShowSellerSignDialog(true);
    setSignaturePreview(null);
    setIsSigningMode(true);
  };

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
        </div>
      </div>

      {/* Signing Dialog */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Bill of Sale for Signing</DialogTitle>
            <DialogDescription>
              An email will be sent to the customer with a link to view and sign the Bill of Sale document.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <Input 
                id="recipient"
                value={`${vehicleData.customer?.firstName || ''} ${vehicleData.customer?.lastName || ''}`}
                disabled
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                value={vehicleData.customer?.email1 || ''}
                disabled
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vehicle">Vehicle</Label>
              <Input 
                id="vehicle"
                value={`${vehicleData.vehicle?.year || ''} ${vehicleData.vehicle?.make || ''} ${vehicleData.vehicle?.model || ''}`}
                disabled
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendSigningRequest}
              disabled={isSendingSignRequest || !vehicleData.customer?.email1}
            >
              {isSendingSignRequest ? "Sending..." : "Send Signing Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              
              <div className="space-y-2 flex flex-col justify-center">
                <Label>Signed Bill of Sale *</Label>
                <Button onClick={handlePrintBillOfSale} className="w-full">Print Bill of Sale</Button>
                {renderDocumentPreview("signedBillOfSale")}
              </div>
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
        <Button
          onClick={handleVerifyAndSubmit}
          variant="outline"
          size="lg"
          disabled={isSubmitting || paymentStatus === "processing"}
        >
          {isSubmitting ? "Saving..." : paymentStatus === "pending" ? "Verify & Submit" : "Payment Submitted"}
        </Button>

        <Button onClick={handleComplete} size="lg" className="px-8">
          Continue to Completion
        </Button>
      </div>

      {/* Veriff Container - Hidden but required for SDK */}
      <div 
        id="veriff-container" 
        ref={veriffContainerRef}
        className="hidden"
      />

      {/* Add Seller Signature Dialog */}
      <Dialog open={showSellerSignDialog} onOpenChange={setShowSellerSignDialog}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Add Seller Signature</DialogTitle>
            <DialogDescription>
              Please sign in the designated area below
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="relative border rounded-lg p-4">
              <SignaturePad
                canvasProps={{
                  className: "border rounded-lg w-full h-[200px]",
                  style: { 
                    width: '100%', 
                    height: '200px',
                    backgroundColor: '#fff'
                  }
                }}
                ref={signaturePadRef}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleSellerSignClear}>
                Clear
              </Button>
              <Button onClick={handleSellerSignatureSave}>
                Save Signature
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Signature Status Display */}
      <Card>
        <CardHeader>
          <CardTitle>Document Signatures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Customer Signature Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Customer Signature</h4>
                <p className="text-sm text-muted-foreground">
                  {customerSignatureStatus?.status === 'signed' 
                    ? `Signed on ${formatDate(customerSignatureStatus.signedAt)}` 
                    : 'Pending customer signature'}
                </p>
              </div>
              {customerSignatureStatus?.status !== 'signed' && (
                <Button
                  onClick={() => setShowSignDialog(true)}
                  variant="outline"
                  disabled={sendingSigning}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendingSigning ? "Sending..." : "Send for Signing"}
                </Button>
              )}
            </div>

            {/* Customer Signature Received Banner */}
            {customerSignatureStatus?.status === 'signed' && sellerSignatureStatus?.status !== 'signed' && (
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                <div className="flex items-center">
                  <Info className="h-5 w-5 text-blue-500 mr-2" />
                  <div>
                    <h4 className="font-medium text-blue-800">Customer Signature Received!</h4>
                    <p className="text-sm text-blue-700">
                      The customer has signed the document. Please add your signature to the same document to complete the process.
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <Button
                    onClick={startSellerSigning}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    size="sm"
                  >
                    <FileSignature className="h-4 w-4 mr-2" />
                    Sign Document Now
                  </Button>
                </div>
              </div>
            )}

            {/* Seller Signature Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Seller Signature</h4>
                <p className="text-sm text-muted-foreground">
                  {sellerSignatureStatus?.status === 'signed' 
                    ? `Signed on ${formatDate(sellerSignatureStatus.signedAt)}` 
                    : 'Pending seller signature'}
                </p>
              </div>
              {customerSignatureStatus?.status === 'signed' && sellerSignatureStatus?.status !== 'signed' && (
                <Button
                  onClick={startSellerSigning}
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <FileSignature className="h-4 w-4 mr-2" />
                  Sign as Seller
                </Button>
              )}
              {customerSignatureStatus?.status !== 'signed' && sellerSignatureStatus?.status !== 'signed' && (
                <Button
                  onClick={startSellerSigning}
                  variant="outline"
                >
                  <FileSignature className="h-4 w-4 mr-2" />
                  Sign as Seller
                </Button>
              )}
            </div>

            {/* Document Preview */}
            {(customerSignatureStatus?.signedDocumentUrl || sellerSignatureStatus?.signedDocumentUrl) && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Signed Document Preview</h4>
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    src={sellerSignatureStatus?.signedDocumentUrl || customerSignatureStatus?.signedDocumentUrl}
                    className="w-full h-[500px]"
                    title="Signed Bill of Sale"
                  />
                </div>
                
                {/* Show dual signature status if both have signed */}
                {sellerSignatureStatus?.status === 'signed' && customerSignatureStatus?.status === 'signed' && (
                  <div className="mt-2 p-3 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-700">
                        Document has been signed by both parties
                      </span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      This document contains both customer and seller signatures and is legally complete.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </>
      )}
    </div>
  )
}