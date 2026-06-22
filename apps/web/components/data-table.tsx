"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/search-input";
import { EmptyState } from "@/components/empty-state";
import { LoadingSpinner } from "@/components/loading-spinner";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  keyExtractor: (item: T) => string | number;
  searchKeys?: string[];
  searchPlaceholder?: string;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
  headerActions?: React.ReactNode;
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  searchKeys = [],
  searchPlaceholder = "Search...",
  emptyIcon,
  emptyTitle = "No data found",
  emptyDescription = "There are no items to display.",
  emptyAction,
  isLoading = false,
  onRowClick,
  headerActions,
  className,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    if (!search || searchKeys.length === 0) return data;
    const lowerSearch = search.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        if (typeof value === "string") {
          return value.toLowerCase().includes(lowerSearch);
        }
        if (typeof value === "number") {
          return value.toString().includes(lowerSearch);
        }
        return false;
      })
    );
  }, [data, search, searchKeys]);

  return (
    <Card className={cn("overflow-hidden", className)}>
      {(searchKeys.length > 0 || headerActions) && (
        <div className="flex items-center justify-between gap-4 p-4 border-b">
          {searchKeys.length > 0 && (
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={searchPlaceholder}
              className="max-w-sm"
            />
          )}
          {headerActions && (
            <div className="flex items-center gap-2 ml-auto">{headerActions}</div>
          )}
        </div>
      )}
      {isLoading ? (
        <LoadingSpinner />
      ) : filteredData.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={search ? "No results found" : emptyTitle}
          description={
            search
              ? `No results matching "${search}"`
              : emptyDescription
          }
          action={search ? undefined : emptyAction}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={cn(onRowClick && "cursor-pointer")}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render
                      ? col.render(item)
                      : (item[col.key] as React.ReactNode) ?? "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
