import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const apiKey = process.env.GROQ_API_KEY || 'gsk_dummy_key';
    
    // Call the Groq API using fetch
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // A fast standard Groq model
        messages: messages,
        temperature: 0.7,
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Groq API Error:', res.status, errText);
      return NextResponse.json({ error: 'Failed to communicate with Groq API' }, { status: res.status });
    }

    const data = await res.json();
    
    return NextResponse.json({
      reply: data.choices[0].message.content
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
