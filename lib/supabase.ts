import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Export createClient function for server-side usage
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

// Database helper functions
export async function getPatients() {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getPatientById(id: string) {
  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      invoices (*, line_items (*)),
      patient_plans (*)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      patients (id, first_name, last_name),
      practices (name),
      doctors (first_name, last_name)
    `)
    .order('date_of_service', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getWebhookEvents() {
  const { data, error } = await supabase
    .from('webhook_events')
    .select('*')
    .order('received_at', { ascending: false })
    .limit(50);
  
  if (error) throw error;
  return data;
}

export async function getPayments() {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      patients (first_name, last_name),
      invoice_payments (*, invoices (*))
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getDashboardStats() {
  const [patients, invoices, payments, webhooks] = await Promise.all([
    supabase.from('patients').select('id', { count: 'exact', head: true }),
    supabase.from('invoices').select('id', { count: 'exact', head: true }),
    supabase.from('payments').select('id', { count: 'exact', head: true }),
    supabase.from('webhook_events').select('id', { count: 'exact', head: true })
  ]);

  // Get total balance
  const { data: balanceData } = await supabase
    .from('patients')
    .select('balance_cents');
  
  const totalBalance = balanceData?.reduce((sum, p) => sum + (p.balance_cents || 0), 0) || 0;

  return {
    patientCount: patients.count || 0,
    invoiceCount: invoices.count || 0,
    paymentCount: payments.count || 0,
    webhookCount: webhooks.count || 0,
    totalBalanceCents: totalBalance
  };
}

// Real-time subscription helper
export function subscribeToWebhookEvents(callback: (payload: any) => void) {
  return supabase
    .channel('webhook_events')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'webhook_events'
    }, callback)
    .subscribe();
}
