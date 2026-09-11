<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a433d7ff-46d6-4efb-bc85-4178c6b81d56

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
## Deploy to Netlify

This project is 100% ready for Netlify deployment (via GitHub repository connection, Netlify CLI, or Drag & Drop):

1. **Build Settings in Netlify:**
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
2. **SPA Routing:**
   - Pre-configured with `netlify.toml` and `public/_redirects` (`/* /index.html 200`).
3. **Database & Cloud Sync:**
   - Client-side Firebase Firestore & Google Apps Script sync work seamlessly on Netlify without requiring a custom Node backend.

