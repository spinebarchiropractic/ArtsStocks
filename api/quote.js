export default async function handler(req, res) {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });

  const FINNHUB_KEY = process.env.FINNHUB_KEY || 'd8oop4pr01qn89hstlrgd8oop4pr01qn89hstls0';

  try {
    const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
    const data = await r.json();
    if (data.c && data.c > 0) {
      res.setHeader('Cache-Control', 's-maxage=30');
      return res.status(200).json({ symbol, price: data.c, open: data.o, high: data.h, low: data.l, prevClose: data.pc });
    }
    return res.status(200).json({ symbol, price: null });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
