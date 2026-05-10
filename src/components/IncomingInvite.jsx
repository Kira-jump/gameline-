export default function IncomingInvite({ invite, onAccept, onDecline }) {
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:60,
      background:'rgba(3,6,15,0.92)',
      backdropFilter:'blur(24px)',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:'28px'
    }}>
      {/* Pulse rings */}
      <div style={{position:'relative',
        display:'flex',alignItems:'center',justifyContent:'center',
        width:'90px',height:'90px'}}>
        {[0,1].map(i=>(
          <div key={i} style={{
            position:'absolute',
            width:'90px',height:'90px',borderRadius:'50%',
            border:'1.5px solid rgba(251,191,36,0.3)',
            animation:`ringExpand 2s ease-out ${i*0.7}s infinite`
          }}/>
        ))}
        <div style={{
          width:'72px',height:'72px',borderRadius:'50%',
          background:'rgba(22,41,79,0.9)',
          border:'2px solid rgba(251,191,36,0.5)',
          boxShadow:'0 0 30px rgba(251,191,36,0.25)',
          display:'flex',alignItems:'center',
          justifyContent:'center',fontSize:'36px',zIndex:1
        }}>
          {invite.fromAvatar}
        </div>
      </div>

      <div style={{
        width:'calc(100% - 48px)', maxWidth:'382px',
        background:'linear-gradient(160deg,rgba(15,30,58,0.98),rgba(6,13,30,0.99))',
        border:'1px solid rgba(251,191,36,0.22)',
        borderRadius:'28px', padding:'32px', textAlign:'center'
      }}>
        <div style={{fontFamily:'Cormorant Garamond, serif',
          fontStyle:'italic',fontWeight:300,
          color:'rgba(251,191,36,0.5)',fontSize:'13px',
          letterSpacing:'2px',marginBottom:'6px'}}>
          Invitation de
        </div>
        <div style={{
          fontFamily:'Cormorant Garamond, serif',fontWeight:700,
          fontSize:'32px',
          background:'linear-gradient(135deg,#fcd34d,#fbbf24,#f59e0b)',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
          marginBottom:'6px'
        }}>
          {invite.fromUsername}
        </div>
        <div style={{fontFamily:'Jost',fontSize:'13px',
          color:'rgba(251,191,36,0.45)',marginBottom:'28px'}}>
          {invite.fromElo} ELO · Veut te défier !
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          <button onClick={onDecline} style={{
            padding:'14px',borderRadius:'12px',
            background:'transparent',cursor:'pointer',
            color:'rgba(232,223,200,0.6)',
            fontFamily:'Jost',fontSize:'14px',fontWeight:500,
            border:'1px solid rgba(251,191,36,0.18)'
          }}>
            ❌ Refuser
          </button>
          <button onClick={onAccept} style={{
            padding:'14px',borderRadius:'12px',cursor:'pointer',
            background:'linear-gradient(135deg,#fbbf24,#f59e0b,#d97706)',
            color:'#06090f',fontFamily:'Jost',
            fontSize:'14px',fontWeight:700,
            letterSpacing:'1px',textTransform:'uppercase',
            border:'none',
            boxShadow:'0 4px 20px rgba(251,191,36,0.3)'
          }}>
            ✅ Accepter
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ringExpand {
          0%   { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(2.4); opacity: 0;   }
        }
      `}</style>
    </div>
  )
}
