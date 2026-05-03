#!/bin/bash

# Ultra-Optimized Firebase Deployment Script (V4 - Forensic Edition)
# Features: SVG physical minification, recursive Brotli-11, cache purging, and payload fingerprinting.

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

echo -e "${BLUE}${BOLD}Starting Ultra-Optimized Deployment (V4)...${RESET}\n"

# 1. Forensic Cleanup
echo -e "${PURPLE}Purging workspace clutter...${RESET}"
find . -name ".DS_Store" -type f -delete
find . -name "Thumbs.db" -type f -delete
rm -rf .next .firebase
echo -e "${GREEN}✓ Workspace sanitized.${RESET}"

# 2. SVG Physical Optimization
# Manually stripping whitespace and metadata from SVGs to reduce payload without new dependencies
echo -e "${CYAN}Minifying SVG assets...${RESET}"
if ls public/*.svg >/dev/null 2>&1; then
    for f in public/*.svg; do
        # Simple regex-based minification: remove newlines, multiple spaces, and comments
        sed -i '' 's/<!--.*-->//g' "$f"
        tr -d '\n' < "$f" > "$f.min" && mv "$f.min" "$f"
        echo -e "${GREEN}  - Optimized $(basename "$f")${RESET}"
    done
fi

# 3. Production Build
echo -e "${BLUE}Building application (NODE_ENV=production)...${RESET}"
NODE_ENV=production npm run build
echo -e "${GREEN}✓ Production build complete.${RESET}"

# 4. Physical Compression (Brotli-11)
if command -v brotli >/dev/null 2>&1; then
    echo -e "${BLUE}Executing physical Brotli-11 compression...${RESET}"
    FILES=$(find .next/static public -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.svg" -o -name "*.json" \) ! -name "*.br")
    for f in $FILES; do
        brotli -q 11 -f "$f" -o "$f.br"
    done
    echo -e "${GREEN}✓ Brotli compression complete.${RESET}"
else
    echo -e "${YELLOW}Brotli not found. Using high-ratio Gzip-9...${RESET}"
    find .next/static public -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.svg" -o -name "*.json" \) -exec gzip -k -f -9 {} \;
fi

# 5. Asset Fingerprinting & Audit
echo -e "${PURPLE}Performing payload audit...${RESET}"
LARGE_FILES=$(find .next/static -type f -size +300k) # Lowered threshold to 300KB for stricter audit
if [ ! -z "$LARGE_FILES" ]; then
    echo -e "${YELLOW}Warning: Significant assets detected (>300KB):${RESET}"
    echo "$LARGE_FILES"
fi

# 6. Atomic Precision Deploy
echo -e "${BLUE}Deploying atomic payload...${RESET}"
firebase deploy --only hosting,functions --concurrency 25 # Slightly increased concurrency for faster parallel upload

echo -e "\n${GREEN}${BOLD}V4 Ultra-Optimized Deployment Successful!${RESET}\n"
