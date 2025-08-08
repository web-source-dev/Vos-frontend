'use client'

import { useState, useEffect } from 'react'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-400/3 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

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
            {/* Success badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 backdrop-blur-sm border border-emerald-400/30 rounded-full mb-8 animate-fade-in">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                SALE COMPLETED
              </span>
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>

            {/* Success animation */}
            <div className="relative mb-8">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-emerald-400/30 to-emerald-500/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-16 h-16 text-emerald-400" />
              </div>
              
              {/* Floating celebration elements */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                <div className="flex gap-4 animate-pulse">
                  <Star className="w-6 h-6 text-yellow-400 animate-spin" style={{animationDuration: '3s'}} />
                  <Trophy className="w-8 h-8 text-emerald-400 animate-bounce" style={{animationDelay: '0.5s'}} />
                  <Star className="w-6 h-6 text-blue-400 animate-spin" style={{animationDuration: '2s', animationDelay: '1s'}} />
                </div>
              </div>
            </div>

            {/* Main heading */}
            <div className="relative mb-12">
              <h1 className="text-4xl md:text-7xl font-black mb-6 leading-tight">
                <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-blue-400 bg-clip-text text-transparent">
                  🎉 Congratulations!
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 mb-6">
                Your vehicle sale process is complete!
              </p>
              
              {/* Vehicle Info Display */}
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-400/10 to-blue-400/10 backdrop-blur-sm border border-emerald-400/20 rounded-2xl mb-8">
                <Car className="w-6 h-6 text-emerald-400" />
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                  {vehicleData.vinOrPlate?.year} {vehicleData.vinOrPlate?.make} {vehicleData.vinOrPlate?.model}
                </span>
              </div>
            </div>
          </div>

          {/* Process Summary Cards */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Offer Details */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-emerald-400/20 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400/20 to-emerald-500/20 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Your Final Offer</h3>
                  <p className="text-slate-400">Congratulations on your sale!</p>
                </div>
              </div>

              <div className="text-center mb-6">
                <div className="text-5xl font-black bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent mb-4">
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
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-blue-400/20 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-blue-500/20 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-400" />
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
                      <MapPin className="w-5 h-5 text-blue-400 mt-0.5" />
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
          <div className="bg-gradient-to-r from-emerald-400/10 to-blue-400/10 backdrop-blur-sm border border-emerald-400/30 rounded-2xl p-8 mb-16">
            <h3 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <Award className="w-8 h-8 text-emerald-400" />
              Process Complete ✅
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  <span className="text-white font-medium">Vehicle details submitted</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  <span className="text-white font-medium">Offer generated: ${vehicleData.offer?.amount?.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  <span className="text-white font-medium">Account created</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  <span className="text-white font-medium">Sale details confirmed</span>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  <span className="text-white font-medium">Ownership verification completed</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  <span className="text-white font-medium">Payment method selected</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  <span className="text-white font-medium">Appointment scheduled</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  <span className="text-white font-medium">Process completed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center">
            <div className="relative inline-block group">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 animate-pulse"></div>
              
              <Button
                onClick={() => router.push('/')}
                className="relative font-black py-6 px-12 text-xl rounded-full shadow-2xl transition-all duration-300 transform bg-gradient-to-r from-emerald-400 to-blue-400 hover:from-emerald-300 hover:to-blue-300 text-black hover:scale-105 border-2 border-emerald-400/20"
              >
                <span className="flex items-center gap-3">
                  <Home className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                  <span>Return to Home</span>
                  <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center group-hover:bg-black/30 transition-colors duration-300">
                    <span className="text-black font-bold text-xl">→</span>
                  </div>
                </span>
              </Button>
            </div>
            
            <div className="mt-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-3">
                🎊 Sale Successfully Completed!
              </h3>
              <p className="text-slate-400 text-lg leading-relaxed">
                Thank you for choosing us! Your vehicle sale is now complete. We'll see you at your scheduled appointment to finalize everything.
              </p>
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