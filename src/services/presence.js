import { rtdb } from '../firebase'
import { ref, set, onValue, onDisconnect } from 'firebase/database'

export async function setPresence(uid, userData) {
  try {
    const presenceRef = ref(rtdb, `presence/${uid}`)
    const data = {
      uid,
      username: userData.username || 'Player',
      avatar:   userData.avatar   || '🦁',
      country:  userData.country  || '',
      elo:      userData.elo      || 1000,
      wins:     userData.wins     || 0,
      available:  userData.available !== false ? true : false,
      statusMsg:  userData.statusMsg  || '',
      online:     true,
    }
    onDisconnect(presenceRef).update({ online: false, available: false })
    await set(presenceRef, data)
    console.log('✅ Presence set for', uid)
  } catch(e) {
    console.error('❌ Presence error:', e)
  }
}

export function listenToPlayers(callback) {
  const presenceRef = ref(rtdb, 'presence')
  return onValue(presenceRef, (snap) => {
    const data = snap.val()
    console.log('👥 Presence data:', data)
    if (!data) { callback([]); return }
    const players = Object.values(data).filter(p => p.online === true)
    console.log('👥 Online players:', players)
    callback(players)
  }, (error) => {
    console.error('❌ Presence listen error:', error)
    callback([])
  })
}
