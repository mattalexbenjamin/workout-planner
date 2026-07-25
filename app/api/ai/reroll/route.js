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

    const { data: { user } } = await supabase.auth.getUser();
    const body = await request.json();
    const apiKey = process.env.GEMINI_API_KEY || body.apiKey;

    if (!user && !process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: "No API Key configured" }, { status: 400 });
    }

    const { exerciseName, reason, provider } = body;

    const systemPrompt = `You are APEX AI strength coach.
The athlete needs an immediate replacement for "${exerciseName}".
Reason given: "${reason || "Provide suitable variation"}".
Output strictly JSON matching this structure:
{
  "name": "New Replacement Exercise Name",
  "sets": "3",
  "reps": "10-12",
  "notes": "Coaching cues & adjustment rationale"
}
Output raw JSON only.`;

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
      if (!response.ok) return NextResponse.json({ error: data.error?.message }, { status: response.status });
      return NextResponse.json({ exercise: JSON.parse(data.choices[0].message.content) });
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
      if (!response.ok) return NextResponse.json({ error: data.error?.message }, { status: response.status });
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return NextResponse.json({ exercise: JSON.parse(text) });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
