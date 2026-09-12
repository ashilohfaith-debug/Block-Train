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
      block_plan_id: 'WEEKLY-SHADOW-TBM-01',
      station_code: 'TBM',
      station_name: 'Tambaram Junction',
      corridor_zone: 'Zone 3 (km 26.0 to 32.0)',
      day_of_week: 'Saturday',
      time_window: '01:00 - 03:40',
      track_id: 'Tambaram - Mainline (Sec 1)',
      allocated_hours: 2.67,
      uncoordinated_baseline_hours: 18.0,
      hours_saved: 15.33,
      departments_count: 3,
      departments_list: 'Civil Engineering (TMS), Signalling & Telecom (SMMS), Electrical TRD (TDMS)',
      tasks_resolved: 7,
      critical_task: 'Rail Joint Gap & Point Machine 118 Overhaul'
    },
    {
      block_plan_id: 'WEEKLY-SHADOW-TBM-CMP',
      station_code: 'TBM-CMP',
      station_name: 'Tambaram to Chromepet Inter-Station',
      corridor_zone: 'Zone 4 (km 29.0 to 33.0)',
      day_of_week: 'Friday',
      time_window: '01:30 - 04:15',
      track_id: 'Tambaram to Chromepet Main Line',
      allocated_hours: 2.75,
      uncoordinated_baseline_hours: 19.0,
      hours_saved: 16.25,
      departments_count: 3,
      departments_list: 'Electrical TRD, Civil Track Maintenance, S&T',
      tasks_resolved: 7,
      critical_task: '25kV OHE Contact Wire Wear & Crossing 204 Dressing'
    },
    {
      block_plan_id: 'WEEKLY-SHADOW-CMP-01',
      station_code: 'CMP',
      station_name: 'Chromepet Section',
      corridor_zone: 'Zone 1 (km 33.0 to 36.0)',
      day_of_week: 'Sunday',
      time_window: '00:45 - 03:30',
      track_id: 'Chromepet - Mainline (Sec 1)',
      allocated_hours: 2.75,
      uncoordinated_baseline_hours: 15.25,
      hours_saved: 12.50,
      departments_count: 3,
      departments_list: 'Civil Engineering, S&T Signals, Electrical TRD',
      tasks_resolved: 6,
      critical_task: 'Terminal Crossover Diamond Switch Alignment'
    },
    {
      block_plan_id: 'WEEKLY-SHADOW-GDY-01',
      station_code: 'GDY',
      station_name: 'Guindy Junction',
      corridor_zone: 'Zone 2 (km 12.0 to 18.0)',
      day_of_week: 'Wednesday',
      time_window: '01:15 - 03:45',
      track_id: 'Guindy - Mainline (Sec 1)',
      allocated_hours: 2.50,
      uncoordinated_baseline_hours: 17.0,
      hours_saved: 14.50,
      departments_count: 3,
      departments_list: 'S&T Interlocking, Civil Engineering, Electrical TRD',
      tasks_resolved: 7,
      critical_task: 'Signal Relay Auto-Interlocking & Track Tamping'
    },
    {
      block_plan_id: 'WEEKLY-SHADOW-PV-01',
      station_code: 'PV',
      station_name: 'Pallavaram Section',
      corridor_zone: 'Zone 2 (km 8.0 to 14.0)',
      day_of_week: 'Thursday',
      time_window: '01:30 - 04:00',
      track_id: 'Pallavaram - Mainline (Sec 1)',
      allocated_hours: 2.50,
      uncoordinated_baseline_hours: 16.30,
      hours_saved: 13.80,
      departments_count: 3,
      departments_list: 'Civil Engineering, S&T Track Circuits, TRD OHE',
      tasks_resolved: 6,
      critical_task: 'Audio Frequency Track Circuit (AFTC) Calibration'
    },
    {
      block_plan_id: 'WEEKLY-SHADOW-STM-01',
      station_code: 'STM',
      station_name: 'St. Thomas Mount Section',
      corridor_zone: 'Zone 1 (km 4.0 to 9.0)',
      day_of_week: 'Tuesday',
      time_window: '01:00 - 03:30',
      track_id: 'St. Thomas Mount - Mainline (Sec 1)',
      allocated_hours: 2.50,
      uncoordinated_baseline_hours: 13.70,
      hours_saved: 11.20,
      departments_count: 3,
      departments_list: 'Electrical TRD, S&T, Civil Track',
      tasks_resolved: 5,
      critical_task: 'OHE Isolator Switch Replacement & Insulator Washing'
    }
  ];

  return NextResponse.json({
    success: true,
    kpis,
    weekly_blocks: weeklyBlocks
  });
}
