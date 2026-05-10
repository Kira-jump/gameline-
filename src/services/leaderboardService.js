import { db } from '../firebase'
import {
  collection, query, orderBy, limit,
  onSnapshot, doc, updateDoc, increment, getDoc
} from 'firebase/firestore'

// Écouter le leaderboard en temps réel
export function listenLeaderboard(callback) {
  const q = query(
    collection(db, 'users'),
    orderBy('elo', 'desc'),
    limit(50)
  )
  return onSnapshot(q, (snap) => {
    const players = snap.docs.map((d, i) => ({
      ...d.data(),
      rank: i + 1
    }))
    callback(players)
  })
}

// Mettre à jour ELO après une partie
export async function updateElo(winnerId, loserId) {
  const K = 32
  const winnerSnap = await getDoc(doc(db, 'users', winnerId))
  const loserSnap  = await getDoc(doc(db, 'users', loserId))
  if (!winnerSnap.exists() || !loserSnap.exists()) return

  const winnerElo = winnerSnap.data().elo || 1000
  const loserElo  = loserSnap.data().elo  || 1000

  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400))
  const expectedLoser  = 1 - expectedWinner

  const newWinnerElo = Math.round(winnerElo + K * (1 - expectedWinner))
  const newLoserElo  = Math.round(loserElo  + K * (0 - expectedLoser))

  await updateDoc(doc(db, 'users', winnerId), {
    elo:    newWinnerElo,
    wins:   increment(1),
    streak: increment(1),
  })

  await updateDoc(doc(db, 'users', loserId), {
    elo:    newLoserElo,
    losses: increment(1),
    streak: 0,
  })

  return { newWinnerElo, newLoserElo }
}
