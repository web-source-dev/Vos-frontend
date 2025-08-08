// Vehicle specs are now fetched directly in components using the API endpoint

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (
  process.env.NODE_ENV === 'production' 
    ? 'https://vos-backend-bh76.onrender.com' 
    : 'http://localhost:5000'
);

export interface VehicleSubmissionData {
  id?: string;
  vinOrPlate: {
    vin: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    trim: string;
    transmission: string;
    estimatedPrice?: number;
  };
  basics?: {
    mileage?: number;
    zipCode?: string;
    color?: string;
    transmission?: string;
    drivetrain?: string;
    engine?: string;
    loanLeaseStatus?: string;
    loanDetails?: {
      lenderName?: string;
      loanBalance?: number;
      monthlyPayment?: number;
    };
    leaseDetails?: {
      leasingCompany?: string;
      leasePayoff?: number;
      monthlyPayment?: number;
    };
  };
  condition?: {
    accidentHistory?: string;
    isDrivable?: boolean;
    mechanicalIssues?: string[];
    engineIssues?: string[];
    exteriorDamage?: string[];
    interiorCondition?: string[];
    windshieldCondition?: string;
    sunroofCondition?: string;
    tiresReplaced?: number;
    hasModifications?: boolean;
    smokedIn?: boolean;
    keyCount?: number;
    overallCondition?: string;
  };
  contact?: {
    email?: string;
    mobile?: string;
  };
  offer?: {
    amount?: number;
    expiresAt?: Date;
    generated?: boolean;
    generatedAt?: Date;
  };
  ownership?: {
    odometerPhoto?: string;
    photoID?: string;
    titleVerified?: boolean;
  };
  saleConfirmation?: {
    state?: string;
  };
  payoutMethod?: string;
  appointment?: {
    type?: string;
    address?: string;
    notes?: string;
  };
  appointmentDateTime?: string;
}

export interface CreateVehicleSubmissionRequest {
  type: 'vin' | 'license';
  value: string;
  state?: string;
  vehicleSpecs?: {
    year?: string;
    make?: string;
    model?: string;
    trim?: string;
    transmission?: string;
    engine?: string;
    drivetrain?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Create initial vehicle submission with VIN or license plate
export const createVehicleSubmission = async (
  data: CreateVehicleSubmissionRequest
): Promise<ApiResponse<VehicleSubmissionData>> => {
  try {
    // Note: Vehicle specs are now fetched directly in the component, 
    // so we just pass the basic data to the backend
    const response = await fetch(`${API_BASE_URL}/api/customer/vehicle-submission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Error creating vehicle submission:', error);
    return {
      success: false,
      error: 'Failed to create vehicle submission'
    };
  }
};

// Get vehicle submission by ID
export const getVehicleSubmission = async (
  id: string
): Promise<ApiResponse<VehicleSubmissionData>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/customer/vehicle-submission/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Error fetching vehicle submission:', error);
    return {
      success: false,
      error: 'Failed to fetch vehicle submission'
    };
  }
};

// Update vehicle info (make, model, year)
export const updateVehicleInfo = async (
  id: string,
  vehicleInfo: { make?: string; model?: string; year?: number }
): Promise<ApiResponse<VehicleSubmissionData>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/customer/vehicle-submission/${id}/vehicle-info`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(vehicleInfo)
    });
    
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Error updating vehicle info:', error);
    return {
      success: false,
      error: 'Failed to update vehicle info'
    };
  }
};

// Update vehicle basics (Step 2)
export const updateVehicleBasics = async (
  id: string,
  basicsData: VehicleSubmissionData['basics']
): Promise<ApiResponse<VehicleSubmissionData>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/customer/vehicle-submission/${id}/basics`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(basicsData)
    });
    
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Error updating vehicle basics:', error);
    return {
      success: false,
      error: 'Failed to update vehicle basics'
    };
  }
};

// Update vehicle condition (Step 3)
export const updateVehicleCondition = async (
  id: string,
  conditionData: VehicleSubmissionData['condition']
): Promise<ApiResponse<VehicleSubmissionData>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/customer/vehicle-submission/${id}/condition`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(conditionData)
    });
    
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Error updating vehicle condition:', error);
    return {
      success: false,
      error: 'Failed to update vehicle condition'
    };
  }
};

// Update contact email and generate offer (Step 4)
export const updateContactAndGenerateOffer = async (
  id: string,
  email: string
): Promise<ApiResponse<VehicleSubmissionData>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/customer/vehicle-submission/${id}/contact-offer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email })
    });
    
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Error updating contact and generating offer:', error);
    return {
      success: false,
      error: 'Failed to update contact and generate offer'
    };
  }
};

// Check if user exists with given email
export const checkUserExists = async (email: string): Promise<ApiResponse<{ exists: boolean; email: string }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/check-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email })
    });
    
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Error checking user existence:', error);
    return {
      success: false,
      error: 'Failed to check user existence'
    };
  }
};

// Check if user is currently logged in
export const checkAuthStatus = async (): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Error checking auth status:', error);
    return {
      success: false,
      error: 'Failed to check auth status'
    };
  }
};

// Get customer vehicle submissions by email
export const getCustomerSubmissions = async (email: string): Promise<ApiResponse<any[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/customer/vehicle-submissions/email/${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Error fetching customer submissions:', error);
    return {
      success: false,
      error: 'Failed to fetch customer submissions'
    };
  }
};
