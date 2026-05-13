/**
 * Триггер для Supabase Edge `defect-attachments-cleanup`: внешний планировщик (GET или POST).
 *
 * Переменные окружения (Vercel → Settings → Environment Variables):
 * - CRON_SECRET — случайная строка; входящий запрос: Authorization: Bearer <CRON_SECRET>
 *   (тот же секрет должен быть в секретах Edge для `defect-attachments-cleanup`, иначе функция ответит 401).
 * - SUPABASE_DEFECT_ATTACHMENTS_CLEANUP_URL — https://<ref>.supabase.co/functions/v1/defect-attachments-cleanup
 * - SUPABASE_CRON_ANON_KEY — legacy anon public (JWT eyJ…), тот же смысл, что VITE_SUPABASE_ANON_KEY / вызов send-due-cron;
 *   передаётся заголовком apikey (шлюз Supabase).
 */
module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).setHeader('Allow', 'GET, POST').end('Method Not Allowed')
    return
  }

  const expected = process.env.CRON_SECRET
  const auth = req.headers.authorization || ''
  if (!expected || auth !== `Bearer ${expected}`) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }

  const url = process.env.SUPABASE_DEFECT_ATTACHMENTS_CLEANUP_URL
  const anon = process.env.SUPABASE_CRON_ANON_KEY
  if (!url || !anon) {
    res.status(500).json({
      error: 'missing_env',
      hint: 'Set SUPABASE_DEFECT_ATTACHMENTS_CLEANUP_URL and SUPABASE_CRON_ANON_KEY on Vercel',
    })
    return
  }

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${expected}`,
        apikey: anon,
        'Content-Type': 'application/json',
      },
      body: '{}',
    })
    const text = await r.text()
    const ct = r.headers.get('content-type') || 'application/json; charset=utf-8'
    res.status(r.status).setHeader('Content-Type', ct).send(text)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) })
  }
}
