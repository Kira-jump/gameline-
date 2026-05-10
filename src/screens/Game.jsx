import { useState, useEffect, useCallback, useRef } from 'react'
import { rtdb } from '../firebase'
import { ref, set, onValue, push, update } from 'firebase/database'

const ROWS = 6, COLS = 7

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0))
}

function checkWin(board, row, col, player) {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]]
  for (const [dr, dc] of dirs) {
    const cells = [[row, col]]
    for (let i = 1; i < 4; i++) {
      const r = row+dr*i, c = col+dc*i
      if (r<0||r>=ROWS||c<0||c>=COLS||board[r][c]!==player) break
      cells.push([r, c])
    }
    for (let i = 1; i < 4; i++) {
      const r = row-dr*i, c = col-dc*i
      if (r<0||r>=ROWS||c<0||c>=COLS||board[r][c]!==player) break
      cells.push([r, c])
    }
    if (cells.length >= 4) return cells
  }
  return null
}

function isDraw(board) {
  return board[0].every(c => c !== 0)
}

function topRow(board, col) {
  for (let r = ROWS-1; r >= 0; r--)
    if (board[r][col] === 0) return r
  return -1
}

export default function Game({ ctx }) {
  const { user, opponent, navigate, showToast } = ctx
  const opp = opponent || { name: 'IA', av: '🤖', uid: 'bot' }
  const isBot = !opponent || opponent.uid === 'bot'

  const [gameId, setGameId]       = useState(null)
  const [board, setBoard]         = useState(emptyBoard())
  const [currentTurn, setCurrentTurn] = useState(null)
  const [winCells, setWinCells]   = useState([])
  const [result, setResult]       = useState(null)
  const [scores, setScores]       = useState([0, 0])
  const [timeLeft, setTimeLeft]   = useState(30)
  const timerRef                  = useRef(null)

  // Détermine si c'est mon tour
  const isMyTurn = currentTurn === user.uid

  // Crée ou rejoint une partie Firebase
  useEffect(() => {
    if (isBot) return

    const gamesRef = ref(rtdb, 'games')
    const newGameRef = push(gamesRef)
    const gid = newGameRef.key

    const gameData = {
      gameId: gid,
      player1: { uid: user.uid, username: user.username, avatar: user.avatar },
      player2: { uid: opp.uid,  username: opp.username || opp.name, avatar: opp.avatar || opp.av },
      board: emptyBoard(),
      currentTurn: user.uid, // le créateur commence
      status: 'playing',
      winner: null,
      createdAt: Date.now(),
    }

    set(newGameRef, gameData)
    setGameId(gid)
    setCurrentTurn(user.uid)

    // Écoute la partie en temps réel
    const unsub = onValue(newGameRef, (snap) => {
      const data = snap.val()
      if (!data) return
      setBoard(data.board || emptyBoard())
      setCurrentTurn(data.currentTurn)
      if (data.status === 'finished' && data.winner) {
        setResult(data.winner === user.uid ? 1 : 2)
      }
    })

    return () => unsub()
  }, [])

  // Timer
  useEffect(() => {
    if (result !== null) { clearInterval(timerRef.current); return }
    clearInterval(timerRef.current)
    setTimeLeft(30)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          if (isMyTurn || isBot) endGame(isMyTurn ? 2 : 1)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [currentTurn, result])

  const endGame = useCallback((winner) => {
    setResult(winner)
    clearInterval(timerRef.current)
    setScores(prev => {
      const next = [...prev]
      if (winner === 1) next[0]++
      else if (winner === 2) next[1]++
      return next
    })

    // Mise à jour Firebase si multijoueur
    if (!isBot && gameId) {
      const gameRef = ref(rtdb, `games/${gameId}`)
      update(gameRef, {
        status: 'finished',
        winner: winner === 1 ? user.uid : opp.uid
      })
    }
  }, [isBot, gameId, user.uid, opp.uid])

  const drop = useCallback((col) => {
    if (result !== null) return
    if (!isBot && !isMyTurn) {
      showToast("⏳ C'est le tour de ton adversaire !")
      return
    }

    const r = topRow(board, col)
    if (r === -1) { showToast('Colonne pleine !'); return }

    const newBoard = board.map(row => [...row])
    newBoard[r][col] = 1 // toujours 1 = moi, 2 = adversaire/bot

    const win = checkWin(newBoard, r, col, 1)
    if (win) {
      setBoard(newBoard)
      setWinCells(win)
      setTimeout(() => endGame(1), 400)
      // Sync Firebase
      if (!isBot && gameId) {
        update(ref(rtdb, `games/${gameId}`), {
          board: newBoard,
          status: 'finished',
          winner: user.uid
        })
      }
      return
    }
    if (isDraw(newBoard)) {
      setBoard(newBoard)
      setTimeout(() => endGame(0), 300)
      return
    }

    if (isBot) {
      setBoard(newBoard)
      // Bot joue
      setTimeout(() => {
        const bc = bestCol(newBoard.map(r=>[...r]))
        const r2 = topRow(newBoard, bc)
        if (r2 === -1) return
        const b2 = newBoard.map(row => [...row])
        b2[r2][bc] = 2
        const win2 = checkWin(b2, r2, bc, 2)
        setBoard(b2)
        if (win2) { setWinCells(win2); setTimeout(() => endGame(2), 400); return }
        if (isDraw(b2)) { setTimeout(() => endGame(0), 300); return }
        setTimeLeft(30)
      }, 750)
    } else {
      // Multijoueur — envoie le coup à Firebase
      if (gameId) {
        update(ref(rtdb, `games/${gameId}`), {
          board: newBoard,
          currentTurn: opp.uid,
        })
      }
      setBoard(newBoard)
    }
  }, [board, result, isMyTurn, isBot, gameId, endGame, showToast])

  // Écoute les coups de l'adversaire (multijoueur)
  useEffect(() => {
    if (isBot || !gameId) return
    const gameRef = ref(rtdb, `games/${gameId}`)
    const unsub = onValue(gameRef, (snap) => {
      const data = snap.val()
      if (!data) return
      if (data.currentTurn === user.uid && data.board) {
        // Convertit le board Firebase (l'adversaire a joué en "1", on inverse)
        const remoteBoard = data.board
        // Affiche le board tel quel mais inverser les couleurs
        setBoard(remoteBoard)
        setCurrentTurn(data.currentTurn)
      }
    })
    return () => unsub()
  }, [gameId, isBot, user.uid])

  function bestCol(board) {
    for (let c=0;c<COLS;c++){const r=topRow(board,c);if(r===-1)continue;board[r][c]=2;const w=checkWin(board,r,c,2);board[r][c]=0;if(w)return c;}
    for (let c=0;c<COLS;c++){const r=topRow(board,c);if(r===-1)continue;board[r][c]=1;const w=checkWin(board,r,c,1);board[r][c]=0;if(w)return c;}
    for (const c of [3,2,4,1,5,0,6]) if(topRow(board,c)!==-1) return c
    return 0
  }

  const reset = () => {
    setBoard(emptyBoard())
    setCurrentTurn(user.uid)
    setWinCells([])
    setResult(null)
    setTimeLeft(30)
  }

  const isWinCell = (r, c) => winCells.some(([wr,wc]) => wr===r && wc===c)

  const myTurn = isBot ? true : isMyTurn

  return (
    <div className="px-4 py-4 flex flex-col gap-3">

      {/* HUD */}
      <div style={{display:'flex',alignItems:'center',
        justifyContent:'space-between',padding:'0 4px'}}>

        {/* P1 — Moi */}
        <div style={{display:'flex',flexDirection:'column',
          alignItems:'center',gap:'5px',flex:1}}>
          <div style={{
            width:'46px',height:'46px',borderRadius:'50%',
            background:'rgba(22,41,79,0.7)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',
            border:`2px solid ${myTurn&&result===null?'#e8425a':'rgba(232,66,90,0.3)'}`,
            boxShadow: myTurn&&result===null?'0 0 18px rgba(232,66,90,0.5)':'none',
            transition:'all 0.3s'
          }}>
            {user.avatar}
          </div>
          <div style={{fontFamily:'Jost',fontSize:'11px',
            color:'rgba(232,223,200,0.5)',fontWeight:500}}>
            {user.username}
          </div>
          <div style={{fontFamily:'Cormorant Garamond, serif',
            fontWeight:700,fontSize:'28px',color:'#f87171',lineHeight:1}}>
            {scores[0]}
          </div>
        </div>

        {/* Timer */}
        <div style={{textAlign:'center'}}>
          <div style={{
            fontFamily:'Cormorant Garamond, serif',
            fontWeight:700, fontSize:'36px',
            color: timeLeft<=10?'#f87171':'#e8dfc8',
            lineHeight:1, transition:'color 0.3s'
          }}>
            {result!==null ? '—' : timeLeft}
          </div>
          <div style={{fontFamily:'Jost',fontSize:'9px',
            color:'rgba(251,191,36,0.4)',
            textTransform:'uppercase',letterSpacing:'1.5px',marginTop:'2px'}}>
            {result!==null?'terminé':'sec'}
          </div>
          <div style={{fontSize:'18px',marginTop:'6px'}}>
            {myTurn ? '🔴' : '🟡'}
          </div>
        </div>

        {/* P2 — Adversaire */}
        <div style={{display:'flex',flexDirection:'column',
          alignItems:'center',gap:'5px',flex:1}}>
          <div style={{
            width:'46px',height:'46px',borderRadius:'50%',
            background:'rgba(22,41,79,0.7)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',
            border:`2px solid ${!myTurn&&result===null?'#fbbf24':'rgba(251,191,36,0.3)'}`,
            boxShadow: !myTurn&&result===null?'0 0 18px rgba(251,191,36,0.5)':'none',
            transition:'all 0.3s'
          }}>
            {opp.avatar || opp.av}
          </div>
          <div style={{fontFamily:'Jost',fontSize:'11px',
            color:'rgba(232,223,200,0.5)',fontWeight:500}}>
            {opp.username || opp.name}
          </div>
          <div style={{fontFamily:'Cormorant Garamond, serif',
            fontWeight:700,fontSize:'28px',color:'#fbbf24',lineHeight:1}}>
            {scores[1]}
          </div>
        </div>
      </div>

      {/* Board */}
      <div style={{
        background:'linear-gradient(160deg,rgba(15,30,58,0.95),rgba(6,13,30,0.98))',
        border:'1px solid rgba(251,191,36,0.18)',
        borderRadius:'22px', padding:'12px',
        position:'relative',
        boxShadow:'0 0 0 1px rgba(251,191,36,0.06),0 20px 60px rgba(0,0,0,0.5)'
      }}>

        {/* Col hints */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',
          gap:'6px',marginBottom:'6px'}}>
          {Array.from({length:COLS},(_,c)=>(
            <div key={c} onClick={()=>drop(c)} style={{
              height:'18px',borderRadius:'50%',cursor:'pointer',
              background:'transparent',transition:'all 0.15s'
            }}
            onMouseEnter={e=>{e.target.style.background=myTurn
              ?'rgba(232,66,90,0.2)':'rgba(251,191,36,0.15)'}}
            onMouseLeave={e=>{e.target.style.background='transparent'}}
            />
          ))}
        </div>

        {/* Cells */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'6px'}}>
          {board.map((row,r)=>row.map((cell,c)=>{
            const win = isWinCell(r,c)
            return (
              <div key={`${r}-${c}`} onClick={()=>drop(c)} style={{
                aspectRatio:'1', borderRadius:'50%',
                cursor:'pointer', transition:'all 0.15s',
                border:'1px solid rgba(251,191,36,0.07)',
                position:'relative', overflow:'hidden',
                background: cell===1
                  ? 'radial-gradient(circle at 38% 34%,#f87171,#e8425a 60%,#be123c)'
                  : cell===2
                  ? 'radial-gradient(circle at 38% 34%,#fde68a,#fbbf24 60%,#d97706)'
                  : 'rgba(6,13,30,0.9)',
                boxShadow: win&&cell===1
                  ? '0 0 20px #e8425a,0 0 40px rgba(232,66,90,0.4)'
                  : win&&cell===2
                  ? '0 0 20px #fbbf24,0 0 40px rgba(251,191,36,0.4)'
                  : cell===1 ? '0 0 10px rgba(232,66,90,0.3)'
                  : cell===2 ? '0 0 10px rgba(251,191,36,0.3)' : 'none',
                animation: cell!==0?'dropIn 0.3s cubic-bezier(0.34,1.56,0.64,1)':'none'
              }}>
                {cell!==0&&(
                  <div style={{
                    position:'absolute',inset:0,borderRadius:'50%',
                    background:'radial-gradient(circle at 32% 28%,rgba(255,255,255,0.12),transparent 55%)',
                    pointerEvents:'none'
                  }}/>
                )}
              </div>
            )
          }))}
        </div>

        {/* Result overlay */}
        {result!==null&&(
          <div style={{
            position:'absolute',inset:0,borderRadius:'22px',
            background:'rgba(3,6,15,0.88)',
            backdropFilter:'blur(16px)',
            display:'flex',flexDirection:'column',
            alignItems:'center',justifyContent:'center',
            gap:'10px',zIndex:5,
            animation:'fadeIn 0.4s ease'
          }}>
            <div style={{fontSize:'56px'}}>
              {result===1?'✨':result===2?'💀':'🤝'}
            </div>
            <div style={{
              fontFamily:'Cormorant Garamond, serif',
              fontWeight:700,fontSize:'40px',letterSpacing:'3px',
              background:'linear-gradient(135deg,#fcd34d,#fbbf24,#f59e0b)',
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'
            }}>
              {result===1?'VICTOIRE':result===2?'DÉFAITE':'ÉGALITÉ'}
            </div>
            <div style={{fontFamily:'Jost',fontSize:'13px',
              color:'rgba(251,191,36,0.5)'}}>
              {result===1?'+45 points ELO':result===2?'−20 points ELO':'+5 points ELO'}
            </div>
            <div style={{height:'1px',width:'80px',
              background:'linear-gradient(90deg,transparent,rgba(251,191,36,0.4),transparent)',
              margin:'4px 0'}}/>
            <div style={{display:'flex',gap:'12px',marginTop:'4px'}}>
              <button onClick={()=>navigate('lobby')} style={{
                padding:'11px 20px',borderRadius:'12px',
                background:'transparent',cursor:'pointer',
                color:'rgba(232,223,200,0.6)',
                fontFamily:'Jost',fontSize:'13px',fontWeight:500,
                border:'1px solid rgba(251,191,36,0.18)'
              }}>
                Quitter
              </button>
              <button onClick={reset} style={{
                padding:'11px 20px',borderRadius:'12px',cursor:'pointer',
                background:'linear-gradient(135deg,#fbbf24,#f59e0b,#d97706)',
                color:'#06090f',fontFamily:'Jost',
                fontSize:'13px',fontWeight:700,
                letterSpacing:'1px',textTransform:'uppercase',
                border:'none',
                boxShadow:'0 4px 20px rgba(251,191,36,0.3)'
              }}>
                Rejouer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Turn message */}
      <div style={{
        textAlign:'center',fontFamily:'Jost',fontSize:'13px',fontWeight:500,
        color: myTurn?'rgba(248,113,113,0.8)':'rgba(251,191,36,0.8)'
      }}>
        {result===null
          ? myTurn
            ? "🔴 C'est ton tour — joue !"
            : `🟡 Tour de ${opp.username||opp.name}…`
          : ''}
      </div>

      <style>{`
        @keyframes dropIn {
          from{transform:scale(0.18);opacity:0.3;}
          to{transform:scale(1);opacity:1;}
        }
        @keyframes fadeIn {
          from{opacity:0;}to{opacity:1;}
        }
      `}</style>
    </div>
  )
}
