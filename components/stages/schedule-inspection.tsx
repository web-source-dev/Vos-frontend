"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Calendar, User as UserIcon, Clock, CheckCircle, Edit, FileText, Calculator } from "lucide-react"
import api from '@/lib/api'
import type { User } from '@/lib/types'
import { useStageTimer } from '@/components/useStageTimer'
import { rescheduleInspection } from '@/lib/api'

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

interface EstimatorData {
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
  notesForInspector?: string
  dueByDate?: string
  dueByTime?: string
}

interface CaseData {
  id?: string
  _id?: string
  customer?: CustomerData
  vehicle?: VehicleData
  inspection?: InspectionData
  quote?: {
    estimator?: EstimatorData
  }
  currentStage?: number
  status?: string
  stageStatuses?: { [key: number]: string }
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
  const [estimators, setEstimators] = useState<User[]>([])
  const [selectedInspector, setSelectedInspector] = useState<string>("")
  const [selectedEstimator, setSelectedEstimator] = useState<string>("none")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [customScheduledTime, setCustomScheduledTime] = useState("")
  const [dueByDate, setDueByDate] = useState("")
  const [dueByTime, setDueByTime] = useState("")
  const [customDueByTime, setCustomDueByTime] = useState("")
  const [notesForInspector, setNotesForInspector] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inspectorsLoading, setInspectorsLoading] = useState(true)
  const [estimatorsLoading, setEstimatorsLoading] = useState(true)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const { toast } = useToast()

  // Stage timer with case ID and stage name
  const caseId = vehicleData._id;
  const {
    startTime,
    start,
    stop,
    elapsedFormatted,
    isLoading: timerLoading
  } = useStageTimer(caseId, 'scheduleInspection')

  // Start timer when component mounts (only if not already started from saved data)
  useEffect(() => {
    if (!startTime && !timerLoading) {
      start()
    }
  }, [startTime, timerLoading, start])

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

  // Fetch available estimators from user database
  useEffect(() => {
    const fetchEstimators = async () => {
      try {
        setEstimatorsLoading(true);
        const response = await api.getUsersByRole('estimator');
        console.log('getUsersByRole estimator response:', response);
        if (response.success && response.data) {
          console.log('Setting estimators:', response.data);
          setEstimators(response.data);
        } else {
          console.error('Failed to fetch estimators:', response.error);
        }
      } catch (error) {
        console.error('Error fetching estimators:', error);
      } finally {
        setEstimatorsLoading(false);
      }
    };

    fetchEstimators();
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

      // Auto-fill due by date and time if available
      if (inspection.dueByDate) {
        setDueByDate(new Date(inspection.dueByDate).toISOString().split('T')[0]);
      }
      if (inspection.dueByTime) {
        setDueByTime(inspection.dueByTime);
      }

      // Auto-fill notes if available
      if (inspection.notesForInspector) {
        setNotesForInspector(inspection.notesForInspector);
      }
    }
  }, [vehicleData.inspection, inspectors]);

  // Auto-fill existing estimator data if available
  useEffect(() => {
    if (vehicleData.quote?.estimator?.email && estimators.length > 0) {
      const existingEstimator = estimators.find(e => e.email === vehicleData.quote!.estimator!.email);
      if (existingEstimator) {
        setSelectedEstimator(existingEstimator._id || existingEstimator.id || "");
      }
    }
  }, [vehicleData.quote?.estimator, estimators]);

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
      if (value !== 'custom') {
        setCustomScheduledTime('');
      }
    } else if (field === 'customTime') {
      setCustomScheduledTime(value);
      // Keep the dropdown as 'custom' but store the actual time value
      if (value) {
        setScheduledTime('custom');
      }
    } else if (field === 'dueByDate') {
      setDueByDate(value);
    } else if (field === 'dueByTime') {
      setDueByTime(value);
      if (value !== 'custom') {
        setCustomDueByTime('');
      }
    } else if (field === 'customDueByTime') {
      setCustomDueByTime(value);
      // Keep the dropdown as 'custom' but store the actual time value
      if (value) {
        setDueByTime('custom');
      }
    }
  }

  const handleEstimatorChange = (value: string) => {
    console.log('handleEstimatorChange called:', value);
    setSelectedEstimator(value);
  }

  const handleReschedule = () => {
    setIsRescheduling(true);
    
    // Auto-fill with existing inspection data
    if (vehicleData.inspection) {
      const inspection = vehicleData.inspection;
      
      // Auto-fill inspector
      if (inspection.inspector?.email && inspectors.length > 0) {
        const existingInspector = inspectors.find(i => i.email === inspection.inspector!.email);
        if (existingInspector) {
          setSelectedInspector(existingInspector._id || existingInspector.id || "");
        }
      }
      
      // Auto-fill scheduled date and time
      if (inspection.scheduledDate) {
        setScheduledDate(new Date(inspection.scheduledDate).toISOString().split('T')[0]);
      }
      if (inspection.scheduledTime) {
        // Check if it's a custom time (not in our predefined list)
        const predefinedTimes = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'];
        if (!predefinedTimes.includes(inspection.scheduledTime)) {
          setScheduledTime('custom');
          setCustomScheduledTime(inspection.scheduledTime);
        } else {
          setScheduledTime(inspection.scheduledTime);
          setCustomScheduledTime('');
        }
      }
      
      // Auto-fill due by date and time
      if (inspection.dueByDate) {
        setDueByDate(new Date(inspection.dueByDate).toISOString().split('T')[0]);
      }
      if (inspection.dueByTime) {
        // Check if it's a custom time (not in our predefined list)
        const predefinedTimes = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'];
        if (!predefinedTimes.includes(inspection.dueByTime)) {
          setDueByTime('custom');
          setCustomDueByTime(inspection.dueByTime);
        } else {
          setDueByTime(inspection.dueByTime);
          setCustomDueByTime('');
        }
      }
    }
    
    // Auto-fill estimator if exists
    if (vehicleData.quote?.estimator?.email && estimators.length > 0) {
      const existingEstimator = estimators.find(e => e.email === vehicleData.quote!.estimator!.email);
      if (existingEstimator) {
        setSelectedEstimator(existingEstimator._id || existingEstimator.id || "");
      }
    }
    
    // Don't clear notes when rescheduling - they should already be filled from the useEffect
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
        // Check if it's a custom time (not in our predefined list)
        const predefinedTimes = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'];
        if (!predefinedTimes.includes(inspection.scheduledTime)) {
          setScheduledTime('custom');
          setCustomScheduledTime(inspection.scheduledTime);
        }
      }
      if (inspection.dueByDate) {
        setDueByDate(new Date(inspection.dueByDate).toISOString().split('T')[0]);
      }
      if (inspection.dueByTime) {
        setDueByTime(inspection.dueByTime);
        // Check if it's a custom time (not in our predefined list)
        const predefinedTimes = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'];
        if (!predefinedTimes.includes(inspection.dueByTime)) {
          setDueByTime('custom');
          setCustomDueByTime(inspection.dueByTime);
        }
      }
      if (inspection.notesForInspector) {
        setNotesForInspector(inspection.notesForInspector);
      }
    }
    // Restore original estimator
    if (vehicleData.quote?.estimator?.email && estimators.length > 0) {
      const existingEstimator = estimators.find(e => e.email === vehicleData.quote!.estimator!.email);
      if (existingEstimator) {
        setSelectedEstimator(existingEstimator._id || existingEstimator.id || "");
      }
    }
  }

  const handleAssignInspector = async () => {
    console.log('handleAssignInspector called');
    console.log('selectedInspector:', selectedInspector);
    console.log('scheduledDate:', scheduledDate);
    console.log('scheduledTime:', scheduledTime);
    console.log('dueByDate:', dueByDate);
    console.log('dueByTime:', dueByTime);
    console.log('notesForInspector:', notesForInspector);
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

    // Check if custom time is selected but no custom time value is provided
    if (scheduledTime === 'custom' && !customScheduledTime) {
      toast({
        title: "Missing Custom Time",
        description: "Please enter a custom time value.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedInspector || !scheduledDate || !scheduledTime || (scheduledTime === 'custom' && !customScheduledTime)) {
      toast({
        title: "Missing Information",
        description: `Please select an inspector, date, and time. Inspector: ${selectedInspector ? 'Selected' : 'Not selected'}, Date: ${scheduledDate || 'Not selected'}, Time: ${scheduledTime === 'custom' ? (customScheduledTime || 'Custom time not entered') : (scheduledTime || 'Not selected')}`,
        variant: "destructive",
      })
      console.log('Missing Information', selectedInspector, scheduledDate, scheduledTime, customScheduledTime)
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

      // Use custom time values if custom is selected
      const finalScheduledTime = scheduledTime === 'custom' ? customScheduledTime : scheduledTime;
      const finalDueByTime = dueByTime === 'custom' ? customDueByTime : dueByTime;

      // Use rescheduleInspection if rescheduling, otherwise use scheduleInspection
      const response = isRescheduling 
        ? await rescheduleInspection(
            caseId,
            {
              firstName: selectedInspectorData.firstName,
              lastName: selectedInspectorData.lastName,
              email: selectedInspectorData.email,
              location: selectedInspectorData.location
            },
            new Date(scheduledDate),
            finalScheduledTime,
            notesForInspector,
            dueByDate ? new Date(dueByDate) : undefined,
            finalDueByTime || undefined
          )
        : await api.scheduleInspection(
            caseId,
            {
              firstName: selectedInspectorData.firstName,
              lastName: selectedInspectorData.lastName,
              email: selectedInspectorData.email,
              location: selectedInspectorData.location
            },
            new Date(scheduledDate),
            finalScheduledTime,
            notesForInspector,
            dueByDate ? new Date(dueByDate) : undefined,
            finalDueByTime || undefined
          );

      if (response.success) {
        // Assign estimator if selected
        if (selectedEstimator && selectedEstimator !== 'none') {
          const selectedEstimatorData = estimators.find(e => (e._id || e.id) === selectedEstimator);
          if (selectedEstimatorData) {
            try {
              await api.assignEstimatorDuringInspection(
                caseId,
                {
                  firstName: selectedEstimatorData.firstName,
                  lastName: selectedEstimatorData.lastName,
                  email: selectedEstimatorData.email
                }
              );
              console.log('Estimator assigned successfully');
            } catch (error) {
              console.error('Failed to assign estimator:', error);
              toast({
                title: "Warning",
                description: "Inspection scheduled but failed to assign estimator. You can assign one later.",
                variant: "destructive",
              });
            }
          }
        }

        // Stop timer and get timing data (now handles saving automatically)
        const timingData = await stop();
        console.log('Stage timing data:', timingData);

        onUpdate({
          inspection: {
            ...response.data as unknown as InspectionData,
            notesForInspector,
            dueByDate,
            dueByTime
          },
          quote: selectedEstimator && selectedEstimator !== 'none' ? {
            estimator: estimators.find(e => (e._id || e.id) === selectedEstimator)
          } : undefined,
          currentStage: vehicleData.currentStage || 3, // Preserve current stage or default to 3
          status: 'scheduled'
        })

        // Update stage statuses to mark stage 2 as complete and stage 3 as active
        const currentStageStatuses = vehicleData.stageStatuses || {};
        const stageData = {
          currentStage: vehicleData.currentStage || 3,
          stageStatuses: {
            ...currentStageStatuses,
            2: 'complete', // Mark stage 2 (Schedule Inspection) as complete
            3: 'active'    // Mark stage 3 (Inspection) as active
          }
        };

        // Update stage statuses in the database
        if (caseId) {
          try {
            await api.updateCaseStageByCaseId(caseId, stageData);
            console.log('Successfully updated stage statuses');
          } catch (error) {
            console.error('Failed to update stage statuses:', error);
          }
        }

        const actionText = isRescheduling ? "Rescheduled" : "Scheduled";
        const estimatorText = selectedEstimator ? ` and estimator assigned` : '';
        toast({
          title: `Inspection ${actionText}`,
          description: `Inspection ${actionText.toLowerCase()} with ${selectedInspectorData.firstName} ${selectedInspectorData.lastName} for ${scheduledDate} at ${scheduledTime}${estimatorText}.`,
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

  const handleContinueToInspection = async () => {
    // Stop timer and get timing data (now handles saving automatically)
    const timingData = await stop();
    console.log('Stage timing data:', timingData);
    onComplete();
  }
  const hasExistingInspection = vehicleData.inspection && (vehicleData.inspection.status === 'scheduled' || vehicleData.inspection.status === 'in-progress' || vehicleData.inspection.status === 'completed');
  const canReschedule = vehicleData.inspection && (vehicleData.inspection.status === 'scheduled');

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
          {canReschedule && !isRescheduling && (
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

      {/* Timer Display */}
      <Card className="bg-blue-50 border-blue-200 hidden">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Time spent on this stage:</span>
            </div>
            <div className="text-lg font-bold text-blue-800">
              {elapsedFormatted}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Information */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-bold">Customer:</span> {vehicleData.customer?.firstName} {vehicleData.customer?.lastName}
            </div>
            <div>
              <span className="font-bold">Vehicle:</span> {vehicleData.vehicle?.year} {vehicleData.vehicle?.make} {vehicleData.vehicle?.model}
            </div>
            <div>
              <span className="font-bold ">VIN:</span> {vehicleData.vehicle?.vin || 'Not provided'}
            </div>
            <div>
              <span className="font-bold">Mileage:</span> {vehicleData.vehicle?.currentMileage}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Inspection Info */}
      {hasExistingInspection && !isRescheduling && (
        <>
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
                  <span className="font-bold text-green-700">Inspector:</span> {vehicleData.inspection?.inspector?.firstName} {vehicleData.inspection?.inspector?.lastName}
                </div>
                <div>
                  <span className="font-bold text-green-700">Email:</span> {vehicleData.inspection?.inspector?.email}
                </div>
                <div>
                  <span className="font-bold text-green-700">Date:</span> {vehicleData.inspection?.scheduledDate ? new Date(vehicleData.inspection.scheduledDate).toLocaleDateString() : 'Not set'}
                </div>
                <div>
                  <span className="font-bold text-green-700">Time:</span> {vehicleData.inspection?.scheduledTime}
                </div>
                <div>
                  <span className="font-bold text-green-700">Inspection Due By:</span> {vehicleData.inspection?.dueByDate ? new Date(vehicleData.inspection.dueByDate).toLocaleDateString() : 'Not set'} {vehicleData.inspection?.dueByTime || ''}
                </div>
              </div>
              {vehicleData.inspection?.notesForInspector && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-0.5 text-green-600" />
                    <div className="flex-1">
                      <span className="font-bold text-green-700">Notes for Inspector:</span>
                      <p className="text-sm text-green-600 mt-1 whitespace-pre-wrap">{vehicleData.inspection.notesForInspector}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Assigned Estimator Info */}
          {vehicleData.quote?.estimator && (
            <Card className="border-blue-200 bg-blue-100">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Assigned Estimator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-bold text-blue-700">Estimator:</span> {vehicleData.quote.estimator.firstName} {vehicleData.quote.estimator.lastName}
                  </div>
                  <div>
                    <span className="font-bold text-blue-700">Email:</span> {vehicleData.quote.estimator.email}
                  </div>
                  {vehicleData.quote.estimator.location && (
                    <div>
                      <span className="font-bold text-blue-700">Location:</span> {vehicleData.quote.estimator.location}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        </>
      )}


      <div className="grid grid-cols-1 gap-4 md:grid-cols-1">

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
                {isRescheduling ? "New Schedule Inspection" : "Schedule Inspection"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  <div className="flex gap-2">
                    <Select value={scheduledTime} onValueChange={(value) => handleInspectorChange('time', value)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="08:00">8:00 AM</SelectItem>
                        <SelectItem value="08:30">8:30 AM</SelectItem>
                        <SelectItem value="09:00">9:00 AM</SelectItem>
                        <SelectItem value="09:30">9:30 AM</SelectItem>
                        <SelectItem value="10:00">10:00 AM</SelectItem>
                        <SelectItem value="10:30">10:30 AM</SelectItem>
                        <SelectItem value="11:00">11:00 AM</SelectItem>
                        <SelectItem value="11:30">11:30 AM</SelectItem>
                        <SelectItem value="12:00">12:00 PM</SelectItem>
                        <SelectItem value="12:30">12:30 PM</SelectItem>
                        <SelectItem value="13:00">1:00 PM</SelectItem>
                        <SelectItem value="13:30">1:30 PM</SelectItem>
                        <SelectItem value="14:00">2:00 PM</SelectItem>
                        <SelectItem value="14:30">2:30 PM</SelectItem>
                        <SelectItem value="15:00">3:00 PM</SelectItem>
                        <SelectItem value="15:30">3:30 PM</SelectItem>
                        <SelectItem value="16:00">4:00 PM</SelectItem>
                        <SelectItem value="16:30">4:30 PM</SelectItem>
                        <SelectItem value="17:00">5:00 PM</SelectItem>
                        <SelectItem value="17:30">5:30 PM</SelectItem>
                        <SelectItem value="18:00">6:00 PM</SelectItem>
                        <SelectItem value="18:30">6:30 PM</SelectItem>
                        <SelectItem value="custom">Custom Time</SelectItem>
                      </SelectContent>
                    </Select>
                    {scheduledTime === 'custom' && (
                      <Input
                        type="time"
                        value={customScheduledTime}
                        onChange={(e) => handleInspectorChange('customTime', e.target.value)}
                        className="w-32"
                        placeholder="HH:MM"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-4">Inspection Due By</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dueByDate">Due Date</Label>
                    <Input
                      id="dueByDate"
                      type="date"
                      value={dueByDate}
                      onChange={(e) => handleInspectorChange('dueByDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueByTime">Due Time</Label>
                    <div className="flex gap-2">
                      <Select value={dueByTime} onValueChange={(value) => handleInspectorChange('dueByTime', value)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="08:00">8:00 AM</SelectItem>
                          <SelectItem value="08:30">8:30 AM</SelectItem>
                          <SelectItem value="09:00">9:00 AM</SelectItem>
                          <SelectItem value="09:30">9:30 AM</SelectItem>
                          <SelectItem value="10:00">10:00 AM</SelectItem>
                          <SelectItem value="10:30">10:30 AM</SelectItem>
                          <SelectItem value="11:00">11:00 AM</SelectItem>
                          <SelectItem value="11:30">11:30 AM</SelectItem>
                          <SelectItem value="12:00">12:00 PM</SelectItem>
                          <SelectItem value="12:30">12:30 PM</SelectItem>
                          <SelectItem value="13:00">1:00 PM</SelectItem>
                          <SelectItem value="13:30">1:30 PM</SelectItem>
                          <SelectItem value="14:00">2:00 PM</SelectItem>
                          <SelectItem value="14:30">2:30 PM</SelectItem>
                          <SelectItem value="15:00">3:00 PM</SelectItem>
                          <SelectItem value="15:30">3:30 PM</SelectItem>
                          <SelectItem value="16:00">4:00 PM</SelectItem>
                          <SelectItem value="16:30">4:30 PM</SelectItem>
                          <SelectItem value="17:00">5:00 PM</SelectItem>
                          <SelectItem value="17:30">5:30 PM</SelectItem>
                          <SelectItem value="18:00">6:00 PM</SelectItem>
                          <SelectItem value="18:30">6:30 PM</SelectItem>
                          <SelectItem value="custom">Custom Time</SelectItem>
                        </SelectContent>
                      </Select>
                      {dueByTime === 'custom' && (
                        <Input
                          type="time"
                          value={customDueByTime}
                          onChange={(e) => handleInspectorChange('customDueByTime', e.target.value)}
                          className="w-32"
                          placeholder="HH:MM"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-1">

        {/* Notes Section */}
        {(!hasExistingInspection || isRescheduling) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notes for Inspector
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter any notes for the inspector (e.g., specific instructions, concerns)"
                value={notesForInspector}
                onChange={(e) => setNotesForInspector(e.target.value)}
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>
        )}


        {/* Estimator Assignment */}
        {(!hasExistingInspection || isRescheduling) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Assign Estimator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="estimator">Estimator</Label>
                {estimatorsLoading ? (
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm text-gray-500">Loading estimators...</p>
                  </div>
                ) : estimators.length === 0 ? (
                  <div className="p-3 bg-yellow-50 rounded-md border border-yellow-200">
                    <p className="text-sm text-yellow-600">No estimators available. You can assign one later.</p>
                  </div>
                ) : (
                  <Select value={selectedEstimator} onValueChange={handleEstimatorChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an estimator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No estimator assigned</SelectItem>
                      {estimators.map((estimator) => (
                        <SelectItem key={estimator._id || estimator.id} value={estimator._id || estimator.id || ''}>
                          {estimator.firstName} {estimator.lastName} - {estimator.location || 'No location'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  Assigning an estimator now will send them an email notification and prepare the case for quote preparation.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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
            onClick={handleContinueToInspection}
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
