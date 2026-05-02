#!/bin/bash

# ShopMore Onboarding & Setup Script
# Verifies environment and prepares the sovereign workspace.

set -e

# Visual formatting
BOLD="\033[1m"
GREEN="\033[32m"
BLUE="\033[34m"
RED="\033[31m"
RESET="\033[0m"

echo -e "${BLUE}${BOLD}Initializing ShopMore Engine...${RESET}\n"

# 1. Check Node version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo -e "${RED}Error: Node.js version 20 or higher is required.${RESET}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js version verified ($NODE_VERSION)${RESET}"

# 2. Check for .env file
if [ ! -f .env ]; then
  echo -e "${BLUE}No .env file found. Copying from .env.example...${RESET}"
  cp .env.example .env
  # Generate a random session secret if it's the default
  RANDOM_SECRET=$(openssl rand -base64 32)
  sed -i '' "s/change_this_to_a_secure_32_character_string/$RANDOM_SECRET/g" .env
  echo -e "${GREEN}✓ .env file created with a fresh SESSION_SECRET.${RESET}"
else
  echo -e "${GREEN}✓ .env file already exists.${RESET}"
fi

# 3. Install Dependencies
echo -e "${BLUE}Installing dependencies...${RESET}"
npm install
echo -e "${GREEN}✓ Dependencies installed.${RESET}"

# 4. Seed Database
echo -e "${BLUE}Seeding sovereign database...${RESET}"
npx tsx src/infrastructure/services/SeedDataLoader.ts
echo -e "${GREEN}✓ Database seeded.${RESET}"

echo -e "\n${GREEN}${BOLD}Setup Complete!${RESET}"
echo -e "Run ${BOLD}npm run dev${RESET} to start the engine.\n"
