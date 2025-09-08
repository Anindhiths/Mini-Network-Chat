# script_6.py

# Create package.json for Vercel deployment
vercel_package_json = '''{
  "name": "mini-network-chat-vercel",
  "version": "2.0.0",
  "description": "Mini Network Chat - Vercel Serverless Edition",
  "main": "public/index.html",
  "scripts": {
    "dev": "vercel dev",
    "build": "echo 'No build step needed for static frontend'",
    "deploy": "vercel --prod"
  },
  "dependencies": {
    "@upstash/redis": "^1.22.0"
  },
  "devDependencies": {
    "vercel": "^32.0.0"
  },
  "keywords": [
    "chat",
    "vercel",
    "serverless",
    "networking",
    "http-polling"
  ],
  "author": "Mini Network Chat",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  }
}'''

# Save package.json
with open('package.json', 'w') as f:
    f.write(vercel_package_json)

print("✅ Vercel package.json created")
