import { createHmac, timingSafeEqual } from 'node:crypto';

export const config = { api: { bodyParser: false } };

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', chunk => chunks.push(chunk));
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).end();

  const body = await readBody(request);
  const expected = createHmac('sha256', process.env.LINE_CHANNEL_SECRET || '')
    .update(body)
    .digest('base64');
  const signature = request.headers['x-line-signature'] || '';
  if (!signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return response.status(401).end();
  }

  const payload = JSON.parse(body.toString('utf8'));
  for (const event of payload.events || []) {
    if ((event.type === 'follow' || event.type === 'message') && event.source?.type === 'user') {
      console.info('LINE notification recipient discovered', { userId: event.source.userId });
    }
  }
  return response.status(200).end();
}
