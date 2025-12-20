#!/bin/bash

# Simple WhatsApp notification test script
# Usage: ./test-whatsapp-simple.sh [session_id] [patient_phone]

SESSION_ID=${1:-""}
PATIENT_PHONE=${2:-""}

API_URL=${API_URL:-"http://localhost:5001"}
USERNAME=${TEST_USERNAME:-"admin"}
PASSWORD=${TEST_PASSWORD:-"admin123"}

echo "🧪 Testing WhatsApp Notification"
echo "================================"
echo ""

# Step 1: Login
echo "1. Logging in..."
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "   Check if server is running at $API_URL"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Step 2: If no session ID provided, create one
if [ -z "$SESSION_ID" ]; then
  echo "2. Creating test session..."
  
  # Get first patient
  PATIENT_ID=$(curl -s -X GET "$API_URL/api/patients" \
    -H "Authorization: Bearer $TOKEN" \
    | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  
  if [ -z "$PATIENT_ID" ]; then
    echo "❌ No patients found. Create a patient first."
    exit 1
  fi
  
  # Create session
  SCHEDULED_TIME=$(date -u -v+1H +"%Y-%m-%dT%H:00:00Z" 2>/dev/null || date -u -d "+1 hour" +"%Y-%m-%dT%H:00:00Z" 2>/dev/null || echo "2024-01-20T10:00:00Z")
  
  SESSION_RESPONSE=$(curl -s -X POST "$API_URL/api/telemedicine/sessions" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"patientId\":$PATIENT_ID,\"type\":\"video\",\"scheduledTime\":\"$SCHEDULED_TIME\",\"status\":\"scheduled\"}")
  
  SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  
  if [ -z "$SESSION_ID" ]; then
    echo "❌ Failed to create session"
    echo "   Response: $SESSION_RESPONSE"
    exit 1
  fi
  
  echo "✅ Created session ID: $SESSION_ID"
  echo ""
fi

# Step 3: Send WhatsApp notification
echo "3. Sending WhatsApp notification..."
echo "   Session ID: $SESSION_ID"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/api/telemedicine/sessions/$SESSION_ID/send-notification" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"whatsapp"}')

# Check response
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ WhatsApp notification sent successfully!"
  echo ""
  echo "Response:"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  
  if echo "$RESPONSE" | grep -q '"messageId":"logged-only"'; then
    echo ""
    echo "⚠️  Note: Message was logged only (Twilio not configured)"
    echo "   Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to send actual messages"
  fi
else
  echo "❌ Failed to send WhatsApp notification"
  echo ""
  echo "Response:"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  exit 1
fi

echo ""
echo "✅ Test completed!"

