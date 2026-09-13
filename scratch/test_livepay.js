import fetch from 'node-fetch';

async function testLivePayConfig() {
  console.log('Testing LivePay endpoints locally...');
  try {
    const res = await fetch('http://localhost:5000/api/billing/packages');
    const data = await res.json();
    console.log('Billing packages response:', data);
  } catch (err) {
    console.error('Error testing billing packages:', err.message);
  }
}

testLivePayConfig();
