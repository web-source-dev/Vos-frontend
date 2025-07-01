'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Veriff SDK types
declare global {
  interface Window {
    Veriff: any;
  }
}

interface VeriffSession {
  id: string;
  url: string;
  status: string;
}

export default function VerifyIdentityPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<VeriffSession | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'declined' | 'error'>('pending');
  const veriffContainerRef = useRef<HTMLDivElement>(null);

  // Initialize Veriff SDK
  useEffect(() => {
    const loadVeriffSDK = async () => {
      try {
        // Load Veriff SDK script
        const script = document.createElement('script');
        script.src = 'https://cdn.veriff.me/sdk/js/1.5/veriff.min.js';
        script.async = true;
        script.onload = () => {
          console.log('Veriff SDK loaded successfully');
        };
        script.onerror = () => {
          console.error('Failed to load Veriff SDK');
          toast({
            title: "Error",
            description: "Failed to load identity verification service.",
            variant: "destructive",
          });
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Failed to load Veriff SDK:', error);
        toast({
          title: "Error",
          description: "Failed to load identity verification service.",
          variant: "destructive",
        });
      }
    };

    loadVeriffSDK();
  }, [toast]);

  // Create Veriff session
  const createVeriffSession = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/veriff/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          person: {
            givenName: 'John', // This should come from user data
            lastName: 'Doe',   // This should come from user data
            email: 'john.doe@example.com', // This should come from user data
          },
          document: {
            type: 'DRIVERS_LICENSE',
            country: 'US',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create verification session');
      }

      const sessionData = await response.json();
      setSession(sessionData.data);
      
      // Launch Veriff modal using the session URL
      if (window.Veriff && sessionData.data.url) {
        const veriff = window.Veriff({
          host: 'https://stationapi.veriff.com',
          parentId: veriffContainerRef.current?.id || 'veriff-container',
          onSession: function(err: any, response: any) {
            if (err) {
              console.error('Veriff session error:', err);
              setVerificationStatus('error');
              setIsLoading(false);
              toast({
                title: "Error",
                description: "Failed to create verification session.",
                variant: "destructive",
              });
            } else {
              console.log('Veriff session created:', response);
            }
          },
          onVeriff: (response: any) => {
            console.log('Veriff response:', response);
            handleVerificationResult(response);
          },
        });

        // Set person parameters
        veriff.setParams({
          person: {
            givenName: 'John', // This should come from user data
            lastName: 'Doe'    // This should come from user data
          },
          vendorData: 'user_id' // This should come from user context
        });

        // Mount the Veriff widget
        veriff.mount();
      }
    } catch (error) {
      console.error('Error creating Veriff session:', error);
      toast({
        title: "Error",
        description: "Failed to start identity verification. Please try again.",
        variant: "destructive",
      });
      setVerificationStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verification result
  const handleVerificationResult = async (response: any) => {
    try {
      const resultResponse = await fetch('/api/veriff/result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session?.id,
          verificationData: response,
        }),
      });

      if (!resultResponse.ok) {
        throw new Error('Failed to process verification result');
      }

      const result = await resultResponse.json();
      
      if (result.status === 'approved') {
        setVerificationStatus('approved');
        toast({
          title: "Verification Successful",
          description: "Your identity has been verified successfully!",
        });
        // Redirect after successful verification
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setVerificationStatus('declined');
        toast({
          title: "Verification Failed",
          description: "Identity verification was not successful. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing verification result:', error);
      setVerificationStatus('error');
      toast({
        title: "Error",
        description: "Failed to process verification result.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'approved':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'declined':
        return <XCircle className="h-8 w-8 text-red-500" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Camera className="h-8 w-8 text-blue-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case 'approved':
        return 'Identity verification completed successfully!';
      case 'declined':
        return 'Identity verification was not successful. Please try again.';
      case 'error':
        return 'An error occurred during verification. Please try again.';
      default:
        return 'Please complete identity verification to continue.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl font-bold">
            Identity Verification
          </CardTitle>
          <CardDescription>
            {getStatusMessage()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {verificationStatus === 'pending' && (
            <>
              <Alert>
                <AlertDescription>
                  To complete your registration, we need to verify your identity. 
                  This process is secure and takes only a few minutes.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  You'll need to provide:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• A valid government-issued ID</li>
                  <li>• A clear photo of your face</li>
                  <li>• Good lighting and a stable internet connection</li>
                </ul>
              </div>
              
              <Button 
                onClick={createVeriffSession} 
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Verification...
                  </>
                ) : (
                  'Start Verification'
                )}
              </Button>
            </>
          )}

          {verificationStatus === 'approved' && (
            <div className="text-center space-y-4">
              <p className="text-green-600 font-medium">
                Your identity has been verified successfully!
              </p>
              <p className="text-sm text-gray-600">
                Redirecting you to the dashboard...
              </p>
            </div>
          )}

          {verificationStatus === 'declined' && (
            <div className="text-center space-y-4">
              <p className="text-red-600 font-medium">
                Verification was not successful
              </p>
              <p className="text-sm text-gray-600">
                Please ensure your documents are clear and valid, then try again.
              </p>
              <Button 
                onClick={createVeriffSession}
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="text-center space-y-4">
              <p className="text-red-600 font-medium">
                An error occurred
              </p>
              <p className="text-sm text-gray-600">
                Please check your internet connection and try again.
              </p>
              <Button 
                onClick={createVeriffSession}
                variant="outline"
                className="w-full"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Veriff container */}
          <div 
            id="veriff-container" 
            ref={veriffContainerRef}
            className="hidden"
          />
        </CardContent>
      </Card>
    </div>
  );
} 