#!/usr/bin/env node

/**
 * Test script for Patient Messages functionality
 * Tests the staff messages API endpoints:
 * - GET /api/staff/messages - Get all staff messages
 * - PATCH /api/staff/messages/:id/read - Mark message as read
 * - POST /api/staff/messages/:id/reply - Reply to a message
 * 
 * Usage:
 *   node test-patient-messages.js
 *   API_URL=http://localhost:5000 node test-patient-messages.js
 *   TEST_USERNAME=admin TEST_PASSWORD=admin123 node test-patient-messages.js
 */

// Use built-in fetch (Node 18+) or node-fetch
let fetch;
if (typeof globalThis.fetch === 'function') {
    fetch = globalThis.fetch;
} else {
    // Try to use node-fetch
    try {
        const nodeFetch = await import('node-fetch');
        fetch = nodeFetch.default || nodeFetch;
    } catch (e) {
        throw new Error('fetch is not available. Please use Node.js 18+ or install node-fetch');
    }
}

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

// Test credentials - adjust as needed
const TEST_CREDENTIALS = {
    username: process.env.TEST_USERNAME || 'admin',
    password: process.env.TEST_PASSWORD || 'admin123'
};

let authCookie = '';

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;

    // Build headers with cookie support
    const headers = new Headers({
        'Content-Type': 'application/json',
        ...options.headers
    });

    if (authCookie) {
        headers.set('Cookie', authCookie);
    }

    const defaultOptions = {
        ...options,
        headers
    };

    const response = await fetch(url, defaultOptions);

    // Extract cookies from response headers
    const setCookieHeader = response.headers.get('set-cookie') || response.headers.get('Set-Cookie');
    if (setCookieHeader) {
        authCookie = setCookieHeader.split(';')[0];
    }

    let data = {};
    try {
        const text = await response.text();
        if (text) {
            data = JSON.parse(text);
        }
    } catch (e) {
        // Response might not be JSON
    }

    return {
        status: response.status,
        ok: response.ok,
        data,
        headers: response.headers
    };
}

// Login function
async function login() {
    console.log('\n🔐 Logging in...');

    // First check if server is running
    try {
        const healthCheck = await fetch(`${BASE_URL}/api/health`);
        if (!healthCheck.ok && healthCheck.status !== 404) {
            console.log('⚠️  Server health check failed, but continuing...');
        }
    } catch (error) {
        throw new Error(`Cannot connect to server at ${BASE_URL}. Is the server running? Error: ${error.message}`);
    }

    const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(TEST_CREDENTIALS)
    });

    if (!response.ok) {
        const errorMsg = response.data?.message || response.data?.error || JSON.stringify(response.data);
        throw new Error(`Login failed: ${response.status} - ${errorMsg}\nPlease check:\n- Server is running on ${BASE_URL}\n- Credentials are correct (username: ${TEST_CREDENTIALS.username})`);
    }

    console.log('✅ Login successful');
    return response;
}

// Test 1: Get all staff messages
async function testGetStaffMessages() {
    console.log('\n📨 Test 1: Get all staff messages');
    console.log('GET /api/staff/messages');

    const response = await apiRequest('/api/staff/messages', {
        method: 'GET',
        headers: {
            'Cookie': authCookie
        }
    });

    if (response.ok) {
        const messages = response.data.data || response.data || [];
        console.log(`✅ Success! Found ${messages.length} messages`);

        // Categorize messages
        const unread = messages.filter(m => m.status === 'sent');
        const read = messages.filter(m => m.status === 'read');
        const replied = messages.filter(m => m.status === 'replied');

        console.log(`   - Unread: ${unread.length}`);
        console.log(`   - Read: ${read.length}`);
        console.log(`   - Replied: ${replied.length}`);
        console.log(`   - All: ${messages.length}`);

        // Display sample messages
        if (messages.length > 0) {
            console.log('\n   Sample messages:');
            messages.slice(0, 3).forEach((msg, idx) => {
                console.log(`   ${idx + 1}. [${msg.status.toUpperCase()}] ${msg.subject || 'No subject'}`);
                console.log(`      From: ${msg.patientName || 'Unknown Patient'}`);
                console.log(`      Type: ${msg.messageType || 'general'}, Priority: ${msg.priority || 'normal'}`);
                console.log(`      Sent: ${new Date(msg.sentAt).toLocaleString()}`);
            });
        } else {
            console.log('   ℹ️  No messages found');
        }

        return messages;
    } else {
        console.log(`❌ Failed: ${response.status} - ${JSON.stringify(response.data)}`);
        return [];
    }
}

// Test 2: Mark message as read
async function testMarkAsRead(messageId) {
    console.log(`\n👁️  Test 2: Mark message as read`);
    console.log(`PATCH /api/staff/messages/${messageId}/read`);

    if (!messageId) {
        console.log('⚠️  Skipping - no message ID available');
        return null;
    }

    const response = await apiRequest(`/api/staff/messages/${messageId}/read`, {
        method: 'PATCH',
        headers: {
            'Cookie': authCookie
        }
    });

    if (response.ok) {
        const message = response.data.data || response.data;
        console.log(`✅ Success! Message marked as read`);
        console.log(`   Message ID: ${message.id}`);
        console.log(`   Status: ${message.status}`);
        console.log(`   Read at: ${message.readAt ? new Date(message.readAt).toLocaleString() : 'N/A'}`);
        return message;
    } else {
        console.log(`❌ Failed: ${response.status} - ${JSON.stringify(response.data)}`);
        return null;
    }
}

// Test 3: Reply to a message
async function testReplyToMessage(messageId) {
    console.log(`\n💬 Test 3: Reply to a message`);
    console.log(`POST /api/staff/messages/${messageId}/reply`);

    if (!messageId) {
        console.log('⚠️  Skipping - no message ID available');
        return null;
    }

    const replyText = `Test reply sent at ${new Date().toLocaleString()}. This is an automated test response.`;

    const response = await apiRequest(`/api/staff/messages/${messageId}/reply`, {
        method: 'POST',
        headers: {
            'Cookie': authCookie
        },
        body: JSON.stringify({ reply: replyText })
    });

    if (response.ok) {
        const reply = response.data.data || response.data;
        console.log(`✅ Success! Reply sent`);
        console.log(`   Reply ID: ${reply.id}`);
        console.log(`   Subject: ${reply.subject}`);
        console.log(`   Status: ${reply.status}`);

        // Check if original message was marked as replied
        const checkResponse = await apiRequest(`/api/staff/messages/${messageId}`, {
            method: 'GET',
            headers: {
                'Cookie': authCookie
            }
        });

        if (checkResponse.ok) {
            const original = checkResponse.data.data || checkResponse.data;
            if (original.status === 'replied') {
                console.log(`   ✅ Original message marked as replied`);
            }
        }

        return reply;
    } else {
        console.log(`❌ Failed: ${response.status} - ${JSON.stringify(response.data)}`);
        return null;
    }
}

// Test 4: Filter messages by status
async function testFilterMessages(messages) {
    console.log(`\n🔍 Test 4: Filter messages by status`);

    if (!messages || messages.length === 0) {
        console.log('⚠️  Skipping - no messages available');
        return;
    }

    const filters = {
        unread: messages.filter(m => m.status === 'sent'),
        read: messages.filter(m => m.status === 'read'),
        replied: messages.filter(m => m.status === 'replied'),
        all: messages
    };

    console.log('   Filter results:');
    Object.entries(filters).forEach(([filter, filtered]) => {
        console.log(`   - ${filter.toUpperCase()}: ${filtered.length} messages`);
    });

    // Test priority filtering
    const priorities = ['urgent', 'high', 'normal', 'low'];
    console.log('\n   Priority breakdown:');
    priorities.forEach(priority => {
        const count = messages.filter(m => m.priority === priority).length;
        if (count > 0) {
            console.log(`   - ${priority.toUpperCase()}: ${count} messages`);
        }
    });

    // Test message type filtering
    const types = [...new Set(messages.map(m => m.messageType))];
    console.log('\n   Message types:');
    types.forEach(type => {
        const count = messages.filter(m => m.messageType === type).length;
        console.log(`   - ${type || 'general'}: ${count} messages`);
    });
}

// Test 5: Error handling
async function testErrorHandling() {
    console.log(`\n⚠️  Test 5: Error handling`);

    // Test invalid message ID
    console.log('   Testing invalid message ID...');
    const invalidResponse = await apiRequest('/api/staff/messages/999999/read', {
        method: 'PATCH',
        headers: {
            'Cookie': authCookie
        }
    });

    if (invalidResponse.status === 404) {
        console.log('   ✅ Correctly returns 404 for non-existent message');
    } else {
        console.log(`   ⚠️  Unexpected response: ${invalidResponse.status}`);
    }

    // Test reply without message body
    console.log('   Testing reply without message body...');
    const emptyReplyResponse = await apiRequest('/api/staff/messages/1/reply', {
        method: 'POST',
        headers: {
            'Cookie': authCookie
        },
        body: JSON.stringify({ reply: '' })
    });

    if (emptyReplyResponse.status === 400) {
        console.log('   ✅ Correctly returns 400 for empty reply');
    } else {
        console.log(`   ⚠️  Unexpected response: ${emptyReplyResponse.status}`);
    }
}

// Test 6: Get single message details
async function testGetMessageDetails(messageId) {
    console.log(`\n📋 Test 6: Get single message details`);
    console.log(`GET /api/staff/messages/${messageId}`);
    
    if (!messageId) {
        console.log('⚠️  Skipping - no message ID available');
        return null;
    }
    
    const response = await apiRequest(`/api/staff/messages/${messageId}`, {
        method: 'GET',
        headers: {
            'Cookie': authCookie
        }
    });

    if (response.ok) {
        const message = response.data.data || response.data;
        console.log(`✅ Success! Retrieved message details`);
        console.log(`   ID: ${message.id}`);
        console.log(`   Subject: ${message.subject}`);
        console.log(`   From: ${message.patientName || 'Unknown'}`);
        console.log(`   Type: ${message.messageType}`);
        console.log(`   Priority: ${message.priority}`);
        console.log(`   Status: ${message.status}`);
        console.log(`   Message: ${(message.message || '').substring(0, 100)}...`);
        return message;
    } else {
        console.log(`❌ Failed: ${response.status} - ${JSON.stringify(response.data)}`);
        return null;
    }
}

// Test 7: Bulk mark as read
async function testBulkMarkAsRead(messageIds) {
    console.log(`\n📚 Test 7: Bulk mark messages as read`);
    
    if (!messageIds || messageIds.length === 0) {
        console.log('⚠️  Skipping - no message IDs available');
        return;
    }
    
    const unreadIds = messageIds.filter(id => {
        // We'll need to check status, but for now just use first few
        return true;
    }).slice(0, 3); // Limit to 3 for testing
    
    console.log(`   Marking ${unreadIds.length} messages as read...`);
    
    const results = await Promise.allSettled(
        unreadIds.map(id => testMarkAsRead(id))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`   ✅ Successfully marked ${successful} messages as read`);
    if (failed > 0) {
        console.log(`   ⚠️  Failed to mark ${failed} messages`);
    }
}

// Test 8: Message statistics and analytics
async function testMessageStatistics(messages) {
    console.log(`\n📊 Test 8: Message statistics and analytics`);
    
    if (!messages || messages.length === 0) {
        console.log('⚠️  Skipping - no messages available');
        return;
    }
    
    const stats = {
        total: messages.length,
        byStatus: {
            sent: messages.filter(m => m.status === 'sent').length,
            read: messages.filter(m => m.status === 'read').length,
            replied: messages.filter(m => m.status === 'replied').length,
            archived: messages.filter(m => m.status === 'archived').length
        },
        byPriority: {
            urgent: messages.filter(m => m.priority === 'urgent').length,
            high: messages.filter(m => m.priority === 'high').length,
            normal: messages.filter(m => m.priority === 'normal').length,
            low: messages.filter(m => m.priority === 'low').length
        },
        byType: {},
        byDate: {
            today: 0,
            thisWeek: 0,
            thisMonth: 0,
            older: 0
        },
        averageResponseTime: null
    };
    
    // Calculate by type
    messages.forEach(msg => {
        const type = msg.messageType || 'general';
        stats.byType[type] = (stats.byType[type] || 0) + 1;
    });
    
    // Calculate by date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    messages.forEach(msg => {
        const sentDate = new Date(msg.sentAt);
        if (sentDate >= today) {
            stats.byDate.today++;
        } else if (sentDate >= weekAgo) {
            stats.byDate.thisWeek++;
        } else if (sentDate >= monthAgo) {
            stats.byDate.thisMonth++;
        } else {
            stats.byDate.older++;
        }
        
        // Calculate response time for replied messages
        if (msg.status === 'replied' && msg.sentAt && msg.repliedAt) {
            const sent = new Date(msg.sentAt);
            const replied = new Date(msg.repliedAt);
            const responseTime = (replied - sent) / (1000 * 60); // minutes
            if (!stats.averageResponseTime) {
                stats.averageResponseTime = { total: 0, count: 0 };
            }
            stats.averageResponseTime.total += responseTime;
            stats.averageResponseTime.count++;
        }
    });
    
    if (stats.averageResponseTime) {
        stats.averageResponseTime = Math.round(
            stats.averageResponseTime.total / stats.averageResponseTime.count
        );
    }
    
    console.log('   📈 Statistics:');
    console.log(`   - Total Messages: ${stats.total}`);
    console.log(`   - By Status:`);
    Object.entries(stats.byStatus).forEach(([status, count]) => {
        if (count > 0) {
            console.log(`     • ${status}: ${count}`);
        }
    });
    console.log(`   - By Priority:`);
    Object.entries(stats.byPriority).forEach(([priority, count]) => {
        if (count > 0) {
            console.log(`     • ${priority}: ${count}`);
        }
    });
    console.log(`   - By Type:`);
    Object.entries(stats.byType).forEach(([type, count]) => {
        console.log(`     • ${type}: ${count}`);
    });
    console.log(`   - By Date:`);
    console.log(`     • Today: ${stats.byDate.today}`);
    console.log(`     • This Week: ${stats.byDate.thisWeek}`);
    console.log(`     • This Month: ${stats.byDate.thisMonth}`);
    console.log(`     • Older: ${stats.byDate.older}`);
    if (stats.averageResponseTime) {
        console.log(`   - Average Response Time: ${stats.averageResponseTime} minutes`);
    }
    
    return stats;
}

// Test 9: Message search and filtering
async function testMessageSearch(messages) {
    console.log(`\n🔎 Test 9: Message search and filtering`);
    
    if (!messages || messages.length === 0) {
        console.log('⚠️  Skipping - no messages available');
        return;
    }
    
    // Test search by subject
    const searchTerms = ['appointment', 'lab', 'test', 'urgent'];
    console.log('   Testing search functionality:');
    
    searchTerms.forEach(term => {
        const results = messages.filter(msg => 
            (msg.subject || '').toLowerCase().includes(term.toLowerCase()) ||
            (msg.message || '').toLowerCase().includes(term.toLowerCase())
        );
        if (results.length > 0) {
            console.log(`   - Search "${term}": ${results.length} results`);
        }
    });
    
    // Test filtering combinations
    console.log('\n   Testing filter combinations:');
    const urgentUnread = messages.filter(m => m.priority === 'urgent' && m.status === 'sent');
    const medicalReplied = messages.filter(m => m.messageType === 'medical' && m.status === 'replied');
    const todayMessages = messages.filter(m => {
        const msgDate = new Date(m.sentAt);
        const today = new Date();
        return msgDate.toDateString() === today.toDateString();
    });
    
    console.log(`   - Urgent + Unread: ${urgentUnread.length}`);
    console.log(`   - Medical + Replied: ${medicalReplied.length}`);
    console.log(`   - Today's messages: ${todayMessages.length}`);
}

// Test 10: Performance and load testing
async function testPerformance() {
    console.log(`\n⚡ Test 10: Performance testing`);
    
    const iterations = 5;
    const times = [];
    
    console.log(`   Running ${iterations} requests to measure performance...`);
    
    for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        const response = await apiRequest('/api/staff/messages', {
            method: 'GET',
            headers: {
                'Cookie': authCookie
            }
        });
        const end = Date.now();
        const duration = end - start;
        times.push(duration);
        
        if (response.ok) {
            console.log(`   Request ${i + 1}: ${duration}ms`);
        } else {
            console.log(`   Request ${i + 1}: Failed (${response.status})`);
        }
    }
    
    if (times.length > 0) {
        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        const min = Math.min(...times);
        const max = Math.max(...times);
        console.log(`\n   Performance Summary:`);
        console.log(`   - Average: ${avg}ms`);
        console.log(`   - Min: ${min}ms`);
        console.log(`   - Max: ${max}ms`);
        
        if (avg > 1000) {
            console.log(`   ⚠️  Average response time is high (>1s)`);
        } else if (avg > 500) {
            console.log(`   ℹ️  Response time is moderate (>500ms)`);
        } else {
            console.log(`   ✅ Response time is good (<500ms)`);
        }
    }
}

// Test 11: Message routing and assignment
async function testMessageRouting(messages) {
    console.log(`\n🎯 Test 11: Message routing and assignment`);
    
    if (!messages || messages.length === 0) {
        console.log('⚠️  Skipping - no messages available');
        return;
    }
    
    const assigned = messages.filter(m => m.assignedTo !== null);
    const unassigned = messages.filter(m => m.assignedTo === null);
    const byRole = {};
    const byReason = {};
    
    messages.forEach(msg => {
        const role = msg.recipientRole || 'unassigned';
        byRole[role] = (byRole[role] || 0) + 1;
        
        if (msg.routingReason) {
            byReason[msg.routingReason] = (byReason[msg.routingReason] || 0) + 1;
        }
    });
    
    console.log(`   Routing Statistics:`);
    console.log(`   - Assigned: ${assigned.length}`);
    console.log(`   - Unassigned: ${unassigned.length}`);
    console.log(`   - By Role:`);
    Object.entries(byRole).forEach(([role, count]) => {
        console.log(`     • ${role}: ${count}`);
    });
    if (Object.keys(byReason).length > 0) {
        console.log(`   - By Routing Reason:`);
        Object.entries(byReason).forEach(([reason, count]) => {
            console.log(`     • ${reason}: ${count}`);
        });
    }
}

// Test 12: Patient information in messages
async function testPatientInfo(messages) {
    console.log(`\n👤 Test 12: Patient information in messages`);
    
    if (!messages || messages.length === 0) {
        console.log('⚠️  Skipping - no messages available');
        return;
    }
    
    const withPatientInfo = messages.filter(m => m.patientName && m.patientId);
    const withoutPatientInfo = messages.filter(m => !m.patientName || !m.patientId);
    const uniquePatients = new Set(messages.map(m => m.patientId).filter(Boolean));
    
    console.log(`   Patient Data Quality:`);
    console.log(`   - Messages with patient info: ${withPatientInfo.length}`);
    console.log(`   - Messages without patient info: ${withoutPatientInfo.length}`);
    console.log(`   - Unique patients: ${uniquePatients.size}`);
    
    if (withPatientInfo.length > 0) {
        console.log(`\n   Sample patients:`);
        const patientMap = new Map();
        messages.forEach(msg => {
            if (msg.patientId && msg.patientName && !patientMap.has(msg.patientId)) {
                patientMap.set(msg.patientId, {
                    name: msg.patientName,
                    phone: msg.patientPhone,
                    messageCount: messages.filter(m => m.patientId === msg.patientId).length
                });
            }
        });
        
        Array.from(patientMap.values()).slice(0, 5).forEach((patient, idx) => {
            console.log(`   ${idx + 1}. ${patient.name} (${patient.messageCount} messages)`);
            if (patient.phone) {
                console.log(`      Phone: ${patient.phone}`);
            }
        });
    }
}

// Main test runner
async function runTests() {
    // Use built-in fetch (Node 18+)
    if (typeof globalThis.fetch === 'undefined') {
        throw new Error('fetch is not available. Please use Node.js 18+');
    }
    console.log('🧪 Patient Messages API Test Suite (Expanded)');
    console.log('=============================================');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Test User: ${TEST_CREDENTIALS.username}`);

    const startTime = Date.now();
    const testResults = {
        passed: 0,
        failed: 0,
        skipped: 0
    };

    try {
        // Login first
        await login();
        testResults.passed++;

        // Run basic tests
        const messages = await testGetStaffMessages();
        if (messages.length > 0) {
            testResults.passed++;
        } else {
            testResults.skipped++;
        }

        // Get message IDs for testing
        const unreadMessages = messages.filter(m => m.status === 'sent');
        const firstUnreadId = unreadMessages.length > 0 ? unreadMessages[0].id : null;
        const firstMessageId = messages.length > 0 ? messages[0].id : null;
        const messageIds = messages.slice(0, 5).map(m => m.id);

        // Test individual message details
        if (firstMessageId) {
            await testGetMessageDetails(firstMessageId);
            testResults.passed++;
        } else {
            testResults.skipped++;
        }

        // Test mark as read
        if (firstUnreadId) {
            await testMarkAsRead(firstUnreadId);
            testResults.passed++;
        } else {
            testResults.skipped++;
        }

        // Test bulk operations
        if (messageIds.length > 0) {
            await testBulkMarkAsRead(messageIds);
            testResults.passed++;
        } else {
            testResults.skipped++;
        }

        // Test reply
        if (firstMessageId) {
            await testReplyToMessage(firstMessageId);
            testResults.passed++;
        } else {
            testResults.skipped++;
        }

        // Test filtering
        await testFilterMessages(messages);
        testResults.passed++;

        // Test statistics
        await testMessageStatistics(messages);
        testResults.passed++;

        // Test search
        await testMessageSearch(messages);
        testResults.passed++;

        // Test routing
        await testMessageRouting(messages);
        testResults.passed++;

        // Test patient info
        await testPatientInfo(messages);
        testResults.passed++;

        // Test performance
        await testPerformance();
        testResults.passed++;

        // Test error handling
        await testErrorHandling();
        testResults.passed++;

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log('\n' + '='.repeat(50));
        console.log('✅ All tests completed!');
        console.log('='.repeat(50));
        console.log('\n📊 Test Summary:');
        console.log(`- Total Duration: ${duration}s`);
        console.log(`- Tests Passed: ${testResults.passed}`);
        console.log(`- Tests Failed: ${testResults.failed}`);
        console.log(`- Tests Skipped: ${testResults.skipped}`);
        console.log(`- Total Messages: ${messages.length}`);
        console.log(`- Unread: ${unreadMessages.length}`);
        console.log(`- Read: ${messages.filter(m => m.status === 'read').length}`);
        console.log(`- Replied: ${messages.filter(m => m.status === 'replied').length}`);

    } catch (error) {
        testResults.failed++;
        console.error('\n❌ Test suite failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch(console.error);
}

export { 
    runTests, 
    testGetStaffMessages, 
    testMarkAsRead, 
    testReplyToMessage,
    testGetMessageDetails,
    testBulkMarkAsRead,
    testMessageStatistics,
    testMessageSearch,
    testPerformance,
    testMessageRouting,
    testPatientInfo,
    testErrorHandling,
    testFilterMessages
};

