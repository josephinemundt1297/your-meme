import express from 'express';

const app = express();
const port = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT muss eine ganze Zahl zwischen 1 und 65535 sein.');
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Route nicht gefunden.' });
});

app.listen(port, () => {
  console.log(`Your-Meme-Backend läuft auf http://localhost:${port}`);
});
