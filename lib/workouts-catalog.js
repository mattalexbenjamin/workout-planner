// APEX SUMMER '26 WORKOUT CATALOG & UTILITIES

export const ATHLETIC_WORKOUTS = [
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
    id: "volleyball_5",
    name: "Volleyball - Setting: Hand Precision & Footwork Mechanics",
    category: "volleyball",
    duration: 50,
    intensity: 7,
    description: "Develop neutral hand positioning, high contact points, dynamic footwork, and 100-touch setting consistency under technical control.",
    exercises: [
      { name: "Warm-up & Wrist Mobility", sets: "1", reps: "5 mins", notes: "Wrist circles, finger extensions, wall setting warm-up, light shoulder band rotations." },
      { name: "Wall Setting 100-Touch Precision Series", sets: "4", reps: "25 reps", notes: "High contact point above forehead. Rapid clean wrist extensions against smooth wall. Keep elbows high and quiet." },
      { name: "Square-to-Target Footwork Drill", sets: "4", reps: "10 reps", notes: "Partner toss from various angles. Setter moves from base (position 2/3), plant right foot then left foot, square shoulders to target zone 4." },
      { name: "Catch-and-Push High Ball Setting", sets: "4", reps: "8 reps", notes: "Pause for 0.5s at contact point to verify shape (window/triangle above forehead), then explode through wrists and legs to pin target." },
      { name: "Back Setting Mechanics Drill", sets: "3", reps: "10 reps", notes: "Toss from pass area. Arch upper back slightly, push hips slightly forward, release ball behind target zone 2 with even two-hand pressure." },
      { name: "Cool-Down & Forearm Stretch", sets: "1", reps: "5 mins", notes: "Kneeling forearm flexor/extensor stretches, static wrist decompression." }
    ]
  },
  {
    id: "volleyball_6",
    name: "Volleyball - Setting: Off-System & Transition Setting",
    category: "volleyball",
    duration: 55,
    intensity: 8,
    description: "Master out-of-system setting from deep court, 3-meter line transitions, and high-arc high-margin ball delivery under scramble conditions.",
    exercises: [
      { name: "Warm-up & Deep Shuffles", sets: "1", reps: "5 mins", notes: "Dynamic movement, lateral shuffle to boundary line, medicine ball overhead chest passes." },
      { name: "Deep Court High Ball Setting", sets: "5", reps: "6 reps", notes: "Coach feeds ball to position 5/6 (20+ feet off net). Setter runs, plants facing antenna, delivers high-arc 3-foot margin ball to outside hitter." },
      { name: "Scramble Dig-to-Set Transition", sets: "4", reps: "8 reps", notes: "Simulate off-block defense: setter drops to dig, immediately turns, sprints to 10-foot line, sets out-of-system ball to antenna." },
      { name: "Running Hand vs Bump Set Decision Drill", sets: "4", reps: "10 reps", notes: "Tosses alternate between reachable high balls (hand set) and low tight balls (forearm bump set). Focus on rapid footwork decision." },
      { name: "Continuous 3-Player Out-of-System Rally", sets: "3", reps: "3 mins", notes: "Non-stop off-system balls tossed continuously. Setter must reset, chase down errant passes, and maintain high-ball location." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Hamstring and hip flexor stretches, diaphragmatic breathing." }
    ]
  },
  {
    id: "volleyball_7",
    name: "Volleyball - Setting: Jump Setting & Disruption",
    category: "volleyball",
    duration: 45,
    intensity: 8,
    description: "Speed up offensive tempo, hold opposing middle blockers, and execute jump sets, quick-release sets, and setter dump attacks.",
    exercises: [
      { name: "Warm-up & Low Box Jumps", sets: "1", reps: "5 mins", notes: "Low pogo jumps, dynamic ankle mobility, 2x10 jump set movements without ball." },
      { name: "Jump Set Contact Point Isolation", sets: "4", reps: "8 reps", notes: "Self-toss, jump vertically, contact ball at apex of jump above forehead. Focus on clean hands without drift." },
      { name: "Jump Set Quick (1-Ball) & Slide Delivery", sets: "4", reps: "10 reps", notes: "Partner feeds pass to target zone. Setter jump sets quick ball to middle and back-set slide tempo." },
      { name: "Setter Dump vs Fake-Set Disruption", sets: "4", reps: "8 reps", notes: "Approach as if jump setting to zone 4, contact with left hand tip/swipe to deep court corner or zone 4 angle. Hold blocker until last frame." },
      { name: "Tempo Jump Setting Circuit", sets: "3", reps: "12 reps", notes: "Rapid-fire toss series: alternate jump set to antenna, jump set to back-right, jump set dump." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Calf stretches, wrist mobility, quad foam rolling." }
    ]
  },
  {
    id: "volleyball_8",
    name: "Volleyball - Passing: Platform Control & Serve Receive",
    category: "volleyball",
    duration: 50,
    intensity: 7,
    description: "Build a rock-solid forearm platform, master angle creation toward the target setter position, and absorb server pace.",
    exercises: [
      { name: "Warm-up & Platform Shrugging", sets: "1", reps: "5 mins", notes: "Thoracic mobility, 3x15 platform locks (thumbs together, wrists locked down, shoulders shrugged)." },
      { name: "Short & Long Toss Platform Angle Drill", sets: "4", reps: "12 reps", notes: "Partner tosses to left and right sides. Passer shuffles, creates flat platform angle pointing to position 2/3 target without swinging arms." },
      { name: "Serve Receive Midline Alignment", sets: "4", reps: "10 reps", notes: "Driven serve receive. Read server toss, step behind ball path to take pass on midline whenever possible." },
      { name: "Seam & Communication Passing Drill", sets: "4", reps: "8 reps", notes: "Two passers cover seam. Server serves into seam zone. Passers call 'MINE' early, angle platform to setter." },
      { name: "Deep Float Serve Weight Transfer Passing", sets: "3", reps: "10 reps", notes: "Receive deep floaters near baseline. Drop hip, absorb ball speed by absorbing with lower body rather than breaking platform." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Lat and shoulder doorway stretches, hamstring static stretch." }
    ]
  },
  {
    id: "volleyball_9",
    name: "Volleyball - Defense: Hard-Driven Digging & Reaction",
    category: "volleyball",
    duration: 55,
    intensity: 9,
    description: "Develop low athletic defensive posture, reaction speed, and platform control to dig hard-driven spikes upward into court center.",
    exercises: [
      { name: "Warm-up & Reaction Shuffles", sets: "1", reps: "5 mins", notes: "Low defensive shuffle, single-leg snap downs, 2x15 platform pop-ups." },
      { name: "Box Hitting Hard-Driven Digging", sets: "5", reps: "8 reps", notes: "Coach hits hard-driven spikes off box from antenna. Defender stays low, absorbs power with angled platform, pops ball 10+ feet high into center court." },
      { name: "Lateral Digging & Angle Creation", sets: "4", reps: "8 reps", notes: "Spikes hit away from defender's body. Fast lateral step, dip inside shoulder, direct ball back into court." },
      { name: "Tennis Ball Reaction Drop & Dig", sets: "4", reps: "6 reps", notes: "Partner drops tennis ball from high angle; defender sprints and catches before second bounce. Followed immediately by volleyball dig." },
      { name: "Rapid-Fire 3-Dig Burnout", sets: "3", reps: "5 reps", notes: "Coach hits 3 consecutive rapid spikes: line dig, angle dig, tip dig back-to-back." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Adductor frog stretch, hip flexor stretch, foam roll IT bands." }
    ]
  },
  {
    id: "volleyball_10",
    name: "Volleyball - Defense: Emergency Plays & Sprawling",
    category: "volleyball",
    duration: 45,
    intensity: 8,
    description: "Learn safe, effective emergency defense techniques including chest rolls, pancake saves, single-arm extension digs, and deep court chases.",
    exercises: [
      { name: "Warm-up & Mat Sprawl Prep", sets: "1", reps: "5 mins", notes: "Dynamic wrist extension, chest rolls on soft mat, low hip mobility." },
      { name: "Pancake Save Technique Drill", sets: "4", reps: "8 reps", notes: "Partner tips ball just over net. Defender drives forward low, slides open palm flat on floor beneath ball before impact." },
      { name: "Chest Roll / Sprawl & Recover", sets: "4", reps: "6 reps", notes: "Sprint forward for short ball, extend platform, absorb ground contact on chest/abdomen, slide forward, pop back up immediately." },
      { name: "Single-Arm Overhead Collapsing Dig", sets: "4", reps: "8 reps", notes: "Ball tipped overhead or off-block deflection. Reach back with single rigid arm, pop ball high over shoulder, roll safely." },
      { name: "Deep Court Chase & Save (Turn-and-Run)", sets: "3", reps: "5 reps", notes: "Coach tosses ball high over defender's head toward baseline. Turn hips, sprint, dive/extend to pop ball back toward court." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Full spine cat-cow stretches, shoulder girdle decompressions." }
    ]
  },
  {
    id: "volleyball_11",
    name: "Volleyball - Attacking: 4-Step Approach & Vertical Spike",
    category: "volleyball",
    duration: 60,
    intensity: 9,
    description: "Maximize vertical approach jump height, refine footwork timing (right-left-right-left), and generate explosive upper body rotational spiking power.",
    exercises: [
      { name: "Warm-up & Approach Rhythm", sets: "1", reps: "5 mins", notes: "Dynamic leg swings, 3x5 dry approach jumps (small-big-plant-explode), arm swing acceleration." },
      { name: "Penultimate Step Explosive Plant Drill", sets: "4", reps: "6 reps", notes: "Focus on second-to-last step (long aggressive penultimate step), low hip sink, violent double-arm backswing, vertical lift off." },
      { name: "Toss-and-Hit Timing Progression", sets: "5", reps: "6 reps", notes: "Setter tosses high outside ball. Hitter times approach to contact ball at peak jump with high elbow, full arm extension, and wrist snap." },
      { name: "In-System vs Out-of-System Approach Timing", sets: "4", reps: "8 reps", notes: "Alternate between fast inside tempo sets (quick approach) and high out-of-system sets (delayed patient approach)." },
      { name: "Max Height Spike Jump off Toss", sets: "4", reps: "5 reps", notes: "All-out approach jump spike over net aiming into deep court corners." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Hamstring stretch, pec stretch, quad foam rolling." }
    ]
  },
  {
    id: "volleyball_12",
    name: "Volleyball - Attacking: Shot Shaping & Cut/Line Precision",
    category: "volleyball",
    duration: 50,
    intensity: 8,
    description: "Master offensive placement skills: sharp cross-court cuts, hard line drives, deep corner roll shots, and subtle cobra tip shots.",
    exercises: [
      { name: "Warm-up & Wrist Snap Drills", sets: "1", reps: "5 mins", notes: "Self-toss wrist snaps against wall, shoulder external rotation mobility." },
      { name: "Sharp Cross-Court Cut Shot Drill", sets: "4", reps: "8 reps", notes: "Approach pointing to line, rotate torso mid-air, cut wrist over top of ball to land inside 10-foot line cross-court." },
      { name: "Hard Line Drive Attack Drill", sets: "4", reps: "8 reps", notes: "Approach, open chest to setter, snap wrist straight down the sideline tape past outside block." },
      { name: "Deep Corner Roll Shot Precision", sets: "4", reps: "6 reps", notes: "Disguise approach as hard spike, lift contact point, roll hand under ball with high arc into deep corners (zones 1 & 5)." },
      { name: "Cobra & Poke Tip Placement Drill", sets: "3", reps: "8 reps", notes: "Stiff-knuckle poke / rigid finger cobra tip over tight double block into donut hole." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Rotator cuff static stretching, thoracic extension." }
    ]
  },
  {
    id: "volleyball_13",
    name: "Volleyball - Attacking: Tooling the Block & Transition Hitting",
    category: "volleyball",
    duration: 55,
    intensity: 9,
    description: "Learn to use the opponent's block to score (wipe-off / tooling), attack tight or off-target sets, and transition efficiently from defense to offense.",
    exercises: [
      { name: "Warm-up & Transition Footwork", sets: "1", reps: "5 mins", notes: "Transition footwork off net (block jump -> turn & drop -> approach), arm warm-up." },
      { name: "Tooling Outside Block Hands (Wipe-Off)", sets: "5", reps: "6 reps", notes: "Coach holds block pads at net. Hitter approaches, aims for outside hand/fingers, snaps wrist outward to wipe ball off block out-of-bounds." },
      { name: "Tight Net Set Rescue Attack", sets: "4", reps: "6 reps", notes: "Set delivered very close to tape. Reach high, joust or soft wrist-wipe high off block hands to avoid getting blocked down." },
      { name: "Dig-to-Attack Transition Repeat Drill", sets: "4", reps: "6 reps", notes: "Hitter starts at net, drops back to dig off-block tip, opens hips, transitions to 10-foot line, approaches and spikes." },
      { name: "Scramble Transition Hitting Circuit", sets: "3", reps: "5 reps", notes: "Continuous rally: hit ball, drop for dig, transition, hit second ball off scramble set." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Glute static stretch, calf stretches, shoulder decompression." }
    ]
  },
  {
    id: "volleyball_14",
    name: "Volleyball - Serving: Standing & Jump Float Masterclass",
    category: "volleyball",
    duration: 45,
    intensity: 7,
    description: "Develop an erratic, unpredictable float serve using solid wrist contact, consistent toss height, and pinpoint deep seam targeting.",
    exercises: [
      { name: "Warm-up & Toss Consistency Drill", sets: "1", reps: "5 mins", notes: "Arm circles, 2x15 toss-and-drop drills (toss ball with non-dominant hand, let drop in front of hitting foot without spin)." },
      { name: "Standing Float Flat-Palm Contact Drill", sets: "4", reps: "10 serves", notes: "Contact ball dead-center with rigid open palm, freeze follow-through immediately at contact. Zero spin." },
      { name: "Jump Float Approach & Timing Drill", sets: "4", reps: "10 serves", notes: "3-step approach (left-right-left for righties), toss on first step, jump forward into court, firm contact at apex." },
      { name: "Deep Corner & Seam Target Drill", sets: "4", reps: "8 serves", notes: "Set targets in deep zone 1, deep zone 5, and passer seams. Serve 8 consecutive balls aiming for specific target cones." },
      { name: "Pressure Serve Under Fatigue Series", sets: "3", reps: "5 serves", notes: "Perform 5 burpees, immediately step to endline and hit target serve. Must get 4/5 in-bounds." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Shoulder cross-body stretch, wrist flexor stretch." }
    ]
  },
  {
    id: "volleyball_15",
    name: "Volleyball - Serving: Explosive Topspin Jump Serve",
    category: "volleyball",
    duration: 50,
    intensity: 9,
    description: "Build maximum aggressive serving power, high toss topspin spin generation, and endline offensive pressure.",
    exercises: [
      { name: "Warm-up & High Toss Timing", sets: "1", reps: "5 mins", notes: "High toss drills with heavy forward spin, full body approach jump warm-up." },
      { name: "High Toss & Spin Acceleration", sets: "4", reps: "8 tosses", notes: "Toss ball 10-12 feet high into court with aggressive forward spin. Practice step-in rhythm." },
      { name: "Approach & Contact Apex Topspin Drill", sets: "5", reps: "6 serves", notes: "Full spike approach into court, jump forward, hit ball high with aggressive wrist snap over top for heavy downward trajectory." },
      { name: "Zone 1 / Zone 6 Power Serve Targets", sets: "4", reps: "6 serves", notes: "Aim high-velocity topspin serves down the line (Zone 1) and deep middle seam (Zone 6)." },
      { name: "Serve & Defensive Transition", sets: "3", reps: "5 reps", notes: "Execute topspin jump serve, land inside court, immediately drop into defensive base stance." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Foam roll quads and latissimus dorsi, hamstrings stretch." }
    ]
  },
  {
    id: "volleyball_16",
    name: "Volleyball - Blocking: Footwork, Pressing & Net Penetration",
    category: "volleyball",
    duration: 55,
    intensity: 8,
    description: "Master swing-blocking footwork, sealing the net, penetrating hands across the tape, and taking away hitter angles.",
    exercises: [
      { name: "Warm-up & Lateral Block Footwork", sets: "1", reps: "5 mins", notes: "Lateral shuffles, footwork steps (step-close, crossover-plant-jump), shoulder band activation." },
      { name: "Penetration & Wall Press Drill", sets: "4", reps: "10 reps", notes: "Stand at wall, jump vertically, press hands over top edge with thumbs up, fingers spread wide, shoulders shrugged." },
      { name: "Swing Block Footwork & Jump Execution", sets: "5", reps: "6 /side", notes: "Start middle, open hips, crossover step, plant both feet parallel to net, drive arms back and jump straight up without drifting." },
      { name: "Double Block Sealing & Penetration", sets: "4", reps: "8 reps", notes: "Outside blocker and middle blocker jump together. Outside blocker sets line, middle seals hip-to-hip, press across tape." },
      { name: "Coach Hitting Pad Block Touch Drill", sets: "3", reps: "8 reps", notes: "Coach hits ball off box into block hands. Blocker must penetrate and press ball downward into opponent's court." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Calf and achilles stretches, thoracic extension on foam roller." }
    ]
  },
  {
    id: "volleyball_17",
    name: "Volleyball - Blocking: Reading Setter & Hitter Eye-Sequencing",
    category: "volleyball",
    duration: 50,
    intensity: 8,
    description: "Train defensive vision using the Ball-Setter-Ball-Hitter reading sequence to anticipate set direction and commit vs read blocking.",
    exercises: [
      { name: "Warm-up & Vision Drills", sets: "1", reps: "5 mins", notes: "Eye tracking drills, lateral shuffle warm-up, low pogo jumps." },
      { name: "Ball-Setter-Ball-Hitter Eye Sequence Drill", sets: "4", reps: "10 reps", notes: "Setter across net receives pass. Blocker tracks: 1. Pass trajectory, 2. Setter hands/body angle, 3. Set ball path, 4. Hitter approach line." },
      { name: "Read vs Commit Blocking Decisions", sets: "4", reps: "8 reps", notes: "Simulate opponent plays: setter quick set (commit jump) vs high outside set (read shuffle step and jump)." },
      { name: "Block vs Peel/Drop Defense Drill", sets: "4", reps: "8 reps", notes: "If setter delivers set out of system or away from net, call 'DROP!', turn hips, peel off net to dig 10-foot line." },
      { name: "Live Setter Reading Reaction Game", sets: "3", reps: "5 mins", notes: "Setter sets random tempo/direction across net. Blocker must read hand shape and move to correct zone before ball reaches hitter." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Hamstring stretch, hip flexor stretch, gentle neck rolls." }
    ]
  },
  {
    id: "volleyball_18",
    name: "Beach Volleyball: 2v2 Sand Footwork & Deep Court Coverage",
    category: "volleyball",
    duration: 60,
    intensity: 9,
    description: "Adapt movement mechanics to sand resistance, master deep sand plant-and-jump techniques, and cover 2v2 court boundaries efficiently.",
    exercises: [
      { name: "Warm-up & Sand Shuffles", sets: "1", reps: "10 mins", notes: "Sand jogging, high knees in sand, lateral sand shuffles, ankle mobility in deep sand." },
      { name: "Sand Plant-and-Pop Vertical Jump Drill", sets: "4", reps: "8 reps", notes: "In sand, take shorter penultimate approach steps, keep weight over balls of feet, drive hips vertically without slipping." },
      { name: "Deep-to-Short Sand Sprint & Dig", sets: "5", reps: "6 reps", notes: "Start at baseline, sprint forward in sand to dig short drop shot, backpedal/shuffle immediately to deep corner." },
      { name: "Wind Adjustment Passing & Setting", sets: "4", reps: "10 reps", notes: "Pass and set in windy sand conditions. Adjust platform angle and set height to account for cross-wind drift." },
      { name: "2v2 Court Coverage Rally Drill", sets: "3", reps: "5 mins", notes: "Continuous 2v2 sand rally: high movement volume, partner covering behind hitter, transition setting on sand." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Deep calf and plantar fascia stretching, hip opener pigeon pose." }
    ]
  },
  {
    id: "volleyball_19",
    name: "Beach Volleyball: Partner Communication & Transition Pepper",
    category: "volleyball",
    duration: 55,
    intensity: 8,
    description: "Enhance 2v2 beach doubles synergy, continuous call-outs ('I GOT', 'HERE', 'SHOT'), hand setting on sand, and transition pepper loops.",
    exercises: [
      { name: "Warm-up & 2-Man Sand Pepper", sets: "1", reps: "10 mins", notes: "Control pass-set-hit pepper on sand with partner. Focus on soft hands and continuous communication." },
      { name: "Call-Out & Seam Decision Drill", sets: "4", reps: "10 reps", notes: "Coach serves/tosses into middle seam. Players must call 'MINE' before ball crosses net, partner immediately turns to set." },
      { name: "Turn-and-Chase Transition Drill", sets: "4", reps: "8 reps", notes: "Defender digs deep, setter calls ball location, defender turns and executes approach jump on sand off scramble set." },
      { name: "Sand Hand Setting Technical Precision", sets: "4", reps: "12 sets", notes: "Practice deep-dish / clean sand hand setting (taking ball slightly deeper into hands legally without double contact)." },
      { name: "2v2 Transition Rally Scoring Game", sets: "3", reps: "6 mins", notes: "Play mini-games to 11 on sand with mandatory 3-touch rule and verbal call-outs on every touch." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Deltoid and upper back stretches, quadriceps stretching." }
    ]
  },
  {
    id: "volleyball_20",
    name: "Beach Volleyball: Defensive Block-and-Peel & Line/Angle",
    category: "volleyball",
    duration: 60,
    intensity: 9,
    description: "Master beach 2v2 defensive tactics: blocker calls (1 finger line / 2 fingers angle), block-and-peel transitions, and defender positioning.",
    exercises: [
      { name: "Warm-up & Hand Signal Practice", sets: "1", reps: "5 mins", notes: "Review hand signals behind back (1 finger = line, 2 fingers = angle), lateral sand shuffles." },
      { name: "Blocker Line Call & Defender Angle Read", sets: "4", reps: "8 reps", notes: "Blocker signals 'Line' (1 finger), blocks line. Defender positions in angle dig zone to absorb cross-court spike." },
      { name: "Blocker Angle Call & Defender Line Read", sets: "4", reps: "8 reps", notes: "Blocker signals 'Angle' (2 fingers), takes away cross-court. Defender shifts straight down the line." },
      { name: "Block-and-Peel Off Net Defensive Transition", sets: "5", reps: "6 reps", notes: "Blocker reads set moving away from net, calls 'PEEL!', opens hips, turns and sprints back to dig short cut or deep option." },
      { name: "2v2 Read-and-Defend Match Scenarios", sets: "3", reps: "6 mins", notes: "Full defensive 2v2 points focusing on seamless blocker-defender communication and scramble digs." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Foam roll hamstrings and glutes, kneeling hip flexor stretch." }
    ]
  },
  {
    id: "volleyball_21",
    name: "Volleyball - Plyometrics: Vertical Jump & Reactive Power",
    category: "volleyball",
    duration: 50,
    intensity: 9,
    description: "Maximize explosive vertical jump height, lower body elastic recoil, and ground reaction speed using stretch-shortening cycle (SSC) plyometrics.",
    exercises: [
      { name: "Warm-up & Pogo Jumps", sets: "1", reps: "5 mins", notes: "Ankle pogo jumps, bodyweight squats, dynamic leg swings." },
      { name: "Depth Jumps off 12-18 Inch Box", sets: "4", reps: "4 reps", notes: "Step off box, touch ground, immediately explode vertically for max height with minimal ground contact time (<0.2s). Rest 2 mins." },
      { name: "Approach Jump onto High Box", sets: "4", reps: "4 reps", notes: "Execute full volleyball spike approach, explode onto 24-30 inch plyo box landing softly in deep squat. Rest 90s." },
      { name: "Single-Leg Lateral Bounds to Vertical Jump", sets: "3", reps: "4 /side", notes: "Leap laterally off left leg, land right leg, immediately explode vertically into block jump posture. Rest 90s." },
      { name: "Weighted Medicine Ball Jump Squats", sets: "3", reps: "6 reps", notes: "Hold 10lb med ball at chest, squat low, explode upward, land softly. Rest 60s." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Foam roll calves, quadriceps, and hamstrings." }
    ]
  },
  {
    id: "volleyball_22",
    name: "Volleyball - Core & Power: Rotational Hitting Strength",
    category: "volleyball",
    duration: 45,
    intensity: 8,
    description: "Build explosive torso rotational power and anti-rotational stability to increase spike velocity and protect the lumbar spine.",
    exercises: [
      { name: "Warm-up & Core Activation", sets: "1", reps: "5 mins", notes: "Dead bugs, bird dogs, thoracic rotations, light torso twists." },
      { name: "Medicine Ball Rotational Wall Slams", sets: "4", reps: "8 /side", notes: "Stand perpendicular to wall, load back hip, rotate violently through core, slam 8-12lb med ball into wall. Rest 60s." },
      { name: "Cable Woodchoppers (High to Low)", sets: "3", reps: "10 /side", notes: "Replicate diagonal spiking motion across body under cable resistance. Rest 60s." },
      { name: "Medicine Ball Overhead Slam & Crunch", sets: "4", reps: "10 reps", notes: "Reach high overhead, slam med ball straight down into floor engaging upper abdominals aggressively. Rest 60s." },
      { name: "Pallof Press Anti-Rotation Holds", sets: "3", reps: "8 /side", notes: "Cable or band at chest height, press forward, resist rotational force for 3s per rep. Rest 45s." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Cobra stretch, child's pose with lateral reach." }
    ]
  },
  {
    id: "volleyball_23",
    name: "Volleyball - Prehab: Shoulder Durability & Rotator Cuff Health",
    category: "volleyball",
    duration: 40,
    intensity: 5,
    description: "Bulletproof the shoulder complex, fortify the rotator cuff (infraspinatus, supraspinatus, subscapularis), and stabilize the scapula.",
    exercises: [
      { name: "Warm-up & Arm Circles", sets: "1", reps: "5 mins", notes: "Forward and backward arm circles, gentle shoulder pendulum swings." },
      { name: "Band External Rotations (Elbow Pinned)", sets: "3", reps: "15 /side", notes: "Keep towel tucked under elbow, pull band outward with controlled eccentric return. Focus on back of shoulder." },
      { name: "Prone Y-T-W-L Raises on Incline Bench", sets: "3", reps: "10 reps", notes: "Light dumbbells (2-5 lbs) or bodyweight. Raise arms in Y, T, W, L shapes holding 1s at top to target lower traps & rhomboids." },
      { name: "Band Face Pulls with External Rotation", sets: "3", reps: "15 reps", notes: "Pull band toward forehead while rotating knuckles back. Squeeze rear delts and scapulae." },
      { name: "Sleeper Stretch & Pec Doorway Stretch", sets: "2", reps: "60s /side", notes: "Lie on side, gently press forearm down toward floor to stretch posterior capsule. Doorway stretch for pec minor." },
      { name: "Cool-Down", sets: "1", reps: "5 mins", notes: "Deep diaphragmatic breathing, gentle neck side-bends." }
    ]
  },
  {
    id: "volleyball_24",
    name: "Volleyball - Match Sim: High-Intensity Intermittent Rally Conditioning",
    category: "volleyball",
    duration: 60,
    intensity: 10,
    description: "Simulate relentless 5-set tournament match rally demands with 15s all-out work / 15s rest intervals and continuous scramble sets.",
    exercises: [
      { name: "Warm-up & Dynamic Court Drills", sets: "1", reps: "10 mins", notes: "High knees, court line sprints, block jump warm-ups, light spiking." },
      { name: "15s All-Out / 15s Rest Rally Simulation", sets: "5", reps: "4 mins", notes: "Continuous 15s high-intensity work (Block jump -> Sprawl dig -> Approach spike -> Lateral shuffle) followed by 15s rest for 4 mins continuously." },
      { name: "Rest Interval", sets: "4", reps: "2 mins", notes: "Active walk and hydration between 4-minute work blocks." },
      { name: "21-Point Continuous Pressure Rally Wash", sets: "3", reps: "8 mins", notes: "Continuous ball feeds from coach upon ball landing. Play continuous points until one side reaches 21 points." },
      { name: "Cool-Down & Heart Rate Recovery Walk", sets: "1", reps: "6 mins", notes: "Slow walking, full body static stretching focusing on lowering heart rate." }
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
  },
  {
    id: "basketball_1",
    name: "Basketball - Full Court Pick-up & Skill Session",
    category: "basketball",
    duration: 75,
    intensity: 8,
    description: "High-intensity full court basketball games, transition conditioning, rim finishing, and jump shot micro-drills.",
    exercises: [
      { name: "Dynamic Warm-up", sets: "1", reps: "10 mins", notes: "High knees, defensive slides, 2x50m court sprints, form shooting." },
      { name: "Full-Court Pick-up Games", sets: "4", reps: "12 mins", notes: "Continuous transition running, perimeter defense, and rebounding effort." },
      { name: "Spot-up & Pull-up Jumpers", sets: "3", reps: "15 shots", notes: "5 spots around the arc (corner, wing, top). Focus on balance and follow-through." },
      { name: "Cool-Down & Free Throws", sets: "1", reps: "10 mins", notes: "Shoot 20 free throws under fatigue. Static groin and hamstring stretch." }
    ]
  },
  {
    id: "grass_volleyball_1",
    name: "Grass Volleyball - Outdoor Doubles Tournament",
    category: "grass_volleyball",
    duration: 90,
    intensity: 8,
    description: "High-volume grass doubles training emphasizing footwork on turf, explosive approach jumps, setting, and court coverage.",
    exercises: [
      { name: "Warm-up & Pepper", sets: "1", reps: "15 mins", notes: "Dynamic turf mobility, shoulder band rotations, 2-man pepper drills." },
      { name: "Doubles Matchplay Sets", sets: "4", reps: "15 mins", notes: "Competitive games to 21. High emphasis on hand setting and transition hitting." },
      { name: "Deep Court Defense & Hitting Lines", sets: "3", reps: "10 reps", notes: "Explosive lateral transition and perimeter defense on grass." },
      { name: "Cool-Down & Shoulder Rehab", sets: "1", reps: "10 mins", notes: "Foam roll calves, band face-pulls, cross-body shoulder stretches." }
    ]
  }
];

export function getExerciseGuideUrl(exerciseName) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent("how to do " + exerciseName)}`;
}
