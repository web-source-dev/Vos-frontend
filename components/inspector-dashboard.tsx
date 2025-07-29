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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface InspectionData {
  _id: string
  status: string
  scheduledDate: string
  scheduledTime: string
  dueByDate?: string
  dueByTime?: string
  accessToken: string
  caseId?: string
  customer?: {
    firstName: string
    lastName: string
    notes?: string
  }
  vehicle?: {
    year: string
    make: string
    model: string
    vin?: string
    currentMileage?: string
  }
  timeTracking?: {
    totalTime?: number
    inspectionTime?: number
  }
}

export function InspectorDashboard() {
  const [inspections, setInspections] = useState<InspectionData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedInspection, setSelectedInspection] = useState<InspectionData | null>(null)
  const [showInspectionDialog, setShowInspectionDialog] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { user, loading, isAuthenticated, isInspector } = useAuth()

  // Authentication validation
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }
      
      if (!isInspector) {
        router.push('/login')
        return
      }
    }
  }, [loading, isAuthenticated, isInspector, router])

  // Fetch inspections assigned to the current inspector
  useEffect(() => {
    const fetchInspections = async () => {
      // Only fetch if authenticated and is inspector
      if (loading || !isAuthenticated || !isInspector) {
        return
      }

      try {
        const response = await api.getInspectorInspections();
        
        if (response.success) {
          const inspectionsData = response.data as unknown as InspectionData[] || [];
          console.log('inspectionsData', inspectionsData)
          
          // Fetch time tracking data for each inspection
          const inspectionsWithTimeTracking = await Promise.all(
            inspectionsData.map(async (inspection) => {
              console.log('inspection', inspection)
              if (inspection.caseId) {
                try {
                  const timeTrackingResponse = await api.getTimeTrackingByCaseId(inspection.caseId);
                  console.log('timeTrackingResponse', timeTrackingResponse)
                  if (timeTrackingResponse.success && timeTrackingResponse.data) {
                    const timeData = timeTrackingResponse.data;
                    console.log('timeData', )
                    return {
                      ...inspection,
                      timeTracking: {
                        totalTime: timeData.totalTime || 0,
                        inspectionTime: timeData.stageTimes?.inspection?.totalTime || 0
                      }

                    };
                  }
                } catch (error) {
                  console.error('Error fetching time tracking for inspection:', inspection._id, error);
                }
              }
              return inspection;
            })
          );
          
          setInspections(inspectionsWithTimeTracking);
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
  }, [loading, isAuthenticated, isInspector]);

  const handleInspectVehicle = (inspection: InspectionData) => {
    setSelectedInspection(inspection)
    setShowInspectionDialog(true)
  }

  const handleBeginInspection = () => {
    if (selectedInspection) {
      router.push(`/inspection/${selectedInspection.accessToken}`)
    }
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

  const formatDuration = (milliseconds: number) => {
    if (!milliseconds || milliseconds === 0) return '0:00'
    
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const isOverTime = (milliseconds: number) => {
    if (!milliseconds || milliseconds === 0) return false
    const totalSeconds = Math.floor(milliseconds / 1000)
    return totalSeconds > 1200 // 20 minutes = 1200 seconds
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render the dashboard if user is not authenticated or not inspector
  if (!isAuthenticated || !isInspector) {
    return null
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
                    {inspection.status === 'in-progress' ? 'Resume Inspection' : 'Open Inspection'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
        </div>
      )}

      {/* Inspection Start Dialog */}
      <Dialog open={showInspectionDialog} onOpenChange={setShowInspectionDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] sm:max-h-[80vh] md:max-h-[80vh] lg:max-h-[80vh] overflow-y-auto sm:rounded-2xl rounded-xl p-0 sm:p-0">
          <div className="p-4 sm:p-6 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">
                {selectedInspection?.status === 'in-progress' ? 'Resume Vehicle Inspection' : 'Begin Vehicle Inspection'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {selectedInspection?.status === 'in-progress' 
                  ? 'Review information and resume your inspection' 
                  : 'Review important information before starting the inspection'
                }
              </DialogDescription>
            </DialogHeader>
          
            {/* Timer Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800">
                  {selectedInspection?.status === 'in-progress' ? 'Inspection Progress' : 'Inspection Time Guidelines'}
                </h3>
              </div>
              
              {selectedInspection?.status === 'in-progress' ? (
                <>
                  {/* Time Spent Display for In-Progress */}
                  <div className={`bg-white border-2 rounded-lg p-4 mb-4 text-center ${
                    isOverTime(selectedInspection.timeTracking?.inspectionTime || 0)
                      ? 'border-red-300'
                      : 'border-blue-300'
                  }`}>
                    <div className={`text-3xl font-bold mb-2 ${
                      isOverTime(selectedInspection.timeTracking?.inspectionTime || 0)
                        ? 'text-red-600'
                        : 'text-blue-600'
                    }`}>
                      {formatDuration(selectedInspection.timeTracking?.inspectionTime || 0)}
                    </div>
                    <div className={`text-sm font-medium ${
                      isOverTime(selectedInspection.timeTracking?.inspectionTime || 0)
                        ? 'text-red-700'
                        : 'text-blue-700'
                    }`}>
                      Time Spent on Inspection
                      {isOverTime(selectedInspection.timeTracking?.inspectionTime || 0) && (
                        <span className="block text-xs mt-1">⚠️ Over 20 minute guideline</span>
                      )}
                    </div>
                  </div>
                  
                  <p className={`text-sm leading-relaxed ${
                    isOverTime(selectedInspection.timeTracking?.inspectionTime || 0)
                      ? 'text-red-700'
                      : 'text-blue-700'
                  }`}>
                    You have already spent {formatDuration(selectedInspection.timeTracking?.inspectionTime || 0)} on this inspection. 
                    The timer will continue from where you left off when you resume.
                  </p>
                  <p className="text-blue-600 text-xs mt-2">
                    💡 Your progress has been saved. You can continue from where you left off.
                  </p>
                </>
              ) : (
                <>
                  {/* Expected Time Display for New Inspections */}
                  <div className="bg-white border-2 border-blue-300 rounded-lg p-4 mb-4 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">20:00</div>
                    <div className="text-sm text-blue-700 font-medium">Expected Completion Time</div>
                  </div>
                  
                  <p className="text-blue-700 text-sm leading-relaxed">
                    Each vehicle inspection is expected to be finished within 20 minutes. The timer starts the moment you select Begin Inspection, and the total time to completion is logged so we can track and improve inspection efficiency.
                  </p>
                  <p className="text-blue-600 text-xs mt-2">
                    💡 A live timer will be displayed in the top-right corner during your inspection to help you stay on track.
                  </p>
                </>
              )}
            </div>

            {/* Vehicle Information */}
            {selectedInspection && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Car className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-800">Vehicle Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Vehicle</p>
                    <p className="text-gray-600">
                      {selectedInspection.vehicle?.year} {selectedInspection.vehicle?.make} {selectedInspection.vehicle?.model}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">VIN</p>
                    <p className="text-gray-600 font-mono text-xs">
                      {selectedInspection.vehicle?.vin || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Mileage</p>
                    <p className="text-gray-600">
                      {selectedInspection.vehicle?.currentMileage || 'N/A'} miles
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Customer</p>
                    <p className="text-gray-600">
                      {selectedInspection.customer?.firstName} {selectedInspection.customer?.lastName}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Intake Notes */}
            {selectedInspection?.customer?.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <User className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold text-yellow-800">Customer Intake Notes</h3>
                </div>
                <div className="bg-white border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 text-sm whitespace-pre-wrap">
                    {selectedInspection.customer.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Scheduled Information */}
            {selectedInspection && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">Scheduled Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-green-700">Scheduled For</p>
                    <p className="text-green-600">
                      {formatDate(selectedInspection.scheduledDate)} at {formatTime(selectedInspection.scheduledTime)}
                    </p>
                  </div>
                  {selectedInspection.dueByDate && (
                    <div>
                      <p className="font-medium text-red-600">Due By</p>
                      <p className="text-red-600 font-medium">
                        {formatDate(selectedInspection.dueByDate)} {selectedInspection.dueByTime && `at ${formatTime(selectedInspection.dueByTime)}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 my-2 mr-4">
            <Button
              variant="outline"
              onClick={() => setShowInspectionDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBeginInspection}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              {selectedInspection?.status === 'in-progress' ? 'Resume Inspection' : 'Begin Inspection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 