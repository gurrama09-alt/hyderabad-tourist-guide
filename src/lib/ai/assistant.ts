import { TOURIST_PLACES, METRO_RED_STATIONS, METRO_BLUE_STATIONS } from '@/lib/data/seedData';
import { calculateHaversineDistanceKm } from '@/lib/routing/dijkstra';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  language?: 'en' | 'te' | 'hi';
  suggestedActions?: { label: string; actionType: string; payload?: string }[];
}

// Local Knowledge Retrieval (RAG) builder
export function buildContextForQuery(query: string): string {
  const q = query.toLowerCase();

  const matchingPlaces = TOURIST_PLACES.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    p.neighbourhood.toLowerCase().includes(q) ||
    p.visitor_tips.some(tip => tip.toLowerCase().includes(q))
  );

  let context = 'HYDERABAD TOURIST PLACES KNOWLEDGE BASE:\n';
  matchingPlaces.slice(0, 5).forEach(p => {
    context += `\nPlace: ${p.name}
Neighbourhood: ${p.neighbourhood}
Timings: ${p.opening_hours}
Entry Fee: ₹${p.entry_fee_inr} (Indians), ₹${p.entry_fee_foreign_inr || p.entry_fee_inr} (Foreigners)
Visit Duration: ~${p.estimated_duration_mins} mins
Nearest Metro: ${p.nearest_metro_station || 'None'}
Tips: ${p.visitor_tips.join(' | ')}
`;
  });

  return context;
}

// Fallback intelligent agent with multilingual templates & local domain knowledge
export async function queryAIAssistant(
  userQuery: string,
  language: 'en' | 'te' | 'hi' = 'en',
  userCoords?: { lat: number; lng: number }
): Promise<AIMessage> {
  const q = userQuery.toLowerCase().trim();
  const now = new Date().toISOString();

  // Try calling server-side AI endpoint if configured
  try {
    const res = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: userQuery, language, userCoords }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.message) {
        return {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: now,
          language,
          suggestedActions: data.suggestedActions || [],
        };
      }
    }
  } catch {
    // Gracefully fall back to local rule-based RAG assistant below
  }

  // 1. "Suggest places near my current location"
  if (q.includes('near') && (q.includes('me') || q.includes('location') || q.includes('current'))) {
    const refLat = userCoords ? userCoords.lat : 17.361564; // Default to Charminar if GPS not granted
    const refLng = userCoords ? userCoords.lng : 78.474665;

    const sortedByDist = [...TOURIST_PLACES].map(p => ({
      ...p,
      dist: calculateHaversineDistanceKm(refLat, refLng, p.latitude, p.longitude),
    })).sort((a, b) => a.dist - b.dist);

    const top3 = sortedByDist.slice(0, 3);

    if (language === 'te') {
      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `మీ ప్రస్తుత ప్రదేశం వద్ద సమీపంలో ఉన్న ప్రసిద్ధ పర్యాటక ప్రదేశాలు:\n\n1. **${top3[0].name}** - సుమారు ${top3[0].dist} కి.మీ (${top3[0].neighbourhood})\n2. **${top3[1].name}** - సుమారు ${top3[1].dist} కి.మీ\n3. **${top3[2].name}** - సుమారు ${top3[2].dist} కి.మీ\n\nమీరు ఏ ప్రదేశానికి వెళ్ళాలనుకుంటున్నారో ఎంచుకోండి, నేను మీకు ఉత్తమ రవాణా మార్గాన్ని చూపిస్తాను!`,
        timestamp: now,
        language: 'te',
        suggestedActions: top3.map(p => ({ label: `Go to ${p.name}`, actionType: 'view_place', payload: p.slug })),
      };
    } else if (language === 'hi') {
      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `आपके नज़दीक सबसे प्रमुख पर्यटन स्थल:\n\n1. **${top3[0].name}** - लगभग ${top3[0].dist} किमी (${top3[0].neighbourhood})\n2. **${top3[1].name}** - लगभग ${top3[1].dist} किमी\n3. **${top3[2].name}** - लगभग ${top3[2].dist} किमी\n\nआप इनमें से कहाँ जाना चाहेंगे? मैं आपको सबसे तेज़ और सस्ता रास्ता बता सकता हूँ!`,
        timestamp: now,
        language: 'hi',
        suggestedActions: top3.map(p => ({ label: `Go to ${p.name}`, actionType: 'view_place', payload: p.slug })),
      };
    }

    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `Here are the top attractions closest to your current location:\n\n1. **${top3[0].name}** (~${top3[0].dist} km away in ${top3[0].neighbourhood})\n2. **${top3[1].name}** (~${top3[1].dist} km away)\n3. **${top3[2].name}** (~${top3[2].dist} km away)\n\nTap any attraction below to view entry details, opening hours, or launch step-by-step navigation!`,
      timestamp: now,
      language: 'en',
      suggestedActions: top3.map(p => ({ label: `View ${p.name}`, actionType: 'view_place', payload: p.slug })),
    };
  }

  // 2. "Find famous food places near Charminar"
  if (q.includes('food') || q.includes('biryani') || q.includes('eat') || q.includes('chai') || q.includes('restaurant')) {
    if (language === 'te') {
      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `హైదరాబాద్ మరియు చార్మినార్ పరిసరాలలో ప్రసిద్ధ ఆహార కేంద్రాలు:\n\n🍵 **నిమ్రా కేఫ్ (Nimrah Cafe)** - చార్మినార్ పక్కనే వేడివేడి ఇరానీ ఛాయ్ మరియు ఉస్మానియా బిస్కెట్లు.\n🍛 **హోటల్ షాదాబ్ (Hotel Shadab)** - అసలైన హైదరాబాదీ దమ్ బిర్యానీ, పాయ మరియు రోటీలకు ప్రసిద్ధి (నయాపుల్).\n🍖 **పిస్తా హౌస్ (Pista House)** - రంజాన్ హలీమ్ మరియు డ్రై ఫ్రూట్ స్వీట్లు.\n🍨 **ఫేమస్ ఐస్ క్రీం (Mozamjahi Market)** - హ్యాండ్‌మేడ్ ఫ్రూట్ ఐస్ క్రీములు.`,
        timestamp: now,
        language: 'te',
        suggestedActions: [
          { label: 'View Charminar Guide', actionType: 'view_place', payload: 'charminar' },
          { label: 'Route from Charminar', actionType: 'route', payload: 'charminar' },
        ],
      };
    } else if (language === 'hi') {
      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `चारमीनार और हैदराबाद में प्रसिद्ध खानपान की जगहें:\n\n🍵 **निमरह कैफे (Nimrah Cafe)** - चारमीनार के ठीक बगल में कड़क ईरानी चाय और उस्मानिया बिस्किट।\n🍛 **होटल शादाब (Hotel Shadab)** - मटन दम बिरयानी और चिकन 65 के लिए नयापुल पर मशहूर।\n🍖 **पिस्ता हाउस (Pista House)** - विश्वप्रसिद्ध हैदराबादी हलीम और बादाम की खीर।\n🍨 **फेमस आइसक्रीम (Famous Ice Cream)** - मोजमजाही मार्केट की पारंपरिक ताज़ा मैंगो व सीताफल आइसक्रीम।`,
        timestamp: now,
        language: 'hi',
        suggestedActions: [
          { label: 'View Charminar Guide', actionType: 'view_place', payload: 'charminar' },
        ],
      };
    }

    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `Here are legendary culinary spots around Charminar and Hyderabad:\n\n🍵 **Nimrah Cafe & Bakery**: Right next to Charminar minarets. Famous for piping-hot Irani chai paired with fresh salty-sweet Osmania biscuits.\n🍛 **Hotel Shadab (Nayapul)**: Historic dining destination known for authentic Hyderabadi Dum Biryani, Haleem, and Bheja Fry.\n🍖 **Shah Ghouse & Pista House**: Renowned for tender mutton biryani, double ka meetha, and GI-tagged Haleem.\n🍨 **Famous Ice Cream (Mozamjahi Market)**: Authentic hand-churned seasonal fruit ice creams (Mango, Sapota, Sitaphal) operating since 1951.\n🫓 **Govind ki Bandi (Ghansi Bazaar)**: Legendary morning street cart serving butter tava idlis and masala dosa with green coconut chutney.`,
      timestamp: now,
      language: 'en',
      suggestedActions: [
        { label: 'Explore Charminar Area', actionType: 'view_place', payload: 'charminar' },
        { label: 'Cost Calculator', actionType: 'navigate', payload: '/cost-calculator' },
      ],
    };
  }

  // 3. "How can I reach Golconda Fort using public transport?"
  if (q.includes('golconda') || (q.includes('reach') && q.includes('fort'))) {
    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `Here is the best public transport route to reach Golconda Fort:\n\n🚌 **TGSRTC Direct Bus Route 65**: Runs directly from Charminar Bus Terminus / Nayapul to Golconda Fort Main Gate every 15 minutes (Fare: ₹20–₹25, Travel time: ~45 mins).\n\n🚇 **Metro + Auto Combination (Fastest during rush hour)**:\n1. Take the **Blue Line Metro** to **Peddamma Gudi** or **Jubilee Hills Check Post** station.\n2. Hire an auto-rickshaw or rapido from the station directly to Golconda Fort (approx 6 km, ₹80–₹110).\n\n💡 *Pro-Tip: Visit in late afternoon (~03:30 PM) so you can climb Bala Hissar before sunset, then stay for the famous Sound & Light show at 06:30 PM!*`,
      timestamp: now,
      language: 'en',
      suggestedActions: [
        { label: 'Plan Route to Golconda', actionType: 'route_to', payload: 'golconda-fort' },
        { label: 'Golconda Ticket & Timings', actionType: 'view_place', payload: 'golconda-fort' },
      ],
    };
  }

  // 4. "Plan a one-day historical tour of Hyderabad"
  if (q.includes('one day') || q.includes('1 day') || q.includes('tour') || q.includes('itinerary')) {
    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `Here is the ideal curated 1-Day Nizam Heritage Tour of Hyderabad:\n\n🌅 **09:30 AM - Charminar & Mecca Masjid**: Ascend the minaret for morning Old City views, then visit India's historic Mecca Masjid next door.\n🍵 **10:45 AM - Nimrah Irani Chai Break**: Refresh with chai and Osmania biscuits.\n🏛️ **11:15 AM - Chowmahalla Palace**: Marvel at 19 Belgian chandeliers in the Durbar Hall and the Nizam's 1912 Rolls Royce.\n🍛 **01:00 PM - Biryani Lunch at Hotel Shadab** (Nayapul).\n🏺 **02:30 PM - Salar Jung Museum**: Inspect the Veiled Rebecca and 19th-century Musical Clock.\n⛵ **05:30 PM - Hussain Sagar Lake**: Sunset boat ride to the monolithic Buddha statue.\n\nTotal estimated travel + ticket expense: ~₹450 per person.`,
      timestamp: now,
      language: 'en',
      suggestedActions: [
        { label: 'Load 1-Day Plan in Trip Planner', actionType: 'load_itinerary', payload: '1' },
        { label: 'Open Smart Cost Calculator', actionType: 'navigate', payload: '/cost-calculator' },
      ],
    };
  }

  // Generic fallback
  return {
    id: `msg_${Date.now()}`,
    role: 'assistant',
    content: `Welcome to the Hyderabad Tourist Assistant! I have comprehensive knowledge of all tourist monuments (Charminar, Golconda Fort, Salar Jung Museum, Chowmahalla, Ramoji Film City), HMRL Metro Red/Blue/Green lines, TGSRTC city buses, opening hours, official fares, and authentic Hyderabadi food spots.\n\nTry asking me:\n• "Plan a 2-day itinerary for Hyderabad"\n• "How do I reach Golconda Fort using public transport?"\n• "Where can I eat the best Biryani and Irani chai?"\n• "What is the entry fee and timing for Salar Jung Museum?"`,
    timestamp: now,
    language: 'en',
    suggestedActions: [
      { label: '1-Day Heritage Tour', actionType: 'load_itinerary', payload: '1' },
      { label: 'Explore Interactive Map', actionType: 'navigate', payload: '/explore' },
      { label: 'Route Comparison', actionType: 'navigate', payload: '/routes' },
    ],
  };
}
