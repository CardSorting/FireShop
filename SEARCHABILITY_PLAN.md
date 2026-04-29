# PlayMoreTCG: E-commerce Searchability & Discovery Plan

This document outlines the strategic roadmap for transforming **PlayMoreTCG** (ShopMore) into a high-velocity discovery engine, prioritizing frictionless search, instant results, and intelligent product matching.

## 1. The Strategic Focus: "Search-First" Commerce

TCG collectors often know exactly what they want. The goal is to get them from "Thought" to "Cart" in under 5 seconds using a search-centric interface.

### A. The "Universal Command" Wedge
*   **Global Command Palette (⌘+K)**: A persistent, lightning-fast search overlay accessible from any page, mirroring the UX of modern developer tools and high-end SaaS.
*   **Instant Visual Autocomplete**: As the user types, show high-fidelity product previews, price snapshots, and category suggestions directly in the search dropdown.

### B. Intelligent Matching (The "Intent" Wedge)
*   **Fuzzy & Synonym Logic**: Native handling of typos (e.g., "Pikachuu") and card-specific shorthand (e.g., "Zard" for Charizard, "ETB" for Elite Trainer Box).
*   **Attribute-Aware Search**: Allowing users to search by metadata directly (e.g., typing "Fire HP:120" or "Rare Base Set") and having the engine parse these as filters.

### C. Discovery Flywheel (The "Inspiration" Wedge)
*   **Recent & Trending Searches**: Showing "What's Hot" and "Your Recent Picks" to reduce typing friction.
*   **Zero-Result Recovery**: Instead of a "No Results" page, show intelligent alternatives, trending sets, or "Did you mean...?" suggestions.

---

## 2. Implementation Roadmap

### Phase 1: High-Velocity Search UX (Immediate)
*   [ ] **Global Search Overlay**:
    *   Implementation of a `CommandBar` component with backdrop-blur and hotkey support.
    *   Integration with a server-side "Quick Search" endpoint for sub-100ms response times.
*   [ ] **Instant Result Previews**:
    *   Adding "Quick Add to Cart" buttons directly within the search results.
    *   Categorized results (Products vs Sets vs Collections).

### Phase 2: Intelligence & Parsing
*   [ ] **The "Synonym Engine"**:
    *   A mapping layer for common TCG abbreviations and slang.
    *   Fuzzy matching algorithms to handle common name misspellings.
*   [ ] **Metadata Parsing**:
    *   Upgrading the search service to recognize "tokens" like Set names and Rarities within a string query.

### Phase 3: Personalization & SEO
*   [ ] **Search-Driven SEO**:
    *   Generating "Search Result Pages" that are crawlable for common long-tail queries (e.g., "Cheap Holographic Fire Cards").
*   [ ] **Search History & Favorites**:
    *   Saving user search preferences to personalize the "Discovery" feed on the homepage.

---

## 3. The Search Architecture

To achieve the "sub-100ms" goal, we will implement a dual-stage search architecture:

1. **Stage 1: Hot-Cache Index (UI Layer)**
   - Pre-fetch the top 500 most popular items and categories on page load.
   - Use a lightweight fuzzy matcher in the client for instant local results.
   
2. **Stage 2: Forensic Server Search (Infrastructure Layer)**
   - A dedicated `/api/search/quick` endpoint optimized for low latency.
   - Leverages full-text search indexes in the database to find deep-inventory items.

3. **Fuzzy Scoring Engine**:
   - Implementing a **Levenshtein Distance** algorithm to calculate search relevance.
   - Ranking results based on a weighted score: `Exact Match (1.0) > Name Starts With (0.8) > Fuzzy Name Match (0.6)`.

---

## 4. Competitive Comparison (Search UX)

| Feature | Standard E-commerce | PlayMoreTCG (Search-First) |
| :--- | :--- | :--- |
| **Access** | Header Bar only | **⌘+K Global Overlay** |
| **Speed** | 1s+ (Full page reload) | **<100ms (Instant)** |
| **Intelligence** | Literal matching | **Synonyms & Fuzzy Logic** |
| **UI** | List of text links | **Rich Visual Previews** |

---

> [!TIP]
> **Priority #1**: The **Global Command Palette**. By making search a first-class citizen accessible from anywhere, we transform the site from a "store" into a "utility" for collectors.
