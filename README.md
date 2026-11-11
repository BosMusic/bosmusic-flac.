# BosMusic FLAC — experimental starter

This is a **prototype**, not a confirmed working BitChord addon. The manifest and endpoint response schemas require verification against the actual BitChord specification. Jamendo FLAC access and rights depend on its API terms and the track. Never assume a URL ending in audio is FLAC without checking its response content type/codec.

## Setup
1. Create a Jamendo developer application and obtain an authorized client ID.
2. Set `JAMENDO_CLIENT_ID` as a secret environment variable in your Node.js host. Do not commit credentials.
3. Deploy with `npm start` (Node.js 18+), HTTPS provided by your hosting platform.
4. Test `/health`, `/search?query=jazz`, `/stream?id=TRACK_ID` and `/manifest.json`.
5. Adapt manifest, search and stream response shapes to BitChord's verified API spec before installing.

This project does not bypass DRM or retrieve subscription-only music. Confirm Jamendo's API and music usage terms before deploying publicly.
