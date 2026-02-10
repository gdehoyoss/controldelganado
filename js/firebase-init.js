import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyAjJ1tP-otajTNwmTqHSpzAAVlo6oBO-Ww",
  authDomain: "control-del-ganado.firebaseapp.com",
  projectId: "control-del-ganado",
  storageBucket: "control-del-ganado.firebasestorage.app",
  messagingSenderId: "569541346292",
  appId: "1:569541346292:web:2d78295dfb37b87203afa1",
  measurementId: "G-S77NHDHZKY"
};

const app = initializeApp(firebaseConfig);
window.firebaseApp = app;

isSupported().then((supported) => {
  if (!supported) return;
  const analytics = getAnalytics(app);
  window.firebaseAnalytics = analytics;
});
