const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });
  if (request.headers['x-stock-webhook-secret'] !== required('SUPABASE_WEBHOOK_SECRET')) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { type, record, old_record: oldRecord } = request.body || {};
    const item = record || oldRecord;
    if (!item?.name) return response.status(400).json({ error: 'Invalid webhook payload' });

    const action = type === 'INSERT' ? '登録' : type === 'DELETE' ? '削除' : '更新';
    const text = `在庫リストを${action}しました\n${item.name}（${item.location || '場所未設定'}）${item.status ? `：${item.status}` : ''}`;
    const lineResponse = await fetch(LINE_PUSH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${required('LINE_CHANNEL_ACCESS_TOKEN')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: required('LINE_TO_USER_ID'),
        messages: [{ type: 'text', text }],
      }),
    });
    if (!lineResponse.ok) throw new Error(`LINE API error: ${lineResponse.status}`);

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Stock update notification failed', error);
    return response.status(500).json({ error: 'Stock update notification failed' });
  }
}
