'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { getVehicleSubmission, checkUserExists } from '@/lib/customer'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { 
  Lock, 
  Smartphone, 
  Calendar, 
  CheckCircle, 
  ArrowLeft, 
  Car, 
  Shield, 
  Clock, 
  DollarSign,
  Sparkles,
  Award,
  Zap,
  Star,
  TrendingUp
} from 'lucide-react'
import AuthPopup from '@/components/customer/AuthPopup'
import MobilePopup from '@/components/customer/MobilePopup'

export default function OfferDisplayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
            <p className="text-white">Loading your offer...</p>
          </div>
        </div>
      }
    >
      <OfferDisplayPageContent />
    </Suspense>
  )
}

function OfferDisplayPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  
  const submissionId = searchParams.get('id')
  const [loading, setLoading] = useState(true)
  const [vehicleData, setVehicleData] = useState<any>({})
  const [daysRemaining, setDaysRemaining] = useState(7)
  const [showAuthPopup, setShowAuthPopup] = useState(false)
  const [showMobilePopup, setShowMobilePopup] = useState(false)
  const [userExists, setUserExists] = useState(false)

  useEffect(() => {
    if (!submissionId) {
      router.push('/offer')
      return
    }
    
    fetchVehicleData()
  }, [submissionId, router])

  const fetchVehicleData = async () => {
    if (!submissionId) return
    
    try {
      setLoading(true)
      const result = await getVehicleSubmission(submissionId)
      if (result.success && result.data) {
        setVehicleData(result.data)
        
        // Calculate days remaining for offer expiration
        if (result.data.offer?.expiresAt) {
          const expiresAt = new Date(result.data.offer.expiresAt)
          const now = new Date()
          const diffTime = expiresAt.getTime() - now.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          setDaysRemaining(Math.max(0, diffDays))
        }
      } else {
        toast.error('Failed to load offer details')
        router.push('/offer')
      }
    } catch (error) {
      console.error('Error fetching vehicle data:', error)
      toast.error('Failed to load offer details')
      router.push('/offer')
    } finally {
      setLoading(false)
    }
  }



  const checkIfUserExists = async (email: string) => {
    try {
      const result = await checkUserExists(email)
      if (result.success && result.data) {
        setUserExists(result.data.exists)
        return result.data.exists
      }
      return false
    } catch (error) {
      console.error('Error checking if user exists:', error)
      return false
    }
  }

  const handleSaveAndContinue = async () => {
    // If user is already logged in, skip auth popup and go directly to mobile popup
    if (isAuthenticated && user) {
      console.log('User is already logged in, showing mobile popup')
      setShowMobilePopup(true)
      return
    }

    // If user is not logged in, check if they have an account with the email
    const email = vehicleData.contact?.email
    if (email) {
      const exists = await checkIfUserExists(email)
      if (exists) {
        console.log('User has an account with this email, showing auth popup for login only')
        setUserExists(true)
        setShowAuthPopup(true)
      } else {
        console.log('User does not have an account, showing auth popup for signup/login')
        setUserExists(false)
        setShowAuthPopup(true)
      }
    } else {
      // No email found, show auth popup
      setShowAuthPopup(true)
    }
  }

  const handleAuthSuccess = (userData: any) => {
    console.log('User authenticated:', userData)
    setShowAuthPopup(false)
    toast.success('Authentication successful!')
    
    // Show mobile popup after successful authentication
    setShowMobilePopup(true)
  }

  const handleAuthClose = () => {
    setShowAuthPopup(false)
  }

  const handleMobileSuccess = () => {
    setShowMobilePopup(false)
    // Navigate to sale confirmation page after mobile number is saved
    router.push(`/offer/confirm-sale?id=${submissionId}`)
  }

  const handleMobileClose = () => {
    setShowMobilePopup(false)
    // Still navigate to confirm sale even if they skip mobile
    router.push(`/offer/confirm-sale?id=${submissionId}`)
  }

  const handleBack = () => {
    router.push(`/offer/email?id=${submissionId}`)
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-white">Loading your offer...</p>
        </div>
      </div>
    )
  }

  if (!vehicleData.offer?.amount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Offer Not Found</h1>
          <p className="mb-6">We couldn't find an offer for this vehicle.</p>
          <Button onClick={() => router.push('/offer')} className="bg-green-400 text-black">
            Start Over
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      <div className="relative z-10">
        {/* Header */}
        <div className="absolute top-6 left-6 z-20">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleBack()}
            className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-full w-12 h-12 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
          {/* Hero Section */}
          <div className="text-center mb-20">

            {/* Main offer display */}
            <div className="relative mb-12">
              <h1 className="text-4xl md:text-7xl font-black mb-8 leading-tight">
                <span className="block text-2xl md:text-4xl font-normal text-slate-400 mb-2">Your VOS Offer</span>
                <span className="relative">
                  <span className="text-[#a6fe54]">
                    ${vehicleData.offer.amount.toLocaleString()}
                  </span>
                </span>
              </h1>
            </div>
          </div>

          {/* Vehicle Card & Stats Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {/* Vehicle Details - Takes 2 columns */}
            <div className="lg:col-span-2">
              <div className="bg-black border border-[#a6fe54]/30 rounded-3xl p-8 h-full">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-[#a6fe54]/20 rounded-2xl flex items-center justify-center">
                    <Car className="w-6 h-6 text-[#a6fe54]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Vehicle Details</h2>
                    <p className="text-slate-400">Your submission summary</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Vehicle Info Cards */}
                  {[
                    { label: 'Make', value: vehicleData.vinOrPlate?.make || 'Unknown', icon: Car },
                    { label: 'Model', value: vehicleData.vinOrPlate?.model || 'Unknown', icon: Star },
                    { label: 'Year', value: vehicleData.vinOrPlate?.year > 0 ? vehicleData.vinOrPlate.year : 'Unknown', icon: Calendar },
                    { label: 'Mileage', value: vehicleData.basics?.mileage ? `${vehicleData.basics.mileage.toLocaleString()} miles` : 'Unknown', icon: TrendingUp },
                    { label: 'Color', value: vehicleData.basics?.color || 'Unknown', icon: Sparkles },
                    { label: 'Condition', value: vehicleData.condition?.overallCondition || 'Unknown', icon: CheckCircle }
                  ].filter(item => item.value !== 'Unknown').map((item, index) => (
                    <div key={index} className="group bg-black border border-[#a6fe54]/20 hover:border-[#a6fe54]/40 rounded-2xl p-4 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#a6fe54]/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <item.icon className="w-4 h-4 text-[#a6fe54]" />
                          </div>
                          <span className="text-slate-400 font-medium">{item.label}</span>
                        </div>
                        <span className="text-white font-semibold">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Contact Info */}
                {vehicleData.contact?.email && (
                  <div className="mt-6 p-4 bg-[#a6fe54]/10 border border-[#a6fe54]/30 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Contact Email</span>
                      <span className="text-white font-semibold truncate max-w-64">{vehicleData.contact.email}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-6">
              {/* Offer Value Card */}
              <div className="bg-black border border-[#a6fe54]/30 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#a6fe54]/20 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-[#a6fe54]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#a6fe54]">Offer Value</h3>
                    <p className="text-sm text-slate-400">Market competitive</p>
                  </div>
                </div>
                <div className="text-3xl font-black text-[#a6fe54]">
                  ${vehicleData.offer.amount.toLocaleString()}
                </div>
              </div>

              {/* Time Remaining Card */}
              <div className="bg-black border border-[#a6fe54]/30 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#a6fe54]/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#a6fe54]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#a6fe54]">Time Remaining</h3>
                    <p className="text-sm text-slate-400">Offer expires</p>
                  </div>
                </div>
                <div className="text-3xl font-black text-[#a6fe54]">
                  {daysRemaining} Day{daysRemaining !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Action Section */}
          <div className="text-center mb-0">
           

            {/* Main CTA */}
            <div className="relative inline-block group">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 animate-pulse"></div>
              
              <Button
                onClick={handleSaveAndContinue}
                className="relative bg-[#a6fe54] text-black font-black py-6 px-12 text-xl rounded-full shadow-none hover:bg-[#a6fe54]/80 transition-all duration-300"
              >
                <span className="flex items-center gap-4">
                  <Zap className="w-6 h-6" />
                  <span>{isAuthenticated && user ? 'Continue to Sale' : 'Secure My Offer'}</span>
                  <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center group-hover:bg-black/30 transition-colors duration-300">
                    <span className="text-black font-bold text-xl">→</span>
                  </div>
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Authentication Popup */}
        <AuthPopup
          isOpen={showAuthPopup}
          onClose={handleAuthClose}
          onSuccess={handleAuthSuccess}
          prefillEmail={vehicleData.contact?.email || ''}
          userExists={userExists}
        />

        {/* Mobile Number Popup */}
        <MobilePopup
          isOpen={showMobilePopup}
          onClose={handleMobileClose}
          onSuccess={handleMobileSuccess}
          submissionId={submissionId || ''}
          existingMobile={vehicleData.contact?.mobile || ''}
        />
      </div>

      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scale-x {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .animate-scale-x {
          animation: scale-x 1s ease-out 0.5s forwards;
        }
      `}</style>
    </div>
  )
}