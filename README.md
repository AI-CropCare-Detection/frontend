# AI-Powered-CropCare Dashboard

Responsive web dashboard for crop analysis with **Supabase** (Auth, Postgres, Storage), a Node/Express analysis API, and AI-powered recommendations and insights.

## Features

- **Authentication & Sessions**: Sign Up, Sign In, social login (Google/Apple), secure session handling, password recovery (Supabase Auth)
- **Dashboard Workflow**:
  - Upload a plant image **or** take a photo with the device camera
  - Run analysis and view **Time Taken**, **Accuracy Rate**, **Recovery Rate**, and **Crop / Leaf Type**
  - Expand **Recommendations**, **Analysis History**, and **Powerful Insights** in large, readable pop‑ups
- **Notifications & Weather Alerts**: User‑configurable push/email/analysis completion/weather alerts, with optional location‑based weather monitoring
- **Analysis History**: Stored per user in Supabase; filterable, exportable as PDF (including images), CSV, Excel, or JSON
- **Statistics & Charts**: Dedicated Statistics page with daily/monthly/full‑history charts (Recharts) backed by Supabase
- **Settings**: Dark/light mode, language (including Swahili), units, font size, offline mode, notification preferences
- **Account Management**: Profile editing, avatar upload, secure delete‑account flow with confirmation email and full data deletion
- **Onboarding Guide**: “Get Started” multi‑step guide, auto‑shown for new users and available from Help
- **Accessibility & UX**: Semantic HTML, ARIA, keyboard navigation, glassmorphism design, fully responsive layout

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, React Router, Supabase (Auth, Postgres, Storage), jsPDF, Recharts
- **Backend**: Node.js, Express, Multer, Supabase service role (account deletion), Nodemailer (email), OpenRouter (OpenAI models) or direct OpenAI (configurable)
- **Database**: Supabase Postgres (profiles, analysis history, feedback, etc.)

## Setup

### 1. Supabase

1. Create a project at [Supabase](https://supabase.com).
2. Enable **Authentication** (Email/Password and any OAuth providers you need).
3. Run the SQL in `docs/supabase_schema.sql` (or your own migrations) for `analysis_history`, `profiles`, storage buckets, etc.
4. Create `.env` in `frontend/`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. Create buckets **`crop-images`**, **`avatars`**, and **`feedback-screenshots`** as described in the schema doc (or use the SQL inserts there).

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env:
# - OPEN_ROUTER_API_KEY (or OPENAI_API_KEY if using direct OpenAI)
# - OPENAI_MODEL (e.g. gpt-4o)
# - Supabase URL + service role key + email settings for delete-account emails
npm run dev
```

API runs at `http://localhost:3001`. Main endpoints:

- `POST /api/analyze` — multipart form with `image`; returns `{ timeTaken, accuracyRate, recoveryRate, cropType?, recommendations?, insights? }`
- `POST /api/recommendations` — body `{ analysisSummary }`; returns `{ recommendations }`
- `POST /api/insights` — body `{ analysisSummary }`; returns `{ insights }`
- `POST /api/account/delete-request` and `POST /api/account/delete-confirm` — delete‑account flow
- `GET /api/health` — health check

To use your **trained crop model**, set `CROP_MODEL_URL` in `backend/.env`. The backend will POST the image bytes to that URL and expects JSON like:

```json
{
  "timeTaken": 4.8,
  "accuracyRate": 94,
  "recoveryRate": 88,
  "cropType": "Maize (corn) leaf",
  "recommendations": "...",
  "insights": "..."
}
```

`cropType` is optional but recommended; it is shown in the UI and stored in history.

### 3. Frontend

```bash
cd frontend
npm install
# Ensure .env exists with Supabase config (see above)
npm run dev
```

App runs at `http://localhost:5173`. Vite proxies `/api` to the backend (`http://localhost:3001`) in development.

### 4. Production Deployment (Vercel + hosted backend)

1. Deploy the **backend** (e.g. Render/Railway/Fly.io) from the `backend` folder. After deploy you should have a base URL like:
   - `https://your-backend.example.com/api`
2. In the **frontend** Vercel project:
   - Set `VITE_API_BASE_URL=https://your-backend.example.com/api` in Vercel env vars.
3. Push the repo and let Vercel build the `frontend` folder with:
   - Build command: `npm run build`
   - Output: `dist`

In production, all frontend API calls go to `VITE_API_BASE_URL`; locally they continue to use the Vite dev proxy.

## Scripts

| Location   | Command     | Description        |
|-----------|-------------|--------------------|
| Frontend  | `npm run dev` | Start dev server   |
| Frontend  | `npm run build` | Production build   |
| Backend   | `npm run dev` | Start API (with watch) |
| Backend   | `npm start`  | Start API          |

## Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/   # Sidebar, DashboardLayout, PrimaryAnalysisFrame, SecondaryInsightsFrame, modals, etc.
│   │   ├── contexts/     # AuthContext, AppSettingsContext, PrefetchContext
│   │   ├── lib/          # supabaseClient, supabase (profiles), analysisStore, api, pdfExport, notifications, translations
│   │   └── pages/        # Dashboard, Statistics, SignIn, SignUp, ForgotPassword, History, Help, About, Settings, etc.
│   └── ...
├── backend/
│   └── src/
│       ├── routes/      # analyze, recommendations, insights
│       ├── services/    # cropAnalysis, openai
│       └── server.js
└── README.md
```

## License

MIT
"# frontend" 
