"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

/** Loads GET `path` on mount (and when `path` changes). Call reload() to refetch. */
export function useFetch<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!!path);

  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError("");
    try {
      setData(await api<T>(path));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load };
}

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");
