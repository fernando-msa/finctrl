import { useState } from "react";

type FilterFn<T> = (item: T, values: Record<string, string>) => boolean;

export function useListFilters<T>(filterFns: Record<string, FilterFn<T>>) {
  const keys = Object.keys(filterFns);
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const k of keys) v[k] = "";
    return v;
  });

  function applyFilters(items: T[]): T[] {
    const hasActive = Object.values(filterValues).some((v) => v.trim() !== "");
    if (!hasActive) return items;
    return items.filter((item) => {
      for (const [key, fn] of Object.entries(filterFns)) {
        if (filterValues[key]?.trim() && !fn(item, filterValues)) return false;
      }
      return true;
    });
  }

  return { filterValues, setFilterValues, applyFilters };
}
