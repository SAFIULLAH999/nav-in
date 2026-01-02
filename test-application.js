const fetch = require('node-fetch');
const FormData = require('form-data');

async function testApplicationSubmission() {
  try {
    console.log('🧪 Testing job application submission...');

    const formData = new FormData();
    formData.append('jobId', '1');
    formData.append('coverLetter', 'This is a test application from our automated test.');

    const response = await fetch('http://localhost:3001/api/applications', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Application submission successful!');
      console.log('📄 Application ID:', result.data.id);
      console.log('📧 Status:', result.data.status);
      console.log('⏰ Applied at:', result.data.appliedAt);
    } else {
      console.log('❌ Application submission failed:');
      console.log('Status:', response.status);
      console.log('Error:', result.error || result);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testApplicationSubmission();
