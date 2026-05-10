import { useState, useEffect, useRef } from 'react'
import { listenToPlayers } from '../services/presence'
import { listenInvitations } from '../services/invitations'
import { rtdb } from '../firebase'
import { ref, push, set, onValue } from 'firebase/database'
import InviteModal from '../components/InviteModal'
import IncomingInvite from '../components/IncomingInvite'

export default function Lobby({ ctx }) {
  const { user, navigate, showToast, setOpponent } = ctx
  const [tab, setTab]           = useState('available')
  const [search, setSearch]     = useState('')
  const [players, setPlayers]   = useState([])
  const [selected, setSelected] = useState(null)
  const [incoming, setIncoming] = useState(null)
  const [waiting, setWaiting]   = useState(false)
  const unsubAccept             = useRef(null)

  useEffect(() => {
    const unsub = listenToPlayers((all) => {
      setPlayers(all.filter(p => p.uid !== user.uid))
    })
    return () => unsub()
  }, [user.uid])

  useEffect(() => {
    if (!user.uid) return
    const unsub = listenInvitations(user.uid, (inv) => {
      setIncoming(inv)
    })
    return () => unsub()
  }, [user.uid])

  const listenForAccept = (toUid, invKey, opponent) => {
    const invRef = ref(rtdb, `invitations/${toUid}/${invKey}`)
    unsubAccept.current = onValue(invRef, (snap) => {
      const data = snap.val()
      if (!data) return
      if (data.status === 'accepted') {
        setWaiting(false)
        setOpponent(opponent)
        navigate('game')
      } else if (data.status === 'declined') {
        setWaiting(false)
        showToast(`❌ ${opponent.username} a refusé`)
      }
    })
  }

  const handleInvite = async (player) => {
    try {
      setSelected(null)
      setWaiting(true)
      const invitesRef = ref(rtdb, `invitations/${player.uid}`)
      const newInvRef  = push(invitesRef)
      await set(newInvRef, {
        fromUid: user.uid, fromUsername: user.username,
        fromAvatar: user.avatar, fromElo: user.elo,
        status: 'pending', timestamp: Date.now(),
      })
      showToast(`📨 Invitation envoyée à ${player.username}…`)
      listenForAccept(player.uid, newInvRef.key, {
        uid: player.uid, username: player.username,
        avatar: player.avatar, name: player.username,
        av: player.avatar, elo: player.elo,
      })
      setTimeout(() => {
        setWaiting(false)
        if (unsubAccept.current) unsubAccept.current()
        showToast('⏰ Invitation expirée')
      }, 30000)
    } catch(e) {
      setWaiting(false)
      showToast('❌ Erreur envoi invitation')
    }
  }

  const handleAccept = async () => {
    if (!incoming) return
    const invRef = ref(rtdb, `invitations/${user.uid}/${incoming.id}`)
    await set(invRef, { ...incoming, status: 'accepted' })
    setOpponent({
      uid: incoming.fromUid, username: incoming.fromUsername,
      name: incoming.fromUsername, avatar: incoming.fromAvatar,
      av: incoming.fromAvatar, elo: incoming.fromElo,
    })
    setIncoming(null)
    navigate('game')
  }

  const handleDecline = async () => {
    if (!incoming) return
    const invRef = ref(rtdb, `invitations/${user.uid}/${incoming.id}`)
    await set(invRef, { ...incoming, status: 'declined' })
    setIncoming(null)
    showToast('❌ Invitation refusée')
  }

  const cancelWaiting = () => {
    setWaiting(false)
    if (unsubAccept.current) unsubAccept.current()
    showToast('❌ Invitation annulée')
  }

  const filtered = players.filter(p =>
    (tab === 'available' ? p.available : !p.available) &&
    p.username.toLowerCase().includes(search.toLowerCase())
  )
  const available   = players.filter(p => p.available)
  const unavailable = players.filter(p => !p.available)

  return (
    <div className="px-5 py-5">
      <div className="text-center mb-5">
        <div style={{fontFamily:'Cormorant Garamond, serif',fontStyle:'italic',
          fontWeight:300,color:'rgba(251,191,36,0.5)',fontSize:'13px',
          letterSpacing:'3px',textTransform:'uppercase',marginBottom:'4px'}}>
          Choisir un adversaire
        </div>
        <div style={{fontFamily:'Cormorant Garamond, serif',fontWeight:600,
          fontSize:'30px',background:'linear-gradient(135deg,#fcd34d,#fbbf24,#f59e0b)',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          L'Arène Mondiale
        </div>
        <div style={{fontFamily:'Jost',fontSize:'12px',
          color:'rgba(251,191,36,0.3)',marginTop:'4px'}}>
          {players.length} joueur{players.length>1?'s':''} en ligne
        </div>
      </div>

      {waiting && (
        <div style={{padding:'20px',marginBottom:'16px',
          background:'rgba(251,191,36,0.04)',
          border:'1px solid rgba(251,191,36,0.25)',
          borderRadius:'16px',display:'flex',alignItems:'center',gap:'14px'}}>
          <div style={{width:'32px',height:'32px',borderRadius:'50%',flexShrink:0,
            border:'3px solid rgba(251,191,36,0.2)',borderTopColor:'#fbbf24',
            animation:'spin 0.8s linear infinite'}}/>
          <div style={{flex:1}}>
            <div style={{fontFamily:'Jost',fontWeight:600,
              fontSize:'14px',color:'#fbbf24'}}>
              En attente de réponse…
            </div>
            <div style={{fontFamily:'Jost',fontSize:'12px',
              color:'rgba(251,191,36,0.4)'}}>
              L'adversaire doit accepter ton invitation
            </div>
          </div>
          <button onClick={cancelWaiting} style={{padding:'8px 14px',
            borderRadius:'10px',background:'rgba(232,66,90,0.1)',
            border:'1px solid rgba(232,66,90,0.25)',
            color:'#fca5a5',fontFamily:'Jost',fontSize:'12px',cursor:'pointer'}}>
            Annuler
          </button>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      <div style={{display:'flex',alignItems:'center',gap:'12px',
        padding:'12px 16px',borderRadius:'16px',marginBottom:'14px',
        background:'rgba(10,20,40,0.7)',border:'1px solid rgba(251,191,36,0.12)'}}>
        <span style={{color:'rgba(251,191,36,0.4)',fontSize:'18px'}}>🔍</span>
        <input type="text" placeholder="Rechercher un joueur..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{flex:1,background:'transparent',border:'none',
            color:'#e8dfc8',fontFamily:'Jost',fontSize:'14px',outline:'none'}}/>
      </div>

      <div style={{display:'flex',gap:'8px',padding:'5px',borderRadius:'16px',
        marginBottom:'16px',background:'rgba(10,20,40,0.6)',
        border:'1px solid rgba(251,191,36,0.08)'}}>
        {[
          {id:'available',label:'Disponibles',dot:'#10b981',count:available.length},
          {id:'unavailable',label:'Occupés',dot:'#e8425a',count:unavailable.length},
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:1,padding:'10px 12px',borderRadius:'10px',
            display:'flex',alignItems:'center',justifyContent:'center',gap:'7px',
            fontFamily:'Jost',fontSize:'12px',fontWeight:600,
            letterSpacing:'1px',textTransform:'uppercase',
            cursor:'pointer',transition:'all 0.22s',border:'none',
            background:tab===t.id
              ?t.id==='available'?'rgba(16,185,129,0.1)':'rgba(232,66,90,0.08)'
              :'transparent',
            color:tab===t.id
              ?t.id==='available'?'#6ee7b7':'#fca5a5'
              :'rgba(232,223,200,0.35)',
            borderWidth:tab===t.id?'1px':'0',borderStyle:'solid',
            borderColor:tab===t.id
              ?t.id==='available'?'rgba(16,185,129,0.25)':'rgba(232,66,90,0.2)'
              :'transparent'}}>
            <span style={{width:'8px',height:'8px',borderRadius:'50%',
              background:t.dot,display:'inline-block'}}/>
            {t.label}
            <span style={{fontSize:'10px',fontWeight:700,
              padding:'2px 7px',borderRadius:'20px',
              background:t.id==='available'
                ?'rgba(16,185,129,0.15)':'rgba(232,66,90,0.12)',
              color:t.id==='available'?'#6ee7b7':'#fca5a5'}}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div style={{display:'flex',flexDirection:'column',
        gap:'8px',paddingBottom:'16px'}}>
        {filtered.length===0 && (
          <div style={{textAlign:'center',padding:'48px 0',
            display:'flex',flexDirection:'column',
            alignItems:'center',gap:'12px'}}>
            <div style={{fontSize:'40px'}}>
              {tab==='available'?'🌍':'😴'}
            </div>
            <div style={{fontFamily:'Jost',
              color:'rgba(251,191,36,0.3)',fontSize:'14px'}}>
              {tab==='available'?'Aucun joueur disponible':'Aucun joueur occupé'}
            </div>
          </div>
        )}
        {filtered.map(p => (
          <div key={p.uid}
            onClick={() => !waiting && p.available && setSelected(p)}
            style={{display:'flex',alignItems:'center',gap:'14px',
              padding:'14px 16px',
              background:'linear-gradient(145deg,rgba(22,41,79,0.5),rgba(6,13,30,0.7))',
              border:'1px solid rgba(251,191,36,0.1)',borderRadius:'16px',
              cursor:p.available&&!waiting?'pointer':'default',
              opacity:p.available&&!waiting?1:0.65,transition:'all 0.22s'}}>
            <div style={{position:'relative',flexShrink:0}}>
              <div style={{width:'48px',height:'48px',borderRadius:'50%',
                background:'rgba(22,41,79,0.8)',
                border:`2px solid ${p.available
                  ?'rgba(16,185,129,0.5)':'rgba(232,66,90,0.35)'}`,
                display:'flex',alignItems:'center',
                justifyContent:'center',fontSize:'24px'}}>
                {p.avatar}
              </div>
              <div style={{position:'absolute',bottom:'1px',right:'1px',
                width:'13px',height:'13px',borderRadius:'50%',
                background:p.available?'#10b981':'#e8425a',
                border:'2px solid #03060f'}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:'Jost',fontWeight:600,
                fontSize:'14px',color:'#e8dfc8'}}>{p.username}</div>
              <div style={{fontFamily:'Jost',fontSize:'11px',
                color:'rgba(251,191,36,0.45)'}}>
                {p.country} · {p.elo} ELO
              </div>
              {p.statusMsg&&(
                <div style={{fontFamily:'Jost',fontSize:'11px',
                  fontStyle:'italic',color:'rgba(251,191,36,0.35)',
                  marginTop:'2px',overflow:'hidden',
                  textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  💬 {p.statusMsg}
                </div>
              )}
            </div>
            <div style={{padding:'6px 12px',borderRadius:'20px',
              fontSize:'11px',fontWeight:700,textTransform:'uppercase',
              letterSpacing:'1px',flexShrink:0,fontFamily:'Jost',
              background:p.available
                ?'rgba(16,185,129,0.1)':'rgba(232,66,90,0.08)',
              color:p.available?'#6ee7b7':'#fca5a5',
              border:`1px solid ${p.available
                ?'rgba(16,185,129,0.25)':'rgba(232,66,90,0.18)'}`}}>
              {p.available?'● Dispo':'● Occupé'}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <InviteModal
          player={{...selected,name:selected.username,
            av:selected.avatar,rank:selected.elo,wins:selected.wins||0}}
          ctx={ctx}
          onClose={() => setSelected(null)}
          onInvite={() => handleInvite(selected)}
        />
      )}
      {incoming && (
        <IncomingInvite
          invite={incoming}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      )}
    </div>
  )
}
