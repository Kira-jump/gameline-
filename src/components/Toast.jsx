export default function Toast({ message }) {
  return (
    <div style={{
      position:'fixed', bottom:'88px', left:'50%',
      transform: message ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(10px)',
      background:'linear-gradient(135deg,rgba(22,41,79,0.97),rgba(6,13,30,0.98))',
      border:'1px solid rgba(251,191,36,0.25)',
      borderRadius:'12px', padding:'11px 22px',
      fontFamily:'Jost, sans-serif', fontSize:'13px', fontWeight:500,
      color:'#e8dfc8',
      opacity: message ? 1 : 0,
      transition:'all 0.3s',
      pointerEvents:'none', zIndex:200,
      whiteSpace:'nowrap',
      boxShadow:'0 8px 30px rgba(0,0,0,0.4)'
    }}>
      {message}
    </div>
  )
}
