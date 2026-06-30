# Planner Board: Agentic Multi-List Task Coordinator

Planner Board is an intelligent, multi-agent digital task board and productivity planner. Built with React, TypeScript, Express, and Google Gemini, it serves as an AI-powered co-pilot for individuals and teams to manage tasks, coordinate schedules, track focus habits, and collaborate in real-time.

---

## Key Features

- **Multi-Agent AI Core**: Powered by Gemini 2.5 Flash, the specialized agent system includes:
  - **Brain Agent**: Classifies user intents (scheduling, logging, metrics, or general chat) and extracts structured parameters.
  - **Planner Agent**: Automatically breaks down complex goals into executable task lists.
  - **Scheduler and Task Agent**: Optimizes schedules, prioritizes tasks, and updates metadata.
  - **Habits/Coach Agent**: Monitors focus logs to compute streaks, productivity baselines, and coaching advice.
- **Team Collaboration**: Create workspaces, invite members via unique join codes, assign tasks, and discuss them with thread-based comments.
- **Rich Analytics**: View interactive productivity metrics, streak trackers, focus logs, and work distribution charts powered by Recharts.
- **Interactive Calendar and Kanban**: Drag, reorder, and schedule tasks across customizable boards, folders, and timelines.
- **Voice Integration**: Dictate scheduling requests directly with speech-to-text input to run hands-free task creation.

---

## Architecture and Tech Stack

```mermaid
graph TD
    User([User Interface]) -->|Chat / Voice / UI Action| WebApp[Vite + React SPA]
    WebApp -->|HTTP API Requests| ExpressServer[Express API Server]
    ExpressServer -->|Read/Write| DB[(db.json Local File Database)]
    
    ExpressServer -->|Orchestrates| BrainAgent[Brain / Router Agent]
    BrainAgent -->|Uses| GeminiSDK[@google/genai Client]
    
    ExpressServer -->|Delegates Goals| PlannerAgent[Planner Agent]
    ExpressServer -->|Schedules| SchedulerAgent[Scheduler Agent]
    ExpressServer -->|Habits & Advice| HabitAgent[Coach / Habit Agent]
    
    PlannerAgent --> GeminiSDK
    SchedulerAgent --> GeminiSDK
    HabitAgent --> GeminiSDK
```

### Frontend
- **Framework**: React 18 and TypeScript
- **Styling**: Tailwind CSS 4 and Motion
- **Icons**: Lucide React
- **Data Visualization**: Recharts and D3

### Backend and AI
- **Runtime**: Node.js with Express
- **AI Core**: `@google/genai` (Gemini 2.5 Flash)
- **Local DB**: File-based JSON Database (db.json)
- **Developer Tools**: Vite, TSX, Esbuild

---

## Project Structure

```
planner-board/
├── assets/                     # Application visual assets
├── src/
│   ├── backend/                # Server-side logic & agent code
│   │   ├── agents/             # Agent definitions (Brain, Planner, Scheduler, Coach, Team)
│   │   └── services/           # DB Service, Gemini Client, etc.
│   ├── components/             # React UI Components (TaskPanel, CalendarView, Analytics, Chat, etc.)
│   ├── App.tsx                 # Main SPA component & routing
│   ├── main.tsx                # Client entry point
│   ├── index.css               # Styling and CSS variables
│   └── types.ts                # TypeScript interface definitions
├── server.ts                   # Express server entry point & API endpoints
├── db.json                     # Local JSON database file
├── vite.config.ts              # Vite configuration
└── tsconfig.json               # TypeScript compiler config
```

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **Gemini API Key** (from Google AI Studio)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
   cd planner-board
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory (copied from `.env.example`):
   ```properties
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### Running the App

Start the development server (which launches both the Vite build and the TSX-based Express backend):

```bash
npm run dev
```

Open your browser and navigate to: **`http://localhost:3000`**

### Building for Production

Compile both client-side assets and bundle the server:

```bash
npm run build
npm start
```

---

## Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


