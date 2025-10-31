/**
 * GoHighLevel Contact Service
 * Direct API approach for contact/patient management
 */

import { getGHLClient, GHL_CONFIG } from './client';
import { getSupabaseClient } from '../supabase';

// Lazy getter for Supabase client
function getSupabase() {
  return getSupabaseClient();
}

export interface PatientData {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  date_of_birth?: string;
  mrn?: string;
  ghl_contact_id?: string;
}

export class GHLContactService {
  private ghl: ReturnType<typeof getGHLClient> | null = null;

  private getClient() {
    if (!this.ghl) {
      this.ghl = getGHLClient();
    }
    return this.ghl;
  }

  /**
   * Sync single patient to GHL (Direct API - user-initiated)
   * Use this for: User clicks "Sync" button
   */
  async syncPatientToGHL(patientId: string): Promise<string> {
    try {
      // Get patient data
      const { data: patient, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error || !patient) {
        throw new Error('Patient not found');
      }

      const contactData = {
        locationId: GHL_CONFIG.locationId,
        firstName: patient.first_name,
        lastName: patient.last_name,
        email: patient.email || undefined,
        phone: patient.phone || undefined,
        address1: patient.address || undefined,
        city: patient.city || undefined,
        state: patient.state || undefined,
        postalCode: patient.zip || undefined,
        dateOfBirth: patient.date_of_birth || undefined,
        source: 'Centered Webapp',
        tags: ['patient', 'centered'],
        customFields: patient.mrn ? [
          { key: 'mrn', field_value: patient.mrn }
        ] : []
      };

      let ghlContactId: string;

      if (patient.ghl_contact_id) {
        // Update existing contact
        await this.getClient().contacts.updateContact({
          contactId: patient.ghl_contact_id,
          ...contactData
        });
        ghlContactId = patient.ghl_contact_id;
        console.log(`✅ Updated GHL contact: ${ghlContactId}`);
      } else {
        // Create new contact
        const response = await this.getClient().contacts.createContact(contactData);
        ghlContactId = response.contact.id;
        console.log(`✅ Created GHL contact: ${ghlContactId}`);
      }

      // Update local record
      await supabase
        .from('patients')
        .update({
          ghl_contact_id: ghlContactId,
          ghl_location_id: GHL_CONFIG.locationId,
          ghl_last_sync_at: new Date().toISOString(),
          ghl_sync_status: 'synced'
        })
        .eq('id', patientId);

      return ghlContactId;
    } catch (error: any) {
      console.error('❌ Failed to sync patient to GHL:', error);
      
      // Update sync status
      await supabase
        .from('patients')
        .update({ ghl_sync_status: 'failed' })
        .eq('id', patientId);

      throw error;
    }
  }

  /**
   * Get contact from GHL (Direct API - fast lookup)
   */
  async getContact(contactId: string) {
    const response = await this.getClient().contacts.getContact({
      contactId
    });
    return response.contact;
  }

  /**
   * Update contact in GHL (Direct API - specific update)
   */
  async updateContact(contactId: string, updates: any) {
    await this.getClient().contacts.updateContact({
      contactId,
      locationId: GHL_CONFIG.locationId,
      ...updates
    });
  }

  /**
   * Search contacts (Direct API - specific criteria)
   */
  async searchContacts(params: {
    query?: string;
    tags?: string[];
    limit?: number;
  }) {
    const response = await this.getClient().contacts.getContacts({
      locationId: GHL_CONFIG.locationId,
      query: params.query,
      limit: params.limit || 20
    });

    return response.contacts || [];
  }

  /**
   * Add tags to contact (Direct API)
   */
  async addTags(contactId: string, tags: string[]) {
    await this.getClient().contacts.addTagsToContact({
      contactId,
      tags
    });
  }

  /**
   * Remove tags from contact (Direct API)
   */
  async removeTags(contactId: string, tags: string[]) {
    await this.getClient().contacts.removeTagsFromContact({
      contactId,
      tags
    });
  }

  /**
   * Sync GHL contact back to Centered patient
   * Called by webhook handler when GHL contact is updated
   */
  async syncGHLContactToPatient(ghlContactId: string): Promise<string> {
    try {
      // Get contact from GHL
      const response = await this.getClient().contacts.getContact({
        contactId: ghlContactId
      });

      const contact = response.contact;

      // Check if patient exists
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('ghl_contact_id', ghlContactId)
        .single();

      const patientData = {
        first_name: contact.firstName,
        last_name: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        address: contact.address1,
        city: contact.city,
        state: contact.state,
        zip: contact.postalCode,
        date_of_birth: contact.dateOfBirth,
        ghl_contact_id: ghlContactId,
        ghl_location_id: contact.locationId,
        ghl_last_sync_at: new Date().toISOString(),
        ghl_sync_status: 'synced'
      };

      if (existingPatient) {
        // Update
        await supabase
          .from('patients')
          .update(patientData)
          .eq('id', existingPatient.id);
        return existingPatient.id;
      } else {
        // Create
        const { data, error } = await supabase
          .from('patients')
          .insert(patientData)
          .select('id')
          .single();

        if (error) throw error;
        return data.id;
      }
    } catch (error: any) {
      console.error('❌ Failed to sync GHL contact to patient:', error);
      throw error;
    }
  }
}
