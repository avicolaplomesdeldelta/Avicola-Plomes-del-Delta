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

// Rastrear TODAS nuestras escrituras pendientes (no solo la última) para no
// auto-sobrescribirnos con el "eco" de confirmación que llega de Firestore,
// incluso si hay varias escrituras seguidas a la misma clave.
const pendingWrites = {}; // key -> array de JSON strings en vuelo

window.cloudSync = {
  ready: readyPromise,
  set: async (key, value) => {
    const json = JSON.stringify(value);
    if (!pendingWrites[key]) pendingWrites[key] = [];
    pendingWrites[key].push(json);
    try {
      await setDoc(doc(db, "datos", key), { value: json, updated: Date.now() });
      return true;
    } catch (err) {
      console.error("cloudSync.set error:", err);
      const idx = pendingWrites[key].indexOf(json);
      if (idx >= 0) pendingWrites[key].splice(idx, 1);
      return false;
    }
  },
  subscribe: (key, callback) => {
    return onSnapshot(doc(db, "datos", key),
      (snap) => {
        if (!snap.exists()) { callback([]); return; }
        const rawJson = snap.data().value;
        const queue = pendingWrites[key];
        if (queue && queue.length) {
          const idx = queue.indexOf(rawJson);
          if (idx >= 0) {
            // Es el eco de confirmación de una escritura nuestra en curso:
            // ya tenemos ese estado (o uno más nuevo) localmente, ignorar.
            queue.splice(idx, 1);
            return;
          }
        }
        try { callback(JSON.parse(rawJson)); }
        catch (e) { callback([]); }
      },
      (err) => { console.error("cloudSync.subscribe error:", err); callback(null); }
    );
  }
};
