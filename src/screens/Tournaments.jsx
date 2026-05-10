import { useState, useEffect } from 'react'
import {
  listenTournaments, joinTournament, leaveTournament,
  generateBracket, listenTournament
} from '../services/tournamentService'

export default function Tournaments({ ctx }) {
  const { user, navigate, showToast } = ctx
  const [tournaments, setTournaments]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [selected, setSelected]         = useState(null) // tournoi détail
  const [detail, setDetail]             = useState(null) // données temps réel
  const [tab, setTab]                   = useState('list') // list | detail

  // Écoute tous les tournois
  useEffect(() => {
    const unsub = listenTournaments((data) => {
      setTournaments(data)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  // Écoute le tournoi sélectionné
  useEffect(() => {
    if (!selected) return
    const unsub = listenTournament(selected, (data) => {
      setDetail(data)
    })
    return () => unsub()
  }, [selected])

  const openDetail = (id) => {
    setSelected(id)
    setTab('detail')
  }

  const handleJoin = async (tournamentId) => {
    try {
      await joinTournament(tournamentId, user)
      showToast('✅ Inscrit au tournoi !')
    } catch(e) {
      showToast('❌ ' + e.message)
    }
  }

  const handleLeave = async (tournamentId) => {
    try {
      await leaveTournament(tournamentId, user.uid)
      showToast('🚪 Désinscrit du tournoi')
    } catch(e) {
      showToast('❌ ' + e.message)
    }
  }

  const handleGenerateBracket = async (tournamentId) => {
    try {
      await generateBracket(tournamentId)
      showToast('⚔️ Bracket généré !')
    } catch(e) {
      showToast('❌ ' + e.message)
    }
  }

  const isRegistered = (t) =>
    t.players?.some(p => p.uid === user.uid)

  const statusLabel = (s) => ({
    open:     { label:'Inscriptions ouvertes', color:'#6ee7b7', bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.3)' },
    started:  { label:'En cours',              color:'#f87171', bg:'rgba(232,66,90,0.12)',  border:'rgba(232,66,90,0.3)'  },
    finished: { label:'Terminé',               color:'rgba(232,223,200,0.3)', bg:'rgba(255,255,255,0.04)', border:'rgba(255,255,255,0.1)' },
  }[s] || { label:s, color:'#fbbf24', bg:'rgba(251,191,36,0.1)', border:'rgba(251,191,36,0.3)' })

  // ─── VUE DÉTAIL TOURNOI ───
  if (tab === 'detail' && detail) return (
    <div className="px-5 py-5">

      {/* Back */}
      <button onClick={() => { setTab('list'); setSelected(null); setDetail(null) }}
        style={{
          display:'flex', alignItems:'center', gap:'8px',
          background:'transparent', border:'none', cursor:'pointer',
          fontFamily:'Jost', fontSize:'13px',
          color:'rgba(251,191,36,0.6)', marginBottom:'20px',
          padding:0
        }}>
        ← Retour aux tournois
      </button>

      {/* Header tournoi */}
      <div style={{
        padding:'22px',
        background:'linear-gradient(135deg,rgba(22,41,79,0.8),rgba(6,13,30,0.9))',
        border:'1px solid rgba(251,191,36,0.22)',
        borderRadius:'22px', marginBottom:'20px',
        position:'relative', overflow:'hidden'
      }}>
        {/* Status */}
        {(() => { const s = statusLabel(detail.status); return (
          <div style={{
            position:'absolute', top:'16px', right:'16px',
            background:s.bg, color:s.color,
            border:`1px solid ${s.border}`,
            fontFamily:'Jost', fontSize:'10px',
            fontWeight:700, letterSpacing:'1.5px',
            padding:'4px 10px', borderRadius:'6px',
            textTransform:'uppercase'
          }}>
            {detail.status === 'started' ? '● ' : ''}{s.label}
          </div>
        )})()}

        <div style={{fontFamily:'Cormorant Garamond, serif',
          fontWeight:700, fontSize:'26px',
          background:'linear-gradient(135deg,#fcd34d,#fbbf24)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          marginBottom:'6px', paddingRight:'100px'}}>
          {detail.name}
        </div>
        <div style={{fontFamily:'Jost',fontSize:'13px',
          color:'rgba(251,191,36,0.5)',marginBottom:'16px'}}>
          {detail.description}
        </div>

        {/* Progress */}
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
          <div style={{flex:1,height:'4px',
            background:'rgba(251,191,36,0.08)',borderRadius:'2px',overflow:'hidden'}}>
            <div style={{
              height:'100%',borderRadius:'2px',
              width:`${Math.min(100,(detail.players?.length||0)/detail.maxPlayers*100)}%`,
              background:'linear-gradient(90deg,#fbbf24,#e8425a)',
              transition:'width 0.5s'
            }}/>
          </div>
          <div style={{fontFamily:'Jost',fontSize:'12px',
            color:'rgba(251,191,36,0.5)',whiteSpace:'nowrap'}}>
            {detail.players?.length || 0} / {detail.maxPlayers}
          </div>
        </div>

        {/* Actions */}
        {detail.status === 'open' && (
          isRegistered(detail) ? (
            <button onClick={() => handleLeave(detail.id)} style={{
              width:'100%', padding:'13px',
              background:'rgba(232,66,90,0.1)',
              border:'1px solid rgba(232,66,90,0.3)',
              borderRadius:'12px', cursor:'pointer',
              fontFamily:'Jost', fontSize:'14px', fontWeight:600,
              color:'#fca5a5'
            }}>
              🚪 Se désinscrire
            </button>
          ) : (
            <button onClick={() => handleJoin(detail.id)} style={{
              width:'100%', padding:'13px',
              background:'linear-gradient(135deg,#fbbf24,#f59e0b,#d97706)',
              border:'none', borderRadius:'12px', cursor:'pointer',
              fontFamily:'Jost', fontSize:'14px', fontWeight:700,
              color:'#06090f', letterSpacing:'1px',
              boxShadow:'0 4px 20px rgba(251,191,36,0.3)'
            }}>
              ⚔️ S'inscrire au tournoi
            </button>
          )
        )}
      </div>

      {/* Joueurs inscrits */}
      <div style={{fontFamily:'Cormorant Garamond, serif',
        fontWeight:600, fontSize:'16px',
        color:'rgba(251,191,36,0.7)',
        textTransform:'uppercase', letterSpacing:'2px',
        marginBottom:'12px'}}>
        👥 Joueurs inscrits ({detail.players?.length || 0})
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'20px'}}>
        {(detail.players || []).length === 0 && (
          <div style={{textAlign:'center',padding:'24px',
            fontFamily:'Jost',color:'rgba(251,191,36,0.3)',fontSize:'13px'}}>
            Aucun joueur inscrit pour l'instant
          </div>
        )}
        {(detail.players || []).map((p, i) => (
          <div key={p.uid} style={{
            display:'flex', alignItems:'center', gap:'12px',
            padding:'12px 14px',
            background: p.uid===user.uid
              ? 'rgba(251,191,36,0.04)'
              : 'linear-gradient(145deg,rgba(22,41,79,0.45),rgba(6,13,30,0.65))',
            border:`1px solid ${p.uid===user.uid
              ? 'rgba(251,191,36,0.3)' : 'rgba(251,191,36,0.08)'}`,
            borderRadius:'12px'
          }}>
            <div style={{fontFamily:'Cormorant Garamond, serif',
              fontWeight:700,fontSize:'16px',
              color:'rgba(251,191,36,0.35)',width:'24px',textAlign:'center'}}>
              {i+1}
            </div>
            <div style={{
              width:'38px',height:'38px',borderRadius:'50%',
              background:'rgba(22,41,79,0.8)',
              border:'1px solid rgba(251,191,36,0.1)',
              display:'flex',alignItems:'center',
              justifyContent:'center',fontSize:'20px'
            }}>
              {p.avatar}
            </div>
            <div style={{flex:1}}>
              <div style={{fontFamily:'Jost',fontWeight:600,
                fontSize:'13px',
                color: p.uid===user.uid ? '#fbbf24' : '#e8dfc8'}}>
                {p.username} {p.uid===user.uid && '← Toi'}
              </div>
              <div style={{fontFamily:'Jost',fontSize:'11px',
                color:'rgba(251,191,36,0.4)'}}>
                {p.elo} ELO
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bracket */}
      {detail.status === 'started' && detail.matches?.length > 0 && (
        <>
          <div style={{fontFamily:'Cormorant Garamond, serif',
            fontWeight:600, fontSize:'16px',
            color:'rgba(251,191,36,0.7)',
            textTransform:'uppercase', letterSpacing:'2px',
            marginBottom:'12px'}}>
            ⚔️ Bracket — Round 1
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'20px'}}>
            {detail.matches.map((m, i) => {
              const myMatch = m.player1?.uid===user.uid || m.player2?.uid===user.uid
              return (
                <div key={m.id} style={{
                  padding:'14px 16px',
                  background: myMatch
                    ? 'rgba(251,191,36,0.04)'
                    : 'linear-gradient(145deg,rgba(22,41,79,0.45),rgba(6,13,30,0.65))',
                  border:`1px solid ${myMatch
                    ? 'rgba(251,191,36,0.3)' : 'rgba(251,191,36,0.08)'}`,
                  borderRadius:'16px'
                }}>
                  {/* Match header */}
                  <div style={{display:'flex',alignItems:'center',
                    justifyContent:'space-between',marginBottom:'10px'}}>
                    <div style={{fontFamily:'Jost',fontSize:'10px',
                      color:'rgba(251,191,36,0.4)',
                      textTransform:'uppercase',letterSpacing:'2px'}}>
                      Match {i+1} {myMatch && '· Ton match'}
                    </div>
                    <div style={{
                      fontFamily:'Jost',fontSize:'10px',fontWeight:700,
                      padding:'3px 8px',borderRadius:'6px',
                      textTransform:'uppercase',letterSpacing:'1px',
                      ...(m.status==='finished'
                        ? {background:'rgba(16,185,129,0.1)',color:'#6ee7b7',border:'1px solid rgba(16,185,129,0.2)'}
                        : m.status==='playing'
                        ? {background:'rgba(232,66,90,0.1)',color:'#f87171',border:'1px solid rgba(232,66,90,0.2)'}
                        : {background:'rgba(251,191,36,0.08)',color:'rgba(251,191,36,0.5)',border:'1px solid rgba(251,191,36,0.15)'})
                    }}>
                      {m.status==='finished' ? '✅ Terminé' : m.status==='playing' ? '● En jeu' : '⏳ En attente'}
                    </div>
                  </div>

                  {/* Players */}
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    {/* P1 */}
                    <div style={{
                      display:'flex',alignItems:'center',gap:'8px',flex:1,
                      padding:'8px 10px',borderRadius:'10px',
                      background: m.winner===m.player1?.uid
                        ? 'rgba(16,185,129,0.1)' : 'rgba(10,20,40,0.5)',
                      border: m.winner===m.player1?.uid
                        ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(251,191,36,0.06)'
                    }}>
                      <span style={{fontSize:'20px'}}>{m.player1?.avatar}</span>
                      <div style={{minWidth:0}}>
                        <div style={{fontFamily:'Jost',fontSize:'12px',fontWeight:600,
                          color: m.player1?.uid===user.uid ? '#fbbf24' : '#e8dfc8',
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {m.player1?.username}
                        </div>
                        <div style={{fontFamily:'Jost',fontSize:'10px',
                          color:'rgba(251,191,36,0.35)'}}>
                          {m.player1?.elo} ELO
                        </div>
                      </div>
                      {m.winner===m.player1?.uid && (
                        <span style={{marginLeft:'auto',fontSize:'14px'}}>🏆</span>
                      )}
                    </div>

                    {/* Score */}
                    <div style={{
                      fontFamily:'Cormorant Garamond, serif',
                      fontWeight:700,fontSize:'20px',
                      color:'rgba(251,191,36,0.5)',
                      minWidth:'36px',textAlign:'center'
                    }}>
                      {m.status==='finished'
                        ? `${m.score1}—${m.score2}`
                        : 'VS'}
                    </div>

                    {/* P2 */}
                    {m.player2 ? (
                      <div style={{
                        display:'flex',alignItems:'center',gap:'8px',flex:1,
                        padding:'8px 10px',borderRadius:'10px',
                        flexDirection:'row-reverse',
                        background: m.winner===m.player2?.uid
                          ? 'rgba(16,185,129,0.1)' : 'rgba(10,20,40,0.5)',
                        border: m.winner===m.player2?.uid
                          ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(251,191,36,0.06)'
                      }}>
                        <span style={{fontSize:'20px'}}>{m.player2?.avatar}</span>
                        <div style={{minWidth:0,textAlign:'right'}}>
                          <div style={{fontFamily:'Jost',fontSize:'12px',fontWeight:600,
                            color: m.player2?.uid===user.uid ? '#fbbf24' : '#e8dfc8',
                            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {m.player2?.username}
                          </div>
                          <div style={{fontFamily:'Jost',fontSize:'10px',
                            color:'rgba(251,191,36,0.35)'}}>
                            {m.player2?.elo} ELO
                          </div>
                        </div>
                        {m.winner===m.player2?.uid && (
                          <span style={{marginRight:'auto',fontSize:'14px'}}>🏆</span>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        flex:1,padding:'8px 10px',borderRadius:'10px',
                        background:'rgba(10,20,40,0.3)',
                        border:'1px solid rgba(251,191,36,0.06)',
                        display:'flex',alignItems:'center',justifyContent:'center'
                      }}>
                        <span style={{fontFamily:'Jost',fontSize:'11px',
                          color:'rgba(251,191,36,0.3)'}}>
                          Bye 🎯
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Jouer ce match */}
                  {myMatch && m.status==='pending' && (
                    <button onClick={() => navigate('game')} style={{
                      width:'100%',marginTop:'10px',padding:'11px',
                      background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
                      border:'none',borderRadius:'10px',cursor:'pointer',
                      fontFamily:'Jost',fontSize:'13px',fontWeight:700,
                      color:'#06090f',letterSpacing:'1px'
                    }}>
                      ⚔️ Jouer ce match
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

    </div>
  )

  // ─── VUE LISTE TOURNOIS ───
  return (
    <div className="px-5 py-5">

      {/* Header */}
      <div className="text-center mb-5">
        <div style={{fontFamily:'Cormorant Garamond, serif',
          fontStyle:'italic', fontWeight:300,
          color:'rgba(251,191,36,0.5)', fontSize:'13px',
          letterSpacing:'3px', textTransform:'uppercase', marginBottom:'4px'}}>
          Compétition internationale
        </div>
        <div style={{
          fontFamily:'Cormorant Garamond, serif', fontWeight:600,
          background:'linear-gradient(135deg,#fcd34d,#fbbf24,#f59e0b)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          fontSize:'34px'
        }}>
          Les Tournois
        </div>
      </div>

      {loading && (
        <div style={{display:'flex',alignItems:'center',
          justifyContent:'center',height:'200px',gap:'12px'}}>
          <div style={{
            width:'32px',height:'32px',borderRadius:'50%',
            border:'3px solid rgba(251,191,36,0.2)',
            borderTopColor:'#fbbf24',
            animation:'spin 0.8s linear infinite'
          }}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {!loading && tournaments.length === 0 && (
        <div style={{
          textAlign:'center',padding:'48px 20px',
          background:'linear-gradient(145deg,rgba(22,41,79,0.4),rgba(6,13,30,0.6))',
          border:'1px solid rgba(251,191,36,0.1)',
          borderRadius:'20px'
        }}>
          <div style={{fontSize:'48px',marginBottom:'12px'}}>⚔️</div>
          <div style={{fontFamily:'Cormorant Garamond, serif',
            fontSize:'22px',fontWeight:600,color:'#e8dfc8',marginBottom:'6px'}}>
            Aucun tournoi disponible
          </div>
          <div style={{fontFamily:'Jost',fontSize:'13px',
            color:'rgba(251,191,36,0.35)'}}>
            Les prochains tournois apparaîtront ici
          </div>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:'12px',paddingBottom:'24px'}}>
        {tournaments.map(t => {
          const s       = statusLabel(t.status)
          const reg     = isRegistered(t)
          const pct     = Math.min(100,((t.players?.length||0)/t.maxPlayers)*100)

          return (
            <div key={t.id} style={{
              padding:'20px',
              background:'linear-gradient(145deg,rgba(22,41,79,0.75),rgba(6,13,30,0.92))',
              border:`1px solid ${reg ? 'rgba(251,191,36,0.3)' : 'rgba(251,191,36,0.15)'}`,
              borderRadius:'20px',
              boxShadow: reg ? '0 0 20px rgba(251,191,36,0.06)' : 'none'
            }}>
              {/* Head */}
              <div style={{display:'flex',alignItems:'flex-start',
                justifyContent:'space-between',marginBottom:'8px'}}>
                <div style={{fontFamily:'Cormorant Garamond, serif',
                  fontWeight:600,fontSize:'20px',color:'#e8dfc8',
                  flex:1,paddingRight:'8px'}}>
                  {t.name}
                  {reg && (
                    <span style={{
                      marginLeft:'8px',fontSize:'10px',
                      background:'rgba(251,191,36,0.12)',
                      border:'1px solid rgba(251,191,36,0.3)',
                      borderRadius:'4px',padding:'2px 7px',
                      color:'#fbbf24',fontFamily:'Jost',fontWeight:600,
                      verticalAlign:'middle'
                    }}>
                      Inscrit ✓
                    </span>
                  )}
                </div>
                <div style={{
                  fontFamily:'Jost',fontSize:'10px',
                  textTransform:'uppercase',letterSpacing:'1px',fontWeight:700,
                  padding:'4px 10px',borderRadius:'8px',flexShrink:0,
                  background:s.bg,border:`1px solid ${s.border}`,color:s.color
                }}>
                  {s.label}
                </div>
              </div>

              <div style={{fontFamily:'Jost',fontSize:'12px',
                color:'rgba(251,191,36,0.45)',marginBottom:'12px'}}>
                {t.description}
              </div>

              {/* Progress */}
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px'}}>
                <div style={{flex:1,height:'4px',
                  background:'rgba(251,191,36,0.08)',borderRadius:'2px',overflow:'hidden'}}>
                  <div style={{
                    height:'100%',borderRadius:'2px',
                    width:`${pct}%`,
                    background:'linear-gradient(90deg,#fbbf24,#e8425a)',
                    transition:'width 0.5s'
                  }}/>
                </div>
                <div style={{fontFamily:'Jost',fontSize:'11px',
                  color: pct>=100 ? '#f87171' : 'rgba(251,191,36,0.45)',
                  whiteSpace:'nowrap',fontWeight: pct>=100 ? 700 : 400}}>
                  {t.players?.length||0} / {t.maxPlayers}
                  {pct>=100 && ' · Complet !'}
                </div>
              </div>

              {/* Avatars inscrits */}
              {(t.players||[]).length > 0 && (
                <div style={{display:'flex',alignItems:'center',
                  gap:'4px',marginBottom:'14px'}}>
                  {(t.players||[]).slice(0,8).map((p,i) => (
                    <div key={p.uid} style={{
                      width:'28px',height:'28px',borderRadius:'50%',
                      background:'rgba(22,41,79,0.8)',
                      border:'1px solid rgba(251,191,36,0.2)',
                      display:'flex',alignItems:'center',
                      justifyContent:'center',fontSize:'14px',
                      marginLeft: i>0 ? '-6px' : '0',
                      zIndex:10-i
                    }}>
                      {p.avatar}
                    </div>
                  ))}
                  {(t.players||[]).length > 8 && (
                    <div style={{
                      fontFamily:'Jost',fontSize:'11px',
                      color:'rgba(251,191,36,0.4)',marginLeft:'4px'
                    }}>
                      +{(t.players||[]).length-8}
                    </div>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div style={{display:'grid',
                gridTemplateColumns: t.status==='open' ? '1fr 1fr' : '1fr',
                gap:'10px'}}>
                <button onClick={() => openDetail(t.id)} style={{
                  padding:'12px',borderRadius:'12px',cursor:'pointer',
                  background:'transparent',
                  border:'1px solid rgba(251,191,36,0.2)',
                  fontFamily:'Jost',fontSize:'13px',fontWeight:600,
                  color:'rgba(251,191,36,0.7)'
                }}>
                  👁 Voir le bracket
                </button>

                {t.status==='open' && (
                  reg ? (
                    <button onClick={() => handleLeave(t.id)} style={{
                      padding:'12px',borderRadius:'12px',cursor:'pointer',
                      background:'rgba(232,66,90,0.08)',
                      border:'1px solid rgba(232,66,90,0.25)',
                      fontFamily:'Jost',fontSize:'13px',fontWeight:600,
                      color:'#fca5a5'
                    }}>
                      🚪 Se désinscrire
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoin(t.id)}
                      disabled={pct>=100}
                      style={{
                        padding:'12px',borderRadius:'12px',cursor:'pointer',
                        background: pct>=100
                          ? 'rgba(255,255,255,0.05)'
                          : 'linear-gradient(135deg,#fbbf24,#f59e0b)',
                        border:'none',
                        fontFamily:'Jost',fontSize:'13px',fontWeight:700,
                        color: pct>=100 ? 'rgba(232,223,200,0.3)' : '#06090f',
                        boxShadow: pct>=100 ? 'none' : '0 4px 16px rgba(251,191,36,0.25)'
                      }}>
                      {pct>=100 ? 'Complet' : '⚔️ S\'inscrire'}
                    </button>
                  )
                )}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
