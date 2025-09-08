# script_5.py

import os

# Create the api directory if it doesn't exist
os.makedirs('api', exist_ok=True)

# Messages polling API using Upstash Redis
messages_api = '''import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

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

  try {
    const { since } = req.query;
    const sinceId = since ? parseInt(since) : 0;

    // Get all messages from Redis
    let messages = (await redis.lrange('chat:messages', 0, -1)).map(JSON.parse);

    // Filter messages since the specified ID
    const newMessages = messages.filter(msg => msg.id > sinceId);

    // Get user count from Redis
    const users = await redis.smembers('chat:users');

    // Find the highest message ID
    const lastMessageId = messages.length > 0 ? Math.max(...messages.map(m => m.id)) : 0;

    return res.status(200).json({
      success: true,
      messages: newMessages,
      userCount: users.length,
      lastMessageId,
      serverTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('Messages API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
'''

# Save messages API
with open('api/messages.js', 'w') as f:
    f.write(messages_api)

print("✅ Messages polling API created: api/messages.js")
