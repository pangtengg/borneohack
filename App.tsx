// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { useSession } from '@/lib/auth/useSession';
import { useLocation } from './hooks/useLocation';
import { LanguageSelector } from './components/LanguageSelector';
import { MessageBubble } from './components/MessageBubble';
import { VoiceButton } from './components/VoiceButton';
import { EmergencyPhraseBank } from './components/EmergencyPhraseBank';
import type { EmergencyPhrase, SupportedLanguageCode } from './types';
import { formatTimestamp } from './utils/helpers';

type Tab = 'chat' | 'phrases';

export default function App() {
  const {
    session, statusText,
    updateSession,
    startVoice, stopVoiceAndProcess,
    broadcastEmergencyPhrase,
    swapLanguages, submitText,
    speechRec,
  } = useSession();

  const location = useLocation();
  const chatRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [textInput, setTextInput] = useState('');
  const [activeSide, setActiveSide] = useState<'survivor' | 'responder'>('survivor');

  // Auto-set language from GPS
  useEffect(() => {
    if (location.region) {
      updateSession({
        survivorLang: location.region.dominantLang,
        locationDetected: location.region,
      });
    }
  }, [location.region]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [session.messages]);

  const isProcessing = session.mode === 'processing' || session.mode === 'speaking';
  const isListening = session.mode === 'listening';

  const handlePhraseSelect = async (phrase: EmergencyPhrase) => {
    await broadcastEmergencyPhrase(phrase.en);
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    await submitText(textInput.trim(), activeSide);
    setTextInput('');
  };

  const modeGlow = {
    standby: 'transparent',
    listening: 'rgba(255,50,50,0.08)',
    processing: 'rgba(255,170,0,0.06)',
    speaking: 'rgba(0,255,120,0.06)',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `#080b12`,
      fontFamily: "'Courier New', monospace",
      color: '#d0d8e8',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ── Top Bar ── */}
      <header style={{
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,50,50,0.2)',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: session.mode === 'standby' ? '#44ff88' :
              session.mode === 'listening' ? '#ff4444' : '#ffaa00',
            boxShadow: `0 0 8px ${session.mode === 'standby' ? '#44ff88' :
              session.mode === 'listening' ? '#ff4444' : '#ffaa00'}`,
          }} />
          <span style={{
            fontSize: 11, letterSpacing: 4, color: '#ff4444',
            fontWeight: 'bold',
          }}>
            DISASTER VOICE BRIDGE
          </span>
        </div>

        <span style={{
          fontSize: 9, letterSpacing: 2, color: '#444',
          padding: '2px 8px',
          border: '1px solid #222',
          borderRadius: 3,
        }}>
          ASEAN EMERGENCY SYSTEM
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {location.region && (
            <span style={{ fontSize: 10, color: '#556', letterSpacing: 1 }}>
              {location.region.flag} {location.region.country} detected
            </span>
          )}
          <span style={{
            fontSize: 9, letterSpacing: 3,
            color: session.mode === 'listening' ? '#ff4444' :
              session.mode === 'processing' ? '#ffaa00' :
                session.mode === 'speaking' ? '#44ff88' : '#445',
            animation: session.mode !== 'standby' ? 'pulse 1.5s infinite' : 'none',
          }}>
            {session.mode.toUpperCase()}
          </span>
          <span style={{ fontSize: 9, color: '#444', letterSpacing: 1 }}>
            {session.sessionId}
          </span>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* ── Left: Language Config + Voice Controls ── */}
        <aside style={{
          width: 280,
          borderRight: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', flexDirection: 'column',
          background: 'rgba(255,255,255,0.015)',
          flexShrink: 0,
          overflowY: 'auto',
        }}>
          <div style={{ padding: 16 }}>
            {/* Status bar */}
            <div style={{
              background: modeGlow[session.mode],
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 6,
              padding: '8px 12px',
              marginBottom: 16,
              fontSize: 10,
              color: '#667',
              letterSpacing: 1,
              transition: 'background 0.5s',
            }}>
              <div style={{ color: '#556', marginBottom: 2, letterSpacing: 2, fontSize: 8 }}>STATUS</div>
              {statusText}
              {speechRec.error && (
                <div style={{ color: '#ff5544', marginTop: 4 }}>{speechRec.error}</div>
              )}
            </div>

            {/* Language selectors */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
              padding: 14,
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 9, letterSpacing: 3, color: '#446', marginBottom: 14 }}>
                LANGUAGE BRIDGE
              </div>

              <LanguageSelector
                value={session.survivorLang}
                onChange={(c: SupportedLanguageCode) => updateSession({ survivorLang: c })}
                label="🆘 Survivor Language"
                includeAuto
                accentColor="#ff5544"
              />

              <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
                <button
                  onClick={swapLanguages}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 6,
                    color: '#668',
                    padding: '4px 16px',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontFamily: 'monospace',
                    letterSpacing: 2,
                  }}
                  title="Swap languages"
                >
                  ⇅
                </button>
              </div>

              <LanguageSelector
                value={session.responderLang}
                onChange={(c: SupportedLanguageCode) => updateSession({ responderLang: c })}
                label="📡 Responder Language"
                accentColor="#4488ff"
              />
            </div>

            {/* Voice Controls */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 9, letterSpacing: 3, color: '#446', marginBottom: 12 }}>
                VOICE INPUT
              </div>

              {/* Side selector */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 4, marginBottom: 14,
              }}>
                {(['survivor', 'responder'] as const).map(side => (
                  <button
                    key={side}
                    onClick={() => setActiveSide(side)}
                    style={{
                      padding: '6px 4px',
                      background: activeSide === side
                        ? (side === 'survivor' ? 'rgba(255,85,68,0.15)' : 'rgba(68,136,255,0.15)')
                        : 'transparent',
                      border: `1px solid ${activeSide === side
                        ? (side === 'survivor' ? 'rgba(255,85,68,0.4)' : 'rgba(68,136,255,0.4)')
                        : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 4,
                      color: activeSide === side ? '#e0e0e0' : '#555',
                      cursor: 'pointer',
                      fontSize: 9,
                      letterSpacing: 1,
                      fontFamily: 'monospace',
                      textTransform: 'uppercase',
                      transition: 'all 0.15s',
                    }}
                  >
                    {side === 'survivor' ? '🆘 Survivor' : '📡 Responder'}
                  </button>
                ))}
              </div>

              <VoiceButton
                mode={session.mode}
                role={activeSide}
                onStart={() => startVoice(activeSide)}
                onStop={() => stopVoiceAndProcess(activeSide)}
                disabled={isProcessing || (isListening)}
              />

              {speechRec.transcript && (
                <div style={{
                  marginTop: 12,
                  padding: '8px 10px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 6,
                  fontSize: 11, color: '#888', lineHeight: 1.4,
                  fontStyle: 'italic',
                }}>
                  "{speechRec.transcript}"
                </div>
              )}
            </div>

            {/* Text Input */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 8,
              padding: 14,
            }}>
              <div style={{ fontSize: 9, letterSpacing: 3, color: '#446', marginBottom: 10 }}>
                TEXT INPUT (FALLBACK)
              </div>
              <form onSubmit={handleTextSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder="Type message..."
                  rows={3}
                  style={{
                    background: '#0a0e17',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 6,
                    color: '#e0e0e0',
                    padding: '8px 10px',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    resize: 'vertical',
                    outline: 'none',
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleTextSubmit(e as any);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={isProcessing || !textInput.trim()}
                  style={{
                    background: isProcessing ? '#1a1a2a' : 'rgba(255,50,50,0.1)',
                    border: `1px solid ${isProcessing ? '#222' : 'rgba(255,50,50,0.3)'}`,
                    borderRadius: 6,
                    color: isProcessing ? '#444' : '#ff6655',
                    padding: '8px',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    fontSize: 10,
                    letterSpacing: 2,
                    fontFamily: 'monospace',
                  }}
                >
                  TRANSLATE + BROADCAST →
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* ── Main: Chat + Phrase Bank ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Tab bar */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            flexShrink: 0,
            background: 'rgba(0,0,0,0.2)',
          }}>
            {(['chat', 'phrases'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 20px',
                  background: activeTab === tab ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === tab ? '#ff4444' : 'transparent'}`,
                  color: activeTab === tab ? '#e0e0e0' : '#556',
                  cursor: 'pointer',
                  fontSize: 10,
                  letterSpacing: 3,
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  transition: 'all 0.15s',
                }}
              >
                {tab === 'chat' ? '💬 Live Communication' : '⚡ Emergency Phrases'}
                {tab === 'chat' && session.messages.length > 0 && (
                  <span style={{
                    marginLeft: 8,
                    background: 'rgba(255,50,50,0.2)',
                    border: '1px solid rgba(255,50,50,0.3)',
                    borderRadius: 3,
                    padding: '1px 5px',
                    fontSize: 9,
                    color: '#ff6655',
                  }}>
                    {session.messages.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            {activeTab === 'chat' && (
              <div
                ref={chatRef}
                style={{
                  height: '100%',
                  overflowY: 'auto',
                  padding: 20,
                  background: modeGlow[session.mode],
                  transition: 'background 0.5s',
                }}
              >
                {session.messages.length === 0 ? (
                  <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    height: '100%', gap: 12,
                    color: '#2a3040',
                  }}>
                    <div style={{ fontSize: 48 }}>🌏</div>
                    <div style={{ fontSize: 12, letterSpacing: 3, fontFamily: 'monospace' }}>
                      AWAITING COMMUNICATION
                    </div>
                    <div style={{ fontSize: 10, color: '#1e2535', letterSpacing: 2 }}>
                      Hold the mic button or use Emergency Phrases
                    </div>
                  </div>
                ) : (
                  session.messages.map(msg => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isActive={msg.id === session.activeMessageId}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'phrases' && (
              <div style={{ height: '100%', overflowY: 'auto', padding: 20 }}>
                <EmergencyPhraseBank
                  onSelect={handlePhraseSelect}
                  disabled={isProcessing || isListening}
                />
              </div>
            )}
          </div>
        </main>

        {/* ── Right: System Log ── */}
        <aside style={{
          width: 220,
          borderLeft: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', flexDirection: 'column',
          background: 'rgba(0,0,0,0.2)',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            fontSize: 9, letterSpacing: 3, color: '#334',
            flexShrink: 0,
          }}>
            SYSTEM LOG
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {[...session.messages].reverse().map(msg => (
              <div key={msg.id} style={{
                padding: '6px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
              }}>
                <div style={{ fontSize: 8, color: '#334', letterSpacing: 1, marginBottom: 2 }}>
                  {formatTimestamp(msg.timestamp)}
                </div>
                <div style={{ fontSize: 9, color: '#556', lineHeight: 1.4 }}>
                  <span style={{
                    color: msg.role === 'survivor' ? '#ff5544' : '#4488ff',
                  }}>
                    [{msg.role.toUpperCase()}]
                  </span>{' '}
                  {msg.translation?.original?.slice(0, 50) ?? '...'}
                  {(msg.translation?.original?.length ?? 0) > 50 ? '…' : ''}
                </div>
                {msg.status === 'done' && (
                  <div style={{ fontSize: 8, color: '#44aa66', marginTop: 2 }}>
                    ✓ broadcast complete
                  </div>
                )}
                {msg.translation?.panicDetected && (
                  <div style={{ fontSize: 8, color: '#ff8800', marginTop: 2 }}>
                    ⚠ panic detected · tone normalized
                  </div>
                )}
              </div>
            ))}
            {session.messages.length === 0 && (
              <div style={{ padding: '20px 14px', fontSize: 9, color: '#2a3040', textAlign: 'center' }}>
                No activity yet
              </div>
            )}
          </div>

          {/* Session info */}
          <div style={{
            padding: '10px 14px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            flexShrink: 0,
          }}>
            <div style={{ fontSize: 8, color: '#334', letterSpacing: 1, marginBottom: 6 }}>
              SESSION INFO
            </div>
            <div style={{ fontSize: 9, color: '#445', lineHeight: 1.8 }}>
              <div>Messages: {session.messages.length}</div>
              <div>Panics: {session.messages.filter(m => m.translation?.panicDetected).length}</div>
              <div>Critical: {session.messages.filter(m => m.emergencyLevel === 'critical').length}</div>
              {location.coords && (
                <div style={{ marginTop: 4, fontSize: 8 }}>
                  {location.coords.lat.toFixed(4)}, {location.coords.lng.toFixed(4)}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1a2030; border-radius: 2px; }
        select option { background: #0a0e17; }
        textarea::placeholder { color: #2a3040; }
      `}</style>
    </div>
  );
}
