// Database client for Render PostgreSQL with Prisma
// Replaces lib/supabase.ts

import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ============================================
// PATIENT & BILLING FUNCTIONS
// ============================================

export async function getPatients() {
  return await prisma.patients.findMany({
    orderBy: { created_at: 'desc' }
  });
}

export async function getPatientById(id: string) {
  const patient = await prisma.patients.findUnique({
    where: { id },
    include: {
      invoices: {
        include: { line_items: true },
        orderBy: { date_of_service: 'desc' }
      },
      patient_plans: true,
      payments: {
        orderBy: { payment_date: 'desc' }
      },
      square_transactions: {
        orderBy: { transaction_date: 'desc' }
      },
      clinical_notes: {
        orderBy: { note_date: 'desc' },
        take: 10
      },
      patient_surveys: {
        orderBy: { completed_date: 'desc' },
        take: 10
      }
    }
  });

  if (!patient) {
    return null;
  }

  // Fetch appointments from osmind_appointments table
  const appointments = await prisma.osmind_appointments.findMany({
    where: {
      patient: {
        OR: [
          { id: patient.id },
          { email: patient.email || '' },
          { first_name: patient.first_name || '', last_name: patient.last_name || '' }
        ]
      }
    },
    orderBy: { appointment_date: 'desc' },
    take: 20
  });

  // Fetch claims from remittance_claims table using patient name
  const claims = await prisma.remittance_claims.findMany({
    where: {
      OR: [
        { patient_id: patient.id },
        { patient_name: { contains: `${patient.last_name}`, mode: 'insensitive' } }
      ]
    },
    orderBy: { claim_date_from: 'desc' },
    take: 20
  });

  return {
    ...patient,
    appointments,
    claims
  };
}

export async function getInvoices() {
  return await prisma.invoices.findMany({
    include: {
      patient: {
        select: {
          id: true,
          first_name: true,
          last_name: true
        }
      },
      practice: {
        select: { name: true }
      },
      doctor: {
        select: {
          first_name: true,
          last_name: true
        }
      }
    },
    orderBy: { date_of_service: 'desc' }
  });
}

export async function getWebhookEvents() {
  return await prisma.webhook_events.findMany({
    orderBy: { received_at: 'desc' },
    take: 50
  });
}

export async function getPayments() {
  return await prisma.payments.findMany({
    include: {
      patient: {
        select: {
          first_name: true,
          last_name: true
        }
      },
      invoice_payments: {
        include: {
          invoice: true
        }
      }
    },
    orderBy: { created_at: 'desc' }
  });
}

export async function getDashboardStats() {
  const [patientCount, invoiceCount, paymentCount, webhookCount, patients] = await Promise.all([
    prisma.patients.count(),
    prisma.invoices.count(),
    prisma.payments.count(),
    prisma.webhook_events.count(),
    prisma.patients.findMany({
      select: { balance_cents: true }
    })
  ]);

  const totalBalanceCents = patients.reduce((sum, p) => sum + (p.balance_cents || 0), 0);

  return {
    patientCount,
    invoiceCount,
    paymentCount,
    webhookCount,
    totalBalanceCents
  };
}

// ============================================
// REMITTANCE FUNCTIONS
// ============================================

export async function getRemittanceDocuments() {
  return await prisma.remittance_documents.findMany({
    include: {
      checks: {
        include: {
          _count: {
            select: { claims: true }
          }
        }
      }
    },
    orderBy: { transaction_date: 'desc' }
  });
}

export async function getRemittanceById(id: string) {
  return await prisma.remittance_documents.findUnique({
    where: { id },
    include: {
      checks: {
        include: {
          claims: {
            include: {
              line_items: {
                include: {
                  adjustments: true
                }
              }
            }
          }
        }
      }
    }
  });
}

// ============================================
// CREATE/UPDATE FUNCTIONS
// ============================================

export async function createPatient(data: any) {
  return await prisma.patients.create({ data });
}

export async function updatePatient(id: string, data: any) {
  return await prisma.patients.update({
    where: { id },
    data
  });
}

export async function createInvoice(data: any) {
  return await prisma.invoices.create({
    data,
    include: {
      line_items: true
    }
  });
}

export async function createWebhookEvent(data: any) {
  return await prisma.webhook_events.create({ data });
}

export async function markWebhookProcessed(id: string) {
  return await prisma.webhook_events.update({
    where: { id },
    data: {
      processed: true,
      processed_at: new Date()
    }
  });
}

// ============================================
// REAL-TIME REPLACEMENT (Polling)
// ============================================

// Since Render PostgreSQL doesn't have built-in realtime,
// implement polling on the client side or use WebSockets

export async function getLatestWebhooks(since: Date) {
  return await prisma.webhook_events.findMany({
    where: {
      received_at: {
        gt: since
      }
    },
    orderBy: { received_at: 'desc' }
  });
}

// ============================================
// SQUARE TRANSACTION FUNCTIONS
// ============================================

export async function getSquareTransactionsByPatient(patientId: string) {
  return await prisma.square_transactions.findMany({
    where: { patient_id: patientId },
    orderBy: { transaction_date: 'desc' }
  });
}

export async function createSquareTransaction(data: any) {
  return await prisma.square_transactions.create({
    data: {
      patient_id: data.patient_id,
      square_id: data.square_id,
      order_id: data.order_id,
      amount_cents: data.amount_cents,
      tip_amount_cents: data.tip_amount_cents || 0,
      total_cents: (data.amount_cents || 0) + (data.tip_amount_cents || 0),
      currency: data.currency || 'USD',
      status: data.status,
      payment_method: data.payment_method,
      receipt_url: data.receipt_url,
      transaction_date: data.transaction_date || new Date()
    }
  });
}

// ============================================
// CLINIC DATA FUNCTIONS
// ============================================

export async function getClinicalNotesByPatient(patientId: string) {
  return await prisma.clinical_notes.findMany({
    where: { patient_id: patientId },
    orderBy: { note_date: 'desc' }
  });
}

export async function getPatientSurveysByPatient(patientId: string) {
  return await prisma.patient_surveys.findMany({
    where: { patient_id: patientId },
    orderBy: { completed_date: 'desc' }
  });
}

export async function createClinicalNote(data: any) {
  return await prisma.clinical_notes.create({ data });
}

export async function createPatientSurvey(data: any) {
  return await prisma.patient_surveys.create({ data });
}

// ============================================
// CLEANUP
// ============================================

export async function cleanup() {
  await prisma.$disconnect();
}
