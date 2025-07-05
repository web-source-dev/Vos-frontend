"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Phone, Mail, Clock, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CustomerIntakeSuccessPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800 mb-2">
              Thank You!
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Your information has been submitted successfully
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-3">What happens next?</h3>
              <div className="space-y-3 text-sm text-blue-700">
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>Our team will review your information within 24 hours</p>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>We&apos;ll contact you to schedule a vehicle inspection</p>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>You&apos;ll receive a detailed quote via email</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Need immediate assistance?</h4>
              <p className="text-sm text-gray-600 mb-3">
                If you have any questions or need to speak with someone right away, please don&apos;t hesitate to contact us.
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Phone:</strong> (555) 123-4567</p>
                <p><strong>Email:</strong> info@vos.com</p>
                <p><strong>Hours:</strong> Monday - Friday, 8:00 AM - 6:00 PM</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => router.push('/')}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              <Button 
                onClick={() => router.push('/customer-intake')}
                className="flex-1"
              >
                Submit Another Vehicle
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 