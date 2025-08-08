'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Smartphone } from 'lucide-react'
import { toast } from 'sonner'

interface MobilePopupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  submissionId: string
  existingMobile?: string
}

export default function MobilePopup({ isOpen, onClose, onSuccess, submissionId, existingMobile }: MobilePopupProps) {
  const [mobile, setMobile] = useState('')
  const [loading, setLoading] = useState(false)
  const [isAutoPopulated, setIsAutoPopulated] = useState(false)

  // Auto-populate mobile number when component opens
  useEffect(() => {
    if (isOpen && existingMobile && !mobile) {
      const formattedMobile = formatPhoneNumber(existingMobile)
      setMobile(formattedMobile)
      setIsAutoPopulated(true)
      console.log('Auto-populated mobile number:', formattedMobile)
    }
  }, [isOpen, existingMobile])

  if (!isOpen) return null

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/\D/g, '')
    
    // Limit to 10 digits
    const limitedPhoneNumber = phoneNumber.slice(0, 10)
    
    // Format as (XXX) XXX-XXXX
    if (limitedPhoneNumber.length >= 6) {
      return `(${limitedPhoneNumber.slice(0, 3)}) ${limitedPhoneNumber.slice(3, 6)}-${limitedPhoneNumber.slice(6)}`
    } else if (limitedPhoneNumber.length >= 3) {
      return `(${limitedPhoneNumber.slice(0, 3)}) ${limitedPhoneNumber.slice(3)}`
    } else {
      return limitedPhoneNumber
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value)
    setMobile(formattedValue)
    // Clear auto-populated state when user manually types
    if (isAutoPopulated) {
      setIsAutoPopulated(false)
    }
  }

  const validatePhone = () => {
    const phoneDigits = mobile.replace(/\D/g, '')
    if (phoneDigits.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePhone()) return

    setLoading(true)
    
    try {
      const phoneDigits = mobile.replace(/\D/g, '')
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://vos-backend-bh76.onrender.com' : 'http://localhost:5000')}/api/customer/vehicle-submission/${submissionId}/mobile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mobile: phoneDigits })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Mobile number saved successfully!')
        onSuccess()
      } else {
        toast.error(result.error || 'Failed to save mobile number')
      }
    } catch (error: any) {
      console.error('Mobile save error:', error)
      toast.error('Failed to save mobile number')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-white">
        <CardHeader className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Stay Updated
          </CardTitle>
          <p className="text-gray-600 text-center">
            {isAutoPopulated 
              ? 'We found your mobile number. Confirm or update it below.'
              : 'Enter your mobile number so we can keep you informed about your vehicle sale.'
            }
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="mobile">
                {isAutoPopulated ? 'Your mobile number' : 'Enter your mobile number'}
              </Label>
              <Input
                id="mobile"
                name="mobile"
                type="tel"
                value={mobile}
                onChange={handleInputChange}
                className="mt-1 text-lg"
                placeholder={isAutoPopulated ? "Mobile number (auto-filled)" : "(555) 123-4567"}
                required
              />
              {isAutoPopulated && (
                <p className="text-green-600 text-xs mt-2">
                  ✓ Mobile number auto-filled from your previous submission
                </p>
              )}
            </div>

          

            <Button
              type="submit"
              disabled={loading || !mobile.trim()}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3"
            >
              {loading ? 'Saving...' : 'Continue to Sale Details'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}