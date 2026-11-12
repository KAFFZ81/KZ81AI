# KZ81 AI — Cloudflare Pages

A static learning and creativity workspace with Cloudflare Pages Functions for Gemini AI.

## Deploy
1. In Cloudflare Dashboard, open Workers & Pages → Create application → Pages → Connect to Git.
2. Select repository `KAFFZ81/KZ81AI` and branch `main`.
3. Framework preset: None. Build command: leave empty. Build output directory: `/`.
4. Deploy.
5. In project Settings → Variables and Secrets, add encrypted Secret `GEMINI_API_KEY` with your own Gemini API key, then redeploy.

## Files
The site uses `index.html`, `style.css`, `app.js`, and `functions/api/chat.js`. Never place the API key in frontend files or commit it to Git.

See the `README.md` instructions in the project for further setup details.