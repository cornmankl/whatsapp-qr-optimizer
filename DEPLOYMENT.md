# Deployment Guide for WhatsApp QR Optimizer

## Vercel Deployment Instructions

### Prerequisites
1. A Vercel account (sign up at https://vercel.com)
2. A PostgreSQL database (recommended: Neon, Supabase, or PlanetScale)
3. Z.ai API key (if using AI features)

### Step 1: Database Setup
1. Create a PostgreSQL database with your preferred provider:
   - **Neon**: https://neon.tech (recommended for serverless)
   - **Supabase**: https://supabase.com
   - **PlanetScale**: https://planetscale.com
   - **Railway**: https://railway.app

2. Get your database connection URL. It should look like:
   ```
   postgresql://username:password@hostname:port/database?sslmode=require
   ```

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel CLI
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from project root:
   ```bash
   vercel
   ```

4. Follow the prompts and set environment variables when asked.

#### Option B: Deploy via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables (see below)
5. Click "Deploy"

### Step 3: Environment Variables
Set these environment variables in your Vercel project settings:

#### Required Variables:
```bash
DATABASE_URL=your_postgresql_connection_string
NODE_ENV=production
```

#### Optional Variables (for full functionality):
```bash
# Z.ai API (for AI features)
ZAI_API_KEY=your_zai_api_key

# WhatsApp API (if using WhatsApp webhook features)
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token

# NextAuth (if using authentication)
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret_key
```

### Step 4: Database Migration
After deployment, you need to set up your database schema:

1. Go to your Vercel project dashboard
2. Open the "Functions" tab
3. Find any API function and click "View Function Logs"
4. You can use Vercel's edge runtime or set up a separate migration script

Alternatively, run migrations locally with your production database:
```bash
DATABASE_URL="your_production_db_url" npx prisma db push
```

### Step 5: Verify Deployment
1. Visit your deployed app URL
2. Check that the homepage loads correctly
3. Test API endpoints: `https://your-app.vercel.app/api/health`

## Important Notes

### Socket.IO Limitations
Due to Vercel's serverless nature, the real-time Socket.IO features have been replaced with:
- **Polling endpoints** for WhatsApp QR status updates
- **Server-Sent Events (SSE)** for real-time updates where supported

The app includes fallback mechanisms for real-time features.

### Custom Server
The custom server (`server.ts`) is used only in development. In production, the app runs on Vercel's serverless functions.

### WhatsApp Sessions
WhatsApp sessions are stored temporarily and may not persist across function cold starts. Consider implementing a more robust session storage solution for production use.

## Troubleshooting

### Build Issues
- If build fails with Prisma errors, ensure DATABASE_URL is set correctly
- If font loading fails, the app uses fallback fonts automatically

### Runtime Issues
- Check Vercel function logs for detailed error messages
- Ensure all required environment variables are set
- Verify database connectivity

### Database Issues
- Make sure your database allows connections from Vercel's IP ranges
- Use SSL connections (`sslmode=require` in connection string)
- Ensure database has proper permissions for schema creation

## Performance Optimization

1. **Database**: Use connection pooling with PgBouncer for better performance
2. **Caching**: Consider Redis for session storage and caching
3. **CDN**: Vercel automatically provides CDN for static assets
4. **Monitoring**: Set up Vercel Analytics and log monitoring

## Production Checklist

- [ ] Database URL configured and accessible
- [ ] All required environment variables set
- [ ] Database schema migrated
- [ ] SSL/HTTPS enabled (automatic with Vercel)
- [ ] Error monitoring configured
- [ ] Backup strategy for database implemented
- [ ] Domain configured (if using custom domain)

## Scaling Considerations

- **Database**: Use read replicas for better performance
- **Sessions**: Implement Redis-based session storage
- **Rate Limiting**: Add rate limiting for API endpoints
- **Monitoring**: Set up proper logging and alerting

## Support

For deployment issues:
1. Check Vercel documentation: https://vercel.com/docs
2. Review build logs in Vercel dashboard
3. Test locally with `NODE_ENV=production npm run build`