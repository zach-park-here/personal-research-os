/**
 * Test script for Chrome CSV import
 */

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testImport() {
  console.log('📁 Reading Chrome history CSV...');

  const filePath = 'C:\\Users\\mario\\Downloads\\history.csv';
  const fileBuffer = fs.readFileSync(filePath);

  console.log(`✓ Read file: ${fileBuffer.length} bytes`);

  // Create form data
  const form = new FormData();
  form.append('file', fileBuffer, {
    filename: 'history.csv',
    contentType: 'text/csv',
  });
  form.append('userId', 'user_123');

  console.log('📤 Uploading to API...');

  try {
    const response = await fetch('http://localhost:3000/api/history/import', {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    const result = await response.json();

    console.log('\n📊 Import Result:');
    console.log(JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ Import successful!');

      // Get stats
      console.log('\n📈 Fetching stats...');
      const statsResponse = await fetch('http://localhost:3000/api/history/stats?userId=user_123');
      const stats = await statsResponse.json();

      console.log('\n📊 Statistics:');
      console.log(JSON.stringify(stats, null, 2));
    } else {
      console.log('\n❌ Import failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testImport();
