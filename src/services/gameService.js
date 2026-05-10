import { rtdb } from '../firebase'
import { ref, set, onValue, push } from 'firebase/database'

export function createGame(player1, player2) {
  const gameRef = push(ref(rtdb, 'games'))
  const gameId  = gameRef.key
  const emptyBoard = Array.from({ length: 6 }, () => Array(7).fill(0))
  set(gameRef, {
    gameId,
    player1: { uid: player1.uid, username: player1.username, avatar: player1.avatar },
    player2: { uid: player2.uid, username: player2.username, avatar: player2.avatar },
    board: emptyBoard,
    currentTurn: player1.uid,
    status: 'playing',
    winner: null,
    createdAt: Date.now(),
  })
  return gameId
}

export function listenGame(gameId, callback) {
  const gameRef = ref(rtdb, `games/${gameId}`)
  return onValue(gameRef, (snap) => callback(snap.val()))
}

export function endGame(gameId, winnerUid) {
  return update(ref(rtdb, `games/${gameId}`), { status: 'finished', winner: winnerUid })
}
