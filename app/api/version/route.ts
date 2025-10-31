import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Read version from package.json
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
    );
    
    // Also include build ID if available
    const buildId = process.env.BUILD_ID || process.env.VERCEL_GIT_COMMIT_SHA || 'dev';
    
    return NextResponse.json({
      version: packageJson.version,
      buildId,
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json({
      version: '0.1.0',
      buildId: 'unknown',
      timestamp: Date.now(),
    });
  }
}
