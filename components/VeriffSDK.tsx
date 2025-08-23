'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2 } from 'lucide-react';
import * as api from '@/lib/api';
import Image from 'next/image';

interface VeriffSDKProps {
  caseId: string;
  customerName: string;
  onVerificationComplete?: (status: string) => void;
  onSessionCreated?: (sessionId: string) => void;
}



export function VeriffSDK({ caseId, customerName, onVerificationComplete, onSessionCreated }: VeriffSDKProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();



  const handleStartVerification = async () => {
    try {
      setIsLoading(true);

      // Create Veriff session
      const response = await api.createVeriffSession(caseId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create verification session');
      }

      const { sessionId: newSessionId, url, sessionToken } = response.data || {};
      if (newSessionId) {
        setSessionId(newSessionId);
        onSessionCreated?.(newSessionId);
      }

      toast({
        title: 'Verification Session Created',
        description: 'Please complete the verification process.',
      });

      // Instead of using the SDK which creates another session, 
      // directly redirect to the verification URL
      if (url) {
        // Open verification in a new window/tab
        window.open(url, '_blank', 'width=800,height=600');
        
        // Show a message to the user
        toast({
          title: 'Verification Window Opened',
          description: 'Please complete the verification in the new window. You can close this window after verification.',
        });
      } else {
        throw new Error('No verification URL received');
      }

    } catch (error) {
      console.error('Error starting verification:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start verification',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-[200px] bg-white flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md mx-auto">
        {/* Veriff Logo */}
        <div className="flex items-center justify-center mb-8">
         <Image src="/veriff-logo.png" alt="Veriff Logo" width={100} height={100} />
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Start the verification process
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-8">
          We would like to confirm your identity through a process powered by Veriff. This will take a few minutes.
        </p>

        {/* Continue Button */}
        <Button
          onClick={handleStartVerification}
          disabled={isLoading}
          className="bg-teal-600 hover:bg-teal-700 text-white px-20 py-3 rounded-lg font-medium transition-colors"
          size="default"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting...
            </>
          ) : (
            'Start Verification'
          )}
        </Button>
      </div>
    </div>
  );
}
