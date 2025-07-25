"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { User, Car, Building, Search, Loader2, HelpCircle, Zap, Clock } from "lucide-react"
import { useAuth } from "@/lib/auth"
import api from '@/lib/api'
import type { CustomerData, VehicleData } from '@/lib/types'
import { Textarea } from "../ui/textarea"
import { useStageTimer } from "@/components/useStageTimer"

// Electric vehicle detection function
const isElectricVehicle = (make: string, model: string): boolean => {
  const electricVehicles = {
    "Tesla": ["Model S", "Model 3", "Model X", "Model Y", "Roadster", "Cybertruck"],
    "Nissan": ["Leaf", "Ariya"],
    "Chevrolet": ["Bolt", "Bolt EUV", "Volt"],
    "BMW": ["i3", "i4", "i7", "i8", "iX", "iX3"],
    "Audi": ["e-tron", "e-tron GT", "Q4 e-tron", "Q8 e-tron"],
    "Mercedes-Benz": ["EQS", "EQE", "EQB", "EQA", "EQC"],
    "Ford": ["Mustang Mach-E", "F-150 Lightning", "E-Transit"],
    "Volkswagen": ["ID.4", "ID.3", "ID.5", "ID.6", "ID.Buzz"],
    "Hyundai": ["Ioniq", "Kona Electric", "Ioniq 5", "Ioniq 6"],
    "Kia": ["Niro EV", "EV6", "Soul EV"],
    "Porsche": ["Taycan"],
    "Jaguar": ["I-Pace"],
    "Polestar": ["Polestar 1", "Polestar 2", "Polestar 3"],
    "Lucid": ["Air", "Gravity"],
    "Rivian": ["R1T", "R1S"],
    "Volvo": ["XC40 Recharge", "C40 Recharge"],
    "Genesis": ["GV60", "Electrified GV70", "Electrified G80"],
    "Mazda": ["MX-30"],
    "Mitsubishi": ["i-MiEV"],
    "Mini": ["Cooper SE"],
    "Fiat": ["500e"],
    "Honda": ["Clarity Electric"],
    "Toyota": ["bZ4X"],
    "Subaru": ["Solterra"],
    "Lexus": ["RZ 450e"],
    "Bentley": ["Bentayga Hybrid"],
    "Rolls-Royce": ["Spectre"],
    "Lotus": ["Eletre"],
    "McLaren": ["Artura"],
    "Maserati": ["Grecale Folgore", "MC20 Folgore"],
    "Alfa Romeo": ["Tonale"],
    "Jeep": ["Avenger"],
    "Peugeot": ["e-208", "e-2008", "e-308", "e-3008"],
    "Citroen": ["e-C4", "e-C4 X"],
    "Opel": ["Mokka-e", "Corsa-e"],
    "Vauxhall": ["Mokka-e", "Corsa-e"],
    "Skoda": ["Enyaq", "Enyaq Coupe"],
    "Seat": ["Born"],
    "Cupra": ["Born"],
    "Renault": ["Zoe", "Megane E-Tech"],
    "Dacia": ["Spring"],
    "Smart": ["EQ fortwo", "EQ forfour"],
    "DS": ["DS 3 E-Tense", "DS 4 E-Tense", "DS 7 E-Tense"],
    "Alpine": ["A110 E-Tern"],
    "Aston Martin": ["Rapide E"],
    "Lamborghini": ["Revuelto"],
    "Ferrari": ["SF90 Stradale", "296 GTB"],
    "Pagani": ["Huayra R"],
    "Bugatti": ["Chiron Super Sport 300+"],
    "Koenigsegg": ["Gemera"],
    "Rimac": ["Nevera"],
    "Pininfarina": ["Battista"]
  };

  const normalizedMake = make.trim().toLowerCase();
  const normalizedModel = model.trim().toLowerCase();

  // Check if the make exists in our electric vehicles list
  for (const [brand, models] of Object.entries(electricVehicles)) {
    if (brand.toLowerCase() === normalizedMake) {
      // Check if the model matches any electric model for this brand
      return models.some(electricModel => 
        electricModel.toLowerCase() === normalizedModel ||
        electricModel.toLowerCase().includes(normalizedModel) ||
        normalizedModel.includes(electricModel.toLowerCase())
      );
    }
  }

  // Additional checks for common electric vehicle indicators
  const electricIndicators = [
    'electric', 'ev', 'e-', 'i3', 'i4', 'i7', 'i8', 'ix', 'etron', 'eq', 'bolt', 'leaf', 'volt', 'mach-e', 'lightning', 'taycan', 'ipace', 'polestar', 'lucid', 'rivian', 'bentayga', 'spectre', 'eletre', 'artura', 'grecale', 'mc20', 'tonale', 'avenger', 'e-208', 'e-2008', 'e-308', 'e-3008', 'e-c4', 'e-c4 x', 'mokka-e', 'corsa-e', 'enyaq', 'born', 'zoe', 'megane e-tech', 'spring', 'eq fortwo', 'eq forfour', 'ds 3 e-tense', 'ds 4 e-tense', 'ds 7 e-tense', 'a110 e-tern', 'rapide e', 'revuelto', 'sf90 stradale', '296 gtb', 'huayra r', 'chiron super sport 300+', 'gemera', 'nevera', 'battista'
  ];

  return electricIndicators.some(indicator => 
    normalizedModel.includes(indicator) || 
    normalizedMake.includes(indicator)
  );
};

// TypeScript interfaces for intake form data
interface CaseData {
  _id?: string
  createdAt?: string
  customer?: CustomerData
  vehicle?: VehicleData
  documents?: {
    driverLicenseFront: DocumentDisplay | null
    driverLicenseRear: DocumentDisplay | null
    vehicleTitle: DocumentDisplay | null
  }
  currentStage?: number
  stageStatuses?: {
    [key: number]: 'active' | 'complete' | 'pending'
  }
}

interface UserData {
  firstName?: string
  lastName?: string
  location?: string
}


interface IntakeFormProps {
  vehicleData: CaseData
  onUpdate: (data: CaseData) => void
  onComplete: () => void
}

interface DocumentDisplay {
  path: string;
  originalName: string;
}

interface FormData {
  intakeDate: string;
  agentFirstName: string;
  agentLastName: string;
  storeLocation: string;
  customer: CustomerData;
  vehicle: Omit<VehicleData, 'loanAmount'> & {
    loanAmount: string | number;
  };
  documents: {
    driverLicenseFront: DocumentDisplay | null;
    driverLicenseRear: DocumentDisplay | null;
    vehicleTitle: DocumentDisplay | null;
  };
}

export function IntakeForm({ vehicleData, onUpdate, onComplete }: IntakeFormProps) {
  const { user, isAuthenticated } = useAuth()
  
  // Stage timer hook with case ID and stage name
  const caseId = vehicleData._id;
  const { 
    startTime, 
    elapsed, 
    start, 
    stop, 
    elapsedFormatted, 
    savedTimeFormatted, 
    newTimeFormatted,
    isLoading: timerLoading 
  } = useStageTimer(caseId, 'intake')
  
  // Vehicle makes and models data
  const [vehicleMakesAndModels, setVehicleMakesAndModels] = useState<{ [key: string]: string[] }>({
    "Acura": ["CL", "ILX", "Integra", "Legend", "MDX", "NSX", "RDX", "RL", "RSX", "TL", "TLX", "TSX", "Vigor", "ZDX"],
    "Alfa Romeo": ["4C", "Giulia", "Giulietta", "Stelvio", "Tonale"],
    "Aston Martin": ["DB11", "DB12", "DBS", "Rapide", "Vantage", "Virage"],
    "Audi": ["A3", "A4", "A5", "A6", "A7", "A8", "e-tron", "Q3", "Q4", "Q5", "Q7", "Q8", "R8", "RS", "S3", "S4", "S5", "S6", "S7", "S8", "TT"],
    "Bentley": ["Bentayga", "Continental", "Flying Spur", "Mulsanne"],
    "BMW": ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "8 Series", "i3", "i4", "i7", "i8", "M2", "M3", "M4", "M5", "M8", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4"],
    "Buick": ["Cascada", "Enclave", "Encore", "Envision", "LaCrosse", "Regal", "Rendezvous", "Terraza", "Verano"],
    "Cadillac": ["ATS", "CT4", "CT5", "CT6", "CTS", "DTS", "Escalade", "SRX", "STS", "XLR", "XT4", "XT5", "XT6"],
    "Chevrolet": ["Aveo", "Blazer", "Camaro", "Caprice", "Captiva", "Cavalier", "Cobalt", "Colorado", "Corvette", "Cruze", "Equinox", "Express", "HHR", "Impala", "Malibu", "Monte Carlo", "S10", "Silverado", "Sonic", "Spark", "Suburban", "Tahoe", "TrailBlazer", "Traverse", "Trax", "Uplander", "Volt"],
    "Chrysler": ["200", "300", "300M", "Aspen", "Cirrus", "Concorde", "Crossfire", "Grand Voyager", "LHS", "New Yorker", "Pacifica", "PT Cruiser", "Sebring", "Town & Country", "Voyager"],
    "Dodge": ["Avenger", "Caliber", "Caravan", "Challenger", "Charger", "Dart", "Durango", "Grand Caravan", "Intrepid", "Journey", "Magnum", "Neon", "Nitro", "Ram", "Stratus", "Viper"],
    "Fiat": ["500", "500L", "500X", "124 Spider"],
    "Ford": ["Bronco", "C-Max", "Contour", "Crown Victoria", "EcoSport", "Edge", "Escape", "Expedition", "Explorer", "F-150", "F-250", "F-350", "F-450", "F-550", "Fiesta", "Flex", "Focus", "Fusion", "Galaxy", "GT", "Ka", "Kuga", "Mondeo", "Mustang", "Puma", "Ranger", "S-Max", "Taurus", "Thunderbird", "Transit", "Windstar"],
    "Genesis": ["G70", "G80", "G90", "GV60", "GV70", "GV80"],
    "GMC": ["Acadia", "Canyon", "Envoy", "Hummer H2", "Hummer H3", "Jimmy", "Safari", "Savana", "Sierra", "Sonoma", "Terrain", "Yukon"],
    "Honda": ["Accord", "Civic", "Clarity", "CR-V", "CR-Z", "Element", "Fit", "HR-V", "Insight", "Odyssey", "Passport", "Pilot", "Prelude", "Ridgeline", "S2000"],
    "Hyundai": ["Accent", "Azera", "Elantra", "Entourage", "Equus", "Genesis", "Getz", "Ioniq", "Kona", "Nexo", "Palisade", "Santa Fe", "Sonata", "Tiburon", "Tucson", "Veloster", "Venue", "Veracruz"],
    "Infiniti": ["EX", "FX", "G", "I", "J", "JX", "M", "Q30", "Q40", "Q50", "Q60", "Q70", "QX30", "QX50", "QX60", "QX70", "QX80"],
    "Jaguar": ["E-Pace", "F-Pace", "F-Type", "I-Pace", "S-Type", "X-Type", "XE", "XF", "XJ", "XK"],
    "Jeep": ["Cherokee", "Compass", "Gladiator", "Grand Cherokee", "Liberty", "Patriot", "Renegade", "Wrangler"],
    "Kia": ["Amanti", "Borrego", "Cadenza", "Carens", "Ceed", "Cerato", "Forte", "K5", "K900", "Magentis", "Mohave", "Niro", "Optima", "Picanto", "ProCeed", "Rio", "Sedana", "Seltos", "Sorento", "Soul", "Spectra", "Sportage", "Stinger", "Telluride"],
    "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Evoque", "Freelander", "LR2", "LR3", "LR4", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"],
    "Lexus": ["CT", "ES", "GS", "GX", "HS", "IS", "LC", "LFA", "LS", "LX", "NX", "RC", "RX", "SC", "UX"],
    "Lincoln": ["Aviator", "Continental", "Corsair", "LS", "Mark LT", "MKC", "MKS", "MKT", "MKX", "MKZ", "Navigator", "Town Car", "Zephyr"],
    "Lotus": ["Elise", "Europa", "Evora", "Exige"],
    "Maserati": ["Ghibli", "GranTurismo", "Levante", "MC20", "Quattroporte"],
    "Mazda": ["2", "3", "5", "6", "CX-3", "CX-30", "CX-5", "CX-7", "CX-9", "MX-30", "MX-5", "Protege", "RX-7", "RX-8", "Tribute"],
    "McLaren": ["540C", "570S", "600LT", "650S", "675LT", "720S", "750S", "765LT", "Artura", "F1", "GT", "P1"],
    "Mercedes-Benz": ["A-Class", "B-Class", "C-Class", "CLA", "CLS", "E-Class", "G-Class", "GLA", "GLB", "GLC", "GLE", "GLK", "GLS", "M-Class", "R-Class", "S-Class", "SL", "SLC", "SLK", "SLS", "Sprinter"],
    "MINI": ["Clubman", "Convertible", "Countryman", "Coupe", "Hardtop", "Paceman", "Roadster"],
    "Mitsubishi": ["3000GT", "Diamante", "Eclipse", "Endeavor", "Galant", "i-MiEV", "Lancer", "Mirage", "Montero", "Outlander", "Raider"],
    "Nissan": ["350Z", "370Z", "Altima", "Armada", "Frontier", "GT-R", "Juke", "Leaf", "Maxima", "Murano", "NV", "Pathfinder", "Quest", "Rogue", "Sentra", "Titan", "Versa", "Xterra"],
    "Oldsmobile": ["Alero", "Aurora", "Bravada", "Cutlass", "Intrigue", "Silhouette"],
    "Pontiac": ["Aztek", "Bonneville", "Firebird", "G3", "G5", "G6", "G8", "Grand Am", "Grand Prix", "GTO", "Montana", "Solstice", "Sunfire", "Torrent", "Vibe"],
    "Porsche": ["718", "911", "Boxster", "Cayenne", "Cayman", "Macan", "Panamera", "Taycan"],
    "Ram": ["1500", "2500", "3500", "ProMaster", "ProMaster City"],
    "Rolls-Royce": ["Cullinan", "Dawn", "Ghost", "Phantom", "Spectre", "Wraith"],
    "Saab": ["9-3", "9-5", "9-7X"],
    "Saturn": ["Aura", "Ion", "Outlook", "Relay", "Sky", "Vue"],
    "Scion": ["FR-S", "iQ", "tC", "xA", "xB", "xD"],
    "Subaru": ["Ascent", "BRZ", "Crosstrek", "Forester", "Impreza", "Legacy", "Outback", "Tribeca", "WRX", "XV"],
    "Suzuki": ["Aerio", "Equator", "Forenza", "Grand Vitara", "Kizashi", "Reno", "SX4", "Verona", "XL-7"],
    "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Roadster"],
    "Toyota": ["4Runner", "86", "Avalon", "Camry", "Celica", "Corolla", "Cressida", "Echo", "FJ Cruiser", "Highlander", "Land Cruiser", "Matrix", "MR2", "Prius", "Prius C", "Prius V", "RAV4", "Sequoia", "Sienna", "Solara", "Supra", "Tacoma", "Tercel", "Tundra", "Venza", "Yaris"],
    "Volkswagen": ["Arteon", "Atlas", "Beetle", "CC", "Eos", "Golf", "GTI", "Jetta", "Passat", "Phaeton", "Polo", "Routan", "Tiguan", "Touareg", "Touran"],
    "Volvo": ["C30", "C70", "S40", "S60", "S70", "S80", "S90", "V40", "V50", "V60", "V70", "V90", "XC40", "XC60", "XC70", "XC90"]
  });

  const [formData, setFormData] = useState<FormData>({
    // Front Office Details
    intakeDate: new Date().toISOString().split("T")[0],
    agentFirstName: "",
    agentLastName: "",
    storeLocation: "",

    // Customer Contact Info
    customer: {
      firstName: "",
      middleInitial: "",
      lastName: "",
      cellPhone: "",
      homePhone: "",
      email1: "",
      email2: "",
      email3: "",
      notes:"",
      hearAboutVOS: "",
      source: "", // Add new field for customer source
      receivedOtherQuote: false,
      otherQuoteOfferer: "",
      otherQuoteAmount: 0,
    },

    // Basic Vehicle Info
            vehicle: {
          year: "",
          make: "",
          model: "",
          currentMileage: "",
          vin: "",
          titleStatus: "clean",
          loanStatus: "paid-off",
          loanAmount: "",
          secondSetOfKeys: false,
          hasTitleInPossession: false,
          titleInOwnName: false,
          isElectric: false,
        },

    // Required Images
    documents: {
      driverLicenseFront: null,
      driverLicenseRear: null,
      vehicleTitle: null,
    },
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingVinData, setIsLoadingVinData] = useState(false)
  const [isLoadingVehicleData, setIsLoadingVehicleData] = useState(false)
  const [showCustomMake, setShowCustomMake] = useState(false)
  const [showCustomModel, setShowCustomModel] = useState(false)
  const [customMake, setCustomMake] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const { toast } = useToast()

  // Start stage timer on mount (only if not already started from saved data)
  useEffect(() => {
    if (!startTime && !timerLoading) {
      start();
    }
  }, [startTime, timerLoading, start]);

  // Load agent details on mount
  useEffect(() => {
    const loadAgentDetails = async () => {
      // Only load agent details if user is authenticated
      if (!isAuthenticated || !user) {
        console.log('User not authenticated, skipping agent details load');
        return;
      }

      try {
        const response = await api.getCurrentUser();
        console.log('getCurrentUser response:', response); // Debug log

        if (response.success && response.data && typeof response.data === 'object') {
          const userData = response.data as UserData;
          setFormData(prev => ({
            ...prev,
            agentFirstName: userData.firstName || '',
            agentLastName: userData.lastName || '',
            storeLocation: userData.location || ''
          }));
        } else {
          console.warn('getCurrentUser failed or returned invalid data:', response);
          // Use user data from auth context as fallback
          setFormData(prev => ({
            ...prev,
            agentFirstName: user.firstName || '',
            agentLastName: user.lastName || '',
            storeLocation: user.location || ''
          }));
        }
      } catch (error) {
        console.error('Error loading agent details:', error);
        // Use user data from auth context as fallback
        setFormData(prev => ({
          ...prev,
          agentFirstName: user.firstName || '',
          agentLastName: user.lastName || '',
          storeLocation: user.location || ''
        }));
      }
    };

    loadAgentDetails();
  }, [isAuthenticated, user]);

  // Load case data if editing existing case
  useEffect(() => {
    if (vehicleData?._id) {
      setFormData(prev => ({
        ...prev,
        intakeDate: vehicleData.createdAt?.split('T')[0] || new Date().toISOString().split("T")[0],
        customer: {
          firstName: vehicleData.customer?.firstName || "",
          middleInitial: vehicleData.customer?.middleInitial || "",
          lastName: vehicleData.customer?.lastName || "",
          cellPhone: vehicleData.customer?.cellPhone || "",
          homePhone: vehicleData.customer?.homePhone || "",
          email1: vehicleData.customer?.email1 || "",
          email2: vehicleData.customer?.email2 || "",
          email3: vehicleData.customer?.email3 || "",
          notes: vehicleData.customer?.notes || "",
          source: vehicleData.customer?.source || "", // Add source to load from existing data
          hearAboutVOS: vehicleData.customer?.hearAboutVOS || "",
          receivedOtherQuote: vehicleData.customer?.receivedOtherQuote || false,
          otherQuoteOfferer: vehicleData.customer?.otherQuoteOfferer || "",
          otherQuoteAmount: vehicleData.customer?.otherQuoteAmount || 0,
        },
        vehicle: {
          year: vehicleData.vehicle?.year || "",
          make: vehicleData.vehicle?.make || "",
          model: vehicleData.vehicle?.model || "",
          currentMileage: vehicleData.vehicle?.currentMileage || "",
          vin: vehicleData.vehicle?.vin || "",
          titleStatus: vehicleData.vehicle?.titleStatus || "clean",
          loanStatus: vehicleData.vehicle?.loanStatus || "paid-off",
          loanAmount: vehicleData.vehicle?.loanAmount ? vehicleData.vehicle.loanAmount.toString() : "",
          secondSetOfKeys: vehicleData.vehicle?.secondSetOfKeys || false,
          hasTitleInPossession: vehicleData.vehicle?.hasTitleInPossession || false,
          titleInOwnName: vehicleData.vehicle?.titleInOwnName || false,
          isElectric: vehicleData.vehicle?.isElectric || false, // Load isElectric
        },
        documents: vehicleData.documents || {
          driverLicenseFront: null,
          driverLicenseRear: null,
          vehicleTitle: null,
        }
      }));
      
      // Handle custom make/model values if they exist in the loaded data
      if (vehicleData.vehicle?.make && vehicleData.vehicle?.model) {
        const loadedMake = vehicleData.vehicle.make;
        const loadedModel = vehicleData.vehicle.model;
        
        // Check if the loaded make is not in our predefined list (custom make)
        if (!vehicleMakesAndModels[loadedMake]) {
          setShowCustomMake(true);
          setCustomMake(loadedMake);
          setFormData(prev => ({
            ...prev,
            vehicle: {
              ...prev.vehicle,
              make: 'other' // Set to 'other' to show custom input
            }
          }));
        }
        
        // Check if the loaded model is not in our predefined list for the make (custom model)
        const availableModels = vehicleMakesAndModels[loadedMake] || [];
        if (!availableModels.includes(loadedModel)) {
          setShowCustomModel(true);
          setCustomModel(loadedModel);
          setFormData(prev => ({
            ...prev,
            vehicle: {
              ...prev.vehicle,
              model: 'other' // Set to 'other' to show custom input
            }
          }));
        }
      }
      
      setIsInitialLoad(false);
    }
  }, [vehicleData, vehicleMakesAndModels]);

  // Load vehicle makes and models from API
  useEffect(() => {
    const loadVehicleData = async () => {
      setIsLoadingVehicleData(true);
      try {
        const response = await api.getVehicleMakesAndModels();
        console.log(isLoadingVehicleData);
        if (response.success && response.data) {
          setVehicleMakesAndModels(response.data.models);
        }
      } catch (error) {
        console.error('Error loading vehicle data:', error);
        // Fallback to default data if API fails
        setVehicleMakesAndModels({
          'Acura': ['CL', 'ILX', 'Integra', 'Legend', 'MDX', 'NSX', 'RDX', 'RL', 'RSX', 'TL', 'TLX', 'TSX', 'ZDX'],
          'Alfa Romeo': ['4C', 'Giulia', 'Giulietta', 'Stelvio', 'Tonale'],
          'Aston Martin': ['DB11', 'DB12', 'DBS', 'Vantage', 'Virage'],
          'Audi': ['A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q3', 'Q4', 'Q5', 'Q7', 'Q8', 'RS', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'TT'],
          'Bentley': ['Bentayga', 'Continental', 'Flying Spur', 'Mulsanne'],
          'BMW': ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'i3', 'i4', 'i7', 'i8', 'M2', 'M3', 'M4', 'M5', 'M8', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4'],
          'Buick': ['Cascada', 'Enclave', 'Encore', 'Envision', 'LaCrosse', 'Regal', 'Rendezvous', 'Terraza'],
          'Cadillac': ['ATS', 'CT4', 'CT5', 'CT6', 'CTS', 'DTS', 'Escalade', 'SRX', 'STS', 'XLR', 'XT4', 'XT5', 'XT6'],
          'Chevrolet': ['Aveo', 'Blazer', 'Camaro', 'Caprice', 'Captiva', 'Cavalier', 'Cobalt', 'Colorado', 'Corvette', 'Cruze', 'Equinox', 'Express', 'HHR', 'Impala', 'Malibu', 'Monte Carlo', 'Prizm', 'S10', 'Silverado', 'Sonic', 'Spark', 'Suburban', 'Tahoe', 'Tracker', 'TrailBlazer', 'Traverse', 'Trax', 'Uplander', 'Venture'],
          'Chrysler': ['200', '300', '300M', 'Aspen', 'Cirrus', 'Concorde', 'Crossfire', 'Grand Voyager', 'LHS', 'New Yorker', 'Pacifica', 'PT Cruiser', 'Sebring', 'Town & Country', 'Voyager'],
          'Citroen': ['C3', 'C4', 'C5'],
          'Dodge': ['Avenger', 'Caliber', 'Caravan', 'Challenger', 'Charger', 'Dart', 'Durango', 'Grand Caravan', 'Intrepid', 'Journey', 'Magnum', 'Neon', 'Nitro', 'Ram', 'Shadow', 'Spirit', 'Stealth', 'Stratus', 'Viper'],
          'Ferrari': ['296', '488', '812', 'California', 'F8', 'FF', 'F12', 'GTC4Lusso', 'LaFerrari', 'Portofino', 'Roma', 'SF90'],
          'Fiat': ['500', '500L', '500X', '124 Spider'],
          'Ford': ['Bronco', 'Bronco Sport', 'C-Max', 'Contour', 'Crown Victoria', 'EcoSport', 'Edge', 'Escape', 'Expedition', 'Explorer', 'F-150', 'F-250', 'F-350', 'F-450', 'F-550', 'Fiesta', 'Five Hundred', 'Flex', 'Focus', 'Fusion', 'Galaxy', 'GT', 'Ka', 'Kuga', 'Maverick', 'Mondeo', 'Mustang', 'Puma', 'Ranger', 'S-Max', 'Taurus', 'Thunderbird', 'Transit', 'Windstar'],
          'Genesis': ['G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80'],
          'GMC': ['Acadia', 'Canyon', 'Envoy', 'Hummer H1', 'Hummer H2', 'Hummer H3', 'Jimmy', 'Safari', 'Savana', 'Sierra', 'Sonoma', 'Terrain', 'Yukon'],
          'Honda': ['Accord', 'Civic', 'Clarity', 'CR-V', 'CR-Z', 'Element', 'Fit', 'HR-V', 'Insight', 'Odyssey', 'Passport', 'Pilot', 'Prelude', 'Ridgeline', 'S2000'],
          'Hyundai': ['Accent', 'Azera', 'Elantra', 'Entourage', 'Equus', 'Genesis', 'Ioniq', 'Kona', 'Nexo', 'Palisade', 'Santa Cruz', 'Santa Fe', 'Sonata', 'Tiburon', 'Tucson', 'Veloster', 'Venue', 'Veracruz', 'XG'],
          'Infiniti': ['EX', 'FX', 'G', 'I', 'J', 'JX', 'M', 'Q30', 'Q40', 'Q50', 'Q60', 'Q70', 'QX30', 'QX50', 'QX55', 'QX60', 'QX70', 'QX80'],
          'Jaguar': ['E-Pace', 'F-Pace', 'F-Type', 'I-Pace', 'S-Type', 'X-Type', 'XE', 'XF', 'XJ', 'XK'],
          'Jeep': ['Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Liberty', 'Patriot', 'Renegade', 'Wrangler'],
          'Kia': ['Amanti', 'Borrego', 'Cadenza', 'Carens', 'Ceed', 'Cerato', 'Forte', 'K5', 'K900', 'Magentis', 'Mohave', 'Niro', 'Optima', 'Picanto', 'ProCeed', 'Rio', 'Sedana', 'Seltos', 'Sorento', 'Soul', 'Spectra', 'Sportage', 'Stinger', 'Telluride'],
          'Lamborghini': ['Aventador', 'Countach', 'Diablo', 'Gallardo', 'Huracan', 'Murcielago', 'Reventon', 'Urus', 'Veneno'],
          'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Evoque', 'Freelander', 'LR2', 'LR3', 'LR4', 'Range Rover', 'Range Rover Sport', 'Range Rover Velar'],
          'Lexus': ['CT', 'ES', 'GS', 'HS', 'IS', 'LC', 'LFA', 'LS', 'LX', 'NX', 'RC', 'RX', 'SC', 'UX'],
          'Lincoln': ['Aviator', 'Blackwood', 'Continental', 'Corsair', 'LS', 'Mark LT', 'Mark VIII', 'MKC', 'MKS', 'MKT', 'MKX', 'MKZ', 'Navigator', 'Town Car', 'Zephyr'],
          'Lotus': ['Elise', 'Europa', 'Evora', 'Exige'],
          'Maserati': ['Ghibli', 'GranTurismo', 'Levante', 'MC20', 'Quattroporte'],
          'Mazda': ['2', '3', '5', '6', 'CX-3', 'CX-30', 'CX-5', 'CX-7', 'CX-9', 'MX-30', 'MX-5', 'MX-6', 'Protege', 'RX-7', 'RX-8', 'Tribute'],
          'McLaren': ['540C', '570S', '600LT', '650S', '675LT', '720S', '750S', '765LT', 'Artura', 'F1', 'GT', 'P1', 'Senna'],
          'Mercedes-Benz': ['A-Class', 'B-Class', 'C-Class', 'CLA', 'CLS', 'E-Class', 'G-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLK', 'GLS', 'M-Class', 'R-Class', 'S-Class', 'SL', 'SLC', 'SLK', 'SLS', 'Sprinter', 'V-Class'],
          'MINI': ['Clubman', 'Countryman', 'Coupe', 'Hardtop', 'Paceman', 'Roadster'],
          'Mitsubishi': ['3000GT', 'Diamante', 'Eclipse', 'Endeavor', 'Galant', 'i-MiEV', 'Lancer', 'Mirage', 'Montero', 'Outlander', 'Pajero', 'Raider'],
          'Nissan': ['350Z', '370Z', 'Altima', 'Armada', 'Frontier', 'GT-R', 'Juke', 'Leaf', 'Maxima', 'Murano', 'NV', 'Pathfinder', 'Quest', 'Rogue', 'Sentra', 'Titan', 'Versa', 'Xterra'],
          'Oldsmobile': ['Alero', 'Aurora', 'Bravada', 'Cutlass', 'Intrigue', 'Silhouette'],
          'Peugeot': ['2008', '3008', '5008', '508'],
          'Pontiac': ['Aztek', 'Bonneville', 'Firebird', 'G3', 'G5', 'G6', 'G8', 'Grand Am', 'Grand Prix', 'GTO', 'Montana', 'Solstice', 'Sunfire', 'Torrent', 'Vibe'],
          'Porsche': ['911', '918', '924', '928', '944', '968', 'Boxster', 'Cayenne', 'Cayman', 'Macan', 'Panamera', 'Taycan'],
          'Ram': ['1500', '2500', '3500', 'ProMaster', 'ProMaster City'],
          'Renault': ['Clio', 'Megane', 'Zoe'],
          'Rolls-Royce': ['Cullinan', 'Dawn', 'Ghost', 'Phantom', 'Wraith'],
          'Saab': ['9-3', '9-5', '9-7X'],
          'Saturn': ['Aura', 'Ion', 'Outlook', 'Relay', 'Sky', 'Vue'],
          'Scion': ['FR-S', 'iA', 'iM', 'iQ', 'tC', 'xA', 'xB', 'xD'],
          'Subaru': ['Ascent', 'BRZ', 'Crosstrek', 'Forester', 'Impreza', 'Legacy', 'Outback', 'SVX', 'Tribeca', 'WRX', 'XV'],
          'Suzuki': ['Aerio', 'Equator', 'Forenza', 'Grand Vitara', 'Kizashi', 'Reno', 'SX4', 'Verona', 'XL-7'],
          'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y', 'Roadster'],
          'Toyota': ['4Runner', '86', 'Avalon', 'Camry', 'Celica', 'Corolla', 'Cressida', 'Echo', 'FJ Cruiser', 'Highlander', 'Land Cruiser', 'Matrix', 'MR2', 'Paseo', 'Previa', 'Prius', 'Prius C', 'Prius V', 'RAV4', 'Sequoia', 'Sienna', 'Solara', 'Supra', 'Tacoma', 'Tercel', 'Tundra', 'Venza', 'Yaris'],
          'Volkswagen': ['Arteon', 'Atlas', 'Beetle', 'CC', 'Eos', 'Golf', 'GTI', 'Jetta', 'Passat', 'Phaeton', 'Polo', 'Routan', 'Scirocco', 'Tiguan', 'Touareg', 'Touran'],
          'Volvo': ['C30', 'C70', 'S40', 'S60', 'S70', 'S80', 'S90', 'V40', 'V50', 'V60', 'V70', 'V90', 'XC40', 'XC60', 'XC70', 'XC90']
        });
      } finally {
        setIsLoadingVehicleData(false);
      }
    };

    loadVehicleData();
  }, []);

  // Auto-save changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (vehicleData?._id && !isInitialLoad) {
        
        // Prepare vehicle data with custom make/model values for auto-save
        const actualMake = formData.vehicle.make === 'other' ? customMake : formData.vehicle.make;
        const actualModel = formData.vehicle.model === 'other' ? customModel : formData.vehicle.model;
        
        const autoSaveData = {
          ...formData,
          vehicle: {
            ...formData.vehicle,
            make: actualMake,
            model: actualModel,
            loanAmount: formData.vehicle.loanAmount ? Number(formData.vehicle.loanAmount) : undefined
          }
        };
        
        onUpdate({
          ...autoSaveData,
          vehicle: {
            ...autoSaveData.vehicle,
            loanAmount: autoSaveData.vehicle.loanAmount ? Number(autoSaveData.vehicle.loanAmount) : undefined
          }
        });
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [formData, customMake, customModel, onUpdate, vehicleData?._id, isInitialLoad]);

  const handleInputChange = (section: keyof FormData | 'customer' | 'vehicle', field: string, value: string | boolean | number) => {
    setFormData((prev) => {
      if (section === 'customer' || section === 'vehicle') {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value,
          },
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  // Handle make selection and reset model
  const handleMakeChange = (make: string) => {
    if (make === 'other') {
      setShowCustomMake(true);
      setFormData((prev) => ({
        ...prev,
        vehicle: {
          ...prev.vehicle,
          make: 'other', // Keep 'other' as the value to maintain display
          model: "", // Reset model when make changes
        },
      }));
    } else {
      setShowCustomMake(false);
      setCustomMake('');
      setFormData((prev) => ({
        ...prev,
        vehicle: {
          ...prev.vehicle,
          make: make,
          model: "", // Reset model when make changes
        },
      }));
    }
  };

  const handleCustomMakeChange = (value: string) => {
    setCustomMake(value);
    // Don't update the form data make field - keep it as "other" for display
    // The actual custom value will be used when saving
  };

  const handleModelChange = (model: string) => {
    if (model === 'other') {
      setShowCustomModel(true);
      setFormData((prev) => ({
        ...prev,
        vehicle: {
          ...prev.vehicle,
          model: 'other' // Keep 'other' as the value to maintain display
        },
      }));
    } else {
      setShowCustomModel(false);
      setCustomModel('');
      const actualMake = formData.vehicle.make === 'other' ? customMake : formData.vehicle.make;
      const actualModel = model;
      
      // Detect if this is an electric vehicle
      const isElectric = isElectricVehicle(actualMake, actualModel);
      
      setFormData((prev) => ({
        ...prev,
        vehicle: {
          ...prev.vehicle,
          model,
          isElectric
        },
      }));
    }
  };

  const handleCustomModelChange = (value: string) => {
    setCustomModel(value);
    // Don't update the form data model field - keep it as "other" for display
    // The actual custom value will be used when saving
    
    // Detect if this is an electric vehicle
    const actualMake = formData.vehicle.make === 'other' ? customMake : formData.vehicle.make;
    const isElectric = isElectricVehicle(actualMake, value);
    
    setFormData((prev) => ({
      ...prev,
      vehicle: {
        ...prev.vehicle,
        isElectric
      },
    }));
  };

  const saveCustomVehicle = async (make: string, model: string) => {
    try {
      const response = await api.saveCustomVehicle(make, model);
      if (response.success) {
        // Update the local state with the new make/model
        if (!vehicleMakesAndModels[make]) {
          setVehicleMakesAndModels(prev => ({
            ...prev,
            [make]: [model]
          }));
        } else if (!vehicleMakesAndModels[make].includes(model)) {
          setVehicleMakesAndModels(prev => ({
            ...prev,
            [make]: [...prev[make], model].sort()
          }));
        }
        toast({
          title: "Custom vehicle saved",
          description: `${make} ${model} has been added to the vehicle database for future use.`,
        });
      }
    } catch (error) {
      console.error('Error saving custom vehicle:', error);
      toast({
        title: "Error saving vehicle",
        description: "Failed to save custom vehicle. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get available models for selected make
  const availableModels = useMemo(() => {
    const selectedMake = formData.vehicle.make;
    return selectedMake && vehicleMakesAndModels[selectedMake as keyof typeof vehicleMakesAndModels] 
      ? vehicleMakesAndModels[selectedMake as keyof typeof vehicleMakesAndModels] 
      : [];
  }, [formData.vehicle.make, vehicleMakesAndModels]);

  // Get sorted list of makes
  const sortedMakes = useMemo(() => {
    return Object.keys(vehicleMakesAndModels).sort();
  }, [vehicleMakesAndModels]);

  // Function to fetch vehicle data by VIN
  const fetchVehicleByVIN = useCallback(async (vin: string) => {
    if (!vin || vin.length < 17) {
      return; // Don't attempt lookup if VIN is invalid
    }

    setIsLoadingVinData(true);

    try {
      // First, get vehicle pricing for estimated value
      const pricingResponse = await api.getVehiclePricing(vin);
      const estimatedValue = pricingResponse.success ? pricingResponse.data?.estimatedValue : undefined;

      // Second, get vehicle specifications 
      const specsResponse = await api.getVehicleSpecs(vin);

      if (specsResponse.success && specsResponse.data) {
        toast({
          title: "Vehicle information retrieved",
          description: "Successfully retrieved vehicle information from VIN database"
        });

        const { year, make, model, exterior_color, body_style } = specsResponse.data;

        // Update form with retrieved vehicle specs and pricing
        setFormData(prev => ({
          ...prev,
          vehicle: {
            ...prev.vehicle,
            year: year || prev.vehicle.year,
            make: make || prev.vehicle.make,
            model: model || prev.vehicle.model,
            color: exterior_color || prev.vehicle.color,
            bodyStyle: body_style || prev.vehicle.bodyStyle,
            vin,
            estimatedValue,
            pricingSource: 'MarketCheck API',
            pricingLastUpdated: new Date().toISOString()
          }
        }));
      } else if (pricingResponse.success && pricingResponse.data?.estimatedValue) {
        // At least update the estimated value if specs lookup failed
        setFormData(prev => ({
          ...prev,
          vehicle: {
            ...prev.vehicle,
            estimatedValue,
            pricingSource: 'MarketCheck API',
            pricingLastUpdated: new Date().toISOString()
          }
        }));

        toast({
          title: "Partial vehicle information retrieved",
          description: "Got pricing data but couldn't retrieve full vehicle details."
        });
      } else {
        // Both lookups failed
        toast({
          title: "Vehicle information lookup failed",
          description: "Could not retrieve vehicle details from VIN. Please enter details manually.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching vehicle data by VIN:', error);
      toast({
        title: "Error",
        description: "Failed to look up vehicle by VIN. Please enter details manually.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingVinData(false);
    }
  }, [toast]);

  // Watch for VIN changes to auto-lookup
  useEffect(() => {
    // Debounce the VIN lookup to avoid excessive API calls
    const vinTimer = setTimeout(() => {
      const vin = formData.vehicle?.vin?.trim();
      if (vin && vin.length === 17) { // Standard VIN length is 17 characters
        fetchVehicleByVIN(vin);
      }
    }, 1000);

    return () => clearTimeout(vinTimer);
  }, [formData.vehicle.vin, fetchVehicleByVIN]);

  const handleComplete = async () => {
    const requiredFields = [
      formData.customer.firstName,
      formData.customer.lastName,
      formData.customer.cellPhone,
      formData.customer.email1,
      formData.vehicle.year,
      formData.vehicle.make,
      formData.vehicle.model,
      formData.vehicle.titleStatus,
    ]

    if (requiredFields.some((field) => !field)) {
      toast({
        title: "Missing Required Information",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Stop the stage timer and get timing data
      const timingData = await stop();

      // Prepare vehicle data with custom make/model values if "Other" was selected
      const actualMake = formData.vehicle.make === 'other' ? customMake : formData.vehicle.make;
      const actualModel = formData.vehicle.model === 'other' ? customModel : formData.vehicle.model;
      
      // Save custom vehicle if it was used
      if (showCustomMake && customMake && formData.vehicle.make === 'other') {
        await saveCustomVehicle(customMake, actualModel);
      }

      const caseData = {
        customer: formData.customer,
        vehicle: {
          ...formData.vehicle,
          make: actualMake,
          model: actualModel,
          loanAmount: formData.vehicle.loanAmount ? Number(formData.vehicle.loanAmount) : undefined
        },
        documents: formData.documents.driverLicenseFront?.path || formData.documents.driverLicenseRear?.path || formData.documents.vehicleTitle?.path || "",
        agentInfo: {
          firstName: formData.agentFirstName,
          lastName: formData.agentLastName,
          storeLocation: formData.storeLocation
        }
      };

      let response;
      let caseId;
      
      // Check if this is an existing case (has _id) or a new case
      if (vehicleData?._id) {
        // Update existing case
        caseId = vehicleData._id;
        response = await api.updateCustomerCase(caseId, caseData);
      } else {
        // Create new case
        response = await api.createCustomerCase(caseData);
        if (response.success && response.data) {
          caseId = (response.data as unknown as { _id: string })._id;
        }
      }

              if (response.success) {
          // Send stage time data to backend
          if (timingData.startTime && caseId) {
            try {
              await api.updateStageTime(
                caseId,
                'intake',
                timingData.startTime,
                timingData.endTime
              );
            } catch (error) {
              console.error('Error updating stage time:', error);
              // Don't fail the form submission if stage time update fails
            }
          }

          // Update the vehicle data with the created/updated case
          if (response.data) {
            onUpdate(response.data as CaseData);
            
            // For new cases, mark stage 1 as complete and advance to stage 2
            if (caseId && !vehicleData?._id) {
            const stageData = {
              currentStage: 2,
              stageStatuses: {
                1: 'complete', // Mark stage 1 (Intake) as complete
                2: 'active'    // Mark stage 2 (Schedule Inspection) as active
              }
            };
            
            const stageResponse = await api.updateCaseStageByCaseId(caseId, stageData);
            
            if (stageResponse.success) {
              console.log('Successfully updated case stage to Schedule Inspection');
              // If we have updated stage data, update the UI with it
              if (stageResponse.data) {
                onUpdate(stageResponse.data as CaseData);
              }
            } else {
              console.error('Failed to update case stage:', stageResponse.error);
            }
          } else if (caseId && vehicleData?._id) {
            // For existing cases, preserve all existing stage progress and just ensure stage 1 is marked complete
            const currentStage = vehicleData.currentStage || 1;
            const currentStageStatuses = vehicleData.stageStatuses || {};
            
            // Only update if stage 1 is not already complete
            if (currentStageStatuses[1] !== 'complete') {
              const stageData = {
                currentStage: currentStage, // Preserve current stage
                stageStatuses: {
                  ...currentStageStatuses,
                  1: 'complete' // Ensure stage 1 is marked complete
                }
              };
              
              const stageResponse = await api.updateCaseStageByCaseId(caseId, stageData);
              
              if (stageResponse.success) {
                console.log('Successfully preserved case stage progress');
                // If we have updated stage data, update the UI with it
                if (stageResponse.data) {
                  onUpdate(stageResponse.data as CaseData);
                }
              } else {
                console.error('Failed to update case stage:', stageResponse.error);
              }
            }
          }
        }

        toast({
          title: "Success",
          description: vehicleData?._id ? "Case updated successfully." : "New case created successfully.",
        });
        onComplete();
      }
    } catch (error) {
      const errorData = api.handleError(error);
      toast({
        title: "Error",
        description: errorData.error,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
              <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicle Intake</h1>
          <p className="text-muted-foreground">Comprehensive customer and vehicle data collection</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Stage Timer Display */}
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg hidden">
            <Clock className="h-4 w-4 text-blue-600" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-blue-800">
                Time : {elapsedFormatted}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Front Office Details */}
        <Card style={{display:'none'}}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Front Office Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="intakeDate">Date of Intake *</Label>
              <Input
                id="intakeDate"
                type="date"
                value={formData.intakeDate}
                onChange={(e) => handleInputChange("intakeDate", "intakeDate", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agentFirstName">Agent First Name *</Label>
                <Input
                  id="agentFirstName"
                  value={formData.agentFirstName}
                  onChange={(e) => handleInputChange("agentFirstName", "agentFirstName", e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentLastName">Agent Last Name *</Label>
                <Input
                  id="agentLastName"
                  value={formData.agentLastName}
                  onChange={(e) => handleInputChange("agentLastName", "agentLastName", e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeLocation">Store / Location *</Label>
              <Input
                id="storeLocation"
                value={formData.storeLocation}
                onChange={(e) => handleInputChange("storeLocation", "storeLocation", e.target.value)}
                placeholder="Location"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customer Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.customer.firstName}
                  onChange={(e) => handleInputChange("customer", "firstName", e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleInitial">Middle Initial</Label>
                <Input
                  id="middleInitial"
                  value={formData.customer.middleInitial}
                  onChange={(e) => handleInputChange("customer", "middleInitial", e.target.value)}
                  placeholder="M"
                  maxLength={1}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.customer.lastName}
                onChange={(e) => handleInputChange("customer", "lastName", e.target.value)}
                placeholder="Smith"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cellPhone">Cell Phone *</Label>
                <Input
                  id="cellPhone"
                  type="tel"
                  value={formData.customer.cellPhone}
                  onChange={(e) => handleInputChange("customer", "cellPhone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="homePhone">Home Phone</Label>
                <Input
                  id="homePhone"
                  type="tel"
                  value={formData.customer.homePhone}
                  onChange={(e) => handleInputChange("customer", "homePhone", e.target.value)}
                  placeholder="(555) 987-6543"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email1">Primary Email *</Label>
              <Input
                id="email1"
                type="email"
                value={formData.customer.email1}
                onChange={(e) => handleInputChange("customer", "email1", e.target.value)}
                placeholder="john.smith@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email2">Secondary Email</Label>
              <Input
                id="email2"
                type="email"
                value={formData.customer.email2}
                onChange={(e) => handleInputChange("customer", "email2", e.target.value)}
                placeholder="john.work@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email3">Third Email</Label>
              <Input
                id="email3"
                type="email"
                value={formData.customer.email3}
                onChange={(e) => handleInputChange("customer", "email3", e.target.value)}
                placeholder="john.alt@email.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customer Source Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Source
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerSource">How did this customer come to us? *</Label>
              <Select
                value={formData.customer.source}
                onValueChange={(value) => handleInputChange("customer", "source", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contact_form">Contact Us Form Submission</SelectItem>
                  <SelectItem value="walk_in">Walk-In</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="on_the_road">On the Road</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Car History & Condition */}
        <Card>
          <CardHeader>
            <CardTitle>Car History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="titleStatus">Title Status *</Label>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">Select the current title status of the vehicle</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select
                value={formData.vehicle.titleStatus}
                onValueChange={(value) => handleInputChange("vehicle", "titleStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select title status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clean">
                    <div className="flex items-center justify-between w-full">
                      <span>Clean</span>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground ml-2 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom right" className="max-w-xs">
                          <p className="text-sm">The vehicle has never been in a major accident and holds a standard title with no damage history.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </SelectItem>
                  
                  <SelectItem value="salvage">
                    <div className="flex items-center justify-between w-full">
                      <span>Salvage</span>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground ml-2 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="text-sm">The vehicle was declared a total loss by an insurance company due to significant damage or theft.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </SelectItem>
                  
                  <SelectItem value="rebuilt">
                    <div className="flex items-center justify-between w-full">
                      <span>Rebuilt</span>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground ml-2 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="text-sm">The vehicle was previously salvage but has been repaired and passed state inspection for road use.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </SelectItem>
                  
                  <SelectItem value="not-sure">
                    <div className="flex items-center justify-between w-full">
                      <span>Not Sure</span>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground ml-2 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="text-sm">The title status of the vehicle is unknown or hasn&apos;t been confirmed by the seller.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanStatus">Loan Status *</Label>
              <Select
                value={formData.vehicle.loanStatus || 'paid-off'}
                onValueChange={(value) => {
                  const loanStatus = value as VehicleData['loanStatus'];
                  if (loanStatus) {
                    handleInputChange("vehicle", "loanStatus", loanStatus);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select loan status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid-off">Paid Off</SelectItem>
                  <SelectItem value="still-has-loan">Still Has Loan</SelectItem>
                  <SelectItem value="not-sure">Not Sure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.vehicle.loanStatus === "still-has-loan" && (
              <div className="space-y-2">
                <Label htmlFor="loanAmount">Remaining Loan Amount</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  value={formData.vehicle.loanAmount}
                  onChange={(e) => handleInputChange("vehicle", "loanAmount", Number(e.target.value))}
                  placeholder="15000"
                />
              </div>
            )}

            {/* Title Possession Questions */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Do you currently have possession of your vehicle title?</Label>
                <p className="text-sm text-muted-foreground">Is the title in your physical possession?</p>
              </div>
              <Switch
                checked={formData.vehicle.hasTitleInPossession || false}
                onCheckedChange={(value) => handleInputChange("vehicle", "hasTitleInPossession", value)}
              />
            </div>

            {formData.vehicle.hasTitleInPossession && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Is the title under your name?</Label>
                    <p className="text-sm text-muted-foreground">Is the title registered in your name?</p>
                  </div>
                  <Switch
                    checked={formData.vehicle.titleInOwnName || false}
                    onCheckedChange={(value) => handleInputChange("vehicle", "titleInOwnName", value)}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Second Set of Keys?</Label>
                <p className="text-sm text-muted-foreground">Are all keys available for the vehicle?</p>
              </div>
              <Switch
                checked={formData.vehicle.secondSetOfKeys}
                onCheckedChange={(value) => handleInputChange("vehicle", "secondSetOfKeys", value)}
              />
            </div>
          </CardContent>
        </Card>


        {/* Basic Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Basic Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* VIN moved to the top for auto-population */}
            <div className="space-y-2">
              <Label htmlFor="vehicleVin">
                VIN *
                <span className="text-sm text-muted-foreground ml-2">(Enter VIN to auto-populate vehicle details)</span>
              </Label>
              <div className="relative">
                <Input
                  id="vehicleVin"
                  value={formData.vehicle.vin}
                  onChange={(e) => handleInputChange("vehicle", "vin", e.target.value)}
                  placeholder="1HGBH41JXMN109186"
                  className="pr-10"
                />
                {isLoadingVinData && (
                  <div className="absolute right-2 top-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!isLoadingVinData && formData.vehicle.vin && (
                  <div className="absolute right-2 top-2">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleYear">Year *</Label>
                <Input
                  id="vehicleYear"
                  value={formData.vehicle.year}
                  onChange={(e) => handleInputChange("vehicle", "year", e.target.value)}
                  placeholder="2020"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentMileage">Current Mileage *</Label>
                <Input
                  id="currentMileage"
                  value={formData.vehicle.currentMileage}
                  onChange={(e) => handleInputChange("vehicle", "currentMileage", e.target.value)}
                  placeholder="50,000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleMake">Make *</Label>
              <Select
                value={formData.vehicle.make}
                onValueChange={handleMakeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle make" />
                </SelectTrigger>
                <SelectContent>
                  {sortedMakes.map((make) => (
                    <SelectItem key={make} value={make}>
                      {make}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Other (Custom)</SelectItem>
                </SelectContent>
              </Select>
              {showCustomMake && (
                <div className="mt-2">
                  <Input
                    placeholder="Enter custom make"
                    value={customMake}
                    onChange={(e) => handleCustomMakeChange(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleModel">Model *</Label>
              <Select
                value={formData.vehicle.model}
                onValueChange={(value) => handleModelChange(value)}
                disabled={!formData.vehicle.make}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.vehicle.make ? "Select vehicle model" : "Select make first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Other (Custom)</SelectItem>
                </SelectContent>
              </Select>
              {showCustomModel && (
                <div className="mt-2">
                  <Input
                    placeholder="Enter custom model"
                    value={customModel}
                    onChange={(e) => handleCustomModelChange(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
              
              {/* Electric Vehicle Checkbox */}
              <div className="flex items-center justify-between mt-4 p-3 border rounded-lg bg-gray-50">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-600" />
                    Electric Vehicle
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Check if this is an electric vehicle (EV) or hybrid
                  </p>
                </div>
                <Switch
                  checked={formData.vehicle.isElectric || false}
                  onCheckedChange={(value) => handleInputChange("vehicle", "isElectric", value)}
                />
              </div>
              
              {/* Electric Vehicle Indicator */}
              {formData.vehicle.isElectric && (
                <div className="mt-4 p-3 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-blue-800">Electric Vehicle Confirmed</h4>
                      <p className="text-sm text-blue-700">
                        This vehicle has been marked as an electric vehicle. The inspection will include EV-specific questions.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Estimated value field (auto-populated from API) */}
            {formData.vehicle.estimatedValue && (
              <div className="mt-4 p-3 border rounded-lg bg-green-50 border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-800">Estimated Value</h4>
                    <p className="text-sm text-green-700">
                      ${formData.vehicle.estimatedValue.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-sm text-green-600">
                    via {formData.vehicle.pricingSource || 'MarketCheck'}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Marketing & Competition */}
        <Card>
          <CardHeader>
            <CardTitle>Marketing & Competition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hearAboutVOS">How did you hear about VOS? *</Label>
              <Select
                value={formData.customer.hearAboutVOS}
                onValueChange={(value) => handleInputChange("customer", "hearAboutVOS", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google Search</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="referral">Friend/Family Referral</SelectItem>
                  <SelectItem value="radio">Radio Ad</SelectItem>
                  <SelectItem value="tv">TV Commercial</SelectItem>
                  <SelectItem value="billboard">Billboard</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Did you receive another quote?</Label>
                <p className="text-sm text-muted-foreground">Have you gotten offers from other car buyers?</p>
              </div>
              <Switch
                checked={formData.customer.receivedOtherQuote}
                onCheckedChange={(value) => handleInputChange("customer", "receivedOtherQuote", value)}
              />
            </div>

            {formData.customer.receivedOtherQuote && (
              <div className="space-y-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="space-y-2">
                  <Label htmlFor="otherQuoteOfferer">Offerer Name</Label>
                  <Input
                    id="otherQuoteOfferer"
                    value={formData.customer.otherQuoteOfferer}
                    onChange={(e) => handleInputChange("customer", "otherQuoteOfferer", e.target.value)}
                    placeholder="CarMax, Carvana, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherQuoteAmount">Quote Amount</Label>
                  <Input
                    id="otherQuoteAmount"
                    type="number"
                    value={formData.customer.otherQuoteAmount}
                    onChange={(e) => handleInputChange("customer", "otherQuoteAmount", e.target.value)}
                    placeholder="25000"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
        <CardHeader>
            <CardTitle>Customer Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
               id="note"
               value={formData.customer.notes}
               onChange={(e) => handleInputChange("customer", "notes", e.target.value)}
               placeholder="Add notes about customer"
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleComplete}
          size="lg"
          className="px-8"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Mark as Intake Complete"}
        </Button>
      </div>
      </div>
    </TooltipProvider>
  )
}
