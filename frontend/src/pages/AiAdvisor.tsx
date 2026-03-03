import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { Bot, Send, Lightbulb, User } from 'lucide-react';

const STARTER_QUESTIONS = [
  'Can I deduct my home office?',
  'How do quarterly estimated taxes work?',
  'What business meals are tax deductible?',
  'How much should I set aside for taxes?',
  'What is the self-employment tax rate?',
  'Can I deduct my car for business use?',
];

export default function AiAdvisor() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: "Hi! I'm your AI Tax Advisor. I specialize in freelancer taxes — deductions, quarterly estimates, and tax-saving strategies. What would you like to know?\n\n*Note: I provide general guidance, not licensed tax advice.*" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/ai/suggestions').then(r => setSuggestions(r.data.suggestions || [])).catch(() => {});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (question: string) => {
    if (!question.trim() || loading) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text: question }]);
    setLoading(true);
    try {
      const { data } = await api.post('/ai/ask', { question });
      setMessages(m => [...m, { role: 'ai', text: data.answer }]);
    } catch {
      setMessages(m => [...m, { role: 'ai', text: 'Sorry, I had trouble answering that. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); send(input); };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">AI Tax Advisor</h1>
        <p className="text-sm text-gray-500 mt-0.5">Powered by Claude — ask anything about freelancer taxes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chat */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 flex flex-col" style={{ height: '70vh' }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-indigo-100' : 'bg-gray-200'}`}>
                  {msg.role === 'ai' ? <Bot className="w-4 h-4 text-indigo-600" /> : <User className="w-4 h-4 text-gray-500" />}
                </div>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-gray-50 text-gray-800 rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="bg-gray-50 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3">
            <div className="flex gap-2 flex-wrap mb-2">
              {STARTER_QUESTIONS.slice(0, 3).map(q => (
                <button key={q} onClick={() => send(q)}
                  className="text-xs px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full transition-colors truncate max-w-full">
                  {q}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask a tax question..."
                className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button type="submit" disabled={loading || !input.trim()}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Suggestions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-gray-800 text-sm">Deductions You Might Be Missing</h3>
            </div>
            {suggestions.length === 0 ? (
              <p className="text-xs text-gray-400">Add expenses to see personalized suggestions</p>
            ) : (
              <div className="space-y-3">
                {suggestions.map((s, i) => (
                  <div key={i} className="border border-amber-100 bg-amber-50 rounded-lg p-3 cursor-pointer hover:bg-amber-100 transition-colors"
                    onClick={() => send(s.suggestion.split(':')[0].replace('you might be missing ', ''))}>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{s.icon}</span>
                      <div>
                        <div className="text-xs font-medium text-gray-700">{s.suggestion.split(':')[0]}</div>
                        <div className="text-xs text-emerald-600 font-medium mt-0.5">~${s.estimatedValue?.toLocaleString()} potential</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-4">
            <h3 className="font-semibold text-indigo-800 text-sm mb-2">Quick Tax Facts</h3>
            <ul className="space-y-1.5 text-xs text-indigo-700">
              <li>• SE tax rate: <strong>15.3%</strong></li>
              <li>• Meals deductible: <strong>50%</strong></li>
              <li>• Mileage rate: <strong>$0.67/mile</strong></li>
              <li>• Standard deduction: <strong>$14,600</strong></li>
              <li>• Set aside: <strong>25-30%</strong> of income</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
