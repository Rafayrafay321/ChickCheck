# Project Workspace Guidelines & Memory

## Primary Project Documentation
For full architectural details, business logic formulas, and database schema, refer to:
[PROJECT_SPECIFICATION.md](file:///c:/Users/Administrator/Desktop/BackendDev/ChickCheck/ChickCheck/PROJECT_SPECIFICATION.md)

## Key Technical Rules:
1. **Stack**: Next.js (App Router), TypeScript, Tailwind CSS v4, SQLite via Prisma ORM v7 (`@prisma/adapter-libsql`).
2. **Styling**: Always use pure **Tailwind CSS v4** utility classes (`@import "tailwindcss";`). Do NOT use inline `style={{ ... }}` objects.
3. **Architecture**: Maintain 4-layer separation of concerns:
   - Data Access Hooks (`src/hooks/`)
   - Reusable Atomic UI (`src/components/ui/`)
   - Specialized Forms (`src/components/<feature>/`)
   - Pages & Layouts (`src/app/(dashboard)/`)
4. **Business Calculations**:
   - `Supply Rate = Farm Rate + Supplier Premium (Default: 4 PKR)`
   - `Net Weight = Gross Weight - Dud Weight`
   - `Selling Price = Supply Rate * Product/Customer Multiplier`
