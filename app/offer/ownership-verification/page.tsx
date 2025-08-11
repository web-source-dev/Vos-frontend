'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getVehicleSubmission } from '@/lib/customer'
import { toast } from 'sonner'
import { 
  Upload, 
  CheckCircle, 
  Camera, 
  FileText, 
  ArrowRight, 
  X, 
  ArrowLeft, 
  Shield, 
  Sparkles, 
  Zap, 
  Star, 
  Award,
  Eye,
  CreditCard
} from 'lucide-react'

export default function OwnershipVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading verification requirements...</p>
          </div>
        </div>
      }
    >
      <OwnershipVerificationPageContent />
    </Suspense>
  )
}

function OwnershipVerificationPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const submissionId = searchParams.get('id')
  const [loading, setLoading] = useState(true)
  const [vehicleData, setVehicleData] = useState<any>({})
  const [uploading, setUploading] = useState(false)
  
  // Photo upload states
  const [odometerPhoto, setOdometerPhoto] = useState<File | null>(null)
  const [photoID, setPhotoID] = useState<File | null>(null)
  const [odometerPreview, setOdometerPreview] = useState<string>('')
  const [photoIDPreview, setPhotoIDPreview] = useState<string>('')
  const [odometerUploaded, setOdometerUploaded] = useState(false)
  const [photoIDUploaded, setPhotoIDUploaded] = useState(false)
  
  // File input refs
  const odometerInputRef = useRef<HTMLInputElement>(null)
  const photoIDInputRef = useRef<HTMLInputElement>(null)

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
        
        // Check if photos are already uploaded and set previews
        if (result.data.ownership?.odometerPhoto) {
          setOdometerUploaded(true)
          setOdometerPreview(result.data.ownership.odometerPhoto)
          console.log('Found existing odometer photo:', result.data.ownership.odometerPhoto)
        }
        if (result.data.ownership?.photoID) {
          setPhotoIDUploaded(true)
          setPhotoIDPreview(result.data.ownership.photoID)
          console.log('Found existing photo ID:', result.data.ownership.photoID)
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

  const handleFileSelect = (file: File, type: 'odometer' | 'photoID') => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const preview = e.target?.result as string
      if (type === 'odometer') {
        setOdometerPhoto(file)
        setOdometerPreview(preview)
      } else {
        setPhotoID(file)
        setPhotoIDPreview(preview)
      }
    }
    reader.readAsDataURL(file)
  }

  const uploadPhoto = async (file: File, type: 'odometer' | 'photoID') => {
    if (!file || !submissionId) return false

    const formData = new FormData()
    formData.append('photo', file)
    formData.append('type', type)
    formData.append('submissionId', submissionId)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://vos-backend-bh76.onrender.com' : 'http://localhost:5000')}/api/customer/upload-ownership-photo`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      const result = await response.json()
      
      if (result.success) {
        return true
      } else {
        toast.error(result.error || `Failed to upload ${type} photo`)
        return false
      }
    } catch (error) {
      console.error(`Error uploading ${type} photo:`, error)
      toast.error(`Failed to upload ${type} photo`)
      return false
    }
  }

  const handleUploadPhoto = async (type: 'odometer' | 'photoID') => {
    const file = type === 'odometer' ? odometerPhoto : photoID
    if (!file) return

    setUploading(true)
    
    try {
      const success = await uploadPhoto(file, type)
      
      if (success) {
        if (type === 'odometer') {
          setOdometerUploaded(true)
          toast.success('Odometer photo uploaded successfully!')
        } else {
          setPhotoIDUploaded(true)
          toast.success('Photo ID uploaded successfully!')
        }
      }
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = (type: 'odometer' | 'photoID') => {
    if (type === 'odometer') {
      setOdometerPhoto(null)
      setOdometerPreview('')
      if (odometerInputRef.current) {
        odometerInputRef.current.value = ''
      }
    } else {
      setPhotoID(null)
      setPhotoIDPreview('')
      if (photoIDInputRef.current) {
        photoIDInputRef.current.value = ''
      }
    }
  }

  const handleContinue = () => {
    if (!odometerUploaded || !photoIDUploaded) {
      toast.error('Please upload both required photos before continuing')
      return
    }

    toast.success('Ownership verification complete!')
    router.push(`/offer/payout-method?id=${submissionId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification requirements...</p>
        </div>
      </div>
    )
  }

  const allPhotosUploaded = odometerUploaded && photoIDUploaded

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      <div className="relative z-10">
        {/* Header */}
        <div className="absolute top-6 left-6 z-20">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push(`/offer/confirm-sale?id=${submissionId}`)}
            className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-full w-12 h-12 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
          {/* Hero Section */}
          <div className="text-center mb-16">

            {/* Main heading */}
            <div className="relative mb-12">
              <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                <span className="text-[#a6fe54]">
                  Verify Ownership
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 mb-6">
                Just a few quick photos to verify ownership
              </p>
              <p className="text-lg text-slate-400">
                Upload the required documents to complete your vehicle sale
              </p>
            </div>

            {/* Vehicle Info Card */}
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-[#a6fe54]/10 border border-[#a6fe54]/30 rounded-2xl mb-8">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#a6fe54]" />
                <span className="text-white font-semibold">
                  {vehicleData.vinOrPlate?.year} {vehicleData.vinOrPlate?.make} {vehicleData.vinOrPlate?.model}
                </span>
              </div>
              <div className="w-px h-6 bg-white/20"></div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#a6fe54]" />
                <span className="text-xl font-bold text-[#a6fe54]">
                  ${vehicleData.offer?.amount?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Upload Requirements */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Odometer Photo Upload */}
            <div className="bg-black border border-[#a6fe54]/30 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#a6fe54]/20 rounded-2xl flex items-center justify-center">
                  <Camera className="w-6 h-6 text-[#a6fe54]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    Odometer Photo
                    {odometerUploaded && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-[#a6fe54]/20 rounded-full">
                        <CheckCircle className="w-4 h-4 text-[#a6fe54]" />
                        <span className="text-xs text-[#a6fe54] font-medium">Uploaded</span>
                      </div>
                    )}
                  </h2>
                  <p className="text-slate-400">Clear photo showing current mileage</p>
                </div>
              </div>

              {!odometerPreview ? (
                <div className="border-2 border-dashed border-[#a6fe54]/30 rounded-2xl p-8 text-center hover:border-[#a6fe54]/50 transition-colors duration-300">
                  <div className="w-16 h-16 bg-[#a6fe54]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-[#a6fe54]" />
                  </div>
                  <p className="text-slate-300 mb-4 font-medium">Take a clear photo of your odometer</p>
                  <p className="text-slate-500 text-sm mb-6">Make sure the mileage numbers are clearly visible</p>
                  <input
                    ref={odometerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'odometer')}
                    className="hidden"
                  />
                  <Button
                    onClick={() => odometerInputRef.current?.click()}
                    className="bg-[#a6fe54]/20 hover:bg-[#a6fe54]/30 border border-[#a6fe54]/30 text-[#a6fe54] font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Select Photo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative group">
                    <img
                      src={odometerPreview}
                      alt="Odometer photo"
                      className="w-full h-48 object-cover rounded-2xl border-2 border-white/10 group-hover:border-emerald-400/30 transition-colors duration-300"
                    />
                    {odometerUploaded && (
                      <div className="absolute top-3 left-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        ✓ Uploaded
                      </div>
                    )}
                    {!odometerUploaded && (
                      <button
                        onClick={() => removePhoto('odometer')}
                        className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors duration-300 shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {!odometerUploaded && odometerPhoto && (
                    <Button
                      onClick={() => handleUploadPhoto('odometer')}
                      disabled={uploading}
                      className="w-full bg-[#a6fe54] hover:bg-[#a6fe54]/80 text-black font-bold py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Odometer Photo
                        </>
                      )}
                    </Button>
                  )}
                  
                  {odometerUploaded && (
                    <div className="bg-[#a6fe54]/10 border border-[#a6fe54]/30 rounded-xl p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-[#a6fe54]" />
                        <span className="text-[#a6fe54] font-semibold">Odometer photo successfully uploaded</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Photo ID Upload */}
            <div className="bg-black border border-[#a6fe54]/30 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#a6fe54]/20 rounded-2xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#a6fe54]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    Photo ID
                    {photoIDUploaded && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-[#a6fe54]/20 rounded-full">
                        <CheckCircle className="w-4 h-4 text-[#a6fe54]" />
                        <span className="text-xs text-[#a6fe54] font-medium">Uploaded</span>
                      </div>
                    )}
                  </h2>
                  <p className="text-slate-400">Valid Driver's License or State ID</p>
                </div>
              </div>

              {!photoIDPreview ? (
                <div className="border-2 border-dashed border-[#a6fe54]/30 rounded-2xl p-8 text-center hover:border-[#a6fe54]/50 transition-colors duration-300">
                  <div className="w-16 h-16 bg-[#a6fe54]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-[#a6fe54]" />
                  </div>
                  <p className="text-slate-300 mb-4 font-medium">Upload a clear photo of your ID</p>
                  <p className="text-slate-500 text-sm mb-6">Make sure all text is clearly readable</p>
                  <input
                    ref={photoIDInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'photoID')}
                    className="hidden"
                  />
                  <Button
                    onClick={() => photoIDInputRef.current?.click()}
                    className="bg-[#a6fe54]/20 hover:bg-[#a6fe54]/30 border border-[#a6fe54]/30 text-[#a6fe54] font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Select Photo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative group">
                    <img
                      src={photoIDPreview}
                      alt="Photo ID"
                      className="w-full h-48 object-cover rounded-2xl border-2 border-white/10 group-hover:border-blue-400/30 transition-colors duration-300"
                    />
                    {photoIDUploaded && (
                      <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        ✓ Uploaded
                      </div>
                    )}
                    {!photoIDUploaded && (
                      <button
                        onClick={() => removePhoto('photoID')}
                        className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors duration-300 shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {!photoIDUploaded && photoID && (
                    <Button
                      onClick={() => handleUploadPhoto('photoID')}
                      disabled={uploading}
                      className="w-full bg-[#a6fe54] hover:bg-[#a6fe54]/80 text-black font-bold py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Photo ID
                        </>
                      )}
                    </Button>
                  )}
                  
                  {photoIDUploaded && (
                    <div className="bg-[#a6fe54]/10 border border-[#a6fe54]/30 rounded-xl p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-[#a6fe54]" />
                        <span className="text-[#a6fe54] font-semibold">Photo ID successfully uploaded</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center">
            <div className="relative inline-block group">
              
              <Button
                onClick={handleContinue}
                disabled={!allPhotosUploaded}
                className={`relative font-black py-6 px-12 text-xl rounded-full shadow-2xl transition-all duration-300 transform ${
                  allPhotosUploaded
                    ? 'bg-gradient-to-r from-[#a6fe54] to-[#a6fe54] hover:from-[#a6fe54]/80 hover:to-[#a6fe54]/80 text-black hover:scale-105 border-2 border-[#a6fe54]/20'
                    : 'bg-white/10 text-slate-500 cursor-not-allowed border-2 border-white/10'
                }`}
              >
                {allPhotosUploaded ? (
                  <span className="flex items-center gap-3">
                    <Zap className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Continue to Payment Setup</span>
                    <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center group-hover:bg-black/30 transition-colors duration-300">
                      <ArrowRight className="w-5 h-5 text-black" />
                    </div>
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    <Upload className="w-6 h-6" />
                    <span>Complete Uploads to Continue</span>
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