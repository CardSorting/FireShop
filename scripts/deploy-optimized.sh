#!/bin/bash

# Extreme-Optimized Firebase Deployment Script (V5 - Forensic Purge Edition)
# Features: Recursive node_modules pruning, SVG physical minification, Brotli-11, and PPR build.

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

echo -e "${BLUE}${BOLD}Starting Extreme-Optimized Deployment (V5)...${RESET}\n"

# 1. Forensic Workspace Sanitization
echo -e "${PURPLE}Purging workspace clutter...${RESET}"
find . -name ".DS_Store" -type f -delete
find . -name "Thumbs.db" -type f -delete
rm -rf .next .firebase
echo -e "${GREEN}✓ Workspace sanitized.${RESET}"

# 2. Node Modules Deep Pruning
# Removing non-essential metadata from node_modules to speed up hashing and reduce payload
# This is a "clean" optimization that drastically reduces file count
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

# 4. Production Build (with PPR)
echo -e "${BLUE}Building application (NODE_ENV=production)...${RESET}"
NODE_ENV=production npm run build
echo -e "${GREEN}✓ Production build complete (with PPR & Critical CSS).${RESET}"

# 5. Physical Compression (Brotli-11)
if command -v brotli >/dev/null 2>&1; then
    echo -e "${BLUE}Executing physical Brotli-11 compression...${RESET}"
    FILES=$(find .next/static public -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.svg" -o -name "*.json" \) ! -name "*.br")
    for f in $FILES; do
        brotli -q 11 -f "$f" -o "$f.br"
    done
    echo -e "${GREEN}✓ Brotli compression complete.${RESET}"
fi

# 6. Final Payload Audit
echo -e "${PURPLE}Performing high-fidelity payload audit...${RESET}"
LARGE_FILES=$(find .next/static -type f -size +200k) # Threshold lowered to 200KB for V5
if [ ! -z "$LARGE_FILES" ]; then
    echo -e "${YELLOW}Warning: Non-ideal assets detected (>200KB):${RESET}"
    echo "$LARGE_FILES"
fi

# 7. Atomic Deploy
echo -e "${BLUE}Deploying ultra-clean atomic payload...${RESET}"
firebase deploy --only hosting,functions --concurrency 30 # Increased concurrency for V5

echo -e "\n${GREEN}${BOLD}V5 Extreme-Optimized Deployment Successful!${RESET}\n"
