export default function TopBar({ ctx }) {
  return (
    <div style={{background:'rgba(6,13,30,0.95)',borderBottom:'1px solid rgba(251,191,36,0.1)'}}
      className="flex-shrink-0 backdrop-blur-xl">
      <div className="flex items-center justify-between px-5 py-3">
        <div style={{
          fontFamily:'Cormorant Garamond, serif',
          fontSize:'22px', fontWeight:600, letterSpacing:'3px',
          background:'linear-gradient(135deg,#fcd34d,#fbbf24,#f59e0b)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'
        }}>
          GameLine
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => ctx.navigate('lobby')}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all"
            style={{background:'rgba(22,41,79,0.6)',border:'1px solid rgba(251,191,36,0.15)'}}>
            🌍
          </button>
          <button
            onClick={() => ctx.navigate('home')}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all"
            style={{background:'rgba(22,41,79,0.6)',border:'1px solid rgba(251,191,36,0.15)'}}>
            {ctx.user.avatar}
          </button>
        </div>
      </div>
      <div style={{height:'1px',background:'linear-gradient(90deg,transparent,rgba(251,191,36,0.3),transparent)'}}/>
    </div>
  )
}
