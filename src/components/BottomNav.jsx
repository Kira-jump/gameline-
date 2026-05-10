const tabs = [
  { id:'home',        icon:'🏠', label:'Accueil'    },
  { id:'lobby',       icon:'🌍', label:'Jouer'      },
  { id:'leaderboard', icon:'🏆', label:'Classement' },
  { id:'tournaments', icon:'⚔️', label:'Tournois'   },
]

export default function BottomNav({ screen, navigate }) {
  return (
    <div style={{
      background:'rgba(6,13,30,0.96)',
      borderTop:'1px solid rgba(251,191,36,0.12)',
      backdropFilter:'blur(24px)'
    }} className="flex-shrink-0">
      <div className="flex">
        {tabs.map(t => (
          <button key={t.id} onClick={() => navigate(t.id)}
            className="flex flex-col items-center gap-1 flex-1 py-2.5 pb-4 transition-all"
            style={{
              fontFamily:'Jost, sans-serif',
              fontSize:'9px', fontWeight:600,
              letterSpacing:'1.2px', textTransform:'uppercase',
              color: screen === t.id ? '#fbbf24' : 'rgba(232,223,200,0.35)',
              border:'none', background:'transparent', cursor:'pointer'
            }}>
            <span style={{
              fontSize:'20px',
              filter: screen === t.id ? 'drop-shadow(0 0 6px rgba(251,191,36,0.5))' : 'none',
              transform: screen === t.id ? 'scale(1.1)' : 'scale(1)',
              transition:'all 0.2s'
            }}>
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
