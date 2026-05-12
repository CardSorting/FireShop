# DreamBees Concierge — Technical & Operational Documentation

## 1. Overview
DreamBees Concierge is a production-grade customer operations and support intelligence system. It transitions beyond simple "AI chat" into a comprehensive workspace for storefront assistance, high-velocity triage, and strategic operational awareness.

The system is built on the principle of **"Invisible AI"**, where the intelligence serves the operator and the customer without exposing technical abstractions.

---

## 2. Core Architecture

### 2.1 Storefront Entry Point (`ConciergeBubble.tsx`)
The primary interface for customers. It provides:
- **Calm Support Entry**: A floating bubble that prioritizes reassurance and ease of use.
- **Conversion Assistance**: Quick-action triggers for common hurdles (Sizing, Shipping, Returns).
- **Session Continuity**: Automatic restoration of previous sessions with a transparent "Syncing" state.
- **Reliability Layer**: Built-in reconnection handling and honest status indicators ("Concierge Online" vs "Reconnecting").

### 2.2 Support Command Center (`AdminConciergeInsights.tsx`)
The administrative workspace designed for high-velocity triage and collaboration.
- **Inbox Triage**: Linear-grade scanability with status indicators (Needs Action, Assigned, Resolved).
- **Findings Workspace**: Displays evidence-backed findings (Facts vs. Assumptions) and "Suggested Fixes".
- **Team Collaboration**: Assignment flows, internal handoff notes, and a chronological Team Activity feed.
- **Outcome Tracking**: Explicit tracking of customer outcomes (Resolved, Escalated, Converted).

### 2.3 Intelligence Engine (`ConciergeService.ts`)
The backend service orchestrating analysis and memory.
- **Evidence-Based Grounding**: Analysis is grounded in direct transcript quotes.
- **Uncertainty Awareness**: Detects and flags ambiguity, recommending clarifying questions instead of guessing.
- **Memory Injection**: Injects historical context and repeat-issue patterns into new sessions.

---

## 3. Key Operational Features

### 3.1 Trust Infrastructure
The system distinguishes between **Facts** (explicit customer statements) and **Patterns** (AI interpretations). This prevents "AI certainty theater" and ensures operators can trust the grounding of every suggestion.

### 3.2 Team Collaboration
- **Assignment**: Sessions can be assigned to specific team members to ensure ownership.
- **Activity Feed**: An audit trail of all workspace actions (notes added, status changes, assignments).
- **Handoff Notes**: Internal-only notes for team coordination.

### 3.3 Strategic Operational Digest
The "Digest" tab translates support volume into business intelligence:
- **Operational Observations**: Natural-language summaries (e.g., *"14% of customers hesitate due to weekend delivery info"*).
- **Sentiment Velocity**: Tracks whether support friction is increasing or decreasing over time.
- **Impact Assessment**: Measures the predicted business impact (Conversion, Loyalty) of suggested fixes.

---

## 4. Data Model (Firestore)

### `conciergeSessions` Collection
- `status`: `active` | `resolved` | `analyzed`
- `customerOutcome`: `resolved` | `escalated` | `abandoned` | `converted`
- `assignedOperator`: String (ID or name)
- `isRepeatIssue`: Boolean
- `isSnoozed`: Boolean
- `operatorFeedback`: Array of helpful/not_useful signals
- `events`: Array of activity feed events
- `transcript`: Array of role/content messages

---

## 5. Technical Reliability
- **Resilient Syncing**: Uses local storage and Firestore to ensure sessions persist across page reloads.
- **Partial Stream Recovery**: Handles interrupted analysis passes gracefully.
- **Human-Centered Status**: UI states like "Support Online" or "Still Syncing" manage customer expectations during latency.

---

## 6. Success Metrics
- **Resolution Rate**: Percentage of sessions resolved without manual escalation.
- **Conversion Assist**: Number of sales attributed to concierge interactions.
- **Trust Score**: Percentage of suggestions marked "Helpful" by operators.
- **Repeat Friction Reduction**: Decrease in specific category volume (e.g., Sizing) after implementing suggested fixes.
