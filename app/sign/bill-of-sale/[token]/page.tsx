"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Document, Page, pdfjs } from 'react-pdf'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { CheckCircle, FileText, Loader2, RefreshCw } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import Image from 'next/image'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`

// Dynamically import react-signature-canvas to avoid SSR issues
const SignaturePad = dynamic(() => import('react-signature-canvas'), { ssr: false })

// Add these interfaces at the top of the file, after imports
interface SigningSessionData {
  session: {
    id: string;
    token: string;
    status: string;
    documentType: string;
    expiresAt: string;
    createdAt: string;
  };
  recipient: {
    name: string;
    email: string;
  };
  case: {
    id: string;
    customer: {
      firstName: string;
      lastName: string;
    };
    vehicle: {
      year: string;
      make: string;
      model: string;
      vin?: string;
    };
  };
  documentUrl: string | null;
}

interface PDFPageProxy {
  view: {
    width: number;
    height: number;
  };
}

export default function BillOfSaleSigningPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [sessionData, setSessionData] = useState<SigningSessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)

  // State variables for direct document signing
  const [pdfDimensions, setPdfDimensions] = useState({ width: 800, height: 1100 })
  const [numPages, setNumPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [isSigningMode, setIsSigningMode] = useState(false)
  const [signaturePosition, setSignaturePosition] = useState({ x: 0, y: 0, pageIndex: 0 })
  const pdfContainerRef = useRef<HTMLDivElement>(null)
  const signaturePadRef = useRef<SignatureCanvas>(null)

  const token = params.token

  // Load signing session data
  const loadSigningSession = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.getSigningSession(token)
      
      if (response.success && response.data) {
        setSessionData(response.data)
        
        // Set document URL if available
        if (response.data.documentUrl) {
          setDocumentUrl(response.data.documentUrl)
        } else {
          // If no document URL in the signing session, generate one from the case
          const caseId = response.data.case?.id
          if (caseId) {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
            setDocumentUrl(`${baseUrl}/api/cases/${caseId}/bill-of-sale`)
          }
        }
      } else {
        setError(response.error || 'Failed to load signing session')
      }
    } catch (error) {
      console.error('Error loading signing session:', error)
      setError('Error loading signing session')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadSigningSession()
  }, [token, loadSigningSession])
  
  // Handler for PDF document load success
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }
  
  // Handler for page load success
  const onPageLoadSuccess = (page: PDFPageProxy) => {
    const { width, height } = page.view
    setPdfDimensions({
      width: width,
      height: height
    })
  }
  
  // Handler for clicking on the document to place signature
  const handleDocumentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSigningMode || !pdfContainerRef.current) return
    
    const rect = pdfContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Set the signature position (adjust for canvas position)
    setSignaturePosition({
      x: x - 150, // Center the signature pad horizontally
      y: y - 75,  // Position above click point for better visibility
      pageIndex: currentPage - 1
    })
  }

  // Handle save signature action
  const handleSaveSignature = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const dataUrl = signaturePadRef.current.getTrimmedCanvas().toDataURL('image/png')
      setSignature(dataUrl)
      setIsSigningMode(false)
    } else {
      setError('Please draw your signature before saving')
    }
  }
  
  // Handle clear signature
  const handleClearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear()
    }
  }

  // Handle sign document action
  const handleSignDocument = async () => {
    if (!signature) {
      setError('Please draw your signature before submitting')
      return
    }
    
    if (!sessionData?.case?.id) {
      setError('Case data not found')
      return
    }

    setSubmitting(true)
    
    try {
      // Submit signature as embedded in the document
      const signatureData = {
        signature: signature,
        signedAt: new Date().toISOString(),
        position: {
          x: signaturePosition.x / pdfDimensions.width,  // Normalize to 0-1 range
          y: signaturePosition.y / pdfDimensions.height, // Normalize to 0-1 range
          page: signaturePosition.pageIndex
        },
        signerType: 'customer'
      }
      
      const response = await api.submitSignedDocument(token, signatureData)
      
      if (response.success && response.data) {
        setSuccess(true)
        // Update the document URL to the signed version
        if (response.data.signedDocumentUrl) {
          setDocumentUrl(response.data.signedDocumentUrl)
        }
        // Redirect to success page or show success state
        setTimeout(() => {
          router.push(`/sign/bill-of-sale/${token}/thank-you`)
        }, 3000)
      } else {
        throw new Error(response.error || 'Failed to submit signature')
      }
    } catch (error) {
      console.error('Error submitting signature:', error)
      setError('Failed to submit signature. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle download document action
  const handleDownloadDocument = () => {
    if (documentUrl) {
      const link = document.createElement('a')
      link.href = documentUrl
      link.download = 'bill-of-sale.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
  
  // Start signing mode
  const startSigning = () => {
    setIsSigningMode(true)
    setSignature(null)
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center p-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
              <p>Loading bill of sale signing page...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={loadSigningSession}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center">
              <CheckCircle className="mr-2 h-6 w-6" />
              Bill of Sale Signed Successfully
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Thank you for signing the bill of sale. Redirecting to confirmation page...</p>
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign Bill of Sale</CardTitle>
          <CardDescription>
            Please review and sign the bill of sale for your {sessionData?.case?.vehicle?.year}{' '}
            {sessionData?.case?.vehicle?.make} {sessionData?.case?.vehicle?.model}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {/* Bill of sale document viewer */}
            <div 
              className="relative border rounded-lg overflow-hidden" 
              style={{ height: 600 }}
              ref={pdfContainerRef}
              onClick={handleDocumentClick}
            >
              {documentUrl ? (
                <Document
                  file={documentUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={<div className="flex items-center justify-center h-full">Loading PDF...</div>}
                  error={<div className="text-red-500">Failed to load PDF.</div>}
                >
                  <Page 
                    pageNumber={currentPage} 
                    width={800}
                    onLoadSuccess={onPageLoadSuccess}
                  />
                </Document>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p>No document available</p>
                </div>
              )}
              
              {/* Page navigation controls */}
              {numPages > 1 && (
                <div className="absolute bottom-0 left-0 right-0 flex justify-center p-2 bg-white/80">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {numPages}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, numPages))}
                      disabled={currentPage >= numPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Signature canvas overlay when in signing mode */}
              {isSigningMode && (
                <div 
                  className="absolute" 
                  style={{ 
                    top: signaturePosition.y,
                    left: signaturePosition.x,
                    zIndex: 10
                  }}
                >
                  <div className="bg-white/80 p-2 border rounded shadow-lg">
                    <div className="text-xs mb-1 font-medium text-gray-700">Draw your signature below:</div>
                    <div className="w-[300px] h-[150px]">
                      <SignaturePad
                        ref={signaturePadRef}
                        penColor="black"
                        canvasProps={{
                          width: 300,
                          height: 150,
                          className: 'border rounded bg-white'
                        }}
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" onClick={handleClearSignature}>
                        Clear
                      </Button>
                      <Button size="sm" onClick={handleSaveSignature}>
                        Save Signature
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsSigningMode(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Signature preview when available */}
              {signature && !isSigningMode && (
                <div 
                  className="absolute" 
                  style={{ 
                    top: signaturePosition.y,
                    left: signaturePosition.x,
                    zIndex: 5
                  }}
                >
                  <Image 
                    src={signature} 
                    alt="Signature" 
                    style={{ 
                      maxWidth: '300px', 
                      maxHeight: '150px'
                    }} 
                    className="opacity-80"
                    width={300}
                    height={150}
                  />
                </div>
              )}
            </div>

            {/* Instructions and actions */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Instructions:</h3>
              <ol className="list-decimal pl-5 space-y-2 mb-4">
                <li>Review the bill of sale document carefully</li>
                <li>Click the &quot;Sign Document&quot; button below</li>
                <li>Click where you want your signature to appear on the document</li>
                <li>Draw your signature in the signature pad</li>
                <li>Click &quot;Save Signature&quot; when satisfied with your signature</li>
                <li>Click &quot;Submit Signature&quot; to complete the process</li>
              </ol>

              <div className="flex flex-wrap gap-2 mt-4">
                {!signature ? (
                  <Button 
                    variant="default" 
                    onClick={startSigning}
                    disabled={isSigningMode}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Sign Document
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={startSigning}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Redraw Signature
                    </Button>
                    <Button 
                      variant="default" 
                      onClick={handleSignDocument}
                      disabled={submitting}
                      className="flex items-center gap-2"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {submitting ? "Submitting..." : "Submit Signature"}
                    </Button>
                  </>
                )}
                <Button 
                  variant="outline" 
                  onClick={handleDownloadDocument}
                  disabled={!documentUrl}
                >
                  Download Document
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-4">
          <div>
            <p className="text-sm text-gray-500">
              By signing this document, you acknowledge that you have read and agree to the terms of the Bill of Sale.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 