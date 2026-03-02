import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const apiKey = process.env.GROQ_API_KEY || '';
const groq = new Groq({ apiKey });

const MODELS = [
    'llama-3.1-8b-instant',
    'llama3-8b-8192',
    'mixtral-8x7b-32768',
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
    { "id": "e1-2", "source": "node-1", "target": "node-2", "label": "HTTPS/REST" }
  ]
}
Rules:
- Use realistic x/y positions that create a left-to-right or top-to-bottom flow layout.
- Every node referenced in edges must exist in the nodes array.
- Be thorough — include all major services, databases, queues, gateways, auth, storage, third-party integrations, and CDN as applicable.
- Always include a realistic costEstimate (e.g. "$10/mo", "$50/mo") in every node's data based on typical cloud pricing.
`;

const summaryInstruction = `
${baseInstruction}
Output ONLY a JSON object with a single "summary" key. Do NOT include "nodes" or "edges".
Schema:
{
  "summary": {
    "techStack": [{ "name": "Next.js", "rationale": "For SEO and fast SSR" }],
    "schemas": [{ "name": "User", "fields": ["id", "email", "hashedPassword"], "type": "MySQL Table" }],
    "serverEstimate": "2x t3.micro EC2 instances, $30/mo",
    "apiEndpoints": [{ "route": "/api/users", "method": "GET", "description": "Fetch all users" }],
    "folderStructure": ["src/", "src/app/", "src/components/", "src/server/", "src/models/"],
    "complexityScore": { "total": 8, "frontend": 7, "backend": 8, "devops": 6, "estimatedWeeks": 12 },
    "riskFlags": ["Real-time sockets might require horizontal scaling quickly"]
  }
}
`;

// ─── Helpers ────────────────────────────────────────────────────────────────

function salvageJSON(text: string): string {
    let openBraces = 0, openBrackets = 0, inString = false, isEscaped = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '\\') { isEscaped = !isEscaped; }
        else {
            if (char === '"' && !isEscaped) inString = !inString;
            else if (!inString) {
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
    try { return JSON.parse(responseText); } catch { console.warn("Initial JSON parse failed, salvaging..."); }
    try { return JSON.parse(salvageJSON(responseText)); }
    catch (e) { console.error("Failed to salvage JSON:", e); throw new Error("Failed to parse architecture JSON."); }
}

async function callGroq(systemPrompt: string, userPrompt: string, jsonMode = true): Promise<any> {
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
                ...(jsonMode ? { response_format: { type: 'json_object' } } : {})
            });

            const choice = chatCompletion.choices[0];
            if (!choice) throw new Error("No response received.");
            if (choice.finish_reason === 'length') throw new Error("Response truncated.");

            const content = choice.message?.content || (jsonMode ? '{}' : '');
            console.log(`Success with model: ${model}`);
            return jsonMode ? parseResponse(content) : content;

        } catch (error: any) {
            lastError = error;
            const shouldFallback =
                error?.status === 429 ||
                error?.error?.code === 'rate_limit_exceeded' ||
                error?.error?.error?.code === 'model_decommissioned';
            if (shouldFallback && MODELS.indexOf(model) < MODELS.length - 1) {
                console.warn(`Falling back from ${model}...`);
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

// ─── Exports ────────────────────────────────────────────────────────────────

export async function generateArchitecture(answers: Record<string, string>) {
    try {
        const userPrompt = `Project requirements:\n\n${JSON.stringify(answers, null, 2)}\n\nGenerate the architecture.`;
        const [diagram, summaryResult] = await Promise.all([
            callGroq(diagramInstruction, userPrompt),
            callGroq(summaryInstruction, userPrompt)
        ]);
        if (!diagram.nodes || !diagram.edges) throw new Error("Model did not return valid nodes/edges.");
        if (!summaryResult.summary) throw new Error("Model did not return a valid summary.");
        return { nodes: diagram.nodes, edges: diagram.edges, summary: summaryResult.summary };
    } catch (error) {
        console.error("Architecture generation failed:", error);
        throw error instanceof Error ? error : new Error("Failed to generate architecture.");
    }
}

export async function updateArchitecture(currentArchitecture: any, userRequest: string) {
    try {
        const userPrompt = `Current Architecture:\n${JSON.stringify(currentArchitecture, null, 2)}\n\nModification request: "${userRequest}"\n\nReturn updated architecture.`;
        const [diagram, summaryResult] = await Promise.all([
            callGroq(diagramInstruction, userPrompt),
            callGroq(summaryInstruction, userPrompt)
        ]);
        if (!diagram.nodes || !diagram.edges) throw new Error("Model did not return valid nodes/edges.");
        if (!summaryResult.summary) throw new Error("Model did not return a valid summary.");
        return { nodes: diagram.nodes, edges: diagram.edges, summary: summaryResult.summary };
    } catch (error) {
        console.error("Architecture update failed:", error);
        throw error instanceof Error ? error : new Error("Failed to update architecture.");
    }
}

export async function generateGuide(answers: Record<string, string>, architecture: any): Promise<string> {
    const systemPrompt = `
You are DevArchitect AI, an expert software engineer and technical writer.
Generate a comprehensive, developer-friendly project implementation guide in Markdown format.
Be specific, practical, and detailed. Use the actual tech stack from the architecture.
Do NOT output JSON. Output only well-formatted Markdown.
`;
    const userPrompt = `
Project Requirements:
${JSON.stringify(answers, null, 2)}

Generated Architecture:
${JSON.stringify(architecture, null, 2)}

Write a complete implementation guide in Markdown with sections:
# Project Implementation Guide
## 1. Project Overview
## 2. Prerequisites
## 3. Project Setup
## 4. Folder Structure
## 5. Core Implementation Steps
## 6. API Endpoints
## 7. Database Setup
## 8. Deployment Guide
## 9. Estimated Cost Breakdown
## 10. Common Pitfalls & Tips
`;
    try {
        return await callGroq(systemPrompt, userPrompt, false);
    } catch (error) {
        console.error("Guide generation failed:", error);
        throw error instanceof Error ? error : new Error("Failed to generate guide.");
    }
}

export type ScaffoldFile = {
    path: string;
    content: string;
};

export async function generateScaffold(
    answers: Record<string, string>, 
    architecture: any,
    folderStructure: string | null  // 👈 add this
): Promise<ScaffoldFile[]> {
    const systemPrompt = `
You are DevArchitect AI. Generate a project scaffold as a JSON object.
Output ONLY valid JSON. No markdown, no backticks, no explanation.
CRITICAL: File contents must be plain strings. Use \\n for newlines. No backtick code fences inside strings.
Schema: { "files": [{ "path": "string", "content": "string" }] }
`;

    const folderContext = folderStructure 
        ? `\n\nIMPORTANT: Use EXACTLY this folder structure — do not deviate:\n${folderStructure}\n\nCreate a file for every folder and key file shown above.`
        : "";

    const userPrompt = `
Project Requirements:
${JSON.stringify(answers, null, 2)}

Architecture Summary:
${JSON.stringify(architecture.summary, null, 2)}
${folderContext}

Generate a scaffold wrapped in { "files": [...] } covering every file and folder in the structure above.
Include realistic boilerplate content for each file based on the tech stack.
Return ONLY { "files": [...] }. No other keys.
`;

    try {
        const result = await callGroq(systemPrompt, userPrompt, true);
        const files = Array.isArray(result) ? result : (result.files || []);
        return files;
    } catch (error) {
        console.error("Scaffold generation failed:", error);
        throw error instanceof Error ? error : new Error("Failed to generate scaffold.");
    }
}