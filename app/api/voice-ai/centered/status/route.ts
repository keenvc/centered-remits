/**
 * Get Status of Centered Voice AI Agent
 * GET /api/voice-ai/centered/status
 */

import { NextResponse } from 'next/server';
import { VoiceAIService } from '@/lib/ghl/voice-ai-service';
import { getCenteredBusinessInfo } from '@/lib/firecrawl/centered-scraper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    // Check prerequisites
    const checks = {
      firecrawlApiKey: !!process.env.FIRECRAWL_API_KEY,
      ghlApiToken: !!process.env.GHL_API_TOKEN,
      knowledgeBase: false,
      agent: false,
      agentDetails: null as any
    };

    // Check knowledge base
    const businessInfo = await getCenteredBusinessInfo();
    checks.knowledgeBase = !!businessInfo;

    // Check agent if ID provided
    if (agentId) {
      try {
        const voiceAIService = new VoiceAIService();
        const agent = await voiceAIService.getAgent(agentId);
        checks.agent = true;
        checks.agentDetails = agent;
      } catch (error) {
        checks.agent = false;
      }
    }

    const allReady = checks.firecrawlApiKey && checks.ghlApiToken && checks.knowledgeBase;

    return NextResponse.json({
      success: true,
      status: allReady ? (checks.agent ? 'ready' : 'ready-to-setup') : 'not-ready',
      checks,
      nextSteps: allReady 
        ? (checks.agent 
          ? ['Agent is running! Test by calling the assigned phone number']
          : ['Run POST /api/voice-ai/centered/setup to create the agent']
        )
        : [
          !checks.firecrawlApiKey && 'Add FIRECRAWL_API_KEY environment variable',
          !checks.ghlApiToken && 'Add GHL_API_TOKEN environment variable',
          !checks.knowledgeBase && 'Run POST /api/firecrawl/scrape-centered to populate knowledge base'
        ].filter(Boolean)
    });
  } catch (error: any) {
    console.error('❌ Status check failed:', error);

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
