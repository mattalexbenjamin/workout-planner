// APEX MULTI-PROVIDER AI WORKOUT COMPANION
// Handles client-side, zero-backend LLM execution via Google Gemini & OpenAI ChatGPT

const APEX_AI = {
  // Google Gemini API Call (Using 1.5 Flash with responseSchema)
  async generateGemini(apiKey, systemPrompt, userPrompt, onSuccess, onError) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{
        parts: [{ text: systemPrompt + "\n\n" + userPrompt }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            description: { type: "STRING" },
            duration: { type: "INTEGER" },
            intensity: { type: "INTEGER" },
            exercises: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  sets: { type: "STRING" },
                  reps: { type: "STRING" },
                  notes: { type: "STRING" }
                },
                required: ["name", "sets", "reps", "notes"]
              }
            }
          },
          required: ["name", "description", "duration", "intensity", "exercises"]
        }
      }
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP error ${response.status}`);
      }

      const resData = await response.json();
      const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from Gemini.");
      
      const workout = JSON.parse(text.trim());
      onSuccess(workout);
    } catch (err) {
      console.error("Gemini API Error:", err);
      onError(err.message);
    }
  },

  // OpenAI ChatGPT API Call (Using gpt-4o-mini with structured outputs)
  async generateOpenAI(apiKey, systemPrompt, userPrompt, onSuccess, onError) {
    const url = "https://api.openai.com/v1/chat/completions";
    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "workout_schema",
          strict: true,
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              duration: { type: "integer" },
              intensity: { type: "integer" },
              exercises: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    sets: { type: "string" },
                    reps: { type: "string" },
                    notes: { type: "string" }
                  },
                  required: ["name", "sets", "reps", "notes"],
                  additionalProperties: false
                }
              }
            },
            required: ["name", "description", "duration", "intensity", "exercises"],
            additionalProperties: false
          }
        }
      }
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP error ${response.status}`);
      }

      const resData = await response.json();
      const text = resData.choices?.[0]?.message?.content;
      if (!text) throw new Error("Empty response from ChatGPT.");
      
      const workout = JSON.parse(text.trim());
      onSuccess(workout);
    } catch (err) {
      console.error("OpenAI API Error:", err);
      onError(err.message);
    }
  },

  // General Dispatcher
  generateWorkout(provider, apiKey, context, onSuccess, onError) {
    if (!apiKey) {
      onError("API Key is missing. Please save it in Settings.");
      return;
    }

    const systemPrompt = `You are APEX AI, an elite strength and conditioning coach specializing in athletic performance for sand volleyball, flag football, weightlifting, and running.
Your task is to write a highly customized daily workout session based on the athlete's goals, recovery state, upcoming calendar events, and workout history.

Follow these coaching rules:
1. If the athlete's legs are highly sore (soreness score >= 3.0), avoid jump plyometrics, heavy squats, or sprint starts. Focus on upper body, prehab, core, or recovery mobility.
2. If their shoulders are highly sore (soreness score >= 3.0), avoid overhead press, heavy bench press, and volleyball spiking. Focus on lower body, running, agility, or rotator cuff prehab.
3. If their overall fatigue is very high (>= 4.0), write a light, restorative mobility flow or active stretching routine. Do not assign high intensity (RPE max 4).
4. If they have a volleyball or football game/scrimmage today, recommend a short joint activation/prehab routine (e.g. Volleyball Shoulder & Knee Armor) so they are fresh for their match.
5. If they have a game tomorrow, avoid leg-fatiguing exercises today. Keep their legs fresh.
6. If they have a busy day on their calendar (5+ hours of meetings/work), keep the workout short (e.g. 15-20 min express circuit).
7. Ensure your workout matches their overall summer targets (e.g. fat loss, calorie budgets, workout frequency).
8. Vary the exercises! Look at their recent logs and avoid repeating the exact same routine they did yesterday or two days ago.
9. Name the workout beautifully and clearly (e.g. "Apex Vertical Boost (Leg Sparing)", "Rotator Cuff & Hip Mobility Shield", etc.).

You must respond strictly with a JSON object matching the requested schema. No markdown formatting or extra text.`;

    const userPrompt = `Generate a workout for the local date ${context.dateStr} (Today is ${context.dayOfWeek}).

Athletic Context:
- Current Muscle Soreness (1-5 scale):
  * Legs: ${context.soreness.legs.toFixed(1)}/5
  * Shoulders: ${context.soreness.shoulders.toFixed(1)}/5
  * Core: ${context.soreness.core.toFixed(1)}/5
  * Overall Fatigue: ${context.soreness.fatigue.toFixed(1)}/5

- Calendar Events for Today:
  ${context.todayEvents.length > 0 ? context.todayEvents.map(e => `* ${e.title} (${e.start || 'all-day'} - ${e.end || ''})`).join('\n') : "None"}

- Calendar Events for Tomorrow:
  ${context.tomorrowEvents.length > 0 ? context.tomorrowEvents.map(e => `* ${e.title} (${e.start || 'all-day'} - ${e.end || ''})`).join('\n') : "None"}

- Recent Workout History (last 5 sessions):
  ${context.recentHistory.length > 0 ? context.recentHistory.map(h => `* ${h.date}: ${h.type.toUpperCase()} - ${h.name} (${h.duration} mins, RPE: ${h.intensity}/10). Notes: "${h.notes || ''}"`).join('\n') : "No logged workouts."}

- Fitness Targets & Summer Goals:
  * Current Weight: ${context.goals.currentWeight} lbs
  * Target Weight: ${context.goals.targetWeight} lbs
  * Daily Calorie Budget: ${context.goals.calories} kcal
  * Daily Protein Goal: ${context.goals.protein} g
  * Target Lifting Frequency: ${context.goals.frequency} sessions/week

Reference Templates (Use these for typical exercise styles, sets/reps formatting, and notes styling):
${JSON.stringify(context.workoutTemplates, null, 2)}

Provide your output strictly in JSON format matching the schema.`;

    if (provider === 'gemini') {
      this.generateGemini(apiKey, systemPrompt, userPrompt, onSuccess, onError);
    } else if (provider === 'openai') {
      this.generateOpenAI(apiKey, systemPrompt, userPrompt, onSuccess, onError);
    } else {
      onError("Invalid AI Provider specified.");
    }
  }
};
