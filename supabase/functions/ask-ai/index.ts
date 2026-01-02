import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Geocoding API to get coordinates from city name
async function getCoordinates(city: string): Promise<{ lat: number; lon: number; name: string; country: string } | null> {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.latitude,
        lon: result.longitude,
        name: result.name,
        country: result.country || ''
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Weather API to get current weather
async function getWeather(lat: number, lon: number): Promise<any> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto`
    );
    return await response.json();
  } catch (error) {
    console.error('Weather API error:', error);
    return null;
  }
}

// Get weather description from WMO code
function getWeatherDescription(code: number): string {
  const weatherCodes: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return weatherCodes[code] || 'Unknown';
}

// Check if the question is about weather
function isWeatherQuestion(question: string): string | null {
  const weatherPatterns = [
    /weather\s+(?:in|at|for)\s+([a-zA-Z\s]+)/i,
    /(?:what(?:'s| is) the weather|how(?:'s| is) the weather)\s+(?:in|at|like in)\s+([a-zA-Z\s]+)/i,
    /temperature\s+(?:in|at|for)\s+([a-zA-Z\s]+)/i,
    /(?:is it|will it)\s+(?:rain|snow|sunny|cloudy|cold|hot|warm)\s+(?:in|at)\s+([a-zA-Z\s]+)/i,
    /([a-zA-Z\s]+)\s+weather/i,
    /weather\s+([a-zA-Z\s]+?)(?:\?|$)/i,
  ];

  for (const pattern of weatherPatterns) {
    const match = question.match(pattern);
    if (match && match[1]) {
      // Clean up the city name
      return match[1].trim().replace(/[?.,!]+$/, '').trim();
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, chatContext } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service is not configured');
    }

    console.log('Processing AI question:', question?.substring(0, 50));

    // Check if this is a weather question
    const cityName = isWeatherQuestion(question);
    let weatherContext = '';
    
    if (cityName) {
      console.log('Detected weather question for city:', cityName);
      
      const coords = await getCoordinates(cityName);
      if (coords) {
        const weather = await getWeather(coords.lat, coords.lon);
        if (weather && weather.current) {
          const current = weather.current;
          const daily = weather.daily;
          
          weatherContext = `
LIVE WEATHER DATA (fetched just now):
Location: ${coords.name}, ${coords.country}
Current Temperature: ${current.temperature_2m}°C (Feels like: ${current.apparent_temperature}°C)
Weather: ${getWeatherDescription(current.weather_code)}
Humidity: ${current.relative_humidity_2m}%
Wind Speed: ${current.wind_speed_10m} km/h
Precipitation: ${current.precipitation} mm

Today's Forecast:
- High: ${daily.temperature_2m_max[0]}°C
- Low: ${daily.temperature_2m_min[0]}°C
- Precipitation Probability: ${daily.precipitation_probability_max[0]}%

Next 3 Days:
${daily.time.slice(1, 4).map((date: string, i: number) => 
  `- ${date}: ${getWeatherDescription(daily.weather_code[i+1])}, High ${daily.temperature_2m_max[i+1]}°C / Low ${daily.temperature_2m_min[i+1]}°C`
).join('\n')}

Use this real-time data to answer the user's weather question. Present it in a clear, friendly way.
`;
          console.log('Weather data fetched successfully for', coords.name);
        }
      } else {
        console.log('Could not find coordinates for:', cityName);
      }
    }

    const systemPrompt = `You are Sidechat AI — an incredibly intelligent, helpful, and knowledgeable AI assistant integrated into a team chat application.

You provide thorough, well-structured, and insightful responses like a world-class AI assistant would.

Guidelines:
- Provide comprehensive, detailed answers that fully address the question
- Use clear structure with paragraphs, bullet points, and headers when helpful
- Include relevant examples, explanations, and context
- Be warm, engaging, and conversational while remaining informative
- Use markdown formatting effectively (bold, italics, code blocks, lists)
- For technical questions, provide code examples when relevant
- For factual questions, be thorough and accurate based on your training knowledge
- For creative requests, be imaginative and detailed
- Always aim to educate and provide value beyond just answering the immediate question
- If a topic is complex, break it down into digestible parts

${weatherContext ? `\n${weatherContext}` : 'IMPORTANT: For questions about current weather, live news, stock prices, or other real-time data that you don\'t have access to, acknowledge this limitation honestly and provide general helpful information instead.'}

${chatContext ? `\nRecent chat context for reference:\n${chatContext}` : ''}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please check your account.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      console.error('No content in AI response:', data);
      throw new Error('AI returned empty response');
    }

    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({ content: aiContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ask-ai function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
