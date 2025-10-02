# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# NextAuth Configuration (REQUIRED)
NEXTAUTH_SECRET=your-super-secret-key-change-in-production-12345
NEXTAUTH_URL=http://localhost:3000

# Optional: Debug mode (development only)
NEXTAUTH_DEBUG=true
```

## How to Create the Environment File

### Option 1: Using Command Line
```bash
# Create the file
touch .env.local

# Add content (replace with your preferred editor)
echo "NEXTAUTH_SECRET=your-super-secret-key-change-in-production-12345" > .env.local
echo "NEXTAUTH_URL=http://localhost:3000" >> .env.local
```

### Option 2: Using VS Code
1. Right-click in the project root
2. Select "New File"
3. Name it `.env.local`
4. Add the environment variables above

### Option 3: Using File Explorer
1. Navigate to your project root directory
2. Create a new file named `.env.local`
3. Open it in any text editor
4. Add the environment variables above

## Environment Variable Details

### NEXTAUTH_SECRET
- **Required**: Yes
- **Purpose**: Used to encrypt JWT tokens and session data
- **Development**: Use any long, random string
- **Production**: Generate a secure random string (32+ characters)
- **Example**: `NEXTAUTH_SECRET=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz`

### NEXTAUTH_URL
- **Required**: Yes (for production)
- **Purpose**: The canonical URL of your site
- **Development**: `http://localhost:3000`
- **Production**: Your actual domain (e.g., `https://yourdomain.com`)

### NEXTAUTH_DEBUG
- **Required**: No
- **Purpose**: Enables debug logging
- **Development**: `true` (helpful for debugging)
- **Production**: `false` or omit

## Security Best Practices

### Development
- Use a simple secret for local development
- Never commit `.env.local` to version control
- The current fallback secret is safe for development only

### Production
- Generate a cryptographically secure secret
- Use environment variables provided by your hosting platform
- Never use the development fallback secret in production

## Generating a Secure Secret

### Option 1: Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Option 2: Using OpenSSL
```bash
openssl rand -hex 32
```

### Option 3: Online Generator
- Visit: https://generate-secret.vercel.app/32
- Copy the generated secret

## Troubleshooting

### Error: NO_SECRET
- **Cause**: Missing `NEXTAUTH_SECRET` environment variable
- **Solution**: Create `.env.local` file with the required variables
- **Fallback**: The app will use a development secret (not for production)

### Error: Configuration
- **Cause**: Invalid NextAuth configuration
- **Solution**: Check your environment variables and restart the dev server

### Error: Callback URL Mismatch
- **Cause**: `NEXTAUTH_URL` doesn't match your actual URL
- **Solution**: Update `NEXTAUTH_URL` to match your current URL

## File Structure
```
your-project/
├── .env.local          # Environment variables (create this)
├── .env.example        # Example environment file (optional)
├── src/
│   ├── lib/
│   │   └── auth.ts     # NextAuth configuration
│   └── ...
└── ...
```

## Next Steps
1. Create the `.env.local` file
2. Add the required environment variables
3. Restart your development server: `npm run dev`
4. Test the authentication system

## Production Deployment

### Vercel
Add environment variables in your Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add `NEXTAUTH_SECRET` and `NEXTAUTH_URL`

### Other Platforms
- **Netlify**: Use Netlify's environment variable settings
- **Railway**: Use Railway's environment variable configuration
- **Docker**: Pass environment variables in your docker-compose.yml

Remember: Never commit `.env.local` to version control!
