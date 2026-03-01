import { NextRequest, NextResponse } from 'next/server';
import { cleanupOldRecords } from '@/lib/db/cleanup';
import { checkCronRateLimit } from '@/lib/rate-limit';

/**
 * Vercel Cron Job endpoint for cleaning up old records
 * Scheduled to run daily at 3:00 AM UTC
 *
 * Requires CRON_SECRET environment variable to be set
 */
export async function GET(request: NextRequest) {
  const rateCheck = await checkCronRateLimit();
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter) } }
    );
  }

  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET environment variable not set');
    return NextResponse.json(
      { error: 'Cron job not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const result = await cleanupOldRecords();

    console.log('Cleanup completed:', result);

    return NextResponse.json({
      success: true,
      deleted: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cleanup failed:', error);
    return NextResponse.json(
      {
        error: 'Cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
