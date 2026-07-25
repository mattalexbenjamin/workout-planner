// APEX TROPHIES MODULE
// Handles logic for calculating unlocked achievements based on logged workouts.

const APEX_TROPHIES = {
  achievements: [
    {
      id: "iron_mover",
      title: "Iron Mover",
      description: "Total time spent weightlifting.",
      icon: "🏋️‍♂️",
      metricType: "lifting_duration",
      tiers: [
        { level: "bronze", threshold: 100, name: "Bronze Iron Mover" },
        { level: "silver", threshold: 500, name: "Silver Iron Mover" },
        { level: "gold", threshold: 1000, name: "Gold Iron Mover" },
        { level: "platinum", threshold: 2500, name: "Platinum Iron Mover" },
        { level: "diamond", threshold: 5000, name: "Diamond Iron Mover" }
      ]
    },
    {
      id: "court_king",
      title: "Court King",
      description: "Total time spent playing volleyball.",
      icon: "🏐",
      metricType: "volleyball_duration",
      tiers: [
        { level: "bronze", threshold: 60, name: "Bronze Court King" },
        { level: "silver", threshold: 300, name: "Silver Court King" },
        { level: "gold", threshold: 600, name: "Gold Court King" },
        { level: "platinum", threshold: 1200, name: "Platinum Court King" },
        { level: "diamond", threshold: 2400, name: "Diamond Court King" }
      ]
    },
    {
      id: "road_runner",
      title: "Road Runner",
      description: "Total time spent running.",
      icon: "🏃‍♂️",
      metricType: "running_duration",
      tiers: [
        { level: "bronze", threshold: 60, name: "Bronze Road Runner" },
        { level: "silver", threshold: 300, name: "Silver Road Runner" },
        { level: "gold", threshold: 600, name: "Gold Road Runner" },
        { level: "platinum", threshold: 1200, name: "Platinum Road Runner" },
        { level: "diamond", threshold: 2400, name: "Diamond Road Runner" }
      ]
    },
    {
      id: "gridiron_great",
      title: "Gridiron Great",
      description: "Total time spent playing flag football.",
      icon: "🏈",
      metricType: "football_duration",
      tiers: [
        { level: "bronze", threshold: 60, name: "Bronze Gridiron Great" },
        { level: "silver", threshold: 300, name: "Silver Gridiron Great" },
        { level: "gold", threshold: 600, name: "Gold Gridiron Great" },
        { level: "platinum", threshold: 1200, name: "Platinum Gridiron Great" },
        { level: "diamond", threshold: 2400, name: "Diamond Gridiron Great" }
      ]
    },
    {
      id: "consistency_king",
      title: "Consistency King",
      description: "Total number of logged workouts.",
      icon: "🔥",
      metricType: "total_workouts",
      tiers: [
        { level: "bronze", threshold: 5, name: "Bronze Consistency King" },
        { level: "silver", threshold: 20, name: "Silver Consistency King" },
        { level: "gold", threshold: 50, name: "Gold Consistency King" },
        { level: "platinum", threshold: 100, name: "Platinum Consistency King" },
        { level: "diamond", threshold: 200, name: "Diamond Consistency King" }
      ]
    }
  ],

  // Calculate the current values for all metrics based on the history
  calculateMetrics(loggedWorkouts) {
    const metrics = {
      lifting_duration: 0,
      volleyball_duration: 0,
      running_duration: 0,
      football_duration: 0,
      total_workouts: loggedWorkouts.length
    };

    loggedWorkouts.forEach(workout => {
      const duration = parseInt(workout.duration) || 0;
      if (workout.type === "lifting") metrics.lifting_duration += duration;
      if (workout.type === "volleyball") metrics.volleyball_duration += duration;
      if (workout.type === "running") metrics.running_duration += duration;
      if (workout.type === "football") metrics.football_duration += duration;
    });

    return metrics;
  },

  // Evaluate which tiers have been unlocked for each achievement
  evaluateAchievements(loggedWorkouts) {
    const metrics = this.calculateMetrics(loggedWorkouts);
    const unlocked = {};

    this.achievements.forEach(achievement => {
      const userValue = metrics[achievement.metricType] || 0;
      let highestTier = null;
      let nextTier = null;

      // Iterate through tiers (assumes sorted ascending by threshold)
      for (let i = 0; i < achievement.tiers.length; i++) {
        const tier = achievement.tiers[i];
        if (userValue >= tier.threshold) {
          highestTier = tier;
        } else {
          nextTier = tier;
          break; // Stop at the first tier that isn't unlocked
        }
      }

      unlocked[achievement.id] = {
        achievement: achievement,
        currentValue: userValue,
        highestTierUnlocked: highestTier,
        nextTier: nextTier
      };
    });

    return unlocked;
  },
  
  // Gets previous unlocks from storage, compares with current, and returns newly unlocked tiers
  getNewlyUnlockedTiers(loggedWorkouts) {
    const currentUnlocks = this.evaluateAchievements(loggedWorkouts);
    const storedUnlocksStr = localStorage.getItem("apex_unlocked_achievements");
    const storedUnlocks = storedUnlocksStr ? JSON.parse(storedUnlocksStr) : {};
    
    const newlyUnlocked = [];
    
    Object.keys(currentUnlocks).forEach(id => {
      const current = currentUnlocks[id];
      const prevHighest = storedUnlocks[id]; // string of level e.g. "bronze"
      
      if (current.highestTierUnlocked) {
        if (current.highestTierUnlocked.level !== prevHighest) {
          // If the level is different from what was stored, it's a new unlock.
          // Note: if user jumps from Bronze directly to Gold, we'll only notify for Gold as highest.
          newlyUnlocked.push({
            achievement: current.achievement,
            tier: current.highestTierUnlocked
          });
          // Update storage reference to new highest tier
          storedUnlocks[id] = current.highestTierUnlocked.level;
        }
      }
    });
    
    // Save updated unlocks
    localStorage.setItem("apex_unlocked_achievements", JSON.stringify(storedUnlocks));
    
    return {
      allUnlocks: currentUnlocks,
      newlyUnlocked: newlyUnlocked
    };
  }
};
