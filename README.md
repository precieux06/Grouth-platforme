
# GrowthPlatform - Full Deployable Project

This project is a complete starter kit for a legal social growth platform:
- Next.js + TailwindCSS frontend
- Supabase Auth (email/password or OAuth)
- Supabase service-role server-side operations for secure points crediting
- OpenAI assistant via server-side proxy (/api/chat)
- Tasks claiming API (/api/tasks/claim) that verifies the user's Supabase token

## What is included
- All source files in this zip
- `supabase_migration.sql` — SQL to create tables, policies and RPC
- README with environment variables and deployment instructions

## Environment variables (Vercel)
Set these in Vercel Dashboard -> Project -> Settings -> Environment Variables:

- NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY = your-supabase-anon-key
- SUPABASE_SERVICE_ROLE_KEY = your-supabase-service-role-key (SECRET — do not expose)
- OPENAI_API_KEY = sk-...
- NEXT_PUBLIC_APP_URL = https://your-site.vercel.app

## Quick steps to deploy
1. Create a Supabase project.
2. In Supabase SQL editor run `supabase_migration.sql` to create tables & RPC.
3. Enable email confirmations or configure OAuth providers (Google, GitHub) in Supabase Auth settings.
4. Push this project to GitHub.
5. Import the repo in Vercel and set the Environment Variables above.
6. Deploy.

## Security notes (important)
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret. Only set it in server environment (Vercel env) — never in client code.
- The `/api/tasks/claim` route uses the service role key to validate the user's token and perform updates securely.
- Monitor OpenAI usage and set quotas.
- Rate-limit `/api/chat` in production (not implemented in this scaffold).

## Customization ideas to make it popular
- Add onboarding checklist and guided tasks for new creators.
- Provide hashtag and caption generators using the AI assistant.
- Leaderboards, daily challenges, and social proof to encourage engagement.
- Mobile-friendly PWA behavior.

Enjoy — the full project zip is included with this response.
