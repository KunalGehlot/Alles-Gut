import React, { useState } from 'react';

export default function AllesGutFinal() {
  const [darkMode, setDarkMode] = useState(false);

  const bg = darkMode ? '#0a0a0a' : '#fafafa';
  const fg = darkMode ? '#ffffff' : '#111111';
  const muted = darkMode ? '#666' : '#999';
  const cardBg = darkMode ? '#111' : '#fff';
  const border = darkMode ? '#222' : '#eee';
  const accent = '#22c55e';

  const fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: bg,
      padding: '40px 20px',
      fontFamily,
      transition: 'background-color 0.3s'
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: 50
        }}>
          <div>
            <p style={{ color: muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, margin: 0 }}>
              Final Logo
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 400, color: fg, margin: '8px 0 0' }}>
              Alles Gut — Brand Assets
            </h1>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              padding: '8px 16px',
              border: `1px solid ${border}`,
              borderRadius: 6,
              background: 'transparent',
              color: fg,
              cursor: 'pointer',
              fontSize: 12,
              fontFamily
            }}
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        {/* Primary Logo */}
        <section style={{ marginBottom: 60 }}>
          <p style={{ color: muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>
            Primary Logo
          </p>
          <div style={{
            padding: 60,
            backgroundColor: cardBg,
            borderRadius: 16,
            border: `1px solid ${border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20
          }}>
            <svg viewBox="0 0 50 80" width={44} height={70}>
              <path 
                d="M9 24 C9 8 41 8 41 24 C41 36 25 36 25 50" 
                stroke={fg} 
                strokeWidth="5" 
                fill="none" 
                strokeLinecap="round"
              />
              <path 
                d="M12 64 L22 76 L42 52" 
                stroke={accent} 
                strokeWidth="5" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <span style={{ 
              fontSize: 38, 
              fontWeight: 400, 
              color: fg, 
              letterSpacing: -0.5,
              fontFamily
            }}>
              Alles Gut
            </span>
          </div>
        </section>

        {/* Logo Variations */}
        <section style={{ marginBottom: 60 }}>
          <p style={{ color: muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>
            Variations
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            
            {/* Stacked */}
            <div style={{
              padding: 40,
              backgroundColor: cardBg,
              borderRadius: 12,
              border: `1px solid ${border}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12
            }}>
              <svg viewBox="0 0 50 80" width={40} height={64}>
                <path d="M9 24 C9 8 41 8 41 24 C41 36 25 36 25 50" stroke={fg} strokeWidth="5" fill="none" strokeLinecap="round"/>
                <path d="M12 64 L22 76 L42 52" stroke={accent} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 18, fontWeight: 500, color: fg, letterSpacing: 1, textTransform: 'uppercase', fontFamily }}>
                Alles Gut
              </span>
              <p style={{ color: muted, fontSize: 11, margin: 0 }}>Stacked</p>
            </div>

            {/* Mark Only */}
            <div style={{
              padding: 40,
              backgroundColor: cardBg,
              borderRadius: 12,
              border: `1px solid ${border}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12
            }}>
              <svg viewBox="0 0 50 80" width={50} height={80}>
                <path d="M9 24 C9 8 41 8 41 24 C41 36 25 36 25 50" stroke={fg} strokeWidth="5" fill="none" strokeLinecap="round"/>
                <path d="M12 64 L22 76 L42 52" stroke={accent} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p style={{ color: muted, fontSize: 11, margin: 0 }}>Mark Only</p>
            </div>

            {/* Compact Horizontal */}
            <div style={{
              padding: 40,
              backgroundColor: cardBg,
              borderRadius: 12,
              border: `1px solid ${border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12
            }}>
              <svg viewBox="0 0 50 80" width={24} height={38}>
                <path d="M9 24 C9 8 41 8 41 24 C41 36 25 36 25 50" stroke={fg} strokeWidth="5" fill="none" strokeLinecap="round"/>
                <path d="M12 64 L22 76 L42 52" stroke={accent} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 20, fontWeight: 400, color: fg, fontFamily }}>Alles Gut</span>
              <p style={{ color: muted, fontSize: 11, margin: 0, position: 'absolute', bottom: 16 }}>Compact</p>
            </div>

            {/* Monochrome */}
            <div style={{
              padding: 40,
              backgroundColor: cardBg,
              borderRadius: 12,
              border: `1px solid ${border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14
            }}>
              <svg viewBox="0 0 50 80" width={32} height={51}>
                <path d="M9 24 C9 8 41 8 41 24 C41 36 25 36 25 50" stroke={fg} strokeWidth="5" fill="none" strokeLinecap="round"/>
                <path d="M12 64 L22 76 L42 52" stroke={fg} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 24, fontWeight: 400, color: fg, fontFamily }}>Alles Gut</span>
              <p style={{ color: muted, fontSize: 11, margin: 0, position: 'absolute', bottom: 16 }}>Monochrome</p>
            </div>
          </div>
        </section>

        {/* App Icons */}
        <section style={{ marginBottom: 60 }}>
          <p style={{ color: muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>
            App Icons
          </p>
          <div style={{ 
            display: 'flex', 
            gap: 20, 
            flexWrap: 'wrap',
            padding: 40,
            backgroundColor: cardBg,
            borderRadius: 12,
            border: `1px solid ${border}`
          }}>
            {/* Light */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: 18,
                background: '#fff',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg viewBox="0 0 50 80" width={28} height={45}>
                  <path d="M9 24 C9 8 41 8 41 24 C41 36 25 36 25 50" stroke="#111" strokeWidth="5" fill="none" strokeLinecap="round"/>
                  <path d="M12 64 L22 76 L42 52" stroke="#22c55e" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p style={{ color: muted, fontSize: 10, marginTop: 8 }}>Light</p>
            </div>

            {/* Dark */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: 18,
                background: '#111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg viewBox="0 0 50 80" width={28} height={45}>
                  <path d="M9 24 C9 8 41 8 41 24 C41 36 25 36 25 50" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round"/>
                  <path d="M12 64 L22 76 L42 52" stroke="#22c55e" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p style={{ color: muted, fontSize: 10, marginTop: 8 }}>Dark</p>
            </div>

            {/* Green */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: 18,
                background: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg viewBox="0 0 50 80" width={28} height={45}>
                  <path d="M9 24 C9 8 41 8 41 24 C41 36 25 36 25 50" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round"/>
                  <path d="M12 64 L22 76 L42 52" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p style={{ color: muted, fontSize: 10, marginTop: 8 }}>Branded</p>
            </div>

            {/* Gradient */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: 18,
                background: 'linear-gradient(145deg, #22c55e 0%, #16a34a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg viewBox="0 0 50 80" width={28} height={45}>
                  <path d="M9 24 C9 8 41 8 41 24 C41 36 25 36 25 50" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round"/>
                  <path d="M12 64 L22 76 L42 52" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p style={{ color: muted, fontSize: 10, marginTop: 8 }}>Gradient</p>
            </div>
          </div>
        </section>

        {/* Size Scale */}
        <section style={{ marginBottom: 60 }}>
          <p style={{ color: muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>
            Size Scale
          </p>
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: 24, 
            padding: 40,
            backgroundColor: cardBg,
            borderRadius: 12,
            border: `1px solid ${border}`
          }}>
            {[64, 48, 32, 24, 16].map(size => (
              <div key={size} style={{ textAlign: 'center' }}>
                <div style={{
                  width: size,
                  height: size,
                  borderRadius: size * 0.22,
                  background: accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg viewBox="0 0 50 80" width={size * 0.5} height={size * 0.8}>
                    <path d="M9 24 C9 8 41 8 41 24 C41 36 25 36 25 50" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round"/>
                    <path d="M12 64 L22 76 L42 52" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p style={{ color: muted, fontSize: 10, marginTop: 8 }}>{size}px</p>
              </div>
            ))}
          </div>
        </section>

        {/* Color Specs */}
        <section style={{ marginBottom: 40 }}>
          <p style={{ color: muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>
            Brand Colors
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{
              flex: 1,
              padding: 24,
              backgroundColor: '#22c55e',
              borderRadius: 12,
              color: '#fff'
            }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Primary Green</p>
              <p style={{ margin: '8px 0 0', fontSize: 12, opacity: 0.9 }}>#22c55e</p>
            </div>
            <div style={{
              flex: 1,
              padding: 24,
              backgroundColor: '#111',
              borderRadius: 12,
              color: '#fff'
            }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Dark</p>
              <p style={{ margin: '8px 0 0', fontSize: 12, opacity: 0.9 }}>#111111</p>
            </div>
            <div style={{
              flex: 1,
              padding: 24,
              backgroundColor: '#fff',
              borderRadius: 12,
              border: '1px solid #eee',
              color: '#111'
            }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Light</p>
              <p style={{ margin: '8px 0 0', fontSize: 12, opacity: 0.6 }}>#ffffff</p>
            </div>
          </div>
        </section>

        {/* Done */}
        <div style={{
          padding: 24,
          borderRadius: 12,
          backgroundColor: darkMode ? '#0d1f12' : '#f0fdf4',
          border: `1px solid ${darkMode ? '#166534' : '#bbf7d0'}`
        }}>
          <p style={{ color: darkMode ? '#86efac' : '#166534', margin: 0, fontSize: 14 }}>
            ✓ Production-ready SVG files included below
          </p>
        </div>
      </div>
    </div>
  );
}
