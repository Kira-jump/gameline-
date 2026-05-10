import { useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { signOut } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { setPresence } from '../services/presence'
import { ref, set } from 'firebase/database'
import { rtdb } from '../firebase'

export default function Home({ ctx }) {
  const { user, setUser, navigate, showToast } = ctx

  // Set presence when home loads
  useEffect(() => {
    if (user.uid) {
      setPresence(user.uid, user)
    }
  }, [user.uid])

  const winRate = user.wins + user.losses > 0
    ? Math.round((user.wins / (user.wins + user.losses)) * 100)
    : 0

  const toggleAvail = async () => {
    const newAvail = !user.available
    const newUser  = { ...user, available: newAvail }
    setUser(newUser)

    try {
      await updateDoc(doc(db, 'users', user.uid), { available: newAvail })
      await set(ref(rtdb, `presence/${user.uid}/available`), newAvail)
      showToast(newAvail
        ? '✅ Tu es visible dans l\'arène'
        : '🔴 Tu apparais comme non disponible')
    } catch(e) {
      showToast('❌ Erreur mise à jour')
    }
  }

  const handleStatusMsg = async (msg) => {
    setUser(prev => ({ ...prev, statusMsg: msg }))
    try {
      await set(ref(rtdb, `presence/${user.uid}/statusMsg`), msg)
    } catch(e) {}
  }

  const handleSignOut = async () => {
    try {
      await set(ref(rtdb, `presence/${user.uid}`), { online: false })
      await signOut(auth)
      navigate('register')
    } catch(e) {
      showToast('❌ Erreur déconnexion')
    }
  }

  return (
    <div className="px-5 py-5">

      {/* Profile card */}
      <div style={{
        background:'linear-gradient(145deg,rgba(22,41,79,0.75),rgba(6,13,30,0.92))',
        border:'1px solid rgba(251,191,36,0.15)',
        borderRadius:'24px', padding:'22px',
        position:'relative', overflow:'hidden',
        marginBottom:'16px'
      }}>
        <div style={{
          position:'absolute', top:0, right:0,
          width:'130px', height:'130px', borderRadius:'50%',
          background:'radial-gradient(circle,rgba(251,191,36,0.08),transparent 70%)',
          transform:'translate(20%,-20%)', pointerEvents:'none'
        }}/>

        {/* Avatar + info */}
        <div style={{display:'flex',alignItems:'center',gap:'16px',marginBottom:'18px'}}>
          <div style={{
            width:'68px', height:'68px', borderRadius:'50%',
            background:'rgba(22,41,79,0.8)',
            border:'2px solid rgba(251,191,36,0.35)',
            boxShadow:'0 0 20px rgba(251,191,36,0.15)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'36px', flexShrink:0
          }}>
            {user.avatar}
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:'Cormorant Garamond, serif',
              fontWeight:600, fontSize:'26px',
              color:'#e8dfc8', lineHeight:1.1}}>
              {user.username}
            </div>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:'5px',
              background:'rgba(251,191,36,0.08)',
              border:'1px solid rgba(251,191,36,0.25)',
              borderRadius:'8px', padding:'3px 10px',
              fontSize:'11px', fontWeight:600,
              color:'#fbbf24', marginTop:'6px',
              fontFamily:'Jost'
            }}>
              ⚔️ {user.elo} ELO
            </div>
            <div style={{fontFamily:'Jost',fontSize:'12px',
              color:'rgba(251,191,36,0.4)',marginTop:'4px'}}>
              {user.country}
            </div>
          </div>

          {/* Logout */}
          <button onClick={handleSignOut} style={{
            width:'36px', height:'36px', borderRadius:'10px',
            background:'rgba(232,66,90,0.08)',
            border:'1px solid rgba(232,66,90,0.2)',
            color:'#fca5a5', fontSize:'16px',
            cursor:'pointer', flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>
            🚪
          </button>
        </div>

        <div style={{height:'1px',
          background:'linear-gradient(90deg,transparent,rgba(251,191,36,0.25),transparent)',
          marginBottom:'16px'}}/>

        {/* Availability toggle */}
        <button onClick={toggleAvail} style={{
          width:'100%', padding:'13px 16px',
          borderRadius:'14px', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          fontFamily:'Jost', fontSize:'14px', fontWeight:500,
          border: user.available
            ? '1.5px solid rgba(16,185,129,0.4)'
            : '1.5px solid rgba(232,66,90,0.35)',
          background: user.available
            ? 'rgba(16,185,129,0.06)'
            : 'rgba(232,66,90,0.06)',
          color: user.available ? '#6ee7b7' : '#fca5a5',
          transition:'all 0.3s'
        }}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{
              width:'10px', height:'10px', borderRadius:'50%',
              background: user.available ? '#10b981' : '#e8425a',
              boxShadow: user.available
                ? '0 0 8px #10b981' : '0 0 6px rgba(232,66,90,0.6)'
            }}/>
            {user.available ? 'Disponible pour jouer' : 'Non disponible'}
          </div>
          <span style={{fontSize:'12px',opacity:0.5}}>Modifier →</span>
        </button>

        {!user.available && (
          <input
            type="text"
            placeholder="💬 ex : Dispo à 20h Paris !"
            value={user.statusMsg || ''}
            onChange={e => handleStatusMsg(e.target.value)}
            style={{
              width:'100%', marginTop:'10px',
              padding:'12px 16px',
              background:'rgba(10,20,40,0.8)',
              border:'1px solid rgba(251,191,36,0.15)',
              borderRadius:'10px', color:'#e8dfc8',
              fontFamily:'Jost', fontSize:'13px', outline:'none'
            }}
          />
        )}
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',
        gap:'10px',marginBottom:'12px'}}>
        {[
          { val:user.wins,      label:'Victoires', color:'#6ee7b7' },
          { val:user.losses,    label:'Défaites',  color:'#f87171' },
          { val:winRate+'%',    label:'Win Rate',  color:'#fbbf24' },
        ].map(s => (
          <div key={s.label} style={{
            background:'linear-gradient(145deg,rgba(22,41,79,0.6),rgba(6,13,30,0.8))',
            border:'1px solid rgba(251,191,36,0.1)',
            borderRadius:'16px', padding:'16px 10px', textAlign:'center'
          }}>
            <div style={{fontFamily:'Cormorant Garamond, serif',
              fontWeight:700, fontSize:'32px',
              color:s.color, lineHeight:1}}>
              {s.val}
            </div>
            <div style={{fontFamily:'Jost',fontSize:'10px',
              color:'rgba(251,191,36,0.4)',
              textTransform:'uppercase',letterSpacing:'1.5px',marginTop:'4px'}}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',
        gap:'10px',marginBottom:'20px'}}>
        {[
          { label:'Points ELO',   val:user.elo,          color:'#fbbf24' },
          { label:'Série active', val:(user.streak||0)+'🔥', color:'#f87171' },
        ].map(s => (
          <div key={s.label} style={{
            background:'linear-gradient(145deg,rgba(22,41,79,0.6),rgba(6,13,30,0.8))',
            border:'1px solid rgba(251,191,36,0.1)',
            borderRadius:'16px', padding:'16px 12px'
          }}>
            <div style={{fontFamily:'Jost',fontSize:'10px',
              color:'rgba(251,191,36,0.4)',
              textTransform:'uppercase',letterSpacing:'1.5px',marginBottom:'6px'}}>
              {s.label}
            </div>
            <div style={{fontFamily:'Cormorant Garamond, serif',
              fontWeight:600, fontSize:'26px', color:s.color}}>
              {s.val}
            </div>
          </div>
        ))}
      </div>

      {/* Tournament teaser */}
      <div style={{fontFamily:'Cormorant Garamond, serif',
        fontWeight:600, fontSize:'14px',
        color:'rgba(251,191,36,0.7)',
        textTransform:'uppercase', letterSpacing:'2px',
        marginBottom:'12px'}}>
        ⚔️ Tournoi en cours
      </div>

      <div onClick={() => navigate('tournaments')} style={{
        padding:'20px',
        background:'linear-gradient(135deg,rgba(22,41,79,0.7),rgba(6,13,30,0.85))',
        border:'1px solid rgba(251,191,36,0.2)',
        borderRadius:'20px', cursor:'pointer',
        boxShadow:'0 4px 30px rgba(251,191,36,0.06)',
        marginBottom:'24px'
      }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:'5px',
          background:'rgba(251,191,36,0.08)',
          border:'1px solid rgba(251,191,36,0.25)',
          borderRadius:'8px', padding:'3px 10px',
          fontSize:'11px', fontWeight:600,
          color:'#fbbf24', marginBottom:'10px',
          fontFamily:'Jost'
        }}>
          🏆 Tournoi Mondial
        </div>
        <div style={{fontFamily:'Cormorant Garamond, serif',
          fontWeight:600, fontSize:'22px',
          color:'#e8dfc8', marginBottom:'4px'}}>
          Winter Cup 2025
        </div>
        <div style={{fontFamily:'Jost',fontSize:'12px',
          color:'rgba(251,191,36,0.45)'}}>
          32 joueurs · Quarts de finale · Tu es qualifié !
        </div>
        <div style={{
          marginTop:'12px', height:'4px',
          background:'rgba(251,191,36,0.08)',
          borderRadius:'2px', overflow:'hidden'
        }}>
          <div style={{
            width:'75%', height:'100%', borderRadius:'2px',
            background:'linear-gradient(90deg,#fbbf24,#e8425a)'
          }}/>
        </div>
        <div style={{fontFamily:'Jost',fontSize:'11px',
          color:'rgba(251,191,36,0.35)',marginTop:'6px'}}>
          75% du tournoi terminé
        </div>
      </div>

    </div>
  )
}
