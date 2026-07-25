// APEX SMART HYBRID RECOMMENDATION ENGINE

const APEX_RECOMMENDER = {
  // Helper to format Date object as YYYY-MM-DD
  formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  // Add days to a date string and return YYYY-MM-DD
  addDays(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return this.formatDateKey(d);
  },

  // Dynamic Soreness Simulation
  calculateSoreness(dateStr, loggedWorkouts) {
    const runningState = { legs: 1.0, back: 1.0, chest: 1.0, shoulders: 1.0, arms: 1.0, core: 1.0, fatigue: 1.0 };
    
    // Sort logged workouts chronologically (oldest first)
    const sortedLogs = [...loggedWorkouts]
      .filter(w => w.date <= dateStr)
      .sort((a, b) => new Date(a.date + 'T00:00:00') - new Date(b.date + 'T00:00:00'));
      
    if (sortedLogs.length === 0) {
      return runningState;
    }
    
    // Find the first date we care about
    let currentDate = new Date(sortedLogs[0].date + 'T00:00:00');
    
    // Helper to format Date back to YYYY-MM-DD
    const toKey = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    
    // Simulate day-by-day up to dateStr
    while (toKey(currentDate) <= dateStr) {
      const curKey = toKey(currentDate);
      
      // 1. Decay at the START of the day (except on the first log day where we initialize)
      if (curKey !== sortedLogs[0].date) {
        runningState.legs = Math.max(1.0, runningState.legs - 1.0);
        runningState.back = Math.max(1.0, runningState.back - 1.0);
        runningState.chest = Math.max(1.0, runningState.chest - 1.0);
        runningState.shoulders = Math.max(1.0, runningState.shoulders - 1.0);
        runningState.arms = Math.max(1.0, runningState.arms - 1.0);
        runningState.core = Math.max(1.0, runningState.core - 1.0);
        runningState.fatigue = Math.max(1.0, runningState.fatigue - 1.0);
      }
      
      // 2. Process logs on this day
      const dayLogs = sortedLogs.filter(w => w.date === curKey);
      dayLogs.forEach(log => {
        // If it's a mobility flow, apply recovery boost first
        if (log.id === 'active_mobility') {
          runningState.legs = Math.max(1.0, runningState.legs - 1.5);
          runningState.back = Math.max(1.0, runningState.back - 1.5);
          runningState.chest = Math.max(1.0, runningState.chest - 1.5);
          runningState.shoulders = Math.max(1.0, runningState.shoulders - 1.5);
          runningState.arms = Math.max(1.0, runningState.arms - 1.5);
          runningState.core = Math.max(1.0, runningState.core - 1.5);
          runningState.fatigue = Math.max(1.0, runningState.fatigue - 1.5);
        }
        
        // Retrieve soreness values (algorithmically calculated fatigue impact)
        const logSoreness = this.calculateFatigueImpact(log);
        
        // Update running state as the max of current soreness and logged soreness
        runningState.legs = Math.max(runningState.legs, Number(logSoreness.legs || 1.0));
        runningState.back = Math.max(runningState.back, Number(logSoreness.back || 1.0));
        runningState.chest = Math.max(runningState.chest, Number(logSoreness.chest || 1.0));
        runningState.shoulders = Math.max(runningState.shoulders, Number(logSoreness.shoulders || 1.0));
        runningState.arms = Math.max(runningState.arms, Number(logSoreness.arms || 1.0));
        runningState.core = Math.max(runningState.core, Number(logSoreness.core || 1.0));
        runningState.fatigue = Math.max(runningState.fatigue, Number(logSoreness.fatigue || 1.0));
      });
      
      // Advance by 1 day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return runningState;
  },
  
  calculateFatigueImpact(log) {
    // Base profiles mapping max muscle exertion (1-5 scale) at 60 mins and 10/10 intensity
    const profiles = {
      volleyball: { legs: 4.5, back: 2.5, chest: 1.5, shoulders: 5.0, arms: 2.5, core: 3.0, fatigue: 4.5 },
      football:   { legs: 5.0, back: 2.0, chest: 1.5, shoulders: 2.5, arms: 1.5, core: 3.5, fatigue: 4.5 },
      running:    { legs: 4.5, back: 1.5, chest: 1.0, shoulders: 1.0, arms: 1.0, core: 2.5, fatigue: 4.0 },
      basketball: { legs: 5.0, back: 2.0, chest: 1.5, shoulders: 2.5, arms: 2.0, core: 3.0, fatigue: 4.5 },
      hiking:     { legs: 4.0, back: 2.0, chest: 1.0, shoulders: 1.0, arms: 1.0, core: 2.5, fatigue: 3.5 },
      surfing:    { legs: 2.5, back: 5.0, chest: 2.5, shoulders: 5.0, arms: 4.5, core: 3.5, fatigue: 4.5 },
      tennis:     { legs: 4.5, back: 3.0, chest: 2.0, shoulders: 4.5, arms: 3.5, core: 3.0, fatigue: 4.0 },
      swimming:   { legs: 2.5, back: 4.5, chest: 3.0, shoulders: 5.0, arms: 4.0, core: 3.5, fatigue: 4.0 },
      cycling:    { legs: 5.0, back: 1.5, chest: 1.0, shoulders: 1.0, arms: 1.0, core: 2.0, fatigue: 3.5 }
    };

    let result = { legs: 1.0, back: 1.0, chest: 1.0, shoulders: 1.0, arms: 1.0, core: 1.0, fatigue: 1.0 };
    
    // Scale by duration (baseline 60 mins) and intensity (baseline 10)
    const durationFactor = Math.min(2.5, (log.duration || 60) / 60);
    const intensityFactor = (log.intensity || 5) / 10;
    const globalScale = durationFactor * intensityFactor;

    if (log.type === "lifting" || log.type === "workout") {
      let totalVolume = 0;
      let muscleLoad = { legs: 0, back: 0, chest: 0, shoulders: 0, arms: 0, core: 0 };
      
      const exArray = Array.isArray(log.exercises) ? log.exercises : [];
      exArray.forEach(exObj => {
         let name = typeof exObj === 'string' ? exObj : exObj.name;
         let sets = typeof exObj === 'string' ? 3 : (exObj.sets || 3);
         let reps = typeof exObj === 'string' ? 10 : (exObj.reps || 10);
         let vol = sets * reps;
         totalVolume += vol;
         
         const n = (name || "").toLowerCase();
         if (n.includes('squat') || n.includes('leg') || n.includes('lunge') || n.includes('deadlift')) muscleLoad.legs += vol;
         if (n.includes('pull') || n.includes('row') || n.includes('back')) muscleLoad.back += vol;
         if (n.includes('push') || n.includes('bench') || n.includes('chest') || n.includes('pec')) muscleLoad.chest += vol;
         if (n.includes('overhead') || n.includes('shoulder') || n.includes('delt')) muscleLoad.shoulders += vol;
         if (n.includes('curl') || n.includes('tricep') || n.includes('arm')) muscleLoad.arms += vol;
         if (n.includes('core') || n.includes('abs') || n.includes('plank')) muscleLoad.core += vol;
      });

      // Intention Multipliers
      let intention = log.intention || "hypertrophy";
      let intentionMultipliers = {
        strength: { specific: 1.2, fatigue: 1.5 },
        hypertrophy: { specific: 1.5, fatigue: 1.2 },
        endurance: { specific: 1.0, fatigue: 1.0 },
        power: { specific: 1.0, fatigue: 1.4 },
        recovery: { specific: 0.5, fatigue: 0.5 }
      };
      let im = intentionMultipliers[intention] || intentionMultipliers.hypertrophy;

      Object.keys(muscleLoad).forEach(m => {
         // 30 reps = baseline 2.0 soreness scale
         let sorenessScore = 1.0 + (muscleLoad[m] / 30) * im.specific * globalScale;
         result[m] = Math.min(5.0, sorenessScore);
      });
      result.fatigue = Math.min(5.0, 1.0 + (totalVolume / 100) * im.fatigue * globalScale);

      // Preserves legacy fallback for missing explicit exercises
      if (log.id === 'volleyball_1') { result.legs = Math.max(result.legs, 3.5); result.fatigue = Math.max(result.fatigue, 3.0); }
      if (log.id === 'weightlifting_2') { result.legs = Math.max(result.legs, 3.0); result.chest = Math.max(result.chest, 2.5); }
      if (log.id === 'weightlifting_4') { result.legs = Math.max(result.legs, 3.5); result.back = Math.max(result.back, 3.0); }
      
    } else {
      // Sports / Cardio
      const p = profiles[log.type] || { legs: 3.0, back: 2.0, chest: 1.5, shoulders: 2.0, arms: 1.5, core: 2.0, fatigue: 3.0 };
      Object.keys(p).forEach(k => {
        let score = 1.0 + (p[k] - 1.0) * globalScale;
        result[k] = Math.min(5.0, Math.max(1.0, score));
      });
    }

    return result;
  },

  // Core Recommendation Function
  getRecommendation(dateStr, loggedWorkouts, calendarEvents, goals) {
    const todayStr = dateStr;
    const tomorrowStr = this.addDays(todayStr, 1);
    const yesterdayStr = this.addDays(todayStr, -1);

    // Calculate current soreness levels
    const soreness = this.calculateSoreness(todayStr, loggedWorkouts);

    // 1. Analyze Calendar Events (Keywords)
    const keywordsSport = ["volleyball", "vball", "beach", "sand", "football", "flag", "game", "match", "tournament", "scrimmage", "basketball", "bball", "hike", "hiking", "surf", "surfing", "tennis"];
    const keywordsBusy = ["meeting", "work", "busy", "flight", "travel", "exam", "conference", "interview"];

    // Filter events
    const todayEvents = calendarEvents.filter(e => e.date === todayStr);
    const tomorrowEvents = calendarEvents.filter(e => e.date === tomorrowStr);

    const hasSportToday = todayEvents.some(e => 
      keywordsSport.some(kw => e.title.toLowerCase().includes(kw))
    );
    const hasSportTomorrow = tomorrowEvents.some(e => 
      keywordsSport.some(kw => e.title.toLowerCase().includes(kw))
    );

    // Sum busy durations in hours
    let todayBusyHours = 0;
    todayEvents.forEach(e => {
      const isBusyEvent = keywordsBusy.some(kw => e.title.toLowerCase().includes(kw));
      if (isBusyEvent && e.start && e.end) {
        const start = new Date(`${todayStr}T${e.start}`);
        const end = new Date(`${todayStr}T${e.end}`);
        const diffMs = end - start;
        if (diffMs > 0) {
          todayBusyHours += diffMs / (1000 * 60 * 60);
        }
      }
    });

    // 2. Analyze Logged History
    const historyLast10Days = loggedWorkouts.filter(w => {
      const wDate = new Date(w.date + 'T00:00:00');
      const tDate = new Date(todayStr + 'T00:00:00');
      const diffTime = tDate - wDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 10;
    });

    const didWorkoutYesterday = loggedWorkouts.some(w => w.date === yesterdayStr);
    const didWorkoutToday = loggedWorkouts.some(w => w.date === todayStr);

    // Categorized history
    const historyLifting = historyLast10Days.filter(w => w.type === 'lifting' || w.id?.includes('weightlifting'));
    const historyPlyos = historyLast10Days.filter(w => w.id === 'volleyball_1');
    const historyAgility = historyLast10Days.filter(w => w.id === 'football_2');
    const historySports = loggedWorkouts.filter(w => (w.type === 'volleyball' || w.type === 'football' || w.type === 'running' || w.type === 'basketball' || w.type === 'hiking' || w.type === 'surfing' || w.type === 'tennis') && w.date === yesterdayStr);

    // 3. Rule Engine Execution
    
    // Rule 0: If they already completed a workout TODAY
    if (didWorkoutToday) {
      return {
        workoutId: "recovery_1",
        name: "Recovery - Active Recovery & Joint Mobility",
        reason: "You already crushed a session today! Keep the momentum going with a light mobility flow to speed up recovery.",
        impactEvents: []
      };
    }

    // NEW Rule Fatigue: Overall Fatigue is High (>= 4.0)
    if (soreness.fatigue >= 4.0) {
      return {
        workoutId: "recovery_2",
        name: "Recovery - Yoga-Inspired Flow (Hips & Spine)",
        reason: `Your overall fatigue is high (${soreness.fatigue.toFixed(1)}/5). Rather than pushing through exhaustion, we suggest this mobility flow to recover your nervous system and muscles.`,
        impactEvents: []
      };
    }

    // Rule 1: Game Day Today
    if (hasSportToday) {
      const sportEvent = todayEvents.find(e => keywordsSport.some(kw => e.title.toLowerCase().includes(kw)));
      return {
        workoutId: "recovery_4",
        name: "Recovery - Upper Body & Shoulder Release",
        reason: `You have a sport activity today (${sportEvent.title}). To protect your joints and prevent injury, we recommend this prehab and release activation rather than heavy training.`,
        impactEvents: [sportEvent]
      };
    }

    // Rule 2: Game Tomorrow (Avoid fatiguing lower body)
    if (hasSportTomorrow) {
      const sportEventTomorrow = tomorrowEvents.find(e => keywordsSport.some(kw => e.title.toLowerCase().includes(kw)));
      return {
        workoutId: "volleyball_3",
        name: "Volleyball - Upper Body Power & Shoulder Prehab",
        reason: `You have a game/play scheduled tomorrow (${sportEventTomorrow.title}). We're skipping heavy leg work and jumps today to keep your muscles fresh, explosive, and fatigue-free for tomorrow.`,
        impactEvents: [sportEventTomorrow]
      };
    }

    // Rule 3: Very Busy Day Today (Recommend express circuit)
    if (todayBusyHours >= 5) {
      const busyEvents = todayEvents.filter(e => keywordsBusy.some(kw => e.title.toLowerCase().includes(kw)));
      return {
        workoutId: "running_2",
        name: "Running - HIIT Track Intervals",
        reason: `Your calendar is packed with ${todayBusyHours.toFixed(1)} hours of busy events today. Here is a relatively quick HIIT running workout to keep your metabolic rate up and save time.`,
        impactEvents: busyEvents
      };
    }

    // NEW Rule Legs Sore: Legs Soreness is High (>= 3.0)
    if (soreness.legs >= 3.0) {
      if (soreness.shoulders < 3.0) {
        return {
          workoutId: "weightlifting_1",
          name: "Weightlifting - Upper Body Hypertrophy",
          reason: `Your legs are sore (${soreness.legs.toFixed(1)}/5). We're avoiding jumps, sprint starts, and heavy squats today. Let's redirect work to upper body hypertrophy.`,
          impactEvents: []
        };
      } else {
        return {
          workoutId: "recovery_3",
          name: "Recovery - Lower Body Focused Deep Stretching",
          reason: `Both your legs (${soreness.legs.toFixed(1)}/5) and shoulders (${soreness.shoulders.toFixed(1)}/5) are sore today. We suggest focusing purely on full body mobility and stretching.`,
          impactEvents: []
        };
      }
    }

    // NEW Rule Shoulders Sore: Shoulders Soreness is High (>= 3.0)
    if (soreness.shoulders >= 3.0) {
      if (soreness.legs < 3.0) {
        return {
          workoutId: "football_2",
          name: "Flag Football - Change of Direction",
          reason: `Your shoulders are sore (${soreness.shoulders.toFixed(1)}/5). We're bypassing overhead pushes and heavy lifts today. Let's do speed and agility drills on turf to keep your conditioning high.`,
          impactEvents: []
        };
      } else {
        return {
          workoutId: "recovery_1",
          name: "Recovery - Active Recovery & Joint Mobility",
          reason: `Both shoulders (${soreness.shoulders.toFixed(1)}/5) and legs (${soreness.legs.toFixed(1)}/5) are sore today. Opting for active mobility flow to dump lactic acid and recover.`,
          impactEvents: []
        };
      }
    }

    // Rule 4: Muscle Soreness from Heavy Sport Yesterday
    if (historySports.length > 0) {
      return {
        workoutId: "recovery_1",
        name: "Recovery - Active Recovery & Joint Mobility",
        reason: `You had a demanding sport session yesterday (${historySports[0].type.toUpperCase()}). Today we focus on flushing out lactic acid and restoring flexibility.`,
        impactEvents: []
      };
    }

    // Rule 5: Training Frequency - Lift Days Goal
    // Look at how many lift sessions completed in the last 7 days vs target
    const liftCount7Days = loggedWorkouts.filter(w => {
      const wDate = new Date(w.date + 'T00:00:00');
      const tDate = new Date(todayStr + 'T00:00:00');
      const diffDays = (tDate - wDate) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays < 7 && (w.type === 'lifting' || w.id?.includes('strength'));
    }).length;

    const weeklyTarget = parseInt(goals.frequency || '3');

    // Rule 6: Rotation of clear days
    // Count occurrences of types in the last 10 days
    const plyosCount = historyPlyos.length;
    const agilityCount = historyAgility.length;
    const liftingCount = historyLifting.length;

    // Check which workout was done least recently
    // If lifting is behind weekly frequency schedule, prioritize lifting
    if (liftCount7Days < weeklyTarget && liftingCount <= plyosCount && liftingCount <= agilityCount) {
      // Alternate between Upper and Lower Body
      const lastLiftingSession = loggedWorkouts
        .filter(w => w.id === 'weightlifting_1' || w.id === 'weightlifting_2')
        .sort((a,b) => new Date(b.date) - new Date(a.date))[0];
      
      const nextLiftId = (!lastLiftingSession || lastLiftingSession.id === 'weightlifting_2') 
        ? 'weightlifting_1' 
        : 'weightlifting_2';

      const nextLiftName = nextLiftId === 'weightlifting_1' ? "Weightlifting - Upper Body Hypertrophy" : "Weightlifting - Lower Body Absolute Strength";

      return {
        workoutId: nextLiftId,
        name: nextLiftName,
        reason: `Your calendar is clear. You've logged ${liftCount7Days}/${weeklyTarget} lifts this week. Let's do some compound strength training to build force and protect muscle mass.`,
        impactEvents: []
      };
    }

    // Prioritize Plyos if it has been done less than speed/lifting
    if (plyosCount <= agilityCount && plyosCount <= liftingCount) {
      return {
        workoutId: "volleyball_1",
        name: "Volleyball - Explosive Vertical Power",
        reason: "Your schedule is wide open. Let's hit the plyometrics to build vertical explosiveness and power for volleyball.",
        impactEvents: []
      };
    }

    // Prioritize Speed/Agility next
    if (agilityCount <= plyosCount && agilityCount <= liftingCount) {
      return {
        workoutId: "football_2",
        name: "Flag Football - Change of Direction",
        reason: "Let's focus on deceleration control, sprint starts, and change of direction agility on your open schedule today.",
        impactEvents: []
      };
    }

    // Fallback: If everything is balanced, recommend a strength session
    const lastLiftingSessionFallback = loggedWorkouts
      .filter(w => w.id === 'weightlifting_1' || w.id === 'weightlifting_2')
      .sort((a,b) => new Date(b.date) - new Date(a.date))[0];
    
    const fallbackId = (!lastLiftingSessionFallback || lastLiftingSessionFallback.id === 'weightlifting_2') 
      ? 'weightlifting_1' 
      : 'weightlifting_2';
    const fallbackName = fallbackId === 'weightlifting_1' ? "Weightlifting - Upper Body Hypertrophy" : "Weightlifting - Lower Body Absolute Strength";

    return {
      workoutId: fallbackId,
      name: fallbackName,
      reason: "Everything is balanced. Let's perform a foundational strength session to keep you shredding and explosive.",
      impactEvents: []
    };
  }
};
