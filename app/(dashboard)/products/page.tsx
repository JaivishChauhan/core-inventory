"use client"

import { useQuery } from "@tanstack/react-query"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { CreateProductSheet } from "@/components/products/create-product-sheet"
import { useState, useMemo } from "react"
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants"
import { useDebounce } from "@/hooks/use-debounce"
import type { Metadata } from "next"

type Product = {
  id: string
  name: string
  sku: string
  category: string
  unit_of_measure: string
  reorder_point: number
  created_at: string
}

/**
 * ProductsPage — Master catalog view with search and CRUD.
 * "use client" is required for React Query (data fetching) and search state.
 * FRD §5: High data-density table with slide-over form for creation.
 */
export default function ProductsPage() {
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS)

  const { data, isLoading, isError } = useQuery<{ products: Product[] }>({
    queryKey: ["products"],
    queryFn: () => fetch("/api/products").then((r) => r.json()),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const filteredProducts = useMemo(() => {
    if (!data?.products) return []
    const q = debouncedSearch.toLowerCase()
    if (!q) return data.products
    return data.products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    )
  }, [data, debouncedSearch])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            <span className="text-gradient">Product Catalog</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all inventory items. Stock levels calculated from the ledger.
          </p>
        </div>
        <CreateProductSheet />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="product-search"
          type="search"
          placeholder="Search name, SKU, or category…"
          className="pl-9"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card className="border-border/50 shadow-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 bg-muted/30">
                <TableHead className="pl-6">SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right pr-6">Reorder Point</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border/50">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j} className={j === 0 ? "pl-6" : ""}>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-destructive">
                    Failed to load products. Please refresh.
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                      <Package className="size-10 text-muted-foreground/40" />
                      <p className="font-medium text-muted-foreground">
                        {debouncedSearch
                          ? `No products matching "${debouncedSearch}"`
                          : "No products yet"}
                      </p>
                      <p className="text-sm text-muted-foreground/60">
                        {!debouncedSearch &&
                          "Click \"New Product\" to add your first item."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    className="border-border/50 transition-colors hover:bg-muted/20"
                  >
                    <TableCell className="pl-6">
                      <Badge
                        variant="secondary"
                        className="rounded-md font-mono text-xs tracking-wider"
                      >
                        {product.sku}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.category}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.unit_of_measure}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <span className="font-mono text-sm">{product.reorder_point}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
