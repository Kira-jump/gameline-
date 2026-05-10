import { useState, useEffect, useRef } from 'react'
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

function bestCol(board) {
  for (let c=0;c<COLS;c++){const r=topRow(board,c);if(r===-1)continue;board[r][c]=2;const w=checkWin(board,r,c,2);board[r][c]=0;if(w)return c;}
  for (let c=0;c<COLS;c++){const r=topRow(board,c);if(r===-1)continue;board[r][c]=1;const w=checkWin(board,r,c,1);board[r][c]=0;if(w)return c;}
  for (const c of [3,2,4,1,5,0,6]) if(topRow(board,c)!==-1) return c
  return 0
}

export default function Game({ ctx }) {
  const { user, opponent, navigate, showToast } = ctx
  const opp    = opponent || { name:'IA', av:'🤖', uid:'bot' }
  const isBot  = !opponent || opponent.uid === 'bot'
  const isHost = !isBot && user.uid < opp.uid

  const [gameId, setGameId]         = useState(null)
  const [board, setBoard]           = useState(emptyBoard())
  const [currentTurn, setCurrentTurn] = useState(null)
  const [winCells, setWinCells]     = useState([])
  const [result, setResult]         = useState(null)
  const [scores, setScores]         = useState([0,0])
  const [timeLeft, setTimeLeft]     = useState(30)
  const timerRef                    = useRef(null)
  const gameRef                     = useRef(null)

  // Crée ou rejoint la partie
  useEffect(() => {
    if (isBot) {
      setCurrentTurn(user.uid)
      return
    }

    // L'hôte crée la partie
    if (isHost) {
      const newRef = push(ref(rtdb, 'games'))
      const gid = newRef.key
      setGameId(gid)
      gameRef.current = newRef

      const gameData = {
        gameId: gid,
        hostUid:   user.uid,
        guestUid:  opp.uid,
        host:   { uid:user.uid, username:user.username, avatar:user.avatar },
        guest:  { uid:opp.uid,  username:opp.username||opp.name, avatar:opp.avatar||opp.av },
        board:  emptyBoard(),
        currentTurn: user.uid,
        status: 'playing',
        winner: null,
        createdAt: Date.now(),
      }
      set(newRef, gameData)

      // Partage le gameId avec l'adversaire
      set(ref(rtdb, `gameInvite/${opp.uid}`), { gameId: gid, from: user.uid })

    } else {
      // Le guest attend le gameId de l'hôte
      const invRef = ref(rtdb, `gameInvite/${user.uid}`)
      const unsub = onValue(invRef, (snap) => {
        const data = snap.val()
        if (!data || !data.gameId) return
        setGameId(data.gameId)
        gameRef.current = ref(rtdb, `games/${data.gameId}`)
      })
      return () => unsub()
    }
  }, [])

  // Écoute la partie Firebase
  useEffect(() => {
    if (isBot || !gameId) return
    const gRef = ref(rtdb, `games/${gameId}`)
    const unsub = onValue(gRef, (snap) => {
      const data = snap.val()
      if (!data) return
      setBoard(data.board || emptyBoard())
      setCurrentTurn(data.currentTurn)
      if (data.status === 'finished') {
        if (data.winner === user.uid) setResult(1)
        else if (data.winner === 'draw') setResult(0)
        else setResult(2)
      }
    })
    return () => unsub()
  }, [gameId])

  const isMyTurn = isBot ? true : currentTurn === user.uid

  // Timer
  useEffect(() => {
    if (result !== null) { clearInterval(timerRef.current); return }
    clearInterval(timerRef.current)
    setTimeLeft(30)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          // Temps écoulé = défaite pour celui qui devait jouer
          if (isMyTurn) endGame(2)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [currentTurn, result])

  const endGame = (winner) => {
    setResult(winner)
    clearInterval(timerRef.current)
    setScores(prev => {
      const next = [...prev]
      if (winner===1) next[0]++
      else if (winner===2) next[1]++
      return next
    })
    if (!isBot && gameId) {
      update(ref(rtdb, `games/${gameId}`), {
        status: 'finished',
        winner: winner===1 ? user.uid : winner===2 ? opp.uid : 'draw'
      })
    }
  }

  const drop = (col) => {
    if (result !== null) return
    if (!isMyTurn) {
      showToast("⏳ C'est le tour de ton adversaire !")
      return
    }
    const r = topRow(board, col)
    if (r === -1) { showToast('Colonne pleine !'); return }

    const newBoard = board.map(row => [...row])
    newBoard[r][col] = 1

    const win = checkWin(newBoard, r, col, 1)
    if (win) {
      setBoard(newBoard)
      setWinCells(win)
      if (!isBot && gameId) {
        update(ref(rtdb, `games/${gameId}`), {
          board: newBoard, status:'finished', winner: user.uid
        })
      }
      setTimeout(() => endGame(1), 400)
      return
    }
    if (isDraw(newBoard)) {
      setBoard(newBoard)
      if (!isBot && gameId) {
        update(ref(rtdb, `games/${gameId}`), {
          board: newBoard, status:'finished', winner:'draw'
        })
      }
      setTimeout(() => endGame(0), 300)
      return
    }

    if (isBot) {
      setBoard(newBoard)
      setTimeout(() => {
        const bc = bestCol(newBoard.map(r=>[...r]))
        const r2 = topRow(newBoard, bc)
        if (r2===-1) return
        const b2 = newBoard.map(row=>[...row])
        b2[r2][bc] = 2
        const win2 = checkWin(b2, r2, bc, 2)
        setBoard(b2)
        if (win2) { setWinCells(win2); setTimeout(()=>endGame(2),400); return }
        if (isDraw(b2)) { setTimeout(()=>endGame(0),300); return }
        setTimeLeft(30)
      }, 750)
    } else {
      // Multijoueur — envoie à Firebase
      update(ref(rtdb, `games/${gameId}`), {
        board: newBoard,
        currentTurn: opp.uid,
      })
    }
  }

  const reset = () => {
    setBoard(emptyBoard())
    setCurrentTurn(user.uid)
    setWinCells([])
    setResult(null)
    setTimeLeft(30)
    if (!isBot && gameId) {
      update(ref(rtdb, `games/${gameId}`), {
        board: emptyBoard(),
        currentTurn: user.uid,
        status: 'playing',
        winner: null,
      })
    }
  }

  const isWinCell = (r,c) => winCells.some(([wr,wc])=>wr===r&&wc===c)

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      {/* HUD */}
      <div style={{display:'flex',alignItems:'center',
        justifyContent:'space-between',padding:'0 4px'}}>
        <div style={{display:'flex',flexDirection:'column',
          alignItems:'center',gap:'5px',flex:1}}>
          <div style={{width:'46px',height:'46px',borderRadius:'50%',
            background:'rgba(22,41,79,0.7)',fontSize:'24px',
            display:'flex',alignItems:'center',justifyContent:'center',
            border:`2px solid ${isMyTurn&&result===null?'#e8425a':'rgba(232,66,90,0.3)'}`,
            boxShadow:isMyTurn&&result===null?'0 0 18px rgba(232,66,90,0.5)':'none',
            transition:'all 0.3s'}}>
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

        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:'Cormorant Garamond, serif',
            fontWeight:700,fontSize:'36px',lineHeight:1,transition:'color 0.3s',
            color:timeLeft<=10?'#f87171':'#e8dfc8'}}>
            {result!==null?'—':timeLeft}
          </div>
          <div style={{fontFamily:'Jost',fontSize:'9px',
            color:'rgba(251,191,36,0.4)',
            textTransform:'uppercase',letterSpacing:'1.5px',marginTop:'2px'}}>
            {result!==null?'terminé':'sec'}
          </div>
          <div style={{fontSize:'18px',marginTop:'6px'}}>
            {isMyTurn?'🔴':'🟡'}
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',
          alignItems:'center',gap:'5px',flex:1}}>
          <div style={{width:'46px',height:'46px',borderRadius:'50%',
            background:'rgba(22,41,79,0.7)',fontSize:'24px',
            display:'flex',alignItems:'center',justifyContent:'center',
            border:`2px solid ${!isMyTurn&&result===null?'#fbbf24':'rgba(251,191,36,0.3)'}`,
            boxShadow:!isMyTurn&&result===null?'0 0 18px rgba(251,191,36,0.5)':'none',
            transition:'all 0.3s'}}>
            {opp.avatar||opp.av}
          </div>
          <div style={{fontFamily:'Jost',fontSize:'11px',
            color:'rgba(232,223,200,0.5)',fontWeight:500}}>
            {opp.username||opp.name}
          </div>
          <div style={{fontFamily:'Cormorant Garamond, serif',
            fontWeight:700,fontSize:'28px',color:'#fbbf24',lineHeight:1}}>
            {scores[1]}
          </div>
        </div>
      </div>

      {/* Board */}
      <div style={{background:'linear-gradient(160deg,rgba(15,30,58,0.95),rgba(6,13,30,0.98))',
        border:'1px solid rgba(251,191,36,0.18)',borderRadius:'22px',padding:'12px',
        position:'relative',boxShadow:'0 0 0 1px rgba(251,191,36,0.06),0 20px 60px rgba(0,0,0,0.5)'}}>

        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',
          gap:'6px',marginBottom:'6px'}}>
          {Array.from({length:COLS},(_,c)=>(
            <div key={c} onClick={()=>drop(c)} style={{height:'18px',
              borderRadius:'50%',cursor:'pointer',background:'transparent',
              transition:'all 0.15s'}}
              onMouseEnter={e=>{e.target.style.background=isMyTurn
                ?'rgba(232,66,90,0.2)':'rgba(251,191,36,0.1)'}}
              onMouseLeave={e=>{e.target.style.background='transparent'}}
            />
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'6px'}}>
          {board.map((row,r)=>row.map((cell,c)=>{
            const win=isWinCell(r,c)
            return (
              <div key={`${r}-${c}`} onClick={()=>drop(c)} style={{
                aspectRatio:'1',borderRadius:'50%',cursor:'pointer',
                border:'1px solid rgba(251,191,36,0.07)',
                position:'relative',overflow:'hidden',
                background:cell===1
                  ?'radial-gradient(circle at 38% 34%,#f87171,#e8425a 60%,#be123c)'
                  :cell===2
                  ?'radial-gradient(circle at 38% 34%,#fde68a,#fbbf24 60%,#d97706)'
                  :'rgba(6,13,30,0.9)',
                boxShadow:win&&cell===1
                  ?'0 0 20px #e8425a,0 0 40px rgba(232,66,90,0.4)'
                  :win&&cell===2
                  ?'0 0 20px #fbbf24,0 0 40px rgba(251,191,36,0.4)'
                  :cell===1?'0 0 10px rgba(232,66,90,0.3)'
                  :cell===2?'0 0 10px rgba(251,191,36,0.3)':'none',
                animation:cell!==0?'dropIn 0.3s cubic-bezier(0.34,1.56,0.64,1)':'none'}}>
                {cell!==0&&(
                  <div style={{position:'absolute',inset:0,borderRadius:'50%',
                    background:'radial-gradient(circle at 32% 28%,rgba(255,255,255,0.12),transparent 55%)',
                    pointerEvents:'none'}}/>
                )}
              </div>
            )
          }))}
        </div>

        {result!==null&&(
          <div style={{position:'absolute',inset:0,borderRadius:'22px',
            background:'rgba(3,6,15,0.88)',backdropFilter:'blur(16px)',
            display:'flex',flexDirection:'column',alignItems:'center',
            justifyContent:'center',gap:'10px',zIndex:5,animation:'fadeIn 0.4s ease'}}>
            <div style={{fontSize:'56px'}}>
              {result===1?'✨':result===2?'💀':'🤝'}
            </div>
            <div style={{fontFamily:'Cormorant Garamond, serif',fontWeight:700,
              fontSize:'40px',letterSpacing:'3px',
              background:'linear-gradient(135deg,#fcd34d,#fbbf24,#f59e0b)',
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              {result===1?'VICTOIRE':result===2?'DÉFAITE':'ÉGALITÉ'}
            </div>
            <div style={{fontFamily:'Jost',fontSize:'13px',
              color:'rgba(251,191,36,0.5)'}}>
              {result===1?'+45 pts ELO':result===2?'−20 pts ELO':'+5 pts ELO'}
            </div>
            <div style={{height:'1px',width:'80px',margin:'4px 0',
              background:'linear-gradient(90deg,transparent,rgba(251,191,36,0.4),transparent)'}}/>
            <div style={{display:'flex',gap:'12px',marginTop:'4px'}}>
              <button onClick={()=>navigate('lobby')} style={{
                padding:'11px 20px',borderRadius:'12px',background:'transparent',
                cursor:'pointer',color:'rgba(232,223,200,0.6)',fontFamily:'Jost',
                fontSize:'13px',fontWeight:500,
                border:'1px solid rgba(251,191,36,0.18)'}}>
                Quitter
              </button>
              <button onClick={reset} style={{
                padding:'11px 20px',borderRadius:'12px',cursor:'pointer',
                background:'linear-gradient(135deg,#fbbf24,#f59e0b,#d97706)',
                color:'#06090f',fontFamily:'Jost',fontSize:'13px',fontWeight:700,
                letterSpacing:'1px',textTransform:'uppercase',border:'none',
                boxShadow:'0 4px 20px rgba(251,191,36,0.3)'}}>
                Rejouer
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{textAlign:'center',fontFamily:'Jost',fontSize:'13px',fontWeight:500,
        color:isMyTurn?'rgba(248,113,113,0.8)':'rgba(251,191,36,0.8)'}}>
        {result===null
          ?isMyTurn
            ?"🔴 C'est ton tour — joue !"
            :`🟡 Tour de ${opp.username||opp.name}…`
          :''}
      </div>

      <style>{`
        @keyframes dropIn{from{transform:scale(0.18);opacity:0.3;}to{transform:scale(1);opacity:1;}}
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
      `}</style>
    </div>
  )
}
