# Day 2 Operations: Extending the Engine

Once you have initialized the ShopMore engine, use this guide to perform common development and operational tasks.

## 🏗 Building New Features

When adding new capabilities, follow the **Joy-Zoning Workflow**:

1. **Domain**: Define your models in `src/domain/models.ts` and rules in `src/domain/rules.ts`.
2. **Infrastructure**: If new storage is required, update `src/infrastructure/sqlite/schema.ts` and create a repository in `src/infrastructure/repositories/sqlite/`.
3. **Core**: Create or update a service in `src/core/` to orchestrate the new logic. Wire it into `src/core/container.ts`.
4. **API**: Create a Next.js route in `src/app/api/` to expose the service.
5. **UI**: Build the interface in `src/ui/pages/` using the shared components in `src/ui/components/admin/`.

## 🗄 Database Management

ShopMore uses SQLite for sovereign data management.

- **Migrations**: New tables should be added to `src/infrastructure/sqlite/database.ts` within the `initDatabase` or `applyMigrations` logic.
- **Seeding**: Update `src/infrastructure/services/SeedDataLoader.ts` to include mock data for new features.
- **Backups**: Simply copy the `playmore.db` file. For production, use a tool like `litestream` for real-time replication.

## 🔐 Security & Permissions

- **Adding Admin Routes**: Always wrap your page components in `AdminLayout` and protect your API routes with `requireAdminSession()`.
- **Rate Limiting**: If you add a new public mutation, add a rate-limit bucket in `src/infrastructure/server/apiGuards.ts`.
- **Secrets**: Never hardcode secrets. Use `.env` and access them via `process.env`.

## 📈 Monitoring & Maintenance

- **Audit Logs**: Inspect the `AuditService` logs for sensitive merchant operations.
- **Linting**: Run `npm run lint` before every commit to maintain the industrial code standard.
- **Build Verification**: Run `npm run build` locally to catch Next.js CSR/SSR boundary issues before deployment.

---

## Useful Shortcuts
- **Cmd+K**: Open the Admin Command Palette.
- **npm run setup**: Reset and re-initialize the workspace.
- **npm run dev**: Launch the development engine.
