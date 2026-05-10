import { useState, useEffect } from 'react'
import { auth, db } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

import Register from './screens/Register'
import Tutorial from './screens/Tutorial'
import Home from './screens/Home'
import Lobby from './screens/Lobby'
import Game from './screens/Game'
import Leaderboard from './screens/Leaderboard'
import Tournaments from './screens/Tournaments'
import TopBar from './components/TopBar'
import BottomNav from './components/BottomNav'
import Toast from './components/Toast'

export default function App() {
  const [screen, setScreen]   = useState('register')
  const [toast, setToast]     = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser]       = useState({
    avatar: '🦁', username: 'Player',
    country: 'France 🇫🇷', available: true,
    statusMsg: '', elo: 1000,
    wins: 0, losses: 0, streak: 0,
  })
  const [opponent, setOpponent] = useState(null)

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (snap.exists()) {
            setUser({ ...snap.data(), uid: firebaseUser.uid })
            setScreen('home')
          } else {
            setScreen('register')
          }
        } catch (e) {
          setScreen('register')
        }
      } else {
        setScreen('register')
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  const navigate = (s) => setScreen(s)

  const ctx = { user, setUser, opponent, setOpponent, navigate, showToast }

  const showNav = !['register','tutorial','loading'].includes(screen)

  if (loading) return (
    <div style={{
      height:'100vh', display:'flex',
      flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:'#03060f'
    }}>
      <div style={{
        fontFamily:'Cormorant Garamond, serif',
        fontSize:'52px', fontWeight:700,
        background:'linear-gradient(135deg,#fcd34d,#fbbf24,#f59e0b)',
        WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
        marginBottom:'24px'
      }}>
        GameLine
      </div>
      <div style={{
        width:'40px', height:'40px', borderRadius:'50%',
        border:'3px solid rgba(251,191,36,0.2)',
        borderTopColor:'#fbbf24',
        animation:'spin 0.8s linear infinite'
      }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div className="relative flex flex-col h-screen w-full max-w-[430px] mx-auto overflow-hidden"
      style={{background:'#03060f', color:'#e8dfc8'}}>

      {/* Ambient BG */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background:`
          radial-gradient(ellipse 80% 60% at 50% 0%, rgba(22,41,79,0.6) 0%, transparent 65%),
          radial-gradient(ellipse 60% 50% at 10% 90%, rgba(251,191,36,0.04) 0%, transparent 55%)`
      }}/>

      {/* Grid texture */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage:`
          linear-gradient(rgba(251,191,36,0.025) 1px,transparent 1px),
          linear-gradient(90deg,rgba(251,191,36,0.025) 1px,transparent 1px)`,
        backgroundSize:'48px 48px'
      }}/>

      <div className="relative z-10 flex flex-col h-full">
        {showNav && <TopBar ctx={ctx} />}

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {screen === 'register'    && <Register    ctx={ctx} />}
          {screen === 'tutorial'    && <Tutorial    ctx={ctx} />}
          {screen === 'home'        && <Home        ctx={ctx} />}
          {screen === 'lobby'       && <Lobby       ctx={ctx} />}
          {screen === 'game'        && <Game        ctx={ctx} />}
          {screen === 'leaderboard' && <Leaderboard ctx={ctx} />}
          {screen === 'tournaments' && <Tournaments ctx={ctx} />}
        </div>

        {showNav && <BottomNav screen={screen} navigate={navigate} />}
      </div>

      <Toast message={toast} />
    </div>
  )
}
