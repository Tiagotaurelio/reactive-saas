"use client";

import { useEffect, useState } from "react";

import { createSeedState, deriveSnapshot, ReactiveSnapshot } from "@/lib/reactive-domain";

export function useReactiveSnapshot(): {
  snapshot: ReactiveSnapshot;
  isLoading: boolean;
  error: string | null;
} {
  const [snapshot, setSnapshot] = useState<ReactiveSnapshot>(() => deriveSnapshot(createSeedState()));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadSnapshot = async () => {
      if (isActive) {
        setIsLoading(true);
        setError(null);
      }

      const response = await fetch("/api/reactive/snapshot", { cache: "no-store" });
      if (!response.ok) {
        if (isActive) {
          setError("Nao foi possivel carregar o snapshot operacional agora.");
          setIsLoading(false);
        }
        return;
      }
      const nextSnapshot = (await response.json()) as ReactiveSnapshot;

      if (isActive) {
        setSnapshot(nextSnapshot);
        setIsLoading(false);
      }
    };

    void loadSnapshot();

    const handleRefresh = () => {
      void loadSnapshot();
    };

    window.addEventListener("reactive-store-updated", handleRefresh);

    return () => {
      isActive = false;
      window.removeEventListener("reactive-store-updated", handleRefresh);
    };
  }, []);

  return {
    snapshot,
    isLoading,
    error
  };
}
