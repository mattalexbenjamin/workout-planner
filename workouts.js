// APEX SUMMER '26 WORKOUT TEMPLATE DATABASE

const ATHLETIC_WORKOUTS = [
  {
    id: "sand_plyos",
    name: "Sand Plyos & Vertical Boost",
    category: "explosive",
    duration: 45,
    intensity: 8,
    description: "Designed specifically for beach volleyball players. Builds explosive vertical jump power, reactive ankle strength, and stability on loose sand.",
    exercises: [
      { name: "Dynamic Sand Skip & Arm Swings", sets: "1", reps: "5 mins", notes: "Ramping up heart rate; ankle rolls, dynamic leg swings, shoulder circles." },
      { name: "Consecutive Sand Squat Jumps", sets: "3", reps: "8-10", notes: "Land softly on sand, immediately sink and explode upwards. Focus on triple extension." },
      { name: "Single-Leg Sand Bounding", sets: "3", reps: "12 yds", notes: "Focus on horizontal distance and rapid ankle push off the sand. Keep chest proud." },
      { name: "Lateral Sand Skaters (with stick landing)", sets: "3", reps: "12 total", notes: "Explode sideways, landing on one foot. Hold the landing for 1s to build knee/ankle stability." },
      { name: "Max Volleyball Approach Jumps", sets: "4", reps: "5", notes: "Perform full spike approach steps in the sand. Explode upward. Rest 60s between sets." },
      { name: "Sand Ankle Pogos", sets: "3", reps: "25", notes: "Keep knees relatively stiff. Bounce off the sand rapidly using calf and Achilles elastic recoil." }
    ]
  },
  {
    id: "athletic_strength_a",
    name: "Explosive Athletic Strength A",
    category: "strength",
    duration: 60,
    intensity: 8,
    description: "Heavy compound lifting to develop total-body power. Promotes maximum force output that transfers directly to running speeds and jump height.",
    exercises: [
      { name: "Hang Power Cleans", sets: "4", reps: "4", notes: "Explode hips forward, shrug shoulders, catch bar high on chest. Rest 90-120s between sets." },
      { name: "Barbell Front Squats", sets: "4", reps: "6", notes: "Builds quad strength and core stability. Drive elbows high to keep upright posture." },
      { name: "Strict Standing Overhead Press (Dumbbell)", sets: "3", reps: "8", notes: "Brace core and glutes. Push overhead without using your legs." },
      { name: "Romanian Deadlifts (RDL)", sets: "3", reps: "10", notes: "Hinge at hips, stretch hamstrings, squeeze glutes to stand. Perfect for posterior chain." },
      { name: "Hanging Knee/Leg Raises", sets: "3", reps: "12-15", notes: "Control the descent, do not swing the body. Pull with lower abs." }
    ]
  },
  {
    id: "athletic_strength_b",
    name: "Athletic Shred & Power B",
    category: "strength",
    duration: 65,
    intensity: 8,
    description: "Focuses on posterior chain pull strength, upper body pull mechanics, and unilateral stability essential for cutting on turf or sand.",
    exercises: [
      { name: "Conventional Barbell Deadlifts", sets: "4", reps: "5", notes: "Keep spine flat. Pull bar close to shins. Drive feet through the floor." },
      { name: "Dumbbell Bulgarian Split Squats", sets: "3", reps: "8 each", notes: "Unilateral leg power. Addresses leg strength imbalances. Elevate rear foot on bench." },
      { name: "Weighted Pull-Ups", sets: "3", reps: "6-8", notes: "Pull chest to bar. Focus on controlled eccentric (lowering) phase." },
      { name: "Incline Dumbbell Bench Press", sets: "3", reps: "8", notes: "Dumbbells allow natural shoulder path. Control weight down, explode up." },
      { name: "Weighted Russian Twists", sets: "3", reps: "24 total", notes: "Builds rotational core power, critical for volleyball spiking and football throws." }
    ]
  },
  {
    id: "saq_agility",
    name: "Football Speed & Agility",
    category: "speed",
    duration: 40,
    intensity: 7,
    description: "Speed, Agility, and Quickness (SAQ). Train deceleration control, sharp turf cuts, and acceleration to burn calories and boost game speed.",
    exercises: [
      { name: "A-Skips & B-Skips (Activation)", sets: "2", reps: "20 yds", notes: "Focus on knee drive, active arm pump, and springy foot contacts." },
      { name: "Pro Agility Shuttle (5-10-5)", sets: "4", reps: "2 total", notes: "Run 5yd right, touch line, run 10yd left, touch line, sprint 5yd back. Rest 60s." },
      { name: "3-Cone L-Drill", sets: "4", reps: "2 total", notes: "Tests rapid change of direction. Stay low, lean into cuts, keep feet moving." },
      { name: "Athletic Leaning Sprint Starts", sets: "6", reps: "15 yds", notes: "Lean forward until you start falling, then explode into a sprint. Walk back for recovery." },
      { name: "Deceleration/Breakdown Drills", sets: "3", reps: "20 yds", notes: "Sprint hard for 10 yards, then chop feet to stop completely within 3 steps. Saves knees." }
    ]
  },
  {
    id: "shoulder_knee_prehab",
    name: "Volleyball Shoulder & Knee Armor",
    category: "prehab",
    duration: 35,
    intensity: 5,
    description: "Active rehab and prehab. Protects rotator cuffs from repetitive spiking/throwing forces and prepares tendons for summer landing impacts.",
    exercises: [
      { name: "Resistance Band Pull-Aparts", sets: "3", reps: "20", notes: "Squeeze scapulae together. Improves posture and stabilizes the upper back." },
      { name: "Band External Rotations", sets: "3", reps: "15 each", notes: "Pin elbow to your ribcage. Rotate forearm outward slowly. Rotator cuff health." },
      { name: "Bodyweight Tibialis Raises", sets: "3", reps: "25", notes: "Stand with back against wall, raise toes toward shins. Prevents shin splints." },
      { name: "Spanish Squats (isometric hold or slow reps)", sets: "3", reps: "10 (5s hold)", notes: "Loop heavy band around pole and back of knees. Sit back. Great for patellar tendons." },
      { name: "Scapular Pull-Ups", sets: "3", reps: "12", notes: "Hang from pull-up bar, depress and retract shoulder blades without bending elbows." }
    ]
  },
  {
    id: "active_mobility",
    name: "Full Body Mobility Flow",
    category: "recovery",
    duration: 30,
    intensity: 3,
    description: "Low-intensity mobility and stretching designed to speed up muscle recovery, reduce soreness, and restore joint ranges of motion.",
    exercises: [
      { name: "World's Greatest Stretch", sets: "2", reps: "6 each", notes: "Deep lunge, rotate arm to sky, push hips back into hamstring stretch." },
      { name: "90/90 Hip Switches", sets: "2", reps: "10 total", notes: "Sit on floor, knees bent at 90 degrees. Rotate hips to touch knees to floor on both sides." },
      { name: "Cat-Cow Stretch", sets: "1", reps: "15", notes: "Arch and round back slowly, aligning movement with deep belly breathing." },
      { name: "Goblet Deep Squat Hold", sets: "2", reps: "45s", notes: "Hold bottom of squat. Use elbows to gently press knees outward. Rotate weight slightly." },
      { name: "Self-Myofascial Release (Foam Roll)", sets: "1", reps: "5 mins", notes: "Focus on calves, quads, IT band, and thoracic upper back." }
    ]
  },
  {
    id: "express_circuit",
    name: "Express 15-Min Explosive Circuit",
    category: "explosive",
    duration: 15,
    intensity: 9,
    description: "A fast, intense bodyweight conditioning circuit designed to maintain power output and elevate metabolism on highly busy calendar days.",
    exercises: [
      { name: "Bodyweight Squat Jumps", sets: "3", reps: "30s work / 30s rest", notes: "Explode up. Aim for height and soft landing. Keep tempo high." },
      { name: "Explosive Push-Ups", sets: "3", reps: "30s work / 30s rest", notes: "Push off the ground with maximum speed. Drop to knees if form breaks." },
      { name: "Alternating Jump Lunges", sets: "3", reps: "30s work / 30s rest", notes: "Switch feet in mid-air. Absorb impact by landing into a deep lunge." },
      { name: "Plank Shoulder Taps", sets: "3", reps: "30s work / 30s rest", notes: "Keep hips locked, touch opposite shoulder. Core anti-rotation." },
      { name: "Speed Burpees", sets: "3", reps: "30s work / 30s rest", notes: "Cardio burn. Keep transitions between jump and floor smooth." }
    ]
  }
];

// Dynamic video/gif search links targeting YouTube form guides
function getExerciseGuideUrl(exerciseName) {
  // Always generate a clean dynamic search query to prevent dead link errors
  return `https://www.youtube.com/results?search_query=${encodeURIComponent("how to do " + exerciseName)}`;
}
