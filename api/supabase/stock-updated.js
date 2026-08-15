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
    const queueUrl = new URL('/rest/v1/stock_notification_queue', required('SUPABASE_URL'));
    const queueResponse = await fetch(queueUrl, {
      method: 'POST',
      headers: {
        apikey: required('SUPABASE_SERVICE_ROLE_KEY'),
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        event_type: action,
        item_name: item.name,
        item_location: item.location || '場所未設定',
        item_status: item.status || null,
      }),
    });
    if (!queueResponse.ok) throw new Error(`Supabase queue error: ${queueResponse.status}`);

    return response.status(200).json({ ok: true, queued: true });
  } catch (error) {
    console.error('Stock update notification failed', error);
    return response.status(500).json({ error: 'Stock update notification failed' });
  }
}
