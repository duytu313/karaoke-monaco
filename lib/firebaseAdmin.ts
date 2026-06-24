import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    databaseURL: process.env.DATABASE_URL,
  });

  console.log("Firebase Admin Initialized");
}

// 👉 KHÔNG khởi tạo trực tiếp ở top-level
const getRTDB = () => admin.database();
const getAuth = () => admin.auth();

export const rtdb = getRTDB();
export const auth = getAuth();
export { admin };