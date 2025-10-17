import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const config = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  };

  const requiredFields = ['apiKey', 'authDomain', 'projectId'];
  const missingFields = requiredFields.filter(field => !config[field as keyof typeof config]);

  if (missingFields.length > 0) {
    throw new Error(
      `Missing Firebase configuration. Please set the following environment variables:\n` +
      missingFields.map(field => `  - ${field.toUpperCase()}`).join('\n') +
      `\n\nSee FIREBASE_SETUP.md for instructions.`
    );
  }

  return config;
};

// Initialize Firebase with validation and fallback
let app: any;
let auth: any;
let db: any;
let storage: any;
let firebaseError: Error | null = null;

try {
  const firebaseConfig = validateFirebaseConfig();

  // Check if this looks like placeholder data
  if (firebaseConfig.apiKey?.includes('your-firebase-api-key') ||
      firebaseConfig.projectId?.includes('your-project-id')) {
    throw new Error(
      'Firebase configuration appears to contain placeholder values. ' +
      'Please replace them with your actual Firebase project credentials. ' +
      'See FIREBASE_SETUP.md for setup instructions.'
    );
  }

  // Initialize Firebase only if it hasn't been initialized yet
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

} catch (error) {
  firebaseError = error instanceof Error ? error : new Error(String(error));
  console.error('Firebase initialization failed:', firebaseError.message);

  // Provide helpful error information
  if (firebaseError.message.includes('Missing Firebase configuration')) {
    console.error('\n🔧 To fix this:');
    console.error('1. Go to https://console.firebase.google.com/');
    console.error('2. Create a new project or select existing one');
    console.error('3. Go to Project Settings > General tab');
    console.error('4. Scroll down to find your Web App Configuration');
    console.error('5. Copy the config values to your .env file');
    console.error('6. Restart your development server');
  }

  // Create mock services for development when Firebase is not configured
  console.warn('⚠️  Running without Firebase - some features will not work');

  // Mock auth object
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback: Function) => {
      callback(null);
      return () => {};
    }
  };

  // Mock db object
  db = {
    collection: () => ({
      doc: () => ({
        set: async () => { throw new Error('Firebase not configured'); },
        get: async () => { throw new Error('Firebase not configured'); },
        update: async () => { throw new Error('Firebase not configured'); },
        delete: async () => { throw new Error('Firebase not configured'); }
      }),
      add: async () => { throw new Error('Firebase not configured'); },
      where: () => ({
        get: async () => { throw new Error('Firebase not configured'); }
      })
    })
  };

  // Mock storage object
  storage = {
    ref: () => ({
      put: async () => { throw new Error('Firebase not configured'); },
      getDownloadURL: async () => { throw new Error('Firebase not configured'); }
    })
  };
}

export { auth, db, storage };
export default app;
