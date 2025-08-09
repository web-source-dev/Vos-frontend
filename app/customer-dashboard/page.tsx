"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { getCustomerSubmissions } from "@/lib/customer";
import { useToast } from "@/components/ui/use-toast";
import { Car, DollarSign, Calendar, AlertCircle, FileText, Clock, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface VehicleSubmission {
  _id: string;
  vinOrPlate: { vin: string; make: string; model: string; year: number; licensePlate: string; estimatedPrice: number };
  basics?: { mileage?: number; zipCode?: string; color?: string };
  condition?: { overallCondition?: string; accidentHistory?: string };
  contact?: { email?: string; mobile?: string };
  offer?: { amount?: number; expiresAt?: string; generated?: boolean };
  appointment?: { type?: string; address?: string };
  appointmentDateTime?: string;
  createdAt: string;
}

export default function VehiclesPage() {
  const { user, isAuthenticated } = useAuth();
  const [submissions, setSubmissions] = useState<VehicleSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (user?.email) fetchData();
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getCustomerSubmissions(user!.email);
      if (res.success && res.data) {
        const sorted = [...(res.data as VehicleSubmission[])].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setSubmissions(sorted);
      }
      else toast({ title: "Error", description: res.error || "Failed to load vehicles", variant: "destructive" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to load vehicles", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (s: VehicleSubmission) => {
    if (s.appointmentDateTime) return { label: "Appointment Scheduled", color: "bg-emerald-500", icon: CheckCircle };
    if (s.offer?.generated) return { label: "Offer Generated", color: "bg-blue-500", icon: DollarSign };
    if (s.contact?.email) return { label: "Contact Provided", color: "bg-amber-500", icon: Clock };
    if (s.condition) return { label: "Condition Assessed", color: "bg-orange-500", icon: FileText };
    if (s.basics) return { label: "Basic Info Added", color: "bg-violet-500", icon: Car };
    return { label: "Initial Submission", color: "bg-gray-500", icon: AlertCircle };
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const formatDate = (d: string | number | Date) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-7 w-40 mb-2"><Skeleton className="h-7 w-40" /></div>
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-6 w-36" />
                </div>
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl">Your Vehicles</CardTitle>
            <CardDescription>All vehicles you submitted for evaluation</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => router.push('/offer')}>New Vehicle</Button>
          </div>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-10">
              <Car className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No submissions yet.</p>
              <Button onClick={() => router.push('/offer')}>Submit a Vehicle</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submissions.map((s) => {
                const st = getStatus(s);
                const Icon = st.icon;
                return (
                  <Card key={s._id} className="hover:shadow-sm transition-shadow">
                    <CardHeader className="flex-row items-start justify-between space-y-0 gap-3">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {s.vinOrPlate.year} {s.vinOrPlate.make} {s.vinOrPlate.model}
                        </CardTitle>
                        <CardDescription>
                          {s.vinOrPlate.vin ? `VIN: ${s.vinOrPlate.vin}` : s.vinOrPlate.licensePlate ? `License: ${s.vinOrPlate.licensePlate}` : "Vehicle Details"}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-500">Submitted</span>
                        <div className="font-medium">{formatDate(s.createdAt)}</div>
                      </div>
                      {s.basics?.mileage && (
                        <div>
                          <span className="text-gray-500">Mileage</span>
                          <div className="font-medium">{s.basics.mileage.toLocaleString()} mi</div>
                        </div>
                      )}
                      {s.basics?.color && (
                        <div>
                          <span className="text-gray-500">Color</span>
                          <div className="font-medium">{s.basics.color}</div>
                        </div>
                      )}
                      {s.basics?.zipCode && (
                        <div>
                          <span className="text-gray-500">ZIP</span>
                          <div className="font-medium">{s.basics.zipCode}</div>
                        </div>
                      )}
                      {s.vinOrPlate.estimatedPrice > 0 && (
                        <div>
                          <span className="text-gray-500">Est. Value</span>
                          <div className="font-medium">{formatCurrency(s.vinOrPlate.estimatedPrice)}</div>
                        </div>
                      )}
                      {s.offer?.generated && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Offer</span>
                          <div className="font-medium">{formatCurrency(s.offer.amount || 0)}</div>
                        </div>
                      )}
                      {s.appointmentDateTime && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Appointment</span>
                          <div className="font-medium">{formatDate(s.appointmentDateTime)}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


