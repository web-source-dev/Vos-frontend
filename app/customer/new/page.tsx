"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { VosLayout } from "@/components/vos-layout"
import { IntakeForm } from "@/components/stages/intake-form"
import { ScheduleInspection } from "@/components/stages/schedule-inspection"

// Define proper types for the customer data structure
interface CustomerData {
  customer: { name: string; phone: string; email: string };
  vehicle: { year: string; make: string; model: string; mileage: string; vin: string };
  currentStage: number;
  status: string;
  createdAt: string;
  estimatedValue: number;
  stageStatuses: {
    [key: number]: 'active' | 'complete' | 'pending';
  };
  lastActivity: string;
  priority: string;
  _id?: string;
  id?: string;
}

// Template for a new customer
const newCustomerTemplate: CustomerData = {
  customer: { name: "", phone: "", email: "" },
  vehicle: { year: "", make: "", model: "", mileage: "", vin: "" },
  currentStage: 1,
  status: "new",
  createdAt: new Date().toISOString().split('T')[0],
  estimatedValue: 0,
  stageStatuses: {
    1: "active",
    2: "pending",
    3: "pending",
    4: "pending",
    5: "pending",
    6: "pending",
    7: "pending",
  },
  lastActivity: "Just now",
  priority: "medium",
}

export default function NewCustomer() {
  const router = useRouter()
  const [customer, setCustomer] = useState<CustomerData>(newCustomerTemplate)
  const [currentStage, setCurrentStage] = useState(1)

  const updateCustomerData = (data: Partial<CustomerData>) => {
    setCustomer((prev: CustomerData) => ({ ...prev, ...data }))
  }

  const handleIntakeComplete = () => {
    // Automatically proceed to stage 2 (schedule inspection)
    setCurrentStage(2)
    
    // Update stage statuses
    setCustomer((prev: CustomerData) => ({
      ...prev,
      currentStage: 2,
      stageStatuses: {
        ...prev.stageStatuses,
        1: "complete",
        2: "active"
      }
    }))
  }

  const handleInspectionScheduled = () => {
    // Navigate to the customer detail page with the case ID
    // Use _id if available (MongoDB ObjectId), otherwise use id
    const caseId = customer._id || customer.id
    if (caseId) {
      router.push(`/customer/${caseId}`)
    } else {
      // Fallback to dashboard if no case ID
      router.push('/')
    }
  }

  const handleBackToDashboard = () => {
    router.push('/')
  }

  const renderCurrentStage = () => {
    switch (currentStage) {
      case 1:
        return (
          <IntakeForm
            vehicleData={customer}
            onUpdate={updateCustomerData}
            onComplete={handleIntakeComplete}
          />
        )
      case 2:
        return (
          <ScheduleInspection
            vehicleData={customer}
            onUpdate={updateCustomerData}
            onComplete={handleInspectionScheduled}
          />
        )
      default:
        return (
          <IntakeForm
            vehicleData={customer}
            onUpdate={updateCustomerData}
            onComplete={handleIntakeComplete}
          />
        )
    }
  }

  return (
    <VosLayout
      currentStage={currentStage}
      maxStage={customer.currentStage}
      vehicleData={customer}
      onStageChange={setCurrentStage}
      onBackToDashboard={handleBackToDashboard}
    >
      {renderCurrentStage()}
    </VosLayout>
  )
} 