'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createVehicleSubmission, updateVehicleInfo, updateVehicleBasics, updateVehicleCondition, getVehicleSubmission } from '@/lib/customer'
import { toast } from 'sonner'
import { getVehicleMakesAndModels } from '@/lib/api'
import { CarImageDisplay } from '@/components/CarImageDisplay'

export default function VehicleDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
            <p>Loading vehicle information...</p>
          </div>
        </div>
      }
    >
      <VehicleDetailsPageContent />
    </Suspense>
  )
}

function VehicleDetailsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get URL parameters
  const vin = searchParams.get('vin')
  const plate = searchParams.get('plate')
  const state = searchParams.get('state')
  const id = searchParams.get('id') // Get the database ID from URL

  const [submissionId, setSubmissionId] = useState<string>(id || '')
  const [loading, setLoading] = useState(false)
  const [vehicleData, setVehicleData] = useState<any>({})

  // Vehicle makes and models data
  const [vehicleMakes, setVehicleMakes] = useState<string[]>([])
  const [vehicleModels, setVehicleModels] = useState<{ [key: string]: string[] }>({})
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [isLoadingVehicleData, setIsLoadingVehicleData] = useState(false)

  // Vehicle basic info state (editable)
  const [selectedMake, setSelectedMake] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedYear, setSelectedYear] = useState('')

  // Form state for Step 1 - Basic Vehicle Info
  const [mileage, setMileage] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [color, setColor] = useState('')
  const [transmission, setTransmission] = useState('')
  const [drivetrain, setDrivetrain] = useState('')
  const [engine, setEngine] = useState('')
  const [loanLeaseStatus, setLoanLeaseStatus] = useState('')

  // Loan details state
  const [lenderName, setLenderName] = useState('')
  const [loanBalance, setLoanBalance] = useState('')
  const [loanMonthlyPayment, setLoanMonthlyPayment] = useState('')

  // Lease details state
  const [leasingCompany, setLeasingCompany] = useState('')
  const [leasePayoff, setLeasePayoff] = useState('')
  const [leaseMonthlyPayment, setLeaseMonthlyPayment] = useState('')

  // Form state for Step 2 - Vehicle Condition
  const [accidentHistory, setAccidentHistory] = useState('')
  const [isDrivable, setIsDrivable] = useState<boolean | null>(null)
  const [mechanicalIssues, setMechanicalIssues] = useState<string[]>([])
  const [engineIssues, setEngineIssues] = useState<string[]>([])
  const [exteriorDamage, setExteriorDamage] = useState<string[]>([])
  const [interiorCondition, setInteriorCondition] = useState<string[]>([])
  const [windshieldCondition, setWindshieldCondition] = useState('')
  const [sunroofCondition, setSunroofCondition] = useState('')
  const [tiresReplaced, setTiresReplaced] = useState('')
  const [hasModifications, setHasModifications] = useState<boolean | null>(null)
  const [smokedIn, setSmokedIn] = useState<boolean | null>(null)
  const [keyCount, setKeyCount] = useState('')
  const [overallCondition, setOverallCondition] = useState('')

  // Load vehicle makes and models from API
  useEffect(() => {
    const loadVehicleData = async () => {
      setIsLoadingVehicleData(true);
      try {
        const response = await getVehicleMakesAndModels();
        if (response.success && response.data) {
          setVehicleMakes(response.data.makes);
          setVehicleModels(response.data.models);
        }
      } catch (error) {
        console.error('Error loading vehicle data:', error);
        // Fallback to default data if API fails
        setVehicleMakes([
          'Acura', 'Alfa Romeo', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 'Buick', 'Cadillac',
          'Chevrolet', 'Chrysler', 'Dodge', 'Ferrari', 'Fiat', 'Ford', 'Genesis',
          'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia', 'Lamborghini',
          'Land Rover', 'Lexus', 'Lincoln', 'Maserati', 'Mazda', 'Mercedes-Benz',
          'MINI', 'Mitsubishi', 'Nissan', 'Porsche', 'Ram', 'Subaru', 'Tesla',
          'Toyota', 'Volkswagen', 'Volvo'
        ]);
      } finally {
        setIsLoadingVehicleData(false);
      }
    };

    loadVehicleData();
  }, []);

  useEffect(() => {
    // Just validate that we have VIN or license plate from URL
    if (!vin && !plate) {
      router.push('/offer')
      return
    }

    // If we have an ID, load the existing vehicle data first
    if (id) {
      loadExistingVehicleData(id);
    } else {
      // If VIN is provided, fetch vehicle specs immediately
      if (vin) {
        fetchVehicleSpecs(vin);
      } else if (plate) {
        // For license plate, just set basic data
        setVehicleData({
          vinOrPlate: {
            vin: '',
            make: '',
            model: '',
            year: 0,
            trim: '',
            transmission: '',
            licensePlate: plate
          }
        });
      }
    }
  }, [vin, plate, id, router])

  // Update available models when make changes
  useEffect(() => {
    if (selectedMake && vehicleModels[selectedMake]) {
      setAvailableModels(vehicleModels[selectedMake]);
    } else {
      setAvailableModels([]);
    }
    // Clear model selection when make changes
    if (selectedMake !== vehicleData?.vinOrPlate?.make) {
      setSelectedModel('');
    }
  }, [selectedMake, vehicleModels, vehicleData?.vinOrPlate?.make])

  // Update form fields when vehicle data changes
  useEffect(() => {
    if (vehicleData?.vinOrPlate) {
      setSelectedMake(vehicleData.vinOrPlate.make || '');
      setSelectedModel(vehicleData.vinOrPlate.model || '');
      setSelectedYear(vehicleData.vinOrPlate.year ? vehicleData.vinOrPlate.year.toString() : '');
    }
  }, [vehicleData])

  const loadExistingVehicleData = async (submissionId: string) => {
    try {
      setLoading(true);
      console.log('Loading existing vehicle data for ID:', submissionId);

      const result = await getVehicleSubmission(submissionId);

      if (result.success && result.data) {
        setVehicleData(result.data);

        // Pre-populate form fields if data exists
        const data = result.data;

        // Set vehicle basic info
        if (data.vinOrPlate) {
          setSelectedMake(data.vinOrPlate.make || '');
          setSelectedModel(data.vinOrPlate.model || '');
          setSelectedYear(data.vinOrPlate.year ? data.vinOrPlate.year.toString() : '');
          // Auto-fill transmission from VIN data if not already set in basics
          if (data.vinOrPlate.transmission && !data.basics?.transmission) {
            setTransmission(data.vinOrPlate.transmission);
          }
        }

        if (data.basics) {
          setMileage(data.basics.mileage?.toString() || '');
          setZipCode(data.basics.zipCode || '');
          setColor(data.basics.color || '');
          setTransmission(data.basics.transmission || '');
          setDrivetrain(data.basics.drivetrain || '');
          setEngine(data.basics.engine || '');
          setLoanLeaseStatus(data.basics.loanLeaseStatus || '');

          if (data.basics.loanDetails) {
            setLenderName(data.basics.loanDetails.lenderName || '');
            setLoanBalance(data.basics.loanDetails.loanBalance?.toString() || '');
            setLoanMonthlyPayment(data.basics.loanDetails.monthlyPayment?.toString() || '');
          }

          if (data.basics.leaseDetails) {
            setLeasingCompany(data.basics.leaseDetails.leasingCompany || '');
            setLeasePayoff(data.basics.leaseDetails.leasePayoff?.toString() || '');
            setLeaseMonthlyPayment(data.basics.leaseDetails.monthlyPayment?.toString() || '');
          }
        }

        if (data.condition) {
          setAccidentHistory(data.condition.accidentHistory || '');
          setIsDrivable(data.condition.isDrivable ?? null);
          setMechanicalIssues(data.condition.mechanicalIssues || []);
          setEngineIssues(data.condition.engineIssues || []);
          setExteriorDamage(data.condition.exteriorDamage || []);
          setInteriorCondition(data.condition.interiorCondition || []);
          setWindshieldCondition(data.condition.windshieldCondition || '');
          setSunroofCondition(data.condition.sunroofCondition || '');
          setTiresReplaced(data.condition.tiresReplaced?.toString() || '');
          setHasModifications(data.condition.hasModifications ?? null);
          setSmokedIn(data.condition.smokedIn ?? null);
          setKeyCount(data.condition.keyCount?.toString() || '');
          setOverallCondition(data.condition.overallCondition || '');
        }

        console.log('Existing vehicle data loaded successfully');
      } else {
        console.error('Failed to load existing vehicle data:', result.error);
        // If loading fails, fallback to fetching specs if VIN is available
        if (vin) {
          fetchVehicleSpecs(vin);
        }
      }
    } catch (error) {
      console.error('Error loading existing vehicle data:', error);
      // If loading fails, fallback to fetching specs if VIN is available
      if (vin) {
        fetchVehicleSpecs(vin);
      }
    } finally {
      setLoading(false);
    }
  }

  const fetchVehicleSpecs = async (vinNumber: string) => {
    try {
      setLoading(true);
      console.log('Fetching vehicle specs for VIN:', vinNumber);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://vos-backend-bh76.onrender.com' : 'http://localhost:5000')}/api/vehicle/specs/${vinNumber}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const result = await response.json();
      console.log('Vehicle specs response:', result);

      if (result.success && result.data) {
        const vehicleInfo = {
          vinOrPlate: {
            vin: vinNumber,
            make: result.data.make || '',
            model: result.data.model || '',
            year: result.data.year ? parseInt(result.data.year) : 0,
            trim: result.data.trim || '',
            transmission: result.data.transmission || '',
            licensePlate: ''
          }
        };
        setVehicleData(vehicleInfo);
        // Set the dropdown values
        setSelectedMake(result.data.make || '');
        setSelectedModel(result.data.model || '');
        setSelectedYear(result.data.year ? result.data.year.toString() : '');
        // Auto-fill transmission if available
        if (result.data.transmission) {
          setTransmission(result.data.transmission);
        }
        toast.success('Vehicle information loaded from VIN');
      } else {
        console.warn('Failed to fetch vehicle specs:', result);
        // Set basic VIN data even if API fails
        const fallbackInfo = {
          vinOrPlate: {
            vin: vinNumber,
            make: 'Unknown',
            model: 'Unknown',
            year: 0,
            trim: '',
            transmission: '',
            licensePlate: ''
          }
        };
        setVehicleData(fallbackInfo);
        setSelectedMake('Unknown');
        setSelectedModel('Unknown');
        setSelectedYear('');
        toast.error('Could not auto-populate vehicle details. Please enter manually.');
      }
    } catch (error) {
      console.error('Error fetching vehicle specs:', error);
      // Set basic VIN data even if fetch fails
      const fallbackInfo = {
        vinOrPlate: {
          vin: vinNumber,
          make: 'Unknown',
          model: 'Unknown',
          year: 0,
          trim: '',
          transmission: '',
          licensePlate: ''
        }
      };
      setVehicleData(fallbackInfo);
      setSelectedMake('Unknown');
      setSelectedModel('Unknown');
      setSelectedYear('');
      toast.error('Could not auto-populate vehicle details. Please enter manually.');
    } finally {
      setLoading(false);
    }
  }

  const toggleArrayValue = (array: string[], value: string, setArray: (arr: string[]) => void) => {
    if (array.includes(value)) {
      setArray(array.filter(item => item !== value))
    } else {
      setArray([...array, value])
    }
  }

  const handleGetMyOffer = async () => {
    console.log('Updating existing vehicle submission with new data...')
    setLoading(true)

    try {
      // Ensure we have a submission ID
      if (!submissionId) {
        toast.error('No vehicle submission found. Please start over.')
        router.push('/offer')
        return
      }

      console.log('Updating submission with ID:', submissionId)

      // Step 0: Update vehicle basic info (make, model, year) if changed
      const currentVehicleInfo = vehicleData?.vinOrPlate;
      const hasVehicleInfoChanged =
        selectedMake !== currentVehicleInfo?.make ||
        selectedModel !== currentVehicleInfo?.model ||
        selectedYear !== currentVehicleInfo?.year?.toString();

      if (hasVehicleInfoChanged) {
        console.log('Vehicle info has changed, updating...')
        const vehicleInfoData = {
          make: selectedMake,
          model: selectedModel,
          year: selectedYear ? parseInt(selectedYear) : undefined
        };

        const vehicleInfoResult = await updateVehicleInfo(submissionId, vehicleInfoData);
        if (!vehicleInfoResult.success) {
          console.error('Failed to update vehicle info:', vehicleInfoResult);
          throw new Error(vehicleInfoResult.error);
        }
        console.log('Vehicle info updated successfully');

        // Update local state
        const updatedVehicleData = {
          ...vehicleData,
          vinOrPlate: {
            ...currentVehicleInfo,
            make: selectedMake,
            model: selectedModel,
            year: selectedYear ? parseInt(selectedYear) : 0
          }
        };
        setVehicleData(updatedVehicleData);
      }

      // Step 1: Update basics
      const basicsData = {
        mileage: mileage ? parseInt(mileage) : undefined,
        zipCode,
        color,
        transmission,
        drivetrain,
        engine,
        loanLeaseStatus,
        loanDetails: loanLeaseStatus === "I'm financing (loan)" ? {
          lenderName,
          loanBalance: loanBalance ? parseFloat(loanBalance) : undefined,
          monthlyPayment: loanMonthlyPayment ? parseFloat(loanMonthlyPayment) : undefined
        } : undefined,
        leaseDetails: loanLeaseStatus === "I'm leasing" ? {
          leasingCompany,
          leasePayoff: leasePayoff ? parseFloat(leasePayoff) : undefined,
          monthlyPayment: leaseMonthlyPayment ? parseFloat(leaseMonthlyPayment) : undefined
        } : undefined
      }

      console.log('Updating basics with data:', basicsData)
      const basicsResult = await updateVehicleBasics(submissionId, basicsData)
      if (!basicsResult.success) {
        console.error('Failed to update basics:', basicsResult)
        throw new Error(basicsResult.error)
      }
      console.log('Basics updated successfully')

      // Step 2: Update condition
      const conditionData = {
        accidentHistory: accidentHistory as any,
        isDrivable: isDrivable ?? undefined,
        mechanicalIssues,
        engineIssues,
        exteriorDamage,
        interiorCondition,
        windshieldCondition: windshieldCondition as any,
        sunroofCondition: sunroofCondition as any,
        tiresReplaced: tiresReplaced ? parseInt(tiresReplaced) : undefined,
        hasModifications: hasModifications ?? undefined,
        smokedIn: smokedIn ?? undefined,
        keyCount: keyCount ? parseInt(keyCount) : undefined,
        overallCondition: overallCondition as any
      }

      console.log('Updating condition with data:', conditionData)
      const conditionResult = await updateVehicleCondition(submissionId, conditionData)
      if (!conditionResult.success) {
        console.error('Failed to update condition:', conditionResult)
        throw new Error(conditionResult.error)
      }
      console.log('Condition updated successfully')

      toast.success('Vehicle information saved successfully!')
      // Navigate to email collection page
      console.log('Navigating to email collection page with ID:', submissionId)
      router.push(`/offer/email?id=${submissionId}`)

    } catch (error: any) {
      console.error('Error saving vehicle details:', error)
      toast.error(error.message || 'Failed to save vehicle details')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !vehicleData.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p>Loading vehicle information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row">

      {/* Mobile Vehicle Summary - Shows on top for mobile */}
      <div className="lg:hidden w-full bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        {/* Vehicle Card */}
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Your Vehicle</h3>
          </div>

          {/* Car Image Display - Mobile */}
          <div className="mb-4">
            <CarImageDisplay
              make={selectedMake || vehicleData?.vinOrPlate?.make}
              model={selectedModel || vehicleData?.vinOrPlate?.model}
              year={selectedYear || vehicleData?.vinOrPlate?.year}
              color={color}
              className="w-full h-32 bg-gray-100"
            />
          </div>

          {/* Vehicle Details Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="space-y-4">
              {/* Primary Vehicle Info */}
              <div className="border-b border-gray-100 pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Make</span>
                  <span className="font-medium text-gray-900">{selectedMake || vehicleData?.vinOrPlate?.make || (vin ? (loading ? 'Loading...' : 'Will be loaded...') : 'Unknown')}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Model</span>
                  <span className="font-medium text-gray-900">{selectedModel || vehicleData?.vinOrPlate?.model || (vin ? (loading ? 'Loading...' : 'Will be loaded...') : 'Unknown')}</span>
                </div>
                {(selectedYear || (vehicleData?.vinOrPlate?.year && vehicleData.vinOrPlate.year > 0)) && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Year</span>
                    <span className="font-medium text-gray-900">{selectedYear || vehicleData?.vinOrPlate?.year}</span>
                  </div>
                )}
              </div>

              {/* Secondary Vehicle Info */}
              <div className="space-y-3">
                {(vin || vehicleData?.vinOrPlate?.vin) && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">VIN</span>
                    <span className="text-sm text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded">{vehicleData?.vinOrPlate?.vin || vin}</span>
                  </div>
                )}
                {(plate || vehicleData?.vinOrPlate?.licensePlate) && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">License Plate</span>
                    <span className="text-sm text-gray-700 bg-blue-50 text-blue-800 px-2 py-1 rounded font-medium">{vehicleData?.vinOrPlate?.licensePlate || plate}</span>
                  </div>
                )}
                {vehicleData?.vinOrPlate?.trim && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Trim</span>
                    <span className="text-sm text-gray-700">{vehicleData.vinOrPlate.trim}</span>
                  </div>
                )}
                {(vehicleData?.vinOrPlate?.transmission || transmission) && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Transmission</span>
                    <span className="text-sm text-gray-700">{transmission || vehicleData.vinOrPlate.transmission}</span>
                  </div>
                )}
                {state && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">State</span>
                    <span className="text-sm text-gray-700">{state}</span>
                  </div>
                )}
              </div>

              {/* Financing Info */}
              {loanLeaseStatus && loanLeaseStatus !== "No loan or lease" && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Financing Status</span>
                    <span className="text-sm bg-yellow-50 text-yellow-800 px-2 py-1 rounded font-medium">{loanLeaseStatus}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Left Section - Form */}
      <div className="w-full lg:w-1/2 py-12 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 border-2 border-[#a6fe54] text-black rounded-full flex items-center justify-center font-bold mr-3">
              1
            </div>
            <h1 className="text-2xl font-bold">Let's Start With the Basics</h1>
          </div>
          <p className="text-gray-600">
            We've pulled your vehicle details from the {vin ? 'VIN' : 'license plate'}. Now help us complete the picture with just a few more inputs.
          </p>
        </div>

        {/* Basic Details Form */}
        <div className="space-y-6 mb-8">
          {/* Vehicle Make */}
          <div>
            <Select value={selectedMake} onValueChange={setSelectedMake}>
              <SelectTrigger className="w-full p-4 border border-gray-300 rounded-lg">
                <SelectValue placeholder="Vehicle Make" />
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

          {/* Vehicle Model */}
          <div>
            <Select value={selectedModel} onValueChange={setSelectedModel} disabled={!selectedMake}>
              <SelectTrigger className="w-full p-4 border border-gray-300 rounded-lg">
                <SelectValue placeholder="Vehicle Model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vehicle Year */}
          <div>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full p-4 border border-gray-300 rounded-lg">
                <SelectValue placeholder="Vehicle Year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 30 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Input
              type="number"
              placeholder="Mileage"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <Input
              placeholder="Zip Code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <Input
              placeholder="Color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <Select value={transmission} onValueChange={setTransmission}>
              <SelectTrigger className="w-full p-4 border border-gray-300 rounded-lg">
                <SelectValue placeholder="Transmission" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Auto">Automatic</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={drivetrain} onValueChange={setDrivetrain}>
              <SelectTrigger className="w-full p-4 border border-gray-300 rounded-lg">
                <SelectValue placeholder="Drivetrain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FWD">FWD</SelectItem>
                <SelectItem value="RWD">RWD</SelectItem>
                <SelectItem value="AWD">AWD</SelectItem>
                <SelectItem value="4WD">4WD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Input
              placeholder="Engine"
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <Label className="text-base font-medium mb-3 block">Loan or Lease</Label>
            <p className="text-sm text-gray-600 mb-3">
              Do you currently have a loan or lease on your vehicle? Whether you're still paying it off or thinking about trading it in, this info helps us customize your next steps.
            </p>
            <Select value={loanLeaseStatus} onValueChange={setLoanLeaseStatus}>
              <SelectTrigger className="w-full p-4 border border-gray-300 rounded-lg">
                <SelectValue placeholder="Loan or Lease" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="No loan or lease">No loan or lease</SelectItem>
                <SelectItem value="I'm financing (loan)">I'm financing (loan)</SelectItem>
                <SelectItem value="I'm leasing">I'm leasing</SelectItem>
              </SelectContent>
            </Select>

            {/* Loan Details */}
            {loanLeaseStatus === "I'm financing (loan)" && (
              <div className="mt-4 space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <Label className="text-sm font-medium text-gray-700">Loan Details</Label>
                <div>
                  <Input
                    placeholder="Lender Name"
                    value={lenderName}
                    onChange={(e) => setLenderName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Approximate Loan Balance ($)"
                    value={loanBalance}
                    onChange={(e) => setLoanBalance(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Monthly Payment ($)"
                    value={loanMonthlyPayment}
                    onChange={(e) => setLoanMonthlyPayment(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Lease Details */}
            {loanLeaseStatus === "I'm leasing" && (
              <div className="mt-4 space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <Label className="text-sm font-medium text-gray-700">Lease Details</Label>
                <div>
                  <Input
                    placeholder="Leasing Company Name"
                    value={leasingCompany}
                    onChange={(e) => setLeasingCompany(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Lease Payoff Amount ($)"
                    value={leasePayoff}
                    onChange={(e) => setLeasePayoff(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Monthly Payment ($)"
                    value={leaseMonthlyPayment}
                    onChange={(e) => setLeaseMonthlyPayment(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Condition Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 border-2 border-[#a6fe54] text-black rounded-full flex items-center justify-center font-bold mr-3">
              2
            </div>
            <h2 className="text-lg font-bold">Let's Review Your Vehicle's Condition</h2>
          </div>
          <p className="text-gray-600 mb-8">
            From minor wear to major repairs, the more accurate you are, the better we can value your vehicle. Let's get a feel for your car's current state.
          </p>

          <div className="space-y-8">
            {/* Accident History */}
            <div>
              <Label className="text-sm font-bold mb-3 block">Has your vehicle been in an accident?</Label>
              <div className="flex flex-wrap gap-2">
                {['No Accidents', '1 Accident', '2+ Accidents'].map((option) => (
                  <Button
                    key={option}
                    variant="outline"
                    className={`px-3 py-1 text-sm rounded-full border-2 ${accidentHistory === (option === '2+ Accidents' ? '2 or More Accidents' : option)
                      ? "text-black"
                      : "text-black"
                      }`}
                    style={{
                      backgroundColor: accidentHistory === (option === '2+ Accidents' ? '2 or More Accidents' : option) ? '#a6fe54' : 'transparent',
                      borderColor: '#a6fe54'
                    }}
                    onClick={() => setAccidentHistory(option === '2+ Accidents' ? '2 or More Accidents' : option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            {/* Drivability */}
            <div>
              <Label className="text-sm font-bold mb-3 block">
                Does your vehicle have any issues that would stop us from safely driving it?
              </Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className={`px-3 py-1 text-sm rounded-full border-2 ${isDrivable === true
                    ? "text-black"
                    : "text-black"
                    }`}
                  style={{
                    backgroundColor: isDrivable === true ? '#a6fe54' : 'transparent',
                    borderColor: '#a6fe54'
                  }}
                  onClick={() => setIsDrivable(true)}
                >
                  Drivable
                </Button>
                <Button
                  variant="outline"
                  className={`px-3 py-1 text-sm rounded-full border-2 ${isDrivable === false
                    ? "text-black"
                    : "text-black"
                    }`}
                  style={{
                    backgroundColor: isDrivable === false ? '#a6fe54' : 'transparent',
                    borderColor: '#a6fe54'
                  }}
                  onClick={() => setIsDrivable(false)}
                >
                  Not Drivable
                </Button>
              </div>
            </div>

            {/* Mechanical and Electrical Issues */}
            <div>
              <Label className="text-sm font-bold mb-3 block">Mechanical and Electrical Issues</Label>
              <div className="flex flex-wrap gap-2">
                {['Air Conditioning', 'Transmission', 'Tire Pressure', 'Electrical', 'No Mechanical or Electrical Issues'].map((issue) => (
                  <Button
                    key={issue}
                    variant="outline"
                    className={`px-3 py-1 text-sm rounded-full border-2 ${mechanicalIssues.includes(issue)
                      ? "text-black"
                      : "text-black"
                      }`}
                    style={{
                      backgroundColor: mechanicalIssues.includes(issue) ? '#a6fe54' : 'transparent',
                      borderColor: '#a6fe54'
                    }}
                    onClick={() => toggleArrayValue(mechanicalIssues, issue, setMechanicalIssues)}
                  >
                    {issue}
                  </Button>
                ))}
              </div>
            </div>

            {/* Engine Issues */}
            <div>
              <Label className="text-sm font-bold mb-3 block">Engine Issues</Label>
              <div className="flex flex-wrap gap-2">
                {['Check Engine Light', 'Noises', 'Engine Vibration', 'Smoke or Steam', 'Other Engine Issues', 'No Engine Issues'].map((issue) => (
                  <Button
                    key={issue}
                    variant="outline"
                    className={`px-3 py-1 text-sm rounded-full border-2 ${engineIssues.includes(issue)
                      ? "text-black"
                      : "text-black"
                      }`}
                    style={{
                      backgroundColor: engineIssues.includes(issue) ? '#a6fe54' : 'transparent',
                      borderColor: '#a6fe54'
                    }}
                    onClick={() => toggleArrayValue(engineIssues, issue, setEngineIssues)}
                  >
                    {issue}
                  </Button>
                ))}
              </div>
            </div>

            {/* Exterior Issues */}
            <div>
              <Label className="text-sm font-bold mb-3 block">Exterior Issues</Label>
              <div className="flex flex-wrap gap-2">
                {['Minor Damage', 'Fading Paint', 'Dents or Scrapes', 'Rust', 'Hail Damage', 'No Exterior Damage'].map((issue) => (
                  <Button
                    key={issue}
                    variant="outline"
                    className={`px-3 py-1 text-sm rounded-full border-2 ${exteriorDamage.includes(issue)
                      ? "text-black"
                      : "text-black"
                      }`}
                    style={{
                      backgroundColor: exteriorDamage.includes(issue) ? '#a6fe54' : 'transparent',
                      borderColor: '#a6fe54'
                    }}
                    onClick={() => toggleArrayValue(exteriorDamage, issue, setExteriorDamage)}
                  >
                    {issue}
                  </Button>
                ))}
              </div>
            </div>

            {/* Interior Damage */}
            <div>
              <Label className="text-sm font-bold mb-3 block">Interior Damage</Label>
              <div className="flex flex-wrap gap-2">
                {['Noticeable Stains', 'Rips or Tears in Seats', 'Persistent Odors', 'Damaged A/V Systems', 'Damaged Dashboard or Interior Panels', 'No Interior Damage'].map((issue) => (
                  <Button
                    key={issue}
                    variant="outline"
                    className={`px-3 py-1 text-sm rounded-full border-2 ${interiorCondition.includes(issue)
                      ? "text-black"
                      : "text-black"
                      }`}
                    style={{
                      backgroundColor: interiorCondition.includes(issue) ? '#a6fe54' : 'transparent',
                      borderColor: '#a6fe54'
                    }}
                    onClick={() => toggleArrayValue(interiorCondition, issue, setInteriorCondition)}
                  >
                    {issue}
                  </Button>
                ))}
              </div>
            </div>

            {/* Windshield */}
            <div>
              <Label className="text-sm font-bold mb-3 block">Is your front windshield damaged?</Label>
              <div className="flex flex-wrap gap-2">
                {['Chips or Cracks', 'No Windshield Damage'].map((option) => (
                  <Button
                    key={option}
                    variant="outline"
                    className={`px-3 py-1 text-sm rounded-full border-2 ${windshieldCondition === (option === 'Chips or Cracks' ? 'Minor Chips or Pitting' : 'No Damage')
                      ? "text-black"
                      : "text-black"
                      }`}
                    style={{
                      backgroundColor: windshieldCondition === (option === 'Chips or Cracks' ? 'Minor Chips or Pitting' : 'No Damage') ? '#a6fe54' : 'transparent',
                      borderColor: '#a6fe54'
                    }}
                    onClick={() => setWindshieldCondition(option === 'Chips or Cracks' ? 'Minor Chips or Pitting' : 'No Damage')}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            {/* Moonroof */}
            <div>
              <Label className="text-sm font-bold mb-3 block">
                If your vehicle has a moonroof, does it open and close without any problems?
              </Label>
              <div className="flex flex-wrap gap-2">
                {['Works Fine', 'Doesn\'t Work', 'No Moonroof'].map((option) => (
                  <Button
                    key={option}
                    variant="outline"
                    className={`px-3 py-1 text-sm rounded-full border-2 ${sunroofCondition === (option === 'Works Fine' ? 'Works Great' : option === 'Doesn\'t Work' ? 'Doesn\'t Work' : 'Vehicle Doesn\'t Have One')
                      ? "text-black"
                      : "text-black"
                      }`}
                    style={{
                      backgroundColor: sunroofCondition === (option === 'Works Fine' ? 'Works Great' : option === 'Doesn\'t Work' ? 'Doesn\'t Work' : 'Vehicle Doesn\'t Have One') ? '#a6fe54' : 'transparent',
                      borderColor: '#a6fe54'
                    }}
                    onClick={() => setSunroofCondition(option === 'Works Fine' ? 'Works Great' : option === 'Doesn\'t Work' ? 'Doesn\'t Work' : 'Vehicle Doesn\'t Have One')}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tires */}
            <div>
              <Label className="text-sm font-bold mb-3 block">
                How many of your vehicle's tires have been replaced in the past 12 months?
              </Label>
              <div className="flex flex-wrap gap-2">
                {['1 Tire', '2 Tires', '3 Tires', '4 Tires', 'None'].map((option) => (
                  <Button
                    key={option}
                    variant="outline"
                    className={`px-3 py-1 text-sm rounded-full border-2 ${tiresReplaced === (option === 'None' ? '0' : option.charAt(0))
                      ? "text-black"
                      : "text-black"
                      }`}
                    style={{
                      backgroundColor: tiresReplaced === (option === 'None' ? '0' : option.charAt(0)) ? '#a6fe54' : 'transparent',
                      borderColor: '#a6fe54'
                    }}
                    onClick={() => setTiresReplaced(option === 'None' ? '0' : option.charAt(0))}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            {/* Modifications */}
            <div>
              <Label className="text-sm font-bold mb-3 block">
                Does your vehicle have any modifications (e.g. suspension, engine, etc.)?
              </Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className={`px-3 py-1 text-sm rounded-full border-2 ${hasModifications === true
                    ? "text-black"
                    : "text-black"
                    }`}
                  style={{
                    backgroundColor: hasModifications === true ? '#a6fe54' : 'transparent',
                    borderColor: '#a6fe54'
                  }}
                  onClick={() => setHasModifications(true)}
                >
                  Modifications
                </Button>
                <Button
                  variant="outline"
                  className={`px-3 py-1 text-sm rounded-full border-2 ${hasModifications === false
                    ? "text-black"
                    : "text-black"
                    }`}
                  style={{
                    backgroundColor: hasModifications === false ? '#a6fe54' : 'transparent',
                    borderColor: '#a6fe54'
                  }}
                  onClick={() => setHasModifications(false)}
                >
                  No Modifications
                </Button>
              </div>
            </div>

            {/* Smoking */}
            <div>
              <Label className="text-sm font-bold mb-3 block">Has your vehicle been smoked in?</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className={`px-3 py-1 text-sm rounded-full border-2 ${smokedIn === true
                    ? "text-black"
                    : "text-black"
                    }`}
                  style={{
                    backgroundColor: smokedIn === true ? '#a6fe54' : 'transparent',
                    borderColor: '#a6fe54'
                  }}
                  onClick={() => setSmokedIn(true)}
                >
                  Smoked In
                </Button>
                <Button
                  variant="outline"
                  className={`px-3 py-1 text-sm rounded-full border-2 ${smokedIn === false
                    ? "text-black"
                    : "text-black"
                    }`}
                  style={{
                    backgroundColor: smokedIn === false ? '#a6fe54' : 'transparent',
                    borderColor: '#a6fe54'
                  }}
                  onClick={() => setSmokedIn(false)}
                >
                  Not Smoked In
                </Button>
              </div>
            </div>

            {/* Keys */}
            <div>
              <Label className="text-sm font-bold mb-3 block">How many keys do you have for this vehicle?</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className={`px-3 py-1 text-sm rounded-full border-2 ${keyCount === '1'
                    ? "text-black"
                    : "text-black"
                    }`}
                  style={{
                    backgroundColor: keyCount === '1' ? '#a6fe54' : 'transparent',
                    borderColor: '#a6fe54'
                  }}
                  onClick={() => setKeyCount('1')}
                >
                  1 Key
                </Button>
                <Button
                  variant="outline"
                  className={`px-3 py-1 text-sm rounded-full border-2 ${keyCount === '2'
                    ? "text-black"
                    : "text-black"
                    }`}
                  style={{
                    backgroundColor: keyCount === '2' ? '#a6fe54' : 'transparent',
                    borderColor: '#a6fe54'
                  }}
                  onClick={() => setKeyCount('2')}
                >
                  2+ Keys
                </Button>
              </div>
            </div>

            {/* Overall Condition */}
            <div>
              <Label className="text-sm font-bold mb-3 block">
                What's the best way to describe your vehicle's overall condition?
              </Label>
              <div className="flex flex-wrap gap-2">
                {['Like New', 'Pretty Great', 'Just Okay', 'Kind of Rough', 'Major Issues'].map((condition) => (
                  <Button
                    key={condition}
                    variant="outline"
                    className={`px-3 py-1 text-sm rounded-full border-2 ${overallCondition === condition
                      ? "text-black"
                      : "text-black"
                      }`}
                    style={{
                      backgroundColor: overallCondition === condition ? '#a6fe54' : 'transparent',
                      borderColor: '#a6fe54'
                    }}
                    onClick={() => setOverallCondition(condition)}
                  >
                    {condition}
                  </Button>
                ))}
              </div>
            </div>

            {/* Get My Offer Button */}
            <div className="mt-12">
              <Button
                onClick={handleGetMyOffer}
                disabled={loading}
                className="w-full bg-[#a6fe54] hover:bg-[#a6fe54]/80 text-black font-semibold py-4 text-lg rounded-full"
              >
                {loading ? 'Saving...' : 'Get My Offer'}
              </Button>
            </div>
          </div>
        </div>


      </div>
      {/* Right Section - Vehicle Display - Desktop only */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-start p-8">
        {/* Vehicle Card */}
        <div className="w-full max-w-md sticky top-5">
          {/* Header */}
          <div className="text-left mb-6">
          
            <h3 className="text-xl font-bold text-gray-800 mb-2">Your Vehicle</h3>
          </div>

          {/* Car Image Display - Desktop */}
          <div className="mb-6">
            <CarImageDisplay
              make={selectedMake || vehicleData?.vinOrPlate?.make}
              model={selectedModel || vehicleData?.vinOrPlate?.model}
              year={selectedYear || vehicleData?.vinOrPlate?.year}
              color={color}
              className="w-full h-48 bg-gray-100"
            />
          </div>

          {/* Vehicle Details Card */}
          <div className="bg-white rounded-xl shadow-none border border-gray-400 p-6 mb-6">
            <div className="space-y-4">
              {/* Primary Vehicle Info */}
              <div className="border-b border-gray-300 pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Make</span>
                  <span className="font-medium text-gray-900">{selectedMake || vehicleData?.vinOrPlate?.make || (vin ? (loading ? 'Loading...' : 'Will be loaded...') : 'Unknown')}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Model</span>
                  <span className="font-medium text-gray-900">{selectedModel || vehicleData?.vinOrPlate?.model || (vin ? (loading ? 'Loading...' : 'Will be loaded...') : 'Unknown')}</span>
                </div>
                {(selectedYear || (vehicleData?.vinOrPlate?.year && vehicleData.vinOrPlate.year > 0)) && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Year</span>
                    <span className="font-medium text-gray-900">{selectedYear || vehicleData?.vinOrPlate?.year}</span>
                  </div>
                )}
              </div>

              {/* Secondary Vehicle Info */}
              <div className="space-y-3">
                {(vin || vehicleData?.vinOrPlate?.vin) && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">VIN</span>
                    <span className="text-sm text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded">{vehicleData?.vinOrPlate?.vin || vin}</span>
                  </div>
                )}
                {(plate || vehicleData?.vinOrPlate?.licensePlate) && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">License Plate</span>
                    <span className="text-sm text-gray-700 bg-blue-50 text-blue-800 px-2 py-1 rounded font-medium">{vehicleData?.vinOrPlate?.licensePlate || plate}</span>
                  </div>
                )}
                {vehicleData?.vinOrPlate?.trim && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Trim</span>
                    <span className="text-sm text-gray-700">{vehicleData.vinOrPlate.trim}</span>
                  </div>
                )}
                {(vehicleData?.vinOrPlate?.transmission || transmission) && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Transmission</span>
                    <span className="text-sm text-gray-700">{transmission || vehicleData.vinOrPlate.transmission}</span>
                  </div>
                )}
                {state && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">State</span>
                    <span className="text-sm text-gray-700">{state}</span>
                  </div>
                )}
              </div>

              {/* Financing Info */}
              {loanLeaseStatus && loanLeaseStatus !== "No loan or lease" && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Financing Status</span>
                    <span className="text-sm bg-yellow-50 text-yellow-800 px-2 py-1 rounded font-medium">{loanLeaseStatus}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}