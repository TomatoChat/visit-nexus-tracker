import React from 'react';
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export function TableSkeleton({ rows = 5, columns = 4, className }: TableSkeletonProps) {
  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} scope="col" className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Skeleton className="h-6 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-muted/50">
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <td key={colIndex} className="px-6 py-6 whitespace-nowrap text-sm text-muted-foreground">
                      <Skeleton className="h-6 w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
} 