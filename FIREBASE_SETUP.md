# Firebase Setup Guide

This guide will help you set up Firebase for your Navin platform.

## Prerequisites

1. A Firebase project created at [Firebase Console](https://console.firebase.google.com/)
2. Firebase CLI installed: `npm install -g firebase-tools`

## Environment Variables

Add the following environment variables to your `.env` file:

### Client-side Configuration
```env
FIREBASE_API_KEY="your-firebase-api-key"
FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
FIREBASE_MESSAGING_SENDER_ID="123456789"
FIREBASE_APP_ID="1:123456789:web:abcdef123456"
```

### Server-side Configuration (Admin SDK)
```env
FIREBASE_PRIVATE_KEY_ID="your-private-key-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR-PRIVATE-KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_CLIENT_ID="your-client-id"
```

## Firebase Project Setup

### 1. Enable Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Get started**
4. Go to **Sign-in method** tab
5. Enable **Email/Password** provider

### 2. Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** or **Start in test mode**
4. Select a location for your database

### 3. Enable Storage (Optional)

1. In Firebase Console, go to **Storage**
2. Click **Get started**
3. Set up your storage bucket rules

### 4. Generate Service Account Key

1. In Firebase Console, go to **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Extract the following values for your `.env` file:
   - `private_key_id`
   - `private_key` (make sure to preserve newlines)
   - `client_email`
   - `client_id`

## Usage Examples

### Authentication

```tsx
import { useFirebase } from '@/components/FirebaseProvider';

function LoginComponent() {
  const { signIn, signUp, user, loading } = useFirebase();

  const handleSignIn = async () => {
    try {
      await signIn('user@example.com', 'password');
      // User is now signed in
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  return (
    <div>
      {loading ? 'Loading...' : user ? 'Welcome!' : 'Please sign in'}
    </div>
  );
}
```

### Using the Auth Component

```tsx
import { FirebaseAuth } from '@/components/FirebaseAuth';

function LoginPage() {
  return (
    <div>
      <FirebaseAuth
        mode="signin"
        onSuccess={() => {
          // Redirect or handle successful sign in
          window.location.href = '/dashboard';
        }}
      />
    </div>
  );
}
```

## Firebase Services Available

- **Authentication**: Email/password, user management
- **Firestore**: NoSQL database for user data, posts, etc.
- **Storage**: File uploads (images, documents)
- **Admin SDK**: Server-side operations

## Security Rules

### Firestore Rules (Example)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own documents
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Posts are readable by all authenticated users
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.authorId;
    }
  }
}
```

### Storage Rules (Example)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **"Firebase: Error (auth/invalid-api-key)"**
   - Check that your `FIREBASE_API_KEY` is correct
   - Make sure you've enabled Authentication in Firebase Console

2. **"Firebase: Error (auth/user-not-found)"**
   - Verify the user exists in Firebase Auth
   - Check email spelling and case

3. **Admin SDK Issues**
   - Ensure service account key values are correct
   - Check that private key includes proper newlines
   - Verify project ID matches your Firebase project

### Debug Mode

To enable Firebase debug logging:

```javascript
import { getAuth } from 'firebase/auth';

// Enable debug logging in development
if (process.env.NODE_ENV === 'development') {
  getAuth().settings.appVerificationDisabledForTesting = true;
}
```

## Next Steps

1. Set up your Firebase project and get your configuration values
2. Update your `.env` file with the correct values
3. Test authentication flows
4. Set up Firestore security rules for your data structure
5. Implement file upload functionality if needed

## Support

For more information, refer to:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase JavaScript SDK](https://firebase.google.com/docs/web/setup)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
