// Clean up any stale client ID from older versions
localStorage.removeItem("apex_gcal_client_id");

const APEX_GCAL = {
  clientId: "716738387764-gdhdjjmquhk4qq6jqa7p2i667h855e3p.apps.googleusercontent.com",
  accessToken: sessionStorage.getItem("apex_gcal_token") || "",
  isMockEnabled: localStorage.getItem("apex_gcal_mock_enabled") !== "false", // default to true
  tokenClient: null,

  // Setup OAuth Client
  initClient(onSuccessCallback, onErrorCallback) {
    if (!this.clientId) {
      if (onErrorCallback) onErrorCallback("Google Client ID is missing. Set it in Settings.");
      return;
    }

    if (typeof google === "undefined" || !google.accounts || !google.accounts.oauth2) {
      if (onErrorCallback) onErrorCallback("Google Identity Services script failed to load.");
      return;
    }

    try {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/drive.file",
        callback: (tokenResponse) => {
          if (tokenResponse.access_token) {
            this.accessToken = tokenResponse.access_token;
            sessionStorage.setItem("apex_gcal_token", this.accessToken);
            if (onSuccessCallback) onSuccessCallback(this.accessToken);
          } else {
            if (onErrorCallback) onErrorCallback("Failed to acquire access token.");
          }
        },
      });
      
      // Prompt user to sign in
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      console.error("GIS Init Error:", err);
      if (onErrorCallback) onErrorCallback("Error initializing Google Login Client: " + err.message);
    }
  },

  // Sign out
  logout() {
    this.accessToken = "";
    sessionStorage.removeItem("apex_gcal_token");
    if (this.clientId && typeof google !== "undefined" && google.accounts.oauth2.revoke) {
      google.accounts.oauth2.revoke(this.accessToken, () => {
        console.log("Token revoked");
      });
    }
  },

  // Mock Calendar Events for Summer 2026
  getMockEvents() {
    return [
      // Past completed workouts (to test auto-logger)
      { id: "mock-past-1", title: "Hike at Crowders Mountain", date: "2026-06-18", start: "09:00", end: "12:00", description: "Scenic trail hike" },
      { id: "mock-past-2", title: "Explosive Athletic Strength A", date: "2026-06-20", start: "07:30", end: "08:30", description: "Gym session" },
      
      // Week 3 of Summer 2026 (June 21 - June 28)
      { id: "mock-1", title: "Product Sync Meeting", date: "2026-06-22", start: "09:00", end: "10:30", description: "Work meeting" },
      { id: "mock-2", title: "Marketing Review", date: "2026-06-22", start: "14:00", end: "15:00", description: "Work meeting" },
      
      { id: "mock-3", title: "Beach Volleyball Play (Sand Court)", date: "2026-06-23", start: "17:30", end: "20:00", description: "Pickup vball with crew at local beach" },
      
      { id: "mock-4", title: "Full-Day Product Roadmap Planning", date: "2026-06-24", start: "09:00", end: "17:00", description: "Extremely busy day" },
      
      { id: "mock-5", title: "Flag Football Game vs. Titans", date: "2026-06-25", start: "18:00", end: "19:30", description: "League game at turf field" },
      
      { id: "mock-6", title: "Orthodontist Checkup", date: "2026-06-26", start: "14:00", end: "14:45", description: "Health appointment" },
      
      { id: "mock-7", title: "Beach Volleyball Tournament (Coed 4s)", date: "2026-06-27", start: "09:00", end: "16:00", description: "Summer tournament series" },
      { id: "mock-12", title: "Explosive Athletic Strength A Gym Workout", date: "2026-06-28", start: "08:30", end: "10:00", description: "Gym weightlifting session" },
      
      // Week 4 of Summer 2026 (June 29 - July 5)
      { id: "mock-8", title: "Quarterly Board Meeting", date: "2026-06-29", start: "10:00", end: "16:00", description: "Very busy day" },
      { id: "mock-9", title: "Sand Volleyball Skills Clinic", date: "2026-06-30", start: "18:00", end: "20:00", description: "Setting and hitting mechanics" },
      { id: "mock-10", title: "Flag Football Scrimmage", date: "2026-07-02", start: "18:30", end: "20:00", description: "Informal play" },
      { id: "mock-11", title: "July 4th Beach BBQ & Vball", date: "2026-07-04", start: "11:00", end: "17:00", description: "Heavy beach volleyball play" }
    ];
  },

  loadCalendarEvents(calendarId, startDateStr, endDateStr, onSuccessCallback, onErrorCallback) {
    if (this.isMockEnabled) {
      console.log("Loading mock calendar events...");
      const mockEvents = this.getMockEvents();
      // Filter events in the date range
      const start = new Date(startDateStr + 'T00:00:00');
      const end = new Date(endDateStr + 'T23:59:59');
      
      const filtered = mockEvents.filter(e => {
        const eDate = new Date(e.date + 'T00:00:00');
        return eDate >= start && eDate <= end;
      });
      
      onSuccessCallback(filtered);
      return;
    }

    // Live API integration
    if (!this.accessToken) {
      if (onErrorCallback) onErrorCallback("No active Google session. Please sign in.");
      return;
    }

    const startISO = new Date(startDateStr + 'T00:00:00').toISOString();
    const endISO = new Date(endDateStr + 'T23:59:59').toISOString();
    const targetCalId = encodeURIComponent(calendarId || "primary");
    const url = `https://www.googleapis.com/calendar/v3/calendars/${targetCalId}/events?timeMin=${encodeURIComponent(startISO)}&timeMax=${encodeURIComponent(endISO)}&singleEvents=true&orderBy=startTime`;

    fetch(url, {
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": "application/json"
      }
    })
    .then(response => {
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, clear session
          sessionStorage.removeItem("apex_gcal_token");
          this.accessToken = "";
          throw new Error("Google session expired. Please sign in again.");
        }
        throw new Error(`Google Calendar API Error: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data.items) {
        onSuccessCallback([]);
        return;
      }

      const parsedEvents = data.items.map(event => {
        // Date parsing (allDay vs.dateTime)
        let dateVal = "";
        let startTime = "00:00";
        let endTime = "23:59";

        if (event.start.date) {
          dateVal = event.start.date;
        } else if (event.start.dateTime) {
          const dt = new Date(event.start.dateTime);
          // format as local YYYY-MM-DD
          const year = dt.getFullYear();
          const month = String(dt.getMonth() + 1).padStart(2, '0');
          const date = String(dt.getDate()).padStart(2, '0');
          dateVal = `${year}-${month}-${date}`;
          
          startTime = String(dt.getHours()).padStart(2, '0') + ":" + String(dt.getMinutes()).padStart(2, '0');
          
          if (event.end.dateTime) {
            const dtEnd = new Date(event.end.dateTime);
            endTime = String(dtEnd.getHours()).padStart(2, '0') + ":" + String(dtEnd.getMinutes()).padStart(2, '0');
          }
        }

        return {
          id: event.id,
          title: event.summary || "Untitled Event",
          date: dateVal,
          start: startTime,
          end: endTime,
          description: event.description || ""
        };
      });

      onSuccessCallback(parsedEvents);
    })
    .catch(err => {
      console.error("GCal Fetch Error:", err);
      if (onErrorCallback) onErrorCallback(err.message);
    });
  },

  // Google Drive REST API Helpers
  getOrCreateFolder(folderName, onSuccess, onError) {
    if (!this.accessToken) {
      if (onError) onError("No access token. Sign in with Google.");
      return;
    }

    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(folderName)}'+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id,name)`;
    
    fetch(searchUrl, {
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": "application/json"
      }
    })
    .then(res => {
      if (!res.ok) throw new Error("Failed to search folder: " + res.statusText);
      return res.json();
    })
    .then(data => {
      if (data.files && data.files.length > 0) {
        onSuccess(data.files[0].id);
      } else {
        const createUrl = "https://www.googleapis.com/drive/v3/files";
        fetch(createUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: folderName,
            mimeType: "application/vnd.google-apps.folder"
          })
        })
        .then(createRes => {
          if (!createRes.ok) throw new Error("Failed to create folder: " + createRes.statusText);
          return createRes.json();
        })
        .then(folderData => {
          onSuccess(folderData.id);
        })
        .catch(err => {
          console.error("Folder Creation Error:", err);
          if (onError) onError(err.message);
        });
      }
    })
    .catch(err => {
      console.error("Folder Search Error:", err);
      if (onError) onError(err.message);
    });
  },

  findBackupFile(onSuccess, onError) {
    if (!this.accessToken) {
      if (onError) onError("No access token. Sign in with Google.");
      return;
    }

    this.getOrCreateFolder("APEX Workout Planner", (folderId) => {
      const url = `https://www.googleapis.com/drive/v3/files?q=name='apex_workout_data.json'+and+'${folderId}'+in+parents+and+trashed=false&fields=files(id,name,modifiedTime)`;
      fetch(url, {
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json"
        }
      })
      .then(res => {
        if (!res.ok) throw new Error("Failed to search Google Drive: " + res.statusText);
        return res.json();
      })
      .then(data => {
        if (data.files && data.files.length > 0) {
          onSuccess(data.files[0], folderId);
        } else {
          onSuccess(null, folderId);
        }
      })
      .catch(err => {
        console.error("GDrive Search Error:", err);
        if (onError) onError(err.message);
      });
    }, onError);
  },

  downloadBackupFile(fileId, onSuccess, onError) {
    if (!this.accessToken) {
      if (onError) onError("No access token.");
      return;
    }
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    fetch(url, {
      headers: {
        "Authorization": `Bearer ${this.accessToken}`
      }
    })
    .then(res => {
      if (!res.ok) throw new Error("Failed to download file: " + res.statusText);
      return res.json();
    })
    .then(data => {
      onSuccess(data);
    })
    .catch(err => {
      console.error("GDrive Download Error:", err);
      if (onError) onError(err.message);
    });
  },

  uploadBackupFile(fileId, folderId, localData, onSuccess, onError) {
    if (!this.accessToken) {
      if (onError) onError("No access token.");
      return;
    }
    
    let url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
    let method = "POST";
    
    if (fileId) {
      url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
      method = "PATCH";
    }
    
    const boundary = "apex_boundary";
    const metadata = {
      name: "apex_workout_data.json",
      mimeType: "application/json"
    };
    
    if (!fileId && folderId) {
      metadata.parents = [folderId];
    }
    
    const body = [
      `\r\n--${boundary}\r\n`,
      `Content-Type: application/json; charset=UTF-8\r\n\r\n`,
      `${JSON.stringify(metadata)}\r\n`,
      `--${boundary}\r\n`,
      `Content-Type: application/json; charset=UTF-8\r\n\r\n`,
      `${JSON.stringify(localData)}\r\n`,
      `--${boundary}--`
    ].join("");
    
    fetch(url, {
      method: method,
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`
      },
      body: body
    })
    .then(res => {
      if (!res.ok) throw new Error("Failed to upload to Google Drive: " + res.statusText);
      return res.json();
    })
    .then(data => {
      onSuccess(data);
    })
    .catch(err => {
      console.error("GDrive Upload Error:", err);
      if (onError) onError(err.message);
    });
  },

  loadCalendarList(onSuccess, onError) {
    if (!this.accessToken) {
      if (onError) onError(new Error("No access token."));
      return;
    }
    const url = "https://www.googleapis.com/calendar/v3/users/me/calendarList";
    fetch(url, {
      headers: {
        "Authorization": `Bearer ${this.accessToken}`
      }
    })
    .then(res => {
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          // Token has insufficient scopes or has expired. Clean up.
          sessionStorage.removeItem("apex_gcal_token");
          this.accessToken = "";
          throw new Error(`Google API Error ${res.status}: Insufficient permissions or session expired. Please sign out and sign in again.`);
        }
        throw new Error(`Failed to fetch calendars: ${res.status} ${res.statusText}`);
      }
      return res.json();
    })
    .then(data => {
      onSuccess(data.items || []);
    })
    .catch(err => {
      console.error("Calendar list fetch error:", err);
      if (onError) onError(err);
    });
  },

  // Local Fuzzy Similarity Engine for Event Classification
  classifyEventLocal(title, description = "") {
    const text = (title + " " + description).toLowerCase().replace(/[^\w\s]/g, " ").trim();
    const stopWords = ["a", "an", "the", "at", "with", "session", "workout", "completed", "class", "training", "practice", "play", "game", "pickup", "match"];
    const tokens = text.split(/\s+/).filter(word => word.length > 0 && !stopWords.includes(word));
    
    if (tokens.length === 0) return null;

    const sports = {
      volleyball: ["volleyball", "vball", "beach", "sand", "court", "spike", "set", "dig"],
      football: ["football", "flag", "scrimmage", "route", "catch", "throw"],
      running: ["running", "jogging", "run", "trail", "sprint", "cardio"],
      basketball: ["basketball", "hoops", "bball", "court", "dunk", "shoot"],
      hiking: ["hike", "hiking", "trail", "mountain", "climb", "outdoor"],
      surfing: ["surf", "surfing", "wave", "ocean", "paddling", "beach"],
      tennis: ["tennis", "racket", "court", "serve", "match"]
    };

    const getLevenshteinDistance = (a, b) => {
      const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
      for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
      for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          if (a[i - 1] === b[j - 1]) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j - 1] + 1
            );
          }
        }
      }
      return matrix[a.length][b.length];
    };

    const isFuzzyMatch = (word, targetList) => {
      return targetList.some(target => {
        if (word === target) return true;
        const maxDist = target.length > 5 ? 2 : 1;
        return getLevenshteinDistance(word, target) <= maxDist;
      });
    };

    const sportScores = {};
    Object.keys(sports).forEach(sportName => {
      let matches = 0;
      tokens.forEach(token => {
        if (isFuzzyMatch(token, sports[sportName])) matches += 1;
      });
      sportScores[sportName] = matches / Math.max(1, tokens.length);
    });

    const templates = {
      sand_plyos: ["plyos", "vertical", "boost", "jumping", "jump", "sand", "plyometrics"],
      athletic_strength_a: ["strength", "cleans", "front", "squats", "overhead", "press", "power"],
      athletic_strength_b: ["shred", "power", "deadlifts", "bulgarian", "split", "pullups", "bench"],
      saq_agility: ["speed", "agility", "shuttle", "cone", "sprint", "starts", "deceleration"],
      shoulder_knee_prehab: ["shoulder", "knee", "armor", "prehab", "rehab", "rotator", "tibialis"],
      active_mobility: ["mobility", "stretch", "flow", "foam", "roll", "flexibility"],
      express_circuit: ["express", "circuit", "metabolic", "burpees", "squat", "jumps"]
    };

    const templateScores = {};
    Object.keys(templates).forEach(tempId => {
      let matches = 0;
      tokens.forEach(token => {
        if (isFuzzyMatch(token, templates[tempId])) matches += 1;
      });
      templateScores[tempId] = matches / Math.max(1, tokens.length);
    });

    let bestSport = null;
    let bestSportScore = 0;
    Object.keys(sportScores).forEach(s => {
      if (sportScores[s] > bestSportScore) {
        bestSportScore = sportScores[s];
        bestSport = s;
      }
    });

    let bestTemplate = null;
    let bestTemplateScore = 0;
    Object.keys(templateScores).forEach(t => {
      if (templateScores[t] > bestTemplateScore) {
        bestTemplateScore = templateScores[t];
        bestTemplate = t;
      }
    });

    const confidenceThreshold = 0.25;

    if (bestTemplateScore > bestSportScore && bestTemplateScore >= confidenceThreshold) {
      return { type: "lifting", id: bestTemplate };
    } else if (bestSportScore >= confidenceThreshold) {
      return { type: bestSport, id: bestSport + "_session" };
    }

    const generalWorkoutTerms = ["gym", "lifting", "weightlifting", "workout", "train", "training", "exercise", "wod"];
    const hasGeneralWorkout = tokens.some(token => isFuzzyMatch(token, generalWorkoutTerms));
    if (hasGeneralWorkout) {
      return { type: "lifting", id: "custom_lift" };
    }

    return null;
  }
};
