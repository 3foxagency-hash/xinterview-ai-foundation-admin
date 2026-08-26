import { NextRequest, NextResponse } from 'next/server';

/**
 * Sink endpoint for the setup screen's upload-speed probe. The candidate's
 * browser POSTs a fixed-size, incompressible payload here and times how
 * long the request takes — this route just needs to receive the body and
 * discard it, since only the elapsed time (measured client-side) matters.
 */
export async function POST(request: NextRequest) {
  const body = request.body;
  if (body) {
    // Drain the stream without buffering it in memory.
    await body.pipeTo(new WritableStream({ write() {} })).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
