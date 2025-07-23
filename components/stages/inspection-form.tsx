"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Clock, CheckCircle, User, ClipboardList, Camera, MessageSquare, BarChart3, ClipboardCheck, AlertTriangle, Info, ChevronDown, ChevronRight, Car, Zap } from "lucide-react"
import { Star } from "lucide-react"
import Image from "next/image"

// TypeScript interfaces for inspection data
interface Inspector {
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface Photo {
  path: string
  originalName: string
}

interface QuestionOption {
  value: string
  label: string
}

interface SubQuestion {
  question: string
  type: 'radio' | 'checkbox' | 'yesno' | 'rating' | 'number' | 'text'
  answer?: string | string[] | number
  options?: QuestionOption[]
  photos?: Photo[]
}

interface Question {
  question: string
  type: 'radio' | 'checkbox' | 'yesno' | 'rating' | 'number' | 'text'
  answer?: string | string[] | number
  options?: QuestionOption[]
  photos?: Photo[]
  subQuestions?: SubQuestion[]
  notes?: string
}

interface InspectionSection {
  id: string
  name: string
  icon: string
  rating: number
  score?: number
  maxScore?: number
  photos?: Photo[]
  questions?: Question[]
  completed?: boolean
}

interface SafetyIssue {
  severity: 'critical' | 'high' | 'medium' | 'low'
  location: string
  description: string
  estimatedCost?: number
}

interface MaintenanceItem {
  priority: 'high' | 'medium' | 'low'
  description: string
  recommendedAction?: string
  estimatedCost?: number
}

interface Inspection {
  _id: string
  status: string
  completed: boolean
  completedAt?: string
  overallRating: number
  inspector: Inspector
  sections?: InspectionSection[]
  safetyIssues?: SafetyIssue[]
  maintenanceItems?: MaintenanceItem[]
  inspectionNotes?: string
  recommendations?: string[]
  vinVerification?: {
    vinNumber: string;
    vinMatch: 'yes' | 'no' | 'not_verified';
  };
  notesForInspector?: string;
}

interface VehicleData {
  inspection?: Inspection
  vehicle?: {
    isElectric?: boolean
  }
}

interface InspectionFormProps {
  vehicleData: VehicleData
  onUpdate: (data: VehicleData) => void
  onComplete: () => void
  onOpenInspectorView: () => void
}

export function InspectionForm({ vehicleData, onComplete }: InspectionFormProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // Check if this is an electric vehicle
  const isElectricVehicle = vehicleData.vehicle?.isElectric || false

  // Debug logging for inspection data
  useEffect(() => {
    if (vehicleData.inspection) {
      console.log('Inspection data received in form:', {
        id: vehicleData.inspection._id,
        status: vehicleData.inspection.status,
        completed: vehicleData.inspection.completed,
        sectionsCount: vehicleData.inspection.sections?.length || 0,
        overallRating: vehicleData.inspection.overallRating,
      });
      
      if (vehicleData.inspection.sections) {
        vehicleData.inspection.sections.forEach((section: InspectionSection, index: number) => {
          console.log(`Section ${index + 1}: ${section.name}`, {
            questionsCount: section.questions?.length || 0,
            rating: section.rating,
            score: section.score,
          });
        });
      }
    }
  }, [vehicleData.inspection]);

  const getInspectionStatus = () => {
    if (!vehicleData.inspection) return 'pending'
    return vehicleData.inspection.status
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId)
  }

  const getSectionDisplayPhoto = (section: InspectionSection): Photo | null => {
    if (section.questions && Array.isArray(section.questions)) {
      for (const question of section.questions) {
        if (question.photos && Array.isArray(question.photos) && question.photos.length > 0) {
          return question.photos[0];
        }
      }
    }
    return null;
  }

  const getSectionPhotoCount = (section: InspectionSection): number => {
    let count = 0;
    if (section.photos && Array.isArray(section.photos)) {
      count += section.photos.length;
    }
    if (section.questions && Array.isArray(section.questions)) {
      section.questions.forEach((question: Question) => {
        if (question.photos && Array.isArray(question.photos)) {
          count += question.photos.length;
        }
        if (question.subQuestions && Array.isArray(question.subQuestions)) {
          question.subQuestions.forEach((subQ: SubQuestion) => {
            if (subQ.photos && Array.isArray(subQ.photos)) {
              count += subQ.photos.length;
            }
          });
        }
      });
    }
    return count;
  }

  return (
    <div className="space-y-4 md:space-y-6">

      {/* Completed Inspection Details */}
      {getInspectionStatus() === 'completed' && (
        <Card className="px-0 border-none" style={{ padding: '0px' }}>
          <CardHeader className="pb-3 md:pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-green-800 text-base md:text-lg">Inspection Completed</CardTitle>
                <CardDescription className="text-green-600 text-xs md:text-sm">
                  Comprehensive vehicle assessment finished successfully
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4 md:space-y-6">
            {/* Electric Vehicle Indicator */}
            {isElectricVehicle && (
              <div className="bg-white rounded-lg p-3 md:p-4 border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                  <h4 className="font-semibold text-gray-800 text-sm md:text-base">Electric Vehicle Inspection</h4>
                </div>
                <div className="bg-green-50 p-2 md:p-3 rounded border border-green-200">
                  <p className="text-xs md:text-sm text-green-800">
                    <strong>EV-Specific Assessment:</strong> This inspection included specialized questions for battery systems, 
                    charging capabilities, electric motor performance, regenerative braking, and high-voltage components.
                  </p>
                </div>
              </div>
            )}

            {/* VIN Verification Status */}
            {vehicleData.inspection?.vinVerification && (
              <div className="bg-white rounded-lg p-3 md:p-4 border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <Car className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                  <h4 className="font-semibold text-gray-800 text-sm md:text-base">VIN Verification</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                  <div>
                    <span className="text-gray-500">VIN Entered:</span>
                    <span className="ml-2 font-medium text-gray-800 font-mono">
                      {vehicleData.inspection.vinVerification.vinNumber || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">VIN Match:</span>
                    <span className={`ml-2 font-medium ${
                      vehicleData.inspection.vinVerification.vinMatch === 'yes' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {vehicleData.inspection.vinVerification.vinMatch === 'yes' 
                        ? '✅ VINs Match' 
                        : vehicleData.inspection.vinVerification.vinMatch === 'no'
                        ? '❌ VINs Do Not Match'
                        : 'Not verified'}
                    </span>
                  </div>
                </div>
                {vehicleData.inspection.vinVerification.vinMatch === 'no' && (
                  <div className="mt-3 p-2 md:p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-xs md:text-sm text-red-700">
                      <strong>Warning:</strong> VIN numbers do not match. This vehicle was flagged for further review.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Notes for Inspector */}
            {vehicleData.inspection?.notesForInspector && (
              <div className="bg-white rounded-lg p-3 md:p-4 border border-yellow-200">
                <div className="flex items-center gap-3 mb-3">
                  <ClipboardList className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
                  <h4 className="font-semibold text-gray-800 text-sm md:text-base">Notes for Inspector</h4>
                </div>
                <div className="bg-yellow-50 p-2 md:p-3 rounded border border-yellow-200">
                  <p className="text-xs md:text-sm text-yellow-800 whitespace-pre-wrap">
                    {vehicleData.inspection.notesForInspector}
                  </p>
                </div>
              </div>
            )}

            {/* Inspector Information */}
            <div className="bg-white rounded-lg p-3 md:p-4 border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <User className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                <h4 className="font-semibold text-gray-800 text-sm md:text-base">Inspector Details</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                <div>
                  <span className="text-gray-500">Inspector:</span>
                  <span className="ml-2 font-medium text-gray-800">
                    {vehicleData.inspection?.inspector.firstName} {vehicleData.inspection?.inspector.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Contact:</span>
                  <span className="ml-2 font-medium text-gray-800">
                    {vehicleData.inspection?.inspector.email} <br />
                    {vehicleData.inspection?.inspector.phone}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Completed:</span>
                  <span className="ml-2 font-medium text-gray-800">
                    {vehicleData.inspection?.completedAt ? new Date(vehicleData.inspection.completedAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Not completed'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Overall Rating:</span>
                  <div className="ml-2 inline-flex items-center gap-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 md:h-4 md:w-4 ${
                            star <= (vehicleData.inspection?.overallRating || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-medium text-gray-800 ml-1 text-xs md:text-sm">
                      {vehicleData.inspection?.overallRating}/5
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inspection Summary Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 md:p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-800 text-sm md:text-base">Inspection Summary</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 text-xs md:text-sm">
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-blue-600">
                    {vehicleData.inspection?.sections?.length || 0}
                  </div>
                  <div className="text-gray-600">Sections Inspected</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-yellow-600">
                    {(vehicleData.inspection?.overallRating || 0).toFixed(1)}
                  </div>
                  <div className="text-gray-600">Average Rating</div>
                </div>
              </div>
              
              {/* Additional Stats */}
            </div>

            {/* Inspection Sections */}
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                <h4 className="font-semibold text-gray-800 text-sm md:text-base">Detailed Inspection Results</h4>
              </div>
              
              <div className="space-y-3">
                {vehicleData.inspection?.sections?.map((section: InspectionSection, index: number) => {
                  const isExpanded = expandedSection === section.id;
                  const photoCount = getSectionPhotoCount(section);
                  const displayPhoto = getSectionDisplayPhoto(section);
                  
                  return (
                    <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                      {/* Section Header - Clickable */}
                      <div 
                        className="flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleSection(section.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            {/* Display first photo from section if available */}
                            {displayPhoto ? (
                              <Image
                                src={`${process.env.NEXT_PUBLIC_API_URL}${displayPhoto.path}`}
                                alt={`${section.name} preview`}
                                className="w-6 h-6 md:w-8 md:h-8 object-cover rounded"
                                width={32}
                                height={32}
                              />
                            ) : (
                              <span className="text-base md:text-lg">{section.icon}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-semibold text-gray-800 text-sm md:text-base">
                              {section.name}
                              {isElectricVehicle && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <Zap className="h-3 w-3 mr-1" />
                                  EV
                                </span>
                              )}
                            </h5>
                            {/* Hide details on mobile, show on md+ */}
                            <div className="hidden md:flex items-center gap-2 mt-1">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 md:h-4 md:w-4 ${
                                      star <= (section.rating || 0)
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs md:text-sm font-medium text-gray-600">
                                {section.rating}/5
                              </span>
                              {section.score && section.maxScore && (
                                <span className="text-xs text-gray-500">
                                  ({section.score}/{section.maxScore} pts)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Section Stats - hide on mobile, show on md+ */}
                        <div className="hidden md:flex items-center gap-2 md:gap-3">
                          <div className="text-right">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {photoCount > 0 && (
                                <span className="flex items-center gap-1">
                                  <Camera className="h-3 w-3" />
                                  {photoCount} photos
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <ClipboardList className="h-3 w-3" />
                                {section.questions?.length || 0} questions
                              </span>
                            </div>
                            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                              (section.rating || 0) >= 4 
                                ? 'bg-green-100 text-green-800' 
                                : (section.rating || 0) >= 3 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {section.rating >= 4 ? 'Excellent' : section.rating >= 3 ? 'Good' : 'Needs Attention'}
                            </div>
                          </div>
                          <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                        {/* On mobile, just show the toggle icon */}
                        <div className="md:hidden flex items-center">
                          <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Section Content - Collapsible */}
                      {isExpanded && (
                        <div className="p-3 md:p-4 space-y-3 md:space-y-4 bg-gray-50">
                          {/* Questions and Answers */}
                          {section.questions && section.questions.length > 0 && (
                            <div className="space-y-3">
                              <h6 className="font-medium text-gray-700 text-xs md:text-sm flex items-center gap-2">
                                <ClipboardList className="h-3 w-3 md:h-4 md:w-4" />
                                Assessment Details
                              </h6>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                                {section.questions.map((question: Question, qIndex: number) => (
                                  <div key={qIndex} className="bg-white rounded-lg p-3 md:p-4 border border-gray-200 shadow-sm">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="text-xs md:text-sm font-medium text-gray-800 mb-2">
                                          {question.question}
                                        </p>
                                        
                                        {/* Answer Display */}
                                        {question.answer && (
                                          <div className="text-xs md:text-sm text-gray-600 mb-3">
                                            {question.type === 'radio' && (
                                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                                                {question.options?.find((opt: QuestionOption) => opt.value === question.answer)?.label || question.answer}
                                              </span>
                                            )}
                                            {question.type === 'checkbox' && Array.isArray(question.answer) && (
                                              <div className="flex flex-wrap gap-1">
                                                {question.answer.map((ans: string, ansIndex: number) => (
                                                  <span key={ansIndex} className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs">
                                                    {question.options?.find((opt: QuestionOption) => opt.value === ans)?.label || ans}
                                                  </span>
                                                ))}
                                              </div>
                                            )}
                                            {question.type === 'yesno' && (
                                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                                question.answer === 'yes' 
                                                  ? 'bg-green-100 text-green-800' 
                                                  : 'bg-red-100 text-red-800'
                                              }`}>
                                                {question.answer === 'yes' ? 'Yes' : 'No'}
                                              </span>
                                            )}
                                            {question.type === 'rating' && (
                                              <div className="flex items-center gap-1">
                                                <div className="flex">
                                                  {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                      key={star}
                                                      className={`h-3 w-3 ${
                                                        star <= (question.answer as number || 0)
                                                          ? 'text-yellow-400 fill-current'
                                                          : 'text-gray-300'
                                                      }`}
                                                    />
                                                  ))}
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                  {question.answer}/5
                                                </span>
                                              </div>
                                            )}
                                            {question.type === 'number' && (
                                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-mono">
                                                {question.answer}
                                              </span>
                                            )}
                                            {question.type === 'text' && (
                                              <p className="text-xs md:text-sm text-gray-700 mt-1 bg-white p-2 rounded border">{question.answer}</p>
                                            )}
                                          </div>
                                        )}

                                        {/* Photos Display - Show for any question that has photos */}
                                        {question.photos && question.photos.length > 0 && (
                                          <div className="mb-3">
                                            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                              <Camera className="h-3 w-3" />
                                              Photos taken: {question.photos.length}
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                              {question.photos.map((photo: Photo, photoIndex: number) => (
                                                <div key={photoIndex} className="relative aspect-video bg-gray-100 rounded overflow-hidden border border-gray-200">
                                                  <Image
                                                    src={`${process.env.NEXT_PUBLIC_API_URL}${photo.path}`}
                                                    alt={`Photo ${photoIndex + 1}`}
                                                    className="w-full h-full object-cover"
                                                    width={100}
                                                    height={100}
                                                  />
                                                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                                                    {photo.originalName}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Sub-Questions */}
                                        {question.subQuestions && question.subQuestions.length > 0 && (
                                          <div className="mt-3 ml-4 space-y-2 border-l-2 border-gray-200 pl-3">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Follow-up Questions:</p>
                                            {question.subQuestions.map((subQ: SubQuestion, subIndex: number) => (
                                              <div key={subIndex} className="bg-gray-50 rounded p-2 border">
                                                <p className="text-xs font-medium text-gray-600 mb-1">{subQ.question}</p>
                                                {subQ.answer && (
                                                  <div className="text-xs text-gray-500">
                                                    {subQ.type === 'radio' && subQ.options && (
                                                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                                                        {subQ.options.find((opt: QuestionOption) => opt.value === subQ.answer)?.label || subQ.answer}
                                                      </span>
                                                    )}
                                                    {subQ.type === 'checkbox' && Array.isArray(subQ.answer) && (
                                                      <div className="flex flex-wrap gap-1">
                                                        {subQ.answer.map((ans: string, ansIndex: number) => (
                                                          <span key={ansIndex} className="inline-flex items-center px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-xs">
                                                            {subQ.options?.find((opt: QuestionOption) => opt.value === ans)?.label || ans}
                                                          </span>
                                                        ))}
                                                      </div>
                                                    )}
                                                    {subQ.type === 'number' && (
                                                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-50 text-gray-700 text-xs font-mono">
                                                        {subQ.answer}
                                                      </span>
                                                    )}
                                                    {subQ.type === 'text' && (
                                                      <p className="text-gray-600 bg-gray-50 p-1 rounded text-xs">{subQ.answer}</p>
                                                    )}
                                                  </div>
                                                )}

                                                {/* Sub-Question Photos */}
                                                {subQ.photos && subQ.photos.length > 0 && (
                                                  <div className="mt-2">
                                                    <p className="text-xs text-gray-400 mb-1">Photos: {subQ.photos.length}</p>
                                                    <div className="grid grid-cols-2 gap-1">
                                                      {subQ.photos.map((photo: Photo, photoIndex: number) => (
                                                        <div key={photoIndex} className="relative aspect-video bg-gray-100 rounded overflow-hidden border border-gray-200">
                                                          <Image
                                                            src={`${process.env.NEXT_PUBLIC_API_URL}${photo.path}`}
                                                            alt={`Sub-question photo ${photoIndex + 1}`}
                                                            className="w-full h-full object-cover"
                                                            width={100}
                                                            height={100}
                                                          />
                                                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                                                            {photo.originalName}
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {/* Notes */}
                                        {question.notes && (
                                          <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                                            <p className="text-xs text-yellow-800">
                                              <span className="font-medium">Notes:</span> {question.notes}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section Photos Display */}
            {vehicleData.inspection?.sections?.map((section: InspectionSection, index: number) => {
              // Collect all photos from this section
              const sectionPhotos: Photo[] = [];
              
              // Add section-level photos
              if (section.photos && Array.isArray(section.photos)) {
                sectionPhotos.push(...section.photos);
              }
              
              // Add photos from all questions in this section
              if (section.questions && Array.isArray(section.questions)) {
                section.questions.forEach((question: Question) => {
                  if (question.photos && Array.isArray(question.photos)) {
                    sectionPhotos.push(...question.photos);
                  }
                  
                  // Add photos from sub-questions
                  if (question.subQuestions && Array.isArray(question.subQuestions)) {
                    question.subQuestions.forEach((subQ: SubQuestion) => {
                      if (subQ.photos && Array.isArray(subQ.photos)) {
                        sectionPhotos.push(...subQ.photos);
                      }
                    });
                  }
                });
              }
              
              // Only show section if it has photos
              if (sectionPhotos.length === 0) return null;
              
              return (
                <div key={`photos-${index}`} className="space-y-3 md:space-y-4">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                    <h4 className="font-semibold text-gray-800 text-sm md:text-base">{section.name} - All Photos</h4>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-3 md:p-4 border border-green-200">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                      {sectionPhotos.map((photo: Photo, photoIndex: number) => (
                        <div key={photoIndex} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-green-400 transition-all duration-200 group">
                          <Image
                            src={`${process.env.NEXT_PUBLIC_API_URL}${photo.path}`}
                            alt={`${section.name} photo ${photoIndex + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            width={100}
                            height={100}
                            />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-white text-xs truncate font-medium">
                              {photo.originalName}
                            </p>
                          </div>
                          <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Eye className="h-3 w-3 text-gray-600" />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 text-xs text-green-700">
                      📸 {sectionPhotos.length} photos taken for {section.name}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Safety Issues */}
            {vehicleData.inspection?.safetyIssues && vehicleData.inspection.safetyIssues.length > 0 && (
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                  <h4 className="font-semibold text-gray-800 text-sm md:text-base">Safety Issues</h4>
                </div>
                
                <div className="grid gap-3">
                  {vehicleData.inspection.safetyIssues.map((issue: SafetyIssue, index: number) => (
                    <div key={index} className="bg-red-50 rounded-lg p-3 md:p-4 border border-red-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={
                              issue.severity === 'critical' ? 'destructive' :
                              issue.severity === 'high' ? 'destructive' :
                              issue.severity === 'medium' ? 'secondary' : 'outline'
                            }>
                              {issue.severity?.toUpperCase()}
                            </Badge>
                            <span className="text-xs md:text-sm font-medium text-red-800">{issue.location}</span>
                          </div>
                          <p className="text-xs md:text-sm text-red-700 mb-2">{issue.description}</p>
                          {issue.estimatedCost && (
                            <p className="text-xs text-red-600">
                              Estimated Cost: ${issue.estimatedCost.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Maintenance Items */}
            {vehicleData.inspection?.maintenanceItems && vehicleData.inspection.maintenanceItems.length > 0 && (
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                  <h4 className="font-semibold text-gray-800 text-sm md:text-base">Maintenance Recommendations</h4>
                </div>
                
                <div className="grid gap-3">
                  {vehicleData.inspection.maintenanceItems.map((item: MaintenanceItem, index: number) => (
                    <div key={index} className="bg-orange-50 rounded-lg p-3 md:p-4 border border-orange-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={
                              item.priority === 'high' ? 'destructive' :
                              item.priority === 'medium' ? 'secondary' : 'outline'
                            }>
                              {item.priority?.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs md:text-sm font-medium text-orange-800 mb-1">{item.description}</p>
                          {item.recommendedAction && (
                            <p className="text-xs md:text-sm text-orange-700 mb-2">{item.recommendedAction}</p>
                          )}
                          {item.estimatedCost && (
                            <p className="text-xs text-orange-600">
                              Estimated Cost: ${item.estimatedCost.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Overall Inspection Notes */}
            {vehicleData.inspection?.inspectionNotes && (
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-800 text-sm md:text-base">Overall Inspection Notes</h4>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-3 md:p-4 border border-blue-200">
                  <p className="text-xs md:text-sm text-blue-800 leading-relaxed">{vehicleData.inspection.inspectionNotes}</p>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {vehicleData.inspection?.recommendations && vehicleData.inspection.recommendations.length > 0 && (
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                  <h4 className="font-semibold text-gray-800 text-sm md:text-base">Recommendations</h4>
                </div>
                
                <div className="bg-green-50 rounded-lg p-3 md:p-4 border border-green-200">
                  <ul className="space-y-2">
                    {vehicleData.inspection.recommendations.map((recommendation: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-xs md:text-sm text-green-800">{recommendation}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pending Inspection Details */}
      {getInspectionStatus() === 'in-progress' && (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="pb-3 md:pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Clock className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-blue-800 text-base md:text-lg">Inspection In Progress</CardTitle>
                <CardDescription className="text-blue-600 text-xs md:text-sm">
                  Vehicle inspection is currently being conducted
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4 md:space-y-6">
            <div className="bg-white rounded-lg p-3 md:p-4 border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <User className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                <h4 className="font-semibold text-gray-800 text-sm md:text-base">Inspector Information</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                <div>
                  <span className="text-gray-500">Inspector:</span>
                  <span className="ml-2 font-medium text-gray-800">
                    {vehicleData.inspection?.inspector.firstName} {vehicleData.inspection?.inspector.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Contact:</span>
                  <span className="ml-2 font-medium text-gray-800">
                    {vehicleData.inspection?.inspector.email} <br />
                    {vehicleData.inspection?.inspector.phone}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 font-medium text-blue-600">
                    In Progress
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Progress:</span>
                  <span className="ml-2 font-medium text-gray-800">
                    {vehicleData.inspection?.sections?.filter(s => s.completed).length || 0} of {vehicleData.inspection?.sections?.length || 0} sections completed
                    {isElectricVehicle && (
                      <span className="text-green-600 ml-1">(EV-specific sections)</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 md:p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-800 text-sm md:text-base">Inspection Progress</h4>
              </div>
              <p className="text-xs md:text-sm text-blue-700">
                The inspector has started the vehicle inspection but has not completed all required sections yet. 
                The inspection will be available for review once it&apos;s fully completed.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending State */}
      {getInspectionStatus() !== 'completed' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 md:p-6 text-center">
            <Clock className="h-10 w-10 md:h-12 md:w-12 text-yellow-600 mx-auto mb-3 md:mb-4" />
            <h3 className="text-base md:text-lg font-semibold text-yellow-800 mb-2">Waiting for Inspector</h3>
            <p className="text-yellow-700 mb-4 text-xs md:text-sm">
              The inspection link has been sent to the assigned inspector. They will complete the vehicle assessment and
              submit their findings.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button 
          onClick={() => onComplete()} 
          disabled={getInspectionStatus() !== 'completed'} 
          size="lg" 
          className="px-6 md:px-8 text-sm md:text-base"
        >
          Continue to Quote Preparation
        </Button>
      </div>
    </div>
  )
}
