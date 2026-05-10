import { db } from '../firebase'
import {
  collection, doc, setDoc, getDoc, getDocs,
  updateDoc, onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'

export async function createTournament(data) {
  const ref = doc(collection(db, 'tournaments'))
  await setDoc(ref, {
    id: ref.id,
    name: data.name,
    description: data.description,
    maxPlayers: data.maxPlayers,
    startDate: data.startDate,
    status: 'open',
    players: [],
    matches: [],
    createdAt: Date.now(),
  })
  return ref.id
}

export async function joinTournament(tournamentId, user) {
  const ref = doc(db, 'tournaments', tournamentId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Tournoi introuvable')
  const data = snap.data()
  if (data.players.length >= data.maxPlayers) throw new Error('Tournoi complet')
  if (data.players.find(p => p.uid === user.uid)) throw new Error('Déjà inscrit')
  await updateDoc(ref, {
    players: [...data.players, {
      uid: user.uid,
      username: user.username,
      avatar: user.avatar,
      elo: user.elo,
    }]
  })
}

export async function leaveTournament(tournamentId, uid) {
  const ref = doc(db, 'tournaments', tournamentId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data = snap.data()
  await updateDoc(ref, {
    players: data.players.filter(p => p.uid !== uid)
  })
}

export function listenTournaments(callback) {
  const q = query(collection(db, 'tournaments'))
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    callback(data)
  }, (error) => {
    console.error('Firestore error:', error)
    callback([])
  })
}

export function listenTournament(tournamentId, callback) {
  return onSnapshot(doc(db, 'tournaments', tournamentId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() })
  })
}

export async function generateBracket(tournamentId) {
  const ref  = doc(db, 'tournaments', tournamentId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const { players } = snap.data()
  const shuffled = [...players].sort(() => Math.random() - 0.5)
  const matches  = []
  for (let i = 0; i < shuffled.length - 1; i += 2) {
    matches.push({
      id: `match_${i}`,
      round: 1,
      player1: shuffled[i],
      player2: shuffled[i+1] || null,
      score1: 0, score2: 0,
      status: 'pending',
      winner: null,
    })
  }
  await updateDoc(ref, { matches, status: 'started' })
}

export async function updateMatchScore(tournamentId, matchId, score1, score2, winner) {
  const ref  = doc(db, 'tournaments', tournamentId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data    = snap.data()
  const matches = data.matches.map(m =>
    m.id === matchId
      ? { ...m, score1, score2, winner, status: 'finished' }
      : m
  )
  await updateDoc(ref, { matches })
}
