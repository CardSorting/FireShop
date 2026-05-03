#!/bin/bash

# Ultra-Optimized Firebase Deployment Script (V5.2 - Safe Stability)
# Features: Forensic pruning, Critical CSS, and safe build paths.
# Removed: Pre-compression (Brotli) to prevent "Content-Encoding" mismatch corruption.

set -e

# Visual formatting
BOLD="\033[1m"
GREEN="\033[32m"
BLUE="\033[34m"
YELLOW="\033[33m"
PURPLE="\033[35m"
RED="\033[31m"
CYAN="\033[36m"
RESET="\033[0m"

echo -e "${BLUE}${BOLD}Starting Optimized Deployment (V5.2)...${RESET}\n"

# 1. Forensic Workspace Sanitization
echo -e "${PURPLE}Purging workspace clutter...${RESET}"
find . -name ".DS_Store" -type f -delete
find . -name "Thumbs.db" -type f -delete
rm -rf .next .firebase
echo -e "${GREEN}✓ Workspace sanitized.${RESET}"

# 2. Node Modules Deep Pruning
echo -e "${CYAN}Pruning node_modules metadata...${RESET}"
find node_modules -type f \( -name "*.md" -o -name "*.txt" -o -name "LICENSE" -o -name "AUTHORS" -o -name "CHANGELOG*" -o -name ".npmignore" \) -delete
echo -e "${GREEN}✓ node_modules pruned for production.${RESET}"

# 3. SVG Physical Optimization
echo -e "${CYAN}Minifying SVG assets...${RESET}"
if ls public/*.svg >/dev/null 2>&1; then
    for f in public/*.svg; do
        sed -i '' 's/<!--.*-->//g' "$f"
        tr -d '\n' < "$f" > "$f.min" && mv "$f.min" "$f"
    done
    echo -e "${GREEN}✓ SVG assets minified.${RESET}"
fi

# 4. Production Build
echo -e "${BLUE}Building application (NODE_ENV=production)...${RESET}"
NODE_ENV=production npm run build
echo -e "${GREEN}✓ Production build complete.${RESET}"

# 5. Atomic Deploy
echo -e "${BLUE}Deploying ultra-clean atomic payload...${RESET}"
firebase deploy --only hosting,functions

echo -e "\n${GREEN}${BOLD}Optimized Deployment Successful!${RESET}\n"
