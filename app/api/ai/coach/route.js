import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore in Server Component context
            }
          },
        },
      }
    );

    // Verify authenticated user session
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check for server-managed API key or request payload key
    const body = await request.json();
    const apiKey = process.env.GEMINI_API_KEY || body.apiKey;

    if (!user && !process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to use the AI Coach." }, { status: 401 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: "No Gemini API key configured on Vercel or in Settings." }, { status: 400 });
    }

    const { prompt, soreness, userWeight, equipment, provider, duration, calendarSchedule, recentLogs, habitStatus } = body;

    const systemPrompt = `<ROLE>
You are NEXUS AI, an elite athletic strength & conditioning coach and biomechanics specialist.
Your task is to analyze the athlete's multi-modal life context—including muscle soreness metrics, Google Calendar events, recent training history, and habit compliance—and generate a highly customized, scientifically sound training session.
</ROLE>

<TACTICAL_CONSTRAINTS>
1. FATIGUE MANAGEMENT: Auto-regulate volume and intensity based on soreness scores (1-5 scale). Avoid heavy loading on muscles with soreness >= 4.
2. SCHEDULE CONFLICT AVOIDANCE: If Google Calendar shows high intensity athletic events (e.g. Volleyball match, Soccer game) today or tomorrow, program active recovery or primer work instead of taxing heavy lifts.
3. INJURY PREVENTION: Include specific warm-up & RPE guidance in exercise notes.
4. TIME SENSITIVITY: Respect the target session duration strictly (${duration || 45} minutes).
</TACTICAL_CONSTRAINTS>

<OUTPUT_SCHEMA>
You MUST respond strictly with valid JSON conforming to this schema:
{
  "name": "Workout Title",
  "category": "weightlifting | running | volleyball | flag_football | recovery",
  "duration": 45,
  "intensity": 8,
  "description": "Short 1-2 sentence coach summary explaining why this session was generated given their fatigue & calendar context.",
  "exercises": [
    { 
      "name": "Exercise Name", 
      "sets": "4", 
      "reps": "8-10", 
      "notes": "Form cues, RPE (Rating of Perceived Exertion), and tempo guidance" 
    }
  ]
}
</OUTPUT_SCHEMA>`;

    const userContextPayload = `<FATIGUE_METRICS>
- Legs Soreness: ${soreness?.legs || 1}/5
- Shoulders Soreness: ${soreness?.shoulders || 1}/5
- Core Soreness: ${soreness?.core || 1}/5
- Overall System Fatigue: ${soreness?.fatigue || 1}/5
</FATIGUE_METRICS>

<CALENDAR_SCHEDULE>
${calendarSchedule || "No conflicting Google Calendar events scheduled for today/tomorrow."}
</CALENDAR_SCHEDULE>

<TRAINING_HISTORY>
${recentLogs || "No recent workout history recorded."}
</TRAINING_HISTORY>

<HABIT_COMPLIANCE>
${habitStatus || "Standard daily compliance."}
</HABIT_COMPLIANCE>

<USER_PREFERENCES>
- Target Duration: ${duration || 45} Minutes
- Available Equipment: ${equipment || "Full Gym"}
- Bodyweight: ${userWeight || 190} lbs
- Custom Focus Prompt: ${prompt || "Generate optimal context-informed session"}
</USER_PREFERENCES>`;

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContextPayload }
          ],
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      if (!response.ok) return NextResponse.json({ error: data.error?.message || "OpenAI API Error" }, { status: response.status });
      return NextResponse.json({ workout: JSON.parse(data.choices[0].message.content) });
    } else {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userContextPayload}` }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const data = await response.json();
      if (!response.ok) return NextResponse.json({ error: data.error?.message || "Gemini API Error" }, { status: response.status });

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return NextResponse.json({ workout: JSON.parse(text) });
    }

  } catch (error) {
    console.error("AI Coach Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate AI workout" }, { status: 500 });
  }
}
