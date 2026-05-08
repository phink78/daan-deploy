import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Voor lokale development draait de api/research.js niet automatisch.
// We gebruiken Vercel's CLI (`vercel dev`) om dat na te bootsen.
// Of: gebruik gewoon `npm run dev` voor de UI en deploy naar Vercel
// voor het testen van de API-call.

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
