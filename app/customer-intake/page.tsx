"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Car, User, CheckCircle, Search, Loader2 } from 'lucide-react'

// Import API functions for VIN lookup
import api from '@/lib/api'

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
    hasTitleInPossession: boolean
    titleInOwnName: boolean
    knownDefects: string
    estimatedValue?: number
    pricingSource?: string
    pricingLastUpdated?: string
  }
}

const vehicleMakes = [
  'Acura', 'Alfa Romeo', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 'Buick', 'Cadillac',
  'Chevrolet', 'Chrysler', 'Citroen', 'Dodge', 'Ferrari', 'Fiat', 'Ford', 'Genesis',
  'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia', 'Lamborghini',
  'Land Rover', 'Lexus', 'Lincoln', 'Lotus', 'Maserati', 'Mazda', 'McLaren', 'Mercedes-Benz',
  'MINI', 'Mitsubishi', 'Nissan', 'Oldsmobile', 'Peugeot', 'Pontiac', 'Porsche', 'Ram',
  'Renault', 'Rolls-Royce', 'Saab', 'Saturn', 'Scion', 'Subaru', 'Suzuki', 'Tesla',
  'Toyota', 'Volkswagen', 'Volvo'
]

const vehicleModels: { [key: string]: string[] } = {
  'Acura': ['CL', 'ILX', 'Integra', 'Legend', 'MDX', 'NSX', 'RDX', 'RL', 'RSX', 'TL', 'TLX', 'TSX', 'ZDX'],
  'Alfa Romeo': ['4C', 'Giulia', 'Giulietta', 'Stelvio', 'Tonale'],
  'Aston Martin': ['DB11', 'DB12', 'DBS', 'Vantage', 'Virage'],
  'Audi': ['A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q3', 'Q4', 'Q5', 'Q7', 'Q8', 'RS', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'TT'],
  'Bentley': ['Bentayga', 'Continental', 'Flying Spur', 'Mulsanne'],
  'BMW': ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'i3', 'i4', 'i7', 'i8', 'M2', 'M3', 'M4', 'M5', 'M8', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4'],
  'Buick': ['Cascada', 'Enclave', 'Encore', 'Envision', 'LaCrosse', 'Regal', 'Rendezvous', 'Terraza'],
  'Cadillac': ['ATS', 'CT4', 'CT5', 'CT6', 'CTS', 'DTS', 'Escalade', 'SRX', 'STS', 'XLR', 'XT4', 'XT5', 'XT6'],
  'Chevrolet': ['Aveo', 'Blazer', 'Camaro', 'Caprice', 'Captiva', 'Cavalier', 'Cobalt', 'Colorado', 'Corvette', 'Cruze', 'Equinox', 'Express', 'HHR', 'Impala', 'Malibu', 'Monte Carlo', 'Prizm', 'S10', 'Silverado', 'Sonic', 'Spark', 'Suburban', 'Tahoe', 'Tracker', 'TrailBlazer', 'Traverse', 'Trax', 'Uplander', 'Venture'],
  'Chrysler': ['200', '300', '300M', 'Aspen', 'Cirrus', 'Concorde', 'Crossfire', 'Grand Voyager', 'LHS', 'New Yorker', 'Pacifica', 'PT Cruiser', 'Sebring', 'Town & Country', 'Voyager'],
  'Citroen': ['C3', 'C4', 'C5'],
  'Dodge': ['Avenger', 'Caliber', 'Caravan', 'Challenger', 'Charger', 'Dart', 'Durango', 'Grand Caravan', 'Intrepid', 'Journey', 'Magnum', 'Neon', 'Nitro', 'Ram', 'Shadow', 'Spirit', 'Stealth', 'Stratus', 'Viper'],
  'Ferrari': ['296', '488', '812', 'California', 'F8', 'FF', 'F12', 'GTC4Lusso', 'LaFerrari', 'Portofino', 'Roma', 'SF90'],
  'Fiat': ['500', '500L', '500X', '124 Spider'],
  'Ford': ['Bronco', 'Bronco Sport', 'C-Max', 'Contour', 'Crown Victoria', 'EcoSport', 'Edge', 'Escape', 'Expedition', 'Explorer', 'F-150', 'F-250', 'F-350', 'F-450', 'F-550', 'Fiesta', 'Five Hundred', 'Flex', 'Focus', 'Fusion', 'Galaxy', 'GT', 'Ka', 'Kuga', 'Maverick', 'Mondeo', 'Mustang', 'Puma', 'Ranger', 'S-Max', 'Taurus', 'Thunderbird', 'Transit', 'Windstar'],
  'Genesis': ['G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80'],
  'GMC': ['Acadia', 'Canyon', 'Envoy', 'Hummer H1', 'Hummer H2', 'Hummer H3', 'Jimmy', 'Safari', 'Savana', 'Sierra', 'Sonoma', 'Terrain', 'Yukon'],
  'Honda': ['Accord', 'Civic', 'Clarity', 'CR-V', 'CR-Z', 'Element', 'Fit', 'HR-V', 'Insight', 'Odyssey', 'Passport', 'Pilot', 'Prelude', 'Ridgeline', 'S2000'],
  'Hyundai': ['Accent', 'Azera', 'Elantra', 'Entourage', 'Equus', 'Genesis', 'Ioniq', 'Kona', 'Nexo', 'Palisade', 'Santa Cruz', 'Santa Fe', 'Sonata', 'Tiburon', 'Tucson', 'Veloster', 'Venue', 'Veracruz', 'XG'],
  'Infiniti': ['EX', 'FX', 'G', 'I', 'J', 'JX', 'M', 'Q30', 'Q40', 'Q50', 'Q60', 'Q70', 'QX30', 'QX50', 'QX55', 'QX60', 'QX70', 'QX80'],
  'Jaguar': ['E-Pace', 'F-Pace', 'F-Type', 'I-Pace', 'S-Type', 'X-Type', 'XE', 'XF', 'XJ', 'XK'],
  'Jeep': ['Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Liberty', 'Patriot', 'Renegade', 'Wrangler'],
  'Kia': ['Amanti', 'Borrego', 'Cadenza', 'Carens', 'Ceed', 'Cerato', 'Forte', 'K5', 'K900', 'Magentis', 'Mohave', 'Niro', 'Optima', 'Picanto', 'ProCeed', 'Rio', 'Sedona', 'Seltos', 'Sorento', 'Soul', 'Spectra', 'Sportage', 'Stinger', 'Telluride'],
  'Lamborghini': ['Aventador', 'Countach', 'Diablo', 'Gallardo', 'Huracan', 'Murcielago', 'Reventon', 'Urus', 'Veneno'],
  'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Evoque', 'Freelander', 'LR2', 'LR3', 'LR4', 'Range Rover', 'Range Rover Sport', 'Range Rover Velar'],
  'Lexus': ['CT', 'ES', 'GS', 'HS', 'IS', 'LC', 'LFA', 'LS', 'LX', 'NX', 'RC', 'RX', 'SC', 'UX'],
  'Lincoln': ['Aviator', 'Blackwood', 'Continental', 'Corsair', 'LS', 'Mark LT', 'Mark VIII', 'MKC', 'MKS', 'MKT', 'MKX', 'MKZ', 'Navigator', 'Town Car', 'Zephyr'],
  'Lotus': ['Elise', 'Europa', 'Evora', 'Exige'],
  'Maserati': ['Ghibli', 'GranTurismo', 'Levante', 'MC20', 'Quattroporte'],
  'Mazda': ['2', '3', '5', '6', 'CX-3', 'CX-30', 'CX-5', 'CX-7', 'CX-9', 'MX-30', 'MX-5', 'MX-6', 'Protege', 'RX-7', 'RX-8', 'Tribute'],
  'McLaren': ['540C', '570S', '600LT', '650S', '675LT', '720S', '750S', '765LT', 'Artura', 'F1', 'GT', 'P1', 'Senna'],
  'Mercedes-Benz': ['A-Class', 'B-Class', 'C-Class', 'CLA', 'CLS', 'E-Class', 'G-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLK', 'GLS', 'M-Class', 'R-Class', 'S-Class', 'SL', 'SLC', 'SLK', 'SLS', 'Sprinter', 'V-Class'],
  'MINI': ['Clubman', 'Countryman', 'Coupe', 'Hardtop', 'Paceman', 'Roadster'],
  'Mitsubishi': ['3000GT', 'Diamante', 'Eclipse', 'Endeavor', 'Galant', 'i-MiEV', 'Lancer', 'Mirage', 'Montero', 'Outlander', 'Pajero', 'Raider'],
  'Nissan': ['350Z', '370Z', 'Altima', 'Armada', 'Frontier', 'GT-R', 'Juke', 'Leaf', 'Maxima', 'Murano', 'NV', 'Pathfinder', 'Quest', 'Rogue', 'Sentra', 'Titan', 'Versa', 'Xterra'],
  'Oldsmobile': ['Alero', 'Aurora', 'Bravada', 'Cutlass', 'Intrigue', 'Silhouette'],
  'Peugeot': ['2008', '3008', '5008', '508'],
  'Pontiac': ['Aztek', 'Bonneville', 'Firebird', 'G3', 'G5', 'G6', 'G8', 'Grand Am', 'Grand Prix', 'GTO', 'Montana', 'Solstice', 'Sunfire', 'Torrent', 'Vibe'],
  'Porsche': ['911', '918', '924', '928', '944', '968', 'Boxster', 'Cayenne', 'Cayman', 'Macan', 'Panamera', 'Taycan'],
  'Ram': ['1500', '2500', '3500', 'ProMaster', 'ProMaster City'],
  'Renault': ['Clio', 'Megane', 'Zoe'],
  'Rolls-Royce': ['Cullinan', 'Dawn', 'Ghost', 'Phantom', 'Wraith'],
  'Saab': ['9-3', '9-5', '9-7X'],
  'Saturn': ['Aura', 'Ion', 'Outlook', 'Relay', 'Sky', 'Vue'],
  'Scion': ['FR-S', 'iA', 'iM', 'iQ', 'tC', 'xA', 'xB', 'xD'],
  'Subaru': ['Ascent', 'BRZ', 'Crosstrek', 'Forester', 'Impreza', 'Legacy', 'Outback', 'SVX', 'Tribeca', 'WRX', 'XV'],
  'Suzuki': ['Aerio', 'Equator', 'Forenza', 'Grand Vitara', 'Kizashi', 'Reno', 'SX4', 'Verona', 'XL-7'],
  'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y', 'Roadster'],
  'Toyota': ['4Runner', '86', 'Avalon', 'Camry', 'Celica', 'Corolla', 'Cressida', 'Echo', 'FJ Cruiser', 'Highlander', 'Land Cruiser', 'Matrix', 'MR2', 'Paseo', 'Previa', 'Prius', 'Prius C', 'Prius V', 'RAV4', 'Sequoia', 'Sienna', 'Solara', 'Supra', 'Tacoma', 'Tercel', 'Tundra', 'Venza', 'Yaris'],
  'Volkswagen': ['Arteon', 'Atlas', 'Beetle', 'CC', 'Eos', 'Golf', 'GTI', 'Jetta', 'Passat', 'Phaeton', 'Polo', 'Routan', 'Scirocco', 'Tiguan', 'Touareg', 'Touran'],
  'Volvo': ['C30', 'C70', 'S40', 'S60', 'S70', 'S80', 'S90', 'V40', 'V50', 'V60', 'V70', 'V90', 'XC40', 'XC60', 'XC70', 'XC90']
}

const states = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

export default function CustomerIntakePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingVinData, setIsLoadingVinData] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<CustomerIntakeForm>({
    customer: {
      firstName: '',
      middleInitial: '',
      lastName: '',
      cellPhone: '',
      homePhone: '',
      email1: '',
      email2: '',
      email3: '',
      hearAboutVOS: '',
      receivedOtherQuote: false,
      otherQuoteOfferer: '',
      otherQuoteAmount: 0,
      notes: ''
    },
    vehicle: {
      year: '',
      make: '',
      model: '',
      currentMileage: '',
      vin: '',
      color: '',
      bodyStyle: '',
      licensePlate: '',
      licenseState: '',
      titleNumber: '',
      titleStatus: 'clean',
      loanStatus: 'paid-off',
      loanAmount: 0,
      secondSetOfKeys: false,
      hasTitleInPossession: false,
      titleInOwnName: false,
      knownDefects: ''
    }
  })

  const handleCustomerChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      customer: {
        ...prev.customer,
        [field]: value
      }
    }))
  }

  const handleVehicleChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      vehicle: {
        ...prev.vehicle,
        [field]: value
      }
    }))
  }

  const handleMakeChange = (make: string) => {
    setFormData(prev => ({
      ...prev,
      vehicle: {
        ...prev.vehicle,
        make,
        model: '' // Reset model when make changes
      }
    }))
  }

  // Function to fetch vehicle data by VIN
  const fetchVehicleByVIN = useCallback(async (vin: string) => {
    if (!vin || vin.length < 17) {
      return; // Don't attempt lookup if VIN is invalid
    }

    setIsLoadingVinData(true);

    try {
      // First, get vehicle pricing for estimated value
      const pricingResponse = await api.getVehiclePricing(vin);
      const estimatedValue = pricingResponse.success ? pricingResponse.data?.estimatedValue : undefined;

      // Second, get vehicle specifications 
      const specsResponse = await api.getVehicleSpecs(vin);

      if (specsResponse.success && specsResponse.data) {
        toast({
          title: "Vehicle information retrieved",
          description: "Successfully retrieved vehicle information from VIN"
        });

        const { year, make, model, exterior_color, body_style } = specsResponse.data;

        // Update form with retrieved vehicle specs and pricing
        setFormData(prev => ({
          ...prev,
          vehicle: {
            ...prev.vehicle,
            year: year || prev.vehicle.year,
            make: make || prev.vehicle.make,
            model: model || prev.vehicle.model,
            color: exterior_color || prev.vehicle.color,
            bodyStyle: body_style || prev.vehicle.bodyStyle,
            vin,
            estimatedValue,
            pricingSource: 'MarketCheck API',
            pricingLastUpdated: new Date().toISOString()
          }
        }));
      } else if (pricingResponse.success && pricingResponse.data?.estimatedValue) {
        // At least update the estimated value if specs lookup failed
        setFormData(prev => ({
          ...prev,
          vehicle: {
            ...prev.vehicle,
            estimatedValue,
            pricingSource: 'MarketCheck API',
            pricingLastUpdated: new Date().toISOString()
          }
        }));

        toast({
          title: "Partial vehicle information retrieved",
          description: "Got pricing data but couldn't retrieve full vehicle details."
        });
      } else {
        // Both lookups failed
        toast({
          title: "Vehicle information lookup failed",
          description: "Could not retrieve vehicle details from VIN. Please enter details manually.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching vehicle data by VIN:', error);
      toast({
        title: "Error",
        description: "Failed to look up vehicle by VIN. Please enter details manually.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingVinData(false);
    }
  }, [toast]);

  // Watch for VIN changes to auto-lookup
  useEffect(() => {
    // Debounce the VIN lookup to avoid excessive API calls
    const vinTimer = setTimeout(() => {
      const vin = formData.vehicle?.vin?.trim();
      if (vin && vin.length === 17) { // Standard VIN length is 17 characters
        fetchVehicleByVIN(vin);
      }
    }, 1000);

    return () => clearTimeout(vinTimer);
  }, [formData.vehicle.vin, fetchVehicleByVIN]);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.customer.firstName && formData.customer.lastName && formData.customer.cellPhone && formData.customer.email1)
      case 2:
        return !!(formData.vehicle.year && formData.vehicle.make && formData.vehicle.model && formData.vehicle.currentMileage)
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1)
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      })
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/customer-intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success!",
          description: "Your information has been submitted successfully. We'll contact you soon!",
        })
        
        // Redirect to success page or show success message
        setTimeout(() => {
          router.push('/customer-intake/success')
        }, 2000)
      } else {
        throw new Error(result.error || 'Failed to submit form')
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast({
        title: "Submission Error",
        description: "There was an error submitting your information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderCustomerStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <User className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Customer Information</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.customer.firstName}
            onChange={(e) => handleCustomerChange('firstName', e.target.value)}
            placeholder="Enter first name"
          />
        </div>

        <div>
          <Label htmlFor="middleInitial">Middle Initial</Label>
          <Input
            id="middleInitial"
            value={formData.customer.middleInitial}
            onChange={(e) => handleCustomerChange('middleInitial', e.target.value)}
            placeholder="M"
            maxLength={1}
          />
        </div>

        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.customer.lastName}
            onChange={(e) => handleCustomerChange('lastName', e.target.value)}
            placeholder="Enter last name"
          />
        </div>

        <div>
          <Label htmlFor="cellPhone">Cell Phone *</Label>
          <Input
            id="cellPhone"
            value={formData.customer.cellPhone}
            onChange={(e) => handleCustomerChange('cellPhone', e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <Label htmlFor="homePhone">Home Phone</Label>
          <Input
            id="homePhone"
            value={formData.customer.homePhone}
            onChange={(e) => handleCustomerChange('homePhone', e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <Label htmlFor="email1">Primary Email *</Label>
          <Input
            id="email1"
            type="email"
            value={formData.customer.email1}
            onChange={(e) => handleCustomerChange('email1', e.target.value)}
            placeholder="your.email@example.com"
          />
        </div>

        <div>
          <Label htmlFor="email2">Secondary Email</Label>
          <Input
            id="email2"
            type="email"
            value={formData.customer.email2}
            onChange={(e) => handleCustomerChange('email2', e.target.value)}
            placeholder="alternate.email@example.com"
          />
        </div>

        <div>
          <Label htmlFor="email3">Additional Email</Label>
          <Input
            id="email3"
            type="email"
            value={formData.customer.email3}
            onChange={(e) => handleCustomerChange('email3', e.target.value)}
            placeholder="another.email@example.com"
          />
        </div>

        <div>
          <Label htmlFor="hearAboutVOS">How did you hear about VOS?</Label>
          <Select value={formData.customer.hearAboutVOS} onValueChange={(value) => handleCustomerChange('hearAboutVOS', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google">Google Search</SelectItem>
              <SelectItem value="social-media">Social Media</SelectItem>
              <SelectItem value="friend-family">Friend/Family</SelectItem>
              <SelectItem value="advertisement">Advertisement</SelectItem>
              <SelectItem value="walk-in">Walk-in</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="receivedOtherQuote"
            checked={formData.customer.receivedOtherQuote}
            onCheckedChange={(checked) => handleCustomerChange('receivedOtherQuote', checked as boolean)}
          />
          <Label htmlFor="receivedOtherQuote">Have you received a quote from another company?</Label>
        </div>

        {formData.customer.receivedOtherQuote && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="otherQuoteOfferer">Company Name</Label>
              <Input
                id="otherQuoteOfferer"
                value={formData.customer.otherQuoteOfferer}
                onChange={(e) => handleCustomerChange('otherQuoteOfferer', e.target.value)}
                placeholder="Company name"
              />
            </div>
            <div>
              <Label htmlFor="otherQuoteAmount">Quote Amount</Label>
              <Input
                id="otherQuoteAmount"
                type="number"
                value={formData.customer.otherQuoteAmount}
                onChange={(e) => handleCustomerChange('otherQuoteAmount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          value={formData.customer.notes}
          onChange={(e) => handleCustomerChange('notes', e.target.value)}
          placeholder="Any additional information you'd like to share..."
          rows={3}
        />
      </div>
    </div>
  )

  const renderVehicleStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Car className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Vehicle Information</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="year">Year *</Label>
          <Input
            id="year"
            value={formData.vehicle.year}
            onChange={(e) => handleVehicleChange('year', e.target.value)}
            placeholder="2020"
            type="number"
            min="1900"
            max={new Date().getFullYear() + 1}
          />
        </div>

        <div>
          <Label htmlFor="make">Make *</Label>
          <Select value={formData.vehicle.make} onValueChange={handleMakeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select make" />
            </SelectTrigger>
            <SelectContent>
              {vehicleMakes.map((make) => (
                <SelectItem key={make} value={make}>
                  {make}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="model">Model *</Label>
          <Select 
            value={formData.vehicle.model} 
            onValueChange={(value) => handleVehicleChange('model', value)}
            disabled={!formData.vehicle.make}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {formData.vehicle.make && vehicleModels[formData.vehicle.make]?.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* VIN moved to the top for auto-population */}
      <div className="space-y-2">
        <Label htmlFor="vin">
          VIN Number
          <span className="text-sm text-muted-foreground ml-2">(Enter VIN to auto-populate vehicle details)</span>
        </Label>
        <div className="relative">
          <Input
            id="vin"
            value={formData.vehicle.vin}
            onChange={(e) => handleVehicleChange('vin', e.target.value.toUpperCase())}
            placeholder="1HGBH41JXMN109186"
            maxLength={17}
            className="pr-10"
          />
          {isLoadingVinData && (
            <div className="absolute right-2 top-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoadingVinData && formData.vehicle.vin && (
            <div className="absolute right-2 top-2">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currentMileage">Current Mileage *</Label>
          <Input
            id="currentMileage"
            value={formData.vehicle.currentMileage}
            onChange={(e) => handleVehicleChange('currentMileage', e.target.value)}
            placeholder="50000"
            type="number"
          />
        </div>

        <div>
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            value={formData.vehicle.color}
            onChange={(e) => handleVehicleChange('color', e.target.value)}
            placeholder="Red"
          />
        </div>

        <div>
          <Label htmlFor="bodyStyle">Body Style</Label>
          <Select value={formData.vehicle.bodyStyle} onValueChange={(value) => handleVehicleChange('bodyStyle', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select body style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sedan">Sedan</SelectItem>
              <SelectItem value="suv">SUV</SelectItem>
              <SelectItem value="truck">Truck</SelectItem>
              <SelectItem value="coupe">Coupe</SelectItem>
              <SelectItem value="convertible">Convertible</SelectItem>
              <SelectItem value="wagon">Wagon</SelectItem>
              <SelectItem value="hatchback">Hatchback</SelectItem>
              <SelectItem value="minivan">Minivan</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="licensePlate">License Plate</Label>
          <Input
            id="licensePlate"
            value={formData.vehicle.licensePlate}
            onChange={(e) => handleVehicleChange('licensePlate', e.target.value.toUpperCase())}
            placeholder="ABC123"
          />
        </div>

        <div>
          <Label htmlFor="licenseState">License State</Label>
          <Select value={formData.vehicle.licenseState} onValueChange={(value) => handleVehicleChange('licenseState', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="titleNumber">Title Number</Label>
          <Input
            id="titleNumber"
            value={formData.vehicle.titleNumber}
            onChange={(e) => handleVehicleChange('titleNumber', e.target.value)}
            placeholder="Title number"
          />
        </div>

        <div>
          <Label htmlFor="titleStatus">Title Status</Label>
          <Select value={formData.vehicle.titleStatus} onValueChange={(value) => handleVehicleChange('titleStatus', value as 'clean' | 'salvage' | 'rebuilt' | 'lemon' | 'flood' | 'junk' | 'not-sure')}>
            <SelectTrigger>
              <SelectValue placeholder="Select title status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clean">Clean</SelectItem>
              <SelectItem value="salvage">Salvage</SelectItem>
              <SelectItem value="rebuilt">Rebuilt</SelectItem>
              <SelectItem value="lemon">Lemon</SelectItem>
              <SelectItem value="flood">Flood</SelectItem>
              <SelectItem value="junk">Junk</SelectItem>
              <SelectItem value="not-sure">Not Sure</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="loanStatus">Loan Status</Label>
          <Select value={formData.vehicle.loanStatus} onValueChange={(value) => handleVehicleChange('loanStatus', value as 'paid-off' | 'still-has-loan' | 'not-sure')}>
            <SelectTrigger>
              <SelectValue placeholder="Select loan status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paid-off">Paid Off</SelectItem>
              <SelectItem value="still-has-loan">Still Has Loan</SelectItem>
              <SelectItem value="not-sure">Not Sure</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.vehicle.loanStatus === 'still-has-loan' && (
          <div>
            <Label htmlFor="loanAmount">Loan Amount</Label>
            <Input
              id="loanAmount"
              type="number"
              value={formData.vehicle.loanAmount}
              onChange={(e) => handleVehicleChange('loanAmount', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
        )}
      </div>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="secondSetOfKeys"
            checked={formData.vehicle.secondSetOfKeys}
            onCheckedChange={(checked) => handleVehicleChange('secondSetOfKeys', checked as boolean)}
          />
          <Label htmlFor="secondSetOfKeys">Do you have a second set of keys?</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="hasTitleInPossession"
            checked={formData.vehicle.hasTitleInPossession}
            onCheckedChange={(checked) => handleVehicleChange('hasTitleInPossession', checked as boolean)}
          />
          <Label htmlFor="hasTitleInPossession">Do you have the title in your possession?</Label>
        </div>

        {formData.vehicle.hasTitleInPossession && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="titleInOwnName">Is the title in your own name?</Label>
              <Select value={formData.vehicle.titleInOwnName ? 'yes' : 'no'} onValueChange={(value) => handleVehicleChange('titleInOwnName', value === 'yes')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.vehicle.titleInOwnName && (
              <div>
                <Label htmlFor="titleNumber">Title Number</Label>
                <Input
                  id="titleNumber"
                  value={formData.vehicle.titleNumber}
                  onChange={(e) => handleVehicleChange('titleNumber', e.target.value)}
                  placeholder="Title number"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="knownDefects">Known Defects or Issues</Label>
        <Textarea
          id="knownDefects"
          value={formData.vehicle.knownDefects}
          onChange={(e) => handleVehicleChange('knownDefects', e.target.value)}
          placeholder="Describe any known defects, issues, or problems with the vehicle..."
          rows={3}
        />
      </div>
    </div>
  )

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <CheckCircle className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Review Your Information</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Name:</strong> {formData.customer.firstName} {formData.customer.middleInitial} {formData.customer.lastName}</p>
            <p><strong>Phone:</strong> {formData.customer.cellPhone}</p>
            <p><strong>Email:</strong> {formData.customer.email1}</p>
            {formData.customer.hearAboutVOS && <p><strong>Heard about VOS:</strong> {formData.customer.hearAboutVOS}</p>}
            {formData.customer.receivedOtherQuote && (
              <p><strong>Other quote:</strong> {formData.customer.otherQuoteOfferer} - ${formData.customer.otherQuoteAmount}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Vehicle:</strong> {formData.vehicle.year} {formData.vehicle.make} {formData.vehicle.model}</p>
            <p><strong>Mileage:</strong> {formData.vehicle.currentMileage}</p>
            {formData.vehicle.vin && <p><strong>VIN:</strong> {formData.vehicle.vin}</p>}
            {formData.vehicle.color && <p><strong>Color:</strong> {formData.vehicle.color}</p>}
            <p><strong>Title Status:</strong> {formData.vehicle.titleStatus}</p>
            <p><strong>Loan Status:</strong> {formData.vehicle.loanStatus}</p>
            {formData.vehicle.secondSetOfKeys && <p><strong>Second Set of Keys:</strong> Yes</p>}
          </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-blue-800 text-sm">
          <strong>Next Steps:</strong> After submitting, our team will review your information and contact you within 24 hours to schedule an inspection and provide a quote.
        </p>
      </div>
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderCustomerStep()
      case 2:
        return renderVehicleStep()
      case 3:
        return renderReviewStep()
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Vehicle Intake Form</h1>
            <p className="text-gray-600">Please provide your information to get started with your vehicle appraisal</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 space-x-8 text-sm text-gray-600">
            <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : ''}>Customer Info</span>
            <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : ''}>Vehicle Info</span>
            <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : ''}>Review</span>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {renderStepContent()}

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Back
              </Button>

              <div className="flex gap-2">
                {currentStep < 3 ? (
                  <Button onClick={handleNext}>
                    Next
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 