// APEX ATHLETIC ANALYTICS WORKSPACE ENGINE
// Handles historical calculations, muscle workload tracking, and Chart.js integrations

const APEX_ANALYTICS = {
  workoutTypeChart: null,

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
        if (window.APEX_APP) {
          APEX_APP.state.analyticsRangeDays = days;
          APEX_APP.render();
        }
      });
    });
  },

  updateCharts(logs, rangeDays, currentDateStr) {
    // 1. Filter logs within the selected range (up to currentDateStr)
    const filteredLogs = logs.filter(log => {
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
    let legsStress = 0;
    let shouldersStress = 0;
    let coreStress = 0;

    const categoryData = {
      lifting: { sessions: 0, minutes: 0 },
      volleyball: { sessions: 0, minutes: 0 },
      football: { sessions: 0, minutes: 0 },
      running: { sessions: 0, minutes: 0 },
      prehab: { sessions: 0, minutes: 0 },
      mobility: { sessions: 0, minutes: 0 }
    };

    filteredLogs.forEach(log => {
      // Aggregate Workout Type and Volume
      let cat = "lifting";
      if (log.type === "volleyball") cat = "volleyball";
      else if (log.type === "football") cat = "football";
      else if (log.type === "running") cat = "running";
      else if (log.id === "shoulder_knee_prehab") cat = "prehab";
      else if (log.id === "active_mobility") cat = "mobility";
      else if (log.id === "sand_plyos") cat = "lifting";
      else if (log.id?.includes("strength")) cat = "lifting";
      else if (log.id === "express_circuit") cat = "lifting";
      
      if (categoryData[cat]) {
        categoryData[cat].sessions += 1;
        categoryData[cat].minutes += parseInt(log.duration || 0);
      }

      // Aggregate Muscle Stress
      let logSore = log.soreness;
      if (!logSore && window.APEX_RECOMMENDER) {
        logSore = APEX_RECOMMENDER.getDefaultSorenessImpact(log);
      }
      
      if (logSore) {
        // Multiply by intensity (RPE) as a proxy for total workload/volume
        const intensityFactor = Number(log.intensity || 5) / 5; // standardizes around factor 1.0 at RPE 5
        legsStress += Number(logSore.legs || 1.0) * intensityFactor;
        shouldersStress += Number(logSore.shoulders || 1.0) * intensityFactor;
        coreStress += Number(logSore.core || 1.0) * intensityFactor;
      }
    });

    // Update heatmap text displays
    const shouldersVal = document.getElementById("stat-val-shoulders");
    const coreVal = document.getElementById("stat-val-core");
    const legsVal = document.getElementById("stat-val-legs");

    if (shouldersVal) shouldersVal.innerText = shouldersStress.toFixed(0) + " pts";
    if (coreVal) coreVal.innerText = coreStress.toFixed(0) + " pts";
    if (legsVal) legsVal.innerText = legsStress.toFixed(0) + " pts";

    // 3. Update SVG Heat Map colors and glow
    this.updateSVGHeatmap(shouldersStress, coreStress, legsStress, rangeDays);

    // 4. Update Chart.js Workout distribution
    this.renderWorkoutTypeChart(categoryData);
  },

  updateSVGHeatmap(shoulders, core, legs, rangeDays) {
    // Define workload reference thresholds by range
    let threshold = 15; // 7 days
    if (rangeDays === '30') threshold = 45;
    else if (rangeDays === '90') threshold = 120;
    else if (rangeDays === 'all') threshold = Math.max(80, shoulders, core, legs);

    const getGlowColor = (val, maxVal) => {
      if (val === 0) return { fill: "rgba(255, 255, 255, 0.05)", glow: "none" };
      const pct = Math.min(100, (val / maxVal) * 100);
      
      // Gradient from Success Green -> Warning Orange -> Danger Red
      if (pct < 30) {
        // Low activity: Teal
        return {
          fill: `rgba(16, 185, 129, ${0.15 + (pct/30) * 0.25})`,
          glow: `drop-shadow(0 0 4px rgba(16, 185, 129, ${pct/30}))`
        };
      } else if (pct < 70) {
        // Moderate activity: Orange/Amber
        const factor = (pct - 30) / 40;
        return {
          fill: `rgba(245, 158, 11, ${0.35 + factor * 0.25})`,
          glow: `drop-shadow(0 0 6px rgba(245, 158, 11, ${0.5 + factor * 0.3}))`
        };
      } else {
        // High activity: Blazing Red/Purple
        const factor = (pct - 70) / 30;
        return {
          fill: `rgba(239, 68, 68, ${0.55 + factor * 0.25})`,
          glow: `drop-shadow(0 0 10px rgba(239, 68, 68, ${0.7 + factor * 0.3}))`
        };
      }
    };

    const shouldersUI = getGlowColor(shoulders, threshold);
    const coreUI = getGlowColor(core, threshold);
    const legsUI = getGlowColor(legs, threshold);

    const shouldersPath = document.querySelector("#heatmap-shoulders path");
    const corePath = document.querySelector("#heatmap-core path");
    const legsPath = document.querySelector("#heatmap-legs path");

    if (shouldersPath) {
      shouldersPath.style.fill = shouldersUI.fill;
      shouldersPath.style.filter = shouldersUI.glow;
    }
    if (corePath) {
      corePath.style.fill = coreUI.fill;
      corePath.style.filter = coreUI.glow;
    }
    if (legsPath) {
      legsPath.style.fill = legsUI.fill;
      legsPath.style.filter = legsUI.glow;
    }
  },

  renderWorkoutTypeChart(categoryData) {
    const canvas = document.getElementById("chart-workout-types");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (this.workoutTypeChart) {
      this.workoutTypeChart.destroy();
    }

    const categories = ["Lifting", "Volleyball", "Football", "Running", "Prehab", "Mobility"];
    const keys = ["lifting", "volleyball", "football", "running", "prehab", "mobility"];
    
    const sessionCounts = keys.map(k => categoryData[k].sessions);
    const totalMinutes = keys.map(k => categoryData[k].minutes);

    const colors = [
      "rgba(255, 94, 0, 0.7)",  // Lifting: Orange
      "rgba(245, 158, 11, 0.7)", // Volleyball: Yellow
      "rgba(59, 130, 246, 0.7)", // Football: Blue
      "rgba(16, 185, 129, 0.7)", // Running: Green
      "rgba(168, 85, 247, 0.7)", // Prehab: Purple
      "rgba(100, 116, 139, 0.7)" // Mobility: Grey
    ];

    const borderColors = [
      "#ff5e00",
      "#f59e0b",
      "#3b82f6",
      "#10b981",
      "#a855f7",
      "#64748b"
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
  }
};
