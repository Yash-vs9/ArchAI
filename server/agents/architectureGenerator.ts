import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const apiKey = process.env.GROQ_API_KEY || '';
const groq = new Groq({ apiKey });

// Fallback chain — if one model hits its rate/token limit, the next is tried automatically
const MODELS = [
  'llama-3.1-8b-instant',  // 500k TPD — primary
  'gemma2-9b-it',          // 500k TPD — fallback 1
  'llama3-8b-8192',        // 500k TPD — fallback 2
];

const MAX_TOKENS = 4096;

const baseInstruction = `
You are DevArchitect AI, an expert software architecture designer.
You MUST output raw, valid JSON only — no markdown, no code blocks, no backticks, no extra explanation.

Valid node types are: ClientNode, GatewayNode, ServiceNode, DatabaseNode, CacheNode, QueueNode, StorageNode, AuthNode, CDNNode, ThirdPartyNode.
`;

const diagramInstruction = `
${baseInstruction}

Output ONLY a JSON object with "nodes" and "edges" arrays. Do NOT include a "summary" key.

Schema:
{
  "nodes": [
    {
      "id": "node-1",
      "type": "ClientNode",
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
      "label": "HTTPS/REST"
    }
  ]
}

Rules:
- Use realistic x/y positions that create a left-to-right or top-to-bottom flow layout.
- Every node referenced in edges must exist in the nodes array.
- Be thorough — include all major services, databases, queues, gateways, auth, storage, third-party integrations, and CDN as applicable.
`;

const summaryInstruction = `
${baseInstruction}

Output ONLY a JSON object with a single "summary" key. Do NOT include "nodes" or "edges".

Schema:
{
  "summary": {
    "techStack": [
      { "name": "Next.js", "rationale": "For SEO and fast SSR" }
    ],
    "schemas": [
      { "name": "User", "fields": ["id", "email", "hashedPassword"], "type": "MySQL Table" }
    ],
    "serverEstimate": "2x t3.micro EC2 instances, $30/mo",
    "apiEndpoints": [
      { "route": "/api/users", "method": "GET", "description": "Fetch all users" }
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

// ─── Helpers ────────────────────────────────────────────────────────────────

function salvageJSON(text: string): string {
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
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

  if (inString) text += '"';
  while (openBrackets > 0) { text += ']'; openBrackets--; }
  while (openBraces > 0) { text += '}'; openBraces--; }

  return text;
}

function parseResponse(responseText: string): any {
  try {
    return JSON.parse(responseText);
  } catch {
    console.warn("Initial JSON parse failed, attempting to salvage...");
  }

  try {
    return JSON.parse(salvageJSON(responseText));
  } catch (secondError) {
    console.error("Failed to salvage JSON:", secondError);
    throw new Error("Failed to parse architecture JSON. Please try again.");
  }
}

async function callGroq(systemPrompt: string, userPrompt: string): Promise<any> {
  let lastError: Error = new Error("All models failed.");

  for (const model of MODELS) {
    try {
      console.log(`Trying model: ${model}`);

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model,
        temperature: 0.1,
        max_tokens: MAX_TOKENS,
        response_format: { type: 'json_object' }
      });

      const choice = chatCompletion.choices[0];

      if (!choice) {
        throw new Error("No response received from model.");
      }

      if (choice.finish_reason === 'length') {
        throw new Error(`Response truncated by ${model}. Try reducing project complexity.`);
      }

      console.log(`Success with model: ${model}`);
      return parseResponse(choice.message?.content || '{}');

    } catch (error: any) {
      lastError = error;

      const isRateLimit = error?.status === 429 || error?.error?.code === 'rate_limit_exceeded';
      const hasNextModel = MODELS.indexOf(model) < MODELS.length - 1;

      if (isRateLimit && hasNextModel) {
        console.warn(`Rate limit hit on ${model}, falling back to next model...`);
        continue;
      }

      // For non-rate-limit errors, fail immediately
      throw error;
    }
  }

  throw lastError;
}

// ─── Exports ────────────────────────────────────────────────────────────────

export async function generateArchitecture(answers: Record<string, string>) {
  try {
    const userPrompt = `Here are the project requirements gathered from the user:\n\n${JSON.stringify(answers, null, 2)}\n\nGenerate the architecture as instructed.`;

    // Run both calls in parallel for speed
    const [diagram, summaryResult] = await Promise.all([
      callGroq(diagramInstruction, userPrompt),
      callGroq(summaryInstruction, userPrompt)
    ]);

    if (!diagram.nodes || !diagram.edges) {
      throw new Error("Model did not return valid nodes/edges.");
    }

    if (!summaryResult.summary) {
      throw new Error("Model did not return a valid summary.");
    }

    return {
      nodes: diagram.nodes,
      edges: diagram.edges,
      summary: summaryResult.summary
    };

  } catch (error) {
    console.error("Architecture generation failed:", error);
    throw error instanceof Error ? error : new Error("Failed to generate architecture.");
  }
}

export async function updateArchitecture(currentArchitecture: any, userRequest: string) {
  try {
    const userPrompt = `Current Architecture JSON:\n${JSON.stringify(currentArchitecture, null, 2)}\n\nUser modification request: "${userRequest}"\n\nReturn the updated architecture as instructed.`;

    const [diagram, summaryResult] = await Promise.all([
      callGroq(diagramInstruction, userPrompt),
      callGroq(summaryInstruction, userPrompt)
    ]);

    if (!diagram.nodes || !diagram.edges) {
      throw new Error("Model did not return valid nodes/edges.");
    }

    if (!summaryResult.summary) {
      throw new Error("Model did not return a valid summary.");
    }

    return {
      nodes: diagram.nodes,
      edges: diagram.edges,
      summary: summaryResult.summary
    };

  } catch (error) {
    console.error("Architecture update failed:", error);
    throw error instanceof Error ? error : new Error("Failed to update architecture.");
  }
}