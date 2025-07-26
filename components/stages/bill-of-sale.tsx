"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { FileText, Clock, Download, Upload, Loader2, CheckCircle, X } from "lucide-react"
import api from '@/lib/api'

import Image from "next/image"

// TypeScript interfaces for bill of sale data
interface CustomerData {
  firstName?: string
  lastName?: string
}

interface VehicleData {
  year?: string
  make?: string
  model?: string
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

interface CaseData {
  id?: string
  _id?: string
  customer?: CustomerData
  vehicle?: VehicleData
  quote?: {
    offerAmount?: number
  }
  transaction?: {
    billOfSale?: BillOfSaleData
    documents?: {
      signedBillOfSale?: string | null
    }
  } | string
  stageStatuses?: { [key: number]: string }
  currentStage?: number
}

interface BillOfSaleProps {
  vehicleData: CaseData
  onUpdate: (data: CaseData) => void
  onComplete: () => void
  isEstimator?: boolean
}

export function BillOfSale({ vehicleData, onUpdate, onComplete, isEstimator = false }: BillOfSaleProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [signedBillOfSaleUploaded, setSignedBillOfSaleUploaded] = useState(false)
  const [documentPreview, setDocumentPreview] = useState<string | null>(null)
  const { toast } = useToast()
  


  // Check if signed bill of sale is already uploaded
  useEffect(() => {
    if (typeof vehicleData.transaction === 'object' && vehicleData.transaction?.documents?.signedBillOfSale) {
      setSignedBillOfSaleUploaded(true);
      setDocumentPreview(vehicleData.transaction.documents.signedBillOfSale);
    }
  }, [vehicleData.transaction]);

  const handleDownloadBillOfSale = async () => {
    try {
      setIsGeneratingPDF(true);
      
      const caseId = vehicleData.id || vehicleData._id;
      if (!caseId) {
        throw new Error("Case ID not found");
      }

      // Generate Bill of Sale PDF
      const pdfBlob = await api.generateBillOfSalePDF(caseId);
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bill-of-sale-${caseId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Bill of Sale Downloaded",
        description: "Bill of Sale PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating bill of sale:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleUploadSignedBillOfSale = async (file: File) => {
    try {
      setIsUploading(true);
      
      const caseId = vehicleData.id || vehicleData._id;
      if (!caseId) {
        throw new Error("Case ID not found");
      }

      // Upload the signed document using the new API
      const response = await api.uploadBillOfSaleDocument(caseId, file);
      
      if (response.success && response.data) {
        // Update document preview
        setDocumentPreview(response.data?.path || '');
        setSignedBillOfSaleUploaded(true);

        // Update case data with the uploaded document and transaction
        const updatedTransaction = typeof vehicleData.transaction === 'object' ? {
          ...vehicleData.transaction,
          documents: {
            ...vehicleData.transaction.documents,
            signedBillOfSale: response.data?.path || ''
          }
        } : {
          documents: {
            signedBillOfSale: response.data?.path || ''
          }
        };

        onUpdate({
          ...vehicleData,
          transaction: updatedTransaction
        });

        toast({
          title: "Document Uploaded",
          description: "Signed bill of sale uploaded successfully.",
        });
      } else {
        throw new Error(response.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload document. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeSignedBillOfSale = () => {
    setSignedBillOfSaleUploaded(false);
    setDocumentPreview(null);
    
    // Update case data to remove the document
    const updatedTransaction = typeof vehicleData.transaction === 'object' ? {
      ...vehicleData.transaction,
      documents: {
        ...vehicleData.transaction.documents,
        signedBillOfSale: null
      }
    } : {
      documents: {
        signedBillOfSale: null
      }
    };

    onUpdate({
      ...vehicleData,
      transaction: updatedTransaction
    });
  };

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);
      
      const caseId = vehicleData.id || vehicleData._id;
      if (!caseId) throw new Error("Case ID not found");

      // Update stage statuses to mark this stage as complete
      const currentStageStatuses = vehicleData.stageStatuses || {};
      const stageData = {
        currentStage: vehicleData.currentStage || 5, // Preserve current stage or default to 5
        stageStatuses: {
          ...currentStageStatuses,
          4: 'complete' // Mark three-step process stage as complete
        }
      };
      
      // Update stage statuses in the database
      try {
        await api.updateCaseStageByCaseId(caseId, stageData);
        console.log('Successfully updated stage statuses');
      } catch (error) {
        console.error('Failed to update stage statuses:', error);
      }
      
      onComplete();
      toast({
        title: "Bill of Sale Complete",
        description: "Bill of sale stage completed successfully.",
      });
    } catch (error) {
      console.error('Error completing bill of sale:', error);
      const errorData = api.handleError(error);
      toast({
        title: "Error",
        description: errorData.error,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDocumentPreview = () => {
    if (!signedBillOfSaleUploaded || !documentPreview) return null;

    const isImage = documentPreview.toLowerCase().includes('.jpg') || 
                   documentPreview.toLowerCase().includes('.jpeg') || 
                   documentPreview.toLowerCase().includes('.png');
    
    return (
      <div className="mt-4 p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Signed Bill of Sale</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeSignedBillOfSale}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {isImage ? (
          <Image 
            src={documentPreview} 
            alt="Signed bill of sale preview"
            width={400}
            height={200}
            className="w-full h-48 object-cover rounded border"
            onError={(e) => {
              console.error('Image failed to load:', documentPreview);
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        
        {!isImage && (
          <div className="flex items-center justify-center h-48 bg-white border rounded">
            <FileText className="h-12 w-12 text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Document uploaded</span> 
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bill of Sale</h1>
          <p className="text-muted-foreground">
            {isEstimator ? "Generate and upload signed bill of sale" : "Download and upload signed bill of sale"}
          </p>
        </div>
        <div className="flex items-center gap-4">

          <Badge className="bg-blue-100 text-blue-800">Bill of Sale</Badge>
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
              <span className="font-medium">Vehicle:</span> {vehicleData.vehicle?.year} {vehicleData.vehicle?.make} {vehicleData.vehicle?.model}
            </div>
            <div>
              <span className="font-medium">VIN:</span> {(vehicleData.vehicle as any)?.vin || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">Sale Price:</span>
              <span className="text-green-600 font-semibold ml-1">
                ${(vehicleData.quote?.offerAmount || (typeof vehicleData.transaction === 'object' ? vehicleData.transaction?.billOfSale?.salePrice : 0) || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bill of Sale Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bill of Sale Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Download Section */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Step 1: Download Bill of Sale</h3>
              <p className="text-sm text-gray-600 mb-4">
                Generate and download the bill of sale document for the customer to sign.
              </p>
              <Button 
                onClick={handleDownloadBillOfSale} 
                disabled={isGeneratingPDF}
                className="flex items-center gap-2"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download Bill of Sale
                  </>
                )}
              </Button>
            </div>

            {/* Upload Section */}
            <div className="pt-4 border-t">
              <h3 className="font-semibold text-lg mb-2">Step 2: Upload Signed Bill of Sale</h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload the signed bill of sale document once the customer has completed it.
              </p>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadSignedBillOfSale(file);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center gap-2"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload Signed Bill of Sale
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Document Preview */}
            {renderDocumentPreview()}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button 
              onClick={handleComplete} 
              disabled={isSubmitting || !signedBillOfSaleUploaded}
              className="px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Bill of Sale
                </>
              )}
            </Button>
          </div>

          {!signedBillOfSaleUploaded && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Please upload the signed bill of sale document to proceed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 