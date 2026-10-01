import appletConfig from '../../firebase-applet-config.json';

// Firebase Firestore Configuration (Synced directly with firebase-applet-config.json)
export const FIREBASE_CONFIG = {
  projectId: appletConfig.projectId,
  appId: appletConfig.appId,
  apiKey: appletConfig.apiKey,
  authDomain: appletConfig.authDomain,
  firestoreDatabaseId: appletConfig.firestoreDatabaseId,
  storageBucket: appletConfig.storageBucket,
  messagingSenderId: appletConfig.messagingSenderId,
  measurementId: appletConfig.measurementId || '',
  oAuthClientId: appletConfig.oAuthClientId || '',
  recaptchaSiteKey: appletConfig.recaptchaSiteKey || '',
};
