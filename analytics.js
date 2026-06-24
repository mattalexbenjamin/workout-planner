// APEX ATHLETIC ANALYTICS WORKSPACE ENGINE
// Handles historical calculations, muscle workload tracking, and Chart.js integrations

const APEX_ANALYTICS = {
  workoutTypeChart: null,
  liftingFocusChart: null,

  init() {
    this.setupEventListeners();
  },

  setupEventListeners() {
    const rangeContainer = document.getElementById("analytics-range-selector");
    if (!rangeContainer) return;

    rangeContainer.querySelectorAll(".btn-range").forEach(btn => {
      btn.addEventListener("click", (e) => {
        rangeContainer.querySelectorAll(".btn-range").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        
        const days = e.currentTarget.getAttribute("data-days");
        if (typeof APEX_APP !== "undefined") {
          APEX_APP.state.analyticsRangeDays = days;
          APEX_APP.render();
        }
      });
    });
  },

  updateCharts(logs, rangeDays, currentDateStr) {
    // 1. Filter logs within the selected range (up to currentDateStr) and ignore planned workouts
    const filteredLogs = logs.filter(log => {
      if (log.isPlanned) return false;
      if (log.date > currentDateStr) return false;
      if (rangeDays === 'all') return true;
      
      const numDays = parseInt(rangeDays);
      const logDate = new Date(log.date + 'T00:00:00');
      const todayDate = new Date(currentDateStr + 'T00:00:00');
      const diffMs = todayDate - logDate;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays < numDays;
    });

    // 2. Calculate cumulative muscle stress and categories volume
    // 2. Calculate cumulative muscle stress and categories volume
    let legsStress = 0;
    let backStress = 0;
    let chestStress = 0;
    let shouldersStress = 0;
    let armsStress = 0;
    let coreStress = 0;

    const categoryData = {
      lifting: { sessions: 0, minutes: 0 },
      volleyball: { sessions: 0, minutes: 0 },
      football: { sessions: 0, minutes: 0 },
      running: { sessions: 0, minutes: 0 },
      prehab: { sessions: 0, minutes: 0 },
      mobility: { sessions: 0, minutes: 0 },
      other_sports: { sessions: 0, minutes: 0 }
    };

    // Exercise classification logic
    const classifyExercise = (name) => {
      if (!name) return null;
      const strName = typeof name === 'string' ? name : name.name;
      if (!strName) return null;
      const nameLower = strName.toLowerCase();
      // Legs & Glutes
      if (["squat", "plyo", "skip", "rdl", "deadlift", "calf", "leg", "lunges", "lunge", "step-up", "glute", "hip", "bound", "skater", "jumping", "jump", "pogo", "tibial", "heel", "quad", "hamstring", "cleans"].some(kw => nameLower.includes(kw))) return "legs";
      // Back
      if (["row", "pull-up", "chin-up", "lat", "back", "shrug", "pull"].some(kw => nameLower.includes(kw))) return "back";
      // Chest
      if (["bench", "chest", "pec", "push-up", "fly", "pushup"].some(kw => nameLower.includes(kw))) return "chest";
      // Shoulders
      if (["overhead", "press", "shoulder", "delt", "rotator", "cuff", "scapular", "lateral raise", "front raise"].some(kw => nameLower.includes(kw))) return "shoulders";
      // Arms
      if (["arm", "curl", "tricep", "bicep", "forearm", "extension", "pushdown", "kickback"].some(kw => nameLower.includes(kw))) return "arms";
      // Core / Mobility
      if (["twist", "raise", "plank", "crunch", "sit-up", "core", "abs", "oblique", "roll", "belly", "breath", "cat-cow"].some(kw => nameLower.includes(kw))) return "core";
      return null;
    };

    let legsExercisesCount = 0;
    let backExercisesCount = 0;
    let chestExercisesCount = 0;
    let shouldersExercisesCount = 0;
    let armsExercisesCount = 0;
    let coreExercisesCount = 0;

    filteredLogs.forEach(log => {
      // Aggregate Workout Type and Volume
      let cat = "lifting";
      if (log.type === "volleyball") cat = "volleyball";
      else if (log.type === "football") cat = "football";
      else if (log.type === "running") cat = "running";
      else if (["basketball", "hiking", "surfing", "tennis"].includes(log.type)) cat = "other_sports";
      else if (log.id === "shoulder_knee_prehab") cat = "prehab";
      else if (log.id === "active_mobility") cat = "mobility";
      else if (log.id === "sand_plyos") cat = "lifting";
      else if (log.id?.includes("strength")) cat = "lifting";
      else if (log.id === "express_circuit") cat = "lifting";
      
      if (categoryData[cat]) {
        categoryData[cat].sessions += 1;
        categoryData[cat].minutes += parseInt(log.duration || 0);
      }

      // Aggregate checked exercises for lifting workouts
      if (log.type === "lifting" && log.exercises) {
        log.exercises.forEach(exName => {
          const muscleGroup = classifyExercise(exName);
          if (muscleGroup === "legs") legsExercisesCount++;
          else if (muscleGroup === "back") backExercisesCount++;
          else if (muscleGroup === "chest") chestExercisesCount++;
          else if (muscleGroup === "shoulders") shouldersExercisesCount++;
          else if (muscleGroup === "arms") armsExercisesCount++;
          else if (muscleGroup === "core") coreExercisesCount++;
        });
      }

      // Aggregate Muscle Stress for heatmap
      let logSore = typeof APEX_RECOMMENDER !== "undefined" ? APEX_RECOMMENDER.calculateFatigueImpact(log) : {legs:1, back:1, chest:1, shoulders:1, arms:1, core:1, fatigue:1};
      
      if (logSore) {
        // Impact is already algorithmically scaled in calculateFatigueImpact based on duration/intensity/sets/reps
        legsStress += Number(logSore.legs || 1.0);
        backStress += Number(logSore.back || 1.0);
        chestStress += Number(logSore.chest || 1.0);
        shouldersStress += Number(logSore.shoulders || 1.0);
        armsStress += Number(logSore.arms || 1.0);
        coreStress += Number(logSore.core || 1.0);
      }
    });

    // Update heatmap text displays
    const legsVal = document.getElementById("stat-val-legs");
    const backVal = document.getElementById("stat-val-back");
    const chestVal = document.getElementById("stat-val-chest");
    const shouldersVal = document.getElementById("stat-val-shoulders");
    const armsVal = document.getElementById("stat-val-arms");
    const coreVal = document.getElementById("stat-val-core");

    if (legsVal) legsVal.innerText = legsStress.toFixed(0) + " pts";
    if (backVal) backVal.innerText = backStress.toFixed(0) + " pts";
    if (chestVal) chestVal.innerText = chestStress.toFixed(0) + " pts";
    if (shouldersVal) shouldersVal.innerText = shouldersStress.toFixed(0) + " pts";
    if (armsVal) armsVal.innerText = armsStress.toFixed(0) + " pts";
    if (coreVal) coreVal.innerText = coreStress.toFixed(0) + " pts";

    // 3. Update SVG Heat Map colors and glow
    this.updateSVGHeatmap(legsStress, backStress, chestStress, shouldersStress, armsStress, coreStress, rangeDays);

    // 4. Update Chart.js Workout distribution
    this.renderWorkoutTypeChart(categoryData);

    // 5. Update Chart.js Lifting Muscle Focus Radar Chart
    this.renderLiftingFocusChart(legsExercisesCount, backExercisesCount, chestExercisesCount, shouldersExercisesCount, armsExercisesCount, coreExercisesCount);
  },

  updateSVGHeatmap(legs, back, chest, shoulders, arms, core, rangeDays) {
    // Define workload reference thresholds by range
    let threshold = 15; // 7 days
    if (rangeDays === '30') threshold = 45;
    else if (rangeDays === '90') threshold = 120;
    else if (rangeDays === 'all') threshold = Math.max(80, shoulders, core, legs, back, chest, arms);

    const getGlowColor = (val, maxVal) => {
      if (val === 0) return { fill: "rgba(255, 255, 255, 0.05)", glow: "none" };
      const pct = Math.min(100, (val / maxVal) * 100);
      
      // Gradient from Success Green -> Warning Orange -> Danger Red
      if (pct < 30) {
        return {
          fill: `rgba(16, 185, 129, ${0.15 + (pct/30) * 0.25})`,
          glow: `drop-shadow(0 0 4px rgba(16, 185, 129, ${pct/30}))`
        };
      } else if (pct < 70) {
        const factor = (pct - 30) / 40;
        return {
          fill: `rgba(245, 158, 11, ${0.35 + factor * 0.25})`,
          glow: `drop-shadow(0 0 6px rgba(245, 158, 11, ${0.5 + factor * 0.3}))`
        };
      } else {
        const factor = (pct - 70) / 30;
        return {
          fill: `rgba(239, 68, 68, ${0.55 + factor * 0.25})`,
          glow: `drop-shadow(0 0 10px rgba(239, 68, 68, ${0.7 + factor * 0.3}))`
        };
      }
    };

    const styles = {
      legs: getGlowColor(legs, threshold),
      back: getGlowColor(back, threshold),
      chest: getGlowColor(chest, threshold),
      shoulders: getGlowColor(shoulders, threshold),
      arms: getGlowColor(arms, threshold),
      core: getGlowColor(core, threshold)
    };

    const applyStyle = (selector, styleObj) => {
      const el = document.querySelector(selector);
      if (el) {
        el.style.fill = styleObj.fill;
        el.style.filter = styleObj.glow;
      }
    };

    // Front paths
    applyStyle("#heatmap-shoulders-front path", styles.shoulders);
    applyStyle("#heatmap-chest path", styles.chest);
    applyStyle("#heatmap-arms-front path", styles.arms);
    applyStyle("#heatmap-core-front path", styles.core);
    applyStyle("#heatmap-legs-front path", styles.legs);

    // Back paths
    applyStyle("#heatmap-shoulders-back path", styles.shoulders);
    applyStyle("#heatmap-back path", styles.back);
    applyStyle("#heatmap-arms-back path", styles.arms);
    applyStyle("#heatmap-legs-back path", styles.legs);
  },

  renderWorkoutTypeChart(categoryData) {
    const canvas = document.getElementById("chart-workout-types");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (this.workoutTypeChart) {
      this.workoutTypeChart.destroy();
    }

    const categories = ["Lifting", "Volleyball", "Football", "Running", "Prehab", "Mobility", "Other Sports"];
    const keys = ["lifting", "volleyball", "football", "running", "prehab", "mobility", "other_sports"];
    
    const sessionCounts = keys.map(k => categoryData[k].sessions);
    const totalMinutes = keys.map(k => categoryData[k].minutes);

    const colors = [
      "rgba(255, 94, 0, 0.7)",  // Lifting: Orange
      "rgba(245, 158, 11, 0.7)", // Volleyball: Yellow
      "rgba(59, 130, 246, 0.7)", // Football: Blue
      "rgba(16, 185, 129, 0.7)", // Running: Green
      "rgba(168, 85, 247, 0.7)", // Prehab: Purple
      "rgba(100, 116, 139, 0.7)", // Mobility: Grey
      "rgba(6, 182, 212, 0.7)"   // Other Sports: Cyan
    ];

    const borderColors = [
      "#ff5e00",
      "#f59e0b",
      "#3b82f6",
      "#10b981",
      "#a855f7",
      "#64748b",
      "#06b6d4"
    ];

    this.workoutTypeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [
          {
            label: 'Sessions',
            data: sessionCounts,
            backgroundColor: colors,
            borderColor: borderColors,
            borderWidth: 1.5,
            yAxisID: 'y',
            borderRadius: 4
          },
          {
            label: 'Minutes',
            data: totalMinutes,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.35)',
            borderWidth: 1.5,
            borderDash: [4, 4],
            type: 'line',
            yAxisID: 'y1',
            tension: 0.1,
            pointBackgroundColor: '#fff'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#a1a1aa',
              font: { family: 'Outfit', size: 11 }
            }
          },
          tooltip: {
            titleFont: { family: 'Outfit' },
            bodyFont: { family: 'Outfit' }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#a1a1aa',
              font: { family: 'Outfit' }
            }
          },
          y: {
            position: 'left',
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#a1a1aa',
              font: { family: 'Outfit' },
              stepSize: 1
            },
            title: {
              display: true,
              text: 'Sessions',
              color: '#a1a1aa',
              font: { family: 'Outfit' }
            }
          },
          y1: {
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: {
              color: '#a1a1aa',
              font: { family: 'Outfit' }
            },
            title: {
              display: true,
              text: 'Duration (Mins)',
              color: '#a1a1aa',
              font: { family: 'Outfit' }
            }
          }
        }
      }
    });
  },

  renderLiftingFocusChart(legs, back, chest, shoulders, arms, core) {
    const canvas = document.getElementById("chart-lifting-focus");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (this.liftingFocusChart) {
      this.liftingFocusChart.destroy();
    }

    const total = legs + back + chest + shoulders + arms + core;

    this.liftingFocusChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ["Legs", "Back", "Chest", "Shoulders", "Arms", "Core"],
        datasets: [{
          label: 'Completed Exercises',
          data: [legs, back, chest, shoulders, arms, core],
          backgroundColor: "rgba(255, 94, 0, 0.2)",
          borderColor: "#ff5e00",
          pointBackgroundColor: "#ff5e00",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "#ff5e00",
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            pointLabels: {
              color: '#a1a1aa',
              font: { family: 'Outfit', size: 11 }
            },
            ticks: {
              display: false,
              backdropColor: 'transparent'
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            titleFont: { family: 'Outfit' },
            bodyFont: { family: 'Outfit' },
            callbacks: {
              label: function(context) {
                const val = context.raw || 0;
                const pct = total > 0 ? ((val / total) * 100).toFixed(0) : 0;
                return ` ${val} exercises (${pct}%)`;
              }
            }
          }
        }
      }
      }
    });
  },

  summarizeHistoryForInsights(logs, currentDateStr) {
    const today = new Date(currentDateStr + 'T00:00:00');
    
    // Filter out planned future workouts
    const pastLogs = logs.filter(l => !l.isPlanned && new Date(l.date + 'T00:00:00') <= today);
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const last30 = pastLogs.filter(l => new Date(l.date + 'T00:00:00') >= thirtyDaysAgo);
    const last7 = pastLogs.filter(l => new Date(l.date + 'T00:00:00') >= sevenDaysAgo);

    const calcVolume = (logsArray) => {
      let duration = 0;
      let count = 0;
      let avgIntensity = 0;
      logsArray.forEach(l => {
        duration += (l.duration || 0);
        avgIntensity += (l.intensity || 5);
        count++;
      });
      return { 
        duration, 
        count, 
        avgIntensity: count > 0 ? (avgIntensity / count).toFixed(1) : 0 
      };
    };

    const volume30 = calcVolume(last30);
    const volume7 = calcVolume(last7);

    // Get latest soreness
    let latestSoreness = { legs: 1, shoulders: 1, core: 1, fatigue: 1 };
    if (last7.length > 0) {
      // Find the most recent log with soreness data
      const sorted7 = [...last7].sort((a,b) => new Date(b.date) - new Date(a.date));
      const recentLog = sorted7.find(l => l.soreness);
      if (recentLog) {
        latestSoreness = recentLog.soreness;
      }
    }

    return JSON.stringify({
      last30Days: volume30,
      last7Days: volume7,
      latestSoreness,
      totalLogsConsidered: pastLogs.length,
      currentDate: currentDateStr
    }, null, 2);
  }
};
