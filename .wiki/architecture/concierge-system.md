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

### 3.4 Lifecycle Marketing & Recapture
The Concierge is integrated with the autonomous lifecycle marketing engine documented in [Concierge Lifecycle Marketing & Campaign Automation](./lifecycle-marketing-concierge.md).

From the admin support workspace, operators can use the **Recovery Funnels** tab to inspect lifecycle coverage, create missing campaign drafts, activate or pause playbooks, run an automation pulse, and optimize the full campaign strategy.

From chat tool execution, the Concierge can:
- inspect the lifecycle strategy
- deep-investigate a customer lifecycle
- plan a customer-specific lifecycle decision
- create lifecycle playbook drafts
- activate or pause playbooks
- run lifecycle automation
- enroll eligible customers
- suppress risky marketing outreach

The Concierge must run customer investigation and lifecycle planning before recommending enrollment. Marketing is suppressed for active support risk, angry sentiment, unsubscribe intent, missing consent, active sequence conflicts, or over-frequency.

---

## 4. Data Model (Firestore)

### `conciergeSessions` Collection
- `status`: `active` | `resolved` | `analyzed`
- `customerOutcome`: `resolved` | `escalated` | `abandoned` | `converted`
- `assignedOperator`: String (ID or name)
- `isRepeatIssue`: Boolean
- `isSnoozed`: Boolean
- `recaptureOpportunities`: Lifecycle/campaign opportunities detected during session analysis.
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

---

## 7. Artisanal Bartering Engine

The Concierge has been graduated into a high-fidelity **Artisanal Bartering Engine**, designed to mirror the trust and negotiation dynamics of a boutique peer-to-peer marketplace (e.g., Facebook Marketplace).

### 7.1 Marketplace Persona ("Sarah from DreamBees")
To embed **Operational Trust**, the Concierge utilizes a verified seller identity:
- **Verified Profile**: Displayed with social proof badges: "100% Response Rate" and "9-6 PM Studio Hours."
- **Live Studio Status**: Real-time indicators of current activity (e.g., *"🎨 In the studio • Packing orders"*).
- **Atmospheric Anchoring**: Contextual greetings and studio anecdotes that ground the interaction in a physical, human-run workspace.

### 7.2 Trust-Based Negotiation UI
- **High-Fidelity Offer Cards**: Displays original vs. negotiated price with strikethrough styling and transparent percentage savings.
- **Negotiation History Trail**: A visual log of the "haggle path," showing previous offers to build a sense of an "earned" deal.
- **Deal Confidence Meter**: A dynamic progress bar that visualizes how close the buyer and seller are to a consensus, encouraging "closing the gap."
- **Natural Number Haggling**: AI is programmed to use rounded, human-friendly numbers (, ) rather than robotic, precise cents.

### 7.3 Scarcity & Social Proof
- **High Interest Scarcity Banner**: Triggers automatically when stock is low (<5), displaying "neighbors watching this item" to drive organic urgency.
- **Live Activity Toasts**: Periodic notifications of "Recent Studio Sales" to reinforce the live, competitive nature of the marketplace.
- **"Sarah's Pick" Curation**: Visual badges for curated favorites, allowing the AI to leverage passion and design stories to justify price firmness.

### 7.4 Psychological Grounding
- **Deliberation Delays**: Simulated 1.5-second "thinking pauses" and status updates (e.g., *"Sarah is checking the workbench..."*) to mirror human deliberation.
- **Returning Neighbor Recognition**: Personalized greetings and "Loyalty Bonuses" for repeat customers, leveraging interpersonal history to drive retention.
- **"The Owner Shadow"**: Negotiation tactics that imply checking with the shop owner to make deep discounts feel exclusive and manually approved.
