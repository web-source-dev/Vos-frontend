import type { Customer, Vehicle, Inspector, Inspection, Quote, Case, APIResponse, User, AuthResponse } from './types';
import Cookies from 'js-cookie';

// Update API URL configuration to match the deployed backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (
  process.env.NODE_ENV === 'production' 
    ? 'https://vos-backend-bh76.onrender.com' 
    : 'http://localhost:5000'
);

console.log('Using API URL:', API_BASE_URL);

// Function to get auth headers with retry
const getAuthHeaders = async (retryCount = 0): Promise<Record<string, string>> => {
  const maxRetries = 3;
  const retryDelay = 100; // 100ms

  const token = Cookies.get('token');
  console.log('API Call - Token status:', token ? 'Token exists' : 'No token', 'Retry:', retryCount);
  
  if (!token && retryCount < maxRetries) {
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, retryDelay));
    return getAuthHeaders(retryCount + 1);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Default fetch options for all requests
const defaultOptions = async (): Promise<RequestInit> => {
  const options: RequestInit = {
    credentials: 'include',
    headers: await getAuthHeaders()
  };
  
  console.log('API Call - Request headers:', options.headers);
  return options;
};

// Function to handle API responses
async function handleResponse<T>(response: Response): Promise<APIResponse<T>> {
  if (!response.ok) {
    // For API errors that return JSON
    try {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || `API Error: ${response.status} ${response.statusText}`
      };
    } catch (e) {
      // For non-JSON errors
      console.error(e)
      return {
        success: false,
        error: `API Error: ${response.status} ${response.statusText}`
      };
  }
  }

  try {
    const data = await response.json();
    return data as APIResponse<T>;
  } catch (e) {
    console.error('Error parsing JSON response:', e);
    return {
      success: false,
      error: 'Invalid JSON response from API'
    };
  }
}

// Auth API functions
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  return data;
}

export async function registerUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  location?: string;
}): Promise<AuthResponse> {
  const options = await defaultOptions();
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    ...options,
    method: 'POST',
    body: JSON.stringify(userData)
  });
  
  const data = await response.json();
  return data;
}

export async function verifyUser(): Promise<APIResponse<User>> {
  const options = await defaultOptions();
  const response = await fetch(`${API_BASE_URL}/api/auth/verify`, options);
  return handleResponse<User>(response);
}

export async function logoutUser(): Promise<APIResponse<void>> {
  const options = await defaultOptions();
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, options);
  return handleResponse<void>(response);
}

export async function getCases(): Promise<APIResponse<Case[]>> {
  console.log('Fetching cases...');
  const options = await defaultOptions();
  const response = await fetch(`${API_BASE_URL}/api/cases`, options);
  return handleResponse<Case[]>(response);
}

export async function createCustomerCase(data: {
  customer: Customer;
  vehicle: Vehicle;
  documents: string;
  agentInfo: {
    firstName: string;
    lastName: string;
    storeLocation: string;
  };
}): Promise<APIResponse<Case>> {
  console.log('Creating customer case...');
  const options = await defaultOptions();
  const response = await fetch(`${API_BASE_URL}/api/cases`, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
  return handleResponse<Case>(response);
}

export async function updateCustomerCase(caseId: string, data: {
  customer: Customer;
  vehicle: Vehicle;
  documents: string;
  agentInfo: {
    firstName: string;
    lastName: string;
    storeLocation: string;
  };
}): Promise<APIResponse<Case>> {
  console.log('Updating customer case...', caseId);
  const options = await defaultOptions();
  const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}`, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return handleResponse<Case>(response);
}

export async function scheduleInspection(
  caseId: string,
  inspectorData: Inspector,
  scheduledDate: Date,
  scheduledTime: string,
  notesForInspector?: string,
  dueByDate?: Date,
  dueByTime?: string
): Promise<APIResponse<Inspection>> {
  const options = await defaultOptions();
  const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/inspection`, {
    ...options,
    method: 'POST',
    body: JSON.stringify({
      inspector: inspectorData,
      scheduledDate,
      scheduledTime,
      notesForInspector,
      dueByDate,
      dueByTime,
    }),
  });
  return handleResponse<Inspection>(response);
}

export async function getInspectionByToken(token: string): Promise<APIResponse<Inspection>> {
  const response = await fetch(`${API_BASE_URL}/api/inspection/${token}`);
  return handleResponse<Inspection>(response);
}

export async function getInspectorInspections(): Promise<APIResponse<Inspection[]>> {
  const options = await defaultOptions();
  const response = await fetch(`${API_BASE_URL}/api/inspections/assigned`, options);
  return handleResponse<Inspection[]>(response);
}

export async function submitInspection(
  token: string,
  inspectionData: Partial<Inspection>
): Promise<APIResponse<Inspection>> {
  const response = await fetch(`${API_BASE_URL}/api/inspection/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inspectionData),
  });
  return handleResponse<Inspection>(response);
}

export async function savePendingInspection(
  token: string,
  inspectionData: Partial<Inspection>
): Promise<APIResponse<Inspection>> {
  const response = await fetch(`${API_BASE_URL}/api/inspection/${token}/pending`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inspectionData),
  });
  return handleResponse<Inspection>(response);
}

export async function assignEstimator(
  caseId: string,
  estimatorData: { firstName: string; lastName: string; email: string; phone?: string }
): Promise<APIResponse<Quote>> {
  const options = await defaultOptions();
  const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/estimator`, {
    ...options,
    method: 'POST',
    body: JSON.stringify({
      estimator: estimatorData,
    }),
  });
  return handleResponse<Quote>(response);
}

export async function getQuoteByToken(token: string): Promise<APIResponse<Quote>> {
  const response = await fetch(`${API_BASE_URL}/api/quote/${token}`);
  return handleResponse<Quote>(response);
}

export async function submitQuote(token: string, quoteData: Partial<Quote>): Promise<APIResponse<Quote>> {
  const response = await fetch(`${API_BASE_URL}/api/quote/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quoteData),
  });
  return handleResponse<Quote>(response);
}

export async function updateQuoteByCaseId(caseId: string, quoteData: Partial<Quote>): Promise<APIResponse<Quote>> {
  const options = await defaultOptions();
  const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/quote`, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(quoteData),
  });
  return handleResponse<Quote>(response);
}

export async function updateOfferDecision(token: string, offerDecision: Record<string, unknown>): Promise<APIResponse<Quote>> {
  const response = await fetch(`${API_BASE_URL}/api/quote/${token}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ offerDecision }),
  });
  return handleResponse<Quote>(response);
}

export async function updateOfferDecisionByCaseId(caseId: string, offerDecision: Record<string, unknown>): Promise<APIResponse<Quote>> {
  console.log('updateOfferDecisionByCaseId called with caseId:', caseId);
  console.log('offerDecision:', offerDecision);
  
  const options = await defaultOptions();
  console.log('Auth headers:', options.headers);
  
  const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/offer-decision`, {
    ...options,
    method: 'PUT',
    body: JSON.stringify({ offerDecision }),
  });
  
  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
  return handleResponse<Quote>(response);
}

export async function updatePaperwork(token: string, paperwork: string): Promise<APIResponse<Quote>> {
  const response = await fetch(`${API_BASE_URL}/api/quote/${token}/paperwork`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paperwork }),
  });
  return handleResponse<Quote>(response);
}

export async function updateCaseStage(token: string, stageData: { currentStage: number; stageStatuses?: Record<number, string> }): Promise<APIResponse<Case>> {
  const response = await fetch(`${API_BASE_URL}/api/quote/${token}/stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stageData),
  });
  return handleResponse<Case>(response);
}

export async function updateCaseStageByCaseId(caseId: string, stageData: { currentStage: number; stageStatuses?: Record<number, string> }): Promise<APIResponse<Case>> {
  const options = await defaultOptions();
  const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/stage`, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(stageData),
  });
  return handleResponse<Case>(response);
}

export async function completeCase(caseId: string): Promise<APIResponse<{ case: Case; pdfUrl: string }>> {
  const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return handleResponse<{ case: Case; pdfUrl: string }>(response);
}

export async function completeCaseWithToken(token: string): Promise<APIResponse<{ case: Case; pdfUrl: string }>> {
  const response = await fetch(`${API_BASE_URL}/api/quote/${token}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<{ case: Case; pdfUrl: string }>(response);
}

export async function completeCaseByCaseId(caseId: string): Promise<APIResponse<{ case: Case; pdfUrl: string }>> {
  const options = await defaultOptions();
  const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/complete-estimator`, {
    ...options,
    method: 'POST',
  });
  return handleResponse<{ case: Case; pdfUrl: string }>(response);
}

export async function generateCaseFile(caseId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/pdf`, {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw { error: error.error || 'Failed to generate case file', status: response.status };
  }
  
  return response.blob();
}

export async function generateCaseFileWithToken(token: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/quote/${token}/pdf`, {
    method: 'GET',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw { error: error.error || 'Failed to generate case file', status: response.status };
  }
  
  return response.blob();
}

export async function updateCaseStatus(caseId: string, status: string): Promise<APIResponse<Case>> {
  const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  });
  return handleResponse<Case>(response);
}

export function handleError(error: unknown): { success: false; error: string } {
  console.error('API Error:', error);
  return {
    success: false,
    error: error instanceof Error ? error.message : 'An unexpected error occurred',
  };
}

export async function getCase(caseId: string): Promise<APIResponse<Case>> {
  console.log('Fetching case:', caseId);
  const options = await defaultOptions();
  const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}`, options);
  return handleResponse<Case>(response);
}

export async function getCurrentUser(): Promise<APIResponse<User>> {
  console.log('Fetching current user info...');
  const options = await defaultOptions();
  const response = await fetch(`${API_BASE_URL}/api/auth/verify`, options);
  return handleResponse<User>(response);
}



export async function uploadDocument(file: File): Promise<APIResponse<{ path: string }>> {
  console.log('Uploading document:', file.name);
  const formData = new FormData();
  formData.append('file', file);

  const headers = await getAuthHeaders();
  delete headers['Content-Type']; // Let browser set correct content type for FormData

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: formData
  });

  return handleResponse<{ path: string }>(response);
}

export async function getUsersByRole(role: string): Promise<APIResponse<User[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users?role=${role}`, {
      ...await defaultOptions(),
    });
    return await handleResponse<User[]>(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      success: false,
      error: 'Failed to fetch users'
    };
  }
}

/**
 * Generate Bill of Sale PDF
 * @param caseId - Case ID
 */
export async function generateBillOfSalePDF(caseId: string): Promise<Blob> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/bill-of-sale`, {
      method: 'GET',
      headers: {
        ...headers,
        'Accept': 'application/pdf',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Error generating Bill of Sale PDF:', error);
    throw error;
  }
}

export async function generateQuoteSummary(caseId: string, quoteData?: any): Promise<APIResponse<Blob>> {
  try {
    const headers = await getAuthHeaders();
    
    if (quoteData) {
      // POST request with quote data
      const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/quote-summary`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Accept': 'application/pdf',
        },
        body: JSON.stringify({ quoteData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP error! status: ${response.status}`
        };
      }

      const blob = await response.blob();
      return {
        success: true,
        data: blob
      };
    } else {
      // GET request without quote data (fallback)
      const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/quote-summary`, {
        method: 'GET',
        headers: {
          ...headers,
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP error! status: ${response.status}`
        };
      }

      const blob = await response.blob();
      return {
        success: true,
        data: blob
      };
    }
  } catch (error) {
    console.error('Error generating quote summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate quote summary'
    };
  }
}

export async function sendCustomerEmail(caseId: string, emailType: 'quote' | 'decision' | 'thank-you'): Promise<APIResponse<void>> {
  const options = await defaultOptions();
  const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/send-email`, {
    ...options,
    method: 'POST',
    body: JSON.stringify({ emailType }),
  });
  return handleResponse<void>(response);
}

export async function savePaperworkByCaseId(caseId: string, paperworkData: Record<string, unknown>): Promise<APIResponse<{ case: Case; transaction: Record<string, unknown> }>> {
  try {
    console.log('=== API savePaperworkByCaseId START ===');
    console.log('caseId:', caseId);
    console.log('paperworkData:', JSON.stringify(paperworkData, null, 2));
    
    const url = `${API_BASE_URL}/api/cases/${caseId}/paperwork`;
    console.log('API URL:', url);
    
    const headers = await getAuthHeaders();
    console.log('Auth headers:', headers);
    
    const requestBody = JSON.stringify(paperworkData);
    console.log('Request body:', requestBody);
    
    const response = await fetch(url, {
      ...await defaultOptions(),
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.text();
    console.log('Response data:', responseData);
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseData);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      throw new Error('Invalid JSON response from server');
    }
    
    console.log('Parsed response:', parsedResponse);
    console.log('=== API savePaperworkByCaseId END ===');
    
    return parsedResponse;
  } catch (error) {
    console.error('=== API savePaperworkByCaseId ERROR ===');
    console.error('Error in savePaperworkByCaseId:', error);
    return handleError(error);
  }
}

// Fetch vehicle pricing from VIN
export async function getVehiclePricing(vin: string): Promise<APIResponse<{ estimatedValue: number; source: string; lastUpdated: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/vehicle/pricing/${vin}`, {
      ...await defaultOptions(),
      method: 'GET',
      headers: {
        ...(await getAuthHeaders()),
      },
    });

    return await handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
}

export async function saveCompletionData(caseId: string, completionData: Record<string, unknown>): Promise<APIResponse<Case>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/completion`, {
      ...await defaultOptions(),
      method: 'POST',
      headers: {
        ...(await getAuthHeaders()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(completionData),
    });

    return await handleResponse<Case>(response);
  } catch (error) {
    return handleError(error);
  }
}

export async function createUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  location?: string;
}): Promise<APIResponse<User>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      ...await defaultOptions(),
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return await handleResponse<User>(response);
  } catch (error) {
    console.error('Error creating user:', error);
    return handleError(error);
  }
}

export async function updateUser(userId: string, userData: {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  location?: string;
}): Promise<APIResponse<User>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      ...await defaultOptions(),
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return await handleResponse<User>(response);
  } catch (error) {
    console.error('Error updating user:', error);
    return handleError(error);
  }
}

export async function deleteUser(userId: string): Promise<APIResponse<void>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      ...await defaultOptions(),
      method: 'DELETE',
    });
    return await handleResponse<void>(response);
  } catch (error) {
    console.error('Error deleting user:', error);
    return handleError(error);
  }
}

export async function getAnalytics(timeRange: string = '30d'): Promise<APIResponse<void>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analytics?timeRange=${timeRange}`, {
      ...await defaultOptions(),
      method: 'GET',
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return handleError(error);
  }
}

/**
 * Fetch vehicle specs from VIN
 * @param vin - Vehicle Identification Number
 */
export async function getVehicleSpecs(vin: string): Promise<APIResponse<{
  year: string;
  make: string;
  model: string;
  trim?: string;
  body_style?: string;
  exterior_color?: string;
  engine?: string;
  transmission?: string;
}>> {
  const response = await fetch(`${API_BASE_URL}/api/vehicle/specs/${vin}`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });
  return handleResponse<{
    year: string;
    make: string;
    model: string;
    trim?: string;
    body_style?: string;
    exterior_color?: string;
    engine?: string;
    transmission?: string;
  }>(response);
}

export async function getVehicleMakesAndModels(): Promise<APIResponse<{
  makes: string[];
  models: { [key: string]: string[] };
}>> {
  const response = await fetch(`${API_BASE_URL}/api/vehicle/makes-models`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });
  return handleResponse<{
    makes: string[];
    models: { [key: string]: string[] };
  }>(response);
}

export async function saveCustomVehicle(make: string, model: string): Promise<APIResponse<{ make: string; model: string }>> {
  const response = await fetch(`${API_BASE_URL}/api/vehicle/custom`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ make, model }),
  });
  return handleResponse<{ make: string; model: string }>(response);
}

/**
 * Upload OBD2 scan PDF to a specific case
 * @param caseId - Case ID
 * @param file - PDF file to upload
 */
export async function uploadOBD2ScanToCase(caseId: string, file: File): Promise<APIResponse<{
  filePath: string;
  filename: string;
  extractedCodes: string[];
  matchingCodes: any[];
  unknownCodes: string[];
  totalCodesFound: number;
  criticalCodesFound: number;
}>> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const headers = await getAuthHeaders();
    delete headers['Content-Type']; // Let browser set correct content type for FormData

    const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/obd2-scan`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData
    });

    return handleResponse<{
      filePath: string;
      filename: string;
      extractedCodes: string[];
      matchingCodes: any[];
      unknownCodes: string[];
      totalCodesFound: number;
      criticalCodesFound: number;
    }>(response);
  } catch (error) {
    console.error('Error uploading OBD2 scan:', error);
    return handleError(error);
  }
}

const api = {
  // Auth functions
  loginUser,
  registerUser,
  verifyUser,
  logoutUser,
  getCurrentUser,
  
  // Case functions
  getCases,
  getCase,
  createCustomerCase,
  updateCustomerCase,
  scheduleInspection,
  getInspectionByToken,
  getInspectorInspections,
  submitInspection,
  savePendingInspection,
  assignEstimator,
  getQuoteByToken,
  submitQuote,
  completeCase,
  completeCaseWithToken,
  completeCaseByCaseId,
  generateCaseFile,
  generateCaseFileWithToken,
  updateCaseStatus,
  handleError,
  uploadDocument,
  updateOfferDecision,
  updateOfferDecisionByCaseId,
  updatePaperwork,
  updateCaseStage,
  updateCaseStageByCaseId,
  getUsersByRole,
  createUser,
  updateUser,
  deleteUser,
  updateQuoteByCaseId,
  generateBillOfSalePDF,
  generateQuoteSummary,
  sendCustomerEmail,
  savePaperworkByCaseId,
  getVehiclePricing,
  saveCompletionData,
  getAnalytics,
  uploadOBD2ScanToCase,
  
  // New function
  getVehicleSpecs,
  getVehicleMakesAndModels,
  saveCustomVehicle,
};

export default api;
