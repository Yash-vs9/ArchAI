# DevArchitect AI

> From idea to architecture, instantly.

DevArchitect AI is an AI-powered system architecture designer. Describe your project in plain English, answer a structured interview, and get a complete interactive visual architecture diagram + a full implementation guide — in under 5 minutes.

![DevArchitect AI](https://img.shields.io/badge/AI-Powered-blue?style=for-the-badge) ![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js) ![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-white?style=for-the-badge&logo=socket.io) ![Groq](https://img.shields.io/badge/Groq-LLM-orange?style=for-the-badge)

---

## What It Does

1. **AI Interview** — A conversational agent asks 14 targeted questions about your project: scale, tech stack, database, auth, integrations, deployment, timeline, and more.
2. **Architecture Generation** — Generates a fully interactive React Flow diagram with all your services, databases, queues, gateways, and integrations laid out visually.
3. **Implementation Guide** — On demand, produces a complete Markdown developer guide covering setup, folder structure, API docs, deployment, cost estimates, and common pitfalls.
4. **Live Modifications** — After generation, ask follow-up questions in plain English to update the architecture in real time.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React, Tailwind CSS |
| Canvas | React Flow |
| Animations | Framer Motion |
| Backend | Node.js, Express, Socket.IO |
| AI / LLM | Groq API (`llama-3.1-8b-instant` + fallbacks) |
| Auth | NextAuth.js |
| Markdown | react-markdown, remark-gfm |
| Export | html-to-image |

---

## Project Structure

```
ArchAI/
├── app/                          # Next.js app router
│   ├── dashboard/
│   │   └── page.tsx              # Main dashboard (DashboardPage)
│   └── api/
│       └── auth/                 # NextAuth routes
│
├── components/
│   ├── canvas/
│   │   ├── ArchitectureCanvas.tsx  # React Flow canvas
│   │   ├── CustomNodes.tsx         # Custom node types
│   │   ├── SummaryPanel.tsx        # Architecture summary sidebar
│   │   └── GuidePanel.tsx          # Implementation guide panel
│   ├── chat/
│   │   ├── ChatPanel.tsx           # Interview chat UI
│   │   └── forms/
│   │       └── DynamicInputs.tsx   # Select, slider, toggle, etc.
│   └── ui/
│       ├── CursorSpotlight.tsx
│       └── ParticlesBackground.tsx
│
├── server/                       # Standalone Node.js backend
│   ├── index.ts                  # Express + Socket.IO server
│   └── agents/
│       ├── interviewAgent.ts     # Interview state machine
│       └── architectureGenerator.ts  # LLM generation logic
│
├── .env.local                    # Environment variables
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Groq API key](https://console.groq.com) (free tier works)
- A Google OAuth app or GitHub OAuth app (for NextAuth)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/archai.git
cd archai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# OAuth (pick one or both)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Groq
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Run the development servers

The project has two servers — the Next.js frontend and the Node.js Socket.IO backend. Run both concurrently:

```bash
npm run dev
```

> Make sure your `package.json` scripts run both. If not, run them separately:
> ```bash
> # Terminal 1 — Frontend
> npx next dev
>
> # Terminal 2 — Backend
> npx ts-node server/index.ts
> ```

### 5. Open the app

```
http://localhost:3000
```

---

## How It Works

### Interview Agent (`interviewAgent.ts`)

A stateful session manager that:
- Maintains per-user conversation history in memory
- Progresses through 14 predefined questions one at a time
- Uses the LLM to generate contextual, encouraging transitions between questions
- Triggers architecture generation once all answers are collected
- Supports session restore from localStorage on page refresh

### Architecture Generator (`architectureGenerator.ts`)

Splits generation into **two parallel LLM calls** to avoid token truncation:
1. **Diagram call** — generates `nodes` and `edges` for React Flow
2. **Summary call** — generates tech stack, schemas, API endpoints, cost estimates, complexity scores, and risk flags

Both calls use a **3-model fallback chain** to handle rate limits automatically:
```
llama-3.1-8b-instant → llama3-8b-8192 → mixtral-8x7b-32768
```

### Real-time Communication (`index.ts`)

All communication uses Socket.IO events:

| Event | Direction | Description |
|---|---|---|
| `restore_interview` | Client → Server | Restore session from localStorage |
| `user_message` | Client → Server | Submit an interview answer |
| `agent_message` | Server → Client | Agent reply + question data |
| `generate_canvas_start` | Server → Client | Loading state begins |
| `generate_canvas_success` | Server → Client | Architecture data payload |
| `generate_canvas_error` | Server → Client | Generation failed |
| `generate_guide` | Client → Server | Request implementation guide |
| `guide_start` | Server → Client | Guide loading state begins |
| `guide_success` | Server → Client | Markdown guide payload |
| `guide_error` | Server → Client | Guide generation failed |

---

## Custom Node Types

The canvas supports 10 node types, each with its own visual style:

| Type | Use Case |
|---|---|
| `ClientNode` | Frontend apps, mobile clients |
| `GatewayNode` | API gateways, load balancers |
| `ServiceNode` | Backend microservices |
| `DatabaseNode` | SQL/NoSQL databases |
| `CacheNode` | Redis, Memcached |
| `QueueNode` | Message queues (Kafka, SQS) |
| `StorageNode` | Object storage (S3) |
| `AuthNode` | Auth services (JWT, OAuth) |
| `CDNNode` | Content delivery networks |
| `ThirdPartyNode` | External APIs and integrations |

---

## Groq Rate Limits

On Groq's free tier:

| Model | Tokens/Day |
|---|---|
| `llama-3.1-8b-instant` | 500,000 |
| `llama3-8b-8192` | 500,000 |
| `mixtral-8x7b-32768` | 500,000 |

Each full session (interview + generation) uses approximately **3,000–5,000 tokens**. You can comfortably run ~100 sessions/day on the free tier.

Monitor your usage at: [console.groq.com/settings/limits](https://console.groq.com/settings/limits)

---

## Scripts

```bash
npm run dev        # Run frontend + backend concurrently
npm run build      # Build Next.js for production
npm run start      # Start production server
```

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

---

## License

[MIT](LICENSE)

---

<div align="center">
  Built with ❤️ for hackathons and developers who hate blank files.
</div>
