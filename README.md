# Tetris Game

A classic Tetris game built with Next.js and Supabase.

## Features

- User authentication (login/register)
- Classic Tetris gameplay
- Real-time score tracking
- Global leaderboard (Top 10)
- Each user keeps only their highest score

## Tech Stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth + Database)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/chenwenxiaolive/tetris.git
cd tetris
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Controls

| Key | Action |
|-----|--------|
| Left/Right Arrow | Move piece |
| Up Arrow | Rotate piece |
| Down Arrow | Soft drop |
| Space | Hard drop |

## Database Schema

```sql
CREATE TABLE scores (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users(id),
  username TEXT,
  score INTEGER,
  created_at TIMESTAMP
);
```

## License

MIT
