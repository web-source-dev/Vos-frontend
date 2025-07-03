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
  host: string;
  status: string;
  sessionToken: string;
  url: string;
}

export interface VeriffResult {
  id: string;
  sessionId: string;
  status: string;
  technicalData: {
    ip: string;
    userAgent: string;
    timestamp: string;
  };
}

export interface VeriffSession {
  id: string;
  url: string;
  status: string;
}

// Extend Window interface
declare global {
  interface Window {
    Veriff: (config: VeriffConfig) => VeriffInstance;
  }
}

// React Signature Canvas type declaration
declare module 'react-signature-canvas' {
  import * as React from 'react';

  export interface ReactSignatureCanvasProps {
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
    clearOnResize?: boolean;
    penColor?: string;
    velocityFilterWeight?: number;
    minWidth?: number;
    maxWidth?: number;
    dotSize?: number | (() => number);
    minDistance?: number;
    backgroundColor?: string;
    throttle?: number;
    ref?: React.Ref<unknown>;
  }

  export default class SignatureCanvas extends React.Component<ReactSignatureCanvasProps> {
    clear(): void;
    isEmpty(): boolean;
    toDataURL(type?: string, encoderOptions?: number): string;
    fromDataURL(dataURL: string, options?: object): void;
    off(): void;
    on(): void;
    getCanvas(): HTMLCanvasElement;
    getTrimmedCanvas(): HTMLCanvasElement;
    getPointGroup(): unknown[][];
  }
} 