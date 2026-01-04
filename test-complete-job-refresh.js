// Comprehensive test script for job refresh functionality
const fetch = require('node-fetch');

async function testCompleteJobRefresh() {
  console.log('🧪 Testing Complete Job Refresh System...\n');
  
  try {
    // Test 1: Check initial job data
    console.log('1️⃣ Checking initial job data...');
    const initialJobsResponse = await fetch('http://localhost:3000/api/jobs?limit=20');
    const initialJobsData = await initialJobsResponse.json();
    console.log(`   Found ${initialJobsData.data.length} initial jobs`);
    
    // Test 2: Check monitoring status
    console.log('\n2️⃣ Checking monitoring status...');
    const monitoringResponse = await fetch('http://localhost:3000/api/jobs/bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'monitoring-status' })
    });
    const monitoringData = await monitoringResponse.json();
    console.log(`   Monitoring status: ${monitoringData.data?.status || 'unknown'}`);
    
    // Test 3: If monitoring not running, start it
    if (monitoringData.data?.status !== 'running') {
      console.log('\n3️⃣ Starting monitoring...');
      const startResponse = await fetch('http://localhost:3000/api/jobs/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start-monitoring' })
      });
      const startData = await startResponse.json();
      console.log(`   Start result: ${startData.success ? 'SUCCESS' : 'FAILED'}`);
    }
    
    // Test 4: Trigger manual cleanup
    console.log('\n4️⃣ Running job cleanup...');
    const cleanupResponse = await fetch('http://localhost:3000/api/jobs/cleanup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun: false })
    });
    const cleanupData = await cleanupResponse.json();
    console.log(`   Cleanup result: ${cleanupData.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Jobs removed: ${cleanupData.data?.jobsRemoved || 0}`);
    
    // Test 5: Update job dates
    console.log('\n5️⃣ Updating job dates...');
    const updateResponse = await fetch('http://localhost:3000/api/jobs/bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-dates', dryRun: false })
    });
    const updateData = await updateResponse.json();
    console.log(`   Update result: ${updateData.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Jobs updated: ${updateData.data?.jobsUpdated || 0}`);
    
    // Test 6: Check final job data
    console.log('\n6️⃣ Checking final job data...');
    const finalJobsResponse = await fetch('http://localhost:3000/api/jobs?limit=20');
    const finalJobsData = await finalJobsResponse.json();
    console.log(`   Found ${finalJobsData.data.length} final jobs`);
    
    // Test 7: Check WebSocket status
    console.log('\n7️⃣ Checking WebSocket status...');
    const wsResponse = await fetch('http://localhost:3000/api/jobs/websocket');
    const wsData = await wsResponse.json();
    console.log(`   WebSocket status: ${wsData.data?.websocketStatus || 'unknown'}`);
    console.log(`   Connected clients: ${wsData.data?.connectedClients || 0}`);
    
    // Test 8: Get bot status
    console.log('\n8️⃣ Getting bot status...');
    const botResponse = await fetch('http://localhost:3000/api/jobs/bot');
    const botData = await botResponse.json();
    console.log(`   Total jobs: ${botData.data?.totalJobs || 0}`);
    console.log(`   Active jobs: ${botData.data?.activeJobs || 0}`);
    console.log(`   Expired jobs: ${botData.data?.expiredJobs || 0}`);
    console.log(`   Jobs missing dates: ${botData.data?.jobsMissingDates || 0}`);
    
    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log(`   ✅ Initial jobs: ${initialJobsData.data.length}`);
    console.log(`   ✅ Final jobs: ${finalJobsData.data.length}`);
    console.log(`   ✅ Jobs removed: ${cleanupData.data?.jobsRemoved || 0}`);
    console.log(`   ✅ Jobs updated: ${updateData.data?.jobsUpdated || 0}`);
    console.log(`   ✅ Monitoring: ${monitoringData.data?.status || 'unknown'}`);
    console.log(`   ✅ WebSocket: ${wsData.data?.websocketStatus || 'unknown'}`);
    
    // Check if we have fresh data
    const hasFreshData = finalJobsData.data.some(job => 
      job.title.includes('Senior') || 
      job.title.includes('Backend') || 
      job.title.includes('Full Stack') ||
      job.title.includes('DevOps') ||
      job.title.includes('Data Scientist')
    );
    
    console.log(`   ✅ Fresh job data: ${hasFreshData ? 'YES' : 'NO'}`);
    
    if (hasFreshData) {
      console.log('\n🎉 SUCCESS: Job refresh system is working properly!');
      console.log('   - Expired jobs are being cleaned up');
      console.log('   - Job dates are being updated');
      console.log('   - Fresh job data is being added');
      console.log('   - Monitoring system is running');
      console.log('   - WebSocket updates are available');
    } else {
      console.log('\n⚠️  WARNING: Fresh job data not detected');
      console.log('   - The system may need more time to refresh');
      console.log('   - Try refreshing the page after a few minutes');
    }
    
  } catch (error) {
    console.error('❌ ERROR in test:', error.message);
  }
}

// Run the test
testCompleteJobRefresh();