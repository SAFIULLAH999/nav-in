// Automatic monitoring startup script
// This script ensures the job monitoring system starts automatically

import { NextResponse } from 'next/server';
import fetch from 'node-fetch';

// Global flag to track if auto-start has been attempted
let autoStartAttempted = false;

/**
 * Automatically start the monitoring system if not already running
 * This function should be called during application initialization
 */
export async function autoStartMonitoring() {
  // Prevent multiple auto-start attempts
  if (autoStartAttempted) {
    console.log('Auto-start already attempted, skipping...');
    return;
  }

  autoStartAttempted = true;
  console.log('Attempting to auto-start job monitoring...');

  try {
    // Check current monitoring status
    const statusResponse = await fetch('http://localhost:3000/api/jobs/bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'monitoring-status' })
    });

    const statusData = await statusResponse.json();

    if (statusData.success && statusData.data?.status !== 'running') {
      console.log('Monitoring is not running, starting it now...');

      // Start monitoring
      const startResponse = await fetch('http://localhost:3000/api/jobs/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start-monitoring' })
      });

      const startData = await startResponse.json();

      if (startData.success) {
        console.log('✅ Job monitoring started automatically');
        return NextResponse.json({
          success: true,
          message: 'Job monitoring started automatically'
        });
      } else {
        console.log('❌ Failed to start monitoring:', startData.error);
        return NextResponse.json({
          success: false,
          error: 'Failed to start monitoring: ' + startData.error
        });
      }
    } else {
      console.log('✅ Monitoring is already running or failed to check status');
      return NextResponse.json({
        success: true,
        message: 'Monitoring is already running'
      });
    }
  } catch (error) {
    console.error('❌ Error in auto-start monitoring:', error.message);
    return NextResponse.json({
      success: false,
      error: 'Error in auto-start monitoring: ' + error.message
    });
  }
}

/**
 * Initialize the monitoring system
 * This should be called when the application starts
 */
export function initializeMonitoringSystem() {
  console.log('Initializing job monitoring system...');

  // Set up periodic health checks
  setInterval(async () => {
    try {
      // Check if monitoring is still running
      const response = await fetch('http://localhost:3000/api/jobs/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'monitoring-status' })
      });

      const data = await response.json();
      
      if (data.success && data.data?.status === 'running') {
        console.log('✅ Monitoring system is healthy');
      } else {
        console.log('⚠️  Monitoring system is not running, attempting to restart...');
        await autoStartMonitoring();
      }
    } catch (error) {
      console.error('❌ Error checking monitoring health:', error.message);
    }
  }, 300000); // Check every 5 minutes
}

// Initialize when this module is loaded
if (typeof window === 'undefined') {
  // Only run on server side
  initializeMonitoringSystem();
}