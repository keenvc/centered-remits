'use client';

import { useState } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import AppointmentDetailsModal from './AppointmentDetailsModal';

const localizer = momentLocalizer(moment);

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

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
}

export default function ScheduleCalendar({ appointments }: { appointments: Appointment[] }) {
  const [view, setView] = useState<View>('month');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [date, setDate] = useState(new Date());
  
  // Transform appointments for calendar
  const events: CalendarEvent[] = appointments.map(apt => {
    const patientName = apt.patient 
      ? `${apt.patient.first_name || ''} ${apt.patient.last_name || ''}`.trim() || 'Unknown Patient'
      : 'Unknown Patient';
    
    const appointmentType = apt.appointment_type || 'Appointment';
    
    return {
      id: apt.id,
      title: `${patientName} - ${appointmentType}`,
      start: new Date(apt.start_time),
      end: apt.end_time ? new Date(apt.end_time) : new Date(apt.start_time),
      resource: apt
    };
  });
  
  // Event style based on status
  const eventStyleGetter = (event: CalendarEvent) => {
    const apt = event.resource;
    let backgroundColor = '#3174ad'; // Default blue
    
    // Color by status
    if (apt.status === 'cancelled') {
      backgroundColor = '#ef4444'; // Red
    } else if (apt.status === 'no_show') {
      backgroundColor = '#f97316'; // Orange
    } else if (apt.status === 'completed') {
      backgroundColor = '#22c55e'; // Green
    } else if (apt.status === 'scheduled') {
      backgroundColor = '#3b82f6'; // Blue
    }
    
    // Use custom color if available
    if (apt.color) {
      backgroundColor = apt.color;
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: apt.status === 'completed' ? 0.7 : 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.85rem',
        padding: '2px 5px'
      }
    };
  };
  
  // Custom toolbar
  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
    };
    
    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };
    
    const goToCurrent = () => {
      toolbar.onNavigate('TODAY');
    };
    
    const label = () => {
      const date = moment(toolbar.date);
      return (
        <span className="text-lg font-semibold text-gray-900">
          {date.format('MMMM YYYY')}
        </span>
      );
    };
    
    return (
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex gap-2">
          <button
            onClick={goToBack}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            ← Previous
          </button>
          <button
            onClick={goToCurrent}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Today
          </button>
          <button
            onClick={goToNext}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Next →
          </button>
        </div>
        
        <div>{label()}</div>
        
        <div className="flex gap-2">
          <button
            onClick={() => toolbar.onView('month')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              toolbar.view === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => toolbar.onView('week')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              toolbar.view === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => toolbar.onView('day')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              toolbar.view === 'day'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => toolbar.onView('agenda')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              toolbar.view === 'agenda'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Agenda
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      {/* Legend */}
      <div className="mb-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }}></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
          <span>Cancelled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f97316' }}></div>
          <span>No Show</span>
        </div>
      </div>
      
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 700 }}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        onSelectEvent={(event) => setSelectedAppointment(event.resource)}
        eventPropGetter={eventStyleGetter}
        components={{
          toolbar: CustomToolbar
        }}
      />
      
      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  );
}
