import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { firebaseConfig, isFirebaseConfigured } from './firebase-config'

export {
  createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail,
  signInWithEmailAndPassword, signOut,
} from 'firebase/auth'
export {
  addDoc, collection, deleteDoc, doc, getCountFromServer, getDoc, getDocs,
  limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, startAfter, updateDoc,
} from 'firebase/firestore'

if (!import.meta.env.SSR && !isFirebaseConfigured) {
  console.warn(
    '[firebase] 환경 변수가 비어 있습니다. .env 파일에 VITE_FIREBASE_* 값을 채운 뒤 다시 시작하세요.',
  )
}

// Static rendering never executes effects or event handlers that use Firebase.
export const app = import.meta.env.SSR ? null : initializeApp(firebaseConfig)

export const auth = import.meta.env.SSR ? null! : getAuth(app!)
export const db = import.meta.env.SSR ? null! : getFirestore(app!)
