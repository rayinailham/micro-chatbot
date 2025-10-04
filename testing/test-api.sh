#!/bin/bash

# API Testing Script for Chatbot Microservice
# This script tests all endpoints of the chatbot microservice

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3007"
TEST_USER_ID="test-user-$(date +%s)"
CONVERSATION_ID=""
MESSAGE_ID=""

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test header
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Function to print test result
print_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}: $2"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAILED${NC}: $2"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to wait for service
wait_for_service() {
    echo -e "${YELLOW}Waiting for service to be ready...${NC}"
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
            echo -e "${GREEN}Service is ready!${NC}\n"
            return 0
        fi
        attempt=$((attempt + 1))
        echo -e "${YELLOW}Attempt $attempt/$max_attempts - Service not ready yet...${NC}"
        sleep 2
    done
    
    echo -e "${RED}Service failed to start after $max_attempts attempts${NC}"
    return 1
}

# Test 1: Health Check
test_health_check() {
    print_header "TEST 1: Health Check"
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    echo "Response: $body"
    echo "HTTP Code: $http_code"
    
    if [ "$http_code" = "200" ]; then
        print_result 0 "Health check endpoint"
    else
        print_result 1 "Health check endpoint (Expected 200, got $http_code)"
    fi
}

# Test 2: API Info
test_api_info() {
    print_header "TEST 2: API Info"
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    echo "Response: $body"
    echo "HTTP Code: $http_code"
    
    if [ "$http_code" = "200" ]; then
        print_result 0 "API info endpoint"
    else
        print_result 1 "API info endpoint (Expected 200, got $http_code)"
    fi
}

# Test 3: Create Conversation
test_create_conversation() {
    print_header "TEST 3: Create Conversation"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/v1/chatbot/conversations" \
        -H "Content-Type: application/json" \
        -d "{
            \"user_id\": \"$TEST_USER_ID\",
            \"title\": \"Test Conversation\",
            \"initial_message\": \"Hello, this is a test message\"
        }")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    echo "Response: $body"
    echo "HTTP Code: $http_code"
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        # Extract conversation ID (looking for "id":1 pattern)
        CONVERSATION_ID=$(echo "$body" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
        echo -e "${GREEN}Conversation ID: $CONVERSATION_ID${NC}"
        print_result 0 "Create conversation"
    else
        print_result 1 "Create conversation (Expected 200/201, got $http_code)"
    fi
}

# Test 4: List Conversations
test_list_conversations() {
    print_header "TEST 4: List Conversations"
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/v1/chatbot/conversations?user_id=$TEST_USER_ID")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    echo "Response: $body"
    echo "HTTP Code: $http_code"
    
    if [ "$http_code" = "200" ]; then
        print_result 0 "List conversations"
    else
        print_result 1 "List conversations (Expected 200, got $http_code)"
    fi
}

# Test 5: Get Conversation Details
test_get_conversation() {
    print_header "TEST 5: Get Conversation Details"
    
    if [ -z "$CONVERSATION_ID" ]; then
        echo -e "${YELLOW}Skipping: No conversation ID available${NC}"
        return
    fi
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/v1/chatbot/conversations/$CONVERSATION_ID")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    echo "Response: $body"
    echo "HTTP Code: $http_code"
    
    if [ "$http_code" = "200" ]; then
        print_result 0 "Get conversation details"
    else
        print_result 1 "Get conversation details (Expected 200, got $http_code)"
    fi
}

# Test 6: Send Message
test_send_message() {
    print_header "TEST 6: Send Message to Conversation"
    
    if [ -z "$CONVERSATION_ID" ]; then
        echo -e "${YELLOW}Skipping: No conversation ID available${NC}"
        return
    fi
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/v1/chatbot/conversations/$CONVERSATION_ID/messages" \
        -H "Content-Type: application/json" \
        -d "{
            \"content\": \"What is the capital of France?\"
        }")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    echo "Response: $body"
    echo "HTTP Code: $http_code"
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        # Extract message ID (looking for last "id":number pattern)
        MESSAGE_ID=$(echo "$body" | grep -o '"id":[0-9]*' | tail -1 | cut -d':' -f2)
        echo -e "${GREEN}Message ID: $MESSAGE_ID${NC}"
        print_result 0 "Send message"
    else
        print_result 1 "Send message (Expected 200/201, got $http_code)"
    fi
}

# Test 7: Update Conversation
test_update_conversation() {
    print_header "TEST 7: Update Conversation"
    
    if [ -z "$CONVERSATION_ID" ]; then
        echo -e "${YELLOW}Skipping: No conversation ID available${NC}"
        return
    fi
    
    response=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/v1/chatbot/conversations/$CONVERSATION_ID" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"Updated Test Conversation\"
        }")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    echo "Response: $body"
    echo "HTTP Code: $http_code"
    
    if [ "$http_code" = "200" ]; then
        print_result 0 "Update conversation"
    else
        print_result 1 "Update conversation (Expected 200, got $http_code)"
    fi
}

# Test 8: Regenerate Message
test_regenerate_message() {
    print_header "TEST 8: Regenerate Message"
    
    if [ -z "$MESSAGE_ID" ]; then
        echo -e "${YELLOW}Skipping: No message ID available${NC}"
        return
    fi
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/v1/chatbot/messages/$MESSAGE_ID/regenerate")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    echo "Response: $body"
    echo "HTTP Code: $http_code"
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        print_result 0 "Regenerate message"
    else
        print_result 1 "Regenerate message (Expected 200/201, got $http_code)"
    fi
}

# Test 9: Delete Conversation
test_delete_conversation() {
    print_header "TEST 9: Delete Conversation"
    
    if [ -z "$CONVERSATION_ID" ]; then
        echo -e "${YELLOW}Skipping: No conversation ID available${NC}"
        return
    fi
    
    response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/v1/chatbot/conversations/$CONVERSATION_ID")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    echo "Response: $body"
    echo "HTTP Code: $http_code"
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
        print_result 0 "Delete conversation"
    else
        print_result 1 "Delete conversation (Expected 200/204, got $http_code)"
    fi
}

# Print summary
print_summary() {
    print_header "TEST SUMMARY"
    echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}All tests passed! ✓${NC}\n"
        return 0
    else
        echo -e "\n${RED}Some tests failed! ✗${NC}\n"
        return 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════╗"
    echo "║   Chatbot Microservice API Testing        ║"
    echo "╚════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Wait for service to be ready
    if ! wait_for_service; then
        echo -e "${RED}Cannot proceed with tests - service is not available${NC}"
        exit 1
    fi
    
    # Run all tests
    test_health_check
    test_api_info
    test_create_conversation
    test_list_conversations
    test_get_conversation
    test_send_message
    test_update_conversation
    test_regenerate_message
    test_delete_conversation
    
    # Print summary
    print_summary
}

# Run main function
main

