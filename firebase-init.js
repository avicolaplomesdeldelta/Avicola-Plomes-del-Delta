// Conexión a Firebase - se carga como módulo ES directo desde CDN en el navegador del usuario
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBktAFB2j6J4MaUk36-zJVEXoToEUit5YU",
  authDomain: "plomes-del--delta.firebaseapp.com",
  projectId: "plomes-del--delta",
  storageBucket: "plomes-del--delta.firebasestorage.app",
  messagingSenderId: "974425813222",
  appId: "1:974425813222:web:a252e182c3be11fca9cb27"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let readyResolve;
const readyPromise = new Promise(res => { readyResolve = res; });

onAuthStateChanged(auth, (user) => {
  if (user) { readyResolve(true); }
});
signInAnonymously(auth).catch(err => {
  console.error("Firebase auth error:", err);
  readyResolve(false);
});

// Rastrear nuestras propias escrituras pendientes para no auto-sobrescribirnos
// con el "eco" de confirmación que llega de vuelta desde Firestore
const pendingWrites = {};

window.cloudSync = {
  ready: readyPromise,
  set: async (key, value) => {
    const json = JSON.stringify(value);
    pendingWrites[key] = json;
    try {
      await setDoc(doc(db, "datos", key), { value: json, updated: Date.now() });
      return true;
    } catch (err) {
      console.error("cloudSync.set error:", err);
      delete pendingWrites[key];
      return false;
    }
  },
  subscribe: (key, callback) => {
    return onSnapshot(doc(db, "datos", key),
      (snap) => {
        if (!snap.exists()) { callback([]); return; }
        const rawJson = snap.data().value;
        // Si esta actualización coincide exactamente con algo que acabamos
        // de escribir nosotros mismos, es solo el eco de confirmación:
        // ya tenemos ese estado localmente, así que lo ignoramos sin
        // volver a aplicarlo (evita pisar cambios más recientes en curso).
        if (pendingWrites[key] === rawJson) {
          delete pendingWrites[key];
          return;
        }
        try { callback(JSON.parse(rawJson)); }
        catch (e) { callback([]); }
      },
      (err) => { console.error("cloudSync.subscribe error:", err); callback(null); }
    );
  }
};
