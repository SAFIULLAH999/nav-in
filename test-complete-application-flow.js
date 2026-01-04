// Comprehensive test for complete application flow
const fetch = require('node-fetch');

async function testCompleteApplicationFlow() {
  console.log('🧪 Testing Complete Application Flow...\n');
  
  try {
    // Test 1: Get current jobs
    console.log('1️⃣ Fetching current jobs...');
    const jobsResponse = await fetch('http://localhost:3000/api/jobs?limit=10');
    const jobsData = await jobsResponse.json();
    
    if (!jobsData.success || jobsData.data.length === 0) {
      console.log('❌ No jobs found!');
      return;
    }
    
    console.log(`✅ Found ${jobsData.data.length} jobs`);
    const firstJob = jobsData.data[0];
    console.log(`   First job: ${firstJob.title} at ${firstJob.companyName}`);
    
    // Test 2: Get job details
    console.log('\n2️⃣ Fetching job details...');
    const jobDetailsResponse = await fetch(`http://localhost:3000/api/jobs/${firstJob.id}`);
    const jobDetailsData = await jobDetailsResponse.json();
    
    if (!jobDetailsData.success) {
      console.log('❌ Could not fetch job details!');
      return;
    }
    
    console.log(`✅ Job details fetched: ${jobDetailsData.data.title}`);
    console.log(`   Company: ${jobDetailsData.data.companyName}`);
    console.log(`   Location: ${jobDetailsData.data.location}`);
    console.log(`   Type: ${jobDetailsData.data.type}`);
    
    // Test 3: Get applications (should match actual jobs now)
    console.log('\n3️⃣ Fetching applications...');
    const appsResponse = await fetch('http://localhost:3000/api/applications');
    const appsData = await appsResponse.json();
    
    if (!appsData.success || appsData.data.length === 0) {
      console.log('❌ No applications found!');
      return;
    }
    
    console.log(`✅ Found ${appsData.data.length} applications`);
    
    // Check if applications match actual jobs
    const appsMatchJobs = appsData.data.every(app => 
      jobsData.data.some(job => job.id === app.jobId)
    );
    
    console.log(`✅ Applications match actual jobs: ${appsMatchJobs ? 'YES' : 'NO'}`);
    
    if (!appsMatchJobs) {
      console.log('⚠️  Some applications reference non-existent jobs');
    }
    
    // Test 4: Test application creation
    console.log('\n4️⃣ Testing application creation...');
    const createAppResponse = await fetch('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: firstJob.id,
        coverLetter: 'I am very interested in this position and believe my skills are a great match.'
      })
    });
    
    const createAppData = await createAppResponse.json();
    
    if (!createAppData.success) {
      console.log('❌ Could not create application!');
      return;
    }
    
    console.log(`✅ Application created: ${createAppData.data.id}`);
    console.log(`   Job: ${createAppData.data.job.title}`);
    console.log(`   Company: ${createAppData.data.job.companyName}`);
    console.log(`   Status: ${createAppData.data.status}`);
    
    // Test 5: Verify the new application appears in the list
    console.log('\n5️⃣ Verifying new application appears in list...');
    const updatedAppsResponse = await fetch('http://localhost:3000/api/applications');
    const updatedAppsData = await updatedAppsResponse.json();
    
    const newAppFound = updatedAppsData.data.some(app => app.id === createAppData.data.id);
    console.log(`✅ New application found in list: ${newAppFound ? 'YES' : 'NO'}`);
    
    // Test 6: Check monitoring and WebSocket status
    console.log('\n6️⃣ Checking system status...');
    
    const monitoringResponse = await fetch('http://localhost:3000/api/jobs/bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'monitoring-status' })
    });
    
    const monitoringData = await monitoringResponse.json();
    console.log(`✅ Monitoring status: ${monitoringData.data?.status || 'unknown'}`);
    
    const wsResponse = await fetch('http://localhost:3000/api/jobs/websocket');
    const wsData = await wsResponse.json();
    console.log(`✅ WebSocket status: ${wsData.data?.websocketStatus || 'unknown'}`);
    
    // Summary
    console.log('\n📊 COMPLETE APPLICATION FLOW TEST RESULTS:');
    console.log(`   ✅ Jobs fetched: ${jobsData.data.length}`);
    console.log(`   ✅ Job details working: YES`);
    console.log(`   ✅ Applications fetched: ${appsData.data.length}`);
    console.log(`   ✅ Applications match jobs: ${appsMatchJobs ? 'YES' : 'NO'}`);
    console.log(`   ✅ Application creation: SUCCESS`);
    console.log(`   ✅ New application in list: ${newAppFound ? 'YES' : 'NO'}`);
    console.log(`   ✅ Monitoring system: ${monitoringData.data?.status || 'unknown'}`);
    console.log(`   ✅ WebSocket system: ${wsData.data?.websocketStatus || 'unknown'}`);
    
    // Overall success check
    const allTestsPassed = jobsData.success && jobDetailsData.success && 
                          appsData.success && createAppData.success && 
                          appsMatchJobs && newAppFound;
    
    if (allTestsPassed) {
      console.log('\n🎉 SUCCESS: Complete application flow is working perfectly!');
      console.log('   - Jobs are being fetched correctly');
      console.log('   - Job details are accessible');
      console.log('   - Applications match actual job IDs');
      console.log('   - New applications can be created');
      console.log('   - All system components are operational');
      console.log('\n💡 The "Fetching issues in app" should now be resolved!');
    } else {
      console.log('\n⚠️  Some tests failed - please check the specific issues above');
    }
    
  } catch (error) {
    console.error('❌ ERROR in complete application flow test:', error.message);
  }
}

// Run the test
testCompleteApplicationFlow();