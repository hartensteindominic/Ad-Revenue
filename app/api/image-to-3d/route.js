import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MESHY_ENDPOINT = 'https://api.meshy.ai/openapi/v1/image-to-3d';

export async function POST(request) {
  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false, error: 'Image-to-3D generation is not configured. Add MESHY_API_KEY to Vercel Production.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const imageUrl = typeof body?.imageUrl === 'string' ? body.imageUrl.trim() : '';
    if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
      return NextResponse.json({ error: 'A public JPG, JPEG, or PNG product image URL is required.' }, { status: 400 });
    }

    const response = await fetch(MESHY_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        model_type: 'standard',
        ai_model: 'latest',
        ultra_mode: true,
        image_enhancement: true,
        remove_lighting: true,
        should_texture: true,
        enable_pbr: true,
        texture_resolution: '4k',
        texture_image_url: imageUrl,
        texture_prompt: 'Photorealistic commercial product reconstruction. Preserve the exact visible product proportions, silhouette, materials, colors, buttons, seams, openings, hardware, and surface details from the reference image. Do not add decorative elements or invent branding. Produce a clean physically based material suitable for an e-commerce digital twin.',
        target_formats: ['glb'],
        auto_size: true,
        origin_at: 'bottom',
        multi_view_thumbnails: true,
      }),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({ error: data?.message || data?.error || data?.task_error?.message || 'Image-to-3D provider rejected the request.' }, { status: response.status });
    }

    return NextResponse.json({ configured: true, taskId: data?.result || data?.id || null });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Image-to-3D request failed.' }, { status: 500 });
  }
}

export async function GET(request) {
  const apiKey = process.env.MESHY_API_KEY;
  const taskId = new URL(request.url).searchParams.get('taskId');
  if (!apiKey) return NextResponse.json({ configured: false, error: 'Image-to-3D generation is not configured.' }, { status: 503 });
  if (!taskId) return NextResponse.json({ error: 'taskId is required.' }, { status: 400 });

  try {
    const response = await fetch(`${MESHY_ENDPOINT}/${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: data?.message || data?.error || data?.task_error?.message || 'Unable to read 3D generation status.' }, { status: response.status });

    return NextResponse.json({
      configured: true,
      status: data?.status || 'PENDING',
      progress: data?.progress ?? 0,
      modelUrl: data?.model_urls?.glb || null,
      thumbnailUrl: data?.thumbnail_url || null,
      thumbnailUrls: data?.thumbnail_urls || null,
      error: data?.task_error?.message || null,
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || '3D generation status request failed.' }, { status: 500 });
  }
}
