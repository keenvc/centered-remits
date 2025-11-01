'use client';

import { useState, useEffect } from 'react';
import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import { 
  createViewDay, 
  createViewWeek, 
  createViewMonthGrid,
  createViewMonthAgenda 
} from '@schedule-x/calendar';
import '@schedule-x/theme-default/dist/index.css';
import 'temporal-polyfill/global';
import AppointmentDetailsModal from './AppointmentDetailsModal';

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

export default function ScheduleCalendar({ appointments }: { appointments: Appointment[] }) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentsMap, setAppointmentsMap] = useState<{ [key: string]: Appointment }>({});
  
  // Transform appointments to ScheduleX format
  const scheduleXEvents = appointments.map(apt => {
    const patientName = apt.patient 
      ? `${apt.patient.first_name || ''} ${apt.patient.last_name || ''}`.trim() || 'Unknown Patient'
      : 'Unknown Patient';
    
    const appointmentType = apt.appointment_type || 'Appointment';
    
    // Determine color based on status
    let calendarId = 'scheduled'; // Default
    if (apt.status === 'cancelled') {
      calendarId = 'cancelled';
    } else if (apt.status === 'no_show') {
      calendarId = 'no-show';
    } else if (apt.status === 'completed') {
      calendarId = 'completed';
    }
    
    return {
      id: apt.id,
      title: `${patientName} - ${appointmentType}`,
      start: apt.start_time,
      end: apt.end_time || apt.start_time,
      calendarId: calendarId,
      description: apt.internal_notes || undefined,
      location: apt.zoom_link || undefined
    };
  });
  
  // Create map for quick lookup
  useEffect(() => {
    const map: { [key: string]: Appointment } = {};
    appointments.forEach(apt => {
      map[apt.id] = apt;
    });
    setAppointmentsMap(map);
  }, [appointments]);
  
  // Initialize ScheduleX calendar
  const calendar = useCalendarApp({
    locale: 'en-US',
    defaultView: createViewMonthGrid.name,
    views: [
      createViewDay(),
      createViewWeek(),
      createViewMonthGrid(),
      createViewMonthAgenda()
    ],
    events: scheduleXEvents,
    calendars: {
      scheduled: {
        colorName: 'scheduled',
        lightColors: {
          main: '#3b82f6',
          container: '#dbeafe',
          onContainer: '#1e40af'
        },
        darkColors: {
          main: '#60a5fa',
          onContainer: '#dbeafe',
          container: '#1e3a8a'
        }
      },
      completed: {
        colorName: 'completed',
        lightColors: {
          main: '#22c55e',
          container: '#dcfce7',
          onContainer: '#15803d'
        },
        darkColors: {
          main: '#4ade80',
          onContainer: '#dcfce7',
          container: '#14532d'
        }
      },
      cancelled: {
        colorName: 'cancelled',
        lightColors: {
          main: '#ef4444',
          container: '#fee2e2',
          onContainer: '#b91c1c'
        },
        darkColors: {
          main: '#f87171',
          onContainer: '#fee2e2',
          container: '#7f1d1d'
        }
      },
      'no-show': {
        colorName: 'no-show',
        lightColors: {
          main: '#f97316',
          container: '#ffedd5',
          onContainer: '#c2410c'
        },
        darkColors: {
          main: '#fb923c',
          onContainer: '#ffedd5',
          container: '#7c2d12'
        }
      }
    },
    callbacks: {
      onEventClick(event) {
        const appointment = appointmentsMap[event.id];
        if (appointment) {
          setSelectedAppointment(appointment);
        }
      }
    }
  });
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      {/* Legend */}
      <div className="mb-4 flex gap-4 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
          <span className="text-gray-700">Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }}></div>
          <span className="text-gray-700">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
          <span className="text-gray-700">Cancelled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f97316' }}></div>
          <span className="text-gray-700">No Show</span>
        </div>
      </div>
      
      {/* ScheduleX Calendar */}
      <div style={{ height: '700px' }}>
        <ScheduleXCalendar calendarApp={calendar} />
      </div>
      
      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  );
}
