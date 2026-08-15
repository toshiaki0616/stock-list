const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function notificationRecipients() {
  const raw = process.env.LINE_TO_USER_IDS || process.env.LINE_TO_USER_ID || '';
  const recipients = [...new Set(raw.split(',').map(value => value.trim()).filter(Boolean))];
  if (recipients.length === 0) throw new Error('LINE_TO_USER_IDS is not configured');
  return recipients;
}

async function sendLineMessage(text) {
  await Promise.all(notificationRecipients().map(async to => {
    const lineResponse = await fetch(LINE_PUSH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${required('LINE_CHANNEL_ACCESS_TOKEN')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, messages: [{ type: 'text', text }] }),
    });
    if (!lineResponse.ok) throw new Error(`LINE API error: ${lineResponse.status}`);
  }));
}

function buildSummary(items) {
  const lines = items.slice(0, 40).map(item => {
    const status = item.item_status ? `：${item.item_status}` : '';
    return `・${item.event_type} ${item.item_name}（${item.item_location || '場所未設定'}）${status}`;
  });
  if (items.length > lines.length) lines.push(`ほか ${items.length - lines.length} 件`);
  return `在庫リストの更新（10分まとめ）\n${lines.join('\n')}`;
}

export default async function handler(request, response) {
  if (request.headers.authorization !== `Bearer ${required('CRON_SECRET')}`) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const queueUrl = new URL('/rest/v1/stock_notification_queue', required('SUPABASE_URL'));
    queueUrl.searchParams.set('select', 'id,event_type,item_name,item_location,item_status,created_at');
    queueUrl.searchParams.set('delivered_at', 'is.null');
    queueUrl.searchParams.set('order', 'created_at.asc');
    queueUrl.searchParams.set('limit', '100');

    const queueResponse = await fetch(queueUrl, {
      headers: {
        apikey: required('SUPABASE_SERVICE_ROLE_KEY'),
      },
    });
    if (!queueResponse.ok) throw new Error(`Supabase queue error: ${queueResponse.status}`);

    const items = await queueResponse.json();
    if (items.length === 0) return response.status(200).json({ ok: true, count: 0 });

    await sendLineMessage(buildSummary(items));

    const deliveredUrl = new URL('/rest/v1/stock_notification_queue', required('SUPABASE_URL'));
    deliveredUrl.searchParams.set('id', `in.(${items.map(item => item.id).join(',')})`);
    const deliveredResponse = await fetch(deliveredUrl, {
      method: 'PATCH',
      headers: {
        apikey: required('SUPABASE_SERVICE_ROLE_KEY'),
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ delivered_at: new Date().toISOString() }),
    });
    if (!deliveredResponse.ok) throw new Error(`Supabase queue update error: ${deliveredResponse.status}`);

    return response.status(200).json({ ok: true, count: items.length });
  } catch (error) {
    console.error('Stock change summary failed', error);
    return response.status(500).json({ error: 'Stock change summary failed' });
  }
}
