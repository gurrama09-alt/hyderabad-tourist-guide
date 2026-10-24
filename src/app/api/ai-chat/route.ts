import { NextRequest, NextResponse } from 'next/server';
import { buildContextForQuery } from '@/lib/ai/assistant';

export async function POST(req: NextRequest) {
  try {
    const { query, language, userCoords } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const apiKey = process.env.AI_API_KEY;
    const context = buildContextForQuery(query);

    // If API key is present and appears to be Gemini / OpenAI
    if (apiKey && apiKey.trim().length > 10) {
      try {
        // Try Google Gemini API endpoint first if key format matches
        const promptText = `You are a warm, courteous, and exceptionally knowledgeable Hyderabad Tourist Guide AI Assistant.
Respond in ${language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : 'English'}.
Always provide accurate, practical advice including timings, official ticket fees, nearest metro/bus stations, and local insider tips (biryani, chai, photography).
Refer to this verified dataset when answering:
${context}

User question: "${query}"
${userCoords ? `User approximate coordinates: [${userCoords.lat}, ${userCoords.lng}]` : ''}
`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (aiText) {
            return NextResponse.json({
              message: aiText,
              suggestedActions: [
                { label: 'View On Map', actionType: 'navigate', payload: '/explore' },
                { label: 'Compare Routes', actionType: 'navigate', payload: '/routes' },
              ],
            });
          }
        }
      } catch (err) {
        console.warn('External AI call failed, falling back to local domain RAG:', err);
      }
    }

    // If external call is skipped or failed, let client handle via domain knowledge
    return NextResponse.json({ fallback: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
