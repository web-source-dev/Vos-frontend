"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import api from "@/lib/api"
import { Calendar, Car, User, CheckCircle, Clock } from "lucide-react"

interface InspectionData {
  _id: string
  status: string
  scheduledDate: string
  scheduledTime: string
  dueByDate?: string
  dueByTime?: string
  accessToken: string
  customer?: {
    firstName: string
    lastName: string
  }
  vehicle?: {
    year: string
    make: string
    model: string
    vin?: string
    currentMileage?: string
  }
}

export function InspectorDashboard() {
  const [inspections, setInspections] = useState<InspectionData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()

  // Fetch inspections assigned to the current inspector
  useEffect(() => {
    const fetchInspections = async () => {
      try {
        const response = await api.getInspectorInspections();
        
        if (response.success) {
          setInspections(response.data as unknown as InspectionData[] || []);
        } else {
          toast({
            title: "Error",
            description: response.error || "Failed to load inspections",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching inspector inspections:', error);
        toast({
          title: "Error",
          description: "Failed to load inspection data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInspections();
  }, [toast]);

  const handleInspectVehicle = (inspection: InspectionData) => {
    router.push(`/inspection/${inspection.accessToken}`)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 text-xs">Completed</Badge>
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800 text-xs">In Progress</Badge>
      case "scheduled":
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Scheduled</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 text-xs">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ''
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading inspection data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Inspector Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Welcome, {user?.firstName} {user?.lastName}
          </p>
        </div>
      </div>

      {inspections.length === 0 ? (
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-6 sm:p-8 text-center">
            <CheckCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-blue-800 mb-2">All Caught Up!</h2>
            <p className="text-blue-600 text-sm sm:text-base">
              You have no pending vehicle inspections at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div>
          <h2 className="text-base sm:text-lg font-medium mb-4">Your Assigned Inspections</h2>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {inspections.map((inspection) => (
              <Card key={inspection._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gray-50 p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <CardTitle className="text-base sm:text-lg leading-tight">
                      {inspection.vehicle?.year} {inspection.vehicle?.make} {inspection.vehicle?.model}
                    </CardTitle>
                    {getStatusBadge(inspection.status)}
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">Scheduled For</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {formatDate(inspection.scheduledDate)} at {formatTime(inspection.scheduledTime)}
                      </p>
                    </div>
                  </div>
                  
                  {inspection.dueByDate && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-red-600">Inspection Due By</p>
                        <p className="text-xs sm:text-sm text-red-600 font-medium">
                          {formatDate(inspection.dueByDate)} {inspection.dueByTime && `at ${formatTime(inspection.dueByTime)}`}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">Customer</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {inspection.customer?.firstName} {inspection.customer?.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Car className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">Vehicle Details</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        VIN: {inspection.vehicle?.vin || 'N/A'}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Mileage: {inspection.vehicle?.currentMileage || 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 p-4">
                  <Button 
                    className="w-full text-sm" 
                    onClick={() => handleInspectVehicle(inspection)}
                    size="sm"
                  >
                    Open Inspection
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
        </div>
      )}
    </div>
  )
} 