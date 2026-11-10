import React, { useState } from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { LoadingSkeleton } from '../../components/shared/LoadingSkeleton';
import {
  useAIConversations,
  useCreateAIConversation,
  useSendMessageToAI,
} from '../../api/ai';
import { Bot, Send, Sparkles, ShieldAlert, Plus, MessageSquare, User, Calendar, BookOpen, Clock } from 'lucide-react';

export const AIAssistantPage: React.FC = () => {
  const { data: conversations = [], isLoading } = useAIConversations();
  const createConversation = useCreateAIConversation();
  const sendMessage = useSendMessageToAI();

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [contextType, setContextType] = useState<'general' | 'schedule' | 'exam' | 'finance' | 'health'>('general');

  const currentConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  const handleStartNewConversation = async (ctx: typeof contextType = 'general') => {
    const created = await createConversation.mutateAsync({
      title: `${ctx.charAt(0).toUpperCase() + ctx.slice(1)} Session`,
      context_type: ctx,
    });
    setActiveConvId(created.id);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    try {
      let convId = currentConv?.id;
      if (!convId) {
        const created = await createConversation.mutateAsync({
          title: inputMessage.slice(0, 30),
          context_type: contextType,
        });
        convId = created.id;
        setActiveConvId(created.id);
      }

      const text = inputMessage;
      setInputMessage('');
      await sendMessage.mutateAsync({ conversationId: convId, message: text } as any);
    } catch (err) {
      console.warn('AI send message handled:', err);
    }
  };

  const samplePrompts = [
    { title: 'Create Daily Study Schedule', desc: 'Optimize time blocks for hardest subjects', ctx: 'schedule' as const },
    { title: 'Analyze Exam Preparation', desc: 'Identify weak subjects from mock tests', ctx: 'exam' as const },
    { title: 'Suggest 7-Day Revision Plan', desc: 'Spaced repetition schedule for pending topics', ctx: 'schedule' as const },
  ];

  if (isLoading) return <LoadingSkeleton rows={4} />;

  const messages = currentConv?.messages || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Student Assistant"
        description="Autonomous academic copilot that generates realistic schedules, analyzes mock test performance, and suggests revision strategies."
      />

      {/* Safety Notice Banner */}
      <div className="flex items-center gap-2 p-3.5 bg-primary/5 rounded-xl text-xs text-muted-foreground border border-primary/20">
        <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
        <span>
          <strong>Safety & User Sovereignty:</strong> AI recommendations use your authorized application metrics but will <strong>never silently modify</strong> your schedules, transactions, or exam records without your explicit approval.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
        {/* Sidebar: Conversation history */}
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <span className="text-xs font-bold text-foreground">Conversations</span>
              <button
                onClick={() => handleStartNewConversation(contextType)}
                className="p-1 text-primary hover:bg-muted rounded-md"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-[460px]">
              {conversations.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No previous chats</p>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveConvId(c.id)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition flex items-center gap-2 truncate ${
                      currentConv?.id === c.id
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{c.title}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Context Selector */}
          <div className="pt-3 border-t border-border">
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase">
              Assistant Mode
            </label>
            <select
              value={contextType}
              onChange={(e) => setContextType(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
            >
              <option value="general">General Academic Help</option>
              <option value="schedule">Schedule & Time Blocking</option>
              <option value="exam">Exam Prep & Mock Analysis</option>
              <option value="finance">Student Finance Advisor</option>
              <option value="health">Health & Sleep Coaching</option>
            </select>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl flex flex-col justify-between shadow-sm overflow-hidden">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">How can I assist your study today?</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ask for schedule optimization, mock test mistake pattern diagnosis, or revision timelines.
                  </p>
                </div>

                {/* Prompt Cards */}
                <div className="grid grid-cols-1 gap-2 w-full text-left">
                  {samplePrompts.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInputMessage(p.title);
                        setContextType(p.ctx);
                      }}
                      className="p-3 rounded-xl border border-border hover:border-primary/50 bg-background transition text-left"
                    >
                      <p className="text-xs font-semibold text-foreground">{p.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 max-w-[85%] ${
                    m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground border border-border'
                    }`}
                  >
                    {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                        : 'bg-muted/50 border border-border text-foreground rounded-tl-none whitespace-pre-wrap'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input bar */}
          <form onSubmit={handleSend} className="p-4 border-t border-border bg-card flex items-center gap-3">
            <input
              type="text"
              placeholder={`Ask AI assistant in ${contextType} mode...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="submit"
              disabled={sendMessage.isPending || !inputMessage.trim()}
              className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition shadow-sm disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
