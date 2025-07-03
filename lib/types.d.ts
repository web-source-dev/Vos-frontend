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
    ref?: React.RefObject< unknown>;
  }

  export default class SignatureCanvas extends React.Component<ReactSignatureCanvasProps> {
    clear(): void;
    isEmpty(): boolean;
    getTrimmedCanvas(): HTMLCanvasElement;
    fromDataURL(dataURL: string, options?: object): void;
    toDataURL(type?: string, encoderOptions?: number): string;
    off(): void;
    on(): void;
  }
} 