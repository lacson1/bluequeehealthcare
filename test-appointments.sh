#!/bin/bash

# Appointment Testing Script
# Make sure your server is running on http://localhost:5001

BASE_URL="http://localhost:5001/api"
TOKEN="" # Will be set after login

echo "=== Appointment Testing Script ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print info
print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Step 1: Login (replace with your credentials)
print_info "Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    print_error "Login failed. Please check your credentials."
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

print_success "Login successful"
echo ""

# Step 2: Get all appointments
print_info "Step 2: Getting all appointments..."
APPOINTMENTS_RESPONSE=$(curl -s -X GET "$BASE_URL/appointments" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $APPOINTMENTS_RESPONSE" | jq '.' 2>/dev/null || echo "$APPOINTMENTS_RESPONSE"
echo ""

# Step 3: Get appointments for a specific date (today)
TODAY=$(date +%Y-%m-%d)
print_info "Step 3: Getting appointments for today ($TODAY)..."
APPOINTMENTS_TODAY=$(curl -s -X GET "$BASE_URL/appointments?date=$TODAY" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $APPOINTMENTS_TODAY" | jq '.' 2>/dev/null || echo "$APPOINTMENTS_TODAY"
echo ""

# Step 4: Get first patient ID (for creating appointment)
print_info "Step 4: Getting first patient ID..."
PATIENTS_RESPONSE=$(curl -s -X GET "$BASE_URL/patients?limit=1" \
  -H "Authorization: Bearer $TOKEN")

PATIENT_ID=$(echo $PATIENTS_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$PATIENT_ID" ]; then
    print_error "No patients found. Please create a patient first."
    exit 1
fi

print_success "Found patient ID: $PATIENT_ID"
echo ""

# Step 5: Get first doctor ID
print_info "Step 5: Getting first doctor ID..."
DOCTORS_RESPONSE=$(curl -s -X GET "$BASE_URL/users?role=doctor&limit=1" \
  -H "Authorization: Bearer $TOKEN")

DOCTOR_ID=$(echo $DOCTORS_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$DOCTOR_ID" ]; then
    print_error "No doctors found. Please create a doctor first."
    exit 1
fi

print_success "Found doctor ID: $DOCTOR_ID"
echo ""

# Step 6: Create a new appointment
print_info "Step 6: Creating a new appointment..."
TOMORROW=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "+1 day" +%Y-%m-%d)
APPOINTMENT_TIME="10:00"

CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/appointments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"patientId\": $PATIENT_ID,
    \"doctorId\": $DOCTOR_ID,
    \"appointmentDate\": \"$TOMORROW\",
    \"appointmentTime\": \"$APPOINTMENT_TIME\",
    \"duration\": 30,
    \"type\": \"consultation\",
    \"notes\": \"Test appointment created by script\"
  }")

echo "Response: $CREATE_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE"

APPOINTMENT_ID=$(echo $CREATE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$APPOINTMENT_ID" ]; then
    print_error "Failed to create appointment"
    exit 1
fi

print_success "Appointment created with ID: $APPOINTMENT_ID"
echo ""

# Step 7: Get patient appointments
print_info "Step 7: Getting appointments for patient $PATIENT_ID..."
PATIENT_APPOINTMENTS=$(curl -s -X GET "$BASE_URL/patients/$PATIENT_ID/appointments" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $PATIENT_APPOINTMENTS" | jq '.' 2>/dev/null || echo "$PATIENT_APPOINTMENTS"
echo ""

# Step 8: Update appointment
print_info "Step 8: Updating appointment $APPOINTMENT_ID..."
UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/appointments/$APPOINTMENT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Updated notes from test script",
    "status": "confirmed"
  }')

echo "Response: $UPDATE_RESPONSE" | jq '.' 2>/dev/null || echo "$UPDATE_RESPONSE"
echo ""

# Step 9: Start consultation
print_info "Step 9: Starting consultation for appointment $APPOINTMENT_ID..."
START_CONSULTATION=$(curl -s -X POST "$BASE_URL/appointments/$APPOINTMENT_ID/start-consultation" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Response: $START_CONSULTATION" | jq '.' 2>/dev/null || echo "$START_CONSULTATION"
echo ""

# Step 10: Complete consultation
print_info "Step 10: Completing consultation for appointment $APPOINTMENT_ID..."
COMPLETE_CONSULTATION=$(curl -s -X POST "$BASE_URL/appointments/$APPOINTMENT_ID/complete-consultation" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Response: $COMPLETE_CONSULTATION" | jq '.' 2>/dev/null || echo "$COMPLETE_CONSULTATION"
echo ""

print_success "=== All appointment tests completed ==="

