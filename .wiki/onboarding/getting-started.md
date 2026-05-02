# Getting Started with ShopMore

This guide provides the definitive onboarding path for developers and merchants initializing the ShopMore engine.

## 🛠 System Prerequisites

- **Node.js**: `v20.x` or higher (Long Term Support recommended).
- **Architecture**: Native build tools are required for `better-sqlite3`. If you encounter ABI errors after a Node version change, run `npm rebuild better-sqlite3`.
- **Operating System**: macOS, Linux, or WSL2.

---

## 🚀 The One-Command Setup

The most efficient way to initialize your workspace is through the integrated setup utility:

```bash
npm run setup
```

This command orchestrates the following industrial operations:
1. **Environment Verification**: Confirms Node.js compatibility.
2. **Sovereign Environment**: Copies `.env.example` to `.env` and generates a high-entropy `SESSION_SECRET`.
3. **Dependency Saturation**: Executes `npm install` to populate the workspace.
4. **Substrate Seeding**: Initializes the SQLite database with baseline TCG product metadata.

---

## 🛡 Security Guardrails

Before transitioning to a production environment, verify the following security parameters:

| Parameter | Constraint | Rationale |
| :--- | :--- | :--- |
| `SESSION_SECRET` | 32+ Characters | Prevents session hijacking and HMAC bypass. |
| `ALLOW_PRODUCTION_SEEDING` | `false` | Prevents accidental data wipes in live environments. |
| `HTTP-Only Cookies` | Enabled | Mitigates XSS-based session theft (enforced in `session.ts`). |
| `CSRF Protection` | Origin Matching | Enforced via `assertTrustedMutationOrigin` in `apiGuards.ts`. |

---

## 🧭 Navigating the Engine

Once initialized, inspect these core architectural entry points:

- **Domain Integrity**: `src/domain/models.ts` (Business logic contracts).
- **Service Orchestration**: `src/core/container.ts` (Dependency injection).
- **Infrastructure Adapters**: `src/infrastructure/server/services.ts`.
- **Client Facade**: `src/ui/apiClientServices.ts` (Type-safe UI-to-API bridge).

---

## 🚨 Verification Commands

Use these commands to ensure your workspace is structurally sound:

```bash
# Verify type safety and code quality
npm run lint

# Execute a full production-grade build
npm run build
```

For common issues, refer to the [Troubleshooting Guide](./troubleshooting.md).
