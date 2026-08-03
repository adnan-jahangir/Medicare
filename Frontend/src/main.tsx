import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";

// Auto-recovery for stale JS chunk 404 errors after new deployments
window.addEventListener('error', (event) => {
  const isChunkError =
    event.message?.includes('Loading chunk') ||
    event.message?.includes('Importing a module script failed') ||
    event.message?.includes('Failed to fetch dynamically imported module');

  if (isChunkError) {
    const key = 'medicare_chunk_reload';
    const lastReload = sessionStorage.getItem(key);
    if (!lastReload) {
      sessionStorage.setItem(key, String(Date.now()));
      window.location.reload();
    }
  }
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE"}>
      <App />
    </GoogleOAuthProvider>
  </ErrorBoundary>
);
