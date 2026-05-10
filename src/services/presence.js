import { rtdb, db } from '../firebase'
import { ref, set, onValue, onDisconnect, serverTimestamp } from 'firebase/database'
import { doc, updateDoc } from 'firebase/firestore'

export function setPresence(uid, userData) {
  const presenceRef = ref(rtdb, `presence/${uid}`)
  const data = {
    uid,
    username: userData.username,
    avatar: userData.avatar,
    country: userData.country,
    elo: userData.elo,
    wins: userData.wins,
    available: userData.available,
    statusMsg: userData.statusMsg || '',
    online: true,
  }
  onDisconnect(presenceRef).update({ online: false, available: false })
  return set(presenceRef, data)
}

export function listenToPlayers(callback) {
  const presenceRef = ref(rtdb, 'presence')
  return onValue(presenceRef, (snap) => {
    const data = snap.val()
    if (!data) { callback([]); return }
    const players = Object.values(data).filter(p => p.online)
    callback(players)
  })
}
