// Test script to verify automatic updates functionality
const fetch = require('node-fetch');

async function testAutomaticUpdates() {
  console.log('Testing automatic updates functionality...');
  
  try {
    // Test 1: Check if monitoring is running
    console.log('\n1. Checking monitoring status...');
    const monitoringResponse = await fetch('http://localhost:3000/api/jobs/bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'monitoring-status' })
    });
    
    const monitoringData = await monitoringResponse.json();
    console.log('Monitoring status:', monitoringData.data?.status || 'unknown');
    
    // Test 2: If not running, start monitoring
    if (monitoringData.data?.status !== 'running') {
      console.log('\n2. Starting monitoring...');
      const startResponse = await fetch('http://localhost:3000/api/jobs/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start-monitoring' })
      });
      
      const startData = await startResponse.json();
      console.log('Start monitoring result:', startData.success ? 'SUCCESS' : 'FAILED');
      
      if (startData.success) {
        // Wait a bit for monitoring to start
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test 3: Check monitoring status again
        console.log('\n3. Checking monitoring status after starting...');
        const newMonitoringResponse = await fetch('http://localhost:3000/api/jobs/bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'monitoring-status' })
        });
        
        const newMonitoringData = await newMonitoringResponse.json();
        console.log('New monitoring status:', newMonitoringData.data?.status || 'unknown');
      }
    }
    
    // Test 4: Check WebSocket status
    console.log('\n4. Checking WebSocket status...');
    const wsResponse = await fetch('http://localhost:3000/api/jobs/websocket', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const wsData = await wsResponse.json();
    console.log('WebSocket status:', wsData.data?.websocketStatus || 'unknown');
    console.log('Connected clients:', wsData.data?.connectedClients || 0);
    
    // Test 5: Test job updates
    console.log('\n5. Testing job updates...');
    const updateResponse = await fetch('http://localhost:3000/api/jobs/bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-dates', dryRun: true })
    });
    
    const updateData = await updateResponse.json();
    console.log('Job update test result:', updateData.success ? 'SUCCESS' : 'FAILED');
    console.log('Jobs that would be updated:', updateData.data?.jobsUpdated || 0);
    
    console.log('\n✅ Automatic updates test completed!');
    
  } catch (error) {
    console.error('❌ Error testing automatic updates:', error.message);
  }
}

// Run the test
testAutomaticUpdates();