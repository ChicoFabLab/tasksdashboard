// Course/Goal types and data for Chico Fab Lab SBU (Safety Basic Use) certifications
// Based on actual SBU documentation from chicofablab.org

export interface Course {
  id: string;
  title: string;
  category: '3D Printing' | 'Laser' | 'Electronics' | 'Woodshop' | 'CNC' | 'Vinyl';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimated_minutes: number;
  description: string;
  icon: string;
  zoneLeader: string;
  sbuSchedule: string;
  steps: CourseStep[];
  prerequisites?: string[];
}

export interface CourseStep {
  step: number;
  title: string;
  description: string;
  safetyNote?: string;
}

// Chico Fab Lab Zone SBU Certifications
export const MAKERSPACE_COURSES: Course[] = [
  // 3D Printing Zone - Zone Leader: Jay
  {
    id: '3d-printing-sbu',
    title: '3D Printing Zone SBU',
    category: '3D Printing',
    difficulty: 'Beginner',
    estimated_minutes: 60,
    description: 'Safety & Basic Use certification for FFF 3D printers (Ultimaker). Required before independent use.',
    icon: '🖨️',
    zoneLeader: 'Jay',
    sbuSchedule: 'Thursday @ 5:30pm',
    steps: [
      {
        step: 1,
        title: 'Understand Hot End Safety',
        description: 'The hot-end heats to over 220°C (428°F) to melt plastic filament. Never touch the hot-end, heat block, or nozzle when heated or recently used.',
        safetyNote: '🔥 Hot-end reaches 428°F! It stays hot after turning off. Burns are severe!'
      },
      {
        step: 2,
        title: 'Learn Filament Types',
        description: 'PLA (biodegradable, strong but brittle, ~240°C), ABS (needs heated bed), specialty filaments (Laywood, LayBrick, EcoFlex). Each filament has specific diameter (usually 2.82-2.85mm measured) and temperature requirements.',
      },
      {
        step: 3,
        title: 'Prepare Build Platform',
        description: 'Apply blue painter\'s tape (Duck brand "Clean Release") to platform with NO overlap and minimal gaps. Single layer coverage is critical for first layer adhesion.',
      },
      {
        step: 4,
        title: 'Level the Bed',
        description: 'Platform must be level to hot-end across all corners. Use folded paper test - hot-end should just drag on paper. Level all 4 corners. Proper leveling prevents failed prints.',
      },
      {
        step: 5,
        title: 'Load/Unload Filament Safely',
        description: 'ONLY load/unload when hot-end is heated to ~210°C. Clip filament end clean. Feed through bowden tube into hot-end. Extrude until plastic flows from nozzle. NEVER force cold filament!',
        safetyNote: '⚠️ Forcing filament when cold will damage the extruder!'
      },
      {
        step: 6,
        title: 'Use Cura Slicer Software',
        description: 'Load STL file from Thingiverse or your design. Set filament diameter and temperature. Configure supports, brim, or raft if needed. Slice to generate G-code. Save to SD card.',
      },
      {
        step: 7,
        title: 'Attend SBU with Zone Leader Jay',
        description: 'Attend Thursday @ 5:30pm SBU session OR contact Zone Leader Jay to schedule certification. Bring questions about your first print project!',
      },
      {
        step: 8,
        title: 'Complete Hands-On Certification',
        description: 'Demonstrate: safe filament loading, bed leveling, slicing a model, starting a print, monitoring first layer, removing finished print. Zone Leader Jay must certify you.',
        safetyNote: '✅ MANDATORY certification before any independent 3D printing'
      }
    ]
  },

  // Laser Zone - Zone Leaders: Preston & Joe
  {
    id: 'laser-sbu',
    title: 'Laser Cutter Safety & Basic Use',
    category: 'Laser',
    difficulty: 'Beginner',
    estimated_minutes: 75,
    description: '100W Red Sail KH-7050 Laser certification. ABSOLUTELY MANDATORY before any laser use.',
    icon: '⚡',
    zoneLeader: 'Preston & Joe',
    sbuSchedule: 'Wednesday @ 4:00pm',
    steps: [
      {
        step: 1,
        title: 'CRITICAL: Never Leave Laser Unattended',
        description: 'Rule #1: Always have someone watching the laser while it runs. Pause the machine or ask someone to watch if you need to leave. Small flames/sparks are normal, large flames are DANGER.',
        safetyNote: '🔴 FIRE RISK: Materials can ignite. You are the fire watch. Never walk away during a cut!'
      },
      {
        step: 2,
        title: 'KNOW APPROVED MATERIALS ONLY',
        description: 'SAFE: Paper, acrylic, wood (watch for fire), many fabrics, leather, cotton, glass, anodized metal, linoleum, speedy-cut rubber. Check if unsure - ask zone leaders!',
      },
      {
        step: 3,
        title: 'NEVER CUT THESE MATERIALS',
        description: 'PVC/Polyvinyl Chloride, vinyl, pleather, artificial leather, Moleskine notebooks, polycarbonate (Lexan) >1/16", ABS, HDPE, polystyrene foam, polypropylene foam.',
        safetyNote: '☠️ DEADLY: PVC releases hydrogen chloride (poison gas) and benzene (carcinogen). Will KILL YOU and DESTROY the $10,000 laser optics!'
      },
      {
        step: 4,
        title: 'Fire Safety Procedures',
        description: 'Know fire extinguisher location. Understand how to stop laser (Pause button, Cancel button, or LightBurn pause). If fire occurs: stop laser, blow out flames or use fire blanket, only use extinguisher if fire is out of control.',
        safetyNote: '⚠️ Fire extinguisher damages laser - only use for serious fires!'
      },
      {
        step: 5,
        title: 'Power Limit & Machine Care',
        description: 'DO NOT GO ABOVE 65% POWER OR YOU WILL DAMAGE THE LASER TUBE! Turn off power strip when done (don\'t waste laser tube life). Close lid gently - it\'s a finely calibrated machine. Don\'t lean on or press the screen.',
        safetyNote: '🚫 Above 65% power = permanent laser tube damage costing thousands!'
      },
      {
        step: 6,
        title: 'Learn LightBurn Software',
        description: 'Import DXF (vectors) or JPG/PNG (images). Assign power/speed by color. Vectors cut through, rasters engrave. Use Frame to check alignment. Three ways to send files: START (immediate), SAVE (.lbrn), SEND (to laser memory).',
      },
      {
        step: 7,
        title: 'Set Bed Height (Focus)',
        description: 'Use red acrylic height tool (20mm) hanging on laser door. Adjust bed height using "Lifting Platform" (up) and "Drop Platform" (down) buttons until tool fits between material and cone-shaped lens housing.',
      },
      {
        step: 8,
        title: 'Attend MANDATORY SBU Session',
        description: 'Attend Wednesday @ 4:00pm SBU with Zone Leaders Preston and Joe. This is MANDATORY certification - NO exceptions due to extreme danger.',
      },
      {
        step: 9,
        title: 'Supervised Laser Certification',
        description: 'Under zone leader supervision, demonstrate: material selection check, proper focus, power settings <65%, constant fire watch, emergency stop procedures. Must be certified before ANY independent use.',
        safetyNote: '✅ Lives and equipment depend on 100% compliance. You MUST be certified.'
      }
    ]
  },

  // Electronics Zone - Zone Leader: Miloh (was Sam Reinthaler)
  {
    id: 'electronics-sbu',
    title: 'Electronics Zone SBU',
    category: 'Electronics',
    difficulty: 'Beginner',
    estimated_minutes: 60,
    description: 'Safety & Basic Use for soldering irons, hot air tools, power supplies, oscilloscope, multimeter, and logic analyzer.',
    icon: '🔌',
    zoneLeader: 'Miloh',
    sbuSchedule: 'Monday @ 5:00pm',
    steps: [
      {
        step: 1,
        title: 'Rule #1: Common Sense',
        description: 'IF YOU AREN\'T SURE HOW SOMETHING WORKS DON\'T USE IT. Ask zone leader or experienced members. Better to ask than damage equipment or get hurt.',
        safetyNote: '⚠️ When in doubt, ASK!'
      },
      {
        step: 2,
        title: 'Eye Protection Required',
        description: 'Wear safety glasses when: soldering (solder spatters), clipping leads (fly in random directions), powering new circuits (capacitors can EXPLODE if backward/overvoltage).',
        safetyNote: '💥 Electrolytic capacitors explode when installed backwards or overvoltaged!'
      },
      {
        step: 3,
        title: 'Soldering Iron Safety',
        description: 'SOLDERING IRONS ARE HOT (750°F typical). They stay hot after unplugging. Always use the stand. Don\'t use too much solder (spatters more). Wear eye protection. This is NOT a lead-free station - wash hands after!',
        safetyNote: '🔥 Iron stays hot long after unplugging. Hot iron looks identical to cold iron!'
      },
      {
        step: 4,
        title: 'Soldering Technique',
        description: 'Clean tip with sponge or metal sponge. Use flux to help solder stick. Temperature usually 750°F (higher for desoldering/silver solder). Learn solder types: lead, lead-free/silver, rosin core. Desoldering: use braid or sucker.',
      },
      {
        step: 5,
        title: 'Hot Air Tool Safety',
        description: 'Keep pointed away from flammable/meltable materials. Put in stand when not using. Move around while using to spread heat. Turn air flow up after turning off heat to cool faster.',
      },
      {
        step: 6,
        title: 'Power Supply & Meter Safety',
        description: 'Power Supply: Don\'t short. Use correct voltage. Wear eye protection for new circuits. Oscilloscope/Multimeter: Don\'t exceed ratings on faceplate. Use only banana plug connectors in terminals.',
        safetyNote: '⚠️ High voltage projects (>25VAC or >60VDC) MUST be approved by zone manager!'
      },
      {
        step: 7,
        title: 'Cleanup & Maintenance',
        description: 'THROW AWAY garbage. SWEEP workbench. PUT AWAY tools. TURN OFF all soldering irons if leaving. TURN OFF all equipment if leaving >10 minutes. Don\'t leave project materials - they will be thrown away.',
      },
      {
        step: 8,
        title: 'Attend SBU with Zone Leader Miloh',
        description: 'Join Electronics SBU Monday @ 5:00pm OR contact Zone Leader Miloh for certification. Explore the Free-to-Hack bin for practice components!',
      },
      {
        step: 9,
        title: 'Hands-On Certification',
        description: 'Demonstrate safe soldering technique, proper tool use (multimeter, power supply), safety awareness, and cleanup procedures. Zone Leader Miloh must certify you.',
        safetyNote: '✅ Certification required before independent electronics work'
      }
    ]
  },

  // Woodshop Zone - Zone Leader: Paul
  {
    id: 'woodshop-sbu',
    title: 'Woodshop Zone SBU',
    category: 'Woodshop',
    difficulty: 'Beginner',
    estimated_minutes: 90,
    description: 'Safety & Basic Use for all woodworking power tools. NEVER use machines without mandatory training from zone manager.',
    icon: '🪚',
    zoneLeader: 'Paul (Looking for maintenance/cleanup help!)',
    sbuSchedule: 'Tuesday @ 5:00pm',
    steps: [
      {
        step: 1,
        title: 'Critical Safety Mindset',
        description: '80% of woodshop accidents happen to EXPERIENCED workers who get casual/negligent! NEVER be afraid to ask for help. NEVER use a new machine without mandatory training. Woodshop can be very dangerous, even deadly, if safety is ignored.',
        safetyNote: '⚠️ Experience ≠ Safety. Complacency kills. When in doubt, ASK ZONE MANAGER!'
      },
      {
        step: 2,
        title: 'Required Safety Gear',
        description: 'ALWAYS wear safety glasses or face shield. Tie back long hair. Remove jewelry and watches. No loose clothing. Wear closed-toe shoes. Respirator recommended for fine dust. Shop apron OK if snugly tied.',
        safetyNote: 'Eye protection MANDATORY for all operations. Prolonged dust exposure causes cancer!'
      },
      {
        step: 3,
        title: 'Table Saw Safety Rules',
        description: 'Zone manager approval required. Blade 1/4" above stock. Stand to one side. Maintain 4" margin of safety - NEVER closer to blade! Use push sticks/blocks. NEVER cut stock free hand. NEVER reach over blade. Use red zero-clearance plate for angled cuts.',
        safetyNote: '🚫 Table saw causes life-changing injuries in milliseconds. 4" margin minimum!'
      },
      {
        step: 4,
        title: 'General Power Tool Safety',
        description: 'Let machine reach full speed before cutting. Feed only as fast as machine easily cuts. NEVER remove safety guards without zone manager permission. Stop if machine sounds/smells/feels wrong. Unplug before adjustments/blade changes.',
        safetyNote: 'Sharp tools are SAFER than dull tools. Report dull blades immediately!'
      },
      {
        step: 5,
        title: 'Dust Collection MANDATORY',
        description: 'ALWAYS connect dust collection before using power tools. Wood dust causes respiratory disease and cancer. Dust is also fire/explosion hazard. Sweep/vacuum after EACH project including nails/screws/debris.',
        safetyNote: '⚠️ Wood dust is serious health hazard. Use dust collection and respirator!'
      },
      {
        step: 6,
        title: 'Specific Tool Safety',
        description: 'Band Saw: Upper guide 1/4" above work, 2" margin of safety. Jointer: Max 1/8" cut, stock min 3/8" thick, 4" margin, use push block. Drill Press: Clamp small pieces, center punch metal. Planer: Stock min 12" long, max 1/16" per pass. Router: Feed against rotation, clamp stock.',
      },
      {
        step: 7,
        title: 'Shop Organization & Fire Safety',
        description: 'Keep bench organized. Vacuum hose on all tools. Know fire extinguisher and first aid kit locations. No flammable liquids without staff permission. Wet oily rags with water, store in plastic bag, take off-site for washing.',
        safetyNote: 'Oily rags can spontaneously combust! Wet them and remove from building!'
      },
      {
        step: 8,
        title: 'Material & Project Storage',
        description: 'No gluing/painting in woodshop (use Zombie Room/Spray Booth after their SBUs). Label projects with name and pickup date. No project materials left on bench - will be thrown away. Straighten lumber rack after use.',
      },
      {
        step: 9,
        title: 'Attend SBU with Zone Leader Paul',
        description: 'Attend Tuesday @ 5:00pm SBU OR contact Zone Leader Paul. The woodshop is looking for volunteers to help with maintenance and cleanup!',
      },
      {
        step: 10,
        title: 'Tool-by-Tool Certification',
        description: 'Under Paul\'s supervision, demonstrate safe operation of: table saw, band saw, jointer, planer, drill press, miter saw, sanders, router. Show understanding of safety margins, guards, emergency stops. Get certified.',
        safetyNote: '✅ MANDATORY certification for each power tool before independent use'
      }
    ]
  },

  // CNC Shopbot Zone - Zone Leader: Steve
  {
    id: 'cnc-shopbot-sbu',
    title: 'Shopbot CNC Router SBU',
    category: 'CNC',
    difficulty: 'Intermediate',
    estimated_minutes: 120,
    description: 'Safety & Basic Use for the Shopbot CNC router. Advanced certification - requires woodshop knowledge.',
    icon: '🤖',
    zoneLeader: 'Steve',
    sbuSchedule: 'On Demand - Contact Steve',
    steps: [
      {
        step: 1,
        title: 'CNC Router Overview',
        description: 'Computer-controlled router for cutting wood, composites, plastics. Similar to laser/3D printer axis system but with router bit moving sideways through material. Can carve 2D profiles or 3D models.',
      },
      {
        step: 2,
        title: 'PPE & CNC Safety Rules',
        description: 'Wear: eye protection, ear protection, closed-toe shoes. Tie back hair. No loose clothing/jewelry. Keep hands/eyes/hair away when operating. NEVER hold parts with hands that may come loose. Know emergency stops: SPACEBAR on keyboard or Pause button.',
        safetyNote: '⚠️ ALWAYS be near spacebar to emergency stop if problems arise!'
      },
      {
        step: 3,
        title: 'Choose the Right Bit',
        description: 'Bit types: Straight flute (all-around), Up-cut (deep cuts, chips pulled up), Down-cut (smooth top surface), Compression (great for plywood). Flutes = cutting edges (1-3 flutes common). Use largest shank, shortest length. Inspect for wear/cracks.',
        safetyNote: 'Buy quality bits. Inspect before EVERY use. Replace if dull/damaged/cracked!'
      },
      {
        step: 4,
        title: 'Secure Material to Spoil Board',
        description: 'Use composite nail gun (plastic nails won\'t shatter bit) or screws. Small pieces: one nail per corner. Large sheets: nails every few feet. Material must be flat (not bowing) and level. Build custom hold-downs for odd shapes.',
        safetyNote: '🚫 Unsecured material becomes a dangerous projectile at high speed!'
      },
      {
        step: 5,
        title: 'Create Toolpath in PartWorks',
        description: 'Import DXF/PDF/EPS file. Define material size and zero point. Create toolpath: V-Carve (signs/text), Profile (cut shapes with tabs), Pocket (cavities), Drilling. Set: Step Down (≤bit radius), Step Over (≤bit radius), Spindle Speed (~12,000 RPM for wood), Feed Rate (start 1-2 in/sec), Plunge Rate (0.5-1 in/sec). Save .sbp toolpath.',
      },
      {
        step: 6,
        title: 'Zero the Machine',
        description: 'Turn on Motor Driver Box, open Shopbot3 software. Press "K" for keyboard control. Move to zero point with arrow keys (PgUp/PgDn for Z). Type "Z2" to zero X/Y. For Z-axis: attach alligator clip to bit, place Z-plate under bit, type "C2". Bit auto-zeros accounting for plate thickness. REMOVE clip and plate!',
        safetyNote: 'CRITICAL: Remove alligator clip and Z-plate before running cut!'
      },
      {
        step: 7,
        title: 'Run the Cut Safely',
        description: 'Open toolpath file. Turn on dust collector. Set router speed dial. Turn on router (red switch). Clear all objects/people from machine. Press START. Listen for changes in sound. Stay near spacebar for emergency stop.',
        safetyNote: 'NEVER cut deeper than bit radius in single pass! Make multiple passes for safety!'
      },
      {
        step: 8,
        title: 'Collet Maintenance',
        description: 'Tighten collet securely (threaded piece holding bit). Check collets frequently - they wear out. Loose collet = poor cuts and bit breakage danger. Unplug router before bit changes.',
      },
      {
        step: 9,
        title: 'Contact Zone Leader Steve',
        description: 'CNC is ON DEMAND certification - contact Steve directly to schedule your personalized Shopbot SBU. One-on-one training due to complexity and danger level.',
      },
      {
        step: 10,
        title: 'Hands-On CNC Certification',
        description: 'With Steve: secure material properly, load program, set all zero points, select appropriate bit, run dust collector, execute cut while monitoring, demonstrate emergency stop, safely remove finished piece. Must demonstrate competence.',
        safetyNote: '✅ Advanced equipment. Certification MANDATORY. Proven competence required.'
      }
    ]
  },

  // Vinyl Zone - No current manager
  {
    id: 'vinyl-basic',
    title: 'Vinyl Cutter Basics',
    category: 'Vinyl',
    difficulty: 'Beginner',
    estimated_minutes: 45,
    description: 'Introduction to vinyl cutting and weeding. This zone currently needs a manager - volunteer opportunity!',
    icon: '✂️',
    zoneLeader: 'Zone Manager Wanted - Volunteer!',
    sbuSchedule: 'No Current SBU Schedule',
    steps: [
      {
        step: 1,
        title: 'Vinyl Cutter Overview',
        description: 'Vinyl cutter uses a blade to cut vinyl material for signs, stickers, decals, and heat transfer. Cuts only the vinyl layer, not the backing paper. Requires weeding (removing excess vinyl).',
      },
      {
        step: 2,
        title: 'Design File Preparation',
        description: 'Create vector designs in software like Inkscape, Illustrator, or CorelDraw. Export as SVG or DXF. Simple shapes and text work best. Intricate designs require careful weeding.',
      },
      {
        step: 3,
        title: 'Loading Vinyl & Cutting',
        description: 'Load vinyl roll onto cutter. Adjust blade depth (should cut vinyl, not backing). Set cut speed and pressure. Test cut on scrap first. Monitor the cut.',
      },
      {
        step: 4,
        title: 'Weeding Technique',
        description: 'Use weeding tool to remove unwanted vinyl. Work slowly and carefully. Keep cut vinyl flat to avoid curling. Transfer tape helps keep small pieces together.',
      },
      {
        step: 5,
        title: 'Application & Transfer',
        description: 'Apply transfer tape over vinyl. Burnish well. Peel backing paper. Apply to target surface. Burnish again. Carefully peel transfer tape. Different vinyl types for different applications (adhesive vs. heat transfer).',
      },
      {
        step: 6,
        title: 'Volunteer as Zone Manager!',
        description: 'The Vinyl Zone NEEDS a dedicated zone manager. If you become skilled and enjoy vinyl cutting, consider volunteering to lead this zone! You\'d create SBU materials, schedule sessions, and help grow this area of the makerspace.',
        safetyNote: '🌟 Leadership opportunity! Help build this zone and teach others!'
      }
    ]
  },

  // ========== BEGINNER PROJECT COURSES ==========

  // 3D Printing Projects
  {
    id: '3d-first-print',
    title: 'Your First 3D Print',
    category: '3D Printing',
    difficulty: 'Beginner',
    estimated_minutes: 90,
    description: 'Print your first object! Learn the complete workflow from finding a model to holding your finished print.',
    icon: '🎯',
    zoneLeader: 'Jay',
    sbuSchedule: 'Thursday @ 5:30pm',
    steps: [
      {
        step: 1,
        title: 'Find a Simple Model on Thingiverse',
        description: 'Visit thingiverse.com and search for "calibration cube" or "benchy" - these are classic first prints. Download the STL file. Look for models with good reviews and no support requirements.',
      },
      {
        step: 2,
        title: 'Prepare Build Platform',
        description: 'Apply fresh blue painter\'s tape if needed. Make sure tape has no wrinkles or overlap. Clean surface is critical for first layer adhesion.',
      },
      {
        step: 3,
        title: 'Level the Bed',
        description: 'Use the paper test on all 4 corners. The paper should drag slightly but still move. Re-check after adjustments - changing one corner affects others.',
      },
      {
        step: 4,
        title: 'Load Filament',
        description: 'Heat hot-end to 210°C. Load PLA filament. Extrude until plastic flows smoothly from nozzle. Wipe away excess with paper towel.',
        safetyNote: 'Hot-end is 428°F! Use caution.'
      },
      {
        step: 5,
        title: 'Slice Your Model in Cura',
        description: 'Open Cura software. Load your STL file. Set: Filament diameter (measure or use labeled value ~2.82mm), Temperature (240°C for black PLA), Print speed (30mm/s to start). Layer height 0.2mm. Add skirt. Generate G-code and save to SD card.',
      },
      {
        step: 6,
        title: 'Start Your Print',
        description: 'Insert SD card into printer. Use controller to select file. Press print. WATCH THE FIRST LAYER CAREFULLY - this is critical! First layer should squish slightly onto tape. If it\'s not sticking, stop and re-level.',
        safetyNote: 'Never leave printer unattended during first 30 minutes!'
      },
      {
        step: 7,
        title: 'Monitor and Complete',
        description: 'Check print every 15 minutes. Listen for unusual sounds. After print completes, wait for bed to cool (5-10 min). Gently remove print by flexing tape. Remove any skirt or supports.',
      },
      {
        step: 8,
        title: 'Clean Up',
        description: 'Remove print from bed. Dispose of any scraps. Leave platform clean. If you used significant filament, log it for payment ($1/hour estimate).',
      }
    ]
  },

  {
    id: '3d-custom-design',
    title: 'Design & Print Your Own Object',
    category: '3D Printing',
    difficulty: 'Intermediate',
    estimated_minutes: 120,
    description: 'Create your own 3D design from scratch and print it. Make something uniquely yours!',
    icon: '✏️',
    zoneLeader: 'Jay',
    sbuSchedule: 'Thursday @ 5:30pm',
    steps: [
      {
        step: 1,
        title: 'Learn Tinkercad Basics',
        description: 'Go to tinkercad.com (free, web-based, no download needed). Create account. Complete the built-in tutorials for basic shapes, holes, and grouping. Spend 30 minutes experimenting.',
      },
      {
        step: 2,
        title: 'Design Something Simple',
        description: 'Start with a simple practical object: custom keych ain with your name, phone stand, desk organizer, cable clip. Use basic shapes (cube, cylinder, cone). Keep it under 5cm on each side for first design.',
      },
      {
        step: 3,
        title: 'Export and Check Your Design',
        description: 'Export as STL file. Import into Cura to preview. Check that walls are at least 2mm thick. Make sure it will fit on the print bed. Rotate for best orientation (minimize supports).',
      },
      {
        step: 4,
        title: 'Print Your Design',
        description: 'Follow the same process as "Your First 3D Print". Watch the first layer extra carefully since this is an untested design. Be ready to stop if something looks wrong.',
      },
      {
        step: 5,
        title: 'Evaluate and Iterate',
        description: 'After printing, examine your creation. What worked well? What would you change? Common beginner mistakes: too thin walls, overhangs without support, too detailed for printer resolution. Redesign and print v2 if needed!',
      }
    ]
  },

  // Laser Cutting Projects
  {
    id: 'laser-first-cut',
    title: 'Your First Laser Cut',
    category: 'Laser',
    difficulty: 'Beginner',
    estimated_minutes: 60,
    description: 'Make your first laser cut! Start with a simple design and learn the complete workflow.',
    icon: '🎯',
    zoneLeader: 'Preston & Joe',
    sbuSchedule: 'Wednesday @ 4:00pm',
    steps: [
      {
        step: 1,
        title: 'Choose a Simple Design',
        description: 'Search for free laser cut templates online (thingiverse.com, instructables.com). Look for simple shapes, coasters, bookmarks, or gift tags. Download as SVG or DXF file.',
      },
      {
        step: 2,
        title: 'Select Safe Material',
        description: '1/8" plywood or 3mm acrylic are excellent beginner materials. Start with wood - it\'s more forgiving. Verify material is on approved list. When in doubt, ASK zone leaders!',
        safetyNote: 'NEVER cut PVC/vinyl - releases deadly poison gas!'
      },
      {
        step: 3,
        title: 'Import into LightBurn',
        description: 'Turn on laser machine (main switch). Start computer and open LightBurn software. Import your DXF/SVG file. Position design on workspace.',
      },
      {
        step: 4,
        title: 'Set Power and Speed',
        description: 'For 1/8" plywood: ~20mm/s speed, 55-60% power. For 3mm acrylic: ~10mm/s, 50-55% power. NEVER exceed 65% power! Assign settings by color in Cuts window. Use Frame button to check alignment.',
        safetyNote: '🚫 NEVER go above 65% power - damages laser tube!'
      },
      {
        step: 5,
        title: 'Focus the Laser',
        description: 'Place material on honeycomb bed. Use red acrylic height tool (20mm) - it should fit between material and cone-shaped lens housing. Adjust bed height with Lifting/Drop Platform buttons.',
      },
      {
        step: 6,
        title: 'Execute Your First Cut',
        description: 'Turn on LASER SWITCH (side of machine). Clear area around cut path. Press START on control panel. WATCH CONSTANTLY for flames. Small sparks OK, large flames = PAUSE immediately. You are the fire watch!',
        safetyNote: '🔴 NEVER leave laser unattended! You MUST watch for fires!'
      },
      {
        step: 7,
        title: 'Remove and Clean Up',
        description: 'Wait for laser to finish. Let material cool 30 seconds. Remove your cut piece. Clean up all scraps from laser bed and work area. Use shop vac for small pieces. Empty trash if full. Turn off laser machine.',
      }
    ]
  },

  {
    id: 'laser-custom-design',
    title: 'Design Your Own Laser Project',
    category: 'Laser',
    difficulty: 'Intermediate',
    estimated_minutes: 90,
    description: 'Create an original design in Inkscape or Illustrator and laser cut it.',
    icon: '✏️',
    zoneLeader: 'Preston & Joe',
    sbuSchedule: 'Wednesday @ 4:00pm',
    steps: [
      {
        step: 1,
        title: 'Design in Vector Software',
        description: 'Use Inkscape (free) or Illustrator. Create simple shapes with clean outlines. Remember: cut lines should be thin vectors (hairline width), engrave areas should be filled or images. Export as DXF for best results.',
      },
      {
        step: 2,
        title: 'Test Cut on Scrap First',
        description: 'Always test new designs on scrap material! Test cuts save expensive material and help you dial in settings. Make a small test version before cutting the full size.',
      },
      {
        step: 3,
        title: 'Combine Cutting and Engraving',
        description: 'Try adding engraved text or images to your cut piece. Use different colors in LightBurn for cut vs engrave. Engrave first (lower power), then cut. This prevents pieces from moving.',
      },
      {
        step: 4,
        title: 'Cut Your Final Design',
        description: 'Apply lessons from test cut. Adjust power/speed if needed. Execute full cut while monitoring for fire. Share your finished creation in the Creations gallery!',
      }
    ]
  },

  // Electronics Projects
  {
    id: 'electronics-first-solder',
    title: 'Your First Soldering Project',
    category: 'Electronics',
    difficulty: 'Beginner',
    estimated_minutes: 45,
    description: 'Learn to solder by building a simple LED circuit on perfboard.',
    icon: '🎯',
    zoneLeader: 'Miloh',
    sbuSchedule: 'Monday @ 5:00pm',
    prerequisites: ['electronics-sbu'],
    steps: [
      {
        step: 1,
        title: 'Gather Components',
        description: 'You\'ll need: perfboard, LED (any color), 220Ω resistor (red-red-brown), 9V battery clip, solder. Check the Free-to-Hack bin for practice components!',
      },
      {
        step: 2,
        title: 'Prepare Workspace',
        description: 'Set up soldering iron in stand. Turn on fume extractor. Lay out helping hands/third hand tool. Put on safety glasses. Heat iron to 750°F. Clean tip with brass sponge.',
        safetyNote: '🔥 Iron is 750°F! Always return to stand. Wash hands after - lead solder!'
      },
      {
        step: 3,
        title: 'Bend and Place Components',
        description: 'Bend LED and resistor leads to fit through perfboard holes. LED long lead = positive (+). Place resistor in series with LED. Place components, bend leads on back to hold in place.',
      },
      {
        step: 4,
        title: 'Make Your First Solder Joint',
        description: 'Touch iron tip to BOTH the pad and component lead for 2-3 seconds. Apply solder to the JOINT (not the iron). Feed solder until joint is covered. Remove solder, then iron. Good joint = shiny, concave, volcano-shaped.',
      },
      {
        step: 5,
        title: 'Complete the Circuit',
        description: 'Solder all joints. Connect 9V battery clip: red to LED positive side, black to resistor other end. Trim excess leads with flush cutters. Wear safety glasses - leads fly!',
        safetyNote: '⚠️ Wear eye protection when clipping - leads fly in random directions!'
      },
      {
        step: 6,
        title: 'Test Your Circuit',
        description: 'Connect 9V battery. LED should light up! If not: check polarity (LED direction), check for cold solder joints, verify resistor is in circuit. Clean up: turn off iron, sweep bench, wash hands.',
      }
    ]
  },

  {
    id: 'electronics-arduino-blink',
    title: 'Arduino: Blink Your First LED',
    category: 'Electronics',
    difficulty: 'Beginner',
    estimated_minutes: 60,
    description: 'Program an Arduino to blink an LED - the "Hello World" of microcontrollers.',
    icon: '💡',
    zoneLeader: 'Miloh',
    sbuSchedule: 'Monday @ 5:00pm',
    prerequisites: ['electronics-sbu'],
    steps: [
      {
        step: 1,
        title: 'Set Up Arduino IDE',
        description: 'Download and install Arduino IDE from arduino.cc. Connect Arduino to computer with USB cable. Select board type (Arduino Uno/Nano/etc) in Tools menu. Select correct COM port.',
      },
      {
        step: 2,
        title: 'Load Blink Example',
        description: 'In Arduino IDE: File → Examples → 01.Basics → Blink. This opens pre-written code that blinks the built-in LED. Read through the code to understand what it does.',
      },
      {
        step: 3,
        title: 'Upload and Test',
        description: 'Click Upload button (arrow icon). Code compiles and uploads to Arduino. Built-in LED (marked L) should start blinking! Try changing the delay values (1000 = 1 second) and re-upload.',
      },
      {
        step: 4,
        title: 'Build External LED Circuit',
        description: 'On breadboard: LED long lead (+) to Arduino pin 13 through 220Ω resistor. LED short lead (-) to GND. This is the same circuit the code controls.',
      },
      {
        step: 5,
        title: 'Experiment with Code',
        description: 'Try: different blink patterns (fast/slow), changing pin number (move LED to different pin), adding multiple LEDs, creating morse code SOS pattern. Learn by experimenting!',
      }
    ]
  },

  // Woodshop Projects
  {
    id: 'woodshop-first-project',
    title: 'Build a Simple Wooden Box',
    category: 'Woodshop',
    difficulty: 'Beginner',
    estimated_minutes: 120,
    description: 'Make a small wooden box using basic hand tools and power tools. Perfect first woodworking project.',
    icon: '📦',
    zoneLeader: 'Paul',
    sbuSchedule: 'Tuesday @ 5:00pm',
    prerequisites: ['woodshop-sbu'],
    steps: [
      {
        step: 1,
        title: 'Plan Your Box',
        description: 'Simple box: 6" × 4" × 3" (width × depth × height). You\'ll need 6 pieces: bottom, 2 long sides, 2 short sides, lid. Draw a plan with measurements. Calculate material: 1/2" pine board works great.',
      },
      {
        step: 2,
        title: 'Measure and Mark Wood',
        description: 'Measure twice, cut once! Use combination square for accuracy. Mark cutting lines with pencil. For box sides: account for wood thickness when measuring (bottom fits inside sides).',
      },
      {
        step: 3,
        title: 'Cut Pieces on Miter Saw',
        description: 'Wear safety glasses. Let blade reach full speed. Hold wood firmly against fence. Make smooth, controlled cuts. Cut all 6 pieces. Sand cut edges smooth with 120-grit paper.',
        safetyNote: '⚠️ Keep hands 6" from blade. Let blade stop completely before removing piece.'
      },
      {
        step: 4,
        title: 'Drill Pilot Holes',
        description: 'Use drill press with small bit (1/16"). Clamp pieces. Drill 2 pilot holes per corner where screws will go. Prevents wood splitting.',
      },
      {
        step: 5,
        title: 'Assemble with Wood Glue & Screws',
        description: 'Apply wood glue to edges. Use small wood screws through pilot holes. Assemble bottom and 4 sides. Clamp or hold square while glue dries. Lid can be loose-fit or hinged.',
      },
      {
        step: 6,
        title: 'Sand and Finish',
        description: 'Sand all surfaces: Start 80-grit, then 120-grit, finish with 220-grit. Always sand with the grain. Apply finish if desired (brush-on polyurethane, mineral oil, etc) - follow finish safety rules.',
      }
    ]
  },

  {
    id: 'woodshop-cutting-board',
    title: 'Make a Cutting Board',
    category: 'Woodshop',
    difficulty: 'Intermediate',
    estimated_minutes: 180,
    description: 'Create a beautiful edge-grain cutting board. Learn wood selection, gluing, and food-safe finishing.',
    icon: '🍴',
    zoneLeader: 'Paul',
    sbuSchedule: 'Tuesday @ 5:00pm',
    steps: [
      {
        step: 1,
        title: 'Select Food-Safe Hardwood',
        description: 'Good choices: maple, walnut, cherry, oak. Avoid: pine (too soft), treated wood (toxic). Buy or find scraps of different woods for contrast. Need about 6-8 strips, 1" × 10" × 3/4" thick.',
      },
      {
        step: 2,
        title: 'Mill Wood Flat and Square',
        description: 'Use jointer to flatten one face. Run through planer for consistent thickness (3/4"). Use table saw to rip to width (1" strips). All pieces should be exactly same size.',
      },
      {
        step: 3,
        title: 'Arrange Pattern',
        description: 'Lay out strips in alternating wood types for visual pattern. Common: walnut-maple-walnut or checkerboard. Mark top and arrangement order with pencil.',
      },
      {
        step: 4,
        title: 'Glue Up in Zombie Room',
        description: 'Use food-safe wood glue (Titebond Original or II). Apply glue to edges. Use pipe clamps to hold pieces together. Alternate clamp direction. Wipe excess glue. Let dry 24 hours. Label with name and pickup date!',
        safetyNote: 'Gluing ONLY in Zombie Room on designated bench!'
      },
      {
        step: 5,
        title: 'Flatten and Sand',
        description: 'After glue dries: scrape off glue squeeze-out. Run through planer to flatten both sides. Sand progression: 80 → 120 → 180 → 220 grit. Round corners slightly with sandpaper.',
      },
      {
        step: 6,
        title: 'Apply Food-Safe Finish',
        description: 'Use mineral oil or butcher block conditioner (food-safe!). Apply liberally, let soak 20 min, wipe off excess. Repeat 2-3 times. Your cutting board is complete!',
      }
    ]
  },

  // CNC Projects
  {
    id: 'cnc-first-cut',
    title: 'Your First CNC Project',
    category: 'CNC',
    difficulty: 'Intermediate',
    estimated_minutes: 120,
    description: 'Cut a simple sign or shape on the Shopbot CNC. Learn the complete workflow.',
    icon: '🎯',
    zoneLeader: 'Steve',
    sbuSchedule: 'On Demand - Contact Steve',
    steps: [
      {
        step: 1,
        title: 'Design Simple Text Sign',
        description: 'Create a simple text sign in PartWorks. Choose clear, bold font. Size: 12" × 6" works well. Keep design simple - just text or basic shapes for first project.',
      },
      {
        step: 2,
        title: 'Select Material and Bit',
        description: 'Material: 3/4" pine or MDF (easy to cut). Bit: 1/4" straight flute bit (good all-around). Inspect bit for damage. Secure bit in collet properly (1/2" minimum insertion).',
        safetyNote: 'Inspect bits before EVERY use. Damaged bits can shatter!'
      },
      {
        step: 3,
        title: 'Create V-Carve Toolpath',
        description: 'In PartWorks: Create V-Carve toolpath for text. Select V-bit. Set depth (1/4" typical). Set feed rate (1 in/sec to start), spindle speed (12,000 RPM for wood), plunge rate (0.5 in/sec). Save .sbp file.',
      },
      {
        step: 4,
        title: 'Secure Material to Bed',
        description: 'Place material on spoil board. Use composite nail gun or screws in corners and edges (avoid cut area!). Check that material is flat and won\'t bow up. Verify toolpath won\'t hit fasteners!',
        safetyNote: '🚫 Unsecured material = dangerous projectile!'
      },
      {
        step: 5,
        title: 'Zero All Axes',
        description: 'Turn on Motor Driver Box. Open Shopbot3 software. Press "K" for keyboard mode. Move to bottom-left corner of material. Type "Z2" to zero X and Y. Attach alligator clip to bit, place Z-plate on material, type "C2" for Z-zero. REMOVE clip and plate!',
        safetyNote: 'CRITICAL: Remove Z-plate and alligator clip before cutting!'
      },
      {
        step: 6,
        title: 'Run Your First CNC Cut',
        description: 'Load your .sbp file. Turn on dust collector. Set router speed dial. Turn on router. Clear area. Press START. Stay near spacebar for emergency stop. Listen to cutting sound - should be steady, not straining.',
      },
      {
        step: 7,
        title: 'Finish and Clean',
        description: 'After cut completes: turn off router, wait for complete stop, turn off dust collector. Remove piece carefully. Clean sawdust from bed. Inspect your cut. Sand if needed. Apply finish if desired.',
      }
    ]
  },

  // Vinyl Projects
  {
    id: 'vinyl-first-sticker',
    title: 'Cut Your First Vinyl Sticker',
    category: 'Vinyl',
    difficulty: 'Beginner',
    estimated_minutes: 30,
    description: 'Make a simple vinyl decal or sticker. Learn cutting, weeding, and application.',
    icon: '🎯',
    zoneLeader: 'Zone Manager Wanted',
    sbuSchedule: 'No Current SBU',
    steps: [
      {
        step: 1,
        title: 'Create Simple Design',
        description: 'Start with text or a simple shape. No tiny details for first project - keep it bigger than 1 inch. Use bold fonts. Create in Inkscape or Illustrator. Export as SVG.',
      },
      {
        step: 2,
        title: 'Load Vinyl and Set Blade',
        description: 'Load vinyl roll into cutter. Adjust blade depth: should cut vinyl but NOT backing paper. Test on scrap first. Set appropriate speed and pressure for your vinyl type.',
      },
      {
        step: 3,
        title: 'Cut Your Design',
        description: 'Send design to cutter. Watch the cut - blade should cleanly cut vinyl without cutting through backing. If cutting through: reduce blade depth. If not cutting: increase depth slightly.',
      },
      {
        step: 4,
        title: 'Weed Excess Vinyl',
        description: 'Use weeding tool to remove vinyl you don\'t want. Work slowly and carefully. Start with larger areas, then details. Small pieces can be stubborn - use sharp tool and patience.',
      },
      {
        step: 5,
        title: 'Apply Transfer Tape',
        description: 'Cut transfer tape slightly larger than design. Apply over vinyl, burnish well (rub firmly). Peel up backing paper - vinyl should stick to transfer tape. If vinyl stays on backing: burnish more.',
      },
      {
        step: 6,
        title: 'Apply to Surface',
        description: 'Clean target surface. Position transfer tape with vinyl. Burnish from center outward. Slowly peel transfer tape at sharp angle - vinyl should stay on surface. Burnish final vinyl. Done!',
      }
    ]
  }
];

// Helper functions
export function getCourseById(id: string): Course | undefined {
  return MAKERSPACE_COURSES.find(course => course.id === id);
}

export function getCoursesByCategory(category: Course['category']): Course[] {
  return MAKERSPACE_COURSES.filter(course => course.category === category);
}
