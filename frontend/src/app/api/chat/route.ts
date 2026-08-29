import { NextResponse } from 'next/server';

const TOOLS = [
  {
    type: "function",
    function: {
      name: "schedule_block",
      description: "Schedules a maintenance block on a specific track.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The exact ID of the track segment. Must EXACTLY match one of the mapped sections, e.g. 'Tambaram - Loop Line 1 (Sec 1)', 'Tambaram - Mainline (Sec 1)', 'Tambaram - Loop Line 2 (Sec 1)', 'Tambaram to Chromepet - Main Line', etc. Do NOT use 'Up Line' unless it is 'Tambaram to Chromepet - Up Line'."
          },
          department: {
            type: "string",
            description: "The department requesting the block, e.g. 'Track Maintenance Dept.', 'Signal & Telecom Dept.', 'Electrical Traction Dept.', 'Engineering'."
          },
          date: {
            type: "string",
            description: "The date of the block in YYYY-MM-DD format."
          },
          fromTime: {
            type: "string",
            description: "The start time of the block in HH:MM format (24H)."
          },
          toTime: {
            type: "string",
            description: "The end time of the block in HH:MM format (24H)."
          }
        },
        required: ["id", "department", "date", "fromTime", "toTime"]
      }
    }
  }
];

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    const apiKey = process.env.GROQ_API_KEY || 'gsk_dummy_key';
    
    // Add system instruction to enforce strict track naming and follow-up questions
    const systemMessage = {
      role: 'system',
      content: "You are the BlockTrain AI dispatch assistant. Your job is to schedule maintenance blocks. IMPORTANT: When a user says 'Tambaram Up Line (Sec 1)', you MUST translate it to 'Tambaram - Loop Line 2 (Sec 1)' as per the station's track map. Loop Line 1 is the Down line, Loop Line 2 is the Up line, Mainline is the center line. If the user asks to schedule a block but does not provide all the required information (Date, From Time, To Time, Department, and the EXACT Track ID), DO NOT guess. Instead, politely ask them to provide the missing details."
    };

    const apiMessages = [systemMessage, ...messages.map((m: any) => ({ role: m.role, content: m.content }))];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', 
        messages: apiMessages,
        temperature: 0.2,
        tools: TOOLS,
        tool_choice: "auto"
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Groq API Error:', res.status, errText);
      return NextResponse.json({ error: 'Failed to communicate with Groq API' }, { status: res.status });
    }

    const data = await res.json();
    const message = data.choices[0].message;

    // Execute tool call if requested
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      
      if (toolCall.function.name === 'schedule_block') {
        const args = JSON.parse(toolCall.function.arguments);
        
        try {
          const dbRes = await fetch('http://localhost:5000/api/active_blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args)
          });
          
          if (dbRes.ok) {
            return NextResponse.json({
              reply: `SUCCESS: I have scheduled the maintenance block for ${args.department} on track \`${args.id}\` from ${args.fromTime} to ${args.toTime} on ${args.date}. The track should now instantly light up with a yellow hazard line on the map!`
            });
          } else {
            return NextResponse.json({
              reply: `Error: The database rejected the block request.`
            });
          }
        } catch (dbErr) {
          return NextResponse.json({
            reply: `Error: Could not connect to the database to schedule the block.`
          });
        }
      }
    }
    
    return NextResponse.json({
      reply: message.content || "Sorry, I couldn't understand that."
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
