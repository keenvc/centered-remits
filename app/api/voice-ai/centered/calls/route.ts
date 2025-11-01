/**
 * Get Call Logs for Centered Voice AI Agent
 * GET /api/voice-ai/centered/calls
 */

import { NextResponse } from 'next/server';
import { VoiceAIService } from '@/lib/ghl/voice-ai-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit');

    if (!agentId) {
      return NextResponse.json({
        success: false,
        error: 'agentId parameter is required'
      }, { status: 400 });
    }

    const voiceAIService = new VoiceAIService();
    const callLogs = await voiceAIService.getCallLogs(agentId, {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit: limit ? parseInt(limit) : 50
    });

    return NextResponse.json({
      success: true,
      calls: callLogs,
      total: callLogs.length
    });
  } catch (error: any) {
    console.error('❌ Failed to get call logs:', error);

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
