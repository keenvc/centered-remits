/**
 * GoHighLevel Calendar Management Service
 * Create and manage calendars for staff members
 */

import { getGHLClient, GHL_CONFIG } from './client';

export interface CalendarData {
  name: string;
  description?: string;
  slug: string; // Custom URL
  teamMembers?: Array<{
    userId: string;
    priority: number;
  }>;
  eventType?: 'RoundRobin_OptimizeForAvailability' | 'RoundRobin_OptimizeForEqualDistribution' | 'Event_Class' | 'Event_Collective';
  appoinmentPerSlot?: number;
  appoinmentPerDay?: number;
  openHours?: Array<{
    daysOfTheWeek: number[];
    hours: Array<{
      openHour: number;
      openMinute: number;
      closeHour: number;
      closeMinute: number;
    }>;
  }>;
  enableRecurring?: boolean;
  recurring?: {
    freq: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    interval: number;
    occurrences: number;
  };
  formId?: string;
  stickyContact?: boolean;
  isLivePaymentMode?: boolean;
  autoConfirm?: boolean;
  shouldSendAlertEmailsToAssignedMember?: boolean;
  alertEmail?: string;
  googleInvitationEmails?: boolean;
  allowReschedule?: boolean;
  allowCancellation?: boolean;
  shouldAssignContactToTeamMember?: boolean;
  shouldSkipAssigningContactForExisting?: boolean;
  notes?: string;
  pixelId?: string;
  formSubmitType?: string;
  formSubmitRedirectURL?: string;
  formSubmitThanksMessage?: string;
  availabilityType?: number;
  guestType?: string;
  consentLabel?: string;
  calendarCoverImage?: string;
}

export interface CreatedCalendar {
  id: string;
  name: string;
  slug: string;
  locationId: string;
  userId?: string;
  bookingUrl: string;
}

const CENTERED_LOCATION_ID = 'tjZJ0hbW7tD1I21hCS41';

export class CalendarManagementService {
  private ghl: ReturnType<typeof getGHLClient> | null = null;
  private baseUrl = 'https://services.leadconnectorhq.com';

  private getClient() {
    if (!this.ghl) {
      this.ghl = getGHLClient();
    }
    return this.ghl;
  }

  /**
   * Create a personal booking calendar for a staff member
   */
  async createPersonalCalendar(
    userId: string,
    firstName: string,
    lastName: string,
    slug: string
  ): Promise<CreatedCalendar> {
    try {
      const fullName = `${firstName} ${lastName}`;
      console.log(`📅 Creating calendar for ${fullName}...`);

      const calendarData = {
        locationId: CENTERED_LOCATION_ID,
        name: `${fullName} - Personal Booking`,
        description: `Personal booking calendar for ${fullName}`,
        slug: slug,
        teamMembers: [
          {
            userId: userId,
            priority: 1
          }
        ],
        eventType: 'RoundRobin_OptimizeForAvailability',
        appoinmentPerSlot: 1,
        appoinmentPerDay: 10,
        availabilities: [
          {
            date: 'MON',
            hours: [
              {
                openHour: 9,
                openMinute: 0,
                closeHour: 17,
                closeMinute: 0
              }
            ]
          },
          {
            date: 'TUE',
            hours: [
              {
                openHour: 9,
                openMinute: 0,
                closeHour: 17,
                closeMinute: 0
              }
            ]
          },
          {
            date: 'WED',
            hours: [
              {
                openHour: 9,
                openMinute: 0,
                closeHour: 17,
                closeMinute: 0
              }
            ]
          },
          {
            date: 'THU',
            hours: [
              {
                openHour: 9,
                openMinute: 0,
                closeHour: 17,
                closeMinute: 0
              }
            ]
          },
          {
            date: 'FRI',
            hours: [
              {
                openHour: 9,
                openMinute: 0,
                closeHour: 17,
                closeMinute: 0
              }
            ]
          }
        ],
        enableRecurring: false,
        autoConfirm: false,
        shouldSendAlertEmailsToAssignedMember: true,
        allowReschedule: true,
        allowCancellation: true,
        shouldAssignContactToTeamMember: true,
        shouldSkipAssigningContactForExisting: false,
        availabilityType: 1, // Personal booking
        guestType: 'count_only'
      };

      const token = process.env.GHL_API_TOKEN_CENTERED || process.env.GHL_API_TOKEN;
      
      const response = await fetch(`${this.baseUrl}/calendars/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify(calendarData)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create calendar: ${response.status} - ${error}`);
      }

      const result = await response.json();
      console.log(`✅ Calendar created: ${result.calendar?.id || result.id}`);

      const calendarId = result.calendar?.id || result.id;
      const bookingUrl = `https://centered.one/calendars/${slug}`;

      return {
        id: calendarId,
        name: `${fullName} - Personal Booking`,
        slug: slug,
        locationId: CENTERED_LOCATION_ID,
        userId: userId,
        bookingUrl: bookingUrl
      };
    } catch (error: any) {
      console.error(`❌ Failed to create calendar:`, error.message);
      throw error;
    }
  }

  /**
   * Get all calendars for location
   */
  async getCalendars(): Promise<any[]> {
    try {
      const calendars = await this.getClient().calendars.getCalendars({
        locationId: CENTERED_LOCATION_ID
      });

      return calendars.calendars || [];
    } catch (error: any) {
      console.error('❌ Failed to get calendars:', error.message);
      throw error;
    }
  }

  /**
   * Get calendar by ID
   */
  async getCalendar(calendarId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/calendars/${calendarId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.GHL_API_TOKEN}`,
            'Version': '2021-07-28'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get calendar: ${response.status}`);
      }

      const result = await response.json();
      return result.calendar || result;
    } catch (error: any) {
      console.error('❌ Failed to get calendar:', error.message);
      throw error;
    }
  }

  /**
   * Update calendar
   */
  async updateCalendar(calendarId: string, updates: Partial<CalendarData>): Promise<any> {
    try {
      console.log(`🔄 Updating calendar: ${calendarId}`);

      const response = await fetch(
        `${this.baseUrl}/calendars/${calendarId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${process.env.GHL_API_TOKEN}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          body: JSON.stringify(updates)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update calendar: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Calendar updated`);
      return result;
    } catch (error: any) {
      console.error('❌ Failed to update calendar:', error.message);
      throw error;
    }
  }

  /**
   * Delete calendar
   */
  async deleteCalendar(calendarId: string): Promise<void> {
    try {
      console.log(`🗑️  Deleting calendar: ${calendarId}`);

      const response = await fetch(
        `${this.baseUrl}/calendars/${calendarId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.GHL_API_TOKEN}`,
            'Version': '2021-07-28'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete calendar: ${response.status}`);
      }

      console.log(`✅ Calendar deleted`);
    } catch (error: any) {
      console.error('❌ Failed to delete calendar:', error.message);
      throw error;
    }
  }

  /**
   * Bulk create calendars for multiple users
   */
  async bulkCreateCalendars(
    users: Array<{
      userId: string;
      firstName: string;
      lastName: string;
      slug: string;
    }>
  ): Promise<{
    successful: CreatedCalendar[];
    failed: Array<{ user: any; error: string }>;
  }> {
    const successful: CreatedCalendar[] = [];
    const failed: Array<{ user: any; error: string }> = [];

    for (const user of users) {
      try {
        const calendar = await this.createPersonalCalendar(
          user.userId,
          user.firstName,
          user.lastName,
          user.slug
        );
        successful.push(calendar);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        failed.push({
          user,
          error: error.message
        });
      }
    }

    return { successful, failed };
  }
}
