import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { firebaseConfig } from './environment/environment';

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Analytics only works in browsers that support it
isSupported().then((supported) => {
  if (supported) {
    getAnalytics(app);
  }
});

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
