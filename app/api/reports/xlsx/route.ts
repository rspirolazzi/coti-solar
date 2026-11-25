import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { projectSchema } from '@/domain/schemas';
import { buildXlsx } from '@/lib/reports/xlsx';
import { checkRateLimit, clientKey } from '@/lib/rate-limit';
import { slugify } from '@/lib/format';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(clientKey(request, 'report-xlsx'), 5, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: { code: 'rate_limited', message: 'Demasiadas descargas. Esperá un minuto.' } },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } },
    );
  }
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 256 * 1024) {
    return NextResponse.json(
      { error: { code: 'payload_too_large', message: 'El cálculo es demasiado grande.' } },
      { status: 413 },
    );
  }

  try {
    const parsed = projectSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'invalid_project', message: 'El cálculo tiene datos inválidos.' } },
        { status: 400 },
      );
    }
    const buffer = await buildXlsx(parsed.data);
    const date = new Date().toISOString().slice(0, 10);
    const filename = `cotisolar-${slugify(parsed.data.name) || 'calculo'}-${date}.xlsx`;
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('XLSX generation failed', error);
    return NextResponse.json(
      { error: { code: 'xlsx_failed', message: 'No pudimos generar el Excel.' } },
      { status: 500 },
    );
  }
}
