// Test script to verify the agent functionality
const https = require('https');
const http = require('http');

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const { method = 'GET', headers = {}, body } = options;
    
    const req = client.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data),
          arrayBuffer: () => Promise.resolve(Buffer.from(data, 'binary'))
        });
      });
    });
    
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function testAgent() {
  console.log('Testing Sandbox AI Coding Agent...\n');

  try {
    // 1. Schedule a job
    console.log('1. Scheduling a job...');
    const scheduleResponse = await fetch('http://localhost:3000/api/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: 'Build a simple counter app in React with increment and decrement buttons'
      }),
    });

    const scheduleData = await scheduleResponse.json();
    console.log('Job scheduled:', scheduleData);
    
    if (!scheduleData.jobId) {
      throw new Error('Failed to get job ID');
    }

    const jobId = scheduleData.jobId;

    // 2. Monitor job status
    console.log('\n2. Monitoring job status...');
    let jobCompleted = false;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max

    while (!jobCompleted && attempts < maxAttempts) {
      attempts++;
      
      const statusResponse = await fetch(`http://localhost:3000/api/status/${jobId}`);
      const statusData = await statusResponse.json();
      
      console.log(`Attempt ${attempts}: Status = ${statusData.status}`);
      
      if (statusData.logs && statusData.logs.length > 0) {
        const lastLog = statusData.logs[statusData.logs.length - 1];
        console.log(`  Latest log: ${lastLog.message}`);
      }

      if (statusData.status === 'Completed') {
        jobCompleted = true;
        console.log('\n✅ Job completed successfully!');
        
        // 3. Download the result
        console.log('\n3. Testing download...');
        const downloadResponse = await fetch(`http://localhost:3000/api/download/${jobId}`);
        
        if (downloadResponse.ok) {
          const buffer = await downloadResponse.arrayBuffer();
          console.log(`📦 Downloaded zip file: ${buffer.byteLength} bytes`);
          console.log('✅ Download test successful!');
        } else {
          console.log('❌ Download failed:', await downloadResponse.text());
        }
        
        break;
      } else if (statusData.status === 'Failed') {
        console.log('❌ Job failed');
        break;
      }

      // Wait 10 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    if (!jobCompleted && attempts >= maxAttempts) {
      console.log('❌ Job did not complete within expected time');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAgent();
