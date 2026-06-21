// APEX SUMMER '26 MAIN CONTROLLER AND USER INTERACTION LAYER

const APEX_APP = {
  // Global State
  state: {
    activeTab: "tab-today",
    currentDateStr: "2026-06-21", // Start date of our tracking summer campaign
    currentWeekOffset: 0,        // Weekly schedule offset
    goals: {
      startWeight: 195,
      targetWeight: 180,
      currentWeight: 193,
      calories: 2200,
      protein: 180,
      frequency: 3
    },
    loggedWorkouts: [],
    deletedLogs: [], // Tombstone list for workout deletions
    calendarEvents: [],
    syncing: false,
    selectedCalendarId: localStorage.getItem("apex_gcal_calendar_id") || "primary",
    aiProvider: "gemini",
    geminiApiKey: "",
    openaiApiKey: "",
    aiWorkout: null
  },

  // Initialize App
  init() {
    this.loadStateFromStorage();
    this.setupEventListeners();
    this.syncCalendarData();
    this.updateActiveTabUI();
    this.updateDriveStatusUI();
    this.fetchAndRenderCalendarList();
    this.render();

    // Silent background sync on start if token exists
    if (APEX_GCAL.accessToken) {
      setTimeout(() => this.syncWithGDrive(true), 2000);
    }
  },

  // Save/Load Local Storage
  loadStateFromStorage() {
    // Goals
    const savedGoals = localStorage.getItem("apex_goals");
    if (savedGoals) {
      this.state.goals = JSON.parse(savedGoals);
    }
    
    // Logged Workouts & Deleted Logs
    this.state.lastDriveSync = localStorage.getItem("apex_last_drive_sync") ? parseInt(localStorage.getItem("apex_last_drive_sync")) : null;

    // Load deleted log tombstones
    this.state.deletedLogs = [];
    const savedDeleted = localStorage.getItem("apex_deleted_logs");
    if (savedDeleted) {
      this.state.deletedLogs = JSON.parse(savedDeleted);
    }

    const savedLogs = localStorage.getItem("apex_logs");
    if (savedLogs) {
      this.state.loggedWorkouts = JSON.parse(savedLogs);
    } else {
      // Prepopulate mock history items so the experience is premium out of the box
      const mockLogs = [
        {
          id: "active_mobility",
          type: "lifting", // categorized as lift for stats
          date: "2026-06-19",
          duration: 30,
          intensity: 4,
          exercises: ["World's Greatest Stretch", "90/90 Hip Switches", "Deep Goblet Squat Hold"],
          notes: "Felt stiff after sitting all day. Hips opened up nicely.",
          soreness: { legs: 2.0, shoulders: 2.0, core: 1.5, fatigue: 2.0 }
        },
        {
          id: "athletic_strength_a",
          type: "lifting",
          date: "2026-06-20",
          duration: 60,
          intensity: 8,
          exercises: ["Hang Power Cleans", "Barbell Front Squats", "Strict Standing Overhead Press (Dumbbell)"],
          notes: "Legs felt explosive. Front squats were tough at 225lbs but got 6 reps on final set.",
          soreness: { legs: 4.0, shoulders: 3.0, core: 2.5, fatigue: 3.5 }
        }
      ];
      // Filter out any mock logs that have been tombstoned
      this.state.loggedWorkouts = mockLogs.filter(log => {
        const key = log.uuid || (log.date + "_" + log.id);
        return !this.state.deletedLogs.includes(key);
      });
      this.saveLogsToStorage();
    }

    // Google Calendar Settings
    document.getElementById("gcal-mock-toggle").checked = APEX_GCAL.isMockEnabled;

    // Load Settings Inputs
    document.getElementById("goal-start-weight").value = this.state.goals.startWeight;
    document.getElementById("goal-target-weight").value = this.state.goals.targetWeight;
    document.getElementById("goal-current-weight").value = this.state.goals.currentWeight;
    document.getElementById("goal-calories").value = this.state.goals.calories;
    document.getElementById("goal-protein").value = this.state.goals.protein;
    document.getElementById("goal-frequency").value = this.state.goals.frequency;

    // Load AI Coach Settings
    this.state.aiProvider = localStorage.getItem("apex_ai_provider") || "gemini";
    this.state.geminiApiKey = localStorage.getItem("apex_gemini_api_key") || "";
    this.state.openaiApiKey = localStorage.getItem("apex_openai_api_key") || "";
    
    document.getElementById("ai-provider-select").value = this.state.aiProvider;
    document.getElementById("gemini-api-key").value = this.state.geminiApiKey;
    document.getElementById("openai-api-key").value = this.state.openaiApiKey;
    this.updateAIConfigUI();
  },

  saveGoalsToStorage() {
    this.state.goals.lastUpdated = Date.now();
    localStorage.setItem("apex_goals", JSON.stringify(this.state.goals));
  },

  saveLogsToStorage() {
    localStorage.setItem("apex_logs", JSON.stringify(this.state.loggedWorkouts));
  },

  // Google Calendar Syncing
  syncCalendarData() {
    this.state.syncing = true;
    this.updateGcalStatusUI();

    // Determine week dates based on current offset
    const weekRange = this.getWeekStartAndEndDates(this.state.currentWeekOffset);
    
    APEX_GCAL.loadCalendarEvents(
      this.state.selectedCalendarId || "primary",
      weekRange.startStr, 
      weekRange.endStr,
      (events) => {
        // Merge or replace events for the fetched range
        // Remove existing events in this range to avoid duplicates
        const start = new Date(weekRange.startStr + 'T00:00:00');
        const end = new Date(weekRange.endStr + 'T23:59:59');
        
        this.state.calendarEvents = this.state.calendarEvents.filter(e => {
          const eDate = new Date(e.date + 'T00:00:00');
          return eDate < start || eDate > end;
        });

        // Add newly loaded events
        this.state.calendarEvents.push(...events);
        this.state.syncing = false;
        this.updateGcalStatusUI();
        this.render();
      },
      (errorMsg) => {
        console.warn("GCal load issue:", errorMsg);
        this.state.syncing = false;
        this.updateGcalStatusUI();
        // Fallback: If mock mode is enabled, it should load. If not, we just alert
        if (!APEX_GCAL.isMockEnabled) {
          // don't interrupt user unless they click manually
        }
      }
    );
  },

  // Setup UI Interactions
  setupEventListeners() {
    // Navigation
    document.querySelectorAll(".nav-item").forEach(item => {
      item.addEventListener("click", (e) => {
        const btn = e.currentTarget;
        this.state.activeTab = btn.getAttribute("data-tab");
        
        document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
        document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
        
        btn.classList.add("active");
        document.getElementById(this.state.activeTab).classList.add("active");
        
        this.render();
      });
    });

    // Settings: Mock Mode Toggle
    document.getElementById("gcal-mock-toggle").addEventListener("change", (e) => {
      APEX_GCAL.isMockEnabled = e.target.checked;
      localStorage.setItem("apex_gcal_mock_enabled", APEX_GCAL.isMockEnabled);
      this.syncCalendarData();
    });

    // Settings: Google Login
    document.getElementById("btn-login-gcal").addEventListener("click", () => {
      APEX_GCAL.initClient(
        (token) => {
          this.syncCalendarData();
          this.updateDriveStatusUI();
          this.fetchAndRenderCalendarList();
          setTimeout(() => this.syncWithGDrive(false), 1000);
        },
        (error) => {
          alert("Login Failed: " + error);
        }
      );
    });

    // Settings: Google Logout
    document.getElementById("btn-logout-gcal").addEventListener("click", () => {
      APEX_GCAL.logout();
      this.state.lastDriveSync = null;
      this.state.selectedCalendarId = "primary";
      localStorage.removeItem("apex_last_drive_sync");
      localStorage.removeItem("apex_gcal_calendar_id");
      const selectGroup = document.getElementById("settings-calendar-select-group");
      if (selectGroup) selectGroup.style.display = "none";
      this.syncCalendarData();
      this.updateDriveStatusUI();
    });

    // Settings: AI Provider Select Change
    document.getElementById("ai-provider-select").addEventListener("change", () => {
      this.updateAIConfigUI();
    });

    // Settings: Toggle Password Visibility
    const toggleVisible = (inputId, btnId) => {
      const input = document.getElementById(inputId);
      const btn = document.getElementById(btnId);
      if (input && btn) {
        btn.addEventListener("click", () => {
          if (input.type === "password") {
            input.type = "text";
            btn.innerText = "🙈";
          } else {
            input.type = "password";
            btn.innerText = "👁️";
          }
        });
      }
    };
    toggleVisible("gemini-api-key", "btn-toggle-gemini-key");
    toggleVisible("openai-api-key", "btn-toggle-openai-key");

    // Settings: Save AI Config
    document.getElementById("btn-save-ai-settings").addEventListener("click", () => {
      const provider = document.getElementById("ai-provider-select").value;
      const geminiKey = document.getElementById("gemini-api-key").value.trim();
      const openaiKey = document.getElementById("openai-api-key").value.trim();

      this.state.aiProvider = provider;
      this.state.geminiApiKey = geminiKey;
      this.state.openaiApiKey = openaiKey;

      localStorage.setItem("apex_ai_provider", provider);
      localStorage.setItem("apex_gemini_api_key", geminiKey);
      localStorage.setItem("apex_openai_api_key", openaiKey);

      alert("AI settings saved successfully.");
      this.updateAIConfigUI();
      this.renderTodayTab(); // Refresh Today tab to show/hide AI buttons
    });

    // Settings: Clear AI Config
    document.getElementById("btn-clear-ai-settings").addEventListener("click", () => {
      if (confirm("Clear all saved AI API keys?")) {
        this.state.geminiApiKey = "";
        this.state.openaiApiKey = "";
        
        document.getElementById("gemini-api-key").value = "";
        document.getElementById("openai-api-key").value = "";
        
        localStorage.removeItem("apex_gemini_api_key");
        localStorage.removeItem("apex_openai_api_key");

        alert("API keys cleared.");
        this.updateAIConfigUI();
        this.renderTodayTab();
      }
    });

    // Settings: Calendar Select Change
    document.getElementById("gcal-calendar-select").addEventListener("change", (e) => {
      this.state.selectedCalendarId = e.target.value;
      localStorage.setItem("apex_gcal_calendar_id", this.state.selectedCalendarId);
      this.syncCalendarData();
    });

    // Settings: Manual Drive Sync
    document.getElementById("btn-sync-drive").addEventListener("click", () => {
      this.syncWithGDrive(false);
    });

    // Settings: Save Fitness Targets
    document.getElementById("btn-save-goals").addEventListener("click", () => {
      this.state.goals.startWeight = parseFloat(document.getElementById("goal-start-weight").value);
      this.state.goals.targetWeight = parseFloat(document.getElementById("goal-target-weight").value);
      this.state.goals.currentWeight = parseFloat(document.getElementById("goal-current-weight").value);
      this.state.goals.calories = parseInt(document.getElementById("goal-calories").value);
      this.state.goals.protein = parseInt(document.getElementById("goal-protein").value);
      this.state.goals.frequency = parseInt(document.getElementById("goal-frequency").value);

      this.saveGoalsToStorage();
      alert("Fitness targets updated.");

      // Auto-upload the updated goals to Drive
      if (APEX_GCAL.accessToken) {
        this.syncWithGDrive(true);
      }

      this.render();
    });

    // Settings: Export JSON Backup
    document.getElementById("btn-export-backup").addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        goals: this.state.goals,
        logs: this.state.loggedWorkouts
      }));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `apex_workout_backup_${this.state.currentDateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });

    // Settings: Import JSON Backup
    document.getElementById("btn-import-backup-file").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (imported.goals && imported.logs) {
            this.state.goals = imported.goals;
            this.state.loggedWorkouts = imported.logs;
            this.saveGoalsToStorage();
            this.saveLogsToStorage();
            alert("Backup imported successfully!");
            location.reload();
          } else {
            alert("Invalid backup file format.");
          }
        } catch (err) {
          alert("Error parsing backup file: " + err.message);
        }
      };
      reader.readAsText(file);
    });

    // Settings: Clear All Data
    document.getElementById("btn-clear-data").addEventListener("click", () => {
      if (confirm("Are you absolutely sure? This will wipe all logged summer workouts and goals.")) {
        localStorage.clear();
        sessionStorage.clear();
        alert("All local data wiped.");
        location.reload();
      }
    });

    // Today: Sync Calendar Quick Button
    document.getElementById("btn-sync-cal-quick").addEventListener("click", () => {
      this.syncCalendarData();
    });

    // Quick Log Actions Panel
    document.querySelectorAll(".quick-log-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const type = e.currentTarget.getAttribute("data-type");
        if (type === "lifting") {
          // Open generic lift logger
          this.openWorkoutModal(null); 
        } else {
          // Open sport session logger
          this.openSportModal(type);
        }
      });
    });

    // Today: Generate AI Workout
    document.getElementById("btn-generate-ai-workout").addEventListener("click", () => {
      const activeKey = this.state.aiProvider === "gemini" ? this.state.geminiApiKey : this.state.openaiApiKey;
      if (!activeKey) {
        alert("Please configure your API Key in Settings first.");
        return;
      }

      // Show loader
      const spinner = document.getElementById("ai-loading-spinner");
      const generateBtn = document.getElementById("btn-generate-ai-workout");
      const revertBtn = document.getElementById("btn-revert-to-local");
      const startBtn = document.getElementById("btn-start-workout");
      const detailsBox = document.getElementById("recommendation-details");

      spinner.classList.remove("hidden");
      generateBtn.classList.add("hidden");
      revertBtn.classList.add("hidden");
      startBtn.classList.add("hidden");
      detailsBox.classList.add("hidden");

      // Build context
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayOfWeek = days[new Date(this.state.currentDateStr + 'T00:00:00').getDay()];
      
      const context = {
        dateStr: this.state.currentDateStr,
        dayOfWeek: dayOfWeek,
        soreness: APEX_RECOMMENDER.calculateSoreness(this.state.currentDateStr, this.state.loggedWorkouts),
        todayEvents: this.state.calendarEvents.filter(e => e.date === this.state.currentDateStr),
        tomorrowEvents: this.state.calendarEvents.filter(e => e.date === APEX_RECOMMENDER.addDays(this.state.currentDateStr, 1)),
        recentHistory: this.state.loggedWorkouts.slice(0, 5),
        goals: this.state.goals,
        workoutTemplates: ATHLETIC_WORKOUTS
      };

      APEX_AI.generateWorkout(
        this.state.aiProvider,
        activeKey,
        context,
        (workout) => {
          spinner.classList.add("hidden");
          // Add temporary id so openWorkoutModal works
          workout.id = "ai_generated_" + Date.now();
          this.state.aiWorkout = workout;
          
          // Render AI workout
          document.getElementById("recommendation-title").innerHTML = `✨ ${workout.name} <span class="badge badge-accent">AI COACH</span>`;
          document.getElementById("recommendation-reason").innerText = workout.description;
          
          detailsBox.classList.remove("hidden");
          let listHTML = `<ul>`;
          workout.exercises.forEach(ex => {
            listHTML += `<li><strong>${ex.name}</strong> <a href="${getExerciseGuideUrl(ex.name)}" target="_blank" rel="noopener" class="exercise-video-link" title="Watch Form Guide">🎬 Guide</a>: ${ex.sets} sets x ${ex.reps} <br><span class="text-secondary" style="font-size:0.75rem">${ex.notes}</span></li>`;
          });
          listHTML += '</ul>';
          detailsBox.innerHTML = listHTML;

          startBtn.classList.remove("hidden");
          revertBtn.classList.remove("hidden");
        },
        (error) => {
          spinner.classList.add("hidden");
          generateBtn.classList.remove("hidden");
          alert("AI Coach failed to generate workout: " + error);
          this.renderTodayTab(); // Reload local rule-based recommendations
        }
      );
    });

    // Today: Revert to Local Rule recommendation
    document.getElementById("btn-revert-to-local").addEventListener("click", () => {
      this.state.aiWorkout = null;
      this.renderTodayTab();
    });

    // Today: Start Recommended Workout
    document.getElementById("btn-start-workout").addEventListener("click", () => {
      if (this.state.aiWorkout) {
        this.openWorkoutModal(this.state.aiWorkout);
        return;
      }

      const recommendation = APEX_RECOMMENDER.getRecommendation(
        this.state.currentDateStr, 
        this.state.loggedWorkouts, 
        this.state.calendarEvents, 
        this.state.goals
      );
      if (recommendation && recommendation.workoutId) {
        const wTemplate = ATHLETIC_WORKOUTS.find(w => w.id === recommendation.workoutId);
        this.openWorkoutModal(wTemplate);
      }
    });

    // Modal: Close Actions
    document.querySelectorAll(".modal-close, .modal-cancel").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".modal").forEach(m => m.classList.remove("active"));
      });
    });

    // Form: Submit Logged Workout
    document.getElementById("form-log-workout").addEventListener("submit", (e) => {
      e.preventDefault();
      
      const date = document.getElementById("log-workout-date").value;
      const duration = parseInt(document.getElementById("log-workout-duration").value);
      const intensity = parseInt(document.getElementById("log-workout-intensity").value);
      const notes = document.getElementById("log-workout-notes").value;
      const workoutId = document.getElementById("log-workout-id").value;
      
      // Get checked exercises
      const checkedExercises = [];
      document.querySelectorAll(".exercise-chk:checked").forEach(chk => {
        checkedExercises.push(chk.value);
      });

      const legsSore = parseInt(document.getElementById("log-workout-sore-legs").value);
      const shouldersSore = parseInt(document.getElementById("log-workout-sore-shoulders").value);
      const coreSore = parseInt(document.getElementById("log-workout-sore-core").value);
      const fatigueSore = parseInt(document.getElementById("log-workout-sore-fatigue").value);

      const newLog = {
        uuid: Date.now() + "_" + Math.random().toString(36).substr(2, 9),
        id: workoutId || "custom_lift",
        type: "lifting",
        date: date,
        duration: duration,
        intensity: intensity,
        exercises: checkedExercises,
        notes: notes,
        soreness: { legs: legsSore, shoulders: shouldersSore, core: coreSore, fatigue: fatigueSore }
      };

      this.state.loggedWorkouts.push(newLog);
      this.saveLogsToStorage();

      if (APEX_GCAL.accessToken) {
        this.syncWithGDrive(true);
      }
      
      document.getElementById("modal-log-workout").classList.remove("active");
      alert("Workout session saved!");
      this.render();
    });

    // Form: Submit Logged Sport
    document.getElementById("form-log-sport").addEventListener("submit", (e) => {
      e.preventDefault();
      
      const type = document.getElementById("log-sport-type").value;
      const date = document.getElementById("log-sport-date").value;
      const duration = parseInt(document.getElementById("log-sport-duration").value);
      const intensity = parseInt(document.getElementById("log-sport-intensity").value);
      const notes = document.getElementById("log-sport-notes").value;

      const legsSore = parseInt(document.getElementById("log-sport-sore-legs").value);
      const shouldersSore = parseInt(document.getElementById("log-sport-sore-shoulders").value);
      const coreSore = parseInt(document.getElementById("log-sport-sore-core").value);
      const fatigueSore = parseInt(document.getElementById("log-sport-sore-fatigue").value);

      const newLog = {
        uuid: Date.now() + "_" + Math.random().toString(36).substr(2, 9),
        id: type + "_session",
        type: type,
        date: date,
        duration: duration,
        intensity: intensity,
        exercises: [],
        notes: notes,
        soreness: { legs: legsSore, shoulders: shouldersSore, core: coreSore, fatigue: fatigueSore }
      };

      this.state.loggedWorkouts.push(newLog);
      this.saveLogsToStorage();

      if (APEX_GCAL.accessToken) {
        this.syncWithGDrive(true);
      }

      document.getElementById("modal-log-sport").classList.remove("active");
      alert(`${type.toUpperCase()} session saved!`);
      this.render();
    });

    // Calendar: Week Navigation
    document.getElementById("btn-cal-prev").addEventListener("click", () => {
      this.state.currentWeekOffset--;
      this.syncCalendarData();
    });

    document.getElementById("btn-cal-next").addEventListener("click", () => {
      this.state.currentWeekOffset++;
      this.syncCalendarData();
    });

    // Library category filter pills
    document.querySelectorAll(".filter-pills .pill").forEach(pill => {
      pill.addEventListener("click", (e) => {
        document.querySelectorAll(".filter-pills .pill").forEach(p => p.classList.remove("active"));
        e.target.classList.add("active");
        this.renderLibraryTab();
      });
    });
    // Sliders range input updates to reflect values dynamically in labels
    const updateSliderLabels = (prefix) => {
      ['legs', 'shoulders', 'core', 'fatigue'].forEach(cat => {
        const slider = document.getElementById(`log-${prefix}-sore-${cat}`);
        const label = document.getElementById(`lbl-${prefix}-sore-${cat}`);
        if (slider && label) {
          slider.addEventListener("input", (e) => {
            label.innerText = e.target.value;
          });
        }
      });
    };
    updateSliderLabels("workout");
    updateSliderLabels("sport");
  },

  // Modal Open Logic
  openWorkoutModal(workoutTemplate) {
    const modal = document.getElementById("modal-log-workout");
    const form = document.getElementById("form-log-workout");
    form.reset();

    // Reset sliders
    ['legs', 'shoulders', 'core', 'fatigue'].forEach(cat => {
      const slider = document.getElementById(`log-workout-sore-${cat}`);
      const label = document.getElementById(`lbl-workout-sore-${cat}`);
      if (slider && label) {
        slider.value = 1;
        label.innerText = "1";
      }
    });
    
    // Set default date to today
    document.getElementById("log-workout-date").value = this.state.currentDateStr;
    
    const exercisesContainer = document.getElementById("modal-exercises-list");
    exercisesContainer.innerHTML = "";

    if (workoutTemplate) {
      document.getElementById("modal-workout-title").innerText = `Log: ${workoutTemplate.name}`;
      document.getElementById("log-workout-id").value = workoutTemplate.id;
      document.getElementById("log-workout-duration").value = workoutTemplate.duration;
      document.getElementById("log-workout-intensity").value = workoutTemplate.intensity;
      document.getElementById("log-workout-notes").placeholder = workoutTemplate.description;

      workoutTemplate.exercises.forEach(ex => {
        const row = document.createElement("label");
        row.className = "exercise-checkbox-row";
        row.innerHTML = `
          <input type="checkbox" class="exercise-chk" value="${ex.name}" checked>
          <span>
            <strong>${ex.name}</strong>
            <a href="${getExerciseGuideUrl(ex.name)}" target="_blank" rel="noopener" class="exercise-video-link" title="Watch Form Guide">🎬 Guide</a>
            - ${ex.sets}x${ex.reps} <br>
            <small class="text-muted">${ex.notes}</small>
          </span>
        `;
        exercisesContainer.appendChild(row);
      });
    } else {
      // Custom lift session
      document.getElementById("modal-workout-title").innerText = "Log Custom Lift Session";
      document.getElementById("log-workout-id").value = "";
      document.getElementById("log-workout-notes").placeholder = "Sets, reps, or personal records details...";

      // Add a couple of text lines or dynamic entries if needed
      exercisesContainer.innerHTML = `
        <label class="exercise-checkbox-row"><input type="checkbox" class="exercise-chk" value="Upper Body Push Exercises" checked> Upper Body Push</label>
        <label class="exercise-checkbox-row"><input type="checkbox" class="exercise-chk" value="Upper Body Pull Exercises" checked> Upper Body Pull</label>
        <label class="exercise-checkbox-row"><input type="checkbox" class="exercise-chk" value="Lower Body Compound Lift" checked> Lower Body Lifting</label>
        <label class="exercise-checkbox-row"><input type="checkbox" class="exercise-chk" value="Core Workout" checked> Core</label>
      `;
    }

    modal.classList.add("active");
  },

  openSportModal(sportType) {
    const modal = document.getElementById("modal-log-sport");
    const form = document.getElementById("form-log-sport");
    form.reset();

    // Reset sliders
    ['legs', 'shoulders', 'core', 'fatigue'].forEach(cat => {
      const slider = document.getElementById(`log-sport-sore-${cat}`);
      const label = document.getElementById(`lbl-sport-sore-${cat}`);
      if (slider && label) {
        slider.value = 1;
        label.innerText = "1";
      }
    });

    document.getElementById("modal-sport-title").innerText = `Log ${sportType.toUpperCase()} Session`;
    document.getElementById("log-sport-type").value = sportType;
    document.getElementById("log-sport-date").value = this.state.currentDateStr;

    // Custom placeholders based on sport
    const notesField = document.getElementById("log-sport-notes");
    if (sportType === "volleyball") {
      notesField.placeholder = "Set/Spike feel, beach sand conditions, matches won/lost...";
    } else if (sportType === "football") {
      notesField.placeholder = "Touchdowns scored, sprints, cuts, turf conditions...";
    } else if (sportType === "running") {
      notesField.placeholder = "Distance covered (miles), average pace, split timings...";
    }

    modal.classList.add("active");
  },

  // Main UI Renders
  render() {
    this.renderTodayTab();
    this.renderCalendarTab();
    this.renderLibraryTab();
    this.renderHistoryTab();
  },

  // Date utilities
  getWeekStartAndEndDates(offsetWeeks) {
    // Current date is 2026-06-21
    const baseDate = new Date("2026-06-21T00:00:00");
    baseDate.setDate(baseDate.getDate() + (offsetWeeks * 7));
    
    // Find Monday of that week (2026-06-21 is a Sunday, so we find Monday June 15 or similar)
    const day = baseDate.getDay();
    const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(baseDate.setDate(diff));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return {
      startStr: APEX_RECOMMENDER.formatDateKey(monday),
      endStr: APEX_RECOMMENDER.formatDateKey(sunday),
      monday: monday,
      sunday: sunday
    };
  },

  updateGcalStatusUI() {
    const badge = document.getElementById("gcal-status-badge");
    const txt = document.getElementById("gcal-status-text");
    const loginBtn = document.getElementById("btn-login-gcal");
    const logoutBtn = document.getElementById("btn-logout-gcal");

    if (APEX_GCAL.isMockEnabled) {
      badge.className = "status-badge connected";
      badge.style.borderColor = "var(--color-warning-dim)";
      badge.style.color = "var(--color-warning)";
      badge.querySelector(".status-dot").style.backgroundColor = "var(--color-warning)";
      badge.querySelector(".status-dot").style.boxShadow = "0 0 8px var(--color-warning)";
      txt.innerText = "Calendar Mock Mode";
      loginBtn.classList.add("hidden");
      logoutBtn.classList.add("hidden");
    } else if (APEX_GCAL.accessToken) {
      badge.className = "status-badge connected";
      badge.removeAttribute("style");
      badge.querySelector(".status-dot").removeAttribute("style");
      txt.innerText = "Calendar Connected";
      loginBtn.classList.add("hidden");
      logoutBtn.classList.remove("hidden");
    } else {
      badge.className = "status-badge disconnected";
      badge.removeAttribute("style");
      badge.querySelector(".status-dot").removeAttribute("style");
      txt.innerText = "Calendar Disconnected";
      loginBtn.classList.remove("hidden");
      logoutBtn.classList.add("hidden");
    }
  },

  updateActiveTabUI() {
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    
    const activeBtn = document.querySelector(`.nav-item[data-tab="${this.state.activeTab}"]`);
    if (activeBtn) activeBtn.classList.add("active");
    
    const activePane = document.getElementById(this.state.activeTab);
    if (activePane) activePane.classList.add("active");
  },

  renderTodayTab() {
    // 1. Set Date
    const today = new Date(this.state.currentDateStr + 'T00:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById("today-date-str").innerText = today.toLocaleDateString('en-US', options);

    const titleEl = document.getElementById("recommendation-title");
    const reasonEl = document.getElementById("recommendation-reason");
    const detailsBox = document.getElementById("recommendation-details");
    const startBtn = document.getElementById("btn-start-workout");
    const syncBtn = document.getElementById("btn-sync-cal-quick");
    const generateAiBtn = document.getElementById("btn-generate-ai-workout");
    const revertBtn = document.getElementById("btn-revert-to-local");
    const spinner = document.getElementById("ai-loading-spinner");

    // Hide AI loader on render refresh
    if (spinner) spinner.classList.add("hidden");

    // Check if an AI workout has been generated
    if (this.state.aiWorkout) {
      const workout = this.state.aiWorkout;
      titleEl.innerHTML = `✨ ${workout.name} <span class="badge badge-accent">AI COACH</span>`;
      reasonEl.innerText = workout.description;
      
      detailsBox.classList.remove("hidden");
      let listHTML = `<ul>`;
      workout.exercises.forEach(ex => {
        listHTML += `<li><strong>${ex.name}</strong> <a href="${getExerciseGuideUrl(ex.name)}" target="_blank" rel="noopener" class="exercise-video-link" title="Watch Form Guide">🎬 Guide</a>: ${ex.sets} sets x ${ex.reps} <br><span class="text-secondary" style="font-size:0.75rem">${ex.notes}</span></li>`;
      });
      listHTML += '</ul>';
      detailsBox.innerHTML = listHTML;

      startBtn.classList.remove("hidden");
      if (generateAiBtn) generateAiBtn.classList.add("hidden");
      if (revertBtn) revertBtn.classList.remove("hidden");
      if (syncBtn) syncBtn.classList.add("hidden");
      
      // Load context card if calendar events exist
      const contextCard = document.getElementById("calendar-context-card");
      const contextList = document.getElementById("today-events-list");
      const todayEvents = this.state.calendarEvents.filter(e => e.date === this.state.currentDateStr);
      if (todayEvents.length > 0) {
        contextCard.classList.remove("hidden");
        contextList.innerHTML = "";
        todayEvents.forEach(evt => {
          const li = document.createElement("li");
          li.className = "context-event-item";
          li.innerHTML = `
            <span>📅 ${evt.title}</span>
            <span class="context-event-time">${evt.start || 'all-day'} - ${evt.end || ''}</span>
          `;
          contextList.appendChild(li);
        });
      } else {
        contextCard.classList.add("hidden");
      }
      return;
    }

    // Otherwise, load Rule Recommendation
    if (revertBtn) revertBtn.classList.add("hidden");
    
    const recommendation = APEX_RECOMMENDER.getRecommendation(
      this.state.currentDateStr, 
      this.state.loggedWorkouts, 
      this.state.calendarEvents, 
      this.state.goals
    );

    if (recommendation) {
      titleEl.innerText = recommendation.name;
      reasonEl.innerText = recommendation.reason;
      
      const wTemplate = ATHLETIC_WORKOUTS.find(w => w.id === recommendation.workoutId);
      
      if (wTemplate) {
        detailsBox.classList.remove("hidden");
        let listHTML = `<h4>${wTemplate.description}</h4><ul>`;
        wTemplate.exercises.forEach(ex => {
          listHTML += `<li><strong>${ex.name}</strong> <a href="${getExerciseGuideUrl(ex.name)}" target="_blank" rel="noopener" class="exercise-video-link" title="Watch Form Guide">🎬 Guide</a>: ${ex.sets} sets x ${ex.reps} <br><span class="text-secondary" style="font-size:0.75rem">${ex.notes}</span></li>`;
        });
        listHTML += '</ul>';
        detailsBox.innerHTML = listHTML;
        startBtn.classList.remove("hidden");
        
        // Show AI Button if API key is configured
        const activeKey = this.state.aiProvider === "gemini" ? this.state.geminiApiKey : this.state.openaiApiKey;
        if (activeKey && generateAiBtn) {
          generateAiBtn.classList.remove("hidden");
        } else if (generateAiBtn) {
          generateAiBtn.classList.add("hidden");
        }
      } else {
        detailsBox.classList.add("hidden");
        startBtn.classList.add("hidden");
        if (generateAiBtn) generateAiBtn.classList.add("hidden");
      }

      // Show calendar impacts if they exist
      const contextCard = document.getElementById("calendar-context-card");
      const contextList = document.getElementById("today-events-list");
      
      if (recommendation.impactEvents && recommendation.impactEvents.length > 0) {
        contextCard.classList.remove("hidden");
        contextList.innerHTML = "";
        recommendation.impactEvents.forEach(evt => {
          const li = document.createElement("li");
          li.className = "context-event-item";
          li.innerHTML = `
            <span>📅 ${evt.title}</span>
            <span class="context-event-time">${evt.start} - ${evt.end}</span>
          `;
          contextList.appendChild(li);
        });
      } else {
        contextCard.classList.add("hidden");
      }
      
      if (syncBtn) syncBtn.classList.remove("hidden");
    }

    // Adjust quick actions view (sync button logic)
    if (APEX_GCAL.isMockEnabled || APEX_GCAL.accessToken) {
      syncBtn.innerText = "Refresh Calendar";
    } else {
      syncBtn.innerText = "Sync Google Calendar to Personalize";
    }

    // 3. Muscle Soreness & Recovery progress rendering
    const currentSoreness = APEX_RECOMMENDER.calculateSoreness(this.state.currentDateStr, this.state.loggedWorkouts);

    const updateSorenessBar = (cat) => {
      const val = currentSoreness[cat] || 1.0;
      const valText = document.getElementById(`soreness-val-${cat}`);
      if (valText) {
        valText.innerText = `${val.toFixed(1)}/5`;
      }
      
      const bar = document.getElementById(`soreness-bar-${cat}`);
      if (bar) {
        // Convert 1-5 scale to 0-100% progress
        const pct = ((val - 1) / 4) * 100;
        bar.style.width = `${pct}%`;
        
        // Dynamic color coding
        bar.className = "progress-fill soreness-fill";
        if (val < 2.0) {
          bar.classList.add("green");
        } else if (val < 3.0) {
          bar.classList.add("yellow");
        } else if (val < 4.0) {
          bar.classList.add("orange");
        } else {
          bar.classList.add("red");
        }
      }
    };

    updateSorenessBar("legs");
    updateSorenessBar("shoulders");
    updateSorenessBar("core");

    // Update Overall Fatigue stats
    const fatigueVal = currentSoreness.fatigue || 1.0;
    const fatigueText = document.getElementById("soreness-val-fatigue");
    if (fatigueText) {
      fatigueText.innerText = `${fatigueVal.toFixed(1)} / 5`;
      
      // Color coding text
      fatigueText.removeAttribute("class");
      fatigueText.className = "stat-value";
      if (fatigueVal >= 4.0) {
        fatigueText.style.color = "var(--color-danger)";
      } else if (fatigueVal >= 3.0) {
        fatigueText.style.color = "var(--color-warning)";
      } else {
        fatigueText.style.color = "var(--color-success)";
      }
    }

    // Update Recovery Status badge
    const recoveryBadge = document.getElementById("recovery-status-badge");
    if (recoveryBadge) {
      const maxSore = Math.max(currentSoreness.legs, currentSoreness.shoulders, currentSoreness.core, currentSoreness.fatigue);
      if (maxSore >= 4.0) {
        recoveryBadge.className = "badge badge-danger";
        recoveryBadge.innerText = "Exhausted / Sore";
      } else if (maxSore >= 3.0) {
        recoveryBadge.className = "badge badge-warning";
        recoveryBadge.innerText = "Moderately Sore";
      } else {
        recoveryBadge.className = "badge badge-success";
        recoveryBadge.innerText = "Feeling Fresh";
      }
    }

    // 4. Shred progress
    const w = this.state.goals;
    document.getElementById("shred-current-weight").innerText = w.currentWeight;
    document.getElementById("shred-target-weight").innerText = w.targetWeight;
    document.getElementById("shred-calories").innerText = w.calories;
    document.getElementById("shred-protein").innerText = w.protein;

    // Weight progress fill
    const range = w.startWeight - w.targetWeight;
    if (range > 0) {
      const progress = w.startWeight - w.currentWeight;
      const pct = Math.max(0, Math.min(100, (progress / range) * 100));
      document.getElementById("weight-progress-fill").style.width = `${pct}%`;
    } else {
      document.getElementById("weight-progress-fill").style.width = `100%`;
    }
  },

  renderCalendarTab() {
    const weekRange = this.getWeekStartAndEndDates(this.state.currentWeekOffset);
    
    // Label week
    const opt = { month: 'short', day: 'numeric' };
    const startStr = weekRange.monday.toLocaleDateString('en-US', opt);
    const endStr = weekRange.sunday.toLocaleDateString('en-US', opt);
    document.getElementById("calendar-week-range").innerText = `Week ${this.state.currentWeekOffset + 3}: ${startStr} - ${endStr}`;

    const grid = document.getElementById("calendar-weekly-grid");
    grid.innerHTML = "";

    // Generate Mon-Sun cards
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekRange.monday);
      dayDate.setDate(weekRange.monday.getDate() + i);
      const dayKey = APEX_RECOMMENDER.formatDateKey(dayDate);
      
      const isToday = dayKey === this.state.currentDateStr;
      
      const dayCard = document.createElement("div");
      dayCard.className = `day-card ${isToday ? 'today' : ''}`;
      
      const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = dayDate.getDate();

      // Find events on this day
      const dayEvents = this.state.calendarEvents.filter(e => e.date === dayKey);
      const dayLogs = this.state.loggedWorkouts.filter(w => w.date === dayKey);

      let contentHTML = "";

      if (dayEvents.length === 0 && dayLogs.length === 0) {
        contentHTML = `<div class="day-placeholder">Rest / Recovery Day</div>`;
      } else {
        contentHTML = `<div class="day-events">`;
        
        // Render completed workout logs first (priority checkmarks!)
        dayLogs.forEach(log => {
          const typeIcon = log.type === 'lifting' ? '🏋️‍♂️' : log.type === 'volleyball' ? '🏐' : log.type === 'football' ? '🏈' : '🏃‍♂️';
          const title = log.id ? ATHLETIC_WORKOUTS.find(w => w.id === log.id)?.name || log.id.toUpperCase().replace('_', ' ') : 'Workout';
          
          contentHTML += `
            <div class="cal-event-badge ${log.type}">
              <span>✅ ${typeIcon} Completed: ${title}</span>
              <span class="event-details">${log.duration}m | RPE ${log.intensity}</span>
            </div>
          `;
        });

        // Render Calendar events next
        dayEvents.forEach(evt => {
          // Check if this event was keyword flagged
          const titleLower = evt.title.toLowerCase();
          const isVb = ["volleyball", "vball", "beach", "sand"].some(kw => titleLower.includes(kw));
          const isFb = ["football", "flag", "game"].some(kw => titleLower.includes(kw));
          const isRun = ["running", "run", "track"].some(kw => titleLower.includes(kw));
          
          const eventClass = isVb ? 'volleyball' : isFb ? 'football' : isRun ? 'running' : 'gcal';
          const icon = isVb ? '🏐' : isFb ? '🏈' : isRun ? '🏃‍♂️' : '📅';

          contentHTML += `
            <div class="cal-event-badge ${eventClass}">
              <span>${icon} ${evt.title}</span>
              <span class="event-details">${evt.start}</span>
            </div>
          `;
        });

        contentHTML += `</div>`;
      }

      dayCard.innerHTML = `
        <div class="day-info">
          <span class="day-name">${dayName}</span>
          <span class="day-num">${dayNum}</span>
        </div>
        <div class="day-content">
          ${contentHTML}
        </div>
      `;

      grid.appendChild(dayCard);
    }
  },

  renderLibraryTab() {
    const activeCategory = document.querySelector(".filter-pills .pill.active").getAttribute("data-category");
    const grid = document.getElementById("library-grid");
    grid.innerHTML = "";

    const filtered = ATHLETIC_WORKOUTS.filter(w => activeCategory === "all" || w.category === activeCategory);

    filtered.forEach(w => {
      const card = document.createElement("div");
      card.className = "library-card";
      
      const typeBadge = w.category === 'strength' ? 'badge-accent' : w.category === 'explosive' ? 'badge-warning' : w.category === 'speed' ? 'badge-info' : 'badge-success';

      let exercisesList = "";
      w.exercises.forEach(ex => {
        exercisesList += `
          <li>
            <span><strong>${ex.name}</strong> <a href="${getExerciseGuideUrl(ex.name)}" target="_blank" rel="noopener" class="exercise-video-link" title="Watch Form Guide">🎬 Guide</a></span>
            <span class="exercise-params">${ex.sets}x${ex.reps}</span>
          </li>
        `;
      });

      card.innerHTML = `
        <div class="library-card-header">
          <div>
            <h3>${w.name}</h3>
            <span class="badge ${typeBadge}">${w.category.toUpperCase()}</span>
          </div>
          <button class="btn btn-icon btn-start-manual" style="font-size:0.75rem; border-radius:8px; padding: 4px 8px; width:auto; height:auto;">Log</button>
        </div>
        <p class="library-card-desc">${w.description}</p>
        <div class="library-card-meta">
          <span>⏱ ${w.duration} mins</span>
          <span>⚡ Intensity: ${w.intensity}/10</span>
        </div>
        <div class="library-exercises-expand">
          <ul class="expanded-exercises-list">
            ${exercisesList}
          </ul>
          <button class="btn btn-primary btn-full btn-log-this">Start Workout Session</button>
        </div>
      `;

      // Expand card on click (avoid trigger on button clicks)
      card.addEventListener("click", (e) => {
        if (e.target.tagName === "BUTTON") return;
        
        const wasExpanded = card.classList.contains("expanded");
        document.querySelectorAll(".library-card").forEach(c => c.classList.remove("expanded"));
        
        if (!wasExpanded) {
          card.classList.add("expanded");
        }
      });

      // Quick log button
      card.querySelector(".btn-start-manual").addEventListener("click", (e) => {
        e.stopPropagation();
        this.openWorkoutModal(w);
      });

      // Expanded bottom start button
      card.querySelector(".btn-log-this").addEventListener("click", (e) => {
        e.stopPropagation();
        this.openWorkoutModal(w);
      });

      grid.appendChild(card);
    });
  },

  renderHistoryTab() {
    const list = document.getElementById("history-list");
    list.innerHTML = "";

    // Sort by date reverse (newest first)
    const sorted = [...this.state.loggedWorkouts].sort((a,b) => new Date(b.date) - new Date(a.date));

    // Calculate Summary Stats
    const totalCount = sorted.length;
    const vballCount = sorted.filter(w => w.type === 'volleyball').length;
    const footballCount = sorted.filter(w => w.type === 'football').length;
    const liftingCount = sorted.filter(w => w.type === 'lifting').length;

    document.getElementById("stat-total-workouts").innerText = totalCount;
    document.getElementById("stat-vball-sessions").innerText = vballCount;
    document.getElementById("stat-football-sessions").innerText = footballCount;
    document.getElementById("stat-lifting-sessions").innerText = liftingCount;

    if (sorted.length === 0) {
      list.innerHTML = `<div class="empty-state">No activities logged yet. Start today!</div>`;
      return;
    }

    sorted.forEach((log, index) => {
      // Find template details if it was a template
      const template = ATHLETIC_WORKOUTS.find(w => w.id === log.id);
      const title = template ? template.name : (log.id ? log.id.replace('_', ' ').toUpperCase() : 'Custom Session');
      
      const typeBadge = log.type === 'lifting' ? 'badge-accent' : log.type === 'volleyball' ? 'badge-warning' : log.type === 'football' ? 'badge-info' : 'badge-success';

      const item = document.createElement("div");
      item.className = "history-item";

      let exercisesHTML = "";
      if (log.exercises && log.exercises.length > 0) {
        exercisesHTML = `<div class="history-item-notes" style="font-style:normal; margin-bottom: 4px;"><strong>Exercises:</strong> ${log.exercises.join(', ')}</div>`;
      }

      const opt = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
      const dateFormatted = new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', opt);

      item.innerHTML = `
        <div class="history-item-header">
          <div>
            <span class="history-item-title">${title}</span>
            <span class="badge ${typeBadge}" style="margin-left: 8px;">${log.type.toUpperCase()}</span>
          </div>
          <span class="history-item-date">${dateFormatted}</span>
        </div>
        <div class="history-item-meta">
          <span>⏱ ${log.duration} mins</span>
          <span>⚡ RPE: ${log.intensity}/10</span>
        </div>
        ${exercisesHTML}
        ${log.notes ? `<div class="history-item-notes">"${log.notes}"</div>` : ''}
        <div class="history-item-actions">
          <button class="btn-delete-log" data-date="${log.date}" data-id="${log.id}">Delete</button>
        </div>
      `;

      // Wire delete action
      item.querySelector(".btn-delete-log").addEventListener("click", (e) => {
        if (confirm("Delete this session from your history?")) {
          // Remove from state (matching index of sorted, find original index)
          const origIndex = this.state.loggedWorkouts.findIndex(w => w.date === log.date && w.id === log.id && w.notes === log.notes);
          if (origIndex > -1) {
            const deletedLog = this.state.loggedWorkouts[origIndex];
            const logKey = deletedLog.uuid || (deletedLog.date + "_" + deletedLog.id);
            
            if (!this.state.deletedLogs.includes(logKey)) {
              this.state.deletedLogs.push(logKey);
              localStorage.setItem("apex_deleted_logs", JSON.stringify(this.state.deletedLogs));
            }

            this.state.loggedWorkouts.splice(origIndex, 1);
            this.saveLogsToStorage();
            alert("Session deleted.");
            
            // Auto-upload deletion to Drive if logged in
            if (APEX_GCAL.accessToken) {
              this.syncWithGDrive(true); // silent sync
            }
            
            this.render();
          }
        }
      });

      list.appendChild(item);
    });
  },

  // Google Drive Sync Helper Functions
  mergeLogs(localLogs, driveLogs) {
    const logsMap = {};
    const addLog = (log) => {
      const key = log.uuid || (log.date + "_" + log.id);
      logsMap[key] = log;
    };
    driveLogs.forEach(addLog);
    localLogs.forEach(addLog);
    return Object.values(logsMap).sort((a,b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00'));
  },

  syncWithGDrive(silent = false) {
    if (APEX_GCAL.isMockEnabled) {
      if (!silent) alert("Google Drive Sync is disabled in Mock Calendar Mode.");
      return;
    }
    if (!APEX_GCAL.accessToken) {
      if (!silent) alert("Please sign in with Google first to enable Cloud Sync.");
      return;
    }

    this.state.syncingDrive = true;
    this.updateDriveStatusUI();

    APEX_GCAL.findBackupFile(
      (file) => {
        const localData = {
          goals: this.state.goals,
          logs: this.state.loggedWorkouts,
          deletedLogs: this.state.deletedLogs || [],
          lastSyncTime: Date.now()
        };

        if (file) {
          APEX_GCAL.downloadBackupFile(
            file.id,
            (driveData) => {
              // Merge Goals: newer lastUpdated timestamp wins
              const driveGoals = driveData.goals || {};
              const localGoals = this.state.goals || {};
              if (driveGoals.lastUpdated > (localGoals.lastUpdated || 0)) {
                this.state.goals = driveGoals;
                this.saveGoalsToStorage();
                this.loadStateFromStorage();
              }

              // Merge and filter deleted log keys (tombstones)
              const driveDeleted = driveData.deletedLogs || [];
              const localDeleted = this.state.deletedLogs || [];
              const mergedDeleted = Array.from(new Set([...localDeleted, ...driveDeleted]));
              this.state.deletedLogs = mergedDeleted;
              localStorage.setItem("apex_deleted_logs", JSON.stringify(mergedDeleted));

              const mergedLogs = this.mergeLogs(this.state.loggedWorkouts, driveData.logs || [])
                .filter(log => {
                  const key = log.uuid || (log.date + "_" + log.id);
                  return !mergedDeleted.includes(key);
                });

              this.state.loggedWorkouts = mergedLogs;
              this.saveLogsToStorage();

              localData.logs = mergedLogs;
              localData.deletedLogs = mergedDeleted;
              localData.goals = this.state.goals;

              APEX_GCAL.uploadBackupFile(
                file.id,
                localData,
                (uploadResult) => {
                  this.state.syncingDrive = false;
                  this.state.lastDriveSync = Date.now();
                  localStorage.setItem("apex_last_drive_sync", this.state.lastDriveSync);
                  this.updateDriveStatusUI();
                  if (!silent) alert("Cloud Sync completed! All workout logs merged.");
                  this.render();
                },
                (err) => {
                  this.state.syncingDrive = false;
                  this.updateDriveStatusUI();
                  if (!silent) alert("Sync failed during upload: " + err);
                }
              );
            },
            (err) => {
              this.state.syncingDrive = false;
              this.updateDriveStatusUI();
              if (!silent) alert("Sync failed during download: " + err);
            }
          );
        } else {
          APEX_GCAL.uploadBackupFile(
            null,
            localData,
            (uploadResult) => {
              this.state.syncingDrive = false;
              this.state.lastDriveSync = Date.now();
              localStorage.setItem("apex_last_drive_sync", this.state.lastDriveSync);
              this.updateDriveStatusUI();
              if (!silent) alert("Cloud Backup created! Synced to Google Drive.");
              this.render();
            },
            (err) => {
              this.state.syncingDrive = false;
              this.updateDriveStatusUI();
              if (!silent) alert("Initial sync failed: " + err);
            }
          );
        }
      },
      (err) => {
        this.state.syncingDrive = false;
        this.updateDriveStatusUI();
        if (!silent) alert("Google Drive search failed: " + err);
      }
    );
  },

  updateDriveStatusUI() {
    const badge = document.getElementById("gdrive-status-badge");
    const text = document.getElementById("gdrive-status-text");
    const settingsSyncText = document.getElementById("settings-drive-sync-time");
    const syncBtn = document.getElementById("btn-sync-drive");

    const lastSyncStr = this.state.lastDriveSync
      ? new Date(this.state.lastDriveSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : "Never";

    if (settingsSyncText) {
      settingsSyncText.innerText = "Last Cloud Sync: " + lastSyncStr;
    }

    if (!badge || !text) return;

    if (APEX_GCAL.isMockEnabled) {
      badge.style.display = "none";
      if (syncBtn) syncBtn.classList.add("disabled");
    } else if (this.state.syncingDrive) {
      badge.style.display = "inline-flex";
      badge.className = "status-badge connected"; // dynamic color
      badge.querySelector(".status-dot").style.backgroundColor = "var(--color-warning)";
      badge.querySelector(".status-dot").style.boxShadow = "0 0 8px var(--color-warning)";
      text.innerText = "Syncing Cloud...";
    } else if (APEX_GCAL.accessToken) {
      badge.style.display = "inline-flex";
      badge.className = "status-badge connected";
      badge.querySelector(".status-dot").removeAttribute("style");
      text.innerText = "Cloud Backed Up";
      if (syncBtn) syncBtn.classList.remove("disabled");
    } else {
      badge.style.display = "inline-flex";
      badge.className = "status-badge disconnected";
      badge.querySelector(".status-dot").removeAttribute("style");
      text.innerText = "Cloud Off";
      if (syncBtn) syncBtn.classList.add("disabled");
    }
  },

  updateAIConfigUI() {
    const provider = document.getElementById("ai-provider-select").value;
    this.state.aiProvider = provider;
    
    // Toggle input field displays
    const geminiGroup = document.getElementById("gemini-key-group");
    const openaiGroup = document.getElementById("openai-key-group");
    if (geminiGroup && openaiGroup) {
      if (provider === "gemini") {
        geminiGroup.style.display = "block";
        openaiGroup.style.display = "none";
      } else {
        geminiGroup.style.display = "none";
        openaiGroup.style.display = "block";
      }
    }

    // Toggle Clear Keys button
    const clearBtn = document.getElementById("btn-clear-ai-settings");
    if (clearBtn) {
      if (this.state.geminiApiKey || this.state.openaiApiKey) {
        clearBtn.classList.remove("hidden");
      } else {
        clearBtn.classList.add("hidden");
      }
    }
  },

  fetchAndRenderCalendarList() {
    if (APEX_GCAL.isMockEnabled || !APEX_GCAL.accessToken) {
      const selectGroup = document.getElementById("settings-calendar-select-group");
      if (selectGroup) selectGroup.style.display = "none";
      return;
    }
    
    APEX_GCAL.loadCalendarList(
      (calendars) => {
        const select = document.getElementById("gcal-calendar-select");
        const selectGroup = document.getElementById("settings-calendar-select-group");
        if (!select || !selectGroup) return;
        
        select.innerHTML = "";
        
        calendars.forEach(cal => {
          const opt = document.createElement("option");
          opt.value = cal.id;
          opt.innerText = cal.summary + (cal.primary ? " (Primary)" : "");
          if (cal.id === this.state.selectedCalendarId) {
            opt.selected = true;
          }
          select.appendChild(opt);
        });
        
        selectGroup.style.display = "block";
      },
      (err) => {
        console.warn("Failed to load calendar list:", err);
      }
    );
  }
};

// Start application when DOM is fully ready
document.addEventListener("DOMContentLoaded", () => {
  APEX_APP.init();
});
