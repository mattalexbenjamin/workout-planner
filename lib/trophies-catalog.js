// APEX TROPHIES & ACHIEVEMENTS MODULE

export const ACHIEVEMENTS = [
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
];

export function calculateMetrics(loggedWorkouts = []) {
  const metrics = {
    lifting_duration: 0,
    volleyball_duration: 0,
    running_duration: 0,
    football_duration: 0,
    total_workouts: loggedWorkouts.length
  };

  loggedWorkouts.forEach(workout => {
    const duration = parseInt(workout.duration) || 0;
    const cat = (workout.category || workout.type || "").toLowerCase();
    if (cat.includes("lifting") || cat.includes("weight")) metrics.lifting_duration += duration;
    if (cat.includes("volleyball")) metrics.volleyball_duration += duration;
    if (cat.includes("running")) metrics.running_duration += duration;
    if (cat.includes("football") || cat.includes("flag")) metrics.football_duration += duration;
  });

  return metrics;
}

export function evaluateAchievements(loggedWorkouts = []) {
  const metrics = calculateMetrics(loggedWorkouts);
  const unlocked = {};

  ACHIEVEMENTS.forEach(achievement => {
    const userValue = metrics[achievement.metricType] || 0;
    let highestTier = null;
    let nextTier = null;

    for (let i = 0; i < achievement.tiers.length; i++) {
      const tier = achievement.tiers[i];
      if (userValue >= tier.threshold) {
        highestTier = tier;
      } else {
        nextTier = tier;
        break;
      }
    }

    unlocked[achievement.id] = {
      achievement,
      currentValue: userValue,
      highestTierUnlocked: highestTier,
      nextTier
    };
  });

  return unlocked;
}
