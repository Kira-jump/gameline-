import { useState, useEffect } from 'react'
import { listenLeaderboard } from '../services/leaderboardService'

export default function Leaderboard({ ctx }) {
  const { user } = ctx
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = listenLeaderboard((data) => {
      setPlayers(data)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const top3  = players.slice(0, 3)
  const rest  = players.slice(3)
  const meIdx = players.findIndex(p => p.uid === user.uid)

  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3

  const podiumStyles = [
    { height:'68px', color:'#c8c8dc', rankColor:'#c8c8dc' },
    { height:'92px', color:'#fbbf24', rankColor:'#fbbf24' },
    { height:'50px', color:'#cd7f32', rankColor:'#cd7f32' },
  ]

  if (loading) return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      height:'300px', flexDirection:'column', gap:'16px'
    }}>
      <div style={{
        width:'36px', height:'36px', borderRadius:'50%',
        border:'3px solid rgba(251,191,36,0.2)',
        borderTopColor:'#fbbf24',
        animation:'spin 0.8s linear infinite'
      }}/>
      <div style={{fontFamily:'Jost',fontSize:'13px',
        color:'rgba(251,191,36,0.4)'}}>
        Chargement du classement…
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div className="px-5 py-5">

      {/* Header */}
      <div className="text-center mb-6">
        <div style={{fontFamily:'Cormorant Garamond, serif',
          fontStyle:'italic', fontWeight:300,
          color:'rgba(251,191,36,0.5)', fontSize:'13px',
          letterSpacing:'3px', textTransform:'uppercase', marginBottom:'4px'}}>
          Classement
        </div>
        <div style={{
          fontFamily:'Cormorant Garamond, serif', fontWeight:600,
          background:'linear-gradient(135deg,#fcd34d,#fbbf24,#f59e0b)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          fontSize:'38px'
        }}>
          Hall of Fame
        </div>
        <div style={{fontFamily:'Jost',fontSize:'12px',
          color:'rgba(251,191,36,0.3)',marginTop:'4px'}}>
          {players.length} joueurs inscrits · Mis à jour en temps réel
        </div>
      </div>

      {/* Podium */}
      {top3.length >= 2 && (
        <div style={{
          display:'flex', alignItems:'flex-end',
          justifyContent:'center', gap:'8px',
          height:'190px', marginBottom:'28px'
        }}>
          {podiumOrder.map((p, i) => {
            if (!p) return null
            const s = podiumStyles[i]
            return (
              <div key={p.uid} style={{
                flex:1, maxWidth:'110px',
                display:'flex', flexDirection:'column',
                alignItems:'center', gap:'6px'
              }}>
                <div style={{
                  fontSize: p.rank===1 ? '34px' : '26px',
                  filter: p.rank===1
                    ? 'drop-shadow(0 0 12px rgba(251,191,36,0.6))'
                    : 'none'
                }}>
                  {p.avatar}
                </div>
                <div style={{
                  fontFamily:'Jost', fontSize:'11px', fontWeight:600,
                  textAlign:'center', color:s.color,
                  maxWidth:'90px',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'
                }}>
                  {p.username}
                </div>
                <div style={{fontFamily:'Jost',fontSize:'10px',
                  color:'rgba(251,191,36,0.4)'}}>
                  {p.elo} ELO
                </div>
                <div style={{
                  width:'100%', height:s.height,
                  borderRadius:'12px 12px 0 0',
                  background:`linear-gradient(180deg,${s.color}22,rgba(0,0,0,0))`,
                  border:`1px solid ${s.color}44`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:'Cormorant Garamond, serif',
                  fontWeight:700, fontSize:'30px', color:s.color
                }}>
                  {p.rank}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Ma position si hors top 3 */}
      {meIdx >= 3 && (
        <div style={{
          display:'flex', alignItems:'center', gap:'14px',
          padding:'13px 15px', marginBottom:'16px',
          background:'rgba(251,191,36,0.04)',
          border:'1px solid rgba(251,191,36,0.35)',
          borderRadius:'14px'
        }}>
          <div style={{fontFamily:'Cormorant Garamond, serif',
            fontWeight:700, fontSize:'20px',
            color:'#fbbf24', width:'28px', textAlign:'center'}}>
            {meIdx + 1}
          </div>
          <div style={{
            width:'40px', height:'40px', borderRadius:'50%',
            background:'rgba(251,191,36,0.08)',
            border:'1px solid rgba(251,191,36,0.3)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'22px'
          }}>
            {user.avatar}
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:'Jost',fontWeight:600,
              fontSize:'14px',color:'#fbbf24'}}>
              {user.username} ← Toi
            </div>
            <div style={{fontFamily:'Jost',fontSize:'11px',
              color:'rgba(16,185,129,0.6)'}}>
              ✅ {user.wins} victoires
            </div>
          </div>
          <div style={{
            fontFamily:'Cormorant Garamond, serif',
            fontWeight:600, fontSize:'18px',
            background:'linear-gradient(135deg,#fcd34d,#fbbf24)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'
          }}>
            {user.elo}
          </div>
        </div>
      )}

      {/* Liste */}
      <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'24px'}}>
        {players.length === 0 && (
          <div style={{textAlign:'center',padding:'40px 0',
            fontFamily:'Jost',color:'rgba(251,191,36,0.3)',fontSize:'14px'}}>
            Aucun joueur encore inscrit
          </div>
        )}
        {players.map((p) => {
          const isMe = p.uid === user.uid
          return (
            <div key={p.uid} style={{
              display:'flex', alignItems:'center', gap:'14px',
              padding:'13px 15px',
              background: isMe
                ? 'rgba(251,191,36,0.04)'
                : 'linear-gradient(145deg,rgba(22,41,79,0.45),rgba(6,13,30,0.65))',
              border: isMe
                ? '1px solid rgba(251,191,36,0.35)'
                : '1px solid rgba(251,191,36,0.08)',
              borderRadius:'14px',
              transition:'all 0.2s'
            }}>
              {/* Rank */}
              <div style={{
                fontFamily:'Cormorant Garamond, serif',
                fontWeight:700, fontSize:'18px',
                color: p.rank <= 3
                  ? ['#fbbf24','#c8c8dc','#cd7f32'][p.rank-1]
                  : 'rgba(251,191,36,0.3)',
                width:'28px', textAlign:'center'
              }}>
                {p.rank <= 3 ? ['🥇','🥈','🥉'][p.rank-1] : p.rank}
              </div>

              {/* Avatar */}
              <div style={{
                width:'42px', height:'42px', borderRadius:'50%',
                background: isMe ? 'rgba(251,191,36,0.08)' : 'rgba(22,41,79,0.8)',
                border:`1px solid ${isMe ? 'rgba(251,191,36,0.3)' : 'rgba(251,191,36,0.1)'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'22px'
              }}>
                {p.avatar}
              </div>

              {/* Info */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{
                  fontFamily:'Jost', fontWeight:600, fontSize:'14px',
                  color: isMe ? '#fbbf24' : '#e8dfc8',
                  display:'flex', alignItems:'center', gap:'6px'
                }}>
                  {p.username}
                  {isMe && (
                    <span style={{fontSize:'10px',
                      background:'rgba(251,191,36,0.15)',
                      border:'1px solid rgba(251,191,36,0.3)',
                      borderRadius:'4px',padding:'1px 6px',color:'#fbbf24'}}>
                      Toi
                    </span>
                  )}
                </div>
                <div style={{fontFamily:'Jost',fontSize:'11px',
                  color:'rgba(16,185,129,0.6)'}}>
                  ✅ {p.wins || 0} V · ❌ {p.losses || 0} D
                  {p.streak > 1 && ` · 🔥 ${p.streak}`}
                </div>
              </div>

              {/* ELO */}
              <div style={{
                fontFamily:'Cormorant Garamond, serif',
                fontWeight:600, fontSize:'18px',
                color: isMe ? '#fbbf24' : 'rgba(251,191,36,0.7)'
              }}>
                {p.elo}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
