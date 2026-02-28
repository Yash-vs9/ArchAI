import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const apiKey = process.env.GROQ_API_KEY || '';
const groq = new Groq({ apiKey });

// We define a strict JSON schema for the output
const systemInstruction = `
You are DevArchitect AI, an expert software architecture designer. 
Based on the full requirements provided, generate a detailed system architecture suitable for React Flow, and a comprehensive project summary.
You MUST output raw, valid JSON only, without any markdown formatting, code blocks or backticks.

The JSON MUST match this exact schema:
{
  "nodes": [
    {
      "id": "node-1",
      "type": "ClientNode", // or GatewayNode, ServiceNode, DatabaseNode, CacheNode, QueueNode, StorageNode, AuthNode, CDNNode, ThirdPartyNode
      "position": { "x": 0, "y": 0 },
      "data": { 
        "label": "Next.js Frontend",
        "description": "User-facing web app",
        "tech": "Next.js 14, React",
        "costEstimate": "$20/mo",
        "scalingNotes": "Scales on Vercel" 
      }
    }
  ],
  "edges": [
    {
      "id": "e1-2",
      "source": "node-1",
      "target": "node-2",
      "label": "HTTPS/GraphQL"
    }
  ],
  "summary": {
    "techStack": [
      { "name": "Next.js", "rationale": "For SEO and fast SSR" }
    ],
    "schemas": [
      { "name": "User", "fields": ["id", "email", "hashedPassword"], "type": "MongoDB Document" }
    ],
    "serverEstimate": "2x t3.micro EC2 instances, $30/mo",
    "apiEndpoints": [
      { "route": "/api/users", "method": "GET", "description": "Fetch users" }
    ],
    "folderStructure": [
      "src/",
      "src/app/",
      "src/components/",
      "src/server/",
      "src/models/"
    ],
    "complexityScore": {
      "total": 8,
      "frontend": 7,
      "backend": 8,
      "devops": 6,
      "estimatedWeeks": 12
    },
    "riskFlags": [
      "Real-time sockets might require horizontal scaling quickly"
    ]
  }
}
`;

export async function generateArchitecture(answers: Record<string, string>) {
  try {
    const prompt = `Here are the project requirements gathered from the user:\n\n${JSON.stringify(answers, null, 2)}\n\nPlease generate the architecture JSON based on the system instruction.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      model: 'groq/compound-mini',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    let responseText = chatCompletion.choices[0]?.message?.content || "{}";

    // Robust parsing for truncated JSON
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.warn("Initial JSON parse failed, attempting to salvage truncated JSON...", parseError);

      // Very basic truncation fix: count brackets/braces and append missing closures
      let openBraces = 0;
      let openBrackets = 0;
      let inString = false;
      let isEscaped = false;

      for (let i = 0; i < responseText.length; i++) {
        const char = responseText[i];
        if (char === '\\') {
          isEscaped = !isEscaped;
        } else {
          if (char === '"' && !isEscaped) {
            inString = !inString;
          } else if (!inString) {
            if (char === '{') openBraces++;
            else if (char === '}') openBraces--;
            else if (char === '[') openBrackets++;
            else if (char === ']') openBrackets--;
          }
          isEscaped = false;
        }
      }

      if (inString) responseText += '"';
      while (openBrackets > 0) { responseText += ']'; openBrackets--; }
      while (openBraces > 0) { responseText += '}'; openBraces--; }

      try {
        return JSON.parse(responseText);
      } catch (secondError) {
        console.error("Failed to salvage JSON:", secondError);
        throw new Error("Failed to generate complete architecture JSON. Please try again or use a different model.");
      }
    }

  } catch (error) {
    console.error("Architecture generation failed:", error);
    throw new Error("Failed to generate architecture.");
  }
}

// Function to handle follow-up edits
export async function updateArchitecture(currentArchitecture: any, userRequest: string) {
  const prompt = `Current Architecture JSON:\n${JSON.stringify(currentArchitecture, null, 2)}\n\nUser modification request: "${userRequest}"\n\nReturn the updated complete JSON strictly following the schema.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      model: 'groq/compound-mini',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    let responseText = chatCompletion.choices[0]?.message?.content || "{}";

    // Robust parsing for truncated JSON
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.warn("Initial JSON parse failed, attempting to salvage truncated JSON...", parseError);

      // Very basic truncation fix: count brackets/braces and append missing closures
      let openBraces = 0;
      let openBrackets = 0;
      let inString = false;
      let isEscaped = false;

      for (let i = 0; i < responseText.length; i++) {
        const char = responseText[i];
        if (char === '\\') {
          isEscaped = !isEscaped;
        } else {
          if (char === '"' && !isEscaped) {
            inString = !inString;
          } else if (!inString) {
            if (char === '{') openBraces++;
            else if (char === '}') openBraces--;
            else if (char === '[') openBrackets++;
            else if (char === ']') openBrackets--;
          }
          isEscaped = false;
        }
      }

      if (inString) responseText += '"';
      while (openBrackets > 0) { responseText += ']'; openBrackets--; }
      while (openBraces > 0) { responseText += '}'; openBraces--; }

      try {
        return JSON.parse(responseText);
      } catch (secondError) {
        console.error("Failed to salvage JSON:", secondError);
        throw new Error("Failed to generate complete architecture JSON. Please try again or use a different model.");
      }
    }

  } catch (error) {
    console.error("Architecture update failed:", error);
    throw new Error("Failed to update architecture.");
  }
}
