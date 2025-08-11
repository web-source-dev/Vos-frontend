'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getVehicleSubmission } from '@/lib/customer'
import { toast } from 'sonner'
import { 
  CheckCircle, 
  Calendar, 
  CreditCard, 
  FileText, 
  Home, 
  ArrowLeft, 
  Sparkles, 
  Trophy, 
  Star, 
  Award, 
  Zap,
  Car,
  MapPin,
  Clock,
  DollarSign
} from 'lucide-react'

export default function CompletionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading completion details...</p>
          </div>
        </div>
      }
    >
      <CompletionPageContent />
    </Suspense>
  )
}

function CompletionPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const submissionId = searchParams.get('id')
  const [loading, setLoading] = useState(true)
  const [vehicleData, setVehicleData] = useState<any>({})

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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not scheduled'
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading completion details...</p>
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
            onClick={() => router.push(`/offer/schedule-pickup?id=${submissionId}`)}
            className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-full w-12 h-12 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
          {/* Success Hero Section */}
          <div className="text-center mb-16">
            {/* Main heading */}
            <div className="relative mb-12">
              <h1 className="text-4xl md:text-7xl font-black mb-6 leading-tight">
                <span className="text-[#a6fe54]">
                Congratulations!
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 mb-6">
                Your vehicle sale process is complete!
              </p>
              
              {/* Vehicle Info Display */}
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-[#a6fe54]/10 border border-[#a6fe54]/30 rounded-2xl mb-8">
                <Car className="w-6 h-6 text-[#a6fe54]" />
                <span className="text-xl font-bold text-[#a6fe54]">
                  {vehicleData.vinOrPlate?.year} {vehicleData.vinOrPlate?.make} {vehicleData.vinOrPlate?.model}
                </span>
              </div>
            </div>
          </div>

          {/* Process Summary Cards */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Offer Details */}
            <div className="bg-black border border-[#a6fe54]/30 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#a6fe54]/20 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-[#a6fe54]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Your Final Offer</h3>
                  <p className="text-slate-400">Congratulations on your sale!</p>
                </div>
              </div>

              <div className="text-center mb-6">
                <div className="text-5xl font-black text-[#a6fe54] mb-4">
                  ${vehicleData.offer?.amount?.toLocaleString()}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                  <span className="text-slate-400 font-medium">Payment Method:</span>
                  <span className="text-white font-semibold">{vehicleData.payoutMethod || 'Bank Deposit'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                  <span className="text-slate-400 font-medium">Offer Valid Until:</span>
                  <span className="text-white font-semibold">
                    {vehicleData.offer?.expiresAt ? new Date(vehicleData.offer.expiresAt).toLocaleDateString() : '30 Days'}
                  </span>
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="bg-black border border-[#a6fe54]/30 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#a6fe54]/20 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-[#a6fe54]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Your Appointment</h3>
                  <p className="text-slate-400">Ready to complete the sale</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                  <span className="text-slate-400 font-medium">Type:</span>
                  <span className="text-white font-semibold">{vehicleData.appointment?.type || 'Not scheduled'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                  <span className="text-slate-400 font-medium">Date & Time:</span>
                  <span className="text-white font-semibold text-right">{formatDate(vehicleData.appointmentDateTime)}</span>
                </div>
                {vehicleData.appointment?.address && (
                  <div className="p-3 bg-white/5 rounded-xl">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-[#a6fe54] mt-0.5" />
                      <div>
                        <span className="text-slate-400 font-medium block">Address:</span>
                        <span className="text-white font-semibold">{vehicleData.appointment.address}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Completion Checklist */}
          <div className="bg-black border border-[#a6fe54]/30 rounded-3xl p-8 mb-16">
            <h3 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <Award className="w-8 h-8 text-[#a6fe54]" />
              Process Complete ✅
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-[#a6fe54]" />
                  <span className="text-white font-medium">Vehicle details submitted</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-[#a6fe54]" />
                  <span className="text-white font-medium">Offer generated: ${vehicleData.offer?.amount?.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-[#a6fe54]" />
                  <span className="text-white font-medium">Account created</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-[#a6fe54]" />
                  <span className="text-white font-medium">Sale details confirmed</span>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-[#a6fe54]" />
                  <span className="text-white font-medium">Ownership verification completed</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-[#a6fe54]" />
                  <span className="text-white font-medium">Payment method selected</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-[#a6fe54]" />
                  <span className="text-white font-medium">Appointment scheduled</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-[#a6fe54]" />
                  <span className="text-white font-medium">Process completed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center">
            <div className="relative inline-block group">
              <Button
                onClick={() => router.push('/')}
                className="relative font-black py-6 px-12 text-xl rounded-full transition-all duration-300 transform bg-[#a6fe54] hover:bg-[#a6fe54]/80 text-black hover:scale-105"
              >
                <span className="flex items-center gap-3">
                  <span>Go to Dashboard</span>
                  <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center group-hover:bg-black/30 transition-colors duration-300">
                    <span className="text-black font-bold text-xl">→</span>
                  </div>
                </span>
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