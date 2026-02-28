import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
    console.warn("GROQ_API_KEY is missing! Agent will not work.");
}

const groq = new Groq({ apiKey });

// Fallback chain — 500k TPD each
const MODELS = [
    'llama-3.1-8b-instant',   // primary
    'llama3-8b-8192',         // fallback 1
    'mixtral-8x7b-32768',
  ];

export type InterviewState = {
    userId: string;
    step: number;
    answers: Record<string, string>;
    messages: any[];
    isGenerated: boolean;
    currentArchitecture?: any;
};

const QUESTIONS = [
    { key: "project_description", type: "textarea", q: "Welcome to DevArchitect AI! To start, could you briefly describe your project idea and its main goals?" },
    { key: "scale", type: "stepper", q: "That sounds like a great project. What is your expected user base and scale (users per day)?", options: ["100", "1,000", "10,000", "100,000", "1,000,000+"] },
    { key: "experience", type: "slider", q: "Got it. What is your developer experience level?", options: ["Beginner", "Intermediate", "Advanced", "Expert"] },
    { key: "frontend", type: "select", q: "Do you have a specific preference for the frontend framework?", options: ["React / Next.js", "Vue / Nuxt", "Angular", "SvelteKit", "Vanilla JS", "No UI / API only"] },
    { key: "backend", type: "select", q: "And what about your backend language preference?", options: ["Node.js (TypeScript)", "Python (Django/FastAPI)", "Go", "Java (Spring)", "Ruby on Rails", "Rust", "C# (.NET)"] },
    { key: "database", type: "select", q: "Great. What are your primary database needs?", options: ["PostgreSQL", "MySQL", "MongoDB (NoSQL)", "Redis", "DynamoDB", "Supabase / Firebase"] },
    { key: "auth", type: "select", q: "Noted. How do you want to handle authentication?", options: ["OAuth (Google/GitHub)", "JWT / Email & Password", "Magic Links", "Auth0 / Clerk", "None"] },
    { key: "integrations", type: "multi-select", q: "Will you need any third-party integrations? (Select all that apply)", options: ["Stripe (Payments)", "Twilio (SMS)", "SendGrid (Email)", "AWS S3 (Storage)", "OpenAI / Gemini", "Google Maps"] },
    { key: "deployment", type: "select", q: "How do you prefer to deploy this application?", options: ["Vercel / Netlify", "AWS (EC2/ECS)", "Google Cloud", "Self-hosted Docker", "Heroku / Render"] },
    { key: "budget_team", type: "slider", q: "What is your team size?", options: ["Solo Developer", "Small Team (2-5)", "Startup (5-15)", "Enterprise"] },
    { key: "timeline", type: "select", q: "What is your timeline?", options: ["Hackathon (< 3 days)", "1-2 Weeks", "1 Month", "3-6 Months", "Ongoing"] },
    { key: "realtime", type: "toggle", q: "Do you need any real-time features like WebSockets or live notifications?", options: ["Yes, need WebSockets", "No, standard HTTP is fine"] },
    { key: "api_type", type: "select", q: "What type of API architecture do you prefer?", options: ["REST API", "GraphQL", "gRPC", "tRPC", "Server Actions"] },
    { key: "security", type: "multi-select", q: "Finally, are there any specific compliance or security requirements?", options: ["SOC2", "HIPAA", "GDPR", "PCI-DSS", "Standard Best Practices"] }
];

const sessions = new Map<string, InterviewState>();

// ─── Groq Helpers ────────────────────────────────────────────────────────────

async function callGroqStream(messages: any[], temperature = 0.7): Promise<string> {
    let lastError: Error = new Error("All models failed.");

    for (const model of MODELS) {
        try {
            console.log(`[Interview] Trying model: ${model}`);

            const stream = await groq.chat.completions.create({
                messages,
                model,
                temperature,
                stream: true,
            });

            let fullText = "";
            for await (const chunk of stream) {
                fullText += chunk.choices[0]?.delta?.content || "";
            }

            console.log(`[Interview] Success with model: ${model}`);
            return fullText;

        } catch (error: any) {
            lastError = error;

            const isRateLimit = error?.status === 429 || error?.error?.code === 'rate_limit_exceeded';
            const hasNextModel = MODELS.indexOf(model) < MODELS.length - 1;

            if (isRateLimit && hasNextModel) {
                console.warn(`[Interview] Rate limit hit on ${model}, falling back...`);
                continue;
            }

            throw error;
        }
    }

    throw lastError;
}

async function callGroq(messages: any[], temperature = 0.7): Promise<string> {
    let lastError: Error = new Error("All models failed.");

    for (const model of MODELS) {
        try {
            console.log(`[Interview] Trying model: ${model}`);

            const chatCompletion = await groq.chat.completions.create({
                messages,
                model,
                temperature,
            });

            const content = chatCompletion.choices[0]?.message?.content || "";
            console.log(`[Interview] Success with model: ${model}`);
            return content;

        } catch (error: any) {
            lastError = error;

            const isRateLimit = error?.status === 429 || error?.error?.code === 'rate_limit_exceeded';
            const hasNextModel = MODELS.indexOf(model) < MODELS.length - 1;

            if (isRateLimit && hasNextModel) {
                console.warn(`[Interview] Rate limit hit on ${model}, falling back...`);
                continue;
            }

            throw error;
        }
    }

    throw lastError;
}

// ─── Main ────────────────────────────────────────────────────────────────────

export async function processInterviewStep(
    userId: string,
    userMessage: string | null,
    isRestore: boolean = false
): Promise<{ text: string, isComplete: boolean, answers?: any, architecture?: any, isUpdate?: boolean, questionData?: any } | null> {

    let state = sessions.get(userId);

    if (isRestore && state && state.step > 0) {
        if (state.isGenerated) return null;
    
        // All questions answered but architecture not yet generated — trigger generation
        if (state.step >= QUESTIONS.length) {
            state.isGenerated = true;
            const { generateArchitecture } = await import('./architectureGenerator');
            try {
                const architecture = await generateArchitecture(state.answers);
                state.currentArchitecture = architecture;
                return {
                    text: "Welcome back! Your architecture has been generated.",
                    isComplete: true,
                    answers: state.answers,
                    architecture,
                    isUpdate: false
                };
            } catch (e) {
                state.isGenerated = false;
                return { text: "Welcome back! There was an error generating your architecture. Please try again.", isComplete: true };
            }
        }
    
        const currentQ = QUESTIONS[state.step]; // now safe
        return {
            text: `Welcome back! Let's continue. ${currentQ.q}`,
            isComplete: false,
            questionData: currentQ
        };
    }

    if (!state) {
        state = {
            userId,
            step: 0,
            answers: {},
            messages: [
                { role: 'system', content: "You are an expert Solutions Architect named DevArchitect AI. You are conducting an interview with me to design a system architecture. You will ask me a series of specific questions one at a time. Acknowledge my previous answers briefly, contextually, and encouragingly before asking the next question. Never ask multiple questions at once. Keep your responses concise and professional." }
            ],
            isGenerated: false
        };
        sessions.set(userId, state);
    }

    // Post-generation: handle follow-up modification requests
    if (state.isGenerated) {
        const { updateArchitecture } = await import('./architectureGenerator');
        try {
            const updated = await updateArchitecture(state.currentArchitecture, userMessage || "");
            state.currentArchitecture = updated;

            return {
                text: "Done! I've updated the architecture based on your request.",
                isComplete: true,
                answers: state.answers,
                architecture: updated,
                isUpdate: true
            };
        } catch (e) {
            return { text: "I tried to update the diagram but encountered an error. Could you try rephrasing?", isComplete: true };
        }
    }

    // Record previous answer
    if (userMessage && state.step > 0 && state.step <= QUESTIONS.length) {
        const prevQ = QUESTIONS[state.step - 1];
        state.answers[prevQ.key] = userMessage;
        state.messages.push({ role: 'user', content: userMessage });
    }

    // All questions answered — generate architecture
    if (state.step >= QUESTIONS.length) {
        state.isGenerated = true;
        const { generateArchitecture } = await import('./architectureGenerator');

        try {
            const architecture = await generateArchitecture(state.answers);
            state.currentArchitecture = architecture;
            return {
                text: "Great, I have everything I need. Your architecture has been generated!",
                isComplete: true,
                answers: state.answers,
                architecture: architecture,
                isUpdate: false
            };
        } catch (e) {
            state.isGenerated = false; // allow retry
            console.error("Architecture generation error:", e);
            return { text: "Error generating the diagram.", isComplete: true };
        }
    }

    // Ask next interview question
    const currentQ = QUESTIONS[state.step];
    const systemPrompt = state.step === 0
        ? `Ask the first question: "${currentQ.q}"`
        : `Acknowledge my answer briefly, then ask the next question: "${currentQ.q}"`;

    state.messages.push({ role: 'user', content: systemPrompt });

    try {
        const trimmedMessages = [
            state.messages[0],
            ...state.messages.slice(-6)
        ];
        const fullText = await callGroqStream(trimmedMessages, 0.7);        state.step++;
        state.messages.push({ role: 'assistant', content: fullText });

        return {
            text: fullText,
            isComplete: false,
            questionData: currentQ
        };
    } catch (e) {
        console.error("Groq API Error:", e);
        state.messages.pop(); // remove the failed prompt to avoid stacking

        return {
            text: "Error communicating with AI. Please check your GROQ_API_KEY in .env.local and try again.",
            isComplete: false,
            questionData: currentQ
        };
    }
}

export function clearSession(userId: string) {
    sessions.delete(userId);
}

export function restoreSession(userId: string, frontendMessages: any[]) {
    if (sessions.get(userId)) return;

    const baseHistory: any[] = [
        { role: 'system', content: "You are an expert Solutions Architect named DevArchitect AI. You are conducting an interview with me to design a system architecture. You will ask me a series of specific questions one at a time. Acknowledge my previous answers briefly, contextually, and encouragingly before asking the next question. Never ask multiple questions at once. Keep your responses concise and professional." }
    ];

    let step = 0;
    const answers: any = {};
    let isGenerated = false;

    if (frontendMessages && frontendMessages.length > 0) {
        for (const msg of frontendMessages) {
            baseHistory.push({
                role: msg.role === "agent" ? "assistant" : "user",
                content: msg.text
            });

            if (msg.role === "user") {
                if (step < QUESTIONS.length) {
                    const qKey = QUESTIONS[step].key;
                    answers[qKey] = msg.text;
                    step++;
                }
            } else if (msg.role === "agent" && msg.text.includes("architecture has been generated")) {
                isGenerated = true;
            }
        }
    }

    try {
        sessions.set(userId, {
            userId,
            step,
            answers,
            messages: baseHistory,
            isGenerated
        });
        console.log(`[Session Restored] User: ${userId}, Step: ${step}`);
    } catch (e) {
        console.error("Failed to restore session chat history:", e);
    }
}
export function getSession(userId: string): InterviewState | undefined {
    return sessions.get(userId);
}