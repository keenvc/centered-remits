import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ScheduleCalendar from '@/components/schedule/ScheduleCalendar';

export const metadata = {
  title: 'Schedule | Centered',
  description: 'Appointment schedule and calendar'
};

export default async function SchedulePage() {
  const supabase = createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  // Fetch appointments with patient information
  const { data: appointments, error } = await supabase
    .from('osmind_appointments')
    .select(`
      *,
      patient:osmind_patients(
        id,
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .order('start_time', { ascending: true });
  
  if (error) {
    console.error('Error fetching appointments:', error);
  }
  
  // Get appointment statistics
  const { count: totalAppointments } = await supabase
    .from('osmind_appointments')
    .select('*', { count: 'exact', head: true });
  
  const { count: scheduledCount } = await supabase
    .from('osmind_appointments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'scheduled');
  
  const { count: completedCount } = await supabase
    .from('osmind_appointments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
        <p className="text-gray-600 mt-1">Manage appointments and calendar</p>
      </div>
      
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Appointments</div>
          <div className="text-2xl font-bold text-gray-900">{totalAppointments || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Scheduled</div>
          <div className="text-2xl font-bold text-blue-600">{scheduledCount || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-2xl font-bold text-green-600">{completedCount || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Today</div>
          <div className="text-2xl font-bold text-purple-600">
            {appointments?.filter(apt => {
              const today = new Date().toDateString();
              const aptDate = new Date(apt.start_time).toDateString();
              return today === aptDate;
            }).length || 0}
          </div>
        </div>
      </div>
      
      {/* Calendar */}
      <ScheduleCalendar appointments={appointments || []} />
    </div>
  );
}
