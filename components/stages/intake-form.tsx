"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SaveIndicator } from "@/components/save-indicator"
import { useToast } from "@/hooks/use-toast"
import { User, Car, Building } from "lucide-react"
import { useAuth } from "@/lib/auth"
import api from '@/lib/api'
import type { CustomerData, VehicleData } from '@/lib/types'

// TypeScript interfaces for intake form data
interface CaseData {
  _id?: string
  createdAt?: string
  customer?: CustomerData
  vehicle?: VehicleData
  documents?: {
    driverLicenseFront: DocumentDisplay | null
    driverLicenseRear: DocumentDisplay | null
    vehicleTitle: DocumentDisplay | null
  }
}

interface UserData {
  firstName?: string
  lastName?: string
  location?: string
}


interface IntakeFormProps {
  vehicleData: CaseData
  onUpdate: (data: CaseData) => void
  onComplete: () => void
}

interface DocumentDisplay {
  path: string;
  originalName: string;
}

interface FormData {
  intakeDate: string;
  agentFirstName: string;
  agentLastName: string;
  storeLocation: string;
  customer: CustomerData;
  vehicle: VehicleData;
  documents: {
    driverLicenseFront: DocumentDisplay | null;
    driverLicenseRear: DocumentDisplay | null;
    vehicleTitle: DocumentDisplay | null;
  };
}

export function IntakeForm({ vehicleData, onUpdate, onComplete }: IntakeFormProps) {
  const { user, isAuthenticated } = useAuth()
  const [formData, setFormData] = useState<FormData>({
    // Front Office Details
    intakeDate: new Date().toISOString().split("T")[0],
    agentFirstName: "",
    agentLastName: "",
    storeLocation: "",

    // Customer Contact Info
    customer: {
      firstName: "",
      middleInitial: "",
      lastName: "",
      cellPhone: "",
      homePhone: "",
      email1: "",
      email2: "",
      email3: "",
      hearAboutVOS: "",
      receivedOtherQuote: false,
      otherQuoteOfferer: "",
      otherQuoteAmount: 0,
    },

    // Basic Vehicle Info
    vehicle: {
      year: "",
      make: "",
      model: "",
      currentMileage: "",
      vin: "",
      titleStatus: "clean",
      loanStatus: "paid-off",
      loanAmount: 0,
      secondSetOfKeys: false,
    },

    // Required Images
    documents: {
      driverLicenseFront: null,
      driverLicenseRear: null,
      vehicleTitle: null,
    },
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Load agent details on mount
  useEffect(() => {
    const loadAgentDetails = async () => {
      // Only load agent details if user is authenticated
      if (!isAuthenticated || !user) {
        console.log('User not authenticated, skipping agent details load');
        return;
      }

      try {
        const response = await api.getCurrentUser();
        console.log('getCurrentUser response:', response); // Debug log
        
        if (response.success && response.data && typeof response.data === 'object') {
          const userData = response.data as UserData;
          setFormData(prev => ({
            ...prev,
            agentFirstName: userData.firstName || '',
            agentLastName: userData.lastName || '',
            storeLocation: userData.location || ''
          }));
        } else {
          console.warn('getCurrentUser failed or returned invalid data:', response);
          // Use user data from auth context as fallback
          setFormData(prev => ({
            ...prev,
            agentFirstName: user.firstName || '',
            agentLastName: user.lastName || '',
            storeLocation: user.location || ''
          }));
        }
      } catch (error) {
        console.error('Error loading agent details:', error);
        // Use user data from auth context as fallback
        setFormData(prev => ({
          ...prev,
          agentFirstName: user.firstName || '',
          agentLastName: user.lastName || '',
          storeLocation: user.location || ''
        }));
      }
    };

    loadAgentDetails();
  }, [isAuthenticated, user]);

  // Load case data if editing existing case
  useEffect(() => {
    if (vehicleData?._id) {
      setFormData(prev => ({
        ...prev,
        intakeDate: vehicleData.createdAt?.split('T')[0] || new Date().toISOString().split("T")[0],
        customer: {
          firstName: vehicleData.customer?.firstName || "",
          middleInitial: vehicleData.customer?.middleInitial || "",
          lastName: vehicleData.customer?.lastName || "",
          cellPhone: vehicleData.customer?.cellPhone || "",
          homePhone: vehicleData.customer?.homePhone || "",
          email1: vehicleData.customer?.email1 || "",
          email2: vehicleData.customer?.email2 || "",
          email3: vehicleData.customer?.email3 || "",
          hearAboutVOS: vehicleData.customer?.hearAboutVOS || "",
          receivedOtherQuote: vehicleData.customer?.receivedOtherQuote || false,
          otherQuoteOfferer: vehicleData.customer?.otherQuoteOfferer || "",
          otherQuoteAmount: vehicleData.customer?.otherQuoteAmount || 0,
        },
        vehicle: {
          year: vehicleData.vehicle?.year || "",
          make: vehicleData.vehicle?.make || "",
          model: vehicleData.vehicle?.model || "",
          currentMileage: vehicleData.vehicle?.currentMileage || "",
          vin: vehicleData.vehicle?.vin || "",
          titleStatus: vehicleData.vehicle?.titleStatus || "clean",
          loanStatus: vehicleData.vehicle?.loanStatus || "paid-off",
          loanAmount: vehicleData.vehicle?.loanAmount || 0,
          secondSetOfKeys: vehicleData.vehicle?.secondSetOfKeys || false,
        },
        documents: vehicleData.documents || {
          driverLicenseFront: null,
          driverLicenseRear: null,
          vehicleTitle: null,
        }
      }));
    }
  }, [vehicleData]);

  // Auto-save changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (vehicleData?._id) {
        setIsSaving(true);
        onUpdate(formData);
        setTimeout(() => setIsSaving(false), 500);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData, onUpdate, vehicleData]);

  const handleInputChange = (section: keyof FormData | 'customer' | 'vehicle', field: string, value: string | boolean | number) => {
    setFormData((prev) => {
      if (section === 'customer' || section === 'vehicle') {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value,
          },
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };


  const handleComplete = async () => {
    const requiredFields = [
      formData.customer.firstName,
      formData.customer.lastName,
      formData.customer.cellPhone,
      formData.customer.email1,
      formData.vehicle.year,
      formData.vehicle.make,
      formData.vehicle.model,
      formData.vehicle.currentMileage,
      formData.vehicle.titleStatus,
      formData.vehicle.loanStatus,
    ]

    if (requiredFields.some((field) => !field)) {
      toast({
        title: "Missing Required Information",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      })
      return
    }

    if (!formData.documents.driverLicenseFront || !formData.documents.driverLicenseRear) {
      toast({
        title: "Missing Required Documents",
        description: "Please upload both front and rear driver's license photos.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Create or update case
      const response = await api.createCustomerCase({
        customer: formData.customer,
        vehicle: formData.vehicle,
        documents: formData.documents.driverLicenseFront?.path || formData.documents.driverLicenseRear?.path || formData.documents.vehicleTitle?.path || "",
        agentInfo: {
          firstName: formData.agentFirstName,
          lastName: formData.agentLastName,
          storeLocation: formData.storeLocation
        }
      });

      if (response.success) {
        // Update the vehicle data with the created case
        if (response.data) {
          onUpdate(response.data as CaseData);
        }
        
        toast({
          title: "Success",
          description: vehicleData?._id ? "Case updated successfully." : "New case created successfully.",
        });
        onComplete();
      }
    } catch (error) {
      const errorData = api.handleError(error);
      toast({
        title: "Error",
        description: errorData.error,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicle Intake</h1>
          <p className="text-muted-foreground">Comprehensive customer and vehicle data collection</p>
        </div>
        <SaveIndicator isSaving={isSaving} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Front Office Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Front Office Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="intakeDate">Date of Intake *</Label>
              <Input
                id="intakeDate"
                type="date"
                value={formData.intakeDate}
                onChange={(e) => handleInputChange("intakeDate", "intakeDate", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agentFirstName">Agent First Name *</Label>
                <Input
                  id="agentFirstName"
                  value={formData.agentFirstName}
                  onChange={(e) => handleInputChange("agentFirstName", "agentFirstName", e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentLastName">Agent Last Name *</Label>
                <Input
                  id="agentLastName"
                  value={formData.agentLastName}
                  onChange={(e) => handleInputChange("agentLastName", "agentLastName", e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeLocation">Store / Location *</Label>
              <Select
                value={formData.storeLocation}
                onValueChange={(value) => handleInputChange("storeLocation", "storeLocation", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select store location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="downtown">Downtown Location</SelectItem>
                  <SelectItem value="north">North Branch</SelectItem>
                  <SelectItem value="south">South Branch</SelectItem>
                  <SelectItem value="west">West Side Location</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Customer Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.customer.firstName}
                  onChange={(e) => handleInputChange("customer", "firstName", e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleInitial">Middle Initial</Label>
                <Input
                  id="middleInitial"
                  value={formData.customer.middleInitial}
                  onChange={(e) => handleInputChange("customer", "middleInitial", e.target.value)}
                  placeholder="M"
                  maxLength={1}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.customer.lastName}
                onChange={(e) => handleInputChange("customer", "lastName", e.target.value)}
                placeholder="Smith"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cellPhone">Cell Phone *</Label>
                <Input
                  id="cellPhone"
                  type="tel"
                  value={formData.customer.cellPhone}
                  onChange={(e) => handleInputChange("customer", "cellPhone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="homePhone">Home Phone</Label>
                <Input
                  id="homePhone"
                  type="tel"
                  value={formData.customer.homePhone}
                  onChange={(e) => handleInputChange("customer", "homePhone", e.target.value)}
                  placeholder="(555) 987-6543"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email1">Primary Email *</Label>
              <Input
                id="email1"
                type="email"
                value={formData.customer.email1}
                onChange={(e) => handleInputChange("customer", "email1", e.target.value)}
                placeholder="john.smith@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email2">Secondary Email</Label>
              <Input
                id="email2"
                type="email"
                value={formData.customer.email2}
                onChange={(e) => handleInputChange("customer", "email2", e.target.value)}
                placeholder="john.work@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email3">Third Email</Label>
              <Input
                id="email3"
                type="email"
                value={formData.customer.email3}
                onChange={(e) => handleInputChange("customer", "email3", e.target.value)}
                placeholder="john.alt@email.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Marketing & Competition */}
        <Card>
          <CardHeader>
            <CardTitle>Marketing & Competition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hearAboutVOS">How did you hear about VOS? *</Label>
              <Select
                value={formData.customer.hearAboutVOS}
                onValueChange={(value) => handleInputChange("customer", "hearAboutVOS", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google Search</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="referral">Friend/Family Referral</SelectItem>
                  <SelectItem value="radio">Radio Ad</SelectItem>
                  <SelectItem value="tv">TV Commercial</SelectItem>
                  <SelectItem value="billboard">Billboard</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Did you receive another quote?</Label>
                <p className="text-sm text-muted-foreground">Have you gotten offers from other car buyers?</p>
              </div>
              <Switch
                checked={formData.customer.receivedOtherQuote}
                onCheckedChange={(value) => handleInputChange("customer", "receivedOtherQuote", value)}
              />
            </div>

            {formData.customer.receivedOtherQuote && (
              <div className="space-y-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="space-y-2">
                  <Label htmlFor="otherQuoteOfferer">Offerer Name</Label>
                  <Input
                    id="otherQuoteOfferer"
                    value={formData.customer.otherQuoteOfferer}
                    onChange={(e) => handleInputChange("customer", "otherQuoteOfferer", e.target.value)}
                    placeholder="CarMax, Carvana, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherQuoteAmount">Quote Amount</Label>
                  <Input
                    id="otherQuoteAmount"
                    type="number"
                    value={formData.customer.otherQuoteAmount}
                    onChange={(e) => handleInputChange("customer", "otherQuoteAmount", e.target.value)}
                    placeholder="25000"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Basic Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Basic Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleYear">Year *</Label>
                <Input
                  id="vehicleYear"
                  value={formData.vehicle.year}
                  onChange={(e) => handleInputChange("vehicle", "year", e.target.value)}
                  placeholder="2020"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentMileage">Current Mileage *</Label>
                <Input
                  id="currentMileage"
                  value={formData.vehicle.currentMileage}
                  onChange={(e) => handleInputChange("vehicle", "currentMileage", e.target.value)}
                  placeholder="50,000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleMake">Make *</Label>
              <Input
                id="vehicleMake"
                value={formData.vehicle.make}
                onChange={(e) => handleInputChange("vehicle", "make", e.target.value)}
                placeholder="Toyota"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleModel">Model *</Label>
              <Input
                id="vehicleModel"
                value={formData.vehicle.model}
                onChange={(e) => handleInputChange("vehicle", "model", e.target.value)}
                placeholder="Camry"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleVin">VIN (optional - can scan later)</Label>
              <Input
                id="vehicleVin"
                value={formData.vehicle.vin}
                onChange={(e) => handleInputChange("vehicle", "vin", e.target.value)}
                placeholder="1HGBH41JXMN109186"
              />
            </div>
          </CardContent>
        </Card>

        {/* Car History & Condition */}
        <Card>
          <CardHeader>
            <CardTitle>Car History & Condition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titleStatus">Title Status *</Label>
              <Select
                value={formData.vehicle.titleStatus}
                onValueChange={(value) => handleInputChange("vehicle", "titleStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select title status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clean">Clean</SelectItem>
                  <SelectItem value="salvage">Salvage</SelectItem>
                  <SelectItem value="rebuilt">Rebuilt</SelectItem>
                  <SelectItem value="not-sure">Not Sure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanStatus">Loan Status *</Label>
              <Select
                value={formData.vehicle.loanStatus || 'paid-off'}
                onValueChange={(value) => {
                  const loanStatus = value as VehicleData['loanStatus'];
                  if (loanStatus) {
                    handleInputChange("vehicle", "loanStatus", loanStatus);
                  }
                }}
              >
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

            {formData.vehicle.loanStatus === "still-has-loan" && (
              <div className="space-y-2">
                <Label htmlFor="loanAmount">Remaining Loan Amount</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  value={formData.vehicle.loanAmount}
                  onChange={(e) => handleInputChange("vehicle", "loanAmount", Number(e.target.value))}
                  placeholder="15000"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Second Set of Keys?</Label>
                <p className="text-sm text-muted-foreground">Are all keys available for the vehicle?</p>
              </div>
              <Switch
                checked={formData.vehicle.secondSetOfKeys}
                onCheckedChange={(value) => handleInputChange("vehicle", "secondSetOfKeys", value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleComplete} 
          size="lg" 
          className="px-8"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Mark as Intake Complete"}
        </Button>
      </div>
    </div>
  )
}
