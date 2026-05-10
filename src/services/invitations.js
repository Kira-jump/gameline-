import { rtdb } from '../firebase'
import { ref, push, onValue, remove, update } from 'firebase/database'

export function sendInvitation(fromUser, toUid) {
  const invRef = ref(rtdb, `invitations/${toUid}`)
  return push(invRef, {
    fromUid:      fromUser.uid,
    fromUsername: fromUser.username,
    fromAvatar:   fromUser.avatar,
    fromElo:      fromUser.elo,
    status:       'pending',
    timestamp:    Date.now(),
  })
}

export function listenInvitations(uid, callback) {
  const invRef = ref(rtdb, `invitations/${uid}`)
  return onValue(invRef, (snap) => {
    const data = snap.val()
    if (!data) { callback(null); return }
    const invites = Object.entries(data).map(([id, val]) => ({ id, ...val }))
    const pending = invites.find(i => i.status === 'pending')
    callback(pending || null)
  })
}

export function removeInvitation(toUid, invitationId) {
  const invRef = ref(rtdb, `invitations/${toUid}/${invitationId}`)
  return remove(invRef)
}
