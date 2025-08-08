'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateContactAndGenerateOffer, getVehicleSubmission } from '@/lib/customer'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'

export default function EmailCollectionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
            <p className="text-white">Loading...</p>
          </div>
        </div>
      }
    >
      <EmailCollectionPageContent />
    </Suspense>
  )
}

function EmailCollectionPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const submissionId = searchParams.get('id')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [vehicleData, setVehicleData] = useState<any>({})

  useEffect(() => {
    if (!submissionId) {
      router.push('/offer')
      return
    }
    
    // Fetch vehicle submission data to display vehicle info
    fetchVehicleData()
  }, [submissionId, router])

  const fetchVehicleData = async () => {
    if (!submissionId) return
    
    try {
      const result = await getVehicleSubmission(submissionId)
      if (result.success && result.data) {
        setVehicleData(result.data)
        
        // Auto-populate email if it exists in the record
        if (result.data.contact?.email) {
          setEmail(result.data.contact.email)
          console.log('Auto-populated email from existing record:', result.data.contact.email)
        }
      }
    } catch (error) {
      console.error('Error fetching vehicle data:', error)
    }
  }

  const handleSubmitEmail = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    if (!submissionId) {
      toast.error('Missing submission ID')
      return
    }

    setLoading(true)
    
    try {
      console.log('Submitting email and generating offer for submission:', submissionId)
      
      const result = await updateContactAndGenerateOffer(submissionId, email)
      
      if (!result.success) {
        console.error('Failed to update contact and generate offer:', result)
        toast.error(result.error || 'Failed to generate offer')
        return
      }

      console.log('Email submitted and offer generated successfully')
      toast.success('Offer generated successfully!')
      
      // Navigate to offer page
      router.push(`/offer/display?id=${submissionId}`)
      
    } catch (error: any) {
      console.error('Error submitting email:', error)
      toast.error(error.message || 'Failed to submit email')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push(`/offer/vehicle-details?vin=${vehicleData.vinOrPlate.vin}&state=${vehicleData.basics.state}&id=${submissionId}`)
  }

  return (
    <div className="min-h-screen flex">

      {/* Left Section - Email Collection */}
      <div className="w-1/2 bg-[#a6fe54] flex flex-col justify-center items-center p-12 text-black">
        <div className="absolute top-6 left-6 z-20">
          <Button 
            variant="default" 
            size="icon" 
            onClick={() => handleBack()}
            className="bg-white hover:bg-white/80 rounded-full w-12 h-12 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 text-black" />
          </Button>
        </div>
        <div className="max-w-md w-full">
          <h1 className="text-4xl font-bold mb-6 text-center">Want to see your offer right away?</h1>
          <p className="text-lg mb-8 leading-relaxed text-center">
            {email && vehicleData.contact?.email ? 
              'We found your email address. Confirm or update it below to view your instant offer.' :
              'Enter your email to view your instant offer.'
            }
          </p>
          
          {/* Email Form */}
          <div className="bg-black rounded-3xl p-8 space-y-6">
            <div>
              <Label htmlFor="email" className="text-white text-sm font-medium mb-2 block">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={email && vehicleData.contact?.email ? 
                  "Email address (auto-filled)" : 
                  "Enter your email address"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-full bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a6fe54]"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmitEmail()
                  }
                }}
              />
              {email && vehicleData.contact?.email && (
                <p className="text-[#a6fe54] text-xs mt-2">
                  ✓ Email auto-filled from your previous submission
                </p>
              )}
            </div>

            <Button
              onClick={handleSubmitEmail}
              disabled={loading || !email.trim()}
              className={`w-full py-2 rounded-full font-semibold transition-all ${
                loading || !email.trim()
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-[#a6fe54] text-black hover:bg-[#a6fe54] shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? 'Generating Offer...' : 'Get My Instant Offer'}
            </Button>

            <p className="text-gray-400 text-xs text-center mt-4">
              We'll never spam you or share your information with third parties.
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Vehicle Summary */}
      <div className="w-1/2 bg-black text-white flex flex-col justify-center items-center p-12">
        <div className="max-w-md w-full">
          <h2 className="text-4xl font-bold mb-8 text-[#a6fe54]">YOUR VEHICLE SUMMARY</h2>
          
          {vehicleData.vinOrPlate && (
            <Card className="bg-gray-900 border-gray-700 mb-8">
              <CardHeader>
                <CardTitle className="text-[#a6fe54]">Vehicle Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Make</span>
                  <span className="text-white">{vehicleData.vinOrPlate.make || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Model</span>
                  <span className="text-white">{vehicleData.vinOrPlate.model || 'Unknown'}</span>
                </div>
                {vehicleData.vinOrPlate.year > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Year</span>
                    <span className="text-white">{vehicleData.vinOrPlate.year}</span>
                  </div>
                )}
                {vehicleData.basics?.mileage && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Mileage</span>
                    <span className="text-white">{vehicleData.basics.mileage.toLocaleString()} miles</span>
                  </div>
                )}
                {vehicleData.condition?.overallCondition && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Condition</span>
                    <span className="text-white">{vehicleData.condition.overallCondition}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}