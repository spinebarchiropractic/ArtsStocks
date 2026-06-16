# ArtsStocks — Portfolio Command

Live portfolio tracker with AI keep/sell analysis.

## Deploy in 3 steps

### 1. Push to GitHub
After creating your repo at github.com/new, run these commands in Terminal:

```
cd ~/Downloads/artsstocks
git init
git add .
git commit -m "Initial deploy"
git branch -M main
git remote add origin https://github.com/spinebarchiropractic/ArtsStocks.git
git push -u origin main
```

### 2. Connect to Vercel
1. Go to vercel.com → New Project
2. Import your ArtsStocks GitHub repo
3. Framework: Vite (auto-detected)
4. Click Deploy

### 3. Add your Finnhub key (optional but recommended)
In Vercel dashboard → Settings → Environment Variables:
- Name: `FINNHUB_KEY`
- Value: `d8oop4pr01qn89hstlrgd8oop4pr01qn89hstls0`

That's it. Live in ~2 minutes.
