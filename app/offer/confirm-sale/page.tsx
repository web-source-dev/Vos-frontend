'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getVehicleSubmission } from '@/lib/customer'
import { toast } from 'sonner'
import { 
  CheckCircle, 
  Car, 
  MapPin, 
  CreditCard, 
  Calendar, 
  ArrowRight, 
  ArrowLeft, 
  Shield, 
  Star, 
  Award, 
  Zap,
  TrendingUp,
  Sparkles
} from 'lucide-react'

export default function ConfirmSalePage() {
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

  const handleContinue = () => {
    // Navigate to ownership verification step
    toast.success('Sale details confirmed! Now let\'s verify ownership.')
    router.push(`/offer/ownership-verification?id=${submissionId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sale details...</p>
        </div>
      </div>
    )
  }

  // Determine loan/lease status
  const loanLeaseStatus = vehicleData.basics?.loanLeaseStatus || 'No loan or lease'
  const hasFinancing = loanLeaseStatus !== 'No loan or lease'
  const isLease = loanLeaseStatus === "I'm leasing"
  const isLoan = loanLeaseStatus === "I'm financing (loan)"

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
            onClick={() => router.push(`/offer/display?id=${submissionId}`)}
            className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-full w-12 h-12 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            {/* Success badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 backdrop-blur-sm border border-emerald-400/30 rounded-full mb-8 animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                SALE DETAILS READY
              </span>
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>

            {/* Main heading */}
            <div className="relative mb-12">
              <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-blue-400 bg-clip-text text-transparent">
                  Confirm Your Sale
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 mb-4">
                You're all set to sell your
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-400/10 to-blue-400/10 backdrop-blur-sm border border-emerald-400/20 rounded-full">
                <Car className="w-5 h-5 text-emerald-400" />
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                  {vehicleData.vinOrPlate?.year} {vehicleData.vinOrPlate?.make} {vehicleData.vinOrPlate?.model}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {/* Vehicle Details - Takes 2 columns */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 h-full">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-2xl flex items-center justify-center">
                    <Car className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Vehicle Details</h2>
                    <p className="text-slate-400">Complete vehicle information</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Vehicle Info Cards */}
                  {[
                    { label: 'Make & Model', value: `${vehicleData.vinOrPlate?.make} ${vehicleData.vinOrPlate?.model}`, icon: Car },
                    { label: 'Year', value: vehicleData.vinOrPlate?.year?.toString(), icon: Calendar },
                    { label: 'Trim', value: vehicleData.vinOrPlate?.trim, icon: Star },
                    { label: 'Mileage', value: vehicleData.basics?.mileage ? `${vehicleData.basics.mileage.toLocaleString()} miles` : null, icon: TrendingUp },
                    { label: 'Color', value: vehicleData.basics?.color, icon: Sparkles },
                    { label: 'Condition', value: vehicleData.condition?.overallCondition, icon: CheckCircle }
                  ].filter(item => item.value).map((item, index) => (
                    <div key={index} className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-400/30 rounded-2xl p-4 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <item.icon className="w-4 h-4 text-emerald-400" />
                          </div>
                          <span className="text-slate-400 font-medium">{item.label}</span>
                        </div>
                        <span className="text-white font-semibold">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* VIN Display */}
                {vehicleData.vinOrPlate?.vin && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/30 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">VIN Number</span>
                      <span className="text-white font-mono text-sm">{vehicleData.vinOrPlate.vin}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Offer & Status Sidebar */}
            <div className="space-y-6">
              {/* Offer Value Card */}
              <div className="bg-gradient-to-br from-emerald-400/20 to-emerald-400/10 backdrop-blur-xl border border-emerald-400/30 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-400/20 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-400">Your Offer</h3>
                    <p className="text-sm text-slate-400">Final amount</p>
                  </div>
                </div>
                <div className="text-3xl font-black text-emerald-400 mb-3">
                  ${vehicleData.offer?.amount?.toLocaleString() || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-300">
                  <Calendar className="w-4 h-4" />
                  <span>Valid for 7 days</span>
                </div>
                
                {vehicleData.contact?.email && (
                  <div className="mt-4 p-3 bg-emerald-400/10 rounded-xl">
                    <div className="text-xs text-emerald-300 mb-1">Confirmation sent to:</div>
                    <div className="text-sm font-medium text-emerald-200">{vehicleData.contact.email}</div>
                  </div>
                )}
              </div>

              {/* Registration Status */}
              <div className="bg-gradient-to-br from-blue-400/20 to-blue-400/10 backdrop-blur-xl border border-blue-400/30 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-400/20 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-400">Registration</h3>
                    <p className="text-sm text-slate-400">Vehicle location</p>
                  </div>
                </div>
                <div className="text-lg font-semibold text-blue-300">
                  {vehicleData.saleConfirmation?.state || vehicleData.basics?.zipCode || 'Your State'}
                </div>
                <p className="text-sm text-blue-200 mt-2">Registration verified</p>
              </div>

              {/* Financing Status */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-400/20 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Financing Status</h3>
                    <p className="text-sm text-slate-400">Loan/lease details</p>
                  </div>
                </div>
                
                {!hasFinancing ? (
                  <div className="space-y-2">
                    <div className="text-lg font-semibold text-emerald-400">Clear Title</div>
                    <p className="text-sm text-slate-300">No loan or lease detected</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-lg font-semibold text-white">
                      {isLease ? 'Lease' : 'Loan'} Detected
                    </div>
                    <div className="text-sm text-slate-300">{loanLeaseStatus}</div>
                    
                    {isLoan && vehicleData.basics?.loanDetails && (
                      <div className="text-xs text-slate-400 space-y-1">
                        <div>Lender: {vehicleData.basics.loanDetails.lenderName || 'Not specified'}</div>
                        {vehicleData.basics.loanDetails.loanBalance && (
                          <div>Balance: ${vehicleData.basics.loanDetails.loanBalance.toLocaleString()}</div>
                        )}
                      </div>
                    )}
                    
                    {isLease && vehicleData.basics?.leaseDetails && (
                      <div className="text-xs text-slate-400 space-y-1">
                        <div>Company: {vehicleData.basics.leaseDetails.leasingCompany || 'Not specified'}</div>
                        {vehicleData.basics.leaseDetails.leasePayoff && (
                          <div>Payoff: ${vehicleData.basics.leaseDetails.leasePayoff.toLocaleString()}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => router.push(`/offer/display?id=${submissionId}`)}
                variant="outline"
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-white font-semibold py-4 px-8 text-lg rounded-full transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              
              <div className="relative inline-block group">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 animate-pulse"></div>
                
                <Button
                  onClick={handleContinue}
                  className="relative bg-gradient-to-r from-emerald-400 to-blue-400 hover:from-emerald-300 hover:to-blue-300 text-black font-black py-4 px-12 text-xl rounded-full shadow-2xl hover:shadow-emerald-400/25 transition-all duration-300 transform hover:scale-105 border-2 border-emerald-400/20 group"
                >
                  <span className="flex items-center gap-3">
                    <Zap className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Confirm & Continue</span>
                    <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center group-hover:bg-black/30 transition-colors duration-300">
                      <ArrowRight className="w-5 h-5 text-black" />
                    </div>
                  </span>
                </Button>
              </div>
            </div>
            
            <div className="mt-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-3">
                Ready to Verify Ownership?
              </h3>
              <p className="text-slate-400 text-lg leading-relaxed">
                Next, we'll need to verify your vehicle ownership with a few quick photos. This helps us ensure a secure and legitimate transaction.
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