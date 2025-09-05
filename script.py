# Create a Vercel configuration for frontend deployment
vercel_config = '''{
  "version": 2,
  "name": "mini-network-chat",
  "builds": [
    {
      "src": "public/**/*",
      "use": "@vercel/static"
    },
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ],
  "functions": {
    "api/chat.js": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}'''

# Save Vercel configuration
with open('vercel.json', 'w') as f:
    f.write(vercel_config)

print("Vercel configuration created: vercel.json")