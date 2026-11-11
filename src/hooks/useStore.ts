"use client";

import { useEffect, useState, useCallback } from "react";
import { setActiveDatabase, clearLegacyLocalDatabase } from "@/lib/db";
import type { Database } from "@/data/database";

/**
 * Holds the published catalog in memory. Nothing is written to localStorage.
 * The catalog itself comes from src/data/database.ts (published to GitHub
 * from the admin panel and rebuilt by Vercel).
 */
export function useStore(initialDb: Database) {
  const [db, setDb] = useState<Database>(initialDb);
  setActiveDatabase(db);

  useEffect(() => {
    clearLegacyLocalDatabase();
  }, []);

  const update = useCallback((updater: (prev: Database) => Database) => {
    setDb((prev) => updater(prev));
  }, []);

  return { db, update, setDb };
}
