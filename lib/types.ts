export interface Customer {
  id?: string;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  cellPhone: string;
  homePhone?: string;
  email1: string;
  email2?: string;
  email3?: string;
  hearAboutVOS?: string;
  source?: string; // Add customer source field
  receivedOtherQuote?: boolean;
  otherQuoteOfferer?: string;
  otherQuoteAmount?: number;
  agent?: string;
  notes:string;
  storeLocation?: string;
}

export interface Vehicle {
  id?: string;
  customer?: string;
  year: string;
  make: string;
  model: string;
  currentMileage: string;
  vin?: string;
  color?: string;
  bodyStyle?: string;
  licensePlate?: string;
  licenseState?: string;
  titleNumber?: string;
  titleStatus?: 'clean' | 'salvage' | 'rebuilt' | 'lemon' | 'flood' | 'junk' | 'not-sure';
  loanStatus?: 'paid-off' | 'still-has-loan' | 'not-sure';
  loanAmount?: number;
  secondSetOfKeys?: boolean;
  hasTitleInPossession?: boolean;
  titleInOwnName?: boolean;
  knownDefects?: string;
  estimatedValue?: number;
  pricingSource?: string;
  pricingLastUpdated?: string;
  isElectric?: boolean;
}

export interface Inspector {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
}

export interface InspectionQuestion {
  id: string;
  question: string;
  type: 'radio' | 'checkbox' | 'text' | 'rating' | 'photo' | 'yesno' | 'number';
  options?: Array<{
    value: string;
    label: string;
    points: number;
  }>;
  required?: boolean;
  answer?: string | string[] | number;
  notes?: string;
  photos?: Array<{
    path: string;
    originalName: string;
    uploadedAt: Date;
  }>;
  subQuestions?: Array<{
    id: string;
    question: string;
    type: 'radio' | 'checkbox' | 'text' | 'rating' | 'photo' | 'yesno' | 'number';
    options?: Array<{
      value: string;
      label: string;
      points: number;
    }>;
    answer?: string | string[] | number;
    notes?: string;
    photos?: Array<{
      path: string;
      originalName: string;
      uploadedAt: Date;
    }>;
  }>;
}

export interface InspectionSection {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  questions: InspectionQuestion[];
  rating?: number;
  photos?: Array<{
    path: string;
    originalName: string;
    uploadedAt: Date;
  }>;
  score?: number;
  maxScore?: number;
  completed?: boolean;
}

export interface SafetyIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  estimatedCost: number;
}

export interface MaintenanceItem {
  priority: 'low' | 'medium' | 'high';
  description: string;
  estimatedCost: number;
  recommendedAction: string;
}

export interface Inspection {
  id?: string;
  vehicle: string | Vehicle;
  customer: string | Customer;
  inspector: Inspector;
  scheduledDate: Date;
  scheduledTime: string;
  caseId: string;
  inspectorId: string;
  inspectorName: string;
  notesForInspector?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  accessToken?: string;
  sections: InspectionSection[];
  overallRating?: number;
  overallScore?: number;
  maxPossibleScore?: number;
  emailSent?: boolean;
  completed?: boolean;
  completedAt?: Date;
  inspectionNotes?: string;
  recommendations?: string[];
  safetyIssues?: SafetyIssue[];
  maintenanceItems?: MaintenanceItem[];
  vinVerification?: {
    vinNumber: string;
    vinMatch: 'yes' | 'no' | 'not_verified';
  };
  createdBy?: string;
}

export interface Estimator {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface Quote {
  id?: string;
  caseId?: string;
  vehicle: string;
  customer: string;
  inspection: string;
  estimator: Estimator;
  offerAmount: number;
  expiryDate: Date;
  notes?: string;
  titleReminder?: boolean;
  estimatedValue?: number;
  status: 'draft' | 'ready' | 'presented' | 'accepted' | 'negotiating' | 'declined' | 'expired';
  accessToken?: string;
  offerDecision?: {
    decision: 'accepted' | 'negotiating' | 'declined' | 'pending';
    counterOffer?: number;
    customerNotes?: string;
    finalAmount?: number;
    decisionDate?: Date;
    reason?: string;
  };
  emailSent?: boolean;
  createdAt?: string;
  updatedAt?: string;
}


export interface Case {
  id?: string;
  customer: Customer | string;
  vehicle: Vehicle | string;
  inspection?: Inspection | string;
  quote?: Quote | string;
  transaction?: string;
  currentStage: number;
  stageStatuses: {
    [key: number]: 'active' | 'complete' | 'pending';
  };
  status: 'new' | 'active' | 'scheduled' | 'quote-ready' | 'negotiating' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  estimatedValue?: number;
  thankYouSent?: boolean;
  completion?: {
    thankYouSent?: boolean;
    sentAt?: string;
    leaveBehinds?: {
      vehicleLeft?: boolean;
      keysHandedOver?: boolean;
      documentsReceived?: boolean;
    };
    pdfGenerated?: boolean;
    completedAt?: string;
    titleConfirmation?: boolean;
  };
  lastActivity?: {
    description: string;
    timestamp: Date;
  };
  pdfCaseFile?: string;
  createdBy?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CustomerData extends Omit<Customer, 'id' | 'agent' | 'storeLocation'> {
  hearAboutVOS: string;
  source?: string; // Add customer source field
  receivedOtherQuote: boolean;
  otherQuoteOfferer?: string;
  otherQuoteAmount?: number;
}

export interface VehicleData extends Omit<Vehicle, 'id' | 'customer'> {
  year: string;
  make: string;
  model: string;
  currentMileage: string;
  vin?: string;
  titleStatus?: 'clean' | 'salvage' | 'rebuilt' | 'not-sure';
  loanStatus?: 'paid-off' | 'still-has-loan' | 'not-sure';
  loanAmount?: number;
  secondSetOfKeys: boolean;
  hasTitleInPossession?: boolean;
  titleInOwnName?: boolean;
  estimatedValue?: number;
  pricingSource?: string;
  pricingLastUpdated?: string;
  isElectric?: boolean;
}

// User and Auth types
export type UserRole = 'admin' | 'agent' | 'estimator' | 'inspector';

export interface User {
  id?: string;
  _id?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  location?: string;
  createdAt?: Date;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

export interface Transaction {
  billOfSale?: {
    sellerName?: string;
    sellerAddress?: string;
    sellerCity?: string;
    sellerState?: string;
    sellerZip?: string;
    sellerPhone?: string;
    sellerEmail?: string;
    sellerDLNumber?: string;
    sellerDLState?: string;
    vehicleVIN?: string;
    vehicleYear?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleMileage?: string;
    vehicleColor?: string;
    vehicleBodyStyle?: string;
    vehicleTitleNumber?: string;
    vehicleLicensePlate?: string;
    vehicleLicenseState?: string;
    saleDate?: string;
    saleTime?: string;
    salePrice?: number;
    paymentMethod?: string;
    odometerReading?: string;
    odometerAccurate?: boolean;
    titleStatus?: string;
    knownDefects?: string;
    asIsAcknowledgment?: boolean;
    sellerDisclosure?: boolean;
    buyerDisclosure?: boolean;
    notaryRequired?: boolean;
    notaryName?: string;
    notaryCommissionExpiry?: string;
    witnessName?: string;
    witnessPhone?: string;
  };
  bankDetails?: {
    bankName?: string;
    loanNumber?: string;
    payoffAmount?: number;
  };
  preferredPaymentMethod?: string;
  documents?: Record<string, string | null>;
  paymentStatus?: string;
  submittedAt?: string;
  completedAt?: string;
  createdBy?: string;
}
