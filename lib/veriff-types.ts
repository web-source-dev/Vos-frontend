// Veriff SDK types
export interface VeriffConfig {
  host: string;
  parentId: string;
  onSession: (err: Error | null, response: VeriffSessionResponse) => void;
  onVeriff: (response: VeriffResult) => void;
}

export interface VeriffInstance {
  setParams: (params: VeriffParams) => void;
  mount: () => void;
}

export interface VeriffParams {
  person: {
    givenName: string;
    lastName: string;
  };
  vendorData: string;
}

export interface VeriffSessionResponse {
  verification: {
    url: string;
    id: string;
  };
}

export interface VeriffResult {
  sessionId: string;
  status: string;
  verificationData: Record<string, unknown>;
}

export interface VeriffSession {
  id: string;
  url: string;
  status: string;
}

// Extend Window interface
declare global {
  interface Window {
    Veriff: unknown;
  }
} 