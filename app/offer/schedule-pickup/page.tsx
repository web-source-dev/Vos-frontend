'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getVehicleSubmission } from '@/lib/customer'
import { toast } from 'sonner'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Building, 
  Home, 
  CheckCircle, 
  ArrowLeft, 
  Sparkles, 
  Zap, 
  Car, 
  Shield, 
  Award,
  Users,
  Star
} from 'lucide-react'

export default function SchedulePickupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading scheduling options...</p>
          </div>
        </div>
      }
    >
      <SchedulePickupPageContent />
    </Suspense>
  )
}

function SchedulePickupPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const submissionId = searchParams.get('id')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [vehicleData, setVehicleData] = useState<any>({})
  const [isAutoPopulated, setIsAutoPopulated] = useState(false)
  
  // Form states
  const [appointmentType, setAppointmentType] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!submissionId) {
      router.push('/offer')
      return
    }
    
    fetchVehicleData()
  }, [submissionId, router])

  // Debug useEffect to monitor appointment data
  useEffect(() => {
    console.log('Appointment state updated:', {
      appointmentType,
      selectedDate,
      selectedTime,
      address,
      notes,
      isAutoPopulated
    })
  }, [appointmentType, selectedDate, selectedTime, address, notes, isAutoPopulated])

  const fetchVehicleData = async () => {
    if (!submissionId) return
    
    try {
      setLoading(true)
      const result = await getVehicleSubmission(submissionId)
      if (result.success && result.data) {
        setVehicleData(result.data)
        
        // Auto-populate appointment data if already exists
        console.log('Full vehicle data received:', result.data)
        console.log('Appointment data:', result.data.appointment)
        console.log('Appointment DateTime:', result.data.appointmentDateTime)
        
        if (result.data.appointment || result.data.appointmentDateTime) {
          console.log('Found existing appointment data:', result.data.appointment, result.data.appointmentDateTime)
          
          // Set appointment type if available
          if (result.data.appointment?.type) {
            setAppointmentType(result.data.appointment.type)
            console.log('Auto-populated appointment type:', result.data.appointment.type)
          }
          
          // Set appointment date and time if available
          if (result.data.appointmentDateTime) {
            const appointmentDate = new Date(result.data.appointmentDateTime)
            const dateStr = appointmentDate.toISOString().split('T')[0]
            const timeStr = appointmentDate.toTimeString().substring(0, 5)
            
            setSelectedDate(dateStr)
            setSelectedTime(timeStr)
            console.log('Auto-populated date:', dateStr, 'time:', timeStr)
          }
          
          // Set address if available
          if (result.data.appointment?.address) {
            setAddress(result.data.appointment.address)
            console.log('Auto-populated address:', result.data.appointment.address)
          } else if (result.data.basics?.zipCode) {
            setAddress(`${result.data.basics.zipCode}`)
            console.log('Set address from zipCode:', result.data.basics.zipCode)
          }
          
          // Set notes if available
          if (result.data.appointment?.notes) {
            setNotes(result.data.appointment.notes)
            console.log('Auto-populated notes:', result.data.appointment.notes)
          }
          
          console.log('All appointment fields set:', {
            appointmentType: result.data.appointment?.type,
            address: result.data.appointment?.address,
            notes: result.data.appointment?.notes,
            appointmentDateTime: result.data.appointmentDateTime
          })
          
          setIsAutoPopulated(true)
          
          // Show success toast with delay
          setTimeout(() => {
            toast.success('✓ Auto-populated your previous appointment details', {
              duration: 4000,
            })
          }, 500)
        } else {
          // Pre-fill address if available but no appointment exists
          if (result.data.basics?.zipCode) {
            setAddress(`${result.data.basics.zipCode}`)
          }
          setIsAutoPopulated(false)
          console.log('No existing appointment found, starting fresh')
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

  const handleScheduleAppointment = async () => {
    if (!appointmentType) {
      toast.error('Please select an appointment type')
      return
    }
    
    if (!selectedDate) {
      toast.error('Please select a date')
      return
    }
    
    if (!selectedTime) {
      toast.error('Please select a time')
      return
    }

    if (appointmentType === 'At-home pickup' && !address.trim()) {
      toast.error('Please provide your address for at-home pickup')
      return
    }

    setSaving(true)
    
    try {
      // Combine date and time
      const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}`)
      
      // Save appointment details to backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://vos-backend-bh76.onrender.com' : 'http://localhost:5000')}/api/customer/vehicle-submission/${submissionId}/appointment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          appointmentType,
          appointmentDateTime: appointmentDateTime.toISOString(),
          address: appointmentType === 'At-home pickup' ? address : '',
          notes
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success(isAutoPopulated ? 'Appointment updated successfully!' : 'Appointment scheduled successfully!')
        router.push(`/offer/completion?id=${submissionId}`)
      } else {
        toast.error(result.error || (isAutoPopulated ? 'Failed to update appointment' : 'Failed to schedule appointment'))
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error)
      toast.error('Failed to schedule appointment')
    } finally {
      setSaving(false)
    }
  }

  // Generate available time slots
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ]

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Get minimum date (tomorrow)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow

  // Get maximum date (30 days from now)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= lastDay || days.length < 42) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
  }

  const calendarDays = generateCalendarDays()

  const isDateSelectable = (date: Date) => {
    return date >= minDate && date <= maxDate
  }

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false
    const selected = new Date(selectedDate)
    return date.toDateString() === selected.toDateString()
  }

  const handleDateSelect = (date: Date) => {
    if (isDateSelectable(date)) {
      // Fix timezone issue by using local date formatting
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`
      setSelectedDate(dateString)
      setShowDatePicker(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showDatePicker && !target.closest('.date-picker-container')) {
        setShowDatePicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDatePicker])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scheduling options...</p>
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
            onClick={() => router.push(`/offer/payout-method?id=${submissionId}`)}
            className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-full w-12 h-12 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
     
            {/* Main heading */}
            <div className="relative mb-12">
              <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                <span className="text-[#a6fe54]">
                  Schedule Your Appointment
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 mb-6">
                Choose a date and time that works best for you
              </p>
              
              {/* Vehicle Info Display */}
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-[#a6fe54]/10 border border-[#a6fe54]/30 rounded-2xl mb-8">
                <Car className="w-6 h-6 text-[#a6fe54]" />
                <span className="text-xl font-bold text-[#a6fe54]">
                  {vehicleData.vinOrPlate?.year} {vehicleData.vinOrPlate?.make} {vehicleData.vinOrPlate?.model}
                </span>
              </div>

              {/* Auto-populated notification */}
              {isAutoPopulated && (
                <div className="max-w-2xl mx-auto mt-8 bg-[#a6fe54]/10 border border-[#a6fe54]/30 rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-[#a6fe54]" />
                    <div className="text-left">
                      <p className="text-[#a6fe54] font-bold text-lg">
                        ✓ Previous appointment found
                      </p>
                      <p className="text-slate-300 font-medium">
                        Your appointment details have been automatically loaded
                      </p>
                      <p className="text-slate-400 text-sm mt-1">
                        You can modify any details if needed and confirm to update
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Type Selection */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-3">Choose Appointment Type</h2>
              <p className="text-slate-400 text-lg">Select how you'd like to complete your vehicle sale</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* In-store appointment */}
              <div 
                className={`group cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  appointmentType === 'In-store appointment' ? 'scale-105' : ''
                }`}
                onClick={() => {
                  setAppointmentType('In-store appointment')
                  setIsAutoPopulated(false)
                }}
              >
                              <div className={`bg-black border-2 rounded-3xl p-8 transition-all duration-300 h-full ${
                appointmentType === 'In-store appointment' 
                  ? 'border-[#a6fe54]/50 shadow-2xl shadow-[#a6fe54]/20' 
                  : 'border-white/20 hover:border-[#a6fe54]/30'
              }`}>
                <div className="text-center">
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    appointmentType === 'In-store appointment'
                      ? 'bg-[#a6fe54]/30 scale-110'
                      : 'bg-[#a6fe54]/20 group-hover:scale-110'
                  }`}>
                    <Building className="w-10 h-10 text-[#a6fe54]" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3 flex items-center justify-center gap-3">
                    In-Store Visit
                    {appointmentType === 'In-store appointment' && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-[#a6fe54]/20 rounded-full">
                        <CheckCircle className="w-4 h-4 text-[#a6fe54]" />
                        <span className="text-xs text-[#a6fe54] font-medium">Selected</span>
                      </div>
                    )}
                  </h3>
                  
                  <p className="text-slate-300 text-lg mb-6">Visit our location to complete the sale and receive payment</p>
                  
                  <div className="flex justify-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#a6fe54]/20 rounded-full">
                      <Users className="w-4 h-4 text-[#a6fe54]" />
                      <span className="text-[#a6fe54] font-semibold text-sm">Personal Service</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#a6fe54]/20 rounded-full">
                      <Shield className="w-4 h-4 text-[#a6fe54]" />
                      <span className="text-[#a6fe54] font-semibold text-sm">Secure</span>
                    </div>
                  </div>
                  
                  {appointmentType === 'In-store appointment' && isAutoPopulated && (
                    <div className="mt-4 p-3 bg-[#a6fe54]/10 rounded-xl">
                      <div className="text-xs text-[#a6fe54] font-medium">Previously Selected</div>
                    </div>
                  )}
                </div>
              </div>
              </div>

              {/* At-home pickup */}
              <div 
                className={`group cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  appointmentType === 'At-home pickup' ? 'scale-105' : ''
                }`}
                onClick={() => {
                  setAppointmentType('At-home pickup')
                  setIsAutoPopulated(false)
                }}
              >
                              <div className={`bg-black border-2 rounded-3xl p-8 transition-all duration-300 h-full ${
                appointmentType === 'At-home pickup' 
                  ? 'border-[#a6fe54]/50 shadow-2xl shadow-[#a6fe54]/20' 
                  : 'border-white/20 hover:border-[#a6fe54]/30'
              }`}>
                <div className="text-center">
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    appointmentType === 'At-home pickup'
                      ? 'bg-[#a6fe54]/30 scale-110'
                      : 'bg-[#a6fe54]/20 group-hover:scale-110'
                  }`}>
                    <Home className="w-10 h-10 text-[#a6fe54]" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3 flex items-center justify-center gap-3">
                    At-Home Pickup
                    {appointmentType === 'At-home pickup' && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-[#a6fe54]/20 rounded-full">
                        <CheckCircle className="w-4 h-4 text-[#a6fe54]" />
                        <span className="text-xs text-[#a6fe54] font-medium">Selected</span>
                      </div>
                    )}
                  </h3>
                  
                  <p className="text-slate-300 text-lg mb-6">We'll come to your location to pick up the vehicle</p>
                  
                  <div className="flex justify-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#a6fe54]/20 rounded-full">
                      <Star className="w-4 h-4 text-[#a6fe54]" />
                      <span className="text-[#a6fe54] font-semibold text-sm">Convenient</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#a6fe54]/20 rounded-full">
                      <Award className="w-4 h-4 text-[#a6fe54]" />
                      <span className="text-[#a6fe54] font-semibold text-sm">Popular</span>
                    </div>
                  </div>
                  
                  {appointmentType === 'At-home pickup' && isAutoPopulated && (
                    <div className="mt-4 p-3 bg-[#a6fe54]/10 rounded-xl">
                      <div className="text-xs text-[#a6fe54] font-medium">Previously Selected</div>
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* Date and Time Selection */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Date Selection */}
            <div className="bg-black border border-[#a6fe54]/30 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#a6fe54]/20 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-[#a6fe54]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Select Date</h3>
                  <p className="text-slate-400">Choose your preferred date</p>
                </div>
              </div>

              {/* Custom Date Picker */}
              <div className="relative date-picker-container">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="w-full p-4 text-lg rounded-xl bg-white/5 border border-white/20 text-white hover:border-[#a6fe54]/30 focus:border-[#a6fe54]/50 focus:ring-2 focus:ring-[#a6fe54]/20 transition-all duration-300 text-left"
                >
                  {selectedDate ? formatDate(selectedDate) : 'Select a date...'}
                </button>

                {showDatePicker && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-black border border-[#a6fe54]/30 rounded-xl p-4 z-50 shadow-2xl">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={prevMonth}
                        className="p-2 hover:bg-[#a6fe54]/20 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5 text-[#a6fe54]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h3 className="text-lg font-bold text-white">
                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h3>
                      <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-[#a6fe54]/20 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5 text-[#a6fe54]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-sm font-medium text-slate-400 py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((date, index) => {
                        const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                        const isSelectable = isDateSelectable(date)
                        const isSelected = isDateSelected(date)
                        
                        return (
                          <button
                            key={index}
                            onClick={() => handleDateSelect(date)}
                            disabled={!isSelectable}
                            className={`
                              p-2 rounded-lg text-sm font-medium transition-all duration-200
                              ${isCurrentMonth ? 'text-white' : 'text-slate-600'}
                              ${isSelectable ? 'hover:bg-[#a6fe54]/20 cursor-pointer' : 'cursor-not-allowed'}
                              ${isSelected ? 'bg-[#a6fe54] text-black' : ''}
                              ${!isSelectable ? 'opacity-50' : ''}
                            `}
                          >
                            {date.getDate()}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              {selectedDate && isAutoPopulated && (
                <div className="mt-3 flex items-center gap-2 text-sm text-[#a6fe54] font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Auto-filled from previous appointment
                </div>
              )}
            </div>

            {/* Time Selection */}
            <div className="bg-black border border-[#a6fe54]/30 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#a6fe54]/20 rounded-2xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-[#a6fe54]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Select Time</h3>
                  <p className="text-slate-400">Pick a convenient time slot</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`p-3 rounded-xl font-semibold transition-all duration-300 ${
                      selectedTime === time
                        ? 'bg-[#a6fe54] text-black scale-105 shadow-lg'
                        : 'bg-white/10 hover:bg-white/20 border border-white/20 hover:border-[#a6fe54]/30 text-white'
                    }`}
                  >
                    {time}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-slate-400 mt-3">
                All times are in your local timezone
              </p>
              {selectedTime && isAutoPopulated && (
                <div className="mt-3 flex items-center gap-2 text-sm text-[#a6fe54] font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Auto-filled from previous appointment
                </div>
              )}
            </div>
          </div>

          {/* Address (for at-home pickup) */}
          {appointmentType === 'At-home pickup' && (
            <div className="bg-black border border-[#a6fe54]/30 rounded-3xl p-8 mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#a6fe54]/20 rounded-2xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-[#a6fe54]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Pickup Address</h3>
                  <p className="text-slate-400">Where should we pick up your vehicle?</p>
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="address" className="text-white font-medium text-lg">
                  Full Address
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your complete address including street, city, state, and zip code"
                  className="w-full p-4 text-lg rounded-xl bg-white/5 border border-white/20 text-white placeholder-slate-400 focus:border-[#a6fe54]/50 focus:ring-2 focus:ring-[#a6fe54]/20"
                />
                <p className="text-sm text-slate-400">
                  Please provide a complete address where we can safely pick up your vehicle
                </p>
                {address && isAutoPopulated && vehicleData.appointment?.address && (
                  <div className="flex items-center gap-2 text-sm text-[#a6fe54] font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Auto-filled from previous appointment
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Notes */}
          <div className="bg-black border border-[#a6fe54]/30 rounded-3xl p-8 mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#a6fe54]/20 rounded-2xl flex items-center justify-center">
                <Star className="w-6 h-6 text-[#a6fe54]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Additional Notes</h3>
                <p className="text-slate-400">Any special instructions? (Optional)</p>
              </div>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions or notes for your appointment..."
              className="w-full p-4 border border-white/20 rounded-xl resize-none h-32 bg-white/5 text-white placeholder-slate-400 focus:border-[#a6fe54]/50 focus:ring-2 focus:ring-[#a6fe54]/20"
            />
            {notes && isAutoPopulated && vehicleData.appointment?.notes && (
              <div className="mt-3 flex items-center gap-2 text-sm text-[#a6fe54] font-medium">
                <CheckCircle className="w-4 h-4" />
                Auto-filled from previous appointment
              </div>
            )}
          </div>

          {/* Summary */}
          {(appointmentType && selectedDate && selectedTime) && (
            <div className="bg-[#a6fe54]/10 border border-[#a6fe54]/30 rounded-2xl p-8 mb-12">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#a6fe54]" />
                Appointment Summary
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Type:</span>
                    <span className="text-white font-semibold">{appointmentType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Date:</span>
                    <span className="text-white font-semibold">{new Date(selectedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Time:</span>
                    <span className="text-white font-semibold">{selectedTime}</span>
                  </div>
                </div>
                {appointmentType === 'At-home pickup' && address && (
                  <div className="space-y-2">
                    <span className="text-slate-400 font-medium">Address:</span>
                    <div className="text-white font-semibold bg-white/5 p-3 rounded-xl">
                      {address}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="text-center">
            <div className="relative inline-block group">
              <Button
                onClick={handleScheduleAppointment}
                disabled={!appointmentType || !selectedDate || !selectedTime || saving}
                className={`relative font-black py-6 px-12 text-xl rounded-full transition-all duration-300 transform ${
                  appointmentType && selectedDate && selectedTime && !saving
                    ? 'bg-[#a6fe54] hover:bg-[#a6fe54]/80 text-black hover:scale-105'
                    : 'bg-white/10 text-slate-500 cursor-not-allowed border-2 border-white/10'
                }`}
              >
                {saving ? (
                  <span className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                    <span>{isAutoPopulated ? 'Updating...' : 'Scheduling...'}</span>
                  </span>
                ) : (appointmentType && selectedDate && selectedTime) ? (
                  <span className="flex items-center gap-3">
                    <Zap className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                    <span>{isAutoPopulated ? 'Update Appointment' : 'Confirm Appointment'}</span>
                    <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center group-hover:bg-black/30 transition-colors duration-300">
                      <span className="text-black font-bold text-xl">→</span>
                    </div>
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    <Calendar className="w-6 h-6" />
                    <span>Confirm Appointment</span>
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