import { getStorage } from 'firebase/storage'
import { app } from './firebase'

export { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
export const storage = getStorage(app!)
