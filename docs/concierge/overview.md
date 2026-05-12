# DreamBees Concierge — Technical & Operational Overview

## Introduction
The DreamBees Concierge is an industrialized customer support and sales assistance system designed for premium ecommerce environments. It focuses on **Operational Truth**, **Team Collaboration**, and **Invisible AI** to provide a calm and effective support experience.

---

## 🏗️ Architecture Summary

### 1. Storefront Bubble (`/src/ui/components/Concierge/ConciergeBubble.tsx`)
- **Purpose**: Customer-facing entry point.
- **Key Logic**: Reconnection handling, session syncing, quick conversion triggers (Sizing/Returns).
- **Aesthetics**: Premium, calm design with high-fidelity micro-interactions.

### 2. Admin Workspace (`/src/ui/pages/admin/AdminConciergeInsights.tsx`)
- **Purpose**: Operational command center for support teams.
- **Key Logic**: Triage, outcome tracking, team assignment, and strategic digests.
- **Workflow**: Linear-grade scanability with evidence-backed findings.

### 3. Intelligence Engine (`/src/core/ConciergeService.ts`)
- **Purpose**: Analysis, memory injection, and truth extraction.
- **Logic**: Forensic grounding, uncertainty detection, and pattern recognition.

---

## 🛠️ Key Capabilities

### 🛡️ Trust Infrastructure
- **Facts vs. Assumptions**: Clearly distinguishes explicit customer statements from AI interpretations.
- **Grounding Evidence**: Every suggestion is backed by direct quotes from the conversation transcript.
- **Uncertainty Notes**: Explains why the system might be unsure, preventing overconfident errors.

### 🤝 Team Collaboration
- **Assignment**: Formal ownership of customer sessions.
- **Activity Feed**: Real-time audit trail of all support actions.
- **Internal Notes**: Context-rich handoffs between team members.

### 📈 Operational Intelligence
- **Outcome Tracking**: Measures resolution, escalation, and conversion rates.
- **Operational Digest**: Natural-language summaries of store health (e.g., *"Shipping anxiety trending up on plushie pages"*).
- **Operator Feedback**: Suggestion accuracy tracking through "Helpful/Not Useful" loops.

---

## 📊 Data Schema (Firestore)

| Field | Type | Description |
| :--- | :--- | :--- |
| `status` | `string` | active, resolved, analyzed, failed |
| `customerOutcome` | `string` | resolved, escalated, abandoned, converted |
| `assignedOperator` | `string` | Operator ID or name |
| `isRepeatIssue` | `boolean` | Flag for returning concerns |
| `events` | `array` | Activity feed audit trail |
| `operatorFeedback` | `array` | Accuracy tracking for AI suggestions |

---

## 🚀 Reliability & Resilience
- **Offline Resilience**: Built-in reconnection logic and status indicators.
- **Session Syncing**: Automatic state restoration across devices/reloads.
- **Failure Recovery**: Graceful handling of interrupted analysis passes.

---

## 🎯 Success Criteria
1. **Faster Triage**: Reduce time to first human action through high-fidelity summaries.
2. **Reduced Burden**: Increase autonomous resolution of common queries.
3. **Higher Conversion**: Assist customers at critical checkout hurdles (Sizing/Shipping).
4. **Team Trust**: High adoption of AI-suggested fixes.
