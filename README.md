# ProDo: Agentic Multi-List Task Coordinator and Focus Assistant

ProDo is a specialized digital workspace and task planner designed to move productivity tracking from passive reminders to active planning. The application combines custom board organization, a Pomodoro focus hub, analytics dashboarding, team collaboration workspaces, and a multi-agent system powered by Google Gemini to analyze, structure, and automate task management.

---

## Technical Overview and Core Architecture

ProDo is structured as a full-stack JavaScript application using a Single Page Application frontend and a server-side JSON file-based database backend.

1. **Client-Side SPA**: Built with React 18, TypeScript, Tailwind CSS, Motion, and Lucide React.
2. **Server-Side API**: Built with Node.js and Express, orchestrating database transactions and agent modules.
3. **AI Coordination Layer**: Utilizes the Google Gen AI SDK to direct tasks to dedicated agents (Intent router, Goal Planner, Task Scheduler, Habit Coach, and Team Manager).
4. **Data Store**: Uses a local JSON transaction file (`db.json`) parsed and updated via a file service.

---

## Detailed Application Features

### 1. Collaborative Kanban Boards (TaskPanel)
The primary task board organizes tasks across custom, reorderable vertical lists.
* **Custom Folders (Lists)**: Users can create, rename, reorder, and delete custom list lanes (folders) to match their personal or project hierarchy.
* **Task Card Management**: Supports tasks with attributes including duration, priority (high, medium, low), assignees, scheduled date, scheduled time, and descriptions.
* **Drag-and-Drop Staging**: Drag tasks between lists or reorder entire list lanes dynamically.
* **Context Filtering**: Displays tasks filtered by personal workspace or active team workspace contexts.

### 2. Pomodoro Focus Hub (HabitLogger)
A dedicated deep work panel designed to help users track focus sessions and avoid distraction.
* **Pomodoro Focus Timer**: Features a customizable circular timer with presets for 15, 25, 45, and 60 minutes.
* **Focus Logs**: Captures focus duration, tags (such as Deep Work, Engineering, Meetings), user distraction frequency, and session location.
* **Streak Management**: Automatically increments and tracks the user's daily active focus streak based on sequential daily logs.

### 3. Collaborative Workspaces (TeamTaskPanel)
Enables secure project sharing and task delegation between team members without simulated accounts.
* **Team Creation and Joining**: Users can create private teams with unique invitation codes (formatted as `PRODO-XXXX`) or join existing workspaces using a code.
* **Shared Task Lists**: Displays shared boards where tasks are assigned to specific team members and documented via message threads.
* **Active Scoreboards**: Measures task completion counts per user within the team workspace to track progress.

### 4. Interactive Analytics Dashboard (AnalyticsDashboard)
Visualizes historical productivity logs and focus habits using Recharts and D3.
* **Activity Overview**: Renders a vertical bar chart of total focus minutes and focus sessions over the last 7 logged days.
* **Location Allocation**: Renders a pie chart representing focus hours spent across work environments (home, library, classroom, cafe, and office).
* **Focus Quality and Distractions**: Renders a dual-axis line chart matching focus scores (1-5 stars) against distraction interruptions over the last 10 logged sessions.

### 5. Multi-Agent Command Console (ChatInterface)
A console routing natural language commands to the backend coordinator agent mesh.
* **Brain Agent (Router)**: Evaluates user intent (scheduling, goal planning, focus logging, metrics retrieval) and routes queries accordingly.
* **Planner Agent**: Evaluates high-level project goals (e.g., "Build a landing page") and breaks them down into 3 to 5 sequenced, prioritized sub-tasks.
* **Scheduler Agent**: Resolves relative time descriptions (e.g., "tomorrow at 3 PM") based on the current local reference time and estimates task durations.
* **Habits and Memory Agents**: Summarize long-term history, compile performance profiles, and handle old task garbage collection.
* **Voice-Enabled Input**: Integrates Web Speech API recognition to transcribe user commands directly into the terminal console.

---

## Project Structure

```
planner-board/
├── assets/                     # Graphic assets and design resources
├── src/
│   ├── backend/                # Server-side logic and modules
│   │   ├── agents/             # Cognitive agent scripts (brain, planner, scheduler, coach, team, memory)
│   │   └── services/           # DB persistence, Gemini client configurations
│   ├── components/             # React visual panels and layouts
│   │   ├── AnalyticsDashboard  # Recharts graphs
│   │   ├── CalendarView        # Timeline rendering
│   │   ├── ChatInterface       # Terminal console
│   │   ├── HabitLogger         # Focus timer and streak trackers
│   │   ├── TaskPanel           # Main Kanban board
│   │   └── VoiceInput          # Speech recognition buttons
│   ├── App.tsx                 # Core application controller
│   ├── main.tsx                # Client-side bootstrap entry point
│   ├── index.css               # Global Tailwind CSS configurations
│   └── types.ts                # App-wide interface definitions
├── server.ts                   # Express server entry point and endpoint registry
├── db.json                     # Local JSON database file
├── vite.config.ts              # Vite bundle configurations
└── tsconfig.json               # TypeScript compiler rules
```

---

## Setup and Installation

### Prerequisites
* **Node.js** (version 18 or higher)
* **Google Gemini API Key** (sourced from Google AI Studio)

### Installation Steps

1. Clone the repository to your machine.
2. Open a terminal in the root directory and install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` configuration file in the root directory (based on `.env.example`) and configure your API key:
   ```properties
   GEMINI_API_KEY=your_actual_gemini_api_key
   ```

### Execution

To run the application locally in development mode (which initiates the Vite development server and Express API endpoints concurrently on port 3000):

```bash
npm run dev
```

Open a web browser and navigate to **`http://localhost:3000`**.

### Production Compilation
To bundle the frontend application and compile the server bundle for production deployment:

```bash
npm run build
npm start
```
