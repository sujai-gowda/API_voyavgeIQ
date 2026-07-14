import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, MessageSquare } from 'lucide-react';
import { travelApi } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'assistant', text: "Hello! I am your VoyageIQ AI assistant. Ask me anything about planning travel itineraries, comparing routes, or budget tips!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    if (!textToSend) setInput('');

    // Add user message
    const userMsg = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // call API
      const history = messages.map(m => ({
        sender: m.sender === 'assistant' ? 'assistant' : 'user',
        text: m.text
      }));
      const res = await travelApi.sendChatMessage(text, history);
      setMessages(prev => [...prev, { sender: 'assistant', text: res.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { sender: 'assistant', text: "Sorry, I ran into an error connecting to the AI brain. Please try again!" }]);
    }
    setLoading(false);
  };

  const chips = [
    "Tokyo 3-day itinerary",
    "Goa budget train tips",
    "Best time to visit Dubai",
    "Flight vs Train cost tips"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="mb-4 w-[360px] md:w-[400px] h-[500px] rounded-2xl bg-white border border-dark-700 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-brand-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-white-force" />
                <div>
                  <h3 className="font-sans text-sm font-bold text-white-force">VoyageIQ Copilot</h3>
                  <span className="text-[10px] text-accent-400 font-bold">Decision Assistant AI</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white-force/80 hover:text-white-force p-1 rounded-lg hover:bg-white/10"
              >
                <X className="h-4 w-4 text-white-force" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                    m.sender === 'user' 
                      ? 'bg-brand-600 text-white-force rounded-br-none' 
                      : 'bg-dark-950 text-dark-100 rounded-bl-none border border-dark-700'
                  }`}>
                    {/* Render basic markdown bold styling */}
                    <div className="whitespace-pre-line">
                      {m.text.split('\n').map((line, lIdx) => {
                        // Very basic markdown bold renderer for UI demo
                        let formattedLine = line;
                        const boldMatches = line.match(/\*\*(.*?)\*\*/g);
                        if (boldMatches) {
                          boldMatches.forEach(match => {
                            const cleanText = match.replace(/\*\*/g, '');
                            formattedLine = formattedLine.replace(match, `<strong>${cleanText}</strong>`);
                          });
                        }
                        // Handle bullet lists
                        if (formattedLine.startsWith('- ') || formattedLine.startsWith('* ')) {
                          return (
                            <div key={lIdx} className="pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-accent-400">
                              <span dangerouslySetInnerHTML={{ __html: formattedLine.substring(2) }} />
                            </div>
                          );
                        }
                        return <span key={lIdx} dangerouslySetInnerHTML={{ __html: formattedLine }} />;
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-dark-950 rounded-2xl rounded-bl-none border border-dark-700 px-3 py-2 text-xs text-dark-300 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-bounce"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Chips */}
            {messages.length === 1 && (
              <div className="px-4 py-2 border-t border-dark-600 bg-dark-950 flex flex-wrap gap-1.5">
                {chips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(chip)}
                    className="text-[10px] bg-white border border-dark-700 text-dark-400 hover:border-accent-400/30 hover:text-accent-400 px-2.5 py-1 rounded-full transition-all"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Input Footer */}
            <div className="p-3 border-t border-dark-700 bg-white flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about flights, budget packages..."
                className="flex-1 bg-white border border-dark-700 rounded-xl px-3 py-2 text-xs text-dark-100 focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400/30"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="bg-accent-400 hover:bg-accent-500 text-white-force p-2.5 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5 text-white-force" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 hover:bg-brand-700 text-white-force shadow-xl shadow-brand-600/10 border border-dark-700 animate-pulse-slow"
      >
        {isOpen ? <X className="h-6 w-6 text-white-force" /> : <Bot className="h-6 w-6 text-white-force" />}
      </motion.button>
    </div>
  );
}
