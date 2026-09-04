const http = require('http');
const assert = require('assert');

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runTests() {
  console.log('--- Starting Comprehensive EMS Backend API Verification Suite ---');
  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`✔ [PASSED] ${name}`);
      passed++;
    } catch (e) {
      console.log(`❌ [FAILED] ${name}`);
      console.error(`   Error: ${e.message}`);
      failed++;
    }
  };

  try {
    // 1. Health Check
    await test('Health Check', async () => {
      const res = await request('GET', '/');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ONLINE');
    });

    // Setup: Let's register a new head user and a new viewer user for testing
    let headToken, viewerToken, viewerToken2;
    let createdEventId;
    let ticketHash;
    const testId = Date.now();

    await test('Auth: Register Head User', async () => {
      const res = await request('POST', '/api/v1/auth/register', {
        email: `test.head.${testId}@ems.com`,
        password: 'password123',
        fullName: 'Test Head',
        role: 'HEAD_USER'
      });
      assert.strictEqual(res.status, 201);
      headToken = res.body.token;
    });

    await test('Auth: Register Viewer User 1', async () => {
      const res = await request('POST', '/api/v1/auth/register', {
        email: `test.viewer1.${testId}@ems.com`,
        password: 'password123',
        fullName: 'Test Viewer 1' // Default role is VIEWER
      });
      assert.strictEqual(res.status, 201);
      viewerToken = res.body.token;
    });

    await test('Auth: Register Viewer User 2', async () => {
      const res = await request('POST', '/api/v1/auth/register', {
        email: `test.viewer2.${testId}@ems.com`,
        password: 'password123',
        fullName: 'Test Viewer 2'
      });
      assert.strictEqual(res.status, 201);
      viewerToken2 = res.body.token;
    });

    await test('Auth: Get Me (Viewer)', async () => {
      const res = await request('GET', '/api/v1/auth/me', null, viewerToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.email, `test.viewer1.${testId}@ems.com`);
      assert.strictEqual(res.body.role, 'VIEWER');
    });

    await test('Events: Create Event (Viewer User - Should Fail)', async () => {
      const res = await request('POST', '/api/v1/events', {
        title: 'Unauthorized Event',
        description: 'Should fail',
        location: 'Nowhere',
        dateTime: '2026-12-05T10:00:00Z',
        capacity: 50
      }, viewerToken);
      assert.strictEqual(res.status, 403);
    });

    await test('Events: Create Event (Head User)', async () => {
      const res = await request('POST', '/api/v1/events', {
        title: 'Tech Conference 2027',
        description: 'A great tech conference.',
        location: 'Hall B',
        dateTime: '2027-01-10T09:00:00Z',
        capacity: 2
      }, headToken);
      assert.strictEqual(res.status, 201);
      createdEventId = res.body.event.id;
    });

    await test('Events: Get All Events', async () => {
      const res = await request('GET', '/api/v1/events');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body));
      assert.ok(res.body.find(e => e.id === createdEventId));
    });

    await test('Events: Search Events', async () => {
      const res = await request('GET', `/api/v1/events?search=${encodeURIComponent('Tech Conference')}`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.length > 0);
      assert.strictEqual(res.body[0].title, 'Tech Conference 2027');
    });

    await test('Events: Get Event by ID', async () => {
      const res = await request('GET', `/api/v1/events/${createdEventId}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.id, createdEventId);
    });

    await test('Events: Update Event (Head User)', async () => {
      const res = await request('PUT', `/api/v1/events/${createdEventId}`, {
        capacity: 3
      }, headToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.event.capacity, 3);
    });

    await test('Tickets: Register for Event (Viewer 1)', async () => {
      const res = await request('POST', '/api/v1/tickets/register', {
        eventId: createdEventId
      }, viewerToken);
      assert.strictEqual(res.status, 201);
      assert.ok(res.body.ticket.qrCodeHash);
      ticketHash = res.body.ticket.qrCodeHash;
    });

    await test('Tickets: Duplicate Registration (Viewer 1 - Should Fail)', async () => {
      const res = await request('POST', '/api/v1/tickets/register', {
        eventId: createdEventId
      }, viewerToken);
      assert.strictEqual(res.status, 400); // Already registered
    });

    await test('Tickets: Get My Tickets (Viewer 1)', async () => {
      const res = await request('GET', '/api/v1/tickets/my-tickets', null, viewerToken);
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body));
      assert.strictEqual(res.body.length, 1);
      assert.strictEqual(res.body[0].eventId, createdEventId);
    });

    await test('Tickets: Get Event Attendees (Head User)', async () => {
      const res = await request('GET', `/api/v1/tickets/events/${createdEventId}/attendees`, null, headToken);
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body));
      assert.strictEqual(res.body.length, 1);
      assert.strictEqual(res.body[0].userEmail, `test.viewer1.${testId}@ems.com`);
    });

    await test('Tickets: Check-in Attendee (Head User)', async () => {
      const res = await request('POST', `/api/v1/tickets/events/${createdEventId}/checkin`, {
        qrCodeHash: ticketHash
      }, headToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.verifiedAttendee.email, `test.viewer1.${testId}@ems.com`);
    });

    await test('Tickets: Check-in Attendee Again (Should Fail)', async () => {
      const res = await request('POST', `/api/v1/tickets/events/${createdEventId}/checkin`, {
        qrCodeHash: ticketHash
      }, headToken);
      assert.strictEqual(res.status, 400); // Already checked in
    });

    await test('RBAC: Viewer accesses Check-in (Should Fail)', async () => {
      const res = await request('POST', `/api/v1/tickets/events/${createdEventId}/checkin`, {
        qrCodeHash: 'fake_hash'
      }, viewerToken);
      assert.strictEqual(res.status, 403);
    });

    await test('Analytics: Get Head Summary (Head User)', async () => {
      const res = await request('GET', '/api/v1/analytics/head-summary', null, headToken);
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.summary);
      assert.ok(res.body.eventBreakdown);
    });

    await test('RBAC: Viewer accesses Analytics (Should Fail)', async () => {
      const res = await request('GET', '/api/v1/analytics/head-summary', null, viewerToken);
      assert.strictEqual(res.status, 403);
    });

    await test('Tickets: Capacity Full Check (Viewer 2)', async () => {
      // createdEventId has capacity 3. Viewer 1 registered. Let's change capacity to 1 to simulate full.
      await request('PUT', `/api/v1/events/${createdEventId}`, { capacity: 1 }, headToken);
      
      const res = await request('POST', '/api/v1/tickets/register', {
        eventId: createdEventId
      }, viewerToken2);
      
      assert.strictEqual(res.status, 400); // Should fail because event is fully booked
      assert.strictEqual(res.body.error, 'Event is fully booked');
    });

    await test('Events: Delete Event (Head User)', async () => {
      const res = await request('DELETE', `/api/v1/events/${createdEventId}`, null, headToken);
      assert.strictEqual(res.status, 200);
      
      // Verify deletion
      const checkRes = await request('GET', `/api/v1/events/${createdEventId}`);
      assert.strictEqual(checkRes.status, 404);
    });

    console.log('\n=================================================');
    console.log(`Total Tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    if (failed === 0) {
      console.log('🎉 ALL BACKEND API VERIFICATION TESTS PASSED!');
    } else {
      console.log('❌ SOME TESTS FAILED.');
    }
    console.log('=================================================\n');

  } catch (error) {
    console.error('❌ Test execution encountered an unhandled exception:', error);
  }
}

runTests();
