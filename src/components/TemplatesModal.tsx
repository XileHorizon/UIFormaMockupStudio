import { useEditor } from '../store'
import { TEMPLATES } from '../types'

const TEMPLATE_PREVIEWS: Record<string, React.ReactNode> = {
  'single-phone': (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: 36, height: 72, background: '#1c1c1e', borderRadius: 8, boxShadow: '4px 6px 18px rgba(0,0,0,0.6)', transform: 'perspective(200px) rotateX(-8deg) rotateY(20deg)', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 4, background: '#0a0818', borderRadius: 5 }} />
      </div>
    </div>
  ),
  'phone-laptop': (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 6 }}>
      <div style={{ width: 22, height: 44, background: '#1c1c1e', borderRadius: 5, boxShadow: '3px 4px 12px rgba(0,0,0,0.6)', transform: 'perspective(200px) rotateX(-5deg) rotateY(20deg)', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 3, background: '#0a0818', borderRadius: 3 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', transform: 'perspective(200px) rotateX(-6deg) rotateY(18deg)' }}>
        <div style={{ width: 60, height: 38, background: '#1c1c1e', borderRadius: '5px 5px 2px 2px', padding: 4 }}>
          <div style={{ background: '#0a0818', width: '100%', height: '100%', borderRadius: 3 }} />
        </div>
        <div style={{ width: 60, height: 12, background: '#2a2a2e', borderRadius: '0 0 4px 4px' }} />
      </div>
    </div>
  ),
  'three-phone-fan': (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 4 }}>
      {[-20, 0, 20].map((rot, i) => (
        <div key={i} style={{ width: 22, height: 44, background: '#1c1c1e', borderRadius: 5, boxShadow: '3px 4px 12px rgba(0,0,0,0.5)', transform: `perspective(200px) rotateY(${rot}deg) rotateZ(${rot * 0.3}deg) translateY(${i === 1 ? -4 : 0}px)`, position: 'relative', zIndex: i === 1 ? 2 : 1 }}>
          <div style={{ position: 'absolute', inset: 3, background: '#0a0818', borderRadius: 3 }} />
        </div>
      ))}
    </div>
  ),
  'tablet-dashboard': (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: 72, height: 52, background: '#1c1c1e', borderRadius: 6, boxShadow: '4px 6px 16px rgba(0,0,0,0.6)', transform: 'perspective(300px) rotateX(-18deg) rotateY(24deg)', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 5, background: '#0a0818', borderRadius: 4 }} />
      </div>
    </div>
  ),
  'browser-hero': (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ transform: 'perspective(300px) rotateX(-10deg) rotateY(14deg)' }}>
        <div style={{ width: 72, background: '#1e1e22', borderRadius: '5px 5px 0 0', padding: '5px 6px 3px' }}>
          <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
            {['#ff5f57','#ffbd2e','#28c840'].map((c,i) => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: c }} />)}
          </div>
          <div style={{ height: 5, background: '#2a2a2e', borderRadius: 2 }} />
        </div>
        <div style={{ width: 72, height: 40, background: '#0a0a14', borderRadius: '0 0 3px 3px' }} />
      </div>
    </div>
  ),
  'dark-product-hero': (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: 36, height: 70, background: '#1c1c1e', borderRadius: 8, boxShadow: '6px 10px 30px rgba(0,0,0,0.8)', transform: 'perspective(200px) rotateX(14deg) rotateY(22deg)', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 4, background: '#060612', borderRadius: 5 }} />
      </div>
    </div>
  ),
  'app-store': (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10 }}>
      {['-18', '18'].map((rot, i) => (
        <div key={i} style={{ width: 24, height: 48, background: i === 0 ? '#e8e8e8' : '#f5f5f7', borderRadius: 6, boxShadow: '2px 4px 12px rgba(0,0,0,0.2)', transform: `perspective(200px) rotateY(${rot}deg)`, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 3, background: '#1a1a2e', borderRadius: 4 }} />
        </div>
      ))}
    </div>
  ),
  'responsive-showcase': (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: '100%', gap: 5, paddingBottom: 4 }}>
      <div style={{ width: 14, height: 28, background: '#1c1c1e', borderRadius: 3, boxShadow: '2px 4px 10px rgba(0,0,0,0.5)', transform: 'perspective(200px) rotateX(-6deg) rotateY(22deg)' }}>
        <div style={{ inset: 2, position: 'absolute', background: '#0a0818', borderRadius: 2 }} />
      </div>
      <div style={{ width: 38, height: 28, background: '#1c1c1e', borderRadius: 4, boxShadow: '2px 4px 10px rgba(0,0,0,0.5)', transform: 'perspective(200px) rotateX(-6deg) rotateY(14deg)', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 3, background: '#0a0818', borderRadius: 2 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', transform: 'perspective(200px) rotateX(-5deg) rotateY(10deg)' }}>
        <div style={{ width: 56, height: 36, background: '#2a2a2e', borderRadius: '4px 4px 1px 1px', padding: 3 }}>
          <div style={{ background: '#0a0818', width: '100%', height: '100%', borderRadius: 2 }} />
        </div>
        <div style={{ width: 56, height: 5, background: '#222', borderRadius: '0 0 3px 3px' }} />
        <div style={{ width: 30, height: 3, background: '#333', borderRadius: 2, alignSelf: 'center', marginTop: 2 }} />
      </div>
    </div>
  ),
}

const TEMPLATE_BG_COLORS: Record<string, string> = {
  'single-phone': 'linear-gradient(145deg, #0f0c29, #302b63)',
  'phone-laptop': '#0d1117',
  'three-phone-fan': 'linear-gradient(160deg, #1a1a2e, #16213e)',
  'tablet-dashboard': '#0a0a0f',
  'browser-hero': 'radial-gradient(ellipse at 50% 40%, #1a104088, #08080f)',
  'dark-product-hero': 'linear-gradient(180deg, #050508, #0d0d20)',
  'app-store': '#f5f5f7',
  'responsive-showcase': 'linear-gradient(135deg, #0a0a14, #0f0f20)',
}

export default function TemplatesModal() {
  const { loadTemplate, toggleTemplatesModal } = useEditor()

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) toggleTemplatesModal() }}
    >
      <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 14, width: 760, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Templates</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Start from a proven composition — all templates are editable</div>
          </div>
          <button onClick={toggleTemplatesModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 6, borderRadius: 5 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Grid */}
        <div style={{ overflowY: 'auto', padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => loadTemplate(tpl.id)}
                style={{ display: 'flex', flexDirection: 'column', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', overflow: 'hidden', transition: 'all 0.15s', textAlign: 'left', padding: 0 }}
                onMouseEnter={e => { (e.currentTarget).style.borderColor = 'var(--accent)'; (e.currentTarget).style.transform = 'translateY(-2px)'; (e.currentTarget).style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)' }}
                onMouseLeave={e => { (e.currentTarget).style.borderColor = 'var(--border)'; (e.currentTarget).style.transform = 'translateY(0)'; (e.currentTarget).style.boxShadow = 'none' }}
              >
                {/* Preview thumbnail */}
                <div style={{ height: 100, background: TEMPLATE_BG_COLORS[tpl.id] ?? '#0a0b0e', position: 'relative', overflow: 'hidden' }}>
                  {TEMPLATE_PREVIEWS[tpl.id]}
                </div>
                {/* Label */}
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{tpl.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{tpl.description}</div>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 3, border: '1px solid var(--border-subtle)' }}>
                      {tpl.objects.length} object{tpl.objects.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
