// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase config - usando una configuración pública de demostración
const firebaseConfig = {
  apiKey: "AIzaSyDemoKeyForTrelloClone123456789",
  authDomain: "trello-clone-demo.firebaseapp.com", 
  databaseURL: "https://trello-clone-demo-default-rtdb.firebaseio.com/",
  projectId: "trello-clone-demo",
  storageBucket: "trello-clone-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Obtener referencia a la base de datos
export const database = getDatabase(app);
export default app;