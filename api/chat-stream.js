// Server-Sent Events endpoint for real-time chat
// Provides WebSocket-like functionality on Vercel

import { chatState } from './send-message.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set up Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const connectionId = Date.now() + Math.random();
  const { since } = req.query;
  const sinceId = since ? parseInt(since) : 0;

  try {
    // Send existing messages since last ID
    const recentMessages = chatState.messages.filter(msg => msg.id > sinceId);
    recentMessages.forEach(msg => {
      res.write(`data: ${JSON.stringify(msg)}\n\n`);
    });

    // Send current user count
    res.write(`data: ${JSON.stringify({
      type: 'user_count',
      count: chatState.users.size,
      users: Array.from(chatState.users.keys())
    })}\n\n`);

    // Keep connection alive
    const keepAlive = setInterval(() => {
      res.write(`data: ${JSON.stringify({type: 'ping'})}\n\n`);
    }, 30000);

    // Store connection for broadcasting
    if (!global.sseConnections) {
      global.sseConnections = new Map();
    }
    global.sseConnections.set(connectionId, { res, keepAlive });

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(keepAlive);
      if (global.sseConnections) {
        global.sseConnections.delete(connectionId);
      }
    });

    // Check for new messages every 2 seconds and send them
    const messageCheck = setInterval(() => {
      if (global.latestMessage && global.latestMessage.id > sinceId) {
        try {
          res.write(`data: ${JSON.stringify(global.latestMessage)}\n\n`);
        } catch (error) {
          clearInterval(messageCheck);
        }
      }
    }, 2000);

    req.on('close', () => {
      clearInterval(messageCheck);
    });

  } catch (error) {
    console.error('SSE error:', error);
    res.status(500).end();
  }
}
