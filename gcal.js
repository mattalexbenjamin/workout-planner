// APEX GOOGLE CALENDAR INTEGRATION & MOCK DATA MANAGER

const APEX_GCAL = {
  clientId: localStorage.getItem("apex_gcal_client_id") || "",
  accessToken: sessionStorage.getItem("apex_gcal_token") || "",
  isMockEnabled: localStorage.getItem("apex_gcal_mock_enabled") !== "false", // default to true
  tokenClient: null,

  // Save Settings
  saveConfig(clientId, isMockEnabled) {
    this.clientId = clientId;
    this.isMockEnabled = isMockEnabled;
    localStorage.setItem("apex_gcal_client_id", clientId);
    localStorage.setItem("apex_gcal_mock_enabled", isMockEnabled);
  },

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
        scope: "https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/drive.file",
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
      // Week 3 of Summer 2026 (June 21 - June 28)
      { id: "mock-1", title: "Product Sync Meeting", date: "2026-06-22", start: "09:00", end: "10:30", description: "Work meeting" },
      { id: "mock-2", title: "Marketing Review", date: "2026-06-22", start: "14:00", end: "15:00", description: "Work meeting" },
      
      { id: "mock-3", title: "Beach Volleyball Play (Sand Court)", date: "2026-06-23", start: "17:30", end: "20:00", description: "Pickup vball with crew at local beach" },
      
      { id: "mock-4", title: "Full-Day Product Roadmap Planning", date: "2026-06-24", start: "09:00", end: "17:00", description: "Extremely busy day" },
      
      { id: "mock-5", title: "Flag Football Game vs. Titans", date: "2026-06-25", start: "18:00", end: "19:30", description: "League game at turf field" },
      
      { id: "mock-6", title: "Orthodontist Checkup", date: "2026-06-26", start: "14:00", end: "14:45", description: "Health appointment" },
      
      { id: "mock-7", title: "Beach Volleyball Tournament (Coed 4s)", date: "2026-06-27", start: "09:00", end: "16:00", description: "Summer tournament series" },
      
      // Week 4 of Summer 2026 (June 29 - July 5)
      { id: "mock-8", title: "Quarterly Board Meeting", date: "2026-06-29", start: "10:00", end: "16:00", description: "Very busy day" },
      { id: "mock-9", title: "Sand Volleyball Skills Clinic", date: "2026-06-30", start: "18:00", end: "20:00", description: "Setting and hitting mechanics" },
      { id: "mock-10", title: "Flag Football Scrimmage", date: "2026-07-02", start: "18:30", end: "20:00", description: "Informal play" },
      { id: "mock-11", title: "July 4th Beach BBQ & Vball", date: "2026-07-04", start: "11:00", end: "17:00", description: "Heavy beach volleyball play" }
    ];
  },

  // Load Events from API or Mock
  loadCalendarEvents(startDateStr, endDateStr, onSuccessCallback, onErrorCallback) {
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
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(startISO)}&timeMax=${encodeURIComponent(endISO)}&singleEvents=true&orderBy=startTime`;

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
  findBackupFile(onSuccess, onError) {
    if (!this.accessToken) {
      if (onError) onError("No access token. Sign in with Google.");
      return;
    }
    const url = `https://www.googleapis.com/drive/v3/files?q=name='apex_workout_data.json'+and+trashed=false&fields=files(id,name,modifiedTime)`;
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
        onSuccess(data.files[0]);
      } else {
        onSuccess(null);
      }
    })
    .catch(err => {
      console.error("GDrive Search Error:", err);
      if (onError) onError(err.message);
    });
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

  uploadBackupFile(fileId, localData, onSuccess, onError) {
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
  }
};
