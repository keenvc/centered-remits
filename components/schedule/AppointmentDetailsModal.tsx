'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CalendarIcon, ClockIcon, UserIcon, VideoCameraIcon } from '@heroicons/react/24/outline';

interface Patient {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
}

interface Appointment {
  id: string;
  osmind_event_id: string;
  patient_id: string;
  appointment_type: string | null;
  start_time: string;
  end_time: string | null;
  status: string | null;
  provider_name: string | null;
  internal_notes: string | null;
  instructions: string | null;
  zoom_link: string | null;
  color: string | null;
  is_all_day: boolean;
  patient: Patient;
}

export default function AppointmentDetailsModal({
  appointment,
  onClose
}: {
  appointment: Appointment;
  onClose: () => void;
}) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const patientName = appointment.patient
    ? `${appointment.patient.first_name || ''} ${appointment.patient.last_name || ''}`.trim() || 'Unknown Patient'
    : 'Unknown Patient';
  
  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-start mb-4">
                  <Dialog.Title as="h3" className="text-2xl font-bold text-gray-900">
                    Appointment Details
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1 hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Status Badge */}
                  <div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status || 'Unknown'}
                    </span>
                  </div>

                  {/* Appointment Type */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Appointment Type</h4>
                    <p className="mt-1 text-lg font-medium text-gray-900">
                      {appointment.appointment_type || 'General Appointment'}
                    </p>
                  </div>

                  {/* Patient Info */}
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <UserIcon className="h-6 w-6 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-500">Patient</h4>
                      <p className="mt-1 text-lg font-medium text-gray-900">{patientName}</p>
                      {appointment.patient?.email && (
                        <p className="text-sm text-gray-600">{appointment.patient.email}</p>
                      )}
                      {appointment.patient?.phone && (
                        <p className="text-sm text-gray-600">{appointment.patient.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <CalendarIcon className="h-6 w-6 text-gray-400 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Date</h4>
                        <p className="mt-1 text-base text-gray-900">{formatDate(appointment.start_time)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ClockIcon className="h-6 w-6 text-gray-400 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Time</h4>
                        <p className="mt-1 text-base text-gray-900">
                          {formatTime(appointment.start_time)}
                          {appointment.end_time && ` - ${formatTime(appointment.end_time)}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Provider */}
                  {appointment.provider_name && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Provider</h4>
                      <p className="mt-1 text-base text-gray-900">{appointment.provider_name}</p>
                    </div>
                  )}

                  {/* Zoom Link */}
                  {appointment.zoom_link && (
                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                      <VideoCameraIcon className="h-6 w-6 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-700">Virtual Meeting</h4>
                        <a
                          href={appointment.zoom_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-blue-600 hover:text-blue-700 underline text-sm"
                        >
                          Join Zoom Meeting
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Internal Notes */}
                  {appointment.internal_notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Internal Notes</h4>
                      <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                        {appointment.internal_notes}
                      </p>
                    </div>
                  )}

                  {/* Instructions */}
                  {appointment.instructions && !appointment.zoom_link && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Instructions</h4>
                      <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                        {appointment.instructions}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                    onClick={onClose}
                  >
                    Close
                  </button>
                  <a
                    href={`/patients/${appointment.patient_id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    View Patient
                  </a>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
