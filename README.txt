AVÍCOLA PLOMES DEL DELTA - v8
=========================================================================
NOVEDAD: Copia de seguridad EN LA NUBE (no en el móvil)

En la pestaña Datos, nuevo botón "Guardar copia ahora en la nube".
Guarda una instantánea completa de tus datos en Firebase, separada
de los datos en uso. Si pierdes el móvil o se rompe, entras desde
cualquier otro dispositivo con la contraseña y restauras la copia
que quieras desde el listado "Copias guardadas".

IMPORTANTE - ACTUALIZA LAS REGLAS DE FIRESTORE:
-------------------------------------
Hay una colección nueva "backups" que necesita permiso:
1. console.firebase.google.com → tu proyecto → Firestore → Rules
2. Sustituye todo por:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /datos/{document} {
      allow read, write: if request.auth != null;
    }
    match /fotos/{document} {
      allow read, write: if request.auth != null;
    }
    match /backups/{document} {
      allow read, write: if request.auth != null;
    }
  }
}

3. Publish

CÓMO ACTUALIZAR LA APP:
-------------------------------------
1. Descomprime, GitHub → Add file → Upload files → los 6 archivos
2. Commit changes → espera 1-2 min
3. Fuerza recarga sin caché
