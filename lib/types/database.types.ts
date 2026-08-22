// Placeholder until the schema lands in Phase 2 of the build order.
// Regenerate for real with:
//   npx supabase gen types typescript --project-id <ref> > lib/types/database.types.ts
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
