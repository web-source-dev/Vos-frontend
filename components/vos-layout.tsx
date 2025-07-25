"use client"

import { ReactNode, useState } from "react"
import { ArrowLeftIcon, User, Car, CheckCircle, Clock, Lock, FileCheck, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"

interface VehicleData {
  customer: {
    firstName: string
    lastName: string
  }
  vehicle: {
    year: string
    make: string
    model: string
    vin: string
  }
  stageStatuses: {
    [key: number]: string
  }
  currentStage?: number
  caseId?: string
}

interface VosLayoutProps {
  children: ReactNode
  currentStage: number
  maxStage?: number // Maximum stage reached (from database) - determines actual progress
  vehicleData: VehicleData
  onStageChange: (stage: number) => void
  onBackToDashboard?: () => void
  accessibleStages?: number[]
  isInspector?: boolean
}

export function VosLayout({ 
  children, 
  currentStage, 
  maxStage, // Maximum stage reached (from database)
  vehicleData, 
  onStageChange, 
  onBackToDashboard, 
  accessibleStages = [],
  isInspector = false
}: VosLayoutProps) {
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Use the maximum of either passed maxStage prop or vehicleData.currentStage from DB or currentStage as fallback
  const actualMaxStage = vehicleData?.currentStage || currentStage;
  
  const getStageStatus = (stageId: number) => {
    // Summary stage (0) is always considered active when viewing it
    if (stageId === 0) {
      return currentStage === 0 ? 'active' : 'pending'
    }
    return vehicleData?.stageStatuses?.[stageId] || 'pending'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-500'
      case 'active':
        return 'bg-blue-500'
      default:
        return 'bg-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4" />
      case 'active':
        return <Clock className="w-4 h-4" />
      default:
        return null
    }
  }

  const isStageAccessible = (stageId: number) => {
    // Summary stage (0) is always accessible
    if (stageId === 0) {
      return true;
    }
    // Allow access to stages up to the max stage reached
    // If accessibleStages is provided, also check that
    if (accessibleStages.length > 0) {
      return stageId <= actualMaxStage && accessibleStages.includes(stageId);
    }
    return stageId <= actualMaxStage;
  }

  const stages = [
    { id: 1, name: 'Customer Intake', description: 'Collect customer and vehicle information' },
    { id: 2, name: 'Schedule Inspection', description: 'Assign inspector and schedule inspection' },
    { id: 3, name: 'Vehicle Inspection', description: 'Complete vehicle inspection' },
    { id: 4, name: 'Quote & Decision', description: 'Prepare and submit quote' },
    { id: 5, name: 'Paperwork', description: 'Complete transaction paperwork' },
    { id: 6, name: 'Completion', description: 'Finalize transaction' }
  ]

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        {onBackToDashboard && (
          <button
            onClick={() => {
              onBackToDashboard()
              if (isMobile) setSidebarOpen(false)
            }}
            className="text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-2 transition-colors duration-200 hover:bg-white px-2 py-1 rounded-lg"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
        )}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <button
                onClick={() => {
                  onStageChange(0)
                  if (isMobile) setSidebarOpen(false)
                }}
                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer text-left"
              >
                {vehicleData?.customer?.firstName} {vehicleData?.customer?.lastName}
              </button>
              <p className="text-sm text-gray-600">Customer</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Car className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {vehicleData?.vehicle?.year} {vehicleData?.vehicle?.make} {vehicleData?.vehicle?.model}
              </p>
              <p className="text-sm text-gray-600">
                {vehicleData?.vehicle?.vin?.slice(-8) || 'VIN'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stages Navigation */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Process Stages</h3>
          <p className="text-sm text-gray-600">Track your progress through each step</p>
        </div>
        <nav className="space-y-2">
          {stages.map((stage) => {
            const isAccessible = isStageAccessible(stage.id)
            const isCurrent = currentStage === stage.id
            const status = getStageStatus(stage.id)
            
            return (
              <button
                key={stage.id}
                onClick={() => {
                  if (isAccessible) {
                    onStageChange(stage.id)
                    if (isMobile) setSidebarOpen(false)
                  }
                }}
                disabled={!isAccessible}
                className={`w-full text-left p-3 md:p-4 rounded-xl transition-all duration-200 group ${
                  isCurrent
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 text-blue-900 shadow-md'
                    : isAccessible
                      ? 'hover:bg-gray-50 border-2 border-transparent hover:border-gray-200 text-gray-900 hover:shadow-sm'
                      : 'opacity-60 cursor-not-allowed text-gray-500 border-2 border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm transition-all duration-200 ${
                      isCurrent
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg'
                        : getStatusColor(status)
                    }`}>
                      {stage.id === 0 ? (
                        <FileCheck className="w-4 h-4 md:w-5 md:h-5" />
                      ) : (
                        getStatusIcon(status) || stage.id
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm md:text-base">{stage.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5 hidden md:block">{stage.description}</div>
                    </div>
                  </div>
                  {!isAccessible && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      <Lock className="w-3 h-3" />
                      <span className="hidden sm:inline">Locked</span>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  )}
                </div>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )

  // For inspectors, show only the main content without sidebar
  if (isInspector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-8">
          {children}
        </div>
      </div>
    )
  }

  // Mobile layout with drawer
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        {/* Mobile Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {vehicleData?.customer?.firstName} {vehicleData?.customer?.lastName}
                </h1>
                <p className="text-sm text-gray-600">
                  {vehicleData?.vehicle?.year} {vehicleData?.vehicle?.make} {vehicleData?.vehicle?.model}
                </p>
              </div>
            </div>
            {onBackToDashboard && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToDashboard}
                className="flex items-center gap-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-4">
          {children}
        </div>
      </div>
    )
  }

  // Desktop layout with sidebar
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="flex">
        {/* Left Sidebar - Sticky */}
        <div className="w-80 bg-white shadow-xl border-r border-gray-200 sticky top-0 h-screen overflow-y-auto">
          <SidebarContent />

        </div>

        {/* Main Content */}
          <div className="max-w-7xl mx-auto px-2 py-8 w-full">
            {children}
          </div>
      </div>
    </div>
  )
}
