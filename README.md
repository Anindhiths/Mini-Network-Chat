# Mini-Network-Chat

A minimal real-time chat app using Server-Sent Events (SSE) for streaming updates and Upstash Redis for storage and presence. Built for serverless platforms (e.g., Vercel) to provide WebSocket-like behavior without maintaining socket infrastructure.

## Features
- Real-time message streaming via SSE (`/api/chat-stream`)
- Presence tracking: user count and list via Redis sets
- Simple REST endpoints for joining and sending messages
- Stateless serverless functions optimized for Vercel
- Lightweight browser client (`public/index.html`)

## Tech Stack
- Node.js (serverless functions)
- Upstash Redis (REST API)
- Vanilla JavaScript (client)
- Vercel (deployment)

## Project Structure
```
.
├─ api/
│  ├─ chat-stream.js       # SSE endpoint: streams messages + presence
│  ├─ clear-redis.js       # Utility: clear messages & users keys
│  ├─ join.js              # Add a user to presence set
│  ├─ message.js           # Fetch a single message (if implemented)
│  ├─ messages.js          # List all messages
│  ├─ send-message.js      # Append a new message to the list
├─ public/
│  └─ index.html           # Minimal chat client UI
├─ HOWTOUSE.txt            # Usage notes
├─ README.md               # This file
├─ deploy_vercel.sh        # Vercel deployment helper
├─ package.json            # Dependencies & scripts
├─ script_3.py             # Utility script (internal)
├─ script_8.py             # Utility script (internal)
└─ vercel.json             # Vercel routing/config
```

## How It Works
- Messages are stored in Redis list `chat:messages` as JSON with fields like `id`, `user`, `text`, `timestamp`.
- Presence is stored in Redis set `chat:users`.
- `/api/chat-stream`:
  - Responds with `Content-Type: text/event-stream`.
  - On connect: sends recent messages (optionally filtered by `?since=<id>`) and a presence snapshot.
  - Sends keep-alive `ping` events every 30s.
  - Polls Redis every 3s for new messages and updated presence, streaming them to clients.

Example SSE payloads:
```json
{ "id": 42, "user": "alice", "text": "hello", "timestamp": 1694100000000 }
{ "type": "user_count", "count": 3, "users": ["alice","bob","carol"] }
{ "type": "ping" }
```

## Prerequisites
- Node.js 18+
- Upstash Redis credentials:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- Optional: Vercel CLI

## Environment Variables
Create `.env.local` (local dev) or set env vars in your hosting provider:
```
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```
Security:
- Never commit secrets.
- Use environment variable management (Vercel/GitHub Actions).

## Installation
```bash
git clone https://github.com/Anindhiths/Mini-Network-Chat.git
cd Mini-Network-Chat
npm install
```

## Running Locally
Using Vercel:
```bash
# Create and fill .env.local
npx vercel dev
# or
npm run dev
```
Open the client:
- Visit `http://localhost:3000` to load `public/index.html`.

## API Overview
Note: Adjust shapes to match your implementation.

- GET `/api/chat-stream?since=<id>`
  - SSE stream of:
    - Historical messages after `since`
    - `user_count` snapshots
    - `ping` keep-alives
    - New messages as they arrive
  - CORS: `Access-Control-Allow-Origin: *`.

- POST `/api/join`
  - Body: `{ "user": "alice" }`
  - Adds the user to `chat:users`.

- POST `/api/send-message`
  - Body: `{ "user": "alice", "text": "hello" }`
  - Appends a message to `chat:messages`; ensure monotonic `id` and a `timestamp`.

- GET `/api/messages`
  - Returns all messages from `chat:messages`.

- GET `/api/message?id=42`
  - Returns a single message (if implemented).

- POST `/api/clear-redis`
  - Clears `chat:messages` and `chat:users`. Use with caution.

## Client Usage
`public/index.html` subscribes to SSE and renders updates. Minimal example:
```html
<script>
  const es = new EventSource('/api/chat-stream');
  es.onmessage = (evt) => {
    const data = JSON.parse(evt.data);
    if (data.type === 'user_count') {
      // update presence UI
    } else if (data.type === 'ping') {
      // optional: noop
    } else {
      // render message
    }
  };
</script>
```

## Deployment
- Vercel:
  - Add env vars in dashboard.
  - Deploy:
    ```bash
    npx vercel --prod
    # or
    ./deploy_vercel.sh
    ```
- Other platforms:
  - Ensure support for long-lived HTTP responses (SSE).
  - Disable response buffering where necessary.

## Operational Notes
- SSE is one-way (server→client). Writes use REST endpoints; reads use SSE.
- Keep-alive pings (30s) help avoid idle timeouts.
- Polling interval (3s) can be tuned in `api/chat-stream.js`.

## Scaling & Reliability
- Upstash rate limits: adjust polling to fit tier constraints.
- Trimming: periodically `LTRIM chat:messages` to cap list size.
- Message IDs: consider a Redis counter (`INCR chat:next_id`) to guarantee monotonic IDs.
- Error handling:
  - Malformed JSON messages are skipped (logged).
  - Intervals cleared on client disconnect (`req.close`/`req.error`).
- Resume support: clients can reconnect with `?since=<id>` to backfill.

## Scripts
Common `package.json` scripts:
- `dev` — local development
- `deploy` — deployment helper
Adjust as needed.

## Contributing
1. Fork the repo
2. Create a feature branch
3. Commit with clear messages
4. Open a PR with rationale and testing notes

## License
MIT
