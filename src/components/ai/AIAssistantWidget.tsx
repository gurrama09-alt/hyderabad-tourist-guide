'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { AIMessage, queryAIAssistant } from '@/lib/ai/assistant';
import {
  Sparkles,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Compass,
  ArrowRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import Link from 'next/link';

export function AIAssistantWidget() {
  const { language, t, userCoords } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'init_msg',
      role: 'assistant',
      content:
        language === 'te'
          ? 'నమస్కారం! నేను మీ హైదరాబాద్ టూరిస్ట్ అసిస్టెంట్‌ని. మీరు ఏ ప్రదేశాన్ని సందర్శించాలనుకుంటున్నారు, మెట్రో లేదా బస్సులో ఎలా వెళ్ళాలి, మరియు ప్రసిద్ధ బిర్యానీ/ఇరానీ చాయ్ ఎక్కడ లభిస్తాయో నన్ను అడగండి.'
          : language === 'hi'
          ? 'नमस्ते! मैं आपका हैदराबाद टूरिस्ट गाइड AI हूँ। आपको चारमीनार, गोलकोंडा फोर्ट, मेट्रो/बस रूट्स, या प्रसिद्ध हैदराबादी बिरयानी के बारे में कुछ भी जानना हो तो मुझसे पूछें।'
          : 'Hello! I am your AI Hyderabad Tourist Assistant. Ask me about heritage places, metro/bus connections, authentic Dum Biryani & Irani chai spots, or customized day itineraries.',
      timestamp: new Date().toISOString(),
      suggestedActions: [
        { label: 'One-day Tour Plan', actionType: 'query', payload: 'Plan a one-day historical tour of Hyderabad' },
        { label: 'Reach Golconda Fort', actionType: 'query', payload: 'How can I reach Golconda Fort using public transport?' },
        { label: 'Best Biryani & Chai', actionType: 'query', payload: 'Find famous food places near Charminar' },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const text = (queryText || inputQuery).trim();
    if (!text || loading) return;

    const userMsg: AIMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await queryAIAssistant(text, language, userCoords || undefined);
      setMessages((prev) => [...prev, response]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered a temporary connection issue. Please try again!',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Voice speech recognition via Web Speech API
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome/Edge or type your question.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputQuery(transcript);
        handleSend(transcript);
      };

      recognition.start();
    } catch (e) {
      console.error('Speech recognition failed:', e);
      setIsListening(false);
    }
  };

  // Text-To-Speech audio readout
  const speakText = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-medium shadow-green-glow hover:scale-105 active:scale-95 transition-all group"
          aria-label="Open AI Tourist Assistant"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-300 ring-2 ring-white animate-ping" />
          </div>
          <span className="text-sm font-semibold tracking-wide">
            {t.askAI}
          </span>
        </button>
      )}

      {/* Chat Window Dialog */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col shadow-2xl border border-emerald-500/30 rounded-2xl glass-panel overflow-hidden ${
            isExpanded
              ? 'inset-2 sm:inset-6 max-w-4xl mx-auto'
              : 'bottom-20 lg:bottom-6 right-2 sm:right-6 w-[calc(100vw-1rem)] sm:w-[420px] h-[550px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg green-gradient flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-foreground flex items-center gap-1.5">
                  Hyderabad AI Assistant
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-sans border border-emerald-500/30">
                    Live RAG
                  </span>
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Official HMRL • TGSRTC • Monuments • Heritage
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
                title={isExpanded ? 'Restore window size' : 'Expand window'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (speakingMsgId) window.speechSynthesis?.cancel();
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none shadow-md'
                      : 'bg-card/90 border border-border/60 text-foreground rounded-tl-none'
                  }`}
                >
                  {msg.content}

                  {/* Audio Playback Button for AI answers */}
                  {msg.role === 'assistant' && (
                    <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
                      <button
                        onClick={() => speakText(msg.id, msg.content)}
                        className="flex items-center gap-1 hover:text-nizami-gold transition-colors font-medium"
                      >
                        {speakingMsgId === msg.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                            <span className="text-rose-400">Stop Voice</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Listen Audio Guide</span>
                          </>
                        )}
                      </button>
                      <span className="text-[10px] opacity-70">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Suggested Action Buttons */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[88%]">
                    {msg.suggestedActions.map((act, i) => {
                      if (act.actionType === 'query') {
                        return (
                          <button
                            key={i}
                            onClick={() => handleSend(act.payload)}
                            className="text-[11px] px-2.5 py-1 rounded-full bg-nizami/10 text-nizami-gold border border-nizami/30 hover:bg-nizami/20 transition-colors flex items-center gap-1"
                          >
                            <span>{act.label}</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        );
                      }
                      if (act.actionType === 'view_place') {
                        return (
                          <Link
                            key={i}
                            href={`/place/${act.payload}`}
                            onClick={() => setIsOpen(false)}
                            className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors flex items-center gap-1 font-medium"
                          >
                            <span>{act.label}</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        );
                      }
                      if (act.actionType === 'navigate') {
                        return (
                          <Link
                            key={i}
                            href={act.payload || '/'}
                            onClick={() => setIsOpen(false)}
                            className="text-[11px] px-2.5 py-1 rounded-full bg-hussain/10 text-hussain-600 dark:text-sky-400 border border-hussain/30 hover:bg-hussain/20 transition-colors flex items-center gap-1 font-medium"
                          >
                            <span>{act.label}</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-2xl bg-card/60 border border-border/40 w-max">
                <Compass className="w-4 h-4 animate-spin text-nizami-gold" />
                <span>Consulting Hyderabad knowledge base...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-border/40 bg-card/90 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={
                language === 'te'
                  ? 'ప్రశ్నను ఇక్కడ టైప్ చేయండి...'
                  : language === 'hi'
                  ? 'अपना सवाल यहाँ लिखें...'
                  : 'Ask about routes, places, timings, biryani...'
              }
              className="flex-1 bg-background/80 border border-border/60 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nizami-gold"
            />

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              title={isListening ? 'Stop listening' : 'Speak your question'}
              className={`p-2 rounded-xl border transition-colors ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-500 animate-pulse'
                  : 'bg-card border-border/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white transition-opacity shadow-sm"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
