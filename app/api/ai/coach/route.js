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

    const { prompt, soreness, userWeight, equipment, provider } = body;

    const systemPrompt = `You are APEX AI, an elite athletic strength & conditioning coach.
Generate a custom, structured workout formatted strictly as valid JSON.
The JSON must follow this exact structure:
{
  "name": "Workout Title",
  "category": "weightlifting | running | volleyball | flag_football | recovery",
  "duration": 45,
  "intensity": 8,
  "description": "Short 1-2 sentence coach summary",
  "exercises": [
    { "name": "Exercise Name", "sets": "4", "reps": "8-10", "notes": "Form cues and RPE guidance" }
  ]
}
Current Fatigue Levels (1-5 scale): Legs=${soreness?.legs || 1}, Shoulders=${soreness?.shoulders || 1}, Core=${soreness?.core || 1}, Overall Fatigue=${soreness?.fatigue || 1}.
User Weight=${userWeight || 190}lbs. Equipment Available=${equipment || "Full Gym"}.
User Request: ${prompt || "Generate optimal custom workout"}
Do not output markdown codeblock syntax, output raw JSON string only.`;

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: systemPrompt }],
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
          contents: [{ parts: [{ text: systemPrompt }] }],
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
