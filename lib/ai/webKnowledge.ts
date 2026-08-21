const ALLOWED_PROTOCOLS = new Set(['https:']);
const MAX_BYTES = 750_000;

function assertUrl(input: string) {
  const url = new URL(input);
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) throw new Error('Only HTTPS sources are allowed.');
  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.local') || /^127\./.test(hostname) || hostname === '::1') throw new Error('Private/local hosts are not allowed.');
  return url;
}

export async function fetchKnowledgeSource(input: string) {
  const url = assertUrl(input);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'user-agent': 'VoxelVault-Knowledge/1.0' }, cache: 'no-store' });
    if (!response.ok) throw new Error(`Source returned ${response.status}.`);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/') && !contentType.includes('json') && !contentType.includes('xml')) throw new Error('Unsupported source type.');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Source body unavailable.');
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) throw new Error('Source is too large.');
      chunks.push(value);
    }
    const bytes = new Uint8Array(total); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { url: url.toString(), contentType, text: new TextDecoder().decode(bytes) };
  } finally { clearTimeout(timeout); }
}
