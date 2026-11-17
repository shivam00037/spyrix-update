import { useEffect, useRef, useState } from 'react';
import {
  Bot, Mic, MicOff, Send, Sparkles, Volume2, VolumeX,
  Globe, MessageSquare, ShieldCheck, StopCircle, Loader2,
} from 'lucide-react';
import { apiRequest } from '../../api';
import './AIAssistantPage.css';

const starterPrompts = [
  { title: 'Understand my business', detail: 'Explain key business numbers and terms', icon: Globe, prompt: 'Explain the main business metrics I should track in a small business.' },
  { title: 'Create an invoice', detail: 'Guide me through the process', icon: MessageSquare, prompt: 'Show me step by step how to create and send a professional invoice.' },
  { title: 'Manage payments', detail: 'Learn how to follow up on dues', icon: ShieldCheck, prompt: 'How should I track pending payments and follow up with customers professionally?' },
  { title: 'Learn something new', detail: 'Ask any general question', icon: Sparkles, prompt: 'Teach me a useful business concept in simple language.' },
];

const firstMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Hello! I’m SPYRIX AI. Ask me a question, request an explanation, or use the microphone to speak. I can help with business workflows and general topics.',
};

function createSpeechRecognition(language = 'en-IN') {
  if (typeof window === 'undefined') return null;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  const recognition = new SpeechRecognition();
  recognition.lang = language;
  recognition.interimResults = true;
  recognition.continuous = false;
  return recognition;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([firstMessage]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [chatError, setChatError] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speakingId, setSpeakingId] = useState('');
  const [voiceCapabilities, setVoiceCapabilities] = useState({ listen: false, speak: false });
  const [voiceLanguage, setVoiceLanguage] = useState('en-IN');
  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setVoiceCapabilities({ listen: Boolean(window.SpeechRecognition || window.webkitSpeechRecognition), speak: 'speechSynthesis' in window });
    return () => {
      recognitionRef.current?.stop?.();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, busy]);

  const speak = (text, messageId) => {
    if (!('speechSynthesis' in window)) {
      setVoiceError('Spoken replies are not supported in this browser. Try a recent version of Chrome or Edge.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = /[\u0900-\u097F]/.test(text) ? 'hi-IN' : voiceLanguage;
    const availableVoices = window.speechSynthesis.getVoices();
    const preferredVoice = availableVoices.find(voice => voice.lang?.toLowerCase() === utterance.lang.toLowerCase()) || availableVoices.find(voice => voice.lang?.toLowerCase().startsWith(utterance.lang.slice(0, 2).toLowerCase()));
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeakingId(messageId);
    utterance.onend = () => setSpeakingId('');
    utterance.onerror = () => setSpeakingId('');
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeakingId('');
  };

  const startListening = () => {
    setVoiceError('');
    const recognition = createSpeechRecognition(voiceLanguage);
    if (!recognition) {
      setVoiceError('Voice input is not supported in this browser. Use Chrome or Edge, or type your question.');
      return;
    }
    recognitionRef.current?.stop?.();
    recognitionRef.current = recognition;
    recognition.onstart = () => setListening(true);
    recognition.onresult = event => {
      const transcript = Array.from(event.results).map(result => result[0]?.transcript || '').join(' ').trim();
      setDraft(transcript);
    };
    recognition.onerror = event => {
      setListening(false);
      setVoiceError(event.error === 'not-allowed' ? 'Microphone permission was blocked. Allow microphone access in your browser settings.' : 'I could not hear that clearly. Please try again.');
    };
    recognition.onend = () => setListening(false);
    try { recognition.start(); } catch { setListening(false); setVoiceError('The microphone is already active. Please try again.'); }
  };

  const sendMessage = async (event) => {
    event?.preventDefault?.();
    const text = draft.trim();
    if (!text || busy) return;
    const userMessage = { id: `user-${Date.now()}`, role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft('');
    setChatError('');
    setVoiceError('');
    setBusy(true);
    try {
      const result = await apiRequest('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: nextMessages.slice(-14).map(({ role, content }) => ({ role, content })) }),
      });
      const assistantMessage = { id: `assistant-${Date.now()}`, role: 'assistant', content: result.reply || 'I could not create a response. Please try again.' };
      setMessages(current => [...current, assistantMessage]);
      if (autoSpeak) speak(assistantMessage.content, assistantMessage.id);
    } catch (error) {
      setChatError(error.message || 'I could not reach the AI service. Please try again.');
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const choosePrompt = prompt => { setDraft(prompt); inputRef.current?.focus(); };

  return (
    <div className="module-page ai-assistant-page">
      <div className="module-breadcrumb"><span>Workspace</span><span className="ai-breadcrumb-slash">/</span><strong>AI Assistant</strong></div>
      <header className="module-page-head ai-page-banner">
        <div className="module-title-wrap">
          <span className="module-title-icon"><Bot size={25} /></span>
          <div><div className="module-eyebrow">YOUR SMART BUSINESS COMPANION</div><h1>SPYRIX AI Assistant</h1><p>Ask questions, get clear explanations, and talk naturally with your AI assistant.</p></div>
        </div>
        <div className="ai-banner-status"><span className="ai-status-dot" /> VOICE + CHAT READY</div>
        <div className="ai-banner-orbit ai-banner-orbit-one" /><div className="ai-banner-orbit ai-banner-orbit-two" />
      </header>

      <div className="ai-workspace-grid">
        <aside className="ai-side-panel">
          <div className="ai-side-heading"><span>QUICK START</span><Sparkles size={17} /></div>
          <p className="ai-side-intro">Choose a starting point or ask anything in your own words.</p>
          <div className="ai-prompt-list">
            {starterPrompts.map(item => {
              const Icon = item.icon;
              return <button className="ai-prompt-card" key={item.title} onClick={() => choosePrompt(item.prompt)}><span className="ai-prompt-icon"><Icon size={18} /></span><span><strong>{item.title}</strong><small>{item.detail}</small></span><span className="ai-prompt-arrow">›</span></button>;
            })}
          </div>
          <div className="ai-voice-help"><div><Mic size={18} /><strong>Talk naturally</strong></div><p>Tap the microphone, speak your question, then send the captured text. Replies can be read aloud.</p><span>{voiceCapabilities.listen && voiceCapabilities.speak ? 'Microphone and spoken replies are available' : voiceCapabilities.listen ? 'Microphone available · spoken reply support limited' : voiceCapabilities.speak ? 'Spoken replies available · microphone input not supported' : 'Voice support depends on your browser'}</span></div>
        </aside>

        <section className="ai-chat-panel" aria-label="AI chat conversation">
          <header className="ai-chat-header"><div className="ai-chat-identity"><span className="ai-bot-avatar"><Bot size={21} /></span><span><strong>SPYRIX AI</strong><small><i /> General assistant</small></span></div><div className="ai-chat-header-actions"><button type="button" className={`ai-speak-toggle ${autoSpeak ? 'enabled' : ''}`} onClick={() => setAutoSpeak(value => !value)} title={autoSpeak ? 'Turn off spoken replies' : 'Turn on spoken replies'}>{autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}<span>{autoSpeak ? 'Voice on' : 'Voice off'}</span></button></div></header>

          <div className="ai-messages" aria-live="polite">
            {messages.map(message => <article className={`ai-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`} key={message.id}>
              {message.role === 'assistant' && <span className="ai-message-avatar"><Bot size={17} /></span>}
              <div className="ai-message-body"><div className="ai-message-bubble">{message.content}</div>{message.role === 'assistant' && message.id !== 'welcome' && <div className="ai-message-actions"><button type="button" onClick={() => speak(message.content, message.id)}><Volume2 size={13} /> Read aloud</button></div>}</div>
            </article>)}
            {busy && <article className="ai-message assistant-message"><span className="ai-message-avatar"><Bot size={17}/></span><div className="ai-message-bubble ai-thinking"><Loader2 size={15}/> SPYRIX AI is thinking…</div></article>}
            <div ref={bottomRef} />
          </div>

          {chatError && <div className="ai-chat-error" role="alert">{chatError}</div>}
          {voiceError && <div className="ai-voice-error" role="status">{voiceError}</div>}

          <form className="ai-composer" onSubmit={sendMessage}>
            <textarea ref={inputRef} rows={1} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(event); } }} placeholder={listening ? 'Listening… speak now' : 'Ask SPYRIX AI anything…'} aria-label="Your message" />
            <div className="ai-composer-actions">
              <div className="ai-composer-left">
                <label className="ai-language-picker"><span>Voice</span><select value={voiceLanguage} onChange={event => setVoiceLanguage(event.target.value)} aria-label="Voice input and reply language"><option value="en-IN">English</option><option value="hi-IN">Hindi</option><option value="en-US">English (US)</option></select></label>
                <button type="button" className={`ai-tool-button ${listening ? 'listening' : ''}`} onClick={listening ? () => recognitionRef.current?.stop?.() : startListening} title={listening ? 'Stop listening' : 'Speak your question'}>{listening ? <MicOff size={17}/> : <Mic size={17}/>}<span>{listening ? 'Stop' : 'Speak'}</span></button>
                {speakingId && <button type="button" className="ai-tool-button" onClick={stopSpeaking}><StopCircle size={16}/><span>Stop voice</span></button>}
              </div>
              <button type="submit" className="ai-send-button" disabled={!draft.trim() || busy}><span>Send message</span><Send size={16}/></button>
            </div>
          </form>
          <p className="ai-privacy-note">AI can make mistakes. Review important financial, legal or tax information before acting.</p>
        </section>
      </div>
    </div>
  );
}
