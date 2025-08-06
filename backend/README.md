# Letter Analyzer Backend

FastAPI backend for analyzing letters using OpenRouter AI.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file:
```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_SITE_URL=https://your-app-domain.vercel.app
OPENROUTER_SITE_NAME=Letter Analyzer
ENVIRONMENT=development
```

3. Run locally:
```bash
python main.py
```

## API Endpoints

- `GET /` - Health check
- `POST /analyze-letter` - Analyze letter image

## Deployment to Render

1. Connect your GitHub repo to Render
2. Set environment variables in Render dashboard
3. Deploy automatically

## Environment Variables for Render

- `OPENROUTER_API_KEY` - Your OpenRouter API key
- `OPENROUTER_SITE_URL` - Your app URL
- `OPENROUTER_SITE_NAME` - App name 