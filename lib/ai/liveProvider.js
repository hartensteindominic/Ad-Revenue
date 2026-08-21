export async function runLiveAssetProvider(payload, { timeoutMs = 12000 } = {}) {
  const url = process.env.VOXEL_AI_ASSET_PROVIDER_URL;
  const key = process.env.VOXEL_AI_ASSET_PROVIDER_KEY;
  if (!url) return { configured: false, result: null, reason: 'provider-not-configured' };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(key ? { authorization: `Bearer ${key}` } : {}) },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
    return { configured: true, result: data };
  } finally {
    clearTimeout(timeout);
  }
}
