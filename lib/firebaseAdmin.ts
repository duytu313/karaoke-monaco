import * as admin from "firebase-admin";

let rtdbInstance: admin.database.Database | null = null;
let authInstance: admin.auth.Auth | null = null;

// Lazy initialization - chỉ khởi tạo khi thực sự cần
const initializeFirebase = () => {
  if (!admin.apps.length) {
    // Handle private key formatting - replace escaped newlines with actual newlines
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";
    
    // Replace literal \n with actual newlines
    privateKey = privateKey.replace(/\\n/g, "\n");
    
    // Remove surrounding quotes if present
    privateKey = privateKey.replace(/^["']|["']$/g, "");
    
    // Ensure the key has proper line endings
    privateKey = privateKey.replace(/\r\n/g, "\n");
    
    console.log("Initializing Firebase with private key length:", privateKey.length);
    console.log("Private key starts with:", privateKey.substring(0, 30));
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      databaseURL: process.env.DATABASE_URL,
    });
    console.log("Firebase Admin Initialized");
  }
};

const getRTDB = () => {
  initializeFirebase();
  if (!rtdbInstance) {
    rtdbInstance = admin.database();
  }
  return rtdbInstance;
};

const getAuth = () => {
  initializeFirebase();
  if (!authInstance) {
    authInstance = admin.auth();
  }
  return authInstance;
};

// Export lazy-loaded instances using getters
export const rtdb = new Proxy({} as admin.database.Database, {
  get(_, prop) {
    const instance = getRTDB();
    return (instance as any)[prop];
  }
});

export const auth = new Proxy({} as admin.auth.Auth, {
  get(_, prop) {
    const instance = getAuth();
    return (instance as any)[prop];
  }
});

export { admin };
