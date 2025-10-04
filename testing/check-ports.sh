#!/bin/bash

# Script to check available ports before running Docker containers

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Port Availability Checker           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}\n"

# Function to check if port is in use
check_port() {
    local port=$1
    local service=$2
    
    if ss -tuln | grep -q ":$port "; then
        echo -e "${RED}✗ Port $port ($service) is IN USE${NC}"
        echo "  Process using port $port:"
        ss -tulnp | grep ":$port " | head -1
        return 1
    else
        echo -e "${GREEN}✓ Port $port ($service) is AVAILABLE${NC}"
        return 0
    fi
}

# Ports to check
echo -e "${YELLOW}Checking required ports for Docker containers:${NC}\n"

PORTS_OK=true

# Check application port
if ! check_port 3007 "Chatbot Application"; then
    PORTS_OK=false
fi

# Check database port
if ! check_port 5435 "PostgreSQL Database"; then
    PORTS_OK=false
fi

echo ""
echo -e "${YELLOW}All currently listening ports:${NC}"
echo "----------------------------------------"
ss -tuln | grep LISTEN | awk '{print $5}' | cut -d: -f2 | sort -n | uniq | while read port; do
    echo "  - Port $port"
done

echo ""
if [ "$PORTS_OK" = true ]; then
    echo -e "${GREEN}✓ All required ports are available!${NC}"
    echo -e "${GREEN}You can proceed with Docker testing.${NC}\n"
    exit 0
else
    echo -e "${RED}✗ Some required ports are in use!${NC}"
    echo -e "${YELLOW}Please stop the services using these ports or modify docker-compose.test.yml to use different ports.${NC}\n"
    
    echo -e "${YELLOW}Suggested alternative ports:${NC}"
    
    # Find alternative ports
    for base_port in 3004 3009 3010 3011 3012; do
        if ! ss -tuln | grep -q ":$base_port "; then
            echo "  - Application: $base_port"
            break
        fi
    done
    
    for base_port in 5436 5437 5438 5439 5440; do
        if ! ss -tuln | grep -q ":$base_port "; then
            echo "  - PostgreSQL: $base_port"
            break
        fi
    done
    
    echo ""
    exit 1
fi

