import { NextResponse } from 'next/server';

export async function GET() {
  const kpis = {
    calendar_clock_hours_in_week: 168.0,
    corridor_total_track_hours_capacity: 672.0,
    uncoordinated_downtime_track_hours: 116.0,
    optimized_coordinated_downtime_track_hours: 16.2,
    net_track_possession_hours_saved: 99.8,
    downtime_reduction_pct: 86.06,
    multi_department_coordination_rate_pct: 100.0,
    asset_availability_baseline_manual_pct: 82.74,
    asset_availability_ai_optimized_pct: 97.59,
    asset_availability_gain_pct: 14.85,
    timetable_conflicts_avoided_pct: 100.0,
    regressor_r2_accuracy_pct: 93.21,
    classifier_overall_accuracy_pct: 87.66,
    critical_emergency_precision_pct: 100.0,
    critical_emergency_recall_pct: 97.37
  };

  const weeklyBlocks = [
    {
      block_plan_id: 'WEEKLY-SHADOW-MSB-01',
      station_code: 'MSB',
      station_name: 'Chennai Beach Terminal',
      corridor_zone: 'Zone 1 (km 0.0 to 4.0)',
      day_of_week: 'Sunday',
      time_window: '00:30 - 03:15',
      track_id: 'Chennai Beach - Mainline (Sec 1)',
      allocated_hours: 2.75,
      uncoordinated_baseline_hours: 16.5,
      hours_saved: 13.75,
      departments_count: 3,
      departments_list: 'Civil Engineering (TMS), Signalling & Telecom, Electrical TRD',
      tasks_resolved: 6,
      critical_task: 'Terminal Crossover Diamond Switch & Point Machine Overhaul'
    },
    {
      block_plan_id: 'WEEKLY-SHADOW-MS-01',
      station_code: 'MS',
      station_name: 'Chennai Egmore Junction',
      corridor_zone: 'Zone 1 (km 4.0 to 8.0)',
      day_of_week: 'Monday',
      time_window: '01:00 - 03:45',
      track_id: 'Chennai Egmore - Mainline (Sec 1)',
      allocated_hours: 2.75,
      uncoordinated_baseline_hours: 18.0,
      hours_saved: 15.25,
      departments_count: 3,
      departments_list: 'S&T Interlocking, Civil Engineering, Electrical TRD',
      tasks_resolved: 8,
      critical_task: 'Route Relay Interlocking Calibration & Turnout Tamping'
    },
    {
      block_plan_id: 'WEEKLY-SHADOW-GDY-STM',
      station_code: 'GDY-STM',
      station_name: 'Guindy to St. Thomas Mount',
      corridor_zone: 'Zone 2 (km 15.0 to 18.0)',
      day_of_week: 'Wednesday',
      time_window: '01:15 - 03:45',
      track_id: 'Guindy to St. Thomas Mount Main Line',
      allocated_hours: 2.50,
      uncoordinated_baseline_hours: 15.0,
      hours_saved: 12.50,
      departments_count: 3,
      departments_list: 'Electrical TRD (OHE), Civil Track, S&T Signals',
      tasks_resolved: 6,
      critical_task: '25kV OHE Contact Wire Tensioning & Insulator Washing'
    },
    {
      block_plan_id: 'WEEKLY-SHADOW-PV-CMP',
      station_code: 'PV-CMP',
      station_name: 'Pallavaram to Chromepet',
      corridor_zone: 'Zone 2 (km 23.0 to 26.0)',
      day_of_week: 'Thursday',
      time_window: '01:30 - 04:00',
      track_id: 'Pallavaram to Chromepet Main Line',
      allocated_hours: 2.50,
      uncoordinated_baseline_hours: 14.5,
      hours_saved: 12.00,
      departments_count: 3,
      departments_list: 'Civil Engineering, S&T Track Circuits, TRD OHE',
      tasks_resolved: 5,
      critical_task: 'Audio Frequency Track Circuit (AFTC) Re-tuning'
    },
    {
      block_plan_id: 'WEEKLY-SHADOW-TBM-01',
      station_code: 'TBM',
      station_name: 'Tambaram Junction',
      corridor_zone: 'Zone 3 (km 28.0 to 32.0)',
      day_of_week: 'Saturday',
      time_window: '01:00 - 03:40',
      track_id: 'Tambaram - Mainline (Sec 1)',
      allocated_hours: 2.67,
      uncoordinated_baseline_hours: 19.5,
      hours_saved: 16.83,
      departments_count: 3,
      departments_list: 'Civil Engineering (TMS), Signalling & Telecom (SMMS), Electrical TRD (TDMS)',
      tasks_resolved: 8,
      critical_task: 'Rail Joint Gap & Point Machine 118 Overhaul'
    },
    {
      block_plan_id: 'WEEKLY-SHADOW-TBM-PRGL',
      station_code: 'TBM-PRGL',
      station_name: 'Tambaram to Perungalathur',
      corridor_zone: 'Zone 3 (km 29.0 to 33.0)',
      day_of_week: 'Friday',
      time_window: '01:30 - 04:15',
      track_id: 'Tambaram to Perungalathur Main Line',
      allocated_hours: 2.75,
      uncoordinated_baseline_hours: 17.5,
      hours_saved: 14.75,
      departments_count: 3,
      departments_list: 'Civil Engineering, S&T Signals, Electrical TRD',
      tasks_resolved: 7,
      critical_task: 'Continuous Welded Rail (CWR) Stressing & LC 28 Gate Overhaul'
    },
    {
      block_plan_id: 'WEEKLY-SHADOW-MMNK-SKL',
      station_code: 'MMNK-SKL',
      station_name: 'Maraimalai Nagar to Singaperumal Koil',
      corridor_zone: 'Zone 4 (km 47.0 to 52.0)',
      day_of_week: 'Tuesday',
      time_window: '01:00 - 03:30',
      track_id: 'Maraimalai Nagar to Singaperumal Koil Main Line',
      allocated_hours: 2.50,
      uncoordinated_baseline_hours: 14.0,
      hours_saved: 11.50,
      departments_count: 3,
      departments_list: 'Electrical TRD, Civil Track, S&T',
      tasks_resolved: 5,
      critical_task: 'Auto-Tensioning Device (ATD) Maintenance & Flash-Butt Welds'
    },
    {
      block_plan_id: 'WEEKLY-SHADOW-CGL-01',
      station_code: 'CGL',
      station_name: 'Chengalpattu Junction',
      corridor_zone: 'Zone 4 (km 58.0 to 62.0)',
      day_of_week: 'Sunday',
      time_window: '01:30 - 04:15',
      track_id: 'Chengalpattu Junction - Mainline (Sec 1)',
      allocated_hours: 2.75,
      uncoordinated_baseline_hours: 17.0,
      hours_saved: 14.25,
      departments_count: 3,
      departments_list: 'Civil Engineering, S&T Interlocking, Electrical TRD',
      tasks_resolved: 7,
      critical_task: 'Yard Junction Crossover Scissors Crossing Overhaul'
    }
  ];

  return NextResponse.json({
    success: true,
    kpis,
    weekly_blocks: weeklyBlocks
  });
}
