/**
 * GoHighLevel AI Agent
 * MCP-powered AI for complex queries and workflows
 */

import Anthropic from '@anthropic-ai/sdk';
import { GHL_CONFIG } from './client';

interface QueryOptions {
  includeHistory?: boolean;
  maxTokens?: number;
}

interface QueryResult {
  response: string;
  toolCalls: Array<{ id: string; name: string; input: any }>;
  raw: any;
}

export class GHLAIAgent {
  private client: Anthropic | null = null;
  private conversationHistory: any[] = [];

  private getClient(): Anthropic {
    if (!this.client) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable is not configured');
      }

      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  /**
   * Execute natural language query against GHL
   * Use this for: Complex queries, multi-step workflows, data analysis
   */
  async query(prompt: string, options?: QueryOptions): Promise<QueryResult> {
    const messages = options?.includeHistory 
      ? [...this.conversationHistory, { role: 'user' as const, content: prompt }]
      : [{ role: 'user' as const, content: prompt }];

    const response = await this.getClient().messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: options?.maxTokens || 4096,
      tools: this.getClaudeTools(),
      messages,
      system: this.getSystemPrompt()
    });

    // Extract tool calls
    const toolCalls = this.extractToolCalls(response);

    // Get text response
    const textContent = response.content.find((c: any) => c.type === 'text');
    const responseText = textContent ? textContent.text : 'Operation completed.';

    // Update conversation history
    if (options?.includeHistory) {
      this.conversationHistory.push(
        { role: 'user', content: prompt },
        { role: 'assistant', content: response.content }
      );
    }

    return {
      response: responseText,
      toolCalls,
      raw: response
    };
  }

  /**
   * Execute pre-defined workflow
   * Use this for: Scheduled tasks, automated processes
   */
  async executeWorkflow(workflowName: string, params?: any): Promise<any> {
    const workflows: Record<string, string> = {
      'send-appointment-reminders': `
        Find all appointments scheduled for tomorrow.
        For each appointment:
        1. Get the contact/patient details
        2. Send an SMS reminder: "Hi [name]! Reminder: You have an appointment tomorrow at [time]. Reply CONFIRM to confirm."
        3. Add a note to the appointment: "Reminder sent via AI agent"
        
        Return a summary of how many reminders were sent.
      `,
      
      'follow-up-unpaid-invoices': `
        Find all unpaid invoices where:
        - Balance due is over $100
        - Invoice is more than 30 days old
        
        For each invoice:
        1. Get the patient/contact details
        2. Send SMS: "Hi [name]! This is a friendly reminder about your outstanding balance of $[amount]. You can pay securely here: [payment link]"
        3. Tag the contact as "payment-followup-sent"
        
        Return a summary of how many follow-ups were sent.
      `,
      
      'qualify-new-leads': `
        Find all contacts created in the last 7 days with tag "new-lead".
        
        For each contact:
        1. Review their source, tags, and any custom fields
        2. Check if they've responded to any outreach
        3. Tag them as:
           - "hot-lead" if they've responded or have high-value indicators
           - "warm-lead" if they've shown interest but not responded
           - "cold-lead" if no engagement
        4. For hot and warm leads, create an opportunity in the sales pipeline
        
        Return a summary of how many leads were qualified in each category.
      `,
      
      'sync-all-patients': `
        Get all patients from Centered that don't have a GHL contact ID yet.
        For each patient, create a contact in GoHighLevel with their information.
        Tag them as "patient" and "centered".
        Return a summary of how many patients were synced.
      `,
      
      'clean-duplicate-contacts': `
        Search for duplicate contacts in GoHighLevel based on email or phone number.
        For each set of duplicates:
        1. Identify which contact has the most complete information
        2. List the duplicates found
        3. Suggest which to keep and which to merge/delete
        
        DO NOT delete anything automatically - just provide recommendations.
      `,
      
      'daily-engagement-report': `
        Generate a daily engagement report:
        1. How many new contacts were created today
        2. How many SMS messages were sent/received
        3. How many appointments were booked
        4. How many invoices were created
        5. Any contacts that need immediate attention (unpaid invoices, missed appointments, etc.)
        
        Format as a concise summary report.
      `
    };

    const workflow = workflows[workflowName];
    
    if (!workflow) {
      throw new Error(`Workflow '${workflowName}' not found. Available: ${Object.keys(workflows).join(', ')}`);
    }

    const fullPrompt = workflow + (params ? `\n\nAdditional parameters: ${JSON.stringify(params, null, 2)}` : '');
    
    return await this.query(fullPrompt);
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): any[] {
    return [...this.conversationHistory];
  }

  private getSystemPrompt(): string {
    return `You are an AI assistant with access to GoHighLevel CRM via MCP tools.

**Context:**
- Location ID: ${GHL_CONFIG.locationId}
- Company ID: ${GHL_CONFIG.companyId}
- Business: AdvancedCare Medical Practice
- Application: Centered Patient Management Webapp

**Your Role:**
You help manage patient data, appointments, communications, and payments through GoHighLevel CRM.

**When Using Tools:**
1. Always include locationId: "${GHL_CONFIG.locationId}"
2. For patient operations, use contacts tools
3. For appointments, use calendars tools
4. For SMS/messaging, use conversations tools
5. For billing, use payments/invoices tools

**Response Format:**
- Be concise but informative
- Provide summaries after bulk operations
- Always confirm actions taken
- Report errors clearly

**Important:**
- This is a medical practice - be professional and HIPAA-aware
- Patient data is sensitive - handle with care
- Double-check before making bulk changes
- Always confirm destructive operations`;
  }

  private getClaudeTools() {
    return [
      {
        name: 'get_contacts',
        description: 'Get contacts/patients from GoHighLevel. Can filter and search.',
        input_schema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID (required)' },
            limit: { type: 'number', description: 'Max results (default: 20)' },
            query: { type: 'string', description: 'Search query' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' }
          },
          required: ['locationId']
        }
      },
      {
        name: 'get_contact',
        description: 'Get single contact by ID',
        input_schema: {
          type: 'object',
          properties: {
            contactId: { type: 'string', description: 'Contact ID' }
          },
          required: ['contactId']
        }
      },
      {
        name: 'create_contact',
        description: 'Create a new contact/patient',
        input_schema: {
          type: 'object',
          properties: {
            locationId: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } }
          },
          required: ['locationId', 'firstName', 'lastName']
        }
      },
      {
        name: 'update_contact',
        description: 'Update existing contact',
        input_schema: {
          type: 'object',
          properties: {
            contactId: { type: 'string' },
            locationId: { type: 'string' },
            updates: { type: 'object', description: 'Fields to update' }
          },
          required: ['contactId', 'locationId']
        }
      },
      {
        name: 'add_tags',
        description: 'Add tags to a contact',
        input_schema: {
          type: 'object',
          properties: {
            contactId: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } }
          },
          required: ['contactId', 'tags']
        }
      },
      {
        name: 'send_sms',
        description: 'Send an SMS message to a contact',
        input_schema: {
          type: 'object',
          properties: {
            locationId: { type: 'string' },
            contactId: { type: 'string' },
            message: { type: 'string' }
          },
          required: ['locationId', 'contactId', 'message']
        }
      },
      {
        name: 'get_appointments',
        description: 'Get calendar appointments',
        input_schema: {
          type: 'object',
          properties: {
            calendarId: { type: 'string' },
            startTime: { type: 'string', description: 'ISO date string' },
            endTime: { type: 'string', description: 'ISO date string' }
          },
          required: ['startTime', 'endTime']
        }
      },
      {
        name: 'get_invoices',
        description: 'Get invoices and transactions',
        input_schema: {
          type: 'object',
          properties: {
            locationId: { type: 'string' },
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            status: { type: 'string', enum: ['paid', 'unpaid', 'partial', 'void'] }
          },
          required: ['locationId']
        }
      }
    ];
  }

  private extractToolCalls(response: any): any[] {
    return response.content
      .filter((c: any) => c.type === 'tool_use')
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        input: c.input
      }));
  }

  private async executeMCPTool(toolName: string, args: any): Promise<any> {
    // Map Claude tool names to GHL MCP tool names
    const toolMapping: Record<string, string> = {
      'get_contacts': 'contacts_get-contacts',
      'get_contact': 'contacts_get-contact',
      'create_contact': 'contacts_create-contact',
      'update_contact': 'contacts_update-contact',
      'add_tags': 'contacts_add-tags',
      'send_sms': 'conversations_send-a-new-message',
      'get_appointments': 'calendars_get-calendar-events',
      'get_invoices': 'payments_list-transactions'
    };

    const mcpToolName = toolMapping[toolName] || toolName;

    try {
      const response = await fetch('https://services.leadconnectorhq.com/mcp/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_TOKEN}`,
          'locationId': GHL_CONFIG.locationId,
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: mcpToolName,
            arguments: args
          },
          id: Date.now()
        })
      });

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error(`Failed to execute MCP tool ${mcpToolName}:`, error);
      throw error;
    }
  }
}
