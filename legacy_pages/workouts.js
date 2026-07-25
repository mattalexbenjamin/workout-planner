// APEX SUMMER '26 WORKOUT TEMPLATE DATABASE

const ATHLETIC_WORKOUTS = [
  {
    id: "weightlifting_1",
    name: "Weightlifting - Upper Body Hypertrophy",
    category: "weightlifting",
    duration: 70,
    intensity: 8,
    description: "Induce mechanical tension and metabolic stress in the pectorals, latissimus dorsi, and deltoids to drive muscular hypertrophy.",
    exercises: [
      { name: "Warm-up", sets: "1", reps: "5 mins", notes: "Rowing machine (moderate). 2x15 band pull-aparts, 2x10 scapular push-ups, 2x10 empty barbell bench press." },
      { name: "Barbell Bench Press", sets: "4", reps: "8-10", notes: "RPE 8, 2 RIR. Rest 90-120 seconds." },
      { name: "Weighted Pull-ups (or Lat Pulldowns)", sets: "4", reps: "8-10", notes: "RPE 8. Rest 90-120 seconds." },
      { name: "Incline Dumbbell Press", sets: "3", reps: "10-12", notes: "Controlled eccentric, 3 seconds down. Superset with Seated Cable Row." },
      { name: "Seated Cable Row (V-Grip)", sets: "3", reps: "10-12", notes: "Rest 90 seconds after superset." },
      { name: "Dumbbell Lateral Raises", sets: "3", reps: "15", notes: "Slight forward lean. Triset with curls and pushdowns." },
      { name: "Incline Dumbbell Bicep Curls", sets: "3", reps: "12", notes: "Triset." },
      { name: "Triceps Rope Pushdowns", sets: "3", reps: "12-15", notes: "Rest 60 seconds after Triset." },
      { name: "Cool-Down", sets: "1", reps: "2x30s", notes: "Unilateral doorway pectoral stretch. Active hang from pull-up bar." }
    ]
  },
  {
    id: "weightlifting_2",
    name: "Weightlifting - Lower Body Absolute Strength",
    category: "weightlifting",
    duration: 80,
    intensity: 9,
    description: "Maximize central nervous system output and force production in the primary lower body compound movements (squat and hinge).",
    exercises: [
      { name: "Warm-up", sets: "1", reps: "5 mins", notes: "Assault bike. 3x10 kettlebell goblet squats, 3x10 glute bridges, 3x5 tall kneeling to standing jumps." },
      { name: "Barbell Back Squat", sets: "5", reps: "5", notes: "80-85% of 1RM, RPE 8.5. Rest 3 minutes." },
      { name: "Romanian Deadlift (RDL)", sets: "4", reps: "6-8", notes: "RPE 8. Push hips back until hamstrings are fully lengthened. Rest 2-3 minutes." },
      { name: "Rear-Foot Elevated Split Squat", sets: "3", reps: "6-8 /leg", notes: "RPE 8. Use dumbbells. Rest 90 seconds." },
      { name: "Lying Hamstring Curls", sets: "3", reps: "10-12", notes: "Focus on peak contraction. Superset with Calf Raises." },
      { name: "Standing Calf Raises", sets: "3", reps: "15", notes: "Pause 1s at bottom, 1s at top. Rest 60s." },
      { name: "Cool-Down", sets: "1", reps: "2x60s", notes: "Couch stretch per leg. Pigeon pose per leg." }
    ]
  },
  {
    id: "weightlifting_3",
    name: "Weightlifting - Full Body Power",
    category: "weightlifting",
    duration: 60,
    intensity: 8,
    description: "Enhance the rate of force development (RFD) and motor unit recruitment speed using Olympic derivatives and plyometrics.",
    exercises: [
      { name: "Warm-up", sets: "1", reps: "5 mins", notes: "Light jogging. Dynamic mobility. 3x5 hang muscle snatches (empty bar)." },
      { name: "Hang Power Cleans", sets: "5", reps: "3", notes: "70-75% 1RM. Focus exclusively on bar speed and aggressive hip extension. Rest 2-3 min." },
      { name: "Push Press", sets: "4", reps: "4-5", notes: "RPE 7.5. Drive violently from the legs. Rest 2 minutes." },
      { name: "Trap Bar Deadlift Jumps", sets: "4", reps: "4", notes: "Use ~20-30% of 1RM deadlift. Explode off the floor. Rest 90 seconds." },
      { name: "Medicine Ball Overhead Slams", sets: "3", reps: "8", notes: "Maximum velocity on every rep. Superset with Plyo Push-ups." },
      { name: "Plyometric Push-ups (Clapping)", sets: "3", reps: "6-8", notes: "Rest 90 seconds." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Foam rolling the quadriceps, thoracic spine, and latissimus dorsi." }
    ]
  },
  {
    id: "weightlifting_4",
    name: "Weightlifting - Lower Body Hypertrophy",
    category: "weightlifting",
    duration: 70,
    intensity: 8,
    description: "Drive structural growth in the quadriceps, hamstrings, and gluteal complex through time-under-tension and mechanical damage.",
    exercises: [
      { name: "Warm-up", sets: "1", reps: "5 mins", notes: "Stationary bike. 3x15 bodyweight walking lunges, 2x15 banded good mornings, 2x15 lateral band walks." },
      { name: "Front Squat (or Hack Squat)", sets: "4", reps: "10-12", notes: "RPE 8-9. Rest 2 minutes. Maintain an upright torso to bias the quadriceps." },
      { name: "Leg Press", sets: "3", reps: "15", notes: "Feet high and wide. Focus on glute and hamstring stretch. Rest 90 seconds." },
      { name: "Walking Dumbbell Lunges", sets: "3", reps: "12 /leg", notes: "Rest 90 seconds." },
      { name: "Seated Leg Extensions", sets: "3", reps: "15", notes: "Hold the peak concentric contraction for 1 full second on every rep. Superset with Glute Ham Raises." },
      { name: "Glute Ham Raises", sets: "3", reps: "6-8", notes: "Control eccentric phase for 4-5 seconds. Rest 90 seconds." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Light cycling. 2x60 seconds seated single-leg hamstring stretch." }
    ]
  },
  {
    id: "running_1",
    name: "Running - Track Speed Sprints",
    category: "running",
    duration: 45,
    intensity: 10,
    description: "Maximize top-end speed mechanics, stride frequency, and central nervous system firing rate.",
    exercises: [
      { name: "Warm-up", sets: "1", reps: "10 mins", notes: "Jogging. Dynamic track mobility: A-skips, B-skips, high knees. 3x30m build-up sprints." },
      { name: "Max Effort Flying Sprints", sets: "6", reps: "30m", notes: "Build up for 20m, sprint 100% max velocity for 10m." },
      { name: "Active Recovery", sets: "6", reps: "3-4 mins", notes: "Walk back and rest exactly 3-4 minutes. You must be fully recovered." },
      { name: "Cool-Down", sets: "1", reps: "10 mins", notes: "Very slow barefoot walking on grass. Standing calf stretch." }
    ]
  },
  {
    id: "running_2",
    name: "Running - HIIT Track Intervals (VO2 Max)",
    category: "running",
    duration: 40,
    intensity: 9,
    description: "Expand aerobic capacity and improve VO2 Max by accumulating time at or near maximum oxygen uptake.",
    exercises: [
      { name: "Warm-up", sets: "1", reps: "800m", notes: "Easy jog. 4x100m strides at 70-80% effort with walk-back recovery." },
      { name: "400m Repeats", sets: "6", reps: "400m", notes: "Run at 1-mile race pace (approx 90-95% max HR)." },
      { name: "Rest Interval", sets: "6", reps: "200m", notes: "Walk/jog 200m between intervals (approx 1:1 work-to-rest ratio)." },
      { name: "Cool-Down", sets: "1", reps: "800m", notes: "Easy jog or walk. Kneeling hip flexor stretch." }
    ]
  },
  {
    id: "running_3",
    name: "Running - Steady-State Endurance",
    category: "running",
    duration: 60,
    intensity: 5,
    description: "Build mitochondrial density, improve capillary networks, and enhance baseline aerobic fat-oxidation efficiency.",
    exercises: [
      { name: "Warm-up", sets: "1", reps: "5 mins", notes: "Brisk walking. Dynamic leg swings." },
      { name: "Continuous Zone 2 Run", sets: "1", reps: "50-60 mins", notes: "Strict Zone 2 (65-75% of Max HR). Must be able to maintain a conversation." },
      { name: "Cool-Down", sets: "1", reps: "10 mins", notes: "Slow walk. Foam rolling calves, IT bands, and quadriceps." }
    ]
  },
  {
    id: "running_4",
    name: "Running - Tempo Run (Lactate Threshold)",
    category: "running",
    duration: 50,
    intensity: 7,
    description: "Push the lactate threshold upward, delaying blood lactate accumulation and allowing faster sustained running speeds.",
    exercises: [
      { name: "Warm-up", sets: "1", reps: "10 mins", notes: "Easy jog. 3 short 15-second accelerations." },
      { name: "Continuous Tempo Block", sets: "1", reps: "25-30 mins", notes: "Zone 4, roughly 85% Max HR. Comfortably hard. Hold pace steady." },
      { name: "Cool-Down", sets: "1", reps: "10 mins", notes: "Easy jog to flush out lactic acid. Light static stretching." }
    ]
  },
  {
    id: "volleyball_1",
    name: "Volleyball - Explosive Vertical Power",
    category: "volleyball",
    duration: 55,
    intensity: 9,
    description: "Maximize the stretch-shortening cycle (SSC) to increase approach vertical jump height and absolute explosiveness.",
    exercises: [
      { name: "Warm-up", sets: "1", reps: "5 mins", notes: "Jump rope. 3x10 bodyweight squats, lunges, low pogo jumps." },
      { name: "Depth Jumps", sets: "4", reps: "4", notes: "Step off 12-18 inch box, immediately rebound vertically. Rest 2 mins." },
      { name: "Full Approach Jumps", sets: "4", reps: "3", notes: "Volleyball spike approach and jump for max height. Rest 90s." },
      { name: "Seated Box Jumps", sets: "4", reps: "4", notes: "Seated on low box, explode onto 24-30 inch box. Rest 90s." },
      { name: "Broad Jumps", sets: "3", reps: "3", notes: "Jump for max horizontal distance. Rest 60s." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Foam rolling calves. Supine hamstring stretch with band." }
    ]
  },
  {
    id: "volleyball_2",
    name: "Volleyball - Lateral Quickness & Agility",
    category: "volleyball",
    duration: 45,
    intensity: 8,
    description: "Improve first-step lateral quickness, deceleration for digging, and multidirectional reaction time.",
    exercises: [
      { name: "Warm-up", sets: "1", reps: "5 mins", notes: "Lateral shuffling, carioca. 3x15 lateral band walks." },
      { name: "5-10-5 Pro Agility Drill", sets: "5", reps: "1", notes: "5 sets per direction. Rest 60s." },
      { name: "Lateral Skater Bounds", sets: "4", reps: "6 /leg", notes: "Leap laterally, stabilize, explode back. Rest 90s." },
      { name: "Reaction Ball Drops", sets: "4", reps: "5 /side", notes: "Partner drops tennis ball, sprint to catch before second bounce. Rest 60s." },
      { name: "T-Drill", sets: "3", reps: "1", notes: "Sprint 10y, shuffle 5y L, 10y R, 5y L, backpedal 10y. Rest 90s." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Light cycling. Frog stretch (deep adductor stretch)." }
    ]
  },
  {
    id: "volleyball_3",
    name: "Volleyball - Upper Body Power & Shoulder Prehab",
    category: "volleyball",
    duration: 55,
    intensity: 7,
    description: "Develop explosive rotational hitting power while reinforcing the rotator cuff to prevent labral and supraspinatus injuries.",
    exercises: [
      { name: "Warm-up", sets: "1", reps: "5 mins", notes: "Arm circles. 3x15 band face pulls, 3x10 wall slides, 3x10 push-ups plus." },
      { name: "Medicine Ball Rotational Wall Throws", sets: "4", reps: "6 /side", notes: "Slam violently against wall. Rest 60s." },
      { name: "Single-Arm Dumbbell Push Press", sets: "4", reps: "6 /arm", notes: "Heavy weight, use leg drive. Rest 90s." },
      { name: "Cable Internal / External Rotations", sets: "3", reps: "15 /arm", notes: "Light weight, elbow pinned. Superset with Y-T-W Raises." },
      { name: "Prone Y-T-W Raises", sets: "3", reps: "10", notes: "On slight incline bench. Rest 90s." },
      { name: "Medicine Ball Overhead Slams", sets: "3", reps: "10", notes: "Replicate core contraction of a spike. Rest 60s." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Sleeper stretch per arm. Doorway pectoral stretch." }
    ]
  },
  {
    id: "volleyball_4",
    name: "Volleyball - Game-Day Conditioning",
    category: "volleyball",
    duration: 40,
    intensity: 9,
    description: "Replicate the high-intensity, alactic/aerobic intermittent energy system demands of a strenuous 5-set match.",
    exercises: [
      { name: "Warm-up", sets: "1", reps: "5 mins", notes: "Light jogging. 3x10 burpees, 3x10 jump squats." },
      { name: "Intermittent Work Intervals", sets: "4", reps: "5 mins", notes: "15s ALL OUT / 15s REST continuously for 5 mins. Block Jumps -> Shuffles -> Approaches -> Sprawl/Sprint." },
      { name: "Rest Intervals", sets: "3", reps: "2 mins", notes: "Rest 2 minutes between each 5-minute block." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Easy walking. Full body static stretching focusing on deep breathing." }
    ]
  },
  {
    id: "football_1",
    name: "Flag Football - Acceleration & Speed Mechanics",
    category: "flag_football",
    duration: 45,
    intensity: 9,
    description: "Develop explosive drive-phase mechanics to beat defenders off the line of scrimmage within the first 10 yards.",
    exercises: [
      { name: "Warm-up", sets: "1", reps: "10 mins", notes: "Track warm-up. 3x10m falling starts." },
      { name: "Heavy Resisted Sprints", sets: "5", reps: "15 yds", notes: "Sled push or partner band. Rest 2 mins." },
      { name: "Unresisted Contrast Sprint", sets: "5", reps: "15 yds", notes: "Immediately after resisted sprint. Rest 3 mins." },
      { name: "Push-up Start Sprints", sets: "4", reps: "20 yds", notes: "Start on stomach, violently pop up and sprint. Rest 90s." },
      { name: "Medicine Ball Broad Toss", sets: "4", reps: "3", notes: "Broad jump while throwing med ball forward. Rest 60s." },
      { name: "Cool-Down", sets: "1", reps: "10 mins", notes: "Light walk. Kneeling hip flexor stretch." }
    ]
  },
  {
    id: "football_2",
    name: "Flag Football - Change of Direction",
    category: "flag_football",
    duration: 50,
    intensity: 8,
    description: "Improve eccentric strength to decelerate rapidly and reactive strength to cut sharply.",
    exercises: [
      { name: "Warm-up", sets: "1", reps: "5 mins", notes: "Jogging. Zig-zag shuffles. Single-leg snap downs." },
      { name: "Box Drill", sets: "4", reps: "1", notes: "Sprint 10y, shuffle 10y, backpedal 10y, shuffle 10y. Rest 60s." },
      { name: "L-Drill (3 Cone Drill)", sets: "4", reps: "1 /dir", notes: "Get hips low around cones. Rest 90s." },
      { name: "Deceleration Runs", sets: "5", reps: "20 yds", notes: "Sprint 20y, complete dead stop within 3 steps. Rest 60s." },
      { name: "Reactive Cutting", sets: "5", reps: "10 yds", notes: "Partner points L or R, plant and cut 45 degrees. Rest 60s." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Foam roll IT bands, glutes, and lateral quadriceps." }
    ]
  },
  {
    id: "football_3",
    name: "Flag Football - Route-Running Conditioning",
    category: "flag_football",
    duration: 40,
    intensity: 9,
    description: "Build anaerobic endurance necessary to run repeated deep routes without performance drop-off.",
    exercises: [
      { name: "Warm-up", sets: "1", reps: "5 mins", notes: "Easy jog. 4x50m build-up sprints." },
      { name: "Gassers (Sideline to Sideline)", sets: "8-10", reps: "4 widths", notes: "Target Time: Under 35-40 seconds." },
      { name: "Rest Interval", sets: "8-10", reps: "60-75s", notes: "Strict rest between Gassers." },
      { name: "Cool-Down", sets: "1", reps: "10 mins", notes: "Continuous slow walking. Do NOT sit down immediately. Calf stretches." }
    ]
  },
  {
    id: "football_4",
    name: "Flag Football - Unilateral Lower Body Power",
    category: "flag_football",
    duration: 60,
    intensity: 8,
    description: "Build isolated single-leg explosive strength and stability, crucial for pushing off one foot when cutting.",
    exercises: [
      { name: "Warm-up", sets: "1", reps: "5 mins", notes: "Jump rope. Reverse lunges, single-leg glute bridges, ankle band lateral walks." },
      { name: "Barbell Reverse Lunges", sets: "4", reps: "6-8 /leg", notes: "RPE 8. Drive violently through front heel. Rest 2 mins." },
      { name: "Single-Leg Box Jumps", sets: "4", reps: "4 /leg", notes: "Jump off one leg, land on BOTH feet on 12-18 inch box. Rest 90s." },
      { name: "Skater Squats (or Pistol Squats)", sets: "3", reps: "6-8 /leg", notes: "Counterbalance with dumbbell if needed. Rest 90s." },
      { name: "Single-Leg Kettlebell RDLs", sets: "3", reps: "8 /leg", notes: "Focus on hamstring stretch and ankle stability. Rest 60s." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Pigeon pose. Foam roll hamstrings and glutes." }
    ]
  },
  {
    id: "recovery_1",
    name: "Recovery - Active Recovery & Joint Mobility",
    category: "recovery",
    duration: 40,
    intensity: 3,
    description: "Flush blood into fatigued muscles, clear metabolic waste, and actively improve joint articulation.",
    exercises: [
      { name: "Light Cardiovascular Flush", sets: "1", reps: "15 mins", notes: "Easy cycling, rowing, or swimming. HR under 120 bpm." },
      { name: "90/90 Hip Switches", sets: "3", reps: "10 /side", notes: "Dynamically rotate hips side to side." },
      { name: "Cat-Cow Spine Articulation", sets: "3", reps: "10", notes: "Focus on segmenting the spine vertebra by vertebra." },
      { name: "World's Greatest Stretch", sets: "3", reps: "5 /side", notes: "Lunge, drop elbow, rotate arm to ceiling." },
      { name: "Deep Squat Prying", sets: "3", reps: "45-60s", notes: "Keep heels flat. Pry knees outward with elbows." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Deep diaphragmatic breathing lying supine." }
    ]
  },
  {
    id: "recovery_2",
    name: "Recovery - Yoga-Inspired Flow (Hips & Spine)",
    category: "recovery",
    duration: 35,
    intensity: 2,
    description: "Decompress the spine, open chronically tight hip flexors, and stimulate the parasympathetic nervous system.",
    exercises: [
      { name: "Warm-up", sets: "1", reps: "2 mins", notes: "Deep breathing in Child's Pose." },
      { name: "Flow: Down Dog to Up Dog", sets: "1", reps: "5x", notes: "Hold each pose for 5-10 deep nasal breaths." },
      { name: "Flow: Runner's Lunge & Pigeon Pose", sets: "1", reps: "1 /side", notes: "Hold each side for 30-60s." },
      { name: "Flow: Seated & Supine Spinal Twists", sets: "1", reps: "1 /side", notes: "Deep twist to decompress lower back." },
      { name: "Flow: Happy Baby Pose", sets: "1", reps: "60s", notes: "Gentle rocking on back." },
      { name: "Cool-Down: Savasana", sets: "1", reps: "5 mins", notes: "Lie flat on back, eyes closed, focus entirely on breathing." }
    ]
  },
  {
    id: "recovery_3",
    name: "Recovery - Lower Body Focused Deep Stretching",
    category: "recovery",
    duration: 30,
    intensity: 3,
    description: "Lengthen tight fascial lines in the lower extremities, specifically targeting the hamstrings, calves, and adductors.",
    exercises: [
      { name: "Warm-up", sets: "1", reps: "5 mins", notes: "Easy walk or stationary bike to warm the fascial tissue." },
      { name: "Supine Banded Hamstring & IT Band Stretch", sets: "1", reps: "2 mins /side", notes: "Straight leg pull, then drop across body." },
      { name: "Couch Stretch", sets: "1", reps: "2 mins /side", notes: "Intense hip flexor/rectus femoris stretch against wall." },
      { name: "Frog Stretch", sets: "1", reps: "2 mins", notes: "Widen knees, sit hips back toward heels." },
      { name: "Kneeling Calf Stretch", sets: "1", reps: "2 mins /side", notes: "Lean bodyweight over knee to stretch Achilles." },
      { name: "Cool-Down", sets: "1", reps: "10 reps", notes: "Very slow bodyweight squats to re-integrate range of motion." }
    ]
  },
  {
    id: "recovery_4",
    name: "Recovery - Upper Body & Shoulder Release",
    category: "recovery",
    duration: 30,
    intensity: 3,
    description: "Alleviate muscular tension and trigger points in the neck, trapezius, pectorals, and latissimus dorsi.",
    exercises: [
      { name: "Warm-up", sets: "1", reps: "2 mins", notes: "Gentle neck rolls, shoulder shrugs, arm circles." },
      { name: "Lacrosse Ball Pectoral & Trap Release", sets: "1", reps: "2 mins /side", notes: "Roll slowly seeking tender spots on chest and upper back." },
      { name: "Doorway Pec Stretch", sets: "1", reps: "90s /side", notes: "Forearms on frame at 90 degrees." },
      { name: "Latissimus Dorsi Stretch", sets: "1", reps: "90s /side", notes: "Grab rack/doorframe, drop hips back." },
      { name: "Thread the Needle", sets: "1", reps: "60s /side", notes: "Thoracic rotation stretch from all fours." },
      { name: "Cool-Down", sets: "1", reps: "3 mins", notes: "Seated deep breathing expanding ribcage laterally." }
    ]
  }
];

// Dynamic video/gif search links targeting YouTube form guides
function getExerciseGuideUrl(exerciseName) {
  // Always generate a clean dynamic search query to prevent dead link errors
  return `https://www.youtube.com/results?search_query=${encodeURIComponent("how to do " + exerciseName)}`;
}
