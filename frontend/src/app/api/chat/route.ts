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
    const { messages, trains, audioUrl } = await request.json();
    const apiKey = process.env.GROQ_API_KEY || 'gsk_dummy_key';
    
    // Convert trains to a readable string context
    let trainsContext = "No live trains available.";
    if (trains && trains.length > 0) {
      trainsContext = trains.map((t: any) => {
        const dir = t.direction === 1 ? "Up" : "Down";
        const state = t.stopUntil ? "STOPPED" : t.speed > 0 ? `MOVING (${t.speed}x)` : "IDLE";
        return `- ${t.id} (${t.name}): x=${Math.round(t.x)} [${dir} line], State: ${state}`;
      }).join("\n");
    }

    // Add system instruction to enforce strict track naming and follow-up questions
    const systemMessage = {
      role: 'system',
      content: `You are 'BlockTrain AI', the hyper-intelligent central dispatch assistant for the Southern Railway (Chennai Suburban Network). 
You are integrated into the 'BlockTrain Digital Twin', a brutalist, high-performance web dashboard that maps real-time train movements from Tambaram to Chromepet.

YOUR CAPABILITIES & KNOWLEDGE:
1. TRACK TOPOLOGY: You know that Tambaram station has multiple lanes. 'Loop Line 1' is the Down Line, 'Loop Line 2' is the Up Line, and 'Mainline' is the center line. If the user refers to 'Tambaram Up Line (Sec 1)', you MUST map it strictly to the ID 'Tambaram - Loop Line 2 (Sec 1)' when scheduling.
2. TRAIN PHYSICS: You know that trains in the BlockTrain simulation smoothly brake, switch lanes dynamically to avoid scheduled hazard blocks, and halt at terminal ends before reversing.
3. SCHEDULING: If asked for the best time to schedule a maintenance block with minimum disruption, you know that Night Blocks (23:30 to 03:30) have absolute minimum traffic, and Mid-Day Blocks (11:00 to 13:00) are the secondary low-frequency EMU windows.
4. UI AWARENESS: You reside in a floating terminal window in the bottom right of the '/maintenance' page. If a block is scheduled successfully, you know it instantly appears in the Active Blocks dashboard and glows with a yellow hazard line on the map.

RULES FOR SCHEDULING BLOCKS (CRITICAL):
If the user wants to schedule a block, YOU MUST HAVE ALL 5 PIECES OF INFORMATION: Date, From Time (HH:MM), To Time (HH:MM), Department, and the EXACT Track ID. 
If the user does NOT provide the duration or any other field, DO NOT guess or hallucinate. Politely pause and ask them: "Please provide the missing details: [list missing things]". Only once you have everything, call the \`schedule_block\` tool.

CURRENT LIVE TRAIN POSITIONS (Real-time telemetry):
${trainsContext}
If the user asks where a train is, use the telemetry above to answer.

Respond in a crisp, highly professional, slightly futuristic dispatch-coordinator tone. Be concise and confident.`
    };

    const apiMessages = [systemMessage, ...messages.map((m: any) => ({ role: m.role, content: m.content }))];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b', 
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
            
            // Trigger automated Twilio dispatch
            try {
              await fetch('http://localhost:5000/api/dispatch/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  blockId: args.id,
                  department: args.department,
                  date: args.date,
                  fromTime: args.fromTime,
                  toTime: args.toTime,
                  audioUrl: audioUrl
                })
              });
            } catch (dispatchErr) {
              console.error("Twilio Dispatch failed to connect:", dispatchErr);
            }

            return NextResponse.json({
              reply: `SUCCESS: I have scheduled the maintenance block for **${args.department}** on track **${args.id}** from **${args.fromTime}** to **${args.toTime}** on **${args.date}**.\n\nThe track should now instantly light up with a yellow hazard line on the map! A Twilio automated dispatch SMS has also been triggered.`
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
