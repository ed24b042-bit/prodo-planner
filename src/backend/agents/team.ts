import { getGeminiClient, isGeminiOnline, cleanAndParseJson } from '../services/geminiService';
import { readDb, writeDb } from '../services/dbService';
import { Type } from '@google/genai';

export interface TeamAgentResult {
  reply: string;
  actions: { type: string; payload: any }[];
}

/**
 * Team Agent: Handles team creation, team join, members list query, and collaborative scoreboard.
 * Enforces NO fake teammates, NO mock tasks, and NO seeded simulator records.
 */
export async function manageTeam(prompt: string, userId: string, userName: string): Promise<TeamAgentResult> {
  const db = readDb();
  const dbTeams = db.teams || [];
  const uId = userId || 'user-default';
  const uName = userName || 'Prodo Member';

  const lowercasePrompt = prompt.toLowerCase();

  // If asking to show team scoreboard or board information
  if (lowercasePrompt.includes('scoreboard') || lowercasePrompt.includes('leaderboard') || lowercasePrompt.includes('member') || lowercasePrompt.includes('show team')) {
    const activeTeam = dbTeams.find((t: any) => t.members.includes(uId));
    if (!activeTeam) {
      return {
        reply: `[Team Agent] You are not currently associated with any collaborative team workspace.\n\nWould you like to **create a team** or **join an existing team** using an invite code?`,
        actions: []
      };
    }

    const membersInfo = activeTeam.members.map((memberId: string) => {
      const isMe = memberId === uId;
      const completedCount = db.tasks.filter(t => t.assignedTo === memberId && t.status === 'completed' && t.teamId === activeTeam.id).length;
      return `• **${activeTeam.memberNames?.[memberId] || 'Teammate'}** ${isMe ? '(You)' : ''}: ${completedCount} completed task(s)`;
    }).join('\n');

    return {
      reply: `[Team Agent] Active Workspace: **${activeTeam.name}**\nInvite Code: \`${activeTeam.code}\` (Share with your team to join!)\n\n**Current Team Leaderboard Scoreboard**:\n${membersInfo || 'No members registered.'}`,
      actions: []
    };
  }

  // Handle Team Creation or Team Joining using Gemini classifications if online
  if (isGeminiOnline()) {
    try {
      const ai = getGeminiClient();
      const systemInstruction = `You are the Team Agent of Prodo.
Your job is to identify if the user wants to create a team/group (and extract the "name") or join a team/group (and extract the invite "code").

Return strictly in JSON schema:
{
  "action": "create" | "join" | "none",
  "name": "Extracted Team Name" (optional),
  "code": "PRODO-XXXX" (optional),
  "explanation": "Why this interpretation was made"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Process team operation: "${prompt}"`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING, enum: ['create', 'join', 'none'] },
              name: { type: Type.STRING },
              code: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ['action', 'explanation']
          }
        }
      });

      const parsed = cleanAndParseJson<any>(response.text || '{}');
      if (parsed.action === 'create' && parsed.name) {
        return createTeamInternal(parsed.name, uId, uName);
      } else if (parsed.action === 'join' && parsed.code) {
        return joinTeamInternal(parsed.code, uId, uName);
      }
    } catch (err) {
      console.error('Team Agent Gemini parsing failed:', err);
    }
  }

  // Fallback offline rules for create or join
  if (lowercasePrompt.includes('create') || lowercasePrompt.includes('initialize') || lowercasePrompt.includes('make group')) {
    const nameMatch = prompt.match(/(?:create|initialize|make group)\s+(?:team|group|workspace)?\s*["']?([^"']+)["']?/i);
    const teamName = nameMatch ? nameMatch[1].trim() : 'Prodo Team Sprints';
    return createTeamInternal(teamName, uId, uName);
  }

  if (lowercasePrompt.includes('join') || lowercasePrompt.includes('enter code')) {
    const codeMatch = prompt.match(/(?:join|code)\s+([a-zA-Z0-9\-]+)/i);
    const code = codeMatch ? codeMatch[1].toUpperCase() : '';
    if (code) {
      return joinTeamInternal(code, uId, uName);
    }
  }

  // Default feedback
  return {
    reply: `[Team Agent] I can assist you with your collaborative workspace. Tell me to:
- **"Create a team named [Name]"** to start a new private workspace.
- **"Join team with code [PRODO-XXXX]"** to collaborate on a shared project.
- **"Show team scoreboard"** to check task completion metrics.`,
    actions: []
  };
}

function createTeamInternal(teamName: string, creatorId: string, creatorName: string): TeamAgentResult {
  const db = readDb();
  db.teams = db.teams || [];

  // Generate unique team invite code
  const code = 'PRODO-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const newTeam = {
    id: 'team-' + Date.now(),
    name: teamName,
    code,
    creator: creatorId,
    members: [creatorId], // Creator only, ZERO simulated members!
    memberNames: {
      [creatorId]: creatorName
    },
    createdAt: new Date().toISOString()
  };

  // Remove creator from other teams
  db.teams = db.teams.map((t: any) => {
    t.members = t.members.filter((m: string) => m !== creatorId);
    return t;
  }).filter((t: any) => t.members.length > 0);

  db.teams.push(newTeam);
  writeDb(db);

  return {
    reply: `[Team Agent] Excellent! I initialized a new team workspace for you.\n\n` +
           `- **Team Name**: **${newTeam.name}**\n` +
           `- **Invite Code**: \`${newTeam.code}\` (Give this to your teammates to collaborate!)\n` +
           `- **Teammates**: Only you (the creator) are currently registered.\n` +
           `- **Task Board**: Empty and clear. Add some team tasks in the Board tab to sync updates!`,
    actions: [{ type: 'create_team', payload: newTeam }]
  };
}

function joinTeamInternal(inviteCode: string, userId: string, userName: string): TeamAgentResult {
  const db = readDb();
  db.teams = db.teams || [];

  const upperCode = inviteCode.toUpperCase().trim();
  const targetTeam = db.teams.find((t: any) => t.code.toUpperCase() === upperCode);

  if (!targetTeam) {
    return {
      reply: `[Team Agent] Invite code \`${inviteCode}\` was not found in our database. Please verify the characters and try again.`,
      actions: []
    };
  }

  // Remove from other teams first
  db.teams = db.teams.map((t: any) => {
    t.members = t.members.filter((m: string) => m !== userId);
    return t;
  }).filter((t: any) => t.members.length > 0);

  // Add to target team
  if (!targetTeam.members.includes(userId)) {
    targetTeam.members.push(userId);
  }
  targetTeam.memberNames = targetTeam.memberNames || {};
  targetTeam.memberNames[userId] = userName;

  writeDb(db);

  return {
    reply: `[Team Agent] Awesome! You have successfully joined team workspace **${targetTeam.name}**!\n\n` +
           `You can now coordinate schedules and share tasks with ${targetTeam.members.length - 1} other planner(s) in this ledger workspace.`,
    actions: [{ type: 'join_team', payload: targetTeam }]
  };
}
