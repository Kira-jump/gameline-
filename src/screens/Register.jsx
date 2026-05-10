import { useState } from 'react'
import { AVATARS } from '../data/players'
import { auth, db } from '../firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'

export default function Register({ ctx }) {
  const [mode, setMode]       = useState('login') // 'login' | 'signup'
  const [selected, setSelected] = useState('🦁')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    const email    = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value.trim()
    if (!email || !password) { ctx.showToast('✦ Remplis tous les champs !'); return }
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const snap = await getDoc(doc(db, 'users', cred.user.uid))
      if (snap.exists()) {
        ctx.setUser({ ...snap.data(), uid: cred.user.uid })
        ctx.showToast('✅ Bon retour !')
        ctx.navigate('home')
      }
    } catch(e) {
      if (e.code === 'auth/user-not-found')     ctx.showToast('❌ Compte introuvable')
      else if (e.code === 'auth/wrong-password') ctx.showToast('❌ Mot de passe incorrect')
      else if (e.code === 'auth/invalid-email')  ctx.showToast('❌ Email invalide')
      else if (e.code === 'auth/invalid-credential') ctx.showToast('❌ Email ou mot de passe incorrect')
      else ctx.showToast('❌ ' + e.message)
    }
    setLoading(false)
  }

  const handleSignup = async () => {
    const username = document.getElementById('username').value.trim()
    const email    = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value.trim()
    const country  = document.getElementById('country').value.trim()
    if (!username || !email || !password) { ctx.showToast('✦ Remplis tous les champs !'); return }
    if (password.length < 6) { ctx.showToast('✦ Mot de passe minimum 6 caractères'); return }
    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      const uid  = cred.user.uid
      const userData = {
        uid, username, email,
        country: country || 'Guinée 🇬🇳',
        avatar: selected,
        elo: 1000, wins: 0, losses: 0, streak: 0,
        available: true, statusMsg: '',
        createdAt: Date.now()
      }
      await setDoc(doc(db, 'users', uid), userData)
      ctx.setUser(userData)
      ctx.showToast('✅ Compte créé avec succès !')
      ctx.navigate('tutorial')
    } catch(e) {
      if (e.code === 'auth/email-already-in-use') ctx.showToast('❌ Email déjà utilisé')
      else if (e.code === 'auth/invalid-email')   ctx.showToast('❌ Email invalide')
      else ctx.showToast('❌ ' + e.message)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-8">

      {/* Logo */}
      <div className="text-center mb-8">
        <div style={{
          fontFamily:'Cormorant Garamond, serif',
          fontSize:'62px', fontWeight:700, lineHeight:1, letterSpacing:'3px',
          background:'linear-gradient(135deg,#fcd34d 0%,#fbbf24 40%,#f59e0b 70%,#fde68a 100%)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          filter:'drop-shadow(0 0 30px rgba(251,191,36,0.3))'
        }}>
          Game<br/>Line
        </div>
        <div style={{fontFamily:'Jost',fontSize:'11px',
          color:'rgba(251,191,36,0.4)',letterSpacing:'4px',
          textTransform:'uppercase',marginTop:'8px'}}>
          World Arena
        </div>
        <div style={{fontFamily:'Amiri, serif',fontSize:'18px',
          color:'rgba(251,191,36,0.3)',marginTop:'6px'}}>
          العالم يلعب
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{
        display:'flex', gap:'6px', padding:'5px',
        borderRadius:'16px', marginBottom:'20px', width:'100%',
        background:'rgba(10,20,40,0.7)',
        border:'1px solid rgba(251,191,36,0.1)'
      }}>
        {[
          { id:'login',  label:'Se connecter' },
          { id:'signup', label:'Créer un compte' },
        ].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            flex:1, padding:'11px',borderRadius:'11px',
            fontFamily:'Jost',fontSize:'13px',fontWeight:600,
            letterSpacing:'0.5px',cursor:'pointer',border:'none',
            transition:'all 0.25s',
            background: mode===m.id
              ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
              : 'transparent',
            color: mode===m.id ? '#06090f' : 'rgba(232,223,200,0.4)',
            boxShadow: mode===m.id ? '0 4px 16px rgba(251,191,36,0.25)' : 'none'
          }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Card */}
      <div style={{
        width:'100%',
        background:'linear-gradient(145deg,rgba(22,41,79,0.75),rgba(6,13,30,0.92))',
        border:'1px solid rgba(251,191,36,0.15)',
        borderRadius:'24px', padding:'28px'
      }}>

        {/* Avatar picker — signup only */}
        {mode === 'signup' && (
          <>
            <div style={{fontFamily:'Jost',fontSize:'11px',
              color:'rgba(251,191,36,0.5)',
              textTransform:'uppercase',letterSpacing:'2px',marginBottom:'12px'}}>
              Choisis ton avatar
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',
              gap:'10px',marginBottom:'20px'}}>
              {AVATARS.map(av => (
                <button key={av} onClick={() => setSelected(av)} style={{
                  aspectRatio:'1',borderRadius:'50%',fontSize:'26px',
                  cursor:'pointer',
                  background: selected===av ? 'rgba(251,191,36,0.08)' : 'rgba(22,41,79,0.6)',
                  border: selected===av ? '2px solid #fbbf24' : '2px solid rgba(251,191,36,0.1)',
                  boxShadow: selected===av ? '0 0 0 3px rgba(251,191,36,0.15)' : 'none',
                  transition:'all 0.2s',
                  display:'flex',alignItems:'center',justifyContent:'center'
                }}>
                  {av}
                </button>
              ))}
            </div>
            <div style={{height:'1px',
              background:'linear-gradient(90deg,transparent,rgba(251,191,36,0.3),transparent)',
              marginBottom:'20px'}}/>
          </>
        )}

        {/* Fields */}
        {mode === 'signup' && (
          <div style={{marginBottom:'14px'}}>
            <label style={{display:'block',fontFamily:'Jost',fontSize:'11px',
              color:'rgba(251,191,36,0.5)',textTransform:'uppercase',
              letterSpacing:'2px',marginBottom:'7px'}}>
              Username
            </label>
            <input id="username" type="text" placeholder="ex: ShadowPlayer42" style={{
              width:'100%',padding:'13px 18px',
              background:'rgba(10,20,40,0.8)',
              border:'1px solid rgba(251,191,36,0.18)',
              borderRadius:'12px',color:'#e8dfc8',
              fontFamily:'Jost',fontSize:'15px',outline:'none'
            }}/>
          </div>
        )}

        <div style={{marginBottom:'14px'}}>
          <label style={{display:'block',fontFamily:'Jost',fontSize:'11px',
            color:'rgba(251,191,36,0.5)',textTransform:'uppercase',
            letterSpacing:'2px',marginBottom:'7px'}}>
            Email
          </label>
          <input id="email" type="email" placeholder="ton@email.com" style={{
            width:'100%',padding:'13px 18px',
            background:'rgba(10,20,40,0.8)',
            border:'1px solid rgba(251,191,36,0.18)',
            borderRadius:'12px',color:'#e8dfc8',
            fontFamily:'Jost',fontSize:'15px',outline:'none'
          }}/>
        </div>

        <div style={{marginBottom: mode==='signup' ? '14px' : '20px'}}>
          <label style={{display:'block',fontFamily:'Jost',fontSize:'11px',
            color:'rgba(251,191,36,0.5)',textTransform:'uppercase',
            letterSpacing:'2px',marginBottom:'7px'}}>
            Mot de passe
          </label>
          <input id="password" type="password" placeholder="minimum 6 caractères" style={{
            width:'100%',padding:'13px 18px',
            background:'rgba(10,20,40,0.8)',
            border:'1px solid rgba(251,191,36,0.18)',
            borderRadius:'12px',color:'#e8dfc8',
            fontFamily:'Jost',fontSize:'15px',outline:'none'
          }}/>
        </div>

        {mode === 'signup' && (
          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block',fontFamily:'Jost',fontSize:'11px',
              color:'rgba(251,191,36,0.5)',textTransform:'uppercase',
              letterSpacing:'2px',marginBottom:'7px'}}>
              Pays
            </label>
            <input id="country" type="text" placeholder="Guinée 🇬🇳" style={{
              width:'100%',padding:'13px 18px',
              background:'rgba(10,20,40,0.8)',
              border:'1px solid rgba(251,191,36,0.18)',
              borderRadius:'12px',color:'#e8dfc8',
              fontFamily:'Jost',fontSize:'15px',outline:'none'
            }}/>
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={mode==='login' ? handleLogin : handleSignup}
          disabled={loading}
          style={{
            display:'block',width:'100%',padding:'15px',
            background: loading
              ? 'rgba(251,191,36,0.3)'
              : 'linear-gradient(135deg,#fbbf24,#f59e0b,#d97706)',
            color:'#06090f',fontFamily:'Jost',
            fontSize:'15px',fontWeight:700,
            letterSpacing:'1.5px',textTransform:'uppercase',
            border:'none',borderRadius:'12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow:'0 4px 20px rgba(251,191,36,0.3)',
            position:'relative',overflow:'hidden'
          }}>
          {loading
            ? 'Chargement...'
            : mode==='login'
            ? 'Se connecter →'
            : 'Créer mon profil →'}
        </button>

        {/* Forgot password */}
        {mode === 'login' && (
          <div style={{textAlign:'center',marginTop:'16px'}}>
            <span style={{fontFamily:'Jost',fontSize:'12px',
              color:'rgba(251,191,36,0.35)',cursor:'pointer'}}>
              Mot de passe oublié ?
            </span>
          </div>
        )}

      </div>
    </div>
  )
}
