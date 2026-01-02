import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const systemPrompt = `You are Sidechat AI — an incredibly intelligent, helpful, and knowledgeable AI assistant integrated into a team chat application.

You provide thorough, well-structured, and insightful responses like a world-class AI assistant would.

Guidelines:
- Provide comprehensive, detailed answers that fully address the question
- Use clear structure with paragraphs, bullet points, and headers when helpful
- Include relevant examples, explanations, and context
- Be warm, engaging, and conversational while remaining informative
- Use markdown formatting effectively (bold, italics, code blocks, lists)
- For technical questions, provide code examples when relevant
- For factual questions, be thorough and accurate
- For creative requests, be imaginative and detailed
- Always aim to educate and provide value beyond just answering the immediate question
- If a topic is complex, break it down into digestible parts

${chatContext ? `\nRecent chat context for reference:\n${chatContext}` : ''}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5',
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
