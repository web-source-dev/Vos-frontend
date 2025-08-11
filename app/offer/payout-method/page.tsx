'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getVehicleSubmission } from '@/lib/customer'
import { toast } from 'sonner'
import { 
  CreditCard, 
  CheckCircle, 
  Building2, 
  FileText, 
  ArrowLeft, 
  DollarSign, 
  Sparkles, 
  Zap, 
  Shield, 
  Clock, 
  Award,
  TrendingUp,
  Banknote
} from 'lucide-react'

export default function PayoutMethodPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payout options...</p>
          </div>
        </div>
      }
    >
      <PayoutMethodPageContent />
    </Suspense>
  )
}

function PayoutMethodPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const submissionId = searchParams.get('id')
  const [loading, setLoading] = useState(true)
  const [vehicleData, setVehicleData] = useState<any>({})
  const [selectedPayoutMethod, setSelectedPayoutMethod] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [isAutoSelected, setIsAutoSelected] = useState(false)

  useEffect(() => {
    if (!submissionId) {
      router.push('/offer')
      return
    }
     
    fetchVehicleData()
  }, [submissionId, router])

  // Debug useEffect to monitor state changes
  useEffect(() => {
    console.log('State updated - selectedPayoutMethod:', selectedPayoutMethod, 'isAutoSelected:', isAutoSelected)
  }, [selectedPayoutMethod, isAutoSelected])

  const fetchVehicleData = async () => {
    if (!submissionId) return
    
    try {
      setLoading(true)
      const result = await getVehicleSubmission(submissionId)
      if (result.success && result.data) {
        setVehicleData(result.data)
        
        // Auto-populate payout method if already selected
        if (result.data.payoutMethod) {
          console.log('Found existing payout method in database:', result.data.payoutMethod)
          console.log('Full vehicle data:', result.data)
          setSelectedPayoutMethod(result.data.payoutMethod)
          setIsAutoSelected(true)
          console.log('Auto-selecting existing payout method:', result.data.payoutMethod)
          // Use setTimeout to ensure the toast shows after the component renders
          setTimeout(() => {
            toast.success(`✓ Auto-selected your previous choice: ${result.data?.payoutMethod}`, {
              duration: 4000,
            })
          }, 500)
        } else {
          console.log('No existing payout method found, user needs to select one')
          setIsAutoSelected(false)
        }
      } else {
        toast.error('Failed to load vehicle details')
        router.push('/offer')
      }
    } catch (error) {
      console.error('Error fetching vehicle data:', error)
      toast.error('Failed to load vehicle details')
      router.push('/offer')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = async () => {
    if (!selectedPayoutMethod) {
      toast.error('Please select a payout method')
      return
    }

    setSaving(true)
    
    try {
      // Save payout method to backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://vos-backend-bh76.onrender.com' : 'http://localhost:5000')}/api/customer/vehicle-submission/${submissionId}/payout-method`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ payoutMethod: selectedPayoutMethod })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('Payout method saved successfully!')
        router.push(`/offer/schedule-pickup?id=${submissionId}`)
      } else {
        toast.error(result.error || 'Failed to save payout method')
      }
    } catch (error) {
      console.error('Error saving payout method:', error)
      toast.error('Failed to save payout method')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payout options...</p>
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
            onClick={() => router.push(`/offer/ownership-verification?id=${submissionId}`)}
            className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-full w-12 h-12 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            {/* Payment badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#a6fe54]/20 border border-[#a6fe54]/30 rounded-full mb-8 animate-fade-in">
              <DollarSign className="w-4 h-4 text-[#a6fe54]" />
              <span className="text-sm font-semibold text-[#a6fe54]">
                PAYMENT SETUP
              </span>
              <Sparkles className="w-4 h-4 text-[#a6fe54]" />
            </div>

            {/* Main heading */}
            <div className="relative mb-12">
              <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                <span className="text-[#a6fe54]">
                  Choose Payment Method
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 mb-6">
                How would you like to receive your payment?
              </p>
              
              {/* Payment Amount Display */}
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-[#a6fe54]/10 border border-[#a6fe54]/30 rounded-2xl mb-8">
                <Banknote className="w-6 h-6 text-[#a6fe54]" />
                <span className="text-2xl font-bold text-[#a6fe54]">
                  ${vehicleData.offer?.amount?.toLocaleString()}
                </span>
              </div>

              {/* Auto-selected notification */}
              {isAutoSelected && vehicleData.payoutMethod && (
                <div className="max-w-2xl mx-auto mt-8 bg-[#a6fe54]/10 border border-[#a6fe54]/30 rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-[#a6fe54]" />
                    <div className="text-left">
                      <p className="text-[#a6fe54] font-bold text-lg">
                        ✓ Previous selection found
                      </p>
                      <p className="text-slate-300 font-medium">
                        You previously chose: <span className="text-[#a6fe54] font-bold">{vehicleData.payoutMethod}</span>
                      </p>
                      <p className="text-slate-400 text-sm mt-1">
                        You can change your selection below if needed
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payout Options */}
          <div className="grid gap-8 mb-16 max-w-4xl mx-auto">
            {/* Secure Bank Deposit */}
            <div 
              className={`group cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                selectedPayoutMethod === 'Secure Bank Deposit' ? 'scale-105' : ''
              }`}
              onClick={() => {
                setSelectedPayoutMethod('Secure Bank Deposit')
                setIsAutoSelected(false)
              }}
            >
              <div className={`bg-black border-2 rounded-3xl p-8 transition-all duration-300 ${
                selectedPayoutMethod === 'Secure Bank Deposit' 
                  ? 'border-[#a6fe54]/50 shadow-2xl shadow-[#a6fe54]/20' 
                  : 'border-white/20 hover:border-[#a6fe54]/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      selectedPayoutMethod === 'Secure Bank Deposit'
                        ? 'bg-[#a6fe54]/30 scale-110'
                        : 'bg-[#a6fe54]/20 group-hover:scale-110'
                    }`}>
                      <Building2 className="w-8 h-8 text-[#a6fe54]" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                        Secure Bank Deposit
                        {selectedPayoutMethod === 'Secure Bank Deposit' && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-[#a6fe54]/20 rounded-full">
                            <CheckCircle className="w-4 h-4 text-[#a6fe54]" />
                            <span className="text-xs text-[#a6fe54] font-medium">Selected</span>
                          </div>
                        )}
                      </h3>
                      <p className="text-slate-300 text-lg mb-3">Direct deposit to your bank account within 1-2 business days</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-[#a6fe54]/20 rounded-full">
                          <TrendingUp className="w-4 h-4 text-[#a6fe54]" />
                          <span className="text-[#a6fe54] font-semibold text-sm">Fastest</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-[#a6fe54]/20 rounded-full">
                          <Shield className="w-4 h-4 text-[#a6fe54]" />
                          <span className="text-[#a6fe54] font-semibold text-sm">Secure</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {selectedPayoutMethod === 'Secure Bank Deposit' && (
                    <div className="w-8 h-8 bg-[#a6fe54]/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-[#a6fe54]" />
                    </div>
                  )}
                </div>
                
                {selectedPayoutMethod === 'Secure Bank Deposit' && isAutoSelected && (
                  <div className="mt-4 p-3 bg-[#a6fe54]/10 rounded-xl">
                    <div className="text-xs text-[#a6fe54] font-medium">Previously Selected</div>
                  </div>
                )}
              </div>
            </div>

            {/* Printed Check at Pickup */}
            <div 
              className={`group cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                selectedPayoutMethod === 'Printed Check at Pickup' ? 'scale-105' : ''
              }`}
              onClick={() => {
                setSelectedPayoutMethod('Printed Check at Pickup')
                setIsAutoSelected(false)
              }}
            >
              <div className={`bg-black border-2 rounded-3xl p-8 transition-all duration-300 ${
                selectedPayoutMethod === 'Printed Check at Pickup' 
                  ? 'border-[#a6fe54]/50 shadow-2xl shadow-[#a6fe54]/20' 
                  : 'border-white/20 hover:border-[#a6fe54]/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      selectedPayoutMethod === 'Printed Check at Pickup'
                        ? 'bg-[#a6fe54]/30 scale-110'
                        : 'bg-[#a6fe54]/20 group-hover:scale-110'
                    }`}>
                      <FileText className="w-8 h-8 text-[#a6fe54]" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                        Printed Check at Pickup
                        {selectedPayoutMethod === 'Printed Check at Pickup' && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-[#a6fe54]/20 rounded-full">
                            <CheckCircle className="w-4 h-4 text-[#a6fe54]" />
                            <span className="text-xs text-[#a6fe54] font-medium">Selected</span>
                          </div>
                        )}
                      </h3>
                      <p className="text-slate-300 text-lg mb-3">Receive a certified check when we pick up your vehicle</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-[#a6fe54]/20 rounded-full">
                          <Award className="w-4 h-4 text-[#a6fe54]" />
                          <span className="text-[#a6fe54] font-semibold text-sm">Traditional</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-[#a6fe54]/20 rounded-full">
                          <Clock className="w-4 h-4 text-[#a6fe54]" />
                          <span className="text-[#a6fe54] font-semibold text-sm">At Pickup</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {selectedPayoutMethod === 'Printed Check at Pickup' && (
                    <div className="w-8 h-8 bg-[#a6fe54]/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-[#a6fe54]" />
                    </div>
                  )}
                </div>
                
                {selectedPayoutMethod === 'Printed Check at Pickup' && isAutoSelected && (
                  <div className="mt-4 p-3 bg-[#a6fe54]/10 rounded-xl">
                    <div className="text-xs text-[#a6fe54] font-medium">Previously Selected</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center">
            <div className="relative inline-block group">
              <Button
                onClick={handleContinue}
                disabled={!selectedPayoutMethod || saving}
                className={`relative font-black py-6 px-12 text-xl rounded-full transition-all duration-300 transform ${
                  selectedPayoutMethod && !saving
                    ? 'bg-[#a6fe54] hover:bg-[#a6fe54]/80 text-black hover:scale-105'
                    : 'bg-white/10 text-slate-500 cursor-not-allowed border-2 border-white/10'
                }`}
              >
                {saving ? (
                  <span className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                    <span>Saving...</span>
                  </span>
                ) : selectedPayoutMethod ? (
                  <span className="flex items-center gap-3">
                    <Zap className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Continue to Schedule Pickup</span>
                    <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center group-hover:bg-black/30 transition-colors duration-300">
                      <span className="text-black font-bold text-xl">→</span>
                    </div>
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6" />
                    <span>Select Payment Method</span>
                  </span>
                )}
              </Button>
            </div>
          
          </div>
        </div>
      </div>

      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  )
}