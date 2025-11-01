'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navigation from '@/app/components/Navigation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, CreditCard, FileText, TrendingUp, AlertCircle, Calendar, Receipt, DollarSign, FileCheck } from 'lucide-react';
import Link from 'next/link';
import SquareInvoiceModal from '@/components/SquareInvoiceModal';
import Image from 'next/image';

interface SquareTransaction {
  id: string;
  square_id?: string;
  amount_cents: number;
  tip_amount_cents: number;
  total_cents: number;
  status?: string;
  payment_method?: string;
  receipt_url?: string;
  transaction_date: string;
}

interface PatientDetail {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  cell_phone?: string;
  date_of_birth?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  balance_cents: number;
  square_transactions?: SquareTransaction[];
  clinical_notes?: any[];
  patient_surveys?: any[];
  appointments?: any[];
  invoices?: any[];
  payments?: any[];
  claims?: any[];
}

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = params.id as string;
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [squareModalOpen, setSquareModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function loadPatient() {
      try {
        const response = await fetch(`/api/patients/${patientId}`);
        if (response.ok) {
          const data = await response.json();
          setPatient(data);
        }
      } catch (error) {
        console.error('Error loading patient:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPatient();
  }, [patientId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500">Patient not found</p>
            <Link href="/patients" className="text-blue-600 hover:text-blue-700 mt-4">
              Back to Patients
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const totalSquareTransactions = patient.square_transactions?.length || 0;
  const totalSquareAmount = (patient.square_transactions || []).reduce((sum, t) => sum + t.total_cents, 0);
  const totalInvoices = patient.invoices?.length || 0;
  const totalPayments = patient.payments?.length || 0;
  const totalAppointments = patient.appointments?.length || 0;
  const totalClaims = patient.claims?.length || 0;

  const handleSquareInvoiceSubmit = async (sendEmail: boolean, sendText: boolean) => {
    try {
      console.log('Sending Square invoice for balance:', {
        patient,
        amount: (patient.balance_cents || 0) / 100,
        sendEmail,
        sendText
      });

      const response = await fetch('/api/square/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: patient.id,
          patient_name: `${patient.first_name} ${patient.last_name}`,
          patient_email: patient.email,
          patient_phone: patient.cell_phone || patient.phone,
          amount: (patient.balance_cents || 0) / 100,
          send_email: sendEmail,
          send_text: sendText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invoice');
      }

      const messages = [];
      if (data.email_sent) messages.push('✓ Email sent');
      if (data.text_sent) messages.push('✓ Text sent');
      
      alert(
        `Square invoice sent successfully!\n\n` +
        `Invoice #${data.invoice_number || 'N/A'}\n` +
        `Amount: ${formatCurrency(patient.balance_cents || 0)}\n\n` +
        messages.join('\n')
      );

    } catch (error: any) {
      console.error('Error sending invoice:', error);
      alert(`Failed to send invoice: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/patients" className="flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Patients
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="text-gray-600 mt-2">{patient.email}</p>
        </div>

        {/* Patient Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Phone</p>
            <p className="text-xl font-bold text-gray-900 mt-2">{patient.cell_phone || patient.phone || 'N/A'}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
               onClick={() => patient.balance_cents > 0 && setSquareModalOpen(true)}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Account Balance</p>
              {patient.balance_cents > 0 && (
                <Image
                  src="https://mira.au/wp-content/uploads/2023/02/square-invert.png"
                  alt="Square"
                  width={20}
                  height={20}
                  className="w-5 h-5 opacity-70 hover:opacity-100"
                  title="Click to send Square invoice"
                />
              )}
            </div>
            <p className={`text-xl font-bold mt-2 ${patient.balance_cents > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(patient.balance_cents)}
            </p>
            {patient.balance_cents > 0 && (
              <p className="text-xs text-gray-500 mt-1">Click to send invoice</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Total Invoices</p>
            <p className="text-xl font-bold text-gray-900 mt-2">{totalInvoices}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Total Payments</p>
            <p className="text-xl font-bold text-gray-900 mt-2">{totalPayments}</p>
          </div>
        </div>

        {/* Demographics Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Demographics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Date of Birth</p>
              <p className="text-base font-medium text-gray-900">
                {patient.date_of_birth ? formatDate(patient.date_of_birth) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-base font-medium text-gray-900">{patient.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="text-base font-medium text-gray-900">{patient.cell_phone || patient.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="text-base font-medium text-gray-900">
                {patient.address_line1 ? (
                  <>
                    {patient.address_line1}
                    {patient.address_line2 && <>, {patient.address_line2}</>}
                    <br />
                    {patient.city && `${patient.city}, `}
                    {patient.state} {patient.zip_code}
                  </>
                ) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'appointments'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-1" />
                Appointments ({totalAppointments})
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'invoices'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Receipt className="w-4 h-4 inline mr-1" />
                Invoices ({totalInvoices})
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'payments'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-4 h-4 inline mr-1" />
                Payments ({totalPayments})
              </button>
              <button
                onClick={() => setActiveTab('claims')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'claims'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileCheck className="w-4 h-4 inline mr-1" />
                Claims ({totalClaims})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium">Appointments</p>
                    <p className="text-2xl font-bold text-blue-700">{totalAppointments}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium">Invoices</p>
                    <p className="text-2xl font-bold text-green-700">{totalInvoices}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-600 font-medium">Payments</p>
                    <p className="text-2xl font-bold text-purple-700">{totalPayments}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-sm text-orange-600 font-medium">Claims</p>
                    <p className="text-2xl font-bold text-orange-700">{totalClaims}</p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {patient.appointments && patient.appointments.slice(0, 3).map((apt: any) => (
                      <div key={apt.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Appointment</p>
                          <p className="text-xs text-gray-600">{formatDate(apt.appointment_date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appointments' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointments</h3>
                {!patient.appointments || patient.appointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No appointments found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patient.appointments.map((apt: any) => (
                      <div key={apt.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {formatDate(apt.appointment_date)}
                            </p>
                            {apt.appointment_time && (
                              <p className="text-sm text-gray-600 mt-1">{apt.appointment_time}</p>
                            )}
                            {apt.provider_name && (
                              <p className="text-sm text-gray-600">Provider: {apt.provider_name}</p>
                            )}
                          </div>
                          {apt.status && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                              apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                              apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {apt.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'invoices' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoices</h3>
                {!patient.invoices || patient.invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No invoices found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Invoice #</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Balance</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {patient.invoices.map((inv: any) => (
                          <tr key={inv.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{inv.invoice_number || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatDate(inv.date_of_service || inv.created_at)}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {formatCurrency(inv.amount_cents)}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {formatCurrency(inv.balance_cents)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                                inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {inv.status || 'pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payments</h3>
                {!patient.payments || patient.payments.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No payments found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Method</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {patient.payments.map((pmt: any) => (
                          <tr key={pmt.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatDate(pmt.payment_date)}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-green-600">
                              {formatCurrency(pmt.amount_cents)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {pmt.payment_method || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                pmt.status === 'completed' ? 'bg-green-100 text-green-700' :
                                pmt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {pmt.status || 'completed'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'claims' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Claims / Remits</h3>
                {!patient.claims || patient.claims.length === 0 ? (
                  <div className="text-center py-12">
                    <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No claims found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patient.claims.map((claim: any) => (
                      <div key={claim.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900">
                              Claim #{claim.claim_number}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {claim.claim_date_from && `Service: ${formatDate(claim.claim_date_from)}`}
                            </p>
                            {claim.rendering_provider_name && (
                              <p className="text-sm text-gray-600">
                                Provider: {claim.rendering_provider_name}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {claim.claim_charge && (
                              <p className="text-sm text-gray-600">
                                Charge: {formatCurrency(Math.round(claim.claim_charge * 100))}
                              </p>
                            )}
                            {claim.claim_payment && (
                              <p className="text-sm font-medium text-green-600">
                                Paid: {formatCurrency(Math.round(claim.claim_payment * 100))}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Square Transactions Section */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Square Transactions</h2>
          </div>

          {totalSquareTransactions === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tip</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Payment Method</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(patient.square_transactions || [])
                    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
                    .map((transaction: SquareTransaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatDate(new Date(transaction.transaction_date).toISOString())}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.amount_cents)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {transaction.tip_amount_cents > 0 ? formatCurrency(transaction.tip_amount_cents) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {formatCurrency(transaction.total_cents)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {transaction.payment_method || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            transaction.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {transaction.status || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {transaction.receipt_url ? (
                            <a href={transaction.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                              View
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Clinical Notes Section */}
        {patient.clinical_notes && patient.clinical_notes.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">Recent Clinical Notes</h2>
            </div>

            <div className="space-y-4">
              {patient.clinical_notes.slice(0, 5).map((note: any) => (
                <div key={note.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">{note.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{formatDate(note.note_date)}</p>
                      {note.cpt_codes && note.cpt_codes.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {note.cpt_codes.map((code: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {code}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {note.is_signed && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        Signed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Surveys Section */}
        {patient.patient_surveys && patient.patient_surveys.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Recent Surveys</h2>
            </div>

            <div className="space-y-4">
              {patient.patient_surveys.slice(0, 5).map((survey: any) => (
                <div key={survey.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">{survey.survey_name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(survey.completed_date)} • Score: {survey.score}
                        {survey.max_score && ` / ${survey.max_score}`}
                      </p>
                    </div>
                    {survey.severity_level && (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        survey.severity_level === 'severe' || survey.severity_level === 'very_severe' ? 'bg-red-100 text-red-700' :
                        survey.severity_level === 'moderate' || survey.severity_level === 'moderately_severe' ? 'bg-orange-100 text-orange-700' :
                        survey.severity_level === 'mild' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {survey.severity_level?.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Square Invoice Modal */}
      {patient && (
        <SquareInvoiceModal
          isOpen={squareModalOpen}
          onClose={() => setSquareModalOpen(false)}
          onSubmit={handleSquareInvoiceSubmit}
          patientName={`${patient.first_name} ${patient.last_name}`}
          patientEmail={patient.email}
          patientPhone={patient.cell_phone || patient.phone}
          copayAmount={(patient.balance_cents || 0) / 100}
        />
      )}
    </div>
  );
}
