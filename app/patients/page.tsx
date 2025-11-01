'use client';

import { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import { getPatients } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, Download, Filter, User, FileCheck } from 'lucide-react';
import { exportToCSV } from '@/lib/csv-export';
import Link from 'next/link';
import VOBModal from '@/components/VOBModal';
import SquareInvoiceModal from '@/components/SquareInvoiceModal';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vobModalOpen, setVobModalOpen] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [verifications, setVerifications] = useState<{ [key: string]: any }>({});
  const [squareModalOpen, setSquareModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  useEffect(() => {
    async function loadPatients() {
      try {
        const data = await getPatients();
        setPatients(data);
        setFilteredPatients(data);
        
        // Load latest verifications for all patients
        const patientIds = data.map((p: any) => p.id);
        if (patientIds.length > 0) {
          const { data: verificationData } = await supabase
            .from('patient_insurance_verifications')
            .select('*')
            .in('patient_id', patientIds)
            .order('created_at', { ascending: false });
          
          if (verificationData) {
            // Create a map of patient_id -> latest verification
            const verificationMap: { [key: string]: any } = {};
            verificationData.forEach((v: any) => {
              if (!verificationMap[v.patient_id]) {
                verificationMap[v.patient_id] = v;
              }
            });
            setVerifications(verificationMap);
          }
        }
      } catch (error) {
        console.error('Error loading patients:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, []);

  useEffect(() => {
    let filtered = patients;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.cell_phone?.includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(patient => patient.billing_status === statusFilter);
    }

    setFilteredPatients(filtered);
  }, [searchTerm, statusFilter, patients]);

  const handleExportCSV = () => {
    const columns = [
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'cell_phone', label: 'Phone' },
      { key: 'balance_cents', label: 'Balance (cents)' },
      { key: 'billing_status', label: 'Billing Status' },
      { key: 'sync_status', label: 'Sync Status' },
      { key: 'created_at', label: 'Created At' },
    ];
    exportToCSV(filteredPatients, `patients-${new Date().toISOString().split('T')[0]}.csv`, columns);
  };

  const handleVOBClick = (e: React.MouseEvent, patient: any) => {
    e.preventDefault();
    e.stopPropagation();
    const verification = verifications[patient.id];
    if (verification) {
      setSelectedVerification(verification);
      setSelectedPatientName(`${patient.first_name} ${patient.last_name}`);
      setVobModalOpen(true);
    }
  };

  const handleSquareClick = (e: React.MouseEvent, patient: any) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedPatient(patient);
    setSquareModalOpen(true);
  };

  const handleSquareInvoiceSubmit = async (sendEmail: boolean, sendText: boolean) => {
    try {
      const verification = verifications[selectedPatient.id];
      const copayAmount = verification?.copay_amount || 0;

      console.log('Sending Square invoice:', {
        patient: selectedPatient,
        amount: copayAmount,
        sendEmail,
        sendText
      });

      // Call Square invoice API
      const response = await fetch('/api/square/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          patient_name: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
          patient_email: selectedPatient.email,
          patient_phone: selectedPatient.cell_phone,
          amount: copayAmount,
          send_email: sendEmail,
          send_text: sendText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invoice');
      }

      // Show success message
      const messages = [];
      if (data.email_sent) messages.push('✓ Email sent');
      if (data.text_sent) messages.push('✓ Text sent');
      
      alert(
        `Square invoice sent successfully!\n\n` +
        `Invoice #${data.invoice_number || 'N/A'}\n` +
        `Amount: $${copayAmount.toFixed(2)}\n\n` +
        messages.join('\n')
      );

      console.log('Invoice created:', data);

    } catch (error: any) {
      console.error('Error sending invoice:', error);
      alert(`Failed to send invoice: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search patients by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="current">Current</option>
                <option value="overdue">Overdue</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
            )}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Showing {filteredPatients.length} of {patients.length} patients
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Co-Pay $
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VOB
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sync
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => {
                const verification = verifications[patient.id];
                const hasCopay = verification?.copay_amount;
                
                return (
                  <tr 
                    key={patient.id} 
                    onClick={() => window.location.href = `/patients/${patient.id}`}
                    className="hover:bg-gray-50 transition cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            MRN: {patient.health_record_id || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.email}</div>
                      <div className="text-sm text-gray-500">{patient.cell_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        patient.balance_cents > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(patient.balance_cents || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {hasCopay ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-green-700">
                            {formatCurrency(verification.copay_amount * 100)}
                          </span>
                          <button
                            onClick={(e) => handleSquareClick(e, patient)}
                            className="hover:opacity-80 transition z-10 relative"
                            title="Send Square Invoice"
                          >
                            <Image
                              src="https://mira.au/wp-content/uploads/2023/02/square-invert.png"
                              alt="Square"
                              width={20}
                              height={20}
                              className="w-5 h-5"
                            />
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {verification ? (
                        <button
                          onClick={(e) => handleVOBClick(e, patient)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition z-10 relative"
                        >
                          <FileCheck className="w-4 h-4" />
                          View VOB
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">No VOB</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        patient.billing_status === 'paid' ? 'bg-green-100 text-green-800' :
                        patient.billing_status === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {patient.billing_status || 'current'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-xs ${
                        patient.sync_status === 'synced' ? 'text-green-600' :
                        patient.sync_status === 'pending' ? 'text-yellow-600' :
                        'text-gray-400'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          patient.sync_status === 'synced' ? 'bg-green-600' :
                          patient.sync_status === 'pending' ? 'bg-yellow-600' :
                          'bg-gray-400'
                        }`}></div>
                        {patient.sync_status || 'not synced'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
      
      {/* VOB Modal */}
      <VOBModal
        isOpen={vobModalOpen}
        onClose={() => setVobModalOpen(false)}
        verification={selectedVerification}
        patientName={selectedPatientName}
      />
      
      {/* Square Invoice Modal */}
      {selectedPatient && (
        <SquareInvoiceModal
          isOpen={squareModalOpen}
          onClose={() => setSquareModalOpen(false)}
          onSubmit={handleSquareInvoiceSubmit}
          patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
          patientEmail={selectedPatient.email}
          patientPhone={selectedPatient.cell_phone}
          copayAmount={verifications[selectedPatient.id]?.copay_amount || 0}
        />
      )}
    </div>
  );
}
