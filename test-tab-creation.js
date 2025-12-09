// Simple test to check if tab creation works
const fetch = require('node-fetch');

const testTabCreation = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/tab-configs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scope: 'user',
        key: 'test-tab',
        label: 'Test Tab',
        icon: 'Settings2',
        contentType: 'markdown',
        settings: { markdown: '# Test\n\nTest content' },
        isVisible: true,
        displayOrder: 1000,
      }),
    });

    const data = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

testTabCreation();
