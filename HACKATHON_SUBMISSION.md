# The Last-Minute Life Saver - Project Submission

## Project Name: ProDo Planner Board
- **Team Name**: [Insert Team Name]
- **Team Members**: [Insert Member Names]
- **Date**: June 30, 2026

---

## 1. Problem Statement Selected

### The Challenge: The Last-Minute Life Saver
Students, professionals, and entrepreneurs frequently miss critical deadlines, assignments, meetings, payments, interviews, and commitments. Existing productivity tools fall short because they rely on **passive reminders**—push notifications that are easily swiped away, ignored, and do nothing to help the user actually take action or start working. 

### The Objective
To build an AI-powered productivity companion that shifts the paradigm from passive, easily ignorable alerts to **proactive planning, prioritization, and execution**. The solution must move beyond traditional static reminders to help users make decisions, break down work, and complete tasks before deadlines are missed.

---

## 2. Solution Overview

### ProDo Planner Board
**ProDo** is an intelligent, multi-agent digital task board and workspace designed to act as a proactive co-pilot for high-stress individuals and teams. Instead of waiting for a deadline to approach and sending a static alert, ProDo employs a **coordinator agent mesh** to help users organize, schedule, and complete their work. 

At the core of ProDo is a conversational agent workspace that allows users to type or speak natural commands. ProDo automatically parses intentions, breaks down goals into discrete tasks, allocates time blocks on the calendar, tracks daily habits, and generates personalized coaching tips. It also includes full collaborative features, allowing groups to establish shared spaces, auto-delegate tasks, and view live scoreboard metrics.

---

## 3. Key Features

Here is the breakdown of the features implemented in the ProDo system:

*   **Intelligent Task Prioritization (Implemented)**: Dynamic priority classification (`high`, `medium`, `low`) based on intent analysis and deadline proximity.
*   **AI-Powered Scheduling Assistance (Implemented)**: The Scheduler Agent automatically resolves relative times (e.g., "tomorrow at 3pm," "next Monday morning") relative to the user's current local time, estimating duration and establishing calendar slots.
*   **Personalized Productivity Recommendations (Implemented)**: The Coach Agent monitors focus logs and completion rates to calculate a custom "Productivity Coefficient" and deliver context-aware, actionable advice.
*   **Context-Aware Memory (Implemented)**: The Memory Agent maintains a profile of user work habits, primary focus environments, and active task lists to personalize scheduling decisions.
*   **Interactive Calendar and Kanban (Implemented)**: High-fidelity visual dashboards, calendar views, and drag-and-drop lists for intuitive visual tracking.
*   **Goal and Habit Tracking (Implemented)**: Focus logs, distraction counters, work location analysis, and active streak metrics with streak alerts.
*   **Voice-Enabled Assistance (Implemented)**: Speech-to-text input component that allows hands-free scheduling and command dictation.
*   **Autonomous Task Planning (Implemented)**: The Planner Agent takes broad goals (e.g., "Build a React prototype") and automatically breaks them down into 3–5 sequenced sub-tasks, assigns durations, and stages them in specific task lists.

---

## 4. Agentic Depth and Autonomy

ProDo moves beyond simple API hooks by implementing a **Multi-Agent Coordinator Mesh** that divides cognitive tasks between specialized, autonomous agents:

```
[User Input] ──> [Brain Agent (Router & Intent Classifier)]
                        │
         ┌──────────────┼──────────────┬──────────────┐
         ▼              ▼              ▼              ▼
  [Planner Agent] [Scheduler Agent] [Habit Agent] [Team Agent]
  (Decomposes     (Allocates Time   (Evaluates    (Coordinates
   Goals into      and Resolves      Streaks and   Collaborations
   Sub-tasks)      Deadlines)        Deep Focus)   and Metrics)
```

1.  **The Brain Agent (Intent Classifier)**: Reads natural language input, determines the target agent (Scheduling, Habit tracking, Metrics, Team, or General Chat), and structured parameters.
2.  **The Planner Agent (Decomposition)**: Evaluates complex, ambiguous project goals. It autonomously determines the path of execution, creates discrete tasks, and routes them to appropriate boards.
3.  **The Scheduler Agent (Temporal Reasoning)**: Evaluates the user's local reference time to calculate relative schedules and calendar blocks, matching task attributes to existing folders.
4.  **The Habit and Memory Agents (Optimization)**: Monitor user distractions and completion statistics. They run daily/weekly analytical aggregation routines to summarize the user's workspace history and clean up completed tasks to prevent database bloat.
5.  **The Team Agent (Coordination)**: Manages team workspaces, invite codes, and synchronizes real-time performance scoreboards among active members.

---

## 5. Technologies Used

### Frontend
- **React 18 & TypeScript**: Robust, type-safe single-page application structure.
- **Tailwind CSS 4 & Motion**: Premium styling, fluid micro-interactions, and visual transitions.
- **Lucide React**: Clean, modern iconography.
- **Recharts & D3**: Data-rich interactive charts for productivity metrics and focus statistics.

### Backend
- **Express**: Lightweight Node.js server handling REST API routes.
- **TSX & Esbuild**: Fast compilation and execution of TypeScript in Node.js environments.

### Database
- **File-based JSON DB**: Read/write services simulating a light database cache for fast local deployment.

---

## 6. Google Technologies Utilized

*   **Google Gemini API**: Utilizes `gemini-2.5-flash` and `gemini-3.5-flash` for advanced natural language understanding, text parsing, task decomposition, and memory synthesis.
*   **Structured JSON Outputs (Gemini SDK)**: Leverages structured JSON schemas (`responseSchema`) in Gemini requests to ensure the AI output conforms to TypeScript interfaces.
*   **Google AI Studio**: Primary platform for system prompt prototyping, parameter tuning, and API key management.
*   **Firebase Applet Configuration**: Ready-to-go deployment config.

---

## 7. Submission Checklist & Verification

- [x] **README.md**: Standard, emoji-free developer documentation explaining setup and run procedures.
- [x] **Project Repository**: Initialized, staged, and pushed to a public GitHub repository.
- [x] **Runnable Local Server**: Express and Vite combined build running on port 3000.
- [x] **AI Model Integration**: Gemini API integrated into backend services with fallbacks for offline scenarios.
- [x] **Database State Integrity**: Zero seeded/simulated fake tasks; all board, team, and habit metrics are derived from live user action.
