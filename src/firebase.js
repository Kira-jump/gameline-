import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyA2GUIlV4Wzg8LLMdHV4fz3P8ET0BM4uIw",
  authDomain: "gameline-2fbce.firebaseapp.com",
  projectId: "gameline-2fbce",
  storageBucket: "gameline-2fbce.firebasestorage.app",
  messagingSenderId: "150646809588",
  appId: "1:150646809588:web:150646809588:web:468fbe8d32845355c48fa1",
  databaseURL: "https://gameline-2fbce-default-rtdb.europe-west1.firebasedatabase.app"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const rtdb = getDatabase(app)
export default app
