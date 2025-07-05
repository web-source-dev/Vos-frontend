import { NextRequest, NextResponse } from 'next/server'

interface CustomerIntakeForm {
  customer: {
    firstName: string
    middleInitial: string
    lastName: string
    cellPhone: string
    homePhone: string
    email1: string
    email2: string
    email3: string
    hearAboutVOS: string
    receivedOtherQuote: boolean
    otherQuoteOfferer: string
    otherQuoteAmount: number
    notes: string
  }
  vehicle: {
    year: string
    make: string
    model: string
    currentMileage: string
    vin: string
    color: string
    bodyStyle: string
    licensePlate: string
    licenseState: string
    titleNumber: string
    titleStatus: 'clean' | 'salvage' | 'rebuilt' | 'lemon' | 'flood' | 'junk' | 'not-sure'
    loanStatus: 'paid-off' | 'still-has-loan' | 'not-sure'
    loanAmount: number
    secondSetOfKeys: boolean
    knownDefects: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CustomerIntakeForm = await request.json()

    // Validate required fields
    const requiredCustomerFields = ['firstName', 'lastName', 'cellPhone', 'email1']
    const requiredVehicleFields = ['year', 'make', 'model', 'currentMileage']

    for (const field of requiredCustomerFields) {
      if (!body.customer[field as keyof typeof body.customer]) {
        return NextResponse.json(
          { success: false, error: `Missing required customer field: ${field}` },
          { status: 400 }
        )
      }
    }

    for (const field of requiredVehicleFields) {
      if (!body.vehicle[field as keyof typeof body.vehicle]) {
        return NextResponse.json(
          { success: false, error: `Missing required vehicle field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Call backend API to create customer and case
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    
    const response = await fetch(`${apiUrl}/api/customer-intake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to create customer intake' },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, data: result.data })

  } catch (error) {
    console.error('Customer intake API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 