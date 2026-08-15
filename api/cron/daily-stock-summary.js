const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

async function sendLineMessage(text) {
  const response = await fetch(LINE_PUSH_URL, {
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
  if (!response.ok) throw new Error(`LINE API error: ${response.status}`);
}

function buildSummary(items) {
  if (items.length === 0) return '在庫リスト（毎朝8時）\n「少ない」「無い」の商品はありません。';

  const lines = items.slice(0, 45).map(item => `・[${item.status}] ${item.name}（${item.location}）`);
  if (items.length > lines.length) lines.push(`ほか ${items.length - lines.length} 件`);
  return `在庫リスト（毎朝8時）\n${lines.join('\n')}`;
}

export default async function handler(request, response) {
  if (request.headers.authorization !== `Bearer ${required('CRON_SECRET')}`) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const url = new URL('/rest/v1/foods', required('SUPABASE_URL'));
    url.searchParams.set('select', 'name,location,status');
    url.searchParams.set('status', 'in.(少ない,無い)');
    url.searchParams.set('order', 'status.asc,name.asc');

    const stockResponse = await fetch(url, {
      headers: {
        apikey: required('SUPABASE_SERVICE_ROLE_KEY'),
        Authorization: `Bearer ${required('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
    });
    if (!stockResponse.ok) throw new Error(`Supabase API error: ${stockResponse.status}`);

    const items = await stockResponse.json();
    await sendLineMessage(buildSummary(items));
    return response.status(200).json({ ok: true, count: items.length });
  } catch (error) {
    console.error('Daily stock summary failed', error);
    return response.status(500).json({ error: 'Daily stock summary failed' });
  }
}
