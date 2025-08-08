"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createVehicleSubmission } from '@/lib/customer'

export default function UnlockOffer() {
  const [activeTab, setActiveTab] = useState<'vin' | 'license'>('vin')
  const [vinNumber, setVinNumber] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 
    'Wisconsin', 'Wyoming'
  ]

  const handleNext = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Prepare data for creating vehicle submission
      const submissionData = {
        type: activeTab,
        value: activeTab === 'vin' ? vinNumber.trim() : licensePlate.trim(),
        state: selectedState || undefined
      };

      // Create database record first
      const result = await createVehicleSubmission(submissionData);
      
      if (result.success && result.data?.id) {
        // Navigate to next page with both the VIN/license and database ID
        if (activeTab === 'vin') {
          router.push(`/offer/vehicle-details?vin=${encodeURIComponent(vinNumber)}&state=${encodeURIComponent(selectedState)}&id=${result.data.id}`)
        } else {
          router.push(`/offer/vehicle-details?plate=${encodeURIComponent(licensePlate)}&state=${encodeURIComponent(selectedState)}&id=${result.data.id}`)
        }
      } else {
        console.error('Failed to create vehicle submission:', result.error);
        alert('Failed to create vehicle submission. Please try again.');
      }
    } catch (error) {
      console.error('Error creating vehicle submission:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const isNextDisabled = () => {
    if (isLoading) return true;
    
    if (activeTab === 'vin') {
      return !vinNumber.trim()
    } else {
      return !licensePlate.trim()
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Green Background */}
      <div className="w-1/2 bg-gradient-to-br from-green-400 to-green-500 flex flex-col justify-center items-center p-12 text-black">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-6">UNLOCK YOUR OFFER</h1>
          <p className="text-lg mb-8 leading-relaxed">
            Tell us a bit about your vehicle and we'll calculate a custom offer just for you.
          </p>
          
          {/* Tab Buttons */}
          <div className="flex mb-8 bg-white/20 rounded-full p-1">
            <button
              onClick={() => setActiveTab('vin')}
              className={`px-6 py-3 rounded-full transition-all ${
                activeTab === 'vin' 
                  ? 'bg-white text-black shadow-md' 
                  : 'text-black hover:bg-white/10'
              }`}
            >
              VIN
            </button>
            <button
              onClick={() => setActiveTab('license')}
              className={`px-6 py-3 rounded-full transition-all ${
                activeTab === 'license' 
                  ? 'bg-white text-black shadow-md' 
                  : 'text-black hover:bg-white/10'
              }`}
            >
              License Plate
            </button>
          </div>

          {/* Form */}
          <div className="bg-black rounded-3xl p-8 space-y-6">
            {activeTab === 'vin' ? (
              <input
                type="text"
                placeholder="VIN"
                value={vinNumber}
                onChange={(e) => setVinNumber(e.target.value.toUpperCase())}
                className="w-full px-4 py-4 rounded-full bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400"
                maxLength={17}
              />
            ) : (
              <input
                type="text"
                placeholder="License Plate"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                className="w-full px-4 py-4 rounded-full bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            )}
            
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-4 py-4 rounded-full bg-white text-black focus:outline-none focus:ring-2 focus:ring-green-400 appearance-none cursor-pointer"
            >
              <option value="">State (Optional)</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>

            <button
              onClick={handleNext}
              disabled={isNextDisabled()}
              className={`w-full py-4 rounded-full font-semibold transition-all ${
                isNextDisabled()
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-green-400 text-black hover:bg-green-300 shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoading ? 'Creating Record...' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Section - Black Background */}
      <div className="w-1/2 bg-black text-white flex flex-col justify-center items-center p-12">
        <div className="max-w-md">
          <h2 className="text-4xl font-bold mb-8 text-green-400">HOW IT WORKS</h2>
          <p className="text-lg mb-12 text-gray-300 leading-relaxed">
            Selling your car should be simple—here's how Vin On Spot makes it easy:
          </p>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-400 text-black rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-green-400 mb-2">Tell Us About Your Car</h3>
                <p className="text-gray-300 leading-relaxed">
                  Share a few key details about your vehicle, and we'll calculate a real offer just for you.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-400 text-black rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-green-400 mb-2">Pick a Pickup Time</h3>
                <p className="text-gray-300 leading-relaxed">
                  Choose the day and time that works best—we can come to you as soon as tomorrow.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-400 text-black rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-green-400 mb-2">Get Paid Instantly</h3>
                <p className="text-gray-300 leading-relaxed">
                  Once we do a quick check of the car, we'll hand you a check on the spot. No waiting, no hassle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}