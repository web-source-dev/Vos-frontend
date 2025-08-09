"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { getAllCustomerSubmissions } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Car, 
  Calendar, 
  DollarSign, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Search,
  Filter,
  Download,
  Eye,
  Mail,
  Phone,
  MapPin
} from "lucide-react";

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

export default function CustomerSubmissionsPage() {
  const [submissions, setSubmissions] = useState<VehicleSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<VehicleSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<VehicleSubmission | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchTerm, statusFilter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await getAllCustomerSubmissions();
      
      if (response.success && response.data) {
        setSubmissions(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch customer submissions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Something went wrong while fetching submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = [...submissions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(submission => 
        submission.vinOrPlate.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.vinOrPlate.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.vinOrPlate.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.vinOrPlate.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.contact?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(submission => {
        const status = getSubmissionStatus(submission).status.toLowerCase();
        return status.includes(statusFilter.toLowerCase());
      });
    }

    setFilteredSubmissions(filtered);
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStats = () => {
    const total = submissions.length;
    const withOffers = submissions.filter(s => s.offer?.generated).length;
    const withAppointments = submissions.filter(s => s.appointmentDateTime).length;
    const totalValue = submissions.reduce((sum, s) => sum + (s.offer?.amount || s.vinOrPlate.estimatedPrice || 0), 0);

    return { total, withOffers, withAppointments, totalValue };
  };

  const stats = getStats();

  const openDetails = (submission: VehicleSubmission) => {
    setSelectedSubmission(submission);
    setDetailsOpen(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading customer submissions...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Vehicle Submissions</h1>
            <p className="mt-2 text-gray-600">
              Manage and review all customer vehicle submissions
            </p>
          </div>
          <Button onClick={fetchSubmissions} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time submissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.withOffers}</div>
              <p className="text-xs text-muted-foreground">Offers generated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.withAppointments}</div>
              <p className="text-xs text-muted-foreground">Appointments set</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
              <p className="text-xs text-muted-foreground">Combined offers/estimates</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by VIN, make, model, license plate, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                  size="sm"
                >
                  All ({submissions.length})
                </Button>
                <Button
                  variant={statusFilter === "offer" ? "default" : "outline"}
                  onClick={() => setStatusFilter("offer")}
                  size="sm"
                >
                  With Offers ({stats.withOffers})
                </Button>
                <Button
                  variant={statusFilter === "appointment" ? "default" : "outline"}
                  onClick={() => setStatusFilter("appointment")}
                  size="sm"
                >
                  With Appointments ({stats.withAppointments})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submissions List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Submissions ({filteredSubmissions.length})
          </h2>
          
          {filteredSubmissions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your filters to see more results."
                    : "No customer submissions have been made yet."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSubmissions.map((submission) => {
                const statusInfo = getSubmissionStatus(submission);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <Card key={submission._id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {submission.vinOrPlate.year} {submission.vinOrPlate.make} {submission.vinOrPlate.model}
                          </CardTitle>
                          <CardDescription>
                            {submission.vinOrPlate.vin ? `VIN: ${submission.vinOrPlate.vin}` : 
                             submission.vinOrPlate.licensePlate ? `License: ${submission.vinOrPlate.licensePlate}` : 
                             'Vehicle Details'}
                          </CardDescription>
                        </div>
                        <Badge className={`${statusInfo.color} text-white ml-2`}>
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
                            <span className="text-gray-500">Est. Value:</span>
                            <p className="font-medium">{formatCurrency(submission.vinOrPlate.estimatedPrice)}</p>
                          </div>
                        )}
                      </div>

                      {/* Contact Information */}
                      {submission.contact && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                          <div className="space-y-1 text-sm">
                            {submission.contact.email && (
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-2 text-gray-400" />
                                <span>{submission.contact.email}</span>
                              </div>
                            )}
                            {submission.contact.mobile && (
                              <div className="flex items-center">
                                <Phone className="h-3 w-3 mr-2 text-gray-400" />
                                <span>{submission.contact.mobile}</span>
                              </div>
                            )}
                            {submission.basics?.zipCode && (
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-2 text-gray-400" />
                                <span>{submission.basics.zipCode}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Offer Information */}
                      {submission.offer?.generated && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-green-900">Offer Generated</h4>
                              <p className="text-xl font-bold text-green-700">
                                {formatCurrency(submission.offer.amount)}
                              </p>
                              {submission.offer.expiresAt && (
                                <p className="text-xs text-green-600">
                                  Expires: {formatDate(submission.offer.expiresAt)}
                                </p>
                              )}
                            </div>
                            <DollarSign className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      )}

                      {/* Appointment Information */}
                      {submission.appointmentDateTime && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-blue-900">Appointment Scheduled</h4>
                              <p className="text-blue-700 text-sm">
                                {formatDate(submission.appointmentDateTime)}
                              </p>
                              {submission.appointment?.type && (
                                <p className="text-xs text-blue-600">
                                  Type: {submission.appointment.type}
                                </p>
                              )}
                            </div>
                            <Calendar className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Footer */}
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Submitted: {formatDate(submission.createdAt)}</span>
                        <Button variant="outline" size="sm" onClick={() => openDetails(submission)}>
                          <Eye className="h-3 w-3 mr-1" />
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

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedSubmission
                  ? `${selectedSubmission.vinOrPlate.year} ${selectedSubmission.vinOrPlate.make} ${selectedSubmission.vinOrPlate.model}`
                  : "Submission Details"}
              </DialogTitle>
              <DialogDescription>
                {selectedSubmission?.vinOrPlate.vin
                  ? `VIN: ${selectedSubmission.vinOrPlate.vin}`
                  : selectedSubmission?.vinOrPlate.licensePlate
                  ? `License: ${selectedSubmission.vinOrPlate.licensePlate}`
                  : "Vehicle Details"}
              </DialogDescription>
            </DialogHeader>

            {selectedSubmission && (
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center gap-2">
                  {(() => {
                    const info = getSubmissionStatus(selectedSubmission);
                    const Icon = info.icon;
                    return (
                      <span className={`inline-flex items-center px-2 py-1 rounded text-white text-xs ${info.color}`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {info.status}
                      </span>
                    );
                  })()}
                </div>

                {/* Vehicle Basics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Estimated Value:</span>
                    <p className="font-medium">{formatCurrency(selectedSubmission.vinOrPlate.estimatedPrice || 0)}</p>
                  </div>
                  {selectedSubmission.basics?.mileage !== undefined && (
                    <div>
                      <span className="text-gray-500">Mileage:</span>
                      <p className="font-medium">{selectedSubmission.basics.mileage.toLocaleString()} miles</p>
                    </div>
                  )}
                  {selectedSubmission.basics?.color && (
                    <div>
                      <span className="text-gray-500">Color:</span>
                      <p className="font-medium">{selectedSubmission.basics.color}</p>
                    </div>
                  )}
                  {selectedSubmission.basics?.zipCode && (
                    <div>
                      <span className="text-gray-500">ZIP Code:</span>
                      <p className="font-medium">{selectedSubmission.basics.zipCode}</p>
                    </div>
                  )}
                </div>

                {/* Condition */}
                {selectedSubmission.condition && (
                  <div className="space-y-1 text-sm">
                    <h4 className="font-medium text-gray-900">Condition</h4>
                    {selectedSubmission.condition.overallCondition && (
                      <p><span className="text-gray-500">Overall:</span> {selectedSubmission.condition.overallCondition}</p>
                    )}
                    {selectedSubmission.condition.accidentHistory && (
                      <p><span className="text-gray-500">Accident History:</span> {selectedSubmission.condition.accidentHistory}</p>
                    )}
                  </div>
                )}

                {/* Contact */}
                {selectedSubmission.contact && (
                  <div className="space-y-1 text-sm">
                    <h4 className="font-medium text-gray-900">Contact</h4>
                    {selectedSubmission.contact.email && (
                      <p><span className="text-gray-500">Email:</span> {selectedSubmission.contact.email}</p>
                    )}
                    {selectedSubmission.contact.mobile && (
                      <p><span className="text-gray-500">Phone:</span> {selectedSubmission.contact.mobile}</p>
                    )}
                  </div>
                )}

                {/* Offer */}
                {selectedSubmission.offer && (
                  <div className="space-y-1 text-sm">
                    <h4 className="font-medium text-gray-900">Offer</h4>
                    <p><span className="text-gray-500">Generated:</span> {selectedSubmission.offer.generated ? "Yes" : "No"}</p>
                    {selectedSubmission.offer.amount !== undefined && (
                      <p><span className="text-gray-500">Amount:</span> {formatCurrency(selectedSubmission.offer.amount)}</p>
                    )}
                    {selectedSubmission.offer.expiresAt && (
                      <p><span className="text-gray-500">Expires:</span> {formatDate(selectedSubmission.offer.expiresAt)}</p>
                    )}
                  </div>
                )}

                {/* Appointment */}
                {(selectedSubmission.appointmentDateTime || selectedSubmission.appointment) && (
                  <div className="space-y-1 text-sm">
                    <h4 className="font-medium text-gray-900">Appointment</h4>
                    {selectedSubmission.appointmentDateTime && (
                      <p><span className="text-gray-500">When:</span> {formatDate(selectedSubmission.appointmentDateTime)}</p>
                    )}
                    {selectedSubmission.appointment?.type && (
                      <p><span className="text-gray-500">Type:</span> {selectedSubmission.appointment.type}</p>
                    )}
                    {selectedSubmission.appointment?.address && (
                      <p><span className="text-gray-500">Address:</span> {selectedSubmission.appointment.address}</p>
                    )}
                  </div>
                )}

                {/* Payout */}
                {selectedSubmission.payoutMethod?.type && (
                  <div className="space-y-1 text-sm">
                    <h4 className="font-medium text-gray-900">Payout</h4>
                    <p><span className="text-gray-500">Method:</span> {selectedSubmission.payoutMethod.type}</p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                  <div>
                    <span className="block">Created</span>
                    <span className="font-medium">{formatDate(selectedSubmission.createdAt)}</span>
                  </div>
                  <div>
                    <span className="block">Updated</span>
                    <span className="font-medium">{formatDate(selectedSubmission.updatedAt)}</span>
                  </div>
                </div>

                <DialogFooter>
                  <Button onClick={() => setDetailsOpen(false)} variant="outline">Close</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}