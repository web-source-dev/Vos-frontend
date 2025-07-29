import { CarIcon, CarFrontIcon, SettingsIcon, Activity, CircleDotIcon, ZapIcon, ShieldIcon, WrenchIcon, UserIcon } from "lucide-react"



// Comprehensive inspection sections with detailed questions
export const inspectionSections = [
  {
    id: "obd2",
    name: "OBD2 Scan",
    icon: Activity,
    description: "Diagnostic scan for vehicle computer codes and system status",
    questions: [
      {
        id: "obd2_scan_completed",
        question: "I have connected the OBD2 reader and scanned the vehicle for diagnostic codes.",
        type: "checkbox",
        required: true,
        options: [
          { value: "completed", label: "OBD2 scan completed"}
        ]
      },
      {
        id: "obd2_bypass",
        question: "No OBD2 reader available for this inspection",
        type: "checkbox",
        options: [
          { value: "bypass", label: "Bypass OBD2 scan requirement"}
        ]
      }
    ]
  },
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
          type: "radio",
          options: [
            { value: "no_damage", label: "No glass damage - All components in good condition", points: 5 },
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
          id: "front_bumper_condition",
          question: "Front bumper condition:",
          type: "radio",
          required: true,
          options: [
            { value: "excellent", label: "Excellent - No damage", points: 5 },
            { value: "good", label: "Good - Minor scratches", points: 4 },
            { value: "fair", label: "Fair - Some damage", points: 3 },
            { value: "poor", label: "Poor - Significant damage", points: 2 },
            { value: "very_poor", label: "Very Poor - Major damage", points: 1 }
          ]
        },
        {
          id: "rear_bumper_condition",
          question: "Rear bumper condition:",
          type: "radio",
          required: true,
          options: [
            { value: "excellent", label: "Excellent - No damage", points: 5 },
            { value: "good", label: "Good - Minor scratches", points: 4 },
            { value: "fair", label: "Fair - Some damage", points: 3 },
            { value: "poor", label: "Poor - Significant damage", points: 2 },
            { value: "very_poor", label: "Very Poor - Major damage", points: 1 }
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
      description: "Detailed tire condition, tread depth, and wheel assessment for each tire",
      questions: [
        {
          id: "front_left_tire",
          question: "Front Left Tire Assessment:",
          type: "section",
          required: true,
          subQuestions: [
            {
              id: "front_left_no_damage",
              question: "No damage to tire or rim",
              type: "checkbox",
              options: [
                { value: "no_damage", label: "No damage to tire or rim", points: 5 }
              ]
            },
            {
              id: "front_left_sidewall_damage",
              question: "Sidewall Damage:",
              type: "radio",
              options: [
                { value: "none", label: "No sidewall damage", points: 0 },
                { value: "minor", label: "Minor scratches/scuffs", points: -1 },
                { value: "moderate", label: "Moderate damage", points: -2 },
                { value: "severe", label: "Severe damage", points: -3 }
              ]
            },
            {
              id: "front_left_tread_depth",
              question: "Tread Depth (32nds of an inch):",
              type: "number"
            },
            {
              id: "front_left_rim_condition",
              question: "Condition of Rim:",
              type: "radio",
              options: [
                { value: "excellent", label: "Excellent - No damage", points: 5 },
                { value: "good", label: "Good - Minor scratches", points: 4 },
                { value: "fair", label: "Fair - Some damage", points: 3 },
                { value: "poor", label: "Poor - Significant damage", points: 2 },
                { value: "very_poor", label: "Very Poor - Major damage", points: 1 }
              ]
            },
            {
              id: "front_left_tire_brand",
              question: "Tire Brand:",
              type: "text"
            }
          ]
        },
        {
          id: "front_right_tire",
          question: "Front Right Tire Assessment:",
          type: "section",
          required: true,
          subQuestions: [
            {
              id: "front_right_no_damage",
              question: "No damage to tire or rim",
              type: "checkbox",
              options: [
                { value: "no_damage", label: "No damage to tire or rim", points: 5 }
              ]
            },
            {
              id: "front_right_sidewall_damage",
              question: "Sidewall Damage:",
              type: "radio",
              options: [
                { value: "none", label: "No sidewall damage", points: 0 },
                { value: "minor", label: "Minor scratches/scuffs", points: -1 },
                { value: "moderate", label: "Moderate damage", points: -2 },
                { value: "severe", label: "Severe damage", points: -3 }
              ]
            },
            {
              id: "front_right_tread_depth",
              question: "Tread Depth (32nds of an inch):",
              type: "number"
            },
            {
              id: "front_right_rim_condition",
              question: "Condition of Rim:",
              type: "radio",
              options: [
                { value: "excellent", label: "Excellent - No damage", points: 5 },
                { value: "good", label: "Good - Minor scratches", points: 4 },
                { value: "fair", label: "Fair - Some damage", points: 3 },
                { value: "poor", label: "Poor - Significant damage", points: 2 },
                { value: "very_poor", label: "Very Poor - Major damage", points: 1 }
              ]
            },
            {
              id: "front_right_tire_brand",
              question: "Tire Brand:",
              type: "text"
            }
          ]
        },
        {
          id: "rear_left_tire",
          question: "Rear Left Tire Assessment:",
          type: "section",
          required: true,
          subQuestions: [
            {
              id: "rear_left_no_damage",
              question: "No damage to tire or rim",
              type: "checkbox",
              options: [
                { value: "no_damage", label: "No damage to tire or rim", points: 5 }
              ]
            },
            {
              id: "rear_left_sidewall_damage",
              question: "Sidewall Damage:",
              type: "radio",
              options: [
                { value: "none", label: "No sidewall damage", points: 0 },
                { value: "minor", label: "Minor scratches/scuffs", points: -1 },
                { value: "moderate", label: "Moderate damage", points: -2 },
                { value: "severe", label: "Severe damage", points: -3 }
              ]
            },
            {
              id: "rear_left_tread_depth",
              question: "Tread Depth (32nds of an inch):",
              type: "number"
            },
            {
              id: "rear_left_rim_condition",
              question: "Condition of Rim:",
              type: "radio",
              options: [
                { value: "excellent", label: "Excellent - No damage", points: 5 },
                { value: "good", label: "Good - Minor scratches", points: 4 },
                { value: "fair", label: "Fair - Some damage", points: 3 },
                { value: "poor", label: "Poor - Significant damage", points: 2 },
                { value: "very_poor", label: "Very Poor - Major damage", points: 1 }
              ]
            },
            {
              id: "rear_left_tire_brand",
              question: "Tire Brand:",
              type: "text"
            }
          ]
        },
        {
          id: "rear_right_tire",
          question: "Rear Right Tire Assessment:",
          type: "section",
          required: true,
          subQuestions: [
            {
              id: "rear_right_no_damage",
              question: "No damage to tire or rim",
              type: "checkbox",
              options: [
                { value: "no_damage", label: "No damage to tire or rim", points: 5 }
              ]
            },
            {
              id: "rear_right_sidewall_damage",
              question: "Sidewall Damage:",
              type: "radio",
              options: [
                { value: "none", label: "No sidewall damage", points: 0 },
                { value: "minor", label: "Minor scratches/scuffs", points: -1 },
                { value: "moderate", label: "Moderate damage", points: -2 },
                { value: "severe", label: "Severe damage", points: -3 }
              ]
            },
            {
              id: "rear_right_tread_depth",
              question: "Tread Depth (32nds of an inch):",
              type: "number"
            },
            {
              id: "rear_right_rim_condition",
              question: "Condition of Rim:",
              type: "radio",
              options: [
                { value: "excellent", label: "Excellent - No damage", points: 5 },
                { value: "good", label: "Good - Minor scratches", points: 4 },
                { value: "fair", label: "Fair - Some damage", points: 3 },
                { value: "poor", label: "Poor - Significant damage", points: 2 },
                { value: "very_poor", label: "Very Poor - Major damage", points: 1 }
              ]
            },
            {
              id: "rear_right_tire_brand",
              question: "Tire Brand:",
              type: "text"
            }
          ]
        },
        {
          id: "spare_tire_assessment",
          question: "Spare Tire Assessment (if applicable):",
          type: "section",
          required: false,
          subQuestions: [
            {
              id: "spare_tire_present",
              question: "Spare tire present:",
              type: "radio",
              options: [
                { value: "yes", label: "Yes", points: 2 },
                { value: "no", label: "No", points: -1 },
                { value: "na", label: "Not applicable", points: 0 }
              ]
            },
            {
              id: "spare_tire_condition",
              question: "Spare tire condition:",
              type: "radio",
              options: [
                { value: "excellent", label: "Excellent - Like new", points: 3 },
                { value: "good", label: "Good - Adequate", points: 2 },
                { value: "fair", label: "Fair - Some wear", points: 1 },
                { value: "poor", label: "Poor - Low tread", points: 0 },
                { value: "very_poor", label: "Very Poor - Unsafe", points: -1 }
              ]
            },
            {
              id: "spare_tire_brand",
              question: "Spare tire brand:",
              type: "text"
            }
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
  
  // Electric vehicle inspection sections
  export const electricVehicleSections = [
    {
      id: "exterior",
      name: "Exterior Condition",
      icon: CarIcon,
      description: "Comprehensive exterior vehicle assessment, including charging-port area",
      questions: [
        {
          id: "paint_condition",
          question: "What is the overall paint condition?  ",
          type: "radio",
          required: true,
          options: [
            { value: "excellent", label: "Excellent – No visible damage (+5)", points: 5 },
            { value: "good", label: "Good – Minor scratches/swirls (+4)", points: 4 },
            { value: "fair", label: "Fair – Some scratches/dents (+3)", points: 3 },
            { value: "poor", label: "Poor – Significant damage (+2)", points: 2 },
            { value: "very_poor", label: "Very Poor – Major damage (+1)", points: 1 }
          ]
        },
        {
          id: "paint_damage_types",
          question: "If paint is fair or worse, specify damage types:",
          type: "checkbox",
          required: false,
          options: [
            { value: "scratches", label: "Scratches (-1)", points: -1 },
            { value: "dents", label: "Dents (-2)", points: -2 },
            { value: "rust_spots", label: "Rust spots (-3)", points: -3 },
            { value: "paint_fading", label: "Paint fading (-1)", points: -1 },
            { value: "paint_peeling", label: "Paint peeling (-2)", points: -2 },
            { value: "color_mismatch", label: "Color mismatch (-2)", points: -2 }
          ]
        },
        {
          id: "body_panels",
          question: "Are there damaged or mis-aligned body panels?  ",
          type: "radio",
          required: true,
          options: [
            { value: "yes", label: "Yes", points: 0 },
            { value: "no", label: "No", points: 5 }
          ]
        },
        {
          id: "glass_components",
          question: "Check all glass components:",
          type: "radio",
          options: [
            { value: "no_damage", label: "No glass damage - All components in good condition", points: 5 },
            { value: "windshield_cracked", label: "Windshield cracked", points: -3 },
            { value: "windshield_chipped", label: "Windshield chipped", points: -1 },
            { value: "side_windows_damaged", label: "Side windows damaged", points: -2 },
            { value: "rear_window_damaged", label: "Rear window damaged", points: -2 },
            { value: "side_mirrors_damaged", label: "Side mirrors damaged", points: -1 },
            { value: "tint_damaged", label: "Tint damaged", points: -1 }
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
          id: "exterior_lights",
          question: "Are all exterior lights functional?  ",
          type: "radio",
          required: true,
          options: [
            { value: "yes", label: "Yes", points: 5 },
            { value: "no", label: "No", points: 0 }
          ]
        },
        {
          id: "charging_port_condition",
          question: "Charging-port door / connector condition:  ",
          type: "radio",
          required: true,
          options: [
            { value: "excellent", label: "Excellent – No damage (+5)", points: 5 },
            { value: "good", label: "Good – Minor scratches (+4)", points: 4 },
            { value: "fair", label: "Fair – Some wear/damage (+3)", points: 3 },
            { value: "poor", label: "Poor – Significant damage (+2)", points: 2 }
          ]
        },
        {
          id: "bumper_condition",
          question: "Bumper condition assessment:  ",
          type: "radio",
          required: true,
          options: [
            { value: "excellent", label: "Excellent – No visible damage (+5)", points: 5 },
            { value: "good", label: "Good – Minor scratches/swirls (+4)", points: 4 },
            { value: "fair", label: "Fair – Some scratches/dents (+3)", points: 3 },
            { value: "poor", label: "Poor – Significant damage (+2)", points: 2 },
            { value: "very_poor", label: "Very Poor – Major damage (+1)", points: 1 }
          ]
        },
        {
          id: "exterior_photos",
          question: "Take comprehensive exterior photos  ",
          type: "photo",
          required: true
        }
      ]
    },
    {
      id: "interior",
      name: "Interior Condition",
      icon: CarFrontIcon,
      description: "Interior cleanliness, comfort, and feature functionality",
      questions: [
        {
          id: "seat_condition",
          question: "Seat condition:  ",
          type: "radio",
          required: true,
          options: [
            { value: "excellent", label: "Excellent (+5)", points: 5 },
            { value: "good", label: "Good (+4)", points: 4 },
            { value: "fair", label: "Fair (+3)", points: 3 },
            { value: "poor", label: "Poor (+2)", points: 2 },
            { value: "very_poor", label: "Very Poor (+1)", points: 1 }
          ]
        },
        {
          id: "seat_damage_types",
          question: "If seats have damage, specify types:",
          type: "checkbox",
          required: false,
          options: [
            { value: "tears", label: "Tears (-2)", points: -2 },
            { value: "stains", label: "Stains (-1)", points: -1 },
            { value: "broken_adjustments", label: "Broken adjustments (-2)", points: -2 },
            { value: "worn_bolstering", label: "Worn bolstering (-1)", points: -1 },
            { value: "broken_springs", label: "Broken springs (-3)", points: -3 }
          ]
        },
        {
          id: "dashboard_condition",
          question: "Dashboard & instrument panel condition:  ",
          type: "radio",
          required: true,
          options: [
            { value: "excellent", label: "Excellent (+5)", points: 5 },
            { value: "good", label: "Good (+4)", points: 4 },
            { value: "fair", label: "Fair (+3)", points: 3 },
            { value: "poor", label: "Poor (+2)", points: 2 }
          ]
        },
        {
          id: "interior_features",
          question: "Check interior features functionality:",
          type: "checkbox",
          required: false,
          options: [
            { value: "ac", label: "A/C (+2)", points: 2 },
            { value: "heater", label: "Heater (+2)", points: 2 },
            { value: "power_windows", label: "Power windows (+1)", points: 1 },
            { value: "power_locks", label: "Power locks (+1)", points: 1 },
            { value: "cruise_control", label: "Cruise control (+1)", points: 1 },
            { value: "infotainment", label: "Infotainment / touchscreen (+2)", points: 2 },
            { value: "backup_camera", label: "Backup / 360 camera (+1)", points: 1 },
            { value: "bluetooth", label: "Bluetooth (+1)", points: 1 },
            { value: "adas_buttons", label: "ADAS buttons responding (+1)", points: 1 }
          ]
        },
        {
          id: "interior_cleanliness",
          question: "Rate interior cleanliness:  ",
          type: "rating",
          required: true,
          maxRating: 5
        },
        {
          id: "unusual_odors",
          question: "Are there any unusual odors?",
          type: "radio",
          required: true,
          options: [
            { value: "yes", label: "Yes", points: 0 },
            { value: "no", label: "No", points: 5 }
          ]
        },
        {
          id: "odometer_reading",
          question: "Current odometer reading (mi):  ",
          type: "number",
          required: true
        },
        {
          id: "interior_photos",
          question: "Take comprehensive interior photos  ",
          type: "photo",
          required: true
        }
      ]
    },
    {
      id: "battery_drive_system",
      name: "Battery & Drive System",
      icon: ZapIcon,
      description: "High-voltage components, drivetrain, and charging readiness",
      questions: [
        {
          id: "vehicle_power_on",
          question: "Does the vehicle power on and shift to Drive/Reverse properly?  ",
          type: "radio",
          required: true,
          options: [
            { value: "yes", label: "Yes (+5)", points: 5 },
            { value: "no", label: "No (0)", points: 0 }
          ]
        },
        {
          id: "warning_lights",
          question: "Any high-voltage or drivetrain warning lights?  ",
          type: "radio",
          required: true,
          options: [
            { value: "yes", label: "Yes (-3)", points: -3 },
            { value: "no", label: "No (+3)", points: 3 }
          ]
        },
        {
          id: "battery_health",
          question: "Battery State-of-Health reading (%):  ",
          type: "number",
          required: true
        },
        {
          id: "battery_age",
          question: "Battery age (years or date code):",
          type: "text",
          required: false
        },
        {
          id: "battery_coolant",
          question: "Battery coolant level & condition:  ",
          type: "radio",
          required: true,
          options: [
            { value: "proper_clean", label: "Proper level & clean (+5)", points: 5 },
            { value: "low_level", label: "Low level (+2)", points: 2 },
            { value: "dirty_contaminated", label: "Dirty/contaminated (+1)", points: 1 },
            { value: "visible_leaks", label: "Visible leaks (-2)", points: -2 }
          ]
        },
        {
          id: "motor_noises",
          question: "Any unusual noises from electric motors / drive unit?  ",
          type: "radio",
          required: true,
          options: [
            { value: "yes", label: "Yes (-2)", points: -2 },
            { value: "no", label: "No (+2)", points: 2 }
          ]
        },
        {
          id: "charging_connectivity",
          question: "Charging-port connectivity test passed?  ",
          type: "radio",
          required: true,
          options: [
            { value: "yes", label: "Yes (+3)", points: 3 },
            { value: "no", label: "No (0)", points: 0 }
          ]
        },
        {
          id: "charging_cable",
          question: "Charging cable / mobile EVSE included by owner?  ",
          type: "radio",
          required: true,
          options: [
            { value: "oem_cable", label: "OEM cable (+5)", points: 5 },
            { value: "aftermarket_cable", label: "Aftermarket cable (+4)", points: 4 },
            { value: "no_cable", label: "No cable (0)", points: 0 }
          ]
        },
        {
          id: "high_voltage_damage",
          question: "Visible damage to high-voltage cables or battery enclosure?",
          type: "radio",
          required: true,
          options: [
            { value: "yes", label: "Yes (-3)", points: -3 },
            { value: "no", label: "No (+3)", points: 3 }
          ]
        },
        {
          id: "battery_notes",
          question: "Additional Notes",
          type: "text",
          required: false
        }
      ]
    },
    {
      id: "tires_wheels",
      name: "Tires & Wheels",
      icon: CarIcon,
      description: "Tread depth, damage, and wheel condition",
      questions: [      
        {
          id: "tread_depth",
          question: "Tread depth measurements (32nds):",
          type: "text",
          required: false
        },
        {
          id: "tire_damage",
          question: "Check for tire damage:",
          type: "checkbox",
          required: false,
          options: [
            { value: "sidewall_damage", label: "Sidewall damage", points: -3 },
            { value: "cracks", label: "Cracks", points: -2 },
            { value: "bulges", label: "Bulges", points: -3 },
            { value: "punctures", label: "Punctures", points: -2 }
          ]
        },
        {
          id: "wheel_condition",
          question: "Wheel face condition:  ",
          type: "radio",
          required: true,
          options: [
            { value: "excellent", label: "Excellent – No damage", points: 5 },
            { value: "good", label: "Good – Minor scratches", points: 4 },
            { value: "fair", label: "Fair – Some damage", points: 3 },
            { value: "poor", label: "Poor – Significant damage", points: 2 },
            { value: "very_poor", label: "Very Poor – Major damage", points: 1 }
          ]
        },
        {
          id: "tire_photos",
          question: "Take photos of all four tires and wheels  ",
          type: "photo",
          required: true
        }
      ]
    },
    {
      id: "electrical_technology",
      name: "Electrical & Technology Systems",
      icon: ZapIcon,
      description: "12 V system, infotainment, and advanced features",
      questions: [
        {
          id: "auxiliary_battery",
          question: "12 V auxiliary battery condition:  ",
          type: "radio",
          required: true,
          options: [
            { value: "excellent", label: "Excellent (+5)", points: 5 },
            { value: "good", label: "Good (+4)", points: 4 },
            { value: "fair", label: "Fair (+2)", points: 2 },
            { value: "poor_dead", label: "Poor/Dead (0)", points: 0 }
          ]
        },
        {
          id: "dc_converter",
          question: "DC/DC converter (charging system) working properly?  ",
          type: "radio",
          required: true,
          options: [
            { value: "yes", label: "Yes (+3)", points: 3 },
            { value: "no", label: "No (0)", points: 0 }
          ]
        },
        {
          id: "electronic_features",
          question: "Test electronic features:",
          type: "checkbox",
          required: false,
          options: [
            { value: "horn", label: "Horn (+1)", points: 1 },
            { value: "wipers", label: "Wipers (+1)", points: 1 },
            { value: "defroster", label: "Defroster (+1)", points: 1 },
            { value: "interior_lights", label: "Interior lights (+1)", points: 1 },
            { value: "power_seats", label: "Power seats (+1)", points: 1 },
            { value: "heated_seats", label: "Heated seats (+1)", points: 1 },
            { value: "remote_start", label: "Remote start/app control (+1)", points: 1 }
          ]
        },
        {
          id: "electronic_faults",
          question: "Any electronic/infotainment faults present?",
          type: "radio",
          required: true,
          options: [
            { value: "yes", label: "Yes (-2)", points: -2 },
            { value: "no", label: "No (+2)", points: 2 }
          ]
        },
        {
          id: "electrical_notes",
          question: "Additional Notes",
          type: "text",
          required: false
        }
      ]
    },
    {
      id: "brake_system",
      name: "Brake System",
      icon: CarIcon,
      description: "Pedal feel, hydraulic brakes, and regenerative braking",
      questions: [
        {
          id: "brake_pedal_feel",
          question: "Brake pedal feel:  ",
          type: "radio",
          required: true,
          options: [
            { value: "firm", label: "Firm (+5)", points: 5 },
            { value: "slightly_soft", label: "Slightly soft (+3)", points: 3 },
            { value: "very_soft_spongy", label: "Very soft/spongy (+1)", points: 1 },
            { value: "goes_to_floor", label: "Goes to floor (0)", points: 0 }
          ]
        },
        {
          id: "regenerative_braking",
          question: "Regenerative braking functioning properly?  ",
          type: "radio",
          required: true,
          options: [
            { value: "yes", label: "Yes (+5)", points: 5 },
            { value: "reduced", label: "Reduced (+2)", points: 2 },
            { value: "inoperative", label: "Inoperative (0)", points: 0 }
          ]
        },
        {
          id: "brake_performance",
          question: "Brake performance during low-speed test:  ",
          type: "radio",
          required: true,
          options: [
            { value: "excellent", label: "Excellent (+5)", points: 5 },
            { value: "good", label: "Good (+4)", points: 4 },
            { value: "fair", label: "Fair (+2)", points: 2 },
            { value: "poor", label: "Poor (0)", points: 0 }
          ]
        },
        {
          id: "parking_brake",
          question: "Parking brake functionality:  ",
          type: "radio",
          required: true,
          options: [
            { value: "working", label: "Working (+5)", points: 5 },
            { value: "weak", label: "Weak (+2)", points: 2 },
            { value: "not_working", label: "Not working (0)", points: 0 }
          ]
        },
        {
          id: "brake_noises",
          question: "Any brake noises?  ",
          type: "radio",
          required: true,
          options: [
            { value: "yes", label: "Yes (-2)", points: -2 },
            { value: "no", label: "No (+2)", points: 2 }
          ]
        },
        {
          id: "brake_notes",
          question: "Additional Notes",
          type: "text",
          required: false
        }
      ]
    },
    {
      id: "undercarriage_frame",
      name: "Undercarriage & Frame",
      icon: CarIcon,
      description: "Frame integrity, suspension, and battery-pack enclosure",
      questions: [
        {
          id: "frame_condition",
          question: "Frame condition:  ",
          type: "radio",
          required: true,
          options: [
            { value: "excellent", label: "Excellent (+5)", points: 5 },
            { value: "good", label: "Good (+4)", points: 4 },
            { value: "fair", label: "Fair (+3)", points: 3 },
            { value: "poor", label: "Poor (+1)", points: 1 },
            { value: "very_poor", label: "Very Poor (0)", points: 0 }
          ]
        },
        {
          id: "battery_enclosure",
          question: "Battery-pack enclosure condition:  ",
          type: "radio",
          required: true,
          options: [
            { value: "no_damage", label: "No damage (+5)", points: 5 },
            { value: "minor_scuffs", label: "Minor scuffs (+4)", points: 4 },
            { value: "surface_corrosion", label: "Surface corrosion (+3)", points: 3 },
            { value: "dents_impact", label: "Dents/impact marks (+2)", points: 2 },
            { value: "structural_damage", label: "Structural damage (0)", points: 0 }
          ]
        },
        {
          id: "rust_assessment",
          question: "Rust assessment:",
          type: "radio",
          required: true,
          options: [
            { value: "surface_rust", label: "Surface rust only (-1)", points: -1 },
            { value: "rust_holes", label: "Rust holes (-5)", points: -5 },
            { value: "no_rust", label: "No visible rust (+2)", points: 2 }
          ]
        },
        {
          id: "suspension_condition",
          question: "Suspension condition:  ",
          type: "radio",
          required: true,
          options: [
            { value: "excellent", label: "Excellent (+5)", points: 5 },
            { value: "good", label: "Good (+4)", points: 4 },
            { value: "fair", label: "Fair (+3)", points: 3 },
            { value: "poor", label: "Poor (+1)", points: 1 }
          ]
        },
        {
          id: "suspension_issues",
          question: "Suspension issues:",
          type: "checkbox",
          required: false,
          options: [
            { value: "leaking_struts", label: "Leaking struts (-2)", points: -2 },
            { value: "excessive_bounce", label: "Excessive bounce (-2)", points: -2 },
            { value: "suspension_noise", label: "Suspension noise (-1)", points: -1 },
            { value: "uneven_ride_height", label: "Uneven ride height (-2)", points: -2 }
          ]
        },
        {
          id: "undercarriage_photos",
          question: "Take photos of undercarriage & battery pack  ",
          type: "photo",
          required: true
        }
      ]
    },
    {
      id: "owner_question",
      name: "Mandatory Owner Question",
      icon: UserIcon,
      description: "Charging equipment availability",
      questions: [
        {
          id: "charging_equipment",
          question: "Do you have the factory charging cable or home charging device available to include in the sale?  ",
          type: "radio",
          required: true,
          options: [
            { value: "yes_oem", label: "Yes (OEM)", points: 5 },
            { value: "yes_aftermarket", label: "Yes (Aftermarket)", points: 4 },
            { value: "no", label: "No", points: 0 }
          ]
        }
      ]
    }
  ];
  
