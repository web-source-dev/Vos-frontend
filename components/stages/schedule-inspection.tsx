"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Calendar, User as UserIcon, Clock, CheckCircle, Edit } from "lucide-react"
import api from '@/lib/api'
import type { User } from '@/lib/types'

// TypeScript interfaces for schedule inspection data
interface CustomerData {
  firstName?: string
  lastName?: string
}

interface VehicleData {
  year?: string
  make?: string
  model?: string
  vin?: string
  currentMileage?: string
}

interface InspectorData {
  firstName?: string
  lastName?: string
  email?: string
  location?: string
}

interface InspectionData {
  status?: string
  scheduledDate?: string
  scheduledTime?: string
  inspector?: InspectorData
}

interface CaseData {
  id?: string
  _id?: string
  customer?: CustomerData
  vehicle?: VehicleData
  inspection?: InspectionData
  currentStage?: number
  status?: string
}

interface ScheduleInspectionProps {
  vehicleData: CaseData
  onUpdate: (data: CaseData) => void
  onComplete: () => void
}

export function ScheduleInspection({
  vehicleData,
  onUpdate,
  onComplete,
}: ScheduleInspectionProps) {
  const [inspectors, setInspectors] = useState<User[]>([])
  const [selectedInspector, setSelectedInspector] = useState<string>("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inspectorsLoading, setInspectorsLoading] = useState(true)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const { toast } = useToast()

  // Fetch available inspectors from user database
  useEffect(() => {
    const fetchInspectors = async () => {
      try {
        setInspectorsLoading(true);
        const response = await api.getUsersByRole('inspector');
        console.log('getUsersByRole response:', response);
        if (response.success && response.data) {
          console.log('Setting inspectors:', response.data);
          console.log('First inspector structure:', response.data?.[0]);
          setInspectors(response.data);
        } else {
          console.error('Failed to fetch inspectors:', response.error);
        }
      } catch (error) {
        console.error('Error fetching inspectors:', error);
      } finally {
        setInspectorsLoading(false);
      }
    };

    fetchInspectors();
  }, []);

  // Auto-fill existing inspection data if available
  useEffect(() => {
    if (vehicleData.inspection) {
      const inspection = vehicleData.inspection;
      
      // Find the inspector by email to auto-select
      if (inspection.inspector?.email && inspectors.length > 0) {
        const existingInspector = inspectors.find(i => i.email === inspection.inspector!.email);
        if (existingInspector) {
          setSelectedInspector(existingInspector._id || existingInspector.id || "");
        }
      }
      
      // Auto-fill date and time if available
      if (inspection.scheduledDate) {
        setScheduledDate(new Date(inspection.scheduledDate).toISOString().split('T')[0]);
      }
      if (inspection.scheduledTime) {
        setScheduledTime(inspection.scheduledTime);
      }
    }
  }, [vehicleData.inspection, inspectors]);

  const handleInspectorChange = (field: string, value: string) => {
    console.log('handleInspectorChange called:', field, value);
    console.log('Current inspectors:', inspectors);
    if (field === 'inspector') {
      console.log('Setting selectedInspector to:', value);
      console.log('Inspector with this ID:', inspectors.find(i => i.id === value));
      setSelectedInspector(value);
    } else if (field === 'date') {
      setScheduledDate(value);
    } else if (field === 'time') {
      setScheduledTime(value);
    }
  }

  const handleReschedule = () => {
    setIsRescheduling(true);
    // Clear current selection to allow changes
    setSelectedInspector("");
    setScheduledDate("");
    setScheduledTime("");
  }

  const handleCancelReschedule = () => {
    setIsRescheduling(false);
    // Restore original values
    if (vehicleData.inspection) {
      const inspection = vehicleData.inspection;
      if (inspection.inspector?.email && inspectors.length > 0) {
        const existingInspector = inspectors.find(i => i.email === inspection.inspector!.email);
        if (existingInspector) {
          setSelectedInspector(existingInspector._id || existingInspector.id || "");
        }
      }
      if (inspection.scheduledDate) {
        setScheduledDate(new Date(inspection.scheduledDate).toISOString().split('T')[0]);
      }
      if (inspection.scheduledTime) {
        setScheduledTime(inspection.scheduledTime);
      }
    }
  }

  const handleAssignInspector = async () => {
    console.log('handleAssignInspector called');
    console.log('selectedInspector:', selectedInspector);
    console.log('scheduledDate:', scheduledDate);
    console.log('scheduledTime:', scheduledTime);
    console.log('inspectors:', inspectors);
    console.log('inspectorsLoading:', inspectorsLoading);
    
    if (inspectorsLoading) {
      toast({
        title: "Please Wait",
        description: "Inspectors are still loading. Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    if (inspectors.length === 0) {
      toast({
        title: "No Inspectors Available",
        description: "No inspectors are available in the system. Please contact an administrator.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedInspector || !scheduledDate || !scheduledTime) {
      toast({
        title: "Missing Information",
        description: `Please select an inspector, date, and time. Inspector: ${selectedInspector ? 'Selected' : 'Not selected'}, Date: ${scheduledDate || 'Not selected'}, Time: ${scheduledTime || 'Not selected'}`,
        variant: "destructive",
      })
      console.log('Missing Information', selectedInspector, scheduledDate, scheduledTime)
      return
    }

    try {
      setIsSubmitting(true)

      const selectedInspectorData = inspectors.find(i => (i._id || i.id) === selectedInspector);
      console.log('selectedInspectorData:', selectedInspectorData);

      if (!selectedInspectorData) {
        throw new Error('Selected inspector not found');
      }

      const caseId = vehicleData.id || vehicleData._id;
      if (!caseId) {
        throw new Error('Case ID not found');
      }

      const response = await api.scheduleInspection(
        caseId,
        {
          firstName: selectedInspectorData.firstName,
          lastName: selectedInspectorData.lastName,
          email: selectedInspectorData.email,
          location: selectedInspectorData.location
        },
        new Date(scheduledDate),
        scheduledTime
      );

      if (response.success) {
        onUpdate({
          inspection: response.data as unknown as InspectionData,
          currentStage: 3,
          status: 'scheduled'
        })

        const actionText = isRescheduling ? "Rescheduled" : "Scheduled";
        toast({
          title: `Inspection ${actionText}`,
          description: `Inspection ${actionText.toLowerCase()} with ${selectedInspectorData.firstName} ${selectedInspectorData.lastName} for ${scheduledDate} at ${scheduledTime}.`,
        })

        setIsRescheduling(false);
        onComplete()
      }
    } catch (error) {
      const errorData = api.handleError(error)
      toast({
        title: "Error Scheduling Inspection",
        description: errorData.error,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = () => {
    if (vehicleData.inspection?.status === 'scheduled') {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Scheduled</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 text-yellow-600">
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">Pending</span>
      </div>
    )
  }

  const hasExistingInspection = vehicleData.inspection && vehicleData.inspection.status === 'scheduled';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schedule Inspection</h1>
          <p className="text-muted-foreground">
            {hasExistingInspection && !isRescheduling 
              ? "Review and manage existing inspection schedule" 
              : "Assign inspector and schedule vehicle inspection"
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {hasExistingInspection && !isRescheduling && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReschedule}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Reschedule
            </Button>
          )}
        </div>
      </div>

      {/* Vehicle Information */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Customer:</span> {vehicleData.customer?.firstName} {vehicleData.customer?.lastName}
            </div>
            <div>
              <span className="font-medium">Vehicle:</span> {vehicleData.vehicle?.year} {vehicleData.vehicle?.make} {vehicleData.vehicle?.model}
            </div>
            <div>
              <span className="font-medium">VIN:</span> {vehicleData.vehicle?.vin || 'Not provided'}
            </div>
            <div>
              <span className="font-medium">Mileage:</span> {vehicleData.vehicle?.currentMileage}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Inspection Info */}
      {hasExistingInspection && !isRescheduling && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Current Inspection Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-700">Inspector:</span> {vehicleData.inspection?.inspector?.firstName} {vehicleData.inspection?.inspector?.lastName}
              </div>
              <div>
                <span className="font-medium text-green-700">Email:</span> {vehicleData.inspection?.inspector?.email}
              </div>
              <div>
                <span className="font-medium text-green-700">Date:</span> {vehicleData.inspection?.scheduledDate ? new Date(vehicleData.inspection.scheduledDate).toLocaleDateString() : 'Not set'}
              </div>
              <div>
                <span className="font-medium text-green-700">Time:</span> {vehicleData.inspection?.scheduledTime}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inspector Selection */}
      {(!hasExistingInspection || isRescheduling) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              {isRescheduling ? "Select New Inspector" : "Select Inspector"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inspector">Inspector *</Label>
              {inspectorsLoading ? (
                <div className="p-3 bg-gray-50 rounded-md border">
                  <p className="text-sm text-gray-500">Loading inspectors...</p>
                </div>
              ) : inspectors.length === 0 ? (
                <div className="p-3 bg-red-50 rounded-md border border-red-200">
                  <p className="text-sm text-red-600">No inspectors available. Please contact an administrator.</p>
                </div>
              ) : (
                <Select value={selectedInspector} onValueChange={(value) => handleInspectorChange('inspector', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an inspector" />
                  </SelectTrigger>
                  <SelectContent>
                    {inspectors.map((inspector) => (
                      <SelectItem key={inspector._id || inspector.id} value={inspector._id || inspector.id || ''}>
                        {inspector.firstName} {inspector.lastName} - {inspector.location || 'No location'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduling */}
      {(!hasExistingInspection || isRescheduling) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {isRescheduling ? "New Schedule Details" : "Schedule Details"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => handleInspectorChange('date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Select value={scheduledTime} onValueChange={(value) => handleInspectorChange('time', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="09:00">9:00 AM</SelectItem>
                    <SelectItem value="10:00">10:00 AM</SelectItem>
                    <SelectItem value="11:00">11:00 AM</SelectItem>
                    <SelectItem value="12:00">12:00 PM</SelectItem>
                    <SelectItem value="13:00">1:00 PM</SelectItem>
                    <SelectItem value="14:00">2:00 PM</SelectItem>
                    <SelectItem value="15:00">3:00 PM</SelectItem>
                    <SelectItem value="16:00">4:00 PM</SelectItem>
                    <SelectItem value="17:00">5:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {isRescheduling && (
          <Button
            variant="outline"
            onClick={handleCancelReschedule}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        {(!hasExistingInspection || isRescheduling) && (
          <Button 
            onClick={handleAssignInspector} 
            size="lg" 
            className="px-8"
            disabled={isSubmitting || inspectorsLoading || inspectors.length === 0}
          >
            {isSubmitting ? "Scheduling..." : isRescheduling ? "Reschedule Inspection" : "Schedule Inspection"}
          </Button>
        )}
        {hasExistingInspection && !isRescheduling && (
          <Button 
            onClick={onComplete} 
            size="lg" 
            className="px-8"
          >
            Continue to Inspection
          </Button>
        )}
      </div>
    </div>
  )
}
