"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import { getCustomerSubmissions } from "@/lib/customer";
import { Car, Calendar, DollarSign, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface VehicleSubmission {
  _id: string;
  vinOrPlate: {
    vin: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    estimatedPrice: number;
  };
  basics?: {
    mileage: number;
    zipCode: string;
    color: string;
  };
  condition?: {
    overallCondition: string;
    accidentHistory: string;
  };
  contact?: {
    email: string;
    mobile: string;
  };
  offer?: {
    amount: number;
    expiresAt: string;
    generated: boolean;
  };
  appointment?: {
    type: string;
    address: string;
  };
  appointmentDateTime?: string;
  payoutMethod?: {
    type: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function CustomerDashboard() {
  const [submissions, setSubmissions] = useState<VehicleSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.email) {
      fetchCustomerSubmissions();
    }
  }, [isAuthenticated, user, router]);

  const fetchCustomerSubmissions = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const response = await getCustomerSubmissions(user.email);
      
      if (response.success && response.data) {
        setSubmissions(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch your vehicle submissions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Something went wrong while fetching your data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionStatus = (submission: VehicleSubmission) => {
    if (submission.appointmentDateTime) {
      return { status: "Appointment Scheduled", color: "bg-green-500", icon: CheckCircle };
    }
    if (submission.offer?.generated) {
      return { status: "Offer Generated", color: "bg-blue-500", icon: DollarSign };
    }
    if (submission.contact?.email) {
      return { status: "Contact Provided", color: "bg-yellow-500", icon: Clock };
    }
    if (submission.condition) {
      return { status: "Condition Assessed", color: "bg-orange-500", icon: FileText };
    }
    if (submission.basics) {
      return { status: "Basic Info Added", color: "bg-purple-500", icon: Car };
    }
    return { status: "Initial Submission", color: "bg-gray-500", icon: AlertCircle };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customer Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.firstName || user?.email}! Here are your vehicle submissions.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {submissions.filter(s => s.offer?.generated).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {submissions.filter(s => s.appointmentDateTime).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vehicle Submissions */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Vehicle Submissions</h2>
          
          {submissions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
                <p className="text-gray-600 mb-4">
                  You haven't submitted any vehicles for evaluation yet.
                </p>
                <Button onClick={() => router.push('/customer')}>
                  Submit Your First Vehicle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {submissions.map((submission) => {
                const statusInfo = getSubmissionStatus(submission);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <Card key={submission._id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {submission.vinOrPlate.year} {submission.vinOrPlate.make} {submission.vinOrPlate.model}
                          </CardTitle>
                          <CardDescription>
                            {submission.vinOrPlate.vin ? `VIN: ${submission.vinOrPlate.vin}` : 
                             submission.vinOrPlate.licensePlate ? `License: ${submission.vinOrPlate.licensePlate}` : 
                             'Vehicle Details'}
                          </CardDescription>
                        </div>
                        <Badge className={`${statusInfo.color} text-white`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Vehicle Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {submission.basics?.mileage && (
                          <div>
                            <span className="text-gray-500">Mileage:</span>
                            <p className="font-medium">{submission.basics.mileage.toLocaleString()} miles</p>
                          </div>
                        )}
                        {submission.basics?.color && (
                          <div>
                            <span className="text-gray-500">Color:</span>
                            <p className="font-medium">{submission.basics.color}</p>
                          </div>
                        )}
                        {submission.condition?.overallCondition && (
                          <div>
                            <span className="text-gray-500">Condition:</span>
                            <p className="font-medium">{submission.condition.overallCondition}</p>
                          </div>
                        )}
                        {submission.vinOrPlate.estimatedPrice > 0 && (
                          <div>
                            <span className="text-gray-500">Estimated Value:</span>
                            <p className="font-medium">{formatCurrency(submission.vinOrPlate.estimatedPrice)}</p>
                          </div>
                        )}
                      </div>

                      {/* Offer Information */}
                      {submission.offer?.generated && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-green-900">Offer Generated</h4>
                              <p className="text-2xl font-bold text-green-700">
                                {formatCurrency(submission.offer.amount)}
                              </p>
                              {submission.offer.expiresAt && (
                                <p className="text-sm text-green-600">
                                  Expires: {formatDate(submission.offer.expiresAt)}
                                </p>
                              )}
                            </div>
                            <DollarSign className="h-8 w-8 text-green-600" />
                          </div>
                        </div>
                      )}

                      {/* Appointment Information */}
                      {submission.appointmentDateTime && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-blue-900">Appointment Scheduled</h4>
                              <p className="text-blue-700">
                                {formatDate(submission.appointmentDateTime)}
                              </p>
                              {submission.appointment?.type && (
                                <p className="text-sm text-blue-600">
                                  Type: {submission.appointment.type}
                                </p>
                              )}
                            </div>
                            <Calendar className="h-8 w-8 text-blue-600" />
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Footer */}
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Submitted: {formatDate(submission.createdAt)}</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/customer/submission/${submission._id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}