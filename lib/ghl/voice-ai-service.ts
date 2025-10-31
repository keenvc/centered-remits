/**
 * GoHighLevel Voice AI Service
 * Create and manage voice AI agents with custom actions
 */

import { getGHLClient, GHL_CONFIG } from './client';

export interface VoiceAgentConfig {
  name: string;
  locationId: string;
  businessName: string;
  voice?: string; // Voice ID from GHL
  greeting?: string;
  systemPrompt: string;
  goals: string[];
  businessHours?: {
    timezone: string;
    schedule: {
      [day: string]: { open: string; close: string; } | 'closed';
    };
  };
  fallbackBehavior?: {
    afterHours?: 'voicemail' | 'forward' | 'hang_up';
    forwardTo?: string;
  };
}

export interface CustomAction {
  name: string;
  description: string;
  webhookUrl: string;
  method?: 'POST' | 'GET';
  headers?: Record<string, string>;
  authentication?: {
    type: 'bearer' | 'basic' | 'api_key';
    value: string;
  };
  parameters?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object';
    description: string;
    required: boolean;
  }>;
  conversationTriggers?: string[]; // Keywords that trigger this action
}

export interface VoiceAgent {
  id: string;
  name: string;
  locationId: string;
  status: 'active' | 'inactive';
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export class VoiceAIService {
  private ghl: ReturnType<typeof getGHLClient> | null = null;
  private baseUrl = 'https://services.leadconnectorhq.com';

  private getClient() {
    if (!this.ghl) {
      this.ghl = getGHLClient();
    }
    return this.ghl;
  }

  /**
   * Create a new Voice AI agent
   */
  async createAgent(config: VoiceAgentConfig): Promise<VoiceAgent> {
    try {
      console.log(`🤖 Creating voice AI agent: ${config.name}`);

      const token = process.env.GHL_API_TOKEN_CENTERED || process.env.GHL_API_TOKEN;
      
      const response = await fetch(`${this.baseUrl}/voice-ai/agents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify({
          locationId: config.locationId,
          name: config.name,
          businessName: config.businessName,
          voice: config.voice || 'default', // Use GHL default voice
          greeting: config.greeting || `Hello! This is ${config.businessName}. How can I help you today?`,
          systemPrompt: config.systemPrompt,
          goals: config.goals,
          businessHours: config.businessHours,
          fallbackBehavior: config.fallbackBehavior
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create agent: ${response.status} - ${error}`);
      }

      const agent = await response.json();
      console.log(`✅ Voice AI agent created: ${agent.id}`);

      return agent;
    } catch (error: any) {
      console.error('❌ Failed to create voice AI agent:', error.message);
      throw error;
    }
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<VoiceAgent> {
    try {
      const response = await fetch(`${this.baseUrl}/voice-ai/agents/${agentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_TOKEN}`,
          'Version': '2021-07-28'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get agent: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ Failed to get voice AI agent:', error.message);
      throw error;
    }
  }

  /**
   * Update agent configuration
   */
  async updateAgent(agentId: string, updates: Partial<VoiceAgentConfig>): Promise<VoiceAgent> {
    try {
      console.log(`🔄 Updating voice AI agent: ${agentId}`);

      const response = await fetch(`${this.baseUrl}/voice-ai/agents/${agentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update agent: ${response.status}`);
      }

      const agent = await response.json();
      console.log(`✅ Voice AI agent updated`);

      return agent;
    } catch (error: any) {
      console.error('❌ Failed to update voice AI agent:', error.message);
      throw error;
    }
  }

  /**
   * Delete agent
   */
  async deleteAgent(agentId: string): Promise<void> {
    try {
      console.log(`🗑️  Deleting voice AI agent: ${agentId}`);

      const response = await fetch(`${this.baseUrl}/voice-ai/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_TOKEN}`,
          'Version': '2021-07-28'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete agent: ${response.status}`);
      }

      console.log(`✅ Voice AI agent deleted`);
    } catch (error: any) {
      console.error('❌ Failed to delete voice AI agent:', error.message);
      throw error;
    }
  }

  /**
   * Add custom action to agent
   */
  async addCustomAction(agentId: string, action: CustomAction): Promise<{ id: string; }> {
    try {
      console.log(`➕ Adding custom action: ${action.name} to agent ${agentId}`);

      const response = await fetch(`${this.baseUrl}/voice-ai/actions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify({
          agentId,
          name: action.name,
          description: action.description,
          webhookUrl: action.webhookUrl,
          method: action.method || 'POST',
          headers: action.headers,
          authentication: action.authentication,
          parameters: action.parameters,
          conversationTriggers: action.conversationTriggers
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to add custom action: ${response.status} - ${error}`);
      }

      const actionResult = await response.json();
      console.log(`✅ Custom action added: ${actionResult.id}`);

      return actionResult;
    } catch (error: any) {
      console.error('❌ Failed to add custom action:', error.message);
      throw error;
    }
  }

  /**
   * List all custom actions for an agent
   */
  async listActions(agentId: string): Promise<CustomAction[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voice-ai/agents/${agentId}/actions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_TOKEN}`,
          'Version': '2021-07-28'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list actions: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ Failed to list custom actions:', error.message);
      throw error;
    }
  }

  /**
   * Delete custom action
   */
  async deleteAction(actionId: string): Promise<void> {
    try {
      console.log(`🗑️  Deleting custom action: ${actionId}`);

      const response = await fetch(`${this.baseUrl}/voice-ai/actions/${actionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_TOKEN}`,
          'Version': '2021-07-28'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete action: ${response.status}`);
      }

      console.log(`✅ Custom action deleted`);
    } catch (error: any) {
      console.error('❌ Failed to delete custom action:', error.message);
      throw error;
    }
  }

  /**
   * Assign phone number to agent (Twilio number configured in GHL)
   */
  async assignPhoneNumber(agentId: string, phoneNumberId: string): Promise<void> {
    try {
      console.log(`📞 Assigning phone number to agent: ${agentId}`);

      const response = await fetch(`${this.baseUrl}/voice-ai/agents/${agentId}/phone`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify({
          phoneNumberId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to assign phone number: ${response.status}`);
      }

      console.log(`✅ Phone number assigned to agent`);
    } catch (error: any) {
      console.error('❌ Failed to assign phone number:', error.message);
      throw error;
    }
  }

  /**
   * Get call logs for an agent
   */
  async getCallLogs(agentId: string, options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        agentId,
        ...(options?.startDate && { startDate: options.startDate }),
        ...(options?.endDate && { endDate: options.endDate }),
        ...(options?.limit && { limit: options.limit.toString() })
      });

      const response = await fetch(`${this.baseUrl}/voice-ai/call-logs?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_TOKEN}`,
          'Version': '2021-07-28'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get call logs: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ Failed to get call logs:', error.message);
      throw error;
    }
  }

  /**
   * Get call transcript
   */
  async getCallTranscript(callId: string): Promise<{
    transcript: string;
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/voice-ai/calls/${callId}/transcript`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_TOKEN}`,
          'Version': '2021-07-28'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get transcript: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ Failed to get call transcript:', error.message);
      throw error;
    }
  }
}
