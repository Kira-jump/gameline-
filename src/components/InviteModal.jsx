export default function InviteModal({ player, ctx, onClose, onInvite }) {
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:50,
      background:'rgba(3,6,15,0.8)',
      backdropFilter:'blur(18px)',
      display:'flex', alignItems:'flex-end', justifyContent:'center'
    }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:'100%', maxWidth:'430px',
          background:'linear-gradient(160deg,rgba(15,30,58,0.98),rgba(6,13,30,0.99))',
          border:'1px solid rgba(251,191,36,0.22)',
          borderRadius:'28px 28px 0 0',
          padding:'28px 24px',
          animation:'slideUp 0.38s cubic-bezier(0.34,1.2,0.64,1)'
        }}
      >
        <div style={{
          width:'40px', height:'4px', borderRadius:'2px',
          background:'rgba(251,191,36,0.2)',
          margin:'0 auto 24px'
        }}/>

        <div style={{fontFamily:'Cormorant Garamond, serif',
          fontStyle:'italic', fontWeight:300,
          color:'rgba(251,191,36,0.5)', fontSize:'13px',
          letterSpacing:'2px', marginBottom:'4px'}}>
          Invitation
        </div>
        <div style={{
          fontFamily:'Cormorant Garamond, serif', fontWeight:600, fontSize:'26px',
          background:'linear-gradient(135deg,#fcd34d,#fbbf24,#f59e0b)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          marginBottom:'20px'
        }}>
          Défier ce joueur
        </div>

        <div style={{
          display:'flex', alignItems:'center', gap:'16px',
          padding:'16px',
          background:'rgba(10,20,40,0.8)',
          border:'1px solid rgba(251,191,36,0.15)',
          borderRadius:'16px', marginBottom:'24px'
        }}>
          <div style={{
            width:'56px', height:'56px', borderRadius:'50%',
            background:'rgba(22,41,79,0.8)',
            border:'2px solid rgba(16,185,129,0.5)',
            boxShadow:'0 0 16px rgba(16,185,129,0.2)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'30px', flexShrink:0
          }}>
            {player.av}
          </div>
          <div>
            <div style={{fontFamily:'Jost',fontWeight:600,
              fontSize:'16px',color:'#e8dfc8'}}>
              {player.name}
            </div>
            <div style={{fontFamily:'Jost',fontSize:'12px',
              color:'rgba(251,191,36,0.45)',marginTop:'2px'}}>
              {player.elo} ELO · {player.wins} victoires
            </div>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          <button onClick={onClose} style={{
            padding:'14px', borderRadius:'12px',
            background:'transparent', cursor:'pointer',
            color:'rgba(232,223,200,0.6)',
            fontFamily:'Jost', fontSize:'14px', fontWeight:500,
            border:'1px solid rgba(251,191,36,0.18)'
          }}>
            Annuler
          </button>
          <button onClick={onInvite} style={{
            padding:'14px', borderRadius:'12px', cursor:'pointer',
            background:'linear-gradient(135deg,#fbbf24,#f59e0b,#d97706)',
            color:'#06090f', fontFamily:'Jost',
            fontSize:'14px', fontWeight:700,
            letterSpacing:'1px', textTransform:'uppercase',
            border:'none',
            boxShadow:'0 4px 20px rgba(251,191,36,0.3)'
          }}>
            ⚡ Inviter !
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from{transform:translateY(100%);}
          to{transform:translateY(0);}
        }
      `}</style>
    </div>
  )
}
