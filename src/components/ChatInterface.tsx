import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Sparkles, RefreshCw } from 'lucide-react';
import { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isChatLoading: boolean;
  agentStatus: string;
}

export default function ChatInterface({
  messages,
  onSendMessage,
  isChatLoading,
  agentStatus
}: ChatInterfaceProps) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isChatLoading) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  return (
    <div id="chat-interface-root" className="bg-[#25272B] border border-[#33353B] flex flex-col h-[70vh]">
      
      {/* Console Header */}
      <div className="p-4 border-b border-[#33353B] bg-[#292B30] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal size={16} className="text-[#ECE0D2]" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#ECE0D2]">
            AI Agent Coordination Console
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-ping" />
          <span className="text-[10px] font-mono text-[#A3E635] font-bold">ONLINE</span>
        </div>
      </div>

      {/* Messages Output */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs text-[#ECE0D2] scrollbar-thin">
        
        {/* Hello Banner */}
        <div className="border border-[#3E424B] p-4 bg-[#1E2024]/40 space-y-2 max-w-2xl">
          <p className="text-[#ECE0D2] font-bold flex items-center space-x-2">
            <Sparkles size={14} className="text-amber-400" />
            <span>Multi-Agent Task Orchestration Terminal</span>
          </p>
          <p className="text-[#9E9CA3] leading-relaxed">
            Welcome! I coordinate three specialized autonomous planning modules:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#9E9CA3]">
            <li><strong className="text-[#ECE0D2]">Scheduler Agent:</strong> Translates phrases like <span className="text-[#A3E635]">"Schedule design review for tomorrow at 2pm"</span> into board assignments.</li>
            <li><strong className="text-[#ECE0D2]">Planner Agent:</strong> Translates goals like <span className="text-[#A3E635]">"Break down building a landing page"</span> into sub-task lists.</li>
            <li><strong className="text-[#ECE0D2]">Focus Agent:</strong> Logs custom Pomodoro sprints.</li>
          </ul>
        </div>

        {/* Message Log */}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col space-y-1 max-w-[85%] ${
              msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
            }`}
          >
            <span className="text-[9px] text-[#6E727A]">
              [{msg.sender === 'user' ? 'User' : msg.agentStatus || 'Assistant'}] - {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
            <div
              className={`p-3 border select-text ${
                msg.sender === 'user'
                  ? 'bg-[#3E424B]/30 border-[#9E9CA3] text-[#ECE0D2]'
                  : 'bg-[#1E2024]/40 border-[#33353B] text-[#ECE0D2] leading-relaxed'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Loading Spinner / Agent Feedback */}
        {isChatLoading && (
          <div className="flex items-center space-x-2 mr-auto bg-[#1E2024]/20 border border-[#3E424B] p-2.5 max-w-sm rounded">
            <RefreshCw size={12} className="animate-spin text-[#9E9CA3]" />
            <span className="text-[10px] text-[#9E9CA3] font-bold">
              {agentStatus ? `[${agentStatus}]` : '[Agent Processing...]'}
            </span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#33353B] bg-[#292B30] flex items-center space-x-3">
        <input
          type="text"
          required
          disabled={isChatLoading}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Command agents (e.g. 'Schedule sprint sync tomorrow at 10am', 'Break down writing a report')..."
          className="flex-1 bg-[#1E2024] border border-[#3E424B] px-3 py-2 text-xs text-[#ECE0D2] placeholder-[#6E727A] focus:outline-none focus:border-[#ECE0D2] disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={isChatLoading || !inputText.trim()}
          className="bg-[#ECE0D2] text-[#1E2024] px-4 py-2 hover:bg-[#D9CDBF] transition-all flex items-center space-x-2 disabled:opacity-40 disabled:hover:bg-[#ECE0D2]"
        >
          <Send size={12} />
          <span className="text-[10px] font-bold uppercase">Send</span>
        </button>
      </form>
    </div>
  );
}
