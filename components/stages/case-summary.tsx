"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Car, 
  Calendar, 
  ClipboardList, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  ArrowRight,
  Star,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileCheck,
  TrendingUp,
  Settings
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface CustomerData {
  firstName?: string
  middleInitial?: string
  lastName?: string
  cellPhone?: string
  homePhone?: string
  email1?: string
  email2?: string
  email3?: string
  hearAboutVOS?: string
  source?: string // Add customer source field
  receivedOtherQuote?: boolean
  otherQuoteOfferer?: string
  otherQuoteAmount?: number
  agent?: string
  notes?: string
  storeLocation?: string
}

interface VehicleData {
  year?: string
  make?: string
  model?: string
  currentMileage?: string
  vin?: string
  color?: string
  bodyStyle?: string
  licensePlate?: string
  licenseState?: string
  titleNumber?: string
  titleStatus?: 'clean' | 'salvage' | 'rebuilt' | 'lemon' | 'flood' | 'junk' | 'not-sure'
  loanStatus?: 'paid-off' | 'still-has-loan' | 'not-sure'
  loanAmount?: number
  secondSetOfKeys?: boolean
  knownDefects?: string
  estimatedValue?: number
  pricingSource?: string
  pricingLastUpdated?: string
}

interface InspectorData {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

interface InspectionData {
  status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  scheduledDate?: string
  scheduledTime?: string
  inspector?: InspectorData
  overallRating?: number
  overallScore?: number
  maxPossibleScore?: number
  completed?: boolean
  completedAt?: string
  emailSent?: boolean
  inspectionNotes?: string
  recommendations?: string[]
  notesForInspector?: string
  vinVerification?: {
    vinNumber: string
    vinMatch: 'yes' | 'no' | 'not_verified'
  }
  sections?: Array<{
    id: string
    name: string
    description?: string
    icon?: string
    rating: number
    score?: number
    maxScore?: number
    completed?: boolean
    questions?: Array<{
      id: string
      question: string
      type: 'radio' | 'checkbox' | 'text' | 'rating' | 'photo' | 'yesno' | 'number'
      answer?: string | string[] | number
      notes?: string
      photos?: Array<{
        path: string
        originalName: string
        uploadedAt: Date
      }>
      subQuestions?: Array<{
        id: string
        question: string
        type: 'radio' | 'checkbox' | 'text' | 'rating' | 'photo' | 'yesno' | 'number'
        answer?: string | string[] | number
        notes?: string
        photos?: Array<{
          path: string
          originalName: string
          uploadedAt: Date
        }>
      }>
    }>
    photos?: Array<{
      path: string
      originalName: string
      uploadedAt: Date
    }>
  }>
  safetyIssues?: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    location: string
    estimatedCost: number
  }>
  maintenanceItems?: Array<{
    priority: 'low' | 'medium' | 'high'
    description: string
    estimatedCost: number
    recommendedAction: string
  }>
}

interface QuoteData {
  offerAmount?: number
  estimatedValue?: number
  expiryDate?: string
  notes?: string
  titleReminder?: boolean
  status?: 'draft' | 'ready' | 'presented' | 'accepted' | 'negotiating' | 'declined' | 'expired'
  emailSent?: boolean
  createdAt?: string
  updatedAt?: string
  estimator?: {
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
}

interface OfferDecisionData {
  decision?: 'accepted' | 'negotiating' | 'declined' | 'pending'
  counterOffer?: number
  customerNotes?: string
  finalAmount?: number
  decisionDate?: string
  reason?: string
  acceptedAt?: string
  declinedAt?: string
}

interface TransactionData {
  billOfSale?: {
    sellerName?: string
    sellerAddress?: string
    sellerCity?: string
    sellerState?: string
    sellerZip?: string
    sellerPhone?: string
    sellerEmail?: string
    sellerDLNumber?: string
    sellerDLState?: string
    vehicleVIN?: string
    vehicleYear?: string
    vehicleMake?: string
    vehicleModel?: string
    vehicleMileage?: string
    vehicleColor?: string
    vehicleBodyStyle?: string
    vehicleTitleNumber?: string
    vehicleLicensePlate?: string
    vehicleLicenseState?: string
    saleDate?: string
    saleTime?: string
    salePrice?: number
    paymentMethod?: string
    odometerReading?: string
    odometerAccurate?: boolean
    titleStatus?: string
    knownDefects?: string
    asIsAcknowledgment?: boolean
    sellerDisclosure?: boolean
    buyerDisclosure?: boolean
    notaryRequired?: boolean
    notaryName?: string
    notaryCommissionExpiry?: string
    witnessName?: string
    witnessPhone?: string
  }
  documents?: {
    [key: string]: string | null
  }
  paymentStatus?: string
  submittedAt?: string
}

interface CompletionData {
  thankYouSent?: boolean
  sentAt?: string
  leaveBehinds?: {
    vehicleLeft?: boolean
    keysHandedOver?: boolean
    documentsReceived?: boolean
  }
  completedAt?: string
}

interface CaseData {
  id?: string
  _id?: string
  customer?: CustomerData
  vehicle?: VehicleData
  inspection?: InspectionData
  quote?: QuoteData
  offerDecision?: OfferDecisionData
  transaction?: TransactionData
  completion?: CompletionData
  currentStage?: number
  status?: 'new' | 'active' | 'scheduled' | 'quote-ready' | 'negotiating' | 'completed' | 'cancelled'
  stageStatuses?: {
    [key: number]: 'active' | 'complete' | 'pending'
  }
  createdAt?: string
  updatedAt?: string
  priority?: 'low' | 'medium' | 'high'
  estimatedValue?: number
  thankYouSent?: boolean
  lastActivity?: {
    description: string
    timestamp: Date
  }
  pdfCaseFile?: string
  createdBy?: string
}

interface CaseSummaryProps {
  vehicleData: CaseData
  onStageChange: (stage: number) => void
  accessibleStages?: number[]
}

const stages = [
  { 
    id: 1, 
    name: 'Customer Intake', 
    description: 'Customer and vehicle information collected',
    icon: User,
    color: 'bg-blue-100 text-blue-800'
  },
  { 
    id: 2, 
    name: 'Schedule Inspection', 
    description: 'Inspector assigned and inspection scheduled',
    icon: Calendar,
    color: 'bg-purple-100 text-purple-800'
  },
  { 
    id: 3, 
    name: 'Vehicle Inspection', 
    description: 'Vehicle inspection completed',
    icon: ClipboardList,
    color: 'bg-orange-100 text-orange-800'
  },
  { 
    id: 4, 
    name: 'Quote Preparation', 
    description: 'Quote prepared and submitted',
    icon: DollarSign,
    color: 'bg-yellow-100 text-yellow-800'
  },
  { 
    id: 5, 
    name: 'Offer Decision', 
    description: 'Customer decision captured',
    icon: CheckCircle,
    color: 'bg-pink-100 text-pink-800'
  },
  { 
    id: 6, 
    name: 'Paperwork', 
    description: 'Transaction paperwork completed',
    icon: FileText,
    color: 'bg-indigo-100 text-indigo-800'
  },
  { 
    id: 7, 
    name: 'Completion', 
    description: 'Transaction finalized',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800'
  }
]

export function CaseSummary({ vehicleData, onStageChange, accessibleStages = [] }: CaseSummaryProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)


  const isStageAccessible = (stageId: number) => {
    if (accessibleStages.length > 0) {
      return accessibleStages.includes(stageId)
    }
    return stageId <= (vehicleData.currentStage || 1)
  }

  const getFinalAmount = () => {
    return vehicleData.offerDecision?.finalAmount || 
           vehicleData.quote?.offerAmount || 
           vehicleData.transaction?.billOfSale?.salePrice || 
           vehicleData.estimatedValue || 0
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  // Function to get a human-readable source
  const getSourceLabel = (sourceKey?: string) => {
    if (!sourceKey) return "Not specified";
    
    const sources: Record<string, string> = {
      "contact_form": "Contact Us Form Submission",
      "walk_in": "Walk-In",
      "phone": "Phone",
      "online": "Online",
      "on_the_road": "On the Road",
      "social_media": "Social Media",
      "other": "Other"
    };
    
    return sources[sourceKey] || sourceKey;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Case Summary</h1>
          <p className="text-muted-foreground mt-2">
            Complete overview of {vehicleData.customer?.firstName} {vehicleData.customer?.lastName}&apos;s case
          </p>
        </div>
        <Badge className={vehicleData.priority === 'high' ? 'bg-red-100 text-red-800' : 
                        vehicleData.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'}>
          {vehicleData.priority || 'normal'} priority
        </Badge>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-lg md:text-2xl font-bold">{formatCurrency(getFinalAmount())}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Final Amount</p>
                {vehicleData.vehicle?.estimatedValue && (
                  <p className="text-xs text-green-600">
                    Est: {formatCurrency(vehicleData.vehicle.estimatedValue)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
              </div>
              <div>
                <p className="text-lg md:text-2xl font-bold">{Math.round(((vehicleData.currentStage || 1) / 7) * 100)}%</p>
                <p className="text-xs md:text-sm text-muted-foreground">Progress</p>
                <p className="text-xs text-gray-500">Stage {vehicleData.currentStage || 1} of 7</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm md:text-lg font-bold">{formatDate(vehicleData.createdAt)}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Created</p>
                {vehicleData.lastActivity && (
                  <p className="text-xs text-gray-500">
                    Last: {vehicleData.lastActivity.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm md:text-lg font-bold">{formatDate(vehicleData.updatedAt)}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Last Updated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <User className="h-4 w-4 md:h-5 md:w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-base md:text-lg">
                  {vehicleData.customer?.firstName} {vehicleData.customer?.lastName}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">Customer</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-xs md:text-sm">
                  <Phone className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                  <span>{vehicleData.customer?.cellPhone || 'Not provided'}</span>
                </div>
                {vehicleData.customer?.homePhone && (
                  <div className="flex items-center gap-2 text-xs md:text-sm">
                    <Phone className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                    <span>Home: {vehicleData.customer.homePhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs md:text-sm">
                  <Mail className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                  <span>{vehicleData.customer?.email1 || 'Not provided'}</span>
                </div>
                {vehicleData.customer?.email2 && (
                  <div className="flex items-center gap-2 text-xs md:text-sm">
                    <Mail className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                    <span>Alt: {vehicleData.customer.email2}</span>
                  </div>
                )}
                {vehicleData.customer?.email3 && (
                  <div className="flex items-center gap-2 text-xs md:text-sm">
                    <Mail className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                    <span>Alt 2: {vehicleData.customer.email3}</span>
                  </div>
                )}
              </div>
              
              {vehicleData.customer?.hearAboutVOS && (
                <div className="flex items-center gap-2 text-xs md:text-sm">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                  <span>Heard about VOS via: {vehicleData.customer.hearAboutVOS}</span>
                </div>
              )}
              
              {vehicleData.customer?.storeLocation && (
                <div className="flex items-center gap-2 text-xs md:text-sm">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                  <span>Store Location: {vehicleData.customer.storeLocation}</span>
                </div>
              )}
            </div>

            {/* Customer Source */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-2">
                <p className="text-xs md:text-sm font-medium text-gray-500">Customer Source</p>
                <p className="text-sm md:font-medium">{getSourceLabel(vehicleData?.customer?.source)}</p>
              </div>
              
              {vehicleData.customer?.receivedOtherQuote && (
                <div className="p-2 md:p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs md:text-sm text-blue-800">
                    <strong>Competition:</strong> Received quote from {vehicleData.customer.otherQuoteOfferer} for {formatCurrency(vehicleData.customer.otherQuoteAmount || 0)}
                  </p>
                </div>
              )}
            </div>

            {vehicleData.customer?.notes && (
              <div className="p-2 md:p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs md:text-sm text-yellow-800">
                  <strong>Notes:</strong> {vehicleData.customer.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Information */}
        <Card>
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Car className="h-4 w-4 md:h-5 md:w-5" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Car className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-base md:text-lg">
                  {vehicleData.vehicle?.year} {vehicleData.vehicle?.make} {vehicleData.vehicle?.model}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  VIN: {vehicleData.vehicle?.vin?.slice(-8) || 'Not provided'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 text-xs md:text-sm">
              <div>
                <span className="text-gray-500">Mileage:</span>
                <p className="font-medium">{vehicleData.vehicle?.currentMileage || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-gray-500">Color:</span>
                <p className="font-medium">{vehicleData.vehicle?.color || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-gray-500">Body Style:</span>
                <p className="font-medium">{vehicleData.vehicle?.bodyStyle || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-gray-500">Title Status:</span>
                <p className="font-medium capitalize">{vehicleData.vehicle?.titleStatus || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-gray-500">Loan Status:</span>
                <p className="font-medium capitalize">{vehicleData.vehicle?.loanStatus || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-gray-500">License Plate:</span>
                <p className="font-medium">{vehicleData.vehicle?.licensePlate || 'Not provided'}</p>
              </div>
              {vehicleData.vehicle?.licenseState && (
                <div>
                  <span className="text-gray-500">License State:</span>
                  <p className="font-medium">{vehicleData.vehicle.licenseState}</p>
                </div>
              )}
              {vehicleData.vehicle?.titleNumber && (
                <div>
                  <span className="text-gray-500">Title Number:</span>
                  <p className="font-medium">{vehicleData.vehicle.titleNumber}</p>
                </div>
              )}
              {vehicleData.vehicle?.loanAmount && (
                <div>
                  <span className="text-gray-500">Loan Amount:</span>
                  <p className="font-medium">{formatCurrency(vehicleData.vehicle.loanAmount)}</p>
                </div>
              )}
            </div>

            {vehicleData.vehicle?.estimatedValue && (
              <div className="p-2 md:p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-green-800">Estimated Value</p>
                    <p className="text-base md:text-lg font-bold text-green-600">
                      {formatCurrency(vehicleData.vehicle.estimatedValue)}
                    </p>
                  </div>
                  <div className="text-xs text-green-600">
                    via {vehicleData.vehicle.pricingSource || 'MarketCheck'}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs md:text-sm">
                <CreditCard className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                <span>Second set of keys: {vehicleData.vehicle?.secondSetOfKeys ? 'Yes' : 'No'}</span>
              </div>
              
              {vehicleData.vehicle?.knownDefects && (
                <div className="p-2 md:p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs md:text-sm font-medium text-red-800 mb-1">Known Defects:</p>
                  <p className="text-xs md:text-sm text-red-700">{vehicleData.vehicle.knownDefects}</p>
                </div>
              )}
              
              {vehicleData.vehicle?.pricingSource && (
                <div className="text-xs text-gray-500">
                  Pricing Source: {vehicleData.vehicle.pricingSource}
                  {vehicleData.vehicle.pricingLastUpdated && (
                    <span> • Updated: {formatDate(vehicleData.vehicle.pricingLastUpdated)}</span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Process Stages */}
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <FileCheck className="h-4 w-4 md:h-5 md:w-5" />
            Process Stages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            {stages.map((stage) => {
              const isAccessible = isStageAccessible(stage.id)
              const isExpanded = expandedSection === `stage-${stage.id}`
              
              return (
                <div key={stage.id} className="border rounded-lg overflow-hidden">
                  <div 
                    className={`p-3 md:p-4 cursor-pointer transition-colors ${
                      isExpanded ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleSection(`stage-${stage.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${stage.color}`}>
                          <stage.icon className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm md:text-base">{stage.name}</h4>
                          <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">{stage.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3">
                        {isAccessible && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onStageChange(stage.id)
                            }}
                            className="text-xs md:text-sm"
                          >
                            <Eye className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                        )}
                        <ArrowRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-3 md:p-4 bg-gray-50 border-t">
                      {/* Stage-specific content */}
                      {stage.id === 1 && (
                        <div className="space-y-3 text-xs md:text-sm">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div>
                              {vehicleData.customer?.firstName && (
                                <p><strong>Customer:</strong> {vehicleData.customer.firstName} {vehicleData.customer.middleInitial} {vehicleData.customer.lastName}</p>
                              )}
                              {vehicleData.customer?.agent && (
                                <p><strong>Agent:</strong> {vehicleData.customer.agent}</p>
                              )}
                            </div>
                            <div>
                              {vehicleData.vehicle?.year && (
                                <p><strong>Vehicle:</strong> {vehicleData.vehicle.year} {vehicleData.vehicle.make} {vehicleData.vehicle.model}</p>
                              )}
                              {vehicleData.vehicle?.vin && (
                                <p><strong>VIN:</strong> {vehicleData.vehicle.vin}</p>
                              )}
                            </div>
                          </div>
                          
                          {vehicleData.customer?.notes && (
                            <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                              <p><strong>Notes:</strong> {vehicleData.customer.notes}</p>
                            </div>
                          )}
                          
                          {vehicleData.customer?.receivedOtherQuote && (
                            <div className="p-2 bg-blue-50 rounded border border-blue-200">
                              <p><strong>Competition:</strong> {vehicleData.customer.otherQuoteOfferer} - {formatCurrency(vehicleData.customer.otherQuoteAmount || 0)}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {stage.id === 2 && vehicleData.inspection && (
                        <div className="space-y-3 text-xs md:text-sm">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div>
                              {vehicleData.inspection.inspector && (
                                <div>
                                  <p><strong>Inspector:</strong> {vehicleData.inspection.inspector.firstName} {vehicleData.inspection.inspector.lastName}</p>
                                  <p className="text-xs text-gray-500">{vehicleData.inspection.inspector.email}</p>
                                  {vehicleData.inspection.inspector.phone && (
                                    <p className="text-xs text-gray-500">{vehicleData.inspection.inspector.phone}</p>
                                  )}
                                </div>
                              )}
                            </div>
                            <div>
                              {vehicleData.inspection.scheduledDate && (
                                <p><strong>Scheduled:</strong> {formatDate(vehicleData.inspection.scheduledDate)} at {vehicleData.inspection.scheduledTime}</p>
                              )}
                              {vehicleData.inspection.emailSent && (
                                <p><strong>Email Sent:</strong> Yes</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {stage.id === 3 && vehicleData.inspection && (
                        <div className="space-y-3 text-xs md:text-sm">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div>
                              {vehicleData.inspection.overallRating && (
                                <div>
                                  <span><strong>Rating:</strong></span>
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-4 w-4 ${
                                          star <= vehicleData.inspection!.overallRating!
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                    <span>({vehicleData.inspection.overallRating}/5)</span>
                                  </div>
                                </div>
                              )}
                              {vehicleData.inspection.overallScore && vehicleData.inspection.maxPossibleScore && (
                                <p><strong>Score:</strong> {vehicleData.inspection.overallScore}/{vehicleData.inspection.maxPossibleScore}</p>
                              )}
                            </div>
                            <div>
                              {vehicleData.inspection.completedAt && (
                                <p><strong>Completed:</strong> {formatDate(vehicleData.inspection.completedAt)}</p>
                              )}
                              {vehicleData.inspection.sections && (
                                <p><strong>Sections:</strong> {vehicleData.inspection.sections.length} completed</p>
                              )}
                            </div>
                          </div>
                          
                          {vehicleData.inspection.inspectionNotes && (
                            <div className="p-2 bg-blue-50 rounded border border-blue-200">
                              <p><strong>Notes:</strong> {vehicleData.inspection.inspectionNotes}</p>
                            </div>
                          )}
                          
                          {vehicleData.inspection.recommendations && vehicleData.inspection.recommendations.length > 0 && (
                            <div className="p-2 bg-green-50 rounded border border-green-200">
                              <p><strong>Recommendations:</strong></p>
                              <ul className="list-disc list-inside text-xs">
                                {vehicleData.inspection.recommendations.map((rec, idx) => (
                                  <li key={idx}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {stage.id === 4 && vehicleData.quote && (
                        <div className="space-y-3 text-xs md:text-sm">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div>
                              {vehicleData.quote.offerAmount && (
                                <p><strong>Offer Amount:</strong> {formatCurrency(vehicleData.quote.offerAmount)}</p>
                              )}
                              {vehicleData.quote.estimatedValue && (
                                <p><strong>Estimated Value:</strong> {formatCurrency(vehicleData.quote.estimatedValue)}</p>
                              )}
                            </div>
                            <div>
                              {vehicleData.quote.expiryDate && (
                                <p><strong>Expires:</strong> {formatDate(vehicleData.quote.expiryDate)}</p>
                              )}
                              {vehicleData.quote.emailSent && (
                                <p><strong>Email Sent:</strong> Yes</p>
                              )}
                              {vehicleData.quote.titleReminder && (
                                <p><strong>Title Reminder:</strong> Sent</p>
                              )}
                            </div>
                          </div>
                          
                          {vehicleData.quote.estimator && (
                            <div className="p-2 bg-purple-50 rounded border border-purple-200">
                              <p><strong>Estimator:</strong> {vehicleData.quote.estimator.firstName} {vehicleData.quote.estimator.lastName}</p>
                              <p className="text-xs">{vehicleData.quote.estimator.email}</p>
                              {vehicleData.quote.estimator.phone && (
                                <p className="text-xs">{vehicleData.quote.estimator.phone}</p>
                              )}
                            </div>
                          )}
                          
                          {vehicleData.quote.notes && (
                            <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                              <p><strong>Notes:</strong> {vehicleData.quote.notes}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {stage.id === 5 && (
                        <div className="space-y-3 text-xs md:text-sm">
                          {vehicleData.offerDecision ? (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                <div>
                                  <p><strong>Decision:</strong> 
                                    <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                                      vehicleData.offerDecision.decision === 'accepted' ? 'bg-green-100 text-green-800' :
                                      vehicleData.offerDecision.decision === 'declined' ? 'bg-red-100 text-red-800' :
                                      vehicleData.offerDecision.decision === 'negotiating' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {vehicleData.offerDecision.decision || 'Pending'}
                                    </span>
                                  </p>
                                  {vehicleData.offerDecision.finalAmount && (
                                    <p><strong>Final Amount:</strong> {formatCurrency(vehicleData.offerDecision.finalAmount)}</p>
                                  )}
                                  {vehicleData.offerDecision.counterOffer && (
                                    <p><strong>Counter Offer:</strong> {formatCurrency(vehicleData.offerDecision.counterOffer)}</p>
                                  )}
                                </div>
                                <div>
                                  {vehicleData.offerDecision.decisionDate && (
                                    <p><strong>Decision Date:</strong> {formatDate(vehicleData.offerDecision.decisionDate)}</p>
                                  )}
                                  {vehicleData.offerDecision.acceptedAt && (
                                    <p><strong>Accepted:</strong> {formatDate(vehicleData.offerDecision.acceptedAt)}</p>
                                  )}
                                  {vehicleData.offerDecision.declinedAt && (
                                    <p><strong>Declined:</strong> {formatDate(vehicleData.offerDecision.declinedAt)}</p>
                                  )}
                                </div>
                              </div>
                              
                              {vehicleData.offerDecision.customerNotes && (
                                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                                  <p><strong>Customer Notes:</strong> {vehicleData.offerDecision.customerNotes}</p>
                                </div>
                              )}
                              
                              {vehicleData.offerDecision.reason && (
                                <div className="p-2 bg-red-50 rounded border border-red-200">
                                  <p><strong>Reason:</strong> {vehicleData.offerDecision.reason}</p>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="space-y-3 text-xs md:text-sm">
                              <div className="p-2 md:p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <p className="text-xs md:text-sm text-yellow-800">
                                  <strong>Status:</strong> Awaiting customer decision
                                </p>
                              </div>
                              
                              {vehicleData.quote && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                  <div>
                                    <p><strong>Offer Amount:</strong> {formatCurrency(vehicleData.quote.offerAmount || 0)}</p>
                                  </div>
                                  <div>
                                    {vehicleData.quote.expiryDate && (
                                      <p><strong>Expires:</strong> {formatDate(vehicleData.quote.expiryDate)}</p>
                                    )}
                                    {vehicleData.quote.emailSent && (
                                      <p><strong>Email Sent:</strong> Yes</p>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {vehicleData.quote?.estimator && (
                                <div className="p-2 bg-purple-50 rounded border border-purple-200">
                                  <p><strong>Estimator:</strong> {vehicleData.quote.estimator.firstName} {vehicleData.quote.estimator.lastName}</p>
                                  <p className="text-xs">{vehicleData.quote.estimator.email}</p>
                                  {vehicleData.quote.estimator.phone && (
                                    <p className="text-xs">{vehicleData.quote.estimator.phone}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {stage.id === 6 && vehicleData.transaction && (
                        <div className="space-y-3 text-xs md:text-sm">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div>
                              {vehicleData.transaction.billOfSale?.salePrice && (
                                <p><strong>Sale Price:</strong> {formatCurrency(vehicleData.transaction.billOfSale.salePrice)}</p>
                              )}
                              {vehicleData.transaction.billOfSale?.paymentMethod && (
                                <p><strong>Payment Method:</strong> {vehicleData.transaction.billOfSale.paymentMethod}</p>
                              )}
                            </div>
                            <div>
                              {vehicleData.transaction.billOfSale?.saleDate && (
                                <p><strong>Sale Date:</strong> {formatDate(vehicleData.transaction.billOfSale.saleDate)}</p>
                              )}
                              {vehicleData.transaction.submittedAt && (
                                <p><strong>Submitted:</strong> {formatDate(vehicleData.transaction.submittedAt)}</p>
                              )}
                            </div>
                          </div>
                          
                          {vehicleData.transaction.billOfSale?.sellerName && (
                            <div className="p-2 bg-green-50 rounded border border-green-200">
                              <p><strong>Seller:</strong> {vehicleData.transaction.billOfSale.sellerName}</p>
                              <p className="text-xs">{vehicleData.transaction.billOfSale.sellerAddress}, {vehicleData.transaction.billOfSale.sellerCity}, {vehicleData.transaction.billOfSale.sellerState} {vehicleData.transaction.billOfSale.sellerZip}</p>
                              <p className="text-xs">{vehicleData.transaction.billOfSale.sellerPhone} • {vehicleData.transaction.billOfSale.sellerEmail}</p>
                            </div>
                          )}
                          
                          {vehicleData.transaction.documents && Object.keys(vehicleData.transaction.documents).length > 0 && (
                            <div className="p-2 bg-blue-50 rounded border border-blue-200">
                              <p><strong>Documents:</strong></p>
                              <ul className="list-disc list-inside text-xs">
                                {Object.entries(vehicleData.transaction.documents).map(([key, value]) => (
                                  <li key={key}>{key}: {value || 'Not provided'}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {stage.id === 7 && vehicleData.completion && (
                        <div className="space-y-3 text-xs md:text-sm">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div>
                              {vehicleData.completion.sentAt && (
                                <p><strong>Thank You Sent:</strong> {formatDate(vehicleData.completion.sentAt)}</p>
                              )}
                            </div>
                            <div>
                              {vehicleData.completion.completedAt && (
                                <p><strong>Completed:</strong> {formatDate(vehicleData.completion.completedAt)}</p>
                              )}
                            </div>
                          </div>
                          
                          {vehicleData.completion.leaveBehinds && (
                            <div className="p-2 bg-green-50 rounded border border-green-200">
                              <p><strong>Leave-behinds Checklist:</strong></p>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                <div className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${vehicleData.completion.leaveBehinds.vehicleLeft ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                  <span>Vehicle left at location</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${vehicleData.completion.leaveBehinds.keysHandedOver ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                  <span>All keys handed over</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${vehicleData.completion.leaveBehinds.documentsReceived ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                  <span>Documents received</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Inspection Details (if completed) */}
      {vehicleData.inspection?.completed && vehicleData.inspection.sections && (
        <Card>
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <ClipboardList className="h-4 w-4 md:h-5 md:w-5" />
              Detailed Inspection Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            {/* Overall Inspection Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 p-3 md:p-4 bg-blue-50 rounded-lg">
              <div className="text-center">
                <p className="text-xl md:text-2xl font-bold text-blue-600">{vehicleData.inspection.overallRating || 0}/5</p>
                <p className="text-xs md:text-sm text-blue-800">Overall Rating</p>
              </div>
              <div className="text-center">
                <p className="text-xl md:text-2xl font-bold text-green-600">
                  {vehicleData.inspection.overallScore || 0}/{vehicleData.inspection.maxPossibleScore || 0}
                </p>
                <p className="text-xs md:text-sm text-green-800">Total Score</p>
              </div>
              <div className="text-center">
                <p className="text-xl md:text-2xl font-bold text-purple-600">{vehicleData.inspection.sections.length}</p>
                <p className="text-xs md:text-sm text-purple-800">Sections Completed</p>
              </div>
            </div>

            {/* Section Details */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 text-sm md:text-base">Section Breakdown</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {vehicleData.inspection.sections.map((section, index) => (
                  <div key={index} className="p-3 md:p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-xs md:text-sm">{section.name}</h5>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= section.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <p className="text-gray-600">
                        Rating: {section.rating}/5
                        {section.score && section.maxScore && (
                          <span> • Score: {section.score}/{section.maxScore}</span>
                        )}
                      </p>
                      {section.description && (
                        <p className="text-gray-500 italic">{section.description}</p>
                      )}
                      {section.completed && (
                        <p className="text-green-600 font-medium">✓ Completed</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Issues */}
            {vehicleData.inspection.safetyIssues && vehicleData.inspection.safetyIssues.length > 0 && (
              <div className="p-3 md:p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-800 mb-3 flex items-center gap-2 text-sm md:text-base">
                  <AlertTriangle className="h-4 w-4" />
                  Safety Issues ({vehicleData.inspection.safetyIssues.length})
                </h4>
                <div className="space-y-3 text-xs md:text-sm">
                  {vehicleData.inspection.safetyIssues.map((issue, index) => (
                    <div key={index} className="p-2 md:p-3 bg-white rounded border border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          issue.severity === 'critical' ? 'bg-red-600 text-white' :
                          issue.severity === 'high' ? 'bg-orange-600 text-white' :
                          issue.severity === 'medium' ? 'bg-yellow-600 text-white' :
                          'bg-blue-600 text-white'
                        }`}>
                          {issue.severity.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-red-800">
                          ${issue.estimatedCost.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-red-700 mb-1">{issue.description}</p>
                      <p className="text-xs text-red-600">Location: {issue.location}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Maintenance Items */}
            {vehicleData.inspection.maintenanceItems && vehicleData.inspection.maintenanceItems.length > 0 && (
              <div className="p-3 md:p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-800 mb-3 flex items-center gap-2 text-sm md:text-base">
                  <Settings className="h-4 w-4" />
                  Maintenance Items ({vehicleData.inspection.maintenanceItems.length})
                </h4>
                <div className="space-y-3 text-xs md:text-sm">
                  {vehicleData.inspection.maintenanceItems.map((item, index) => (
                    <div key={index} className="p-2 md:p-3 bg-white rounded border border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.priority === 'high' ? 'bg-red-600 text-white' :
                          item.priority === 'medium' ? 'bg-orange-600 text-white' :
                          'bg-blue-600 text-white'
                        }`}>
                          {item.priority.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-orange-800">
                          ${item.estimatedCost.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-orange-700 mb-1">{item.description}</p>
                      <p className="text-xs text-orange-600">Action: {item.recommendedAction}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIN Verification Status */}
            {vehicleData.inspection.vinVerification && (
              <div className="p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2 text-sm md:text-base">
                  <Car className="h-4 w-4" />
                  VIN Verification
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                  <div>
                    <span className="text-gray-600">VIN Entered:</span>
                    <span className="ml-2 font-medium text-gray-800 font-mono">
                      {vehicleData.inspection.vinVerification.vinNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">VIN Match:</span>
                    <span className={`ml-2 font-medium ${
                      vehicleData.inspection.vinVerification.vinMatch === 'yes' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {vehicleData.inspection.vinVerification.vinMatch === 'yes' 
                        ? '✅ VINs Match' 
                        : '❌ VINs Do Not Match'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes for Inspector */}
            {vehicleData.inspection.notesForInspector && (
              <div className="p-3 md:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2 text-sm md:text-base">
                  <ClipboardList className="h-4 w-4" />
                  Notes for Inspector
                </h4>
                <p className="text-sm text-yellow-700 whitespace-pre-wrap">{vehicleData.inspection.notesForInspector}</p>
              </div>
            )}

            {/* Inspection Notes */}
            {vehicleData.inspection.inspectionNotes && (
              <div className="p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2 text-sm md:text-base">Inspection Notes</h4>
                <p className="text-sm text-blue-700">{vehicleData.inspection.inspectionNotes}</p>
              </div>
            )}

            {/* Recommendations */}
            {vehicleData.inspection.recommendations && vehicleData.inspection.recommendations.length > 0 && (
              <div className="p-3 md:p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2 text-sm md:text-base">Recommendations</h4>
                <ul className="space-y-1 text-xs md:text-sm">
                  {vehicleData.inspection.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Financial Summary */}
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <DollarSign className="h-4 w-4 md:h-5 md:w-5" />
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="p-3 md:p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-center">
                <p className="text-xl md:text-2xl font-bold text-green-600">
                  {formatCurrency(getFinalAmount())}
                </p>
                <p className="text-xs md:text-sm text-green-800">Final Sale Price</p>
              </div>
            </div>
            
            {vehicleData.vehicle?.estimatedValue && (
              <div className="p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-center">
                  <p className="text-xl md:text-2xl font-bold text-blue-600">
                    {formatCurrency(vehicleData.vehicle.estimatedValue)}
                  </p>
                  <p className="text-xs md:text-sm text-blue-800">Estimated Value</p>
                </div>
              </div>
            )}
            
            {vehicleData.quote?.offerAmount && (
              <div className="p-3 md:p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-center">
                  <p className="text-xl md:text-2xl font-bold text-purple-600">
                    {formatCurrency(vehicleData.quote.offerAmount)}
                  </p>
                  <p className="text-xs md:text-sm text-purple-800">Initial Offer</p>
                </div>
              </div>
            )}
            
            {vehicleData.offerDecision?.counterOffer && (
              <div className="p-3 md:p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-center">
                  <p className="text-xl md:text-2xl font-bold text-orange-600">
                    {formatCurrency(vehicleData.offerDecision.counterOffer)}
                  </p>
                  <p className="text-xs md:text-sm text-orange-800">Counter Offer</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Cost Analysis */}
          {vehicleData.inspection?.safetyIssues && vehicleData.inspection.safetyIssues.length > 0 && (
            <div className="mt-4 md:mt-6 p-3 md:p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-800 mb-3 text-sm md:text-base">Safety Issues Cost Analysis</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                <div>
                  <p className="text-sm text-red-700">
                    <strong>Total Safety Issues:</strong> {vehicleData.inspection.safetyIssues.length}
                  </p>
                  <p className="text-sm text-red-700">
                    <strong>Total Estimated Cost:</strong> {formatCurrency(
                      vehicleData.inspection.safetyIssues.reduce((sum, issue) => sum + issue.estimatedCost, 0)
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-red-700">
                    <strong>Critical Issues:</strong> {vehicleData.inspection.safetyIssues.filter(i => i.severity === 'critical').length}
                  </p>
                  <p className="text-sm text-red-700">
                    <strong>High Priority:</strong> {vehicleData.inspection.safetyIssues.filter(i => i.severity === 'high').length}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Maintenance Cost Analysis */}
          {vehicleData.inspection?.maintenanceItems && vehicleData.inspection.maintenanceItems.length > 0 && (
            <div className="mt-4 p-3 md:p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-800 mb-3 text-sm md:text-base">Maintenance Cost Analysis</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                <div>
                  <p className="text-sm text-orange-700">
                    <strong>Total Maintenance Items:</strong> {vehicleData.inspection.maintenanceItems.length}
                  </p>
                  <p className="text-sm text-orange-700">
                    <strong>Total Estimated Cost:</strong> {formatCurrency(
                      vehicleData.inspection.maintenanceItems.reduce((sum, item) => sum + item.estimatedCost, 0)
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-orange-700">
                    <strong>High Priority:</strong> {vehicleData.inspection.maintenanceItems.filter(i => i.priority === 'high').length}
                  </p>
                  <p className="text-sm text-orange-700">
                    <strong>Medium Priority:</strong> {vehicleData.inspection.maintenanceItems.filter(i => i.priority === 'medium').length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 