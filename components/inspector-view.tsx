"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { 
  Star, 
  ArrowLeft, 
  CheckCircle,
  ChevronRight,
  User,
  ClipboardList,
  Clock,
  Car as CarIcon,
  CarFront as CarFrontIcon,
  Settings as SettingsIcon,
  Wrench as WrenchIcon,
  Zap as ZapIcon,
  Shield as ShieldIcon,
  CircleDot as CircleDotIcon,
  XCircle,
  Camera,
  RefreshCw,
} from "lucide-react"
import api from "@/lib/api"
import { RadioGroup } from "@/components/ui/radio-group"
import React from "react"

interface VehicleData {
  customer?: {
    firstName: string
    lastName: string
  }
  vehicle?: {
    year: string
    make: string
    model: string
    currentMileage?: number
    vin?: string
  }
  inspection?: {
    accessToken: string
    sections?: InspectionSection[]
    inspectionNotes?: string
    notesForInspector?: string
    scheduledDate?: string
    scheduledTime?: string
    dueByDate?: string
    dueByTime?: string
    vinVerification?: {
      vinNumber?: string
      vinMatch?: string
    }
  }
}

interface InspectionSection {
  id: string
  name: string
  description: string
  icon: string
  questions: InspectionQuestion[]
  rating?: number
  score?: number
  maxScore?: number
  completed?: boolean
  photos?: PhotoData[]
}

interface InspectionQuestion {
  id: string
  question: string
  type: string
  options?: QuestionOption[]
  required?: boolean
  answer?: string | string[] | number
  notes?: string
  photos?: PhotoData[]
  subQuestions?: InspectionQuestion[]
}

interface QuestionOption {
  value: string
  label: string
  points: number
}

interface PhotoData {
  path: string
  originalName: string
  uploadedAt: Date
}

interface FormattedInspectionData {
  sections: InspectionSection[]
  overallRating: number
  overallScore: number
  maxPossibleScore: number
  status: "completed"
  completed: boolean
  completedAt: Date
  inspectionNotes: string
  recommendations: string[]
}

interface InspectorViewProps {
  vehicleData: VehicleData
  onSubmit: (formattedData: FormattedInspectionData) => void
  onBack: () => void
}

interface SectionData {
  completed?: boolean
  rating?: number
  score?: number
  maxScore?: number
  photos?: PhotoData[]
  questions?: {
    [questionId: string]: {
      answer?: string | string[] | number
      notes?: string
      photos?: PhotoData[]
      subQuestions?: {
        [subQuestionId: string]: {
          answer?: string | string[] | number
          notes?: string
          photos?: PhotoData[]
        }
      }
    }
  }
}

type InspectionData = Record<string, SectionData> & {
  overallNotes?: string
  lastUpdated?: number
  vinVerification?: {
    vinNumber?: string
    vinMatch?: string
  }
}

// Comprehensive inspection sections with detailed questions
const inspectionSections = [
  {
    id: "exterior",
    name: "Exterior Condition",
    icon: CarIcon,
    description: "Comprehensive exterior vehicle assessment including body, paint, glass, and lights",
    questions: [
      {
        id: "paint_condition",
        question: "What is the overall paint condition?",
        type: "radio",
        required: true,
        options: [
          { value: "excellent", label: "Excellent - No visible damage", points: 5 },
          { value: "good", label: "Good - Minor scratches/swirls", points: 4 },
          { value: "fair", label: "Fair - Some scratches/dents", points: 3 },
          { value: "poor", label: "Poor - Significant damage", points: 2 },
          { value: "very_poor", label: "Very Poor - Major damage", points: 1 }
        ]
      },
      {
        id: "paint_damage_details",
        question: "If paint condition is fair or worse, specify damage types:",
        type: "checkbox",
        options: [
          { value: "scratches", label: "Scratches", points: -1 },
          { value: "dents", label: "Dents", points: -2 },
          { value: "rust", label: "Rust spots", points: -3 },
          { value: "fading", label: "Paint fading", points: -1 },
          { value: "peeling", label: "Paint peeling", points: -2 },
          { value: "mismatch", label: "Color mismatch", points: -2 }
        ],
        subQuestions: [
          {
            id: "paint_damage_location",
            question: "Specify locations of major damage:",
            type: "text"
          }
        ]
      },
      {
        id: "body_panels",
        question: "Are there any damaged or misaligned body panels?",
        type: "yesno",
        required: true,
        subQuestions: [
          {
            id: "body_panels_details",
            question: "If yes, describe the damage and affected panels:",
            type: "text"
          },
          {
            id: "body_panels_severity",
            question: "Rate the severity of panel damage:",
            type: "radio",
            options: [
              { value: "minor", label: "Minor - Small dents/scratches", points: -1 },
              { value: "moderate", label: "Moderate - Noticeable damage", points: -2 },
              { value: "severe", label: "Severe - Major structural damage", points: -5 }
            ]
          }
        ]
      },
      {
        id: "glass_condition",
        question: "Check all glass components:",
        type: "checkbox",
        options: [
          { value: "windshield_cracked", label: "Windshield cracked", points: -3 },
          { value: "windshield_chipped", label: "Windshield chipped", points: -1 },
          { value: "side_windows_damaged", label: "Side windows damaged", points: -2 },
          { value: "rear_window_damaged", label: "Rear window damaged", points: -2 },
          { value: "mirrors_damaged", label: "Side mirrors damaged", points: -1 },
          { value: "glass_tint_damaged", label: "Tint damaged", points: -1 }
        ],
        subQuestions: [
          {
            id: "glass_damage_details",
            question: "Describe any glass damage in detail:",
            type: "text"
          }
        ]
      },
      {
        id: "lights_functional",
        question: "Are all exterior lights functional?",
        type: "yesno",
        required: true,
        subQuestions: [
          {
            id: "lights_details",
            question: "List any non-functional lights:",
            type: "text"
          }
        ]
      },
      {
        id: "bumpers_condition",
        question: "Bumper condition assessment:",
        type: "radio",
        required: true,
        options: [
          { value: "front_excellent", label: "Front - Excellent - No damage", points: 5 },
          { value: "front_good", label: "Front - Good - Minor scratches", points: 4 },
          { value: "front_fair", label: "Front - Fair - Some damage", points: 3 },
          { value: "front_poor", label: "Front - Poor - Significant damage", points: 2 },
          { value: "front_very_poor", label: "Front - Very Poor - Major damage", points: 1 },
          { value: "rear_excellent", label: "Rear - Excellent - No damage", points: 5 },
          { value: "rear_good", label: "Rear - Good - Minor scratches", points: 4 },
          { value: "rear_fair", label: "Rear - Fair - Some damage", points: 3 },
          { value: "rear_poor", label: "Rear - Poor - Significant damage", points: 2 },
          { value: "rear_very_poor", label: "Rear - Very Poor - Major damage", points: 1 }
        ]
      },
      {
        id: "exterior_photos",
        question: "Take comprehensive photos of exterior condition - Include front, rear, sides, corners, and any damage areas. Take photos from multiple angles to show the overall condition clearly.",
        type: "photo",
        required: true
      }
    ]
  },
  {
    id: "interior",
    name: "Interior Condition",
    icon: CarFrontIcon,
    description: "Interior cleanliness, functionality, and comfort assessment",
    questions: [
      {
        id: "seats_condition",
        question: "What is the condition of the seats?",
        type: "radio",
        required: true,
        options: [
          { value: "excellent", label: "Excellent - Like new", points: 5 },
          { value: "good", label: "Good - Minor wear", points: 4 },
          { value: "fair", label: "Fair - Some wear/tears", points: 3 },
          { value: "poor", label: "Poor - Significant damage", points: 2 },
          { value: "very_poor", label: "Very Poor - Major damage", points: 1 }
        ]
      },
      {
        id: "seat_adjustment",
        question: "Do both the driver and front passenger seats move properly using their power or manual lever functions?",
        type: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes – Both seats adjust correctly", points: 5 },
          { value: "no", label: "No – One or both seats do not adjust properly", points: 0 },
          { value: "na", label: "Not Applicable – Vehicle has fixed seats or condition cannot be tested", points: 2 }
        ],
        subQuestions: [
          {
            id: "seat_adjustment_details",
            question: "Please describe the issue and specify which seat(s) are affected:",
            type: "text"
          } 
        ]
      },
      {
        id: "seat_damage_types",
        question: "If seats have damage, specify types:",
        type: "checkbox",
        options: [
          { value: "tears", label: "Tears in upholstery", points: -2 },
          { value: "stains", label: "Stains", points: -1 },
          { value: "broken_adjustments", label: "Broken adjustments", points: -2 },
          { value: "worn_bolstering", label: "Worn bolstering", points: -1 },
          { value: "broken_springs", label: "Broken springs", points: -3 }
        ]
      },
      {
        id: "dashboard_condition",
        question: "Dashboard and instrument panel condition:",
        type: "radio",
        required: true,
        options: [
          { value: "excellent", label: "Excellent - No damage", points: 5 },
          { value: "good", label: "Good - Minor scratches", points: 4 },
          { value: "fair", label: "Fair - Some damage", points: 3 },
          { value: "poor", label: "Poor - Significant damage", points: 2 }
        ]
      },
      {
        id: "interior_features",
        question: "Check interior features functionality:",
        type: "checkbox",
        options: [
          { value: "ac_working", label: "Air conditioning working", points: 2 },
          { value: "heater_working", label: "Heater working", points: 2 },
          { value: "radio_working", label: "Radio/stereo working", points: 1 },
          { value: "power_windows", label: "Power windows working", points: 1 },
          { value: "power_locks", label: "Power locks working", points: 1 },
          { value: "sunroof_working", label: "Sunroof working (if applicable)", points: 1 },
          { value: "cruise_control", label: "Cruise control working", points: 1 },
          { value: "steering_wheel_controls", label: "Steering wheel controls", points: 1 },
          { value: "backup_camera", label: "Backup camera working", points: 1 },
          { value: "bluetooth", label: "Bluetooth connectivity", points: 1 }
        ]
      },
      {
        id: "interior_cleanliness",
        question: "Rate interior cleanliness:",
        type: "rating",
        required: true
      },
      {
        id: "odometer_reading",
        question: "Current odometer reading:",
        type: "number",
        required: true
      },
      {
        id: "interior_odors",
        question: "Are there any unusual odors in the interior?",
        type: "yesno",
        subQuestions: [
          {
            id: "odor_description",
            question: "Describe any odors:",
            type: "text"
          }
        ]
      },
      {
        id: "interior_photos",
        question: "Take comprehensive photos of interior condition - Include dashboard, seats, steering wheel, center console, door panels, and any damage or wear areas. Take photos from driver and passenger perspectives.",
        type: "photo",
        required: true
      }
    ]
  },
  {
    id: "engine",
    name: "Engine & Mechanical",
    icon: SettingsIcon,
    description: "Engine performance, mechanical systems, and fluid conditions",
    questions: [
      {
        id: "engine_start",
        question: "Does the engine start properly?",
        type: "yesno",
        required: true,
        subQuestions: [
          {
            id: "engine_start_issues",
            question: "Describe any starting issues:",
            type: "text"
          },
          {
            id: "start_time",
            question: "How long does it take to start (seconds):",
            type: "number"
          }
        ]
      },
      {
        id: "engine_noise",
        question: "Are there any unusual engine noises?",
        type: "yesno",
        required: true,
        subQuestions: [
          {
            id: "engine_noise_details",
            question: "Describe the noises and when they occur:",
            type: "text"
          },
          {
            id: "noise_severity",
            question: "Rate noise severity:",
            type: "radio",
            options: [
              { value: "mild", label: "Mild - Barely noticeable", points: -1 },
              { value: "moderate", label: "Moderate - Clearly audible", points: -2 },
              { value: "severe", label: "Severe - Very loud", points: -4 }
            ]
          }
        ]
      },
      {
        id: "oil_condition",
        question: "Check engine oil condition:",
        type: "radio",
        required: true,
        options: [
          { value: "clean", label: "Clean and at proper level", points: 5 },
          { value: "slightly_dirty", label: "Slightly dirty but adequate", points: 3 },
          { value: "very_dirty", label: "Very dirty - needs change", points: 1 },
          { value: "low_level", label: "Low level", points: 0 },
          { value: "contaminated", label: "Contaminated (milky/burnt)", points: -2 }
        ]
      },
      {
        id: "coolant_condition",
        question: "Coolant level and condition:",
        type: "radio",
        required: true,
        options: [
          { value: "proper", label: "Proper level and clean", points: 5 },
          { value: "low", label: "Low level", points: 2 },
          { value: "dirty", label: "Dirty or contaminated", points: 1 },
          { value: "leaking", label: "Visible leaks", points: -2 }
        ]
      },
      {
        id: "transmission",
        question: "Transmission condition:",
        type: "radio",
        required: true,
        options: [
          { value: "smooth", label: "Smooth shifting", points: 5 },
          { value: "slight_roughness", label: "Slight roughness", points: 3 },
          { value: "rough", label: "Rough shifting", points: 1 },
          { value: "problems", label: "Major problems", points: 0 }
        ],
        subQuestions: [
          {
            id: "transmission_issues",
            question: "Describe any transmission issues:",
            type: "text"
          }
        ]
      },
      {
        id: "engine_leaks",
        question: "Are there any visible engine leaks?",
        type: "yesno",
        required: true,
        subQuestions: [
          {
            id: "leak_locations",
            question: "Specify leak locations and severity:",
            type: "text"
          }
        ]
      },
      {
        id: "engine_photos",
        question: "Take photos of engine compartment - Include overall engine bay, close-ups of any leaks or damage, fluid levels, and any visible components that need attention.",
        type: "photo",
        required: true
      }
    ]
  },
  {
    id: "tires",
    name: "Tires & Wheels",
    icon: CircleDotIcon,
    description: "Tire condition, tread depth, and wheel assessment",
    questions: [
      {
        id: "tire_condition",
        question: "Overall tire condition:",
        type: "radio",
        required: true,
        options: [
          { value: "excellent", label: "Excellent - Like new", points: 5 },
          { value: "good", label: "Good - Adequate tread", points: 4 },
          { value: "fair", label: "Fair - Some wear", points: 3 },
          { value: "poor", label: "Poor - Low tread", points: 2 },
          { value: "very_poor", label: "Very Poor - Bald/unsafe", points: 0 }
        ]
      },
      {
        id: "tire_tread_depth",
        question: "Measure tire tread depth (32nds of an inch):",
        type: "number",
        required: true,
        subQuestions: [
          {
            id: "front_left_tread",
            question: "Front left tire tread depth:",
            type: "number"
          },
          {
            id: "front_right_tread",
            question: "Front right tire tread depth:",
            type: "number"
          },
          {
            id: "rear_left_tread",
            question: "Rear left tire tread depth:",
            type: "number"
          },
          {
            id: "rear_right_tread",
            question: "Rear right tire tread depth:",
            type: "number"
          }
        ]
      },
      {
        id: "tire_damage",
        question: "Check for tire damage:",
        type: "checkbox",
        options: [
          { value: "sidewall_damage", label: "Sidewall damage", points: -3 },
          { value: "bulges", label: "Bulges or bubbles", points: -4 },
          { value: "cracks", label: "Cracks in rubber", points: -2 },
          { value: "punctures", label: "Punctures or plugs", points: -2 },
          { value: "uneven_wear", label: "Uneven wear patterns", points: -2 }
        ]
      },
      {
        id: "wheel_condition",
        question: "Wheel condition:",
        type: "radio",
        required: true,
        options: [
          { value: "excellent", label: "Excellent - No damage", points: 5 },
          { value: "good", label: "Good - Minor scratches", points: 4 },
          { value: "fair", label: "Fair - Some damage", points: 3 },
          { value: "poor", label: "Poor - Significant damage", points: 2 }
        ]
      },
      {
        id: "tire_photos",
        question: "Take photos of all four tires and wheels - Include tread depth, sidewall condition, wheel damage, and any visible wear patterns. Take close-ups of any damage or issues.",
        type: "photo",
        required: true
      }
    ]
  },
  {
    id: "electrical",
    name: "Electrical Systems",
    icon: ZapIcon,
    description: "Battery, charging system, and electrical components",
    questions: [
      {
        id: "battery_condition",
        question: "Battery condition:",
        type: "radio",
        required: true,
        options: [
          { value: "excellent", label: "Excellent - Strong charge", points: 5 },
          { value: "good", label: "Good - Adequate charge", points: 4 },
          { value: "fair", label: "Fair - Weak charge", points: 2 },
          { value: "poor", label: "Poor - Dead/dying", points: 0 }
        ]
      },
      {
        id: "battery_age",
        question: "Battery age (if visible):",
        type: "number",
        subQuestions: [
          {
            id: "battery_date",
            question: "Battery date code (if visible):",
            type: "text"
          }
        ]
      },
      {
        id: "charging_system",
        question: "Charging system working properly?",
        type: "yesno",
        required: true,
        subQuestions: [
          {
            id: "charging_issues",
            question: "Describe any charging system issues:",
            type: "text"
          }
        ]
      },
      {
        id: "electrical_features",
        question: "Test electrical features:",
        type: "checkbox",
        options: [
          { value: "horn_working", label: "Horn working", points: 1 },
          { value: "wipers_working", label: "Windshield wipers working", points: 1 },
          { value: "defroster_working", label: "Defroster working", points: 1 },
          { value: "interior_lights", label: "Interior lights working", points: 1 },
          { value: "power_seats", label: "Power seats working", points: 1 },
          { value: "heated_seats", label: "Heated seats working", points: 1 },
          { value: "remote_start", label: "Remote start working", points: 1 }
        ]
      },
      {
        id: "electrical_issues",
        question: "Are there any electrical issues?",
        type: "yesno",
        subQuestions: [
          {
            id: "electrical_issues_details",
            question: "Describe any electrical problems:",
            type: "text"
          }
        ]
      }
    ]
  },
  {
    id: "brakes",
    name: "Brake System",
    icon: ShieldIcon,
    description: "Brake performance, pedal feel, and brake system condition",
    questions: [
      {
        id: "brake_pedal",
        question: "Brake pedal feel:",
        type: "radio",
        required: true,
        options: [
          { value: "firm", label: "Firm and responsive", points: 5 },
          { value: "slightly_soft", label: "Slightly soft", points: 3 },
          { value: "very_soft", label: "Very soft/spongy", points: 1 },
          { value: "goes_to_floor", label: "Goes to floor", points: 0 }
        ]
      },
      {
        id: "parking_brake",
        question: "Parking brake functionality:",
        type: "radio",
        required: true,
        options: [
          { value: "working", label: "Working properly", points: 5 },
          { value: "weak", label: "Weak hold", points: 2 },
          { value: "not_working", label: "Not working", points: 0 }
        ]
      }
    ]
  },
  {
    id: "undercarriage",
    name: "Undercarriage & Frame",
    icon: WrenchIcon,
    description: "Frame condition, suspension, and undercarriage components",
    questions: [
      {
        id: "frame_condition",
        question: "Frame condition:",
        type: "radio",
        required: true,
        options: [
          { value: "excellent", label: "Excellent - No damage", points: 5 },
          { value: "good", label: "Good - Minor surface rust", points: 4 },
          { value: "fair", label: "Fair - Some rust/damage", points: 3 },
          { value: "poor", label: "Poor - Significant rust/damage", points: 1 },
          { value: "very_poor", label: "Very Poor - Structural damage", points: 0 }
        ]
      },
      {
        id: "modified_suspension",
        question: "Does the vehicle have a modified suspension?",
        type: "yesno",
        required: true,
        subQuestions: [
          {
            id: "suspension_modifications",
            question: "Describe the suspension modifications you observed:",
            type: "text"
          }
        ]
      },
      {
        id: "rust_condition",
        question: "Rust assessment:",
        type: "checkbox",
        options: [
          { value: "surface_rust", label: "Surface rust only", points: -1 },
          { value: "structural_rust", label: "Structural rust", points: -4 },
          { value: "holes", label: "Rust holes", points: -5 },
          { value: "none", label: "No visible rust", points: 2 }
        ]
      },
      {
        id: "suspension_condition",
        question: "Suspension condition:",
        type: "radio",
        required: true,
        options: [
          { value: "excellent", label: "Excellent - No issues", points: 5 },
          { value: "good", label: "Good - Minor wear", points: 4 },
          { value: "fair", label: "Fair - Some wear", points: 3 },
          { value: "poor", label: "Poor - Significant wear", points: 1 }
        ]
      },
      {
        id: "undercarriage_photos",
        question: "Take comprehensive photos of undercarriage and frame - Position yourself under the center of the vehicle for wide shots, then move to each side for detailed frame rail photos. Ensure good lighting and keep camera level for clear detail capture.",
        type: "photo",
        required: true
      }
    ]
  }
];

// localStorage utility functions
const getStorageKey = (inspectionToken: string) => `inspection_data_${inspectionToken}`;

const saveInspectionData = (inspectionToken: string, data: InspectionData) => {
  try {
    localStorage.setItem(getStorageKey(inspectionToken), JSON.stringify(data));
    console.log('Inspection data saved to localStorage:', inspectionToken);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const loadInspectionData = (inspectionToken: string): InspectionData => {
  try {
    const data = localStorage.getItem(getStorageKey(inspectionToken));
    if (data) {
      const parsedData = JSON.parse(data);
      console.log('Inspection data loaded from localStorage:', inspectionToken);
      return parsedData;
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  return {};
};

const clearInspectionData = (inspectionToken: string) => {
  try {
    localStorage.removeItem(getStorageKey(inspectionToken));
    console.log('Inspection data cleared from localStorage:', inspectionToken);
  } catch (error) {
    console.error('Error clearing from localStorage:', error);
  }
};

// Get all inspection tokens from localStorage
const getAllInspectionTokens = (): string[] => {
  const tokens: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('inspection_data_')) {
        const token = key.replace('inspection_data_', '');
        tokens.push(token);
      }
    }
  } catch (error) {
    console.error('Error getting inspection tokens:', error);
  }
  return tokens;
};

// Clean up old inspection data (older than 7 days)
const cleanupOldInspectionData = () => {
  try {
    const tokens = getAllInspectionTokens();
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    tokens.forEach(token => {
      const data = loadInspectionData(token);
      if (data.lastUpdated && data.lastUpdated < sevenDaysAgo) {
        clearInspectionData(token);
        console.log('Cleaned up old inspection data for token:', token);
      }
    });
  } catch (error) {
    console.error('Error cleaning up old inspection data:', error);
  }
};

// Adding a helper function to get angle names for different sections
const getAnglesBySection = (sectionId: string) => {
  switch (sectionId) {
    case 'exterior':
      return [
        { id: 'front', label: 'Front of Vehicle' },
        { id: 'rear', label: 'Rear of Vehicle' },
        { id: 'left', label: 'Driver Side' },
        { id: 'right', label: 'Passenger Side' },
        { id: 'closeup', label: 'Close-up of Any Damage (if applicable)' },
        { id: 'top', label: 'Top of Vehicle' }
      ];
    case 'interior':
      return [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'front_seats', label: 'Front Seats' },
        { id: 'rear_seats', label: 'Rear Seats' },
        { id: 'trunk', label: 'Trunk/Cargo Area' },
        { id: 'console', label: 'Center Console' }
      ];
    case 'engine':
      return [
        { id: 'engine_bay', label: 'Engine Bay' },
        { id: 'odometer', label: 'Odometer Reading' },
        { id: 'fluid_levels', label: 'Fluid Levels' },
        { id: 'leaks_damage', label: 'Any visible leaks or damage (if applicable)' }
      ];
    case 'tires':
      return [
        { id: 'front_left', label: 'Front Left' },
        { id: 'front_right', label: 'Front Right' },
        { id: 'rear_left', label: 'Rear Left' },
        { id: 'rear_right', label: 'Rear Right' },
        { id: 'spare', label: 'Spare Tire' }
      ];
    case 'undercarriage':
      return [
        { id: 'wide_view', label: 'Wide View – Front-to-Back' },
        { id: 'driver_frame', label: 'Driver-Side Frame Rail' },
        { id: 'passenger_frame', label: 'Passenger-Side Frame Rail' }
      ];
    default:
      return [
        { id: 'general', label: 'General Photo' },
        { id: 'detail', label: 'Detail Photo' },
        { id: 'other', label: 'Other' }
      ];
  }
};

export function InspectorView({ vehicleData, onSubmit, onBack }: InspectorViewProps) {
  const inspectionToken = vehicleData.inspection?.accessToken;
  
  // Initialize state with data from localStorage
  const [inspectionData, setInspectionData] = useState<InspectionData>(() => {
    if (inspectionToken) {
      return loadInspectionData(inspectionToken);
    }
    return {};
  });
  console.log('inspectionData', inspectionData);
  
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [vinVerificationComplete, setVinVerificationComplete] = useState(false)
  // Add state for image modal
  const [modalImage, setModalImage] = useState<string | null>(null)
  const [isSavingPending, setIsSavingPending] = useState(false)
  const { toast } = useToast()
  
  // Save data to localStorage whenever inspectionData changes
  useEffect(() => {
    if (inspectionToken && Object.keys(inspectionData).length > 0) {
      setIsSaving(true);
      // Add timestamp to the data
      const dataWithTimestamp = {
        ...inspectionData,
        lastUpdated: Date.now()
      };
      saveInspectionData(inspectionToken, dataWithTimestamp);
      
      // Hide saving indicator after a short delay
      setTimeout(() => {
        setIsSaving(false);
      }, 1000);
    }
  }, [inspectionData, inspectionToken]);

  // Check if VIN verification is complete
  useEffect(() => {
    const vinData = inspectionData.vinVerification;
    if (vinData && vinData.vinNumber && vinData.vinMatch) {
      setVinVerificationComplete(true);
    } else {
      setVinVerificationComplete(false);
    }
  }, [inspectionData.vinVerification]);

  // Load data from localStorage on component mount (only if no database data exists)
  useEffect(() => {
    if (inspectionToken && (!vehicleData.inspection?.sections || vehicleData.inspection.sections.length === 0)) {
      const savedData = loadInspectionData(inspectionToken);
      if (Object.keys(savedData).length > 0) {
        // Remove timestamp from loaded data
        const { ...dataWithoutTimestamp } = savedData;
        setInspectionData(dataWithoutTimestamp);
        console.log('Loaded saved inspection data for token:', inspectionToken);
        
        // Show a toast to inform user that data was restored
        toast({
          title: "Data Restored",
          description: "Your previous inspection progress has been restored.",
        });
      }
    }
  }, [inspectionToken, vehicleData.inspection?.sections, toast]);

  // Load existing inspection data from database if available (takes precedence over localStorage)
  useEffect(() => {
    const loadExistingInspectionData = async () => {
      if (inspectionToken && vehicleData.inspection?.sections && vehicleData.inspection.sections.length > 0) {
        try {
          console.log('Loading existing inspection data from database...');
          
          // Transform database data to match our local state structure
          const dbData: InspectionData = {};
          
          vehicleData.inspection.sections.forEach((section: InspectionSection) => {
            if (section && section.id) {
              dbData[section.id] = {
                completed: section.completed || false,
                rating: section.rating || 0,
                score: section.score || 0,
                maxScore: section.maxScore || 0,
                photos: section.photos || [],
                questions: {}
              };

              // Process questions
              if (section.questions && Array.isArray(section.questions)) {
                section.questions.forEach((question: InspectionQuestion) => {
                  if (question && question.id) {
                    dbData[section.id].questions![question.id] = {
                      answer: question.answer,
                      notes: question.notes,
                      photos: question.photos || [],
                      subQuestions: {}
                    };

                    // Process sub-questions
                    if (question.subQuestions && Array.isArray(question.subQuestions)) {
                      question.subQuestions.forEach((subQ: InspectionQuestion) => {
                        if (subQ && subQ.id) {
                          dbData[section.id].questions![question.id].subQuestions![subQ.id] = {
                            answer: subQ.answer,
                            notes: subQ.notes,
                            photos: subQ.photos || []
                          };
                        }
                      });
                    }
                  }
                });
              }
            }
          });

          // Add overall notes if available
          if (vehicleData.inspection.inspectionNotes) {
            dbData.overallNotes = vehicleData.inspection.inspectionNotes;
          }

          // Add VIN verification data if available
          if (vehicleData.inspection.vinVerification) {
            dbData.vinVerification = vehicleData.inspection.vinVerification;
          }

          // Only set the data if we have actual data to load
          if (Object.keys(dbData).length > 0) {
            setInspectionData(dbData);
            console.log('Loaded existing inspection data from database:', dbData);
            
            // Only auto-expand sections that are marked as completed
            const completedSections = Object.keys(dbData).filter(sectionId => 
              sectionId !== 'overallNotes' && dbData[sectionId] && dbData[sectionId].completed
            );
            
            if (completedSections.length > 0) {
              setExpandedSections(new Set());
            } else {
              // If no sections are completed, keep all sections closed
              setExpandedSections(new Set());
            }
            
            // Show a toast to inform user that data was loaded from database
            toast({
              title: "Inspection Data Loaded",
              description: "Existing inspection data has been loaded from the database.",
            });
          }
        } catch (error) {
          console.error('Error loading existing inspection data:', error);
        }
      }
    };

    loadExistingInspectionData();
  }, [inspectionToken, vehicleData.inspection, toast]);

  // Clean up old inspection data on component mount
  useEffect(() => {
    cleanupOldInspectionData();
  }, []);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      // Close all other sections and open only this one (accordion behavior)
      newExpanded.clear()
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const handleQuestionAnswer = (sectionId: string, questionId: string, answer: string | string[] | number) => {
    setInspectionData((prev) => {
      const newData = {
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          questions: {
            ...prev[sectionId]?.questions,
            [questionId]: {
              ...prev[sectionId]?.questions?.[questionId],
              answer
            }
          }
        }
      };

      // Clear sub-questions if parent question is cleared or changed to a value that doesn't trigger sub-questions
      const question = inspectionSections
        .find(s => s.id === sectionId)
        ?.questions.find(q => q.id === questionId);
      
      if (question?.subQuestions) {
        let shouldClearSubQuestions = false;
        
        // Check if answer should trigger sub-questions based on question type
        if (question.type === 'yesno') {
          // For yes/no questions, only show sub-questions if answer is "yes"
          shouldClearSubQuestions = answer !== "yes";
        } else if (question.type === 'radio') {
          // For radio questions, check if the selected option should trigger sub-questions
          // This would need to be defined in the question configuration
          // For now, we'll clear if answer is empty or doesn't match expected values
          shouldClearSubQuestions = !answer || answer === "";
        } else if (question.type === 'checkbox') {
          // For checkbox questions, clear if no options are selected
          shouldClearSubQuestions = !Array.isArray(answer) || answer.length === 0;
        } else {
          // For other types, clear if answer is empty
          shouldClearSubQuestions = !answer || answer === "" || (Array.isArray(answer) && answer.length === 0);
        }
        
        if (shouldClearSubQuestions) {
          // Clear sub-questions if parent question doesn't trigger them
          if (newData[sectionId]?.questions?.[questionId]?.subQuestions) {
            delete newData[sectionId].questions[questionId].subQuestions;
          }
        }
      }

      return newData;
    });
  };

  const handleSubQuestionAnswer = (sectionId: string, questionId: string, subQuestionId: string, answer: string | string[] | number) => {
    setInspectionData((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        questions: {
          ...prev[sectionId]?.questions,
          [questionId]: {
            ...prev[sectionId]?.questions?.[questionId],
            subQuestions: {
              ...prev[sectionId]?.questions?.[questionId]?.subQuestions,
              [subQuestionId]: {
                ...prev[sectionId]?.questions?.[questionId]?.subQuestions?.[subQuestionId],
                answer
              }
            }
          }
        }
      }
    }))
  }

  const handlePhotoUpload = async (sectionId: string, questionId: string, file: File) => {
    try {
      toast({
        title: "Uploading Photo",
        description: `Uploading ${file.name}...`,
      });

      const uploadResponse = await api.uploadDocument(file);
      
      if (!uploadResponse?.data?.path) {
        throw new Error('Upload failed - No file path returned');
      }

      const filePath = uploadResponse.data.path;

      setInspectionData((prev) => ({
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          questions: {
            ...prev[sectionId]?.questions,
            [questionId]: {
              ...prev[sectionId]?.questions?.[questionId],
              photos: [
                ...(prev[sectionId]?.questions?.[questionId]?.photos || []),
                {
                  path: filePath,
                  originalName: file.name,
                  uploadedAt: new Date()
                }
              ]
            }
          }
        }
      }));

      toast({
        title: "Photo Uploaded",
        description: `Photo ${file.name} added successfully`,
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePhotoRemove = (sectionId: string, questionId: string, photoIndex: number) => {
    try {
      setInspectionData((prev) => {
        // Get the existing photos array
        const existingPhotos = prev[sectionId]?.questions?.[questionId]?.photos || [];
        
        // Create a new array without the photo at the specified index
        const updatedPhotos = [
          ...existingPhotos.slice(0, photoIndex),
          ...existingPhotos.slice(photoIndex + 1)
        ];
        
        // Return the updated state
        return {
          ...prev,
          [sectionId]: {
            ...prev[sectionId],
            questions: {
              ...prev[sectionId]?.questions,
              [questionId]: {
                ...prev[sectionId]?.questions?.[questionId],
                photos: updatedPhotos
              }
            }
          }
        };
      });
      
      toast({
        title: "Photo Removed",
        description: "Photo has been removed successfully"
      });
    } catch (error) {
      console.error('Error removing photo:', error);
      toast({
        title: "Remove Failed",
        description: "Failed to remove photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVinVerification = (field: 'vinNumber' | 'vinMatch', value: string) => {
    setInspectionData((prev) => ({
      ...prev,
      vinVerification: {
        ...prev.vinVerification,
        [field]: value
      }
    }));
  };

  // Check if VINs match automatically
  const checkVinMatch = () => {
    const enteredVin = inspectionData.vinVerification?.vinNumber;
    const originalVin = vehicleData.vehicle?.vin;
    
    if (enteredVin && originalVin) {
      const normalizedEnteredVin = enteredVin.replace(/[^A-Z0-9]/g, '').toUpperCase();
      const normalizedOriginalVin = originalVin.replace(/[^A-Z0-9]/g, '').toUpperCase();
      
      return normalizedEnteredVin === normalizedOriginalVin;
    }
    return null; // No comparison possible
  };

  const vinMatchStatus = checkVinMatch();

  // Auto-suggest VIN match based on comparison
  useEffect(() => {
    if (vinMatchStatus !== null && !inspectionData.vinVerification?.vinMatch) {
      const suggestedMatch = vinMatchStatus ? 'yes' : 'no';
      handleVinVerification('vinMatch', suggestedMatch);
    }
  }, [vinMatchStatus, inspectionData.vinVerification?.vinMatch]);

  const generateRecommendations = () => {
    const recommendations: string[] = [];
    
    inspectionSections.forEach((section) => {
      const rating = calculateSectionRating(section.id);
      if (rating <= 2) {
        recommendations.push(`Address issues in ${section.name.toLowerCase()}`);
      }
    });
    
    return recommendations;
  };

  // Check if form is complete
  const isFormComplete = () => {
    // Check VIN verification
    const vinData = inspectionData.vinVerification;
    if (!vinData?.vinNumber || !vinData?.vinMatch || vinData.vinMatch === 'no') {
      return false;
    }

    // Check required questions
    for (const section of inspectionSections) {
      for (const question of section.questions) {
        if (question.required) {
          const answer = inspectionData[section.id]?.questions?.[question.id]?.answer;
          if (!answer || (Array.isArray(answer) && answer.length === 0)) {
            return false;
          }
        }
      }
    }

    return true;
  };

  // Handle save and close
  const handleSaveAndClose = async () => {
    setIsSavingPending(true);
    
    try {
      // Format inspection data for pending save
      const formattedData = {
        sections: inspectionSections.map((section) => ({
          id: section.id,
          name: section.name,
          description: section.description,
          icon: section.icon.name || section.icon.displayName || 'Icon',
          questions: section.questions.map((question) => ({
            id: question.id,
            question: question.question,
            type: question.type as 'radio' | 'checkbox' | 'text' | 'rating' | 'photo' | 'yesno' | 'number',
            options: question.options,
            required: question.required,
            answer: inspectionData[section.id]?.questions?.[question.id]?.answer,
            notes: inspectionData[section.id]?.questions?.[question.id]?.notes,
            photos: inspectionData[section.id]?.questions?.[question.id]?.photos || [],
            subQuestions: question.subQuestions?.map((subQ: InspectionQuestion) => ({
              id: subQ.id,
              question: subQ.question,
              type: subQ.type as 'radio' | 'checkbox' | 'text' | 'rating' | 'photo' | 'yesno' | 'number',
              options: subQ.options,
              answer: inspectionData[section.id]?.questions?.[question.id]?.subQuestions?.[subQ.id]?.answer,
              notes: inspectionData[section.id]?.questions?.[question.id]?.subQuestions?.[subQ.id]?.notes,
              photos: inspectionData[section.id]?.questions?.[question.id]?.subQuestions?.[subQ.id]?.photos || []
            })) || []
          })),
          rating: calculateSectionRating(section.id),
          photos: inspectionData[section.id]?.photos || [],
          score: calculateSectionScore(section.id),
          maxScore: calculateSectionMaxScore(section),
          completed: inspectionData[section.id]?.completed || false
        })),
        overallRating: calculateOverallRating(),
        overallScore: calculateOverallScore(),
        maxPossibleScore: calculateMaxPossibleScore(),
        status: "in-progress" as const,
        completed: false,
        inspectionNotes: inspectionData.overallNotes || "",
        recommendations: generateRecommendations(),
        vinVerification: inspectionData.vinVerification ? {
          vinNumber: inspectionData.vinVerification.vinNumber || '',
          vinMatch: (inspectionData.vinVerification.vinMatch as 'yes' | 'no' | 'not_verified') || 'not_verified'
        } : undefined,
      };

      if (vehicleData.inspection?.accessToken) {
        const response = await api.savePendingInspection(vehicleData.inspection.accessToken, formattedData);
        
        if (response.success) {
          toast({
            title: "Inspection Saved",
            description: "Your progress has been saved. You can return to complete the inspection later.",
          });
          
          // Clear localStorage after successful save
          if (inspectionToken) {
            clearInspectionData(inspectionToken);
          }
          
          setTimeout(() => {
            window.location.href = "/inspector/dashboard";
          }, 2000);
        } else {
          throw new Error(response.error || 'Failed to save inspection');
        }
      }
    } catch (error) {
      console.error("Error saving pending inspection:", error);
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : 'An unexpected error occurred';
        
      toast({
        title: "Error",
        description: `Failed to save inspection: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSavingPending(false);
    }
  };

  // Handle reset form
  const handleResetForm = () => {
    setInspectionData({});
    if (inspectionToken) {
      clearInspectionData(inspectionToken);
    }
    toast({
      title: "Form Reset",
      description: "All form data has been cleared.",
    });
  };

  const handleSubmitInspection = async () => {
    // Check if form is complete
    if (!isFormComplete()) {
      toast({
        title: "Incomplete Form",
        description: "Please complete all required fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Format inspection data for submission
      const formattedData = {
        sections: inspectionSections.map((section) => ({
          id: section.id,
          name: section.name,
          description: section.description,
          icon: section.icon.name || section.icon.displayName || 'Icon', // Convert React component to string
          questions: section.questions.map((question) => ({
            id: question.id,
            question: question.question,
            type: question.type as 'radio' | 'checkbox' | 'text' | 'rating' | 'photo' | 'yesno' | 'number',
            options: question.options,
            required: question.required,
            answer: inspectionData[section.id]?.questions?.[question.id]?.answer,
            notes: inspectionData[section.id]?.questions?.[question.id]?.notes,
            photos: inspectionData[section.id]?.questions?.[question.id]?.photos || [],
            subQuestions: question.subQuestions?.map((subQ: InspectionQuestion) => ({
              id: subQ.id,
              question: subQ.question,
              type: subQ.type as 'radio' | 'checkbox' | 'text' | 'rating' | 'photo' | 'yesno' | 'number',
              options: subQ.options,
              answer: inspectionData[section.id]?.questions?.[question.id]?.subQuestions?.[subQ.id]?.answer,
              notes: inspectionData[section.id]?.questions?.[question.id]?.subQuestions?.[subQ.id]?.notes,
              photos: inspectionData[section.id]?.questions?.[question.id]?.subQuestions?.[subQ.id]?.photos || []
            })) || []
          })),
          rating: calculateSectionRating(section.id),
          photos: inspectionData[section.id]?.photos || [],
          score: calculateSectionScore(section.id),
          maxScore: calculateSectionMaxScore(section),
          completed: true
        })),
        overallRating: calculateOverallRating(),
        overallScore: calculateOverallScore(),
        maxPossibleScore: calculateMaxPossibleScore(),
        status: "completed" as const,
        completed: true,
        completedAt: new Date(),
        inspectionNotes: inspectionData.overallNotes || "",
        recommendations: generateRecommendations(),
        vinVerification: inspectionData.vinVerification ? {
          vinNumber: inspectionData.vinVerification.vinNumber || '',
          vinMatch: (inspectionData.vinVerification.vinMatch as 'yes' | 'no' | 'not_verified') || 'not_verified'
        } : undefined,
      };

      if (onSubmit) {
        onSubmit(formattedData);
        // Clear localStorage after successful submission
        if (inspectionToken) {
          clearInspectionData(inspectionToken);
        }
      } else if (vehicleData.inspection?.accessToken) {
        console.log('Submitting inspection with data:', {
          sectionsCount: formattedData.sections.length,
          overallRating: formattedData.overallRating,
        });
        
        const response = await api.submitInspection(vehicleData.inspection.accessToken, formattedData);
        
        console.log('Inspection submission response:', response);
        
        if (response.success) {
          // Clear localStorage after successful submission
          if (inspectionToken) {
            clearInspectionData(inspectionToken);
          }
          
          toast({
            title: "Inspection Submitted",
            description: "Vehicle inspection has been completed successfully.",
          });
          
          setIsSubmitted(true);
          
          setTimeout(() => {
            window.location.href = "/inspector/dashboard";
          }, 2000);
        } else {
          throw new Error(response.error || 'Failed to submit inspection');
        }
      }
    } catch (error) {
      console.error("Error submitting inspection:", error);
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : 'An unexpected error occurred';
        
      toast({
        title: "Error",
        description: `Failed to submit inspection: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateSectionRating = (sectionId: string) => {
    const section = inspectionSections.find(s => s.id === sectionId);
    if (!section) return 0;
    
    const totalPoints = section.questions.reduce((total: number, question) => {
      const answer = inspectionData[sectionId]?.questions?.[question.id]?.answer;
      if (!answer) return total;
      
      if (question.type === 'radio' && question.options) {
        const option = question.options.find((opt) => opt.value === answer);
        return total + (option?.points || 0);
      } else if (question.type === 'checkbox' && Array.isArray(answer)) {
        return total + answer.reduce((sum: number, val: string) => {
          const option = question.options?.find((opt) => opt.value === val);
          return sum + (option?.points || 0);
        }, 0);
      } else if (question.type === 'rating') {
        return total + (answer as number || 0);
      }
      
      return total;
    }, 0);
    
    const maxPoints = calculateSectionMaxScore(section);
    if (maxPoints === 0) return 0;
    
    return Math.round((totalPoints / maxPoints) * 5);
  };

  const calculateSectionScore = (sectionId: string) => {
    const section = inspectionSections.find(s => s.id === sectionId);
    if (!section) return 0;
    
    return section.questions.reduce((total: number, question) => {
      const answer = inspectionData[sectionId]?.questions?.[question.id]?.answer;
      if (!answer) return total;
      
      if (question.type === 'radio' && question.options) {
        const option = question.options.find((opt) => opt.value === answer);
        return total + (option?.points || 0);
      } else if (question.type === 'checkbox' && Array.isArray(answer)) {
        return total + answer.reduce((sum: number, val: string) => {
          const option = question.options?.find((opt) => opt.value === val);
          return sum + (option?.points || 0);
        }, 0);
      } else if (question.type === 'rating') {
        return total + (answer as number || 0);
      }
      
      return total;
    }, 0);
  };

  const calculateSectionMaxScore = (section: typeof inspectionSections[0]) => {
    return section.questions.reduce((total: number, question) => {
      if (question.type === 'radio' && question.options) {
        const maxPoints = Math.max(...question.options.map((opt) => opt.points || 0));
        return total + maxPoints;
      } else if (question.type === 'checkbox' && question.options) {
        const positivePoints = question.options
          .filter((opt) => (opt.points || 0) > 0)
          .reduce((sum: number, opt) => sum + (opt.points || 0), 0);
        return total + positivePoints;
      } else if (question.type === 'rating') {
        return total + 5;
      }
      return total;
    }, 0);
  };

  const calculateOverallRating = () => {
    const sectionRatings = inspectionSections.map((section) => calculateSectionRating(section.id));
    const validRatings = sectionRatings.filter((rating: number) => rating > 0);
    if (validRatings.length === 0) return 0;
    
    return Math.round(validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length);
  };

  const calculateOverallScore = () => {
    return inspectionSections.reduce((total, section) => {
      return total + calculateSectionScore(section.id);
    }, 0);
  };

  const calculateMaxPossibleScore = () => {
    return inspectionSections.reduce((total, section) => {
      return total + calculateSectionMaxScore(section);
    }, 0);
  };

  const renderQuestion = (sectionId: string, question: typeof inspectionSections[0]['questions'][0]) => {
    const currentAnswer = inspectionData[sectionId]?.questions?.[question.id]?.answer;
    const currentNotes = inspectionData[sectionId]?.questions?.[question.id]?.notes;
    const currentPhotos = inspectionData[sectionId]?.questions?.[question.id]?.photos || [];

    return (
      <div 
        key={question.id} 
        className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6 ${
          question.type === 'photo' ? 'col-span-1 lg:col-span-2' : ''
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Label className="text-base font-semibold text-gray-900 flex items-center gap-2">
              {question.question}
              {question.required && <span className="text-red-500 text-lg">*</span>}
            </Label>
            
            {/* Special help guide for frame condition question */}
            {question.id === "frame_condition" && (
              <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">Key Areas to Check</h4>
                    <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
                      <li>Front and rear sub-frames and crossmembers</li>
                      <li>Inner rocker panels and floor-pan seams</li>
                      <li>Suspension mounting points and weld joints</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">What to Look For</h4>
                    <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
                      <li>Surface rust – light orange or brown film that flakes off with a fingernail</li>
                      <li>Pitting or scaling – deeper rust that leaves rough indentations</li>
                      <li>Structural damage – cracks, bends, holes, or missing metal</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">Rate It</h4>
                    <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
                      <li><span className="font-medium">Excellent</span> – original paint, no rust or dents</li>
                      <li><span className="font-medium">Good</span> – minor surface rust, no pitting</li>
                      <li><span className="font-medium">Fair</span> – scattered pitting or small dents, no structural compromise</li>
                      <li><span className="font-medium">Poor</span> – significant rust, scaling, or visible holes; frame still intact</li>
                      <li><span className="font-medium">Very Poor</span> – cracks, severe bends, or missing sections that weaken integrity</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Special help guide for modified suspension question */}
            {question.id === "modified_suspension" && (
              <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">How to spot a suspension modification</h4>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-green-700 mb-2">Visual clues</h5>
                    <ul className="list-disc pl-5 text-sm text-green-700 space-y-1">
                      <li>Non-OEM coilovers or brightly colored springs (often red, yellow, blue)</li>
                      <li>Lift blocks, spacers, or aftermarket strut assemblies</li>
                      <li>Air-bag tanks, compressors, or air lines near wheel wells</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-green-700 mb-2">Ride height check</h5>
                    <ul className="list-disc pl-5 text-sm text-green-700 space-y-1">
                      <li>Compare front and rear wheel-arch gaps—uneven gaps can signal a lift or drop</li>
                      <li>Measure ground clearance if stock specs are known</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-green-700 mb-2">Component branding</h5>
                    <ul className="list-disc pl-5 text-sm text-green-700 space-y-1">
                      <li>Look for logos (Bilstein, Eibach, Rough Country, etc.) on shocks, control arms, or sway bars</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-green-700 mb-2">Welds or hardware changes</h5>
                    <ul className="list-disc pl-5 text-sm text-green-700 space-y-1">
                      <li>Fresh weld marks, aftermarket brackets, or oversized bolts usually indicate prior alterations</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Special help guide for undercarriage photos */}
            {question.id === "undercarriage_photos" && (
              <div className="mt-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-orange-800 mb-2">Photo Guidelines for Undercarriage Inspection</h4>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-orange-700 mb-2">Wide View – Front-to-Back</h5>
                    <ul className="list-disc pl-5 text-sm text-orange-700 space-y-1">
                      <li>Position yourself under the center of the vehicle</li>
                      <li>Capture the full length of the frame rails, crossmembers, and drivetrain in one shot</li>
                      <li>Ensure good lighting—use a work light or flash to avoid dark areas</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-orange-700 mb-2">Driver-Side Frame Rail</h5>
                    <ul className="list-disc pl-5 text-sm text-orange-700 space-y-1">
                      <li>Move to the driver&apos;s side and take a close, angled shot of the frame rail and floor-pan seam</li>
                      <li>Include any visible rust, dents, or weld points</li>
                      <li>Keep the camera level so details are clear for review</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-orange-700 mb-2">Passenger-Side Frame Rail</h5>
                    <ul className="list-disc pl-5 text-sm text-orange-700 space-y-1">
                      <li>Mirror the previous shot on the passenger&apos;s side</li>
                      <li>Focus on suspension mounts and crossmember junctions</li>
                      <li>Step back just enough to fit the entire rail section in frame</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Question Input */}
        <div className="space-y-4">
          {question.type === 'radio' && question.options && (
            <RadioGroup 
              value={currentAnswer as string || ""} 
              onValueChange={(value) => handleQuestionAnswer(sectionId, question.id, value)}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {question.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                  <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                  <Label htmlFor={`${question.id}-${option.value}`} className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                    {option.label}
                  </Label>
                  {option.points && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      option.points > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {option.points > 0 ? '+' : ''}{option.points} pts
                    </span>
                  )}
                </div>
              ))}
            </RadioGroup>
          )}

          {question.type === 'checkbox' && question.options && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {question.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200">
                  <Checkbox
                    id={`${question.id}-${option.value}`}
                    checked={Array.isArray(currentAnswer) && currentAnswer.includes(option.value)}
                    onCheckedChange={(checked) => {
                      const currentArray = Array.isArray(currentAnswer) ? currentAnswer : [];
                      const newArray = checked
                        ? [...currentArray, option.value]
                        : currentArray.filter((item: string) => item !== option.value);
                      handleQuestionAnswer(sectionId, question.id, newArray);
                    }}
                  />
                  <Label htmlFor={`${question.id}-${option.value}`} className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                    {option.label}
                  </Label>
                  {option.points && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      option.points > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {option.points > 0 ? '+' : ''}{option.points} pts
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {question.type === 'yesno' && (
            <RadioGroup 
              value={currentAnswer as string || ""} 
              onValueChange={(value) => handleQuestionAnswer(sectionId, question.id, value)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md"
            >
              <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200">
                <RadioGroupItem value="yes" id={`${question.id}-yes`} />
                <Label htmlFor={`${question.id}-yes`} className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                  Yes
                </Label>
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all duration-200">
                <RadioGroupItem value="no" id={`${question.id}-no`} />
                <Label htmlFor={`${question.id}-no`} className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                  No
                </Label>
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              </div>
            </RadioGroup>
          )}

          {question.type === 'rating' && (
            <div className="flex flex-col space-y-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleQuestionAnswer(sectionId, question.id, star)}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        star <= (currentAnswer as number || 0) 
                          ? "text-yellow-500 bg-yellow-100 hover:bg-yellow-200" 
                          : "text-gray-300 hover:text-yellow-400 hover:bg-yellow-50"
                      }`}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                </div>
                <span className="text-lg font-semibold text-gray-700 bg-white px-3 py-1 rounded-full border">
                  {currentAnswer as number || 0}/5
                </span>
              </div>
              
              {/* Special case for interior cleanliness rating descriptions */}
              {question.id === "interior_cleanliness" && (
                <div className="mt-2 space-y-2">
                  <div className={`p-2 rounded-lg border ${(currentAnswer as number) === 1 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-sm ${(currentAnswer as number) === 1 ? 'font-medium text-red-700' : 'text-gray-500'}`}>
                      <span className="font-semibold">1/5 – Very Dirty:</span> Interior is heavily soiled, with trash, stains, strong odors, or damage to seats or surfaces.
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg border ${(currentAnswer as number) === 2 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-sm ${(currentAnswer as number) === 2 ? 'font-medium text-orange-700' : 'text-gray-500'}`}>
                      <span className="font-semibold">2/5 – Dirty:</span> Noticeable mess, surface stains, or debris throughout; requires significant cleaning.
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg border ${(currentAnswer as number) === 3 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-sm ${(currentAnswer as number) === 3 ? 'font-medium text-yellow-700' : 'text-gray-500'}`}>
                      <span className="font-semibold">3/5 – Fair:</span> Moderately clean but may have minor stains, dust, or clutter; average wear.
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg border ${(currentAnswer as number) === 4 ? 'bg-lime-50 border-lime-200' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-sm ${(currentAnswer as number) === 4 ? 'font-medium text-lime-700' : 'text-gray-500'}`}>
                      <span className="font-semibold">4/5 – Clean:</span> Overall clean with light signs of use; minimal dust or smudges.
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg border ${(currentAnswer as number) === 5 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-sm ${(currentAnswer as number) === 5 ? 'font-medium text-green-700' : 'text-gray-500'}`}>
                      <span className="font-semibold">5/5 – Very Clean:</span> Spotless interior with no visible dirt, stains, or odors; showroom condition.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {question.type === 'number' && (
            <div className="max-w-xs">
              <Input
                type="number"
                value={currentAnswer as string || ""}
                onChange={(e) => handleQuestionAnswer(sectionId, question.id, e.target.value)}
                placeholder="Enter value"
                className="text-lg font-mono border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3"
              />
            </div>
          )}

          {question.type === 'text' && (
            <Textarea
              value={currentAnswer as string || ""}
              onChange={(e) => handleQuestionAnswer(sectionId, question.id, e.target.value)}
              placeholder="Enter details..."
              rows={4}
              className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg resize-none"
            />
          )}

          {question.type === 'photo' && (
            <div className="space-y-4">
              {/* Multiple photo boxes for different angles */}
              <div className="flex flex-nowrap overflow-x-auto gap-4 pb-4">
                {getAnglesBySection(sectionId).map(angle => {
                  // Find if we already have a photo for this angle
                  const anglePhotoIndex = currentPhotos.findIndex(
                    photo => photo.originalName.includes(`[${angle.id}]`)
                  );
                  const hasPhoto = anglePhotoIndex > -1;
                  
                  return (
                    <div 
                      key={angle.id} 
                      className="flex-shrink-0 w-32 md:w-40 lg:w-48"
                    >
                      {hasPhoto ? (
                        <div 
                          className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-blue-400 group cursor-pointer"
                          onClick={() => setModalImage(`${process.env.NEXT_PUBLIC_API_URL}${currentPhotos[anglePhotoIndex].path}`)}
                        >
                          <Image
                            src={`${process.env.NEXT_PUBLIC_API_URL}${currentPhotos[anglePhotoIndex].path}`}
                            alt={angle.label}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            width={100}
                            height={100}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-white text-xs truncate font-medium">
                              {angle.label}
                            </p>
                          </div>
                          <button 
                            className="absolute top-2 right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation(); // Prevent triggering the parent onClick
                              // Remove this photo logic would go here
                              // For now, we're just showing the UI
                              handlePhotoRemove(sectionId, question.id, anglePhotoIndex);
                            }}
                          >
                            <XCircle className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-blue-300 transition-all duration-200">
                          <label 
                            htmlFor={`upload-${sectionId}-${question.id}-${angle.id}`} 
                            className="flex flex-col items-center justify-center cursor-pointer aspect-video p-2"
                          >
                            <div className="text-gray-500 text-xs font-medium text-center">
                              <Camera className="h-5 w-5 mx-auto mb-1" />
                              {angle.label}
                            </div>
                            <input
                              id={`upload-${sectionId}-${question.id}-${angle.id}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Rename the file to include the angle ID for identification
                                  const renamedFile = new File(
                                    [file], 
                                    `[${angle.id}]_${file.name}`, 
                                    { type: file.type }
                                  );
                                  handlePhotoUpload(sectionId, question.id, renamedFile);
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sub-Questions - Only show if parent question is answered appropriately */}
        {question.subQuestions && question.subQuestions.length > 0 && (() => {
          // Check if sub-questions should be shown based on parent question type and answer
          if (question.type === 'yesno') {
            return currentAnswer === "no";
          } else if (question.type === 'radio') {
            // Special handling for seat_adjustment question - only show subquestions when "no" is selected
            if (question.id === "seat_adjustment") {
              return currentAnswer === "no";
            }
            // Default behavior for other radio questions
            return currentAnswer && currentAnswer !== "";
          } else if (question.type === 'checkbox') {
            return Array.isArray(currentAnswer) && currentAnswer.length > 0;
          } else {
            return currentAnswer && currentAnswer !== "" && !(Array.isArray(currentAnswer) && currentAnswer.length === 0);
          }
        })() && (
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border-l-4 border-blue-400">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm font-semibold text-blue-800 uppercase tracking-wide">Follow-up Questions</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.subQuestions.map((subQ: { id: string; question: string; type: string; options?:  { value: string; label: string; points?: number }[] }, subIndex: number) => (
                <div key={subIndex} className={`bg-white rounded-lg p-4 border border-gray-200 shadow-sm ${question.subQuestions!.length === 1 ? 'md:col-span-2' : ''}`}>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    {subQ.question}
                  </Label>
                  
                  {subQ.type === 'text' && (
                    <Textarea
                      value={inspectionData[sectionId]?.questions?.[question.id]?.subQuestions?.[subQ.id]?.answer as string || ""}
                      onChange={(e) => handleSubQuestionAnswer(sectionId, question.id, subQ.id, e.target.value)}
                      placeholder="Enter details..."
                      rows={3}
                      className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg resize-none"
                    />
                  )}
                  
                  {subQ.type === 'number' && (
                    <Input
                      type="number"
                      value={inspectionData[sectionId]?.questions?.[question.id]?.subQuestions?.[subQ.id]?.answer as string || ""}
                      onChange={(e) => handleSubQuestionAnswer(sectionId, question.id, subQ.id, e.target.value)}
                      placeholder="Enter value"
                      className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg font-mono"
                    />
                  )}

                  {subQ.type === 'radio' && 'options' in subQ && subQ.options && (
                    <RadioGroup 
                      value={inspectionData[sectionId]?.questions?.[question.id]?.subQuestions?.[subQ.id]?.answer as string || ""} 
                      onValueChange={(value) => handleSubQuestionAnswer(sectionId, question.id, subQ.id, value)}
                      className="space-y-2"
                    >
                      {subQ.options.map((option) => (
                        <div key={option.value} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <RadioGroupItem value={option.value} id={`${subQ.id}-${option.value}`} />
                          <Label htmlFor={`${subQ.id}-${option.value}`} className="text-sm text-gray-700 cursor-pointer flex-1">
                            {option.label}
                          </Label>
                          {option.points && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              option.points > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {option.points > 0 ? '+' : ''}{option.points} pts
                            </span>
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {subQ.type === 'checkbox' && 'options' in subQ && subQ.options && (
                    <div className="space-y-2">
                      {subQ.options.map((option: { value: string; label: string; points?: number }) => (
                        <div key={option.value} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <Checkbox
                            id={`${subQ.id}-${option.value}`}
                            checked={Array.isArray(inspectionData[sectionId]?.questions?.[question.id]?.subQuestions?.[subQ.id]?.answer) && 
                                     (inspectionData[sectionId]?.questions?.[question.id]?.subQuestions?.[subQ.id]?.answer as string[])?.includes(option.value)}
                            onCheckedChange={(checked) => {
                              const currentAnswer = inspectionData[sectionId]?.questions?.[question.id]?.subQuestions?.[subQ.id]?.answer;
                              const currentArray = Array.isArray(currentAnswer) ? currentAnswer : [];
                              const newArray = checked
                                ? [...currentArray, option.value]
                                : currentArray.filter((item: string) => item !== option.value);
                              handleSubQuestionAnswer(sectionId, question.id, subQ.id, newArray);
                            }}
                          />
                          <Label htmlFor={`${subQ.id}-${option.value}`} className="text-sm text-gray-700 cursor-pointer flex-1">
                            {option.label}
                          </Label>
                          {option.points && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              option.points > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {option.points > 0 ? '+' : ''}{option.points} pts
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes - Keep notes for non-photo questions */}
        {question.type !== 'photo' && (
          <div className="mt-6">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Additional Notes</Label>
            <Textarea
              value={currentNotes || ""}
              onChange={(e) => setInspectionData(prev => ({
                ...prev,
                [sectionId]: {
                  ...prev[sectionId],
                  questions: {
                    ...prev[sectionId]?.questions,
                    [question.id]: {
                      ...prev[sectionId]?.questions?.[question.id],
                      notes: e.target.value
                    }
                  }
                }
              }))}
              placeholder="Add any additional notes or observations..."
              rows={3}
              className="border-2 border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 rounded-lg resize-none"
            />
          </div>
        )}
      </div>
    );
  };

  // Handle marking section as complete with localStorage persistence
  const handleMarkSectionComplete = (sectionId: string) => {
    setInspectionData((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        completed: true
      }
    }));
    
    // Collapse the section after marking as complete
    const newExpanded = new Set(expandedSections);
    newExpanded.delete(sectionId);
    setExpandedSections(newExpanded);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Inspection Submitted!</h2>
            <p className="text-gray-600 mb-4">
              Thank you for completing the comprehensive vehicle inspection. The results have been sent to the front desk team.
            </p>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                Overall Rating: <span className="font-bold">{calculateOverallRating()}/5</span>
              </p>
              <p className="text-sm text-green-800">
                Score: <span className="font-bold">{calculateOverallScore()}/{calculateMaxPossibleScore()}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Dashboard</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {vehicleData.customer?.firstName} {vehicleData.customer?.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {vehicleData.vehicle?.year} {vehicleData.vehicle?.make} {vehicleData.vehicle?.model}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              {/* Auto-save indicator */}
              {isSaving && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  <span>Saving...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* VIN Verification Section */}
        <Card className="mb-8 border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <CarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-blue-800">VIN Number Verification</h2>
                <p className="text-blue-600 text-sm">Required before inspection can proceed</p>
              </div>
              {vinVerificationComplete && (
                <div className="ml-auto flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Verified</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* VIN Input */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-800">
                  VIN Number from Vehicle
                </Label>
                <Input
                  placeholder="Enter VIN number from windshield/dashboard"
                  value={inspectionData.vinVerification?.vinNumber || ''}
                  onChange={(e) => handleVinVerification('vinNumber', e.target.value.toUpperCase())}
                  className={`border-2 focus:ring-2 ${
                    vinMatchStatus === true 
                      ? 'border-green-500 focus:border-green-500 focus:ring-green-200' 
                      : vinMatchStatus === false 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                      : 'border-blue-300 focus:border-blue-500 focus:ring-blue-200'
                  }`}
                  maxLength={17}
                />
                {vehicleData.vehicle?.vin && (
                  <div className="space-y-1">
                    <p className="text-xs text-blue-600">
                      Original VIN: {vehicleData.vehicle.vin}
                    </p>
                    {vinMatchStatus !== null && (
                      <div className={`flex items-center gap-2 text-xs ${
                        vinMatchStatus ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {vinMatchStatus ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            <span>VINs match automatically</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            <span>VINs do not match - please verify manually</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* VIN Matching Question */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-blue-800">
                  Do the VIN numbers match?
                </Label>
                <p className="text-xs text-blue-600 mb-3">
                  Inspect and compare the VIN from the windshield/dashboard with the VIN on the driver-side door frame or label.
                  {vinMatchStatus !== null && (
                    <span className="block mt-1 font-medium">
                      💡 Tip: The system automatically compares the entered VIN with the original VIN from the case data.
                    </span>
                  )}
                </p>
                
                <RadioGroup 
                  value={inspectionData.vinVerification?.vinMatch || ""} 
                  onValueChange={(value) => handleVinVerification('vinMatch', value)}
                  className="space-y-3"
                >
                  <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all duration-200 ${
                    vinMatchStatus === true 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-green-200 hover:border-green-300 hover:bg-green-50'
                  }`}>
                    <RadioGroupItem value="yes" id="vin-match-yes" />
                    <Label htmlFor="vin-match-yes" className="text-sm font-medium text-green-800 cursor-pointer flex-1">
                      ✅ Yes – VINs match
                    </Label>
                    {vinMatchStatus === true && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Auto-detected</span>
                      </div>
                    )}
                  </div>
                  <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all duration-200 ${
                    vinMatchStatus === false 
                      ? 'border-red-400 bg-red-50' 
                      : 'border-red-200 hover:border-red-300 hover:bg-red-50'
                  }`}>
                    <RadioGroupItem value="no" id="vin-match-no" />
                    <Label htmlFor="vin-match-no" className="text-sm font-medium text-red-800 cursor-pointer flex-1">
                      ❌ No – VINs do not match
                    </Label>
                    {vinMatchStatus === false && (
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <XCircle className="h-3 w-3" />
                        <span>Auto-detected</span>
                      </div>
                    )}
                  </div>
                </RadioGroup>

                {/* Warning for non-matching VINs */}
                {inspectionData.vinVerification?.vinMatch === 'no' && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-red-800 mb-1">🚫 Inspection Cannot Proceed</h4>
                        <p className="text-sm text-red-700">
                          The VIN numbers do not match, which may indicate tampering or a stolen vehicle. 
                          Please flag this vehicle for further review.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes for Inspector */}
        {vehicleData.inspection?.notesForInspector && (
          <Card className="mb-8 border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <ClipboardList className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-yellow-800">Notes for Inspector</h2>
                  <p className="text-yellow-600 text-sm">Special instructions from the front desk</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800 whitespace-pre-wrap">
                  {vehicleData.inspection.notesForInspector}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inspection Due By */}
        {vehicleData.inspection?.dueByDate && (
          <Card className="mb-8 border-2 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <Clock className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-800">Inspection Due By</h2>
                  <p className="text-red-600 text-sm">Please complete by the deadline</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <p className="text-lg font-semibold text-red-800">
                  {new Date(vehicleData.inspection.dueByDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  {vehicleData.inspection.dueByTime && ` at ${vehicleData.inspection.dueByTime}`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overall Rating and Score Display */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 ${
                        star <= calculateOverallRating()
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600">Overall Rating</p>
                <p className="text-2xl font-bold text-gray-900">{calculateOverallRating()}/5</p>
              </div>
              
              <div className="hidden sm:block w-px h-16 bg-gray-200"></div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {calculateOverallScore()}
                </div>
                <p className="text-sm text-gray-600">Current Score</p>
                <p className="text-lg font-semibold text-gray-900">
                  / {calculateMaxPossibleScore()} points
                </p>
              </div>
              
            </div>
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Vehicle Inspection</h1>
              <p className="text-gray-600">
                Complete the comprehensive inspection for {vehicleData.vehicle?.year} {vehicleData.vehicle?.make} {vehicleData.vehicle?.model}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Current Mileage</p>
                <p className="text-lg font-semibold text-gray-900">
                  {vehicleData.vehicle?.currentMileage?.toLocaleString()} miles
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Inspection Progress</span>
            <span className="text-sm text-gray-500">
              {inspectionSections.filter(section => 
                inspectionData[section.id]?.completed
              ).length} of {inspectionSections.length} sections completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
              style={{ 
                width: `${(inspectionSections.filter(section => 
                  inspectionData[section.id]?.completed
                ).length / inspectionSections.length) * 100}%` 
              }}
            ></div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {inspectionSections.map((section) => (
            <div key={section.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Section Header */}
              <div 
                className="p-6 cursor-pointer transition-all duration-200 hover:bg-gray-50"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                      {React.createElement(section.icon, { className: "h-6 w-6" })}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{section.name}</h3>
                      <p className="text-gray-600 text-sm">{section.description}</p>
                    </div>
                 
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Section Status */}
                    <div className="text-right">
                      {inspectionData[section.id]?.completed ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-sm font-medium text-green-700">Completed</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-5 w-5 text-yellow-500" />
                          <span className="text-sm font-medium text-yellow-700">Pending</span>
                        </div>
                      )}
                      
                      {inspectionData[section.id]?.rating && (
                        <div className="flex items-center space-x-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= (inspectionData[section.id]?.rating || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-xs text-gray-500 ml-1">
                            {inspectionData[section.id]?.rating}/5
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Toggle Icon */}
                    <div className={`transition-transform duration-200 ${
                      expandedSections.has(section.id) ? 'rotate-90' : ''
                    }`}>
                      <ChevronRight className="h-6 w-6 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Content */}
              {expandedSections.has(section.id) && (
                <div className="border-t border-gray-200 bg-gray-50">
                  <div className="p-6">

                    {/* Questions Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {section.questions.map((question) => renderQuestion(section.id, question))}
                    </div>

                    {/* Section Actions */}
                    <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-200">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Score:</span> {calculateSectionScore(section.id)}/{calculateSectionMaxScore(section)} points
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Rating:</span> {calculateSectionRating(section.id)}/5 stars
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleMarkSectionComplete(section.id)}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Section Complete
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-12 flex justify-center space-x-4">
          <Button
            onClick={handleSubmitInspection}
            disabled={isSubmitting || !isFormComplete()}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting Inspection...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Submit Inspection
              </>
            )}
          </Button>
          
          <Button
            onClick={handleSaveAndClose}
            disabled={isSavingPending}
            variant="outline"
            className="border-blue-500 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isSavingPending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Save and Close
              </>
            )}
          </Button>
          
          <Button
            onClick={handleResetForm}
            variant="outline"
            className="border-gray-500 text-gray-600 hover:bg-gray-50 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Reset Form
          </Button>
        </div>
      </div>
      
      {/* Image Modal/Popup */}
      {modalImage && (
        <div 
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-lg">
            <Image
              src={modalImage}
              alt="Full size preview"
              className="w-full h-auto object-contain max-h-[90vh]"
              width={1200}
              height={800}
            />
            <button 
              className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white hover:bg-black/80 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setModalImage(null);
              }}
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 