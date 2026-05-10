const rules = [
  { icon:'🎯', title:'Objectif',
    text:'Aligne 4 jetons de ta couleur — horizontalement, verticalement ou en diagonale — avant ton adversaire.' },
  { icon:'⬇️', title:'Comment jouer',
    text:'La grille compte 7 colonnes et 6 rangées. Clique sur une colonne — ton jeton tombe vers le bas par gravité.' },
  { icon:'🔴🟡', title:'Les deux joueurs',
    text:'Rouge joue en premier, Jaune ensuite. On alterne à chaque tour. Sois stratégique !' },
  { icon:'🏆', title:'Points & Classement',
    text:'Chaque victoire rapporte des points ELO. Grimpe dans le classement mondial et débloque des rangs prestigieux.' },
  { icon:'⚔️', title:'Tournois Internationaux',
    text:'Des tournois aller-retour sont organisés régulièrement. Bats tous tes adversaires pour atteindre la Grande Finale.' },
]

const DEMO = [
  [0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],
  [0,0,0,1,0,0,0],
  [0,0,1,2,0,0,0],
  [0,1,2,2,0,0,0],
  [1,2,2,1,0,0,0],
]
const WIN_CELLS = new Set(['5-0','4-1','3-2','2-3'])

export default function Tutorial({ ctx }) {
  return (
    <div className="px-6 py-6">

      {/* Header */}
      <div className="text-center mb-6">
        <div style={{fontFamily:'Cormorant Garamond, serif',
          fontStyle:'italic', fontWeight:300,
          color:'rgba(251,191,36,0.5)', fontSize:'13px',
          letterSpacing:'3px', textTransform:'uppercase', marginBottom:'4px'}}>
          Les règles du jeu
        </div>
        <div style={{
          fontFamily:'Cormorant Garamond, serif', fontWeight:600, fontSize:'36px',
          background:'linear-gradient(135deg,#fcd34d,#fbbf24,#f59e0b)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'
        }}>
          L'Art de la Stratégie
        </div>
      </div>

      {/* Demo board */}
      <div style={{
        background:'linear-gradient(160deg,rgba(15,30,58,0.95),rgba(6,13,30,0.98))',
        border:'1px solid rgba(251,191,36,0.18)',
        borderRadius:'20px', padding:'14px', marginBottom:'24px'
      }}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'6px'}}>
          {DEMO.map((row, r) => row.map((cell, c) => {
            const isWin = WIN_CELLS.has(`${r}-${c}`)
            return (
              <div key={`${r}-${c}`} style={{
                aspectRatio:'1', borderRadius:'50%',
                background: cell===1
                  ? 'radial-gradient(circle at 35% 30%,#f87171,#e8425a 60%,#be123c)'
                  : cell===2
                  ? 'radial-gradient(circle at 35% 30%,#fde68a,#fbbf24 60%,#d97706)'
                  : 'rgba(6,13,30,0.85)',
                border:'1px solid rgba(251,191,36,0.07)',
                boxShadow: isWin && cell===1
                  ? '0 0 14px rgba(232,66,90,0.6)'
                  : isWin && cell===2
                  ? '0 0 14px rgba(251,191,36,0.6)'
                  : 'none',
                animation: isWin ? 'pulse 1s ease-in-out infinite alternate' : 'none'
              }}/>
            )
          }))}
        </div>
      </div>

      {/* Rules */}
      <div style={{display:'flex',flexDirection:'column',gap:'12px',marginBottom:'24px'}}>
        {rules.map(r => (
          <div key={r.title} style={{
            display:'flex', alignItems:'flex-start', gap:'14px',
            padding:'16px',
            background:'linear-gradient(145deg,rgba(22,41,79,0.75),rgba(6,13,30,0.92))',
            border:'1px solid rgba(251,191,36,0.12)',
            borderRadius:'16px'
          }}>
            <span style={{fontSize:'26px',flexShrink:0,marginTop:'2px'}}>{r.icon}</span>
            <div>
              <div style={{fontFamily:'Cormorant Garamond, serif',
                fontWeight:600, fontSize:'18px',
                color:'#fbbf24', marginBottom:'4px'}}>
                {r.title}
              </div>
              <div style={{fontFamily:'Jost, sans-serif',
                fontSize:'13px', color:'rgba(232,223,200,0.6)',
                lineHeight:'1.6'}}>
                {r.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Arabic quote */}
      <div style={{
        fontFamily:'Amiri, serif', textAlign:'center',
        fontSize:'20px', color:'rgba(251,191,36,0.3)',
        marginBottom:'24px'
      }}>
        «&nbsp;من صبر ظفر&nbsp;» — Qui persévère, triomphe
      </div>

      {/* CTA */}
      <button onClick={() => ctx.navigate('home')} style={{
        display:'block', width:'100%', padding:'15px',
        background:'linear-gradient(135deg,#fbbf24,#f59e0b,#d97706)',
        color:'#06090f', fontFamily:'Jost, sans-serif',
        fontSize:'15px', fontWeight:700,
        letterSpacing:'1.5px', textTransform:'uppercase',
        border:'none', borderRadius:'12px', cursor:'pointer',
        boxShadow:'0 4px 20px rgba(251,191,36,0.3)',
        marginBottom:'32px'
      }}>
        Entrer dans l'Arène →
      </button>

    </div>
  )
}
