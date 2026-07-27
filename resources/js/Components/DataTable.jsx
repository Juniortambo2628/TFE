import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table"
import { cn } from "@/lib/utils"

export default function DataTable({
  columns,
  data,
  search = "",
  onRowClick,
  className,
}) {
  const [sorting, setSorting] = React.useState([])
  const [globalFilter, setGlobalFilter] = React.useState(search)

  React.useEffect(() => {
    setGlobalFilter(search)
  }, [search])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  })

  return (
    <div className={cn("admin-card-dark p-0 overflow-hidden", className)}>
      <Table className="admin-table-dark">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead 
                    key={header.id}
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    className={cn(
                        header.column.getCanSort() && "cursor-pointer select-none hover:text-white transition-colors"
                    )}
                  >
                    <div className="d-flex align-items-center gap-2">
                        {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                            )}
                        {header.column.getCanSort() && (
                            <i className={cn(
                                "fas font-xs",
                                header.column.getIsSorted() === "asc" ? "fa-sort-up" : 
                                header.column.getIsSorted() === "desc" ? "fa-sort-down" : 
                                "fa-sort opacity-25"
                            )}></i>
                        )}
                    </div>
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                onClick={() => onRowClick?.(row.original)}
                className={cn(onRowClick && "cursor-pointer hover:bg-white/5 transition-colors")}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <div className="admin-empty-state py-5">
                    <i className="fas fa-folder-open mb-3 opacity-25" style={{ fontSize: '2rem' }}></i>
                    <h4 className="text-white opacity-50">No results found</h4>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
