import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useLibraryCount(userId: string | null) {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { count: libraryCount, error } = await supabase
        .from("user_libraries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (error) throw error;
      setCount(libraryCount || 0);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch library count:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [userId]);

  return { count, isLoading, error, refetch, isFull: count >= 10 };
}
