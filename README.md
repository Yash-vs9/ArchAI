# DevArchitect AI 🏗️

> From idea to architecture, instantly.

DevArchitect AI is an AI-powered system architecture designer. Describe your project in plain English, answer a structured 14-question interview, and get a complete interactive visual architecture diagram, a full implementation guide, a live cost estimate, and a scaffolded GitHub repository — in under 5 minutes.


---

## Features

- **AI Interview Agent** — Conversational agent asks 14 smart questions about your project
- **Interactive Architecture Diagram** — React Flow canvas with all services, databases, queues, and integrations
- **Architecture Diff** — New nodes glow green, modified pulse yellow, removed fade red on updates
- **Live Cost Calculator** — Animated monthly cost estimate that updates as the architecture changes
- **Implementation Guide** — Full Markdown developer guide with setup, API docs, and deployment steps
- **GitHub Repo Scaffolder** — Creates a GitHub repo with your full folder structure in one click
- **Live Modifications** — Ask follow-up questions in plain English to update the architecture
- **Session Restore** — Refreshing restores your interview progress from localStorage

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Canvas | React Flow |
| Animations | Framer Motion |
| Backend | Node.js, Express, Socket.IO |
| AI / LLM | Groq API (`llama-3.1-8b-instant` + fallbacks) |
| Auth | NextAuth.js (Google / GitHub OAuth) |
| Markdown | react-markdown, remark-gfm |
| Export | html-to-image |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Project Structure
```
ArchAI/
├── app/
│   ├── dashboard/page.tsx          # Main dashboard
│   └── api/auth/                   # NextAuth routes
├── components/
│   ├── canvas/
│   │   ├── ArchitectureCanvas.tsx  # React Flow canvas + diff + cost
│   │   ├── CustomNodes.tsx         # 10 custom node types
│   │   ├── SummaryPanel.tsx        # Architecture summary sidebar
│   │   ├── GuidePanel.tsx          # Implementation guide panel
│   │   └── GitHubScaffolder.tsx    # GitHub repo scaffold modal
│   ├── chat/
│   │   ├── ChatPanel.tsx           # Interview chat UI
│   │   └── forms/DynamicInputs.tsx # Select, slider, toggle, stepper
│   └── ui/
│       ├── CursorSpotlight.tsx
│       └── ParticlesBackground.tsx
└── server/
    ├── index.ts                    # Express + Socket.IO server
    └── agents/
        ├── interviewAgent.ts       # Interview state machine
        └── architectureGenerator.ts # LLM generation + guide
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- [Groq API key](https://console.groq.com) (free — 500k tokens/day)
- Google or GitHub OAuth credentials

### 1. Clone & install
```bash
git clone https://github.com/yourusername/archai.git
cd archai
npm install
```

### 2. Configure `.env.local`
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GROQ_API_KEY=your_groq_api_key
MONGODB_URI=your_mongodb_uri
```

### 3. Run
```bash
npm run dev:all
```

Opens at `http://localhost:3000`

---

## How It Works

### LLM Fallback Chain
If one model hits its rate limit it automatically falls back to the next:
```
llama-3.1-8b-instant → llama3-8b-8192 → mixtral-8x7b-32768
```

### Split Generation
Architecture is generated in two parallel calls to avoid token truncation — one for the diagram (nodes + edges) and one for the summary (tech stack, schemas, costs, endpoints).

### Architecture Diff
Nodes are compared by ID and data on every update. Diff styles are applied for 6 seconds then auto-cleared.

### GitHub Scaffolder
Reads folder structure directly from the architecture summary — no extra LLM call. Pushes `.gitkeep` files for folders and stub files for each listed file via the GitHub API.

---

## Socket.IO Events

| Event | Direction | Description |
|---|---|---|
| `user_message` | Client → Server | Submit interview answer |
| `agent_message` | Server → Client | Agent reply + question data |
| `generate_canvas_start` | Server → Client | Loading begins |
| `generate_canvas_success` | Server → Client | Architecture payload |
| `generate_canvas_error` | Server → Client | Generation failed |
| `generate_guide` | Client → Server | Request guide |
| `guide_success` | Server → Client | Markdown guide |
| `scaffold_github` | Client → Server | Create GitHub repo |
| `scaffold_success` | Server → Client | Repo URL |

---

## Deployment

| Service | Platform | Cost |
|---|---|---|
| Frontend | Vercel | Free |
| Backend | Render | Free |
| Keep-alive | UptimeRobot | Free |
| Database | MongoDB Atlas M0 | Free |

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full step-by-step guide.

---

## Scripts
```bash
npm run dev          # Frontend only
npm run dev:all      # Frontend + Backend
npm run build        # Production build
npm run start:server # Backend only
```

---

## License

[MIT](LICENSE)

---

<div align="center">
  Built with ❤️ for hackathons and developers who hate blank files.
</div>
