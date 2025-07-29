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
import { FileText, CreditCard, Upload, CheckCircle, X, Loader2, Clock, Info, AlertTriangle } from "lucide-react"
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

export function Paperwork({ vehicleData, onUpdate, onComplete, isAdmin = false, isAgent = false, isEstimator = false }: PaperworkProps) {
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



  const [paymentStatus, setPaymentStatus] = useState("pending") // pending, processing, completed

  const [isLoading, setIsLoading] = useState(true)
  const [hasExistingData, setHasExistingData] = useState(false)
  const { toast } = useToast()

  // Add new state variables for tracking saved state
  const [formSaved, setFormSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState<string>("Wire");

  // Add bank details state
  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    loanNumber: "",
    payoffAmount: 0
  });

  // Add payoff confirmation state
  const [payoffStatus, setPayoffStatus] = useState<'pending' | 'confirmed' | 'completed' | 'not_required'>('not_required');
  const [payoffNotes, setPayoffNotes] = useState<string>('');


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
        salePrice: vehicleData.quote?.offerAmount || vehicleData.offerDecision?.finalAmount || 0,
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

      // Initialize bank details from existing transaction data
      if (vehicleData.transaction?.bankDetails) {
        setBankDetails({
          bankName: vehicleData.transaction.bankDetails.bankName || "",
          loanNumber: vehicleData.transaction.bankDetails.loanNumber || "",
          payoffAmount: vehicleData.transaction.bankDetails.payoffAmount || 0
        });
      }

      // Initialize payoff notes from existing transaction data
      if (vehicleData.transaction?.payoffNotes) {
        setPayoffNotes(vehicleData.transaction.payoffNotes);
      }

      // Initialize preferred payment method from existing transaction data
      if (vehicleData.transaction?.preferredPaymentMethod) {
        setPreferredPaymentMethod(vehicleData.transaction.preferredPaymentMethod);
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



  const handleBillOfSaleChange = (field: string, value: string | boolean | number) => {
    setBillOfSale((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleBankDetailsChange = (field: string, value: string | number) => {
    setBankDetails((prev) => ({
      ...prev,
      [field]: value,
    }))
  }







  const handleComplete = async () => {
    // This function now handles both payoff status saving and completion
    try {
      // First, save the payoff status data
      const payoffCaseId = vehicleData.id || vehicleData._id;
      if (payoffCaseId) {
        try {
          const payoffResponse = await api.confirmPayoff(payoffCaseId, payoffStatus, payoffNotes);
          if (payoffResponse && payoffResponse.success && payoffResponse.data) {
            // Update case data with updated transaction
            onUpdate({
              ...vehicleData,
              transaction: payoffResponse.data.transaction as TransactionData
            });
          }
        } catch (error) {
          console.error('Error saving payoff status:', error);
          // Continue with completion even if payoff save fails
        }
      }

      const completeData = {
        billOfSale,
        bankDetails,
        preferredPaymentMethod,
        payoffStatus,
        payoffNotes,
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

      // Update stage statuses to mark stage 5 as complete
      const currentStageStatuses = vehicleData.stageStatuses || {};
      const stageData = {
        currentStage: vehicleData.currentStage || 6, // Preserve current stage or default to 6
        stageStatuses: {
          ...currentStageStatuses,
          5: 'complete' // Mark stage 5 (Paperwork) as complete
        }
      };

      // Update stage statuses in the database
      const stageCaseId = vehicleData.id || vehicleData._id;
      if (stageCaseId) {
        try {
          await api.updateCaseStageByCaseId(stageCaseId, stageData);
          console.log('Successfully updated stage statuses');
        } catch (error) {
          console.error('Failed to update stage statuses:', error);
        }
      }

      // Send stage time data to API
      if (stageCaseId && timer.startTime) {
        try {
          const endTime = new Date();
          await api.updateStageTime(stageCaseId, 'paperwork', timer.startTime, endTime);
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

      // First, save the payoff status data
      const payoffCaseId = vehicleData.id || vehicleData._id;
      if (payoffCaseId) {
        try {
          const payoffResponse = await api.confirmPayoff(payoffCaseId, payoffStatus, payoffNotes);
          if (payoffResponse && payoffResponse.success && payoffResponse.data) {
            // Update case data with updated transaction
            onUpdate({
              ...vehicleData,
              transaction: payoffResponse.data.transaction as TransactionData
            });
          }
        } catch (error) {
          console.error('Error saving payoff status:', error);
          // Continue with save even if payoff save fails
        }
      }

      // Save only the basic paperwork data without documents or payment status
      const paperworkData = {
        billOfSale,
        bankDetails,
        preferredPaymentMethod,
        payoffStatus,
        payoffNotes,
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
        const currentStageStatuses = vehicleData.stageStatuses || {};
        const stageData = {
          currentStage: 5,
          stageStatuses: {
            ...currentStageStatuses,
            5: 'active'
          }
        };
  
        // Update stage statuses in the database
        const stageCaseId = vehicleData.id || vehicleData._id;
        if (stageCaseId) {
          try {
            await api.updateCaseStageByCaseId(stageCaseId, stageData);
            console.log('Successfully updated stage statuses');
          } catch (error) {
            console.error('Failed to update stage statuses:', error);
          }
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

          <Badge variant="outline" className="flex items-center gap-1 hidden">
            <Clock className="h-3 w-3" />
            {timer.elapsedFormatted}
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

      <div className="grid gap-6 lg:grid-cols-1">

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
                <Label htmlFor="saleDate">Date *</Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={billOfSale.saleDate}
                  onChange={(e) => handleBillOfSaleChange("saleDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saleTime">Time</Label>
                <Input
                  id="saleTime"
                  type="time"
                  value={billOfSale.saleTime}
                  onChange={(e) => handleBillOfSaleChange("saleTime", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salePrice">Vehicle Price *</Label>
              <Input
                id="salePrice"
                type="number"
                value={billOfSale.salePrice}
                onChange={(e) => handleBillOfSaleChange("salePrice", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                disabled={true}
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2 hidden">
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
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 hidden">
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
                value={bankDetails.bankName}
                onChange={(e) => handleBankDetailsChange("bankName", e.target.value)}
                placeholder="Enter bank name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanNumber">Loan Number</Label>
              <Input
                id="loanNumber"
                value={bankDetails.loanNumber}
                onChange={(e) => handleBankDetailsChange("loanNumber", e.target.value)}
                placeholder="Enter loan number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payoffAmount">Payoff Amount</Label>
              <Input
                id="payoffAmount"
                type="number"
                value={bankDetails.payoffAmount || ""}
                onChange={(e) => handleBankDetailsChange("payoffAmount", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </CardContent>
        </Card>

      </div>


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
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>



          {/* Show message when button is disabled */}
          {(payoffStatus === 'pending' || payoffStatus === 'confirmed') && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-800">Transaction Not Complete</h3>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                {payoffStatus === 'pending' 
                  ? "The payoff is still pending. Please wait for bank contact and confirmation before proceeding to completion."
                  : "The payoff has been confirmed with the bank but is still pending finalization. Please wait for the payoff to be completed before proceeding to completion."
                }
              </p>
            </div>
          )}
          <div className="flex justify-end gap-4">

            <Button
              onClick={handleSaveData}
              disabled={saving}
              variant="outline"
              className="border-gray-300 lg px-8"
              size="lg"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              onClick={handleComplete}
              size="lg"
              className="px-8"
              disabled={payoffStatus === 'pending' || payoffStatus === 'confirmed'}
            >
              Continue to Completion
            </Button>
          </div>

        </>
      )}
    </div>
  )
}