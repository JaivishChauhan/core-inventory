"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, Boxes, MoreHorizontal, Package, Pencil, Search, Trash2, Warehouse } from "lucide-react"

import { CreateProductSheet } from "@/components/products/create-product-sheet"
import { EditProductSheet } from "@/components/products/edit-product-sheet"
import { DeleteProductDialog } from "@/components/products/delete-product-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDebounce } from "@/hooks/use-debounce"
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants"

type ProductLocation = {
  locationId: string
  locationName: string
  warehouseId: string
  warehouseName: string
  available: number
}

type Product = {
  id: string
  name: string
  sku: string
  category: string
  unitOfMeasure: string
  reorderPoint: number
  totalAvailable: number
  isLowStock: boolean
  isOutOfStock: boolean
  locationBreakdown: ProductLocation[]
}

type ProductsResponse = {
  products: Product[]
}

type StockStateFilter = "all" | "healthy" | "low" | "out"

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string
  value: number
  description: string
}) {
  return (
    <Card className="card-hover border-border/60 shadow-soft">
      <CardContent className="space-y-2 p-5">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-3xl font-extrabold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function ProductsPage() {
  const [searchInput, setSearchInput] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [stockFilter, setStockFilter] = useState<StockStateFilter>("all")
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS)

  const { data, isLoading, isError } = useQuery<ProductsResponse>({
    queryKey: ["products"],
    queryFn: () => fetch("/api/products").then((r) => r.json() as Promise<ProductsResponse>),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const products = useMemo(() => data?.products ?? [], [data?.products])
  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))].sort(),
    [products]
  )

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        debouncedSearch.length === 0 ||
        product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        product.sku.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        product.category.toLowerCase().includes(debouncedSearch.toLowerCase())

      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "healthy" &&
          !product.isLowStock &&
          !product.isOutOfStock) ||
        (stockFilter === "low" && product.isLowStock) ||
        (stockFilter === "out" && product.isOutOfStock)

      return matchesSearch && matchesCategory && matchesStock
    })
  }, [categoryFilter, debouncedSearch, products, stockFilter])

  const summary = useMemo(
    () => ({
      totalCatalog: products.length,
      inStock: products.filter((product) => product.totalAvailable > 0).length,
      lowStock: products.filter((product) => product.isLowStock).length,
      outOfStock: products.filter((product) => product.isOutOfStock).length,
    }),
    [products]
  )

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            <span className="text-gradient">Product Catalog</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Manage catalog records, monitor low-stock thresholds, and see exactly
            where inventory is available across your warehouses.
          </p>
        </div>
        <CreateProductSheet />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Catalog Items"
          value={summary.totalCatalog}
          description="Total products configured in the system"
        />
        <SummaryCard
          title="In Stock"
          value={summary.inStock}
          description="Products currently available in at least one location"
        />
        <SummaryCard
          title="Low Stock"
          value={summary.lowStock}
          description="Products at or below their reorder rule"
        />
        <SummaryCard
          title="Out of Stock"
          value={summary.outOfStock}
          description="Products with no available inventory"
        />
      </div>

      <Card className="border-border/60 shadow-soft">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="product-search"
                type="search"
                placeholder="Search name, SKU, or category..."
                className="pl-9"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-[220px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={stockFilter}
              onValueChange={(value) => setStockFilter(value as StockStateFilter)}
            >
              <SelectTrigger className="w-full lg:w-[220px]">
                <SelectValue placeholder="Filter by stock health" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock States</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table className="data-dense">
            <TableHeader>
              <TableRow className="border-border/50 bg-muted/20">
                <TableHead className="pl-6">SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead>Location Availability</TableHead>
                <TableHead className="pr-6 text-right">Reordering</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={index} className="border-border/50">
                    {Array.from({ length: 8 }).map((__, cellIndex) => (
                      <TableCell key={cellIndex} className={cellIndex === 0 ? "pl-6" : ""}>
                        <Skeleton className="h-4 w-full max-w-[10rem]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center text-destructive">
                    Failed to load products. Please refresh the page.
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                      <Package className="size-10 text-muted-foreground/40" />
                      <p className="font-medium text-muted-foreground">
                        {debouncedSearch || categoryFilter !== "all" || stockFilter !== "all"
                          ? "No products match the current filters."
                          : "No products yet"}
                      </p>
                      <p className="text-sm text-muted-foreground/60">
                        Create a product to start tracking inventory by location.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    className="border-border/50 align-top transition-colors hover:bg-muted/20"
                  >
                    <TableCell className="pl-6">
                      <Badge
                        variant="secondary"
                        className="rounded-md font-mono text-[11px] tracking-wider"
                      >
                        {product.sku}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Reorder point: {product.reorderPoint}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.category}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.unitOfMeasure}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono text-base font-semibold">
                          {product.totalAvailable}
                        </span>
                        {product.isOutOfStock ? (
                          <Badge variant="destructive">Out</Badge>
                        ) : product.isLowStock ? (
                          <Badge variant="warning">Low</Badge>
                        ) : (
                          <Badge variant="success">Healthy</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.locationBreakdown.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {product.locationBreakdown.map((location) => (
                            <div
                              key={location.locationId}
                              className="rounded-xl border border-border/60 bg-background px-3 py-2 shadow-sm"
                            >
                              <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                                <Warehouse className="size-3" />
                                {location.warehouseName}
                              </div>
                              <p className="mt-1 text-sm font-semibold">
                                {location.locationName}
                              </p>
                              <p className="font-mono text-xs text-muted-foreground">
                                {location.available} available
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Boxes className="size-4" />
                          No inventory posted yet
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {product.isOutOfStock ? (
                        <div className="inline-flex items-center gap-1 text-sm font-semibold text-destructive">
                          <AlertTriangle className="size-4" />
                          Reorder now
                        </div>
                      ) : product.isLowStock ? (
                        <Badge variant="warning" className="justify-end">
                          At threshold
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Healthy</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="size-8 p-0">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <EditProductSheet
                            product={product}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Pencil className="mr-2 size-3.5" />
                                Edit Product
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuSeparator />
                          <DeleteProductDialog
                            productId={product.id}
                            productName={product.name}
                            sku={product.sku}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 size-3.5" />
                                Delete Product
                              </DropdownMenuItem>
                            }
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
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
