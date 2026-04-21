import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
    fetchVendorProducts, 
    fetchSamagriCategories, 
    createVendorProduct, 
    updateVendorProduct, 
    deleteVendorProduct,
    type SamagriItem,
    type SamagriCategory
} from "@/lib/api";
import { 
    Pencil, 
    Plus, 
    Trash2, 
    Package,
    Search,
    AlertCircle,
    CheckCircle2,
    Clock,
    X,
    Loader2,
    ImageIcon
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTablePagination } from "@/components/common/DataTablePagination";
import { ActionConfirmationDialog } from "@/components/common/ActionConfirmationDialog";

export default function VendorProducts() {
  const [items, setItems] = useState<SamagriItem[]>([]);
  const [categories, setCategories] = useState<SamagriCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SamagriItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [form, setForm] = useState<{
      name: string;
      description: string;
      price: string;
      stock_quantity: string;
      category: string;
      unit: string;
      image: File | null;
  }>({
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    category: "",
    unit: "pcs",
    image: null,
  });

  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsData, catsData] = await Promise.all([
          fetchVendorProducts(),
          fetchSamagriCategories()
      ]);
      setItems(itemsData);
      setCategories(catsData);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load your products.", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (e.target.type === "file") {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
            setForm((prev) => ({ ...prev, image: files[0] }));
        }
    } else {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEdit = (item: SamagriItem) => {
      setEditingItem(item);
      setForm({
          name: item.name,
          description: item.description || "",
          price: item.price.toString(),
          stock_quantity: item.stock_quantity.toString(),
          category: item.category ? item.category.toString() : "",
          unit: item.unit || "pcs",
          image: null 
      });
      setIsDialogOpen(true);
  };
  
  const handleDelete = async () => {
      if (!itemToDelete) return;
      setIsDeleting(true);
      try {
          await deleteVendorProduct(itemToDelete);
          toast({ title: "Success", description: "Product deleted." });
          loadData();
          setItemToDelete(null);
      } catch (err: any) {
          toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" });
      } finally {
          setIsDeleting(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("price", form.price);
    formData.append("stock_quantity", form.stock_quantity);
    formData.append("category", form.category);
    formData.append("unit", form.unit);
    
    if (form.image) {
        formData.append("image", form.image);
    }
    
    // Explicitly append is_active so DRF doesn't parse missing property as False
    if (editingItem) {
        formData.append("is_active", (editingItem as any).is_active !== undefined ? String((editingItem as any).is_active) : "true");
    } else {
        formData.append("is_active", "true");
    }

    try {
      if (editingItem) {
          await updateVendorProduct(editingItem.id, formData);
          toast({ title: "Success", description: "Product updated and sent for re-approval." });
      } else {
          await createVendorProduct(formData);
          toast({ title: "Success", description: "Product created and sent for approval." });
      }
      setIsDialogOpen(false);
      setEditingItem(null);
      setForm({ name: "", description: "", price: "", stock_quantity: "", category: "", unit: "pcs", image: null });
      loadData();
    } catch (err: any) {
      toast({ title: "Error", description: "Operation failed. Please check form data.", variant: "destructive" });
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout userRole="vendor">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight dark:text-gray-100">My Products</h1>
            <p className="text-muted-foreground">Manage your samagri inventory and status</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-100" onClick={() => { setEditingItem(null); setForm({ name: "", description: "", price: "", stock_quantity: "", category: "", unit: "pcs", image: null }); }}>
                <Plus className="mr-2 h-4 w-4" /> Add New Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Product" : "Add New Product"}</DialogTitle>
                <DialogDescription>
                  Enter details for your puja product. Note: New products or changes require Admin approval.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Product Name *</label>
                    <Input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Pure Cow Ghee" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category *</label>
                    <select 
                        name="category" 
                        value={form.category} 
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        required
                    >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price (NPR) *</label>
                    <Input name="price" value={form.price} onChange={handleChange} placeholder="500" required type="number" min="0" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stock Qty *</label>
                    <Input name="stock_quantity" value={form.stock_quantity} onChange={handleChange} placeholder="10" required type="number" min="0" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unit</label>
                    <Input name="unit" value={form.unit} onChange={handleChange} placeholder="kg, pcs, ltr" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Image</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-orange-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {form.image ? (
                        <p className="text-sm text-orange-600 font-medium">{form.image.name}</p>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 mb-4 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        </>
                      )}
                    </div>
                    <Input name="image" type="file" onChange={handleChange} accept="image/*" className="hidden" />
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea 
                    name="description" 
                    value={form.description} 
                    onChange={handleChange} 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Describe the product features, quality, etc."
                  />
                </div>
                
                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                  {editingItem ? "Update Product" : "Submit for Approval"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters and Search */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="pl-9 dark:bg-gray-800 dark:border-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card className="border-none shadow-sm bg-card/50 dark:bg-gray-900/50 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                <p className="text-sm text-muted-foreground">Loading your inventory...</p>
              </div>
            ) : (
              <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                      <TableRow>
                          <TableCell colSpan={7} className="text-center py-20">
                            <div className="flex flex-col items-center gap-2">
                              <Package className="h-12 w-12 text-muted-foreground/30" />
                              <p className="text-lg font-medium text-muted-foreground">No products found</p>
                              <p className="text-sm text-muted-foreground/60">Start by adding your first product for sale.</p>
                            </div>
                          </TableCell>
                      </TableRow>
                  ) : (
                    filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                      <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors">
                          <TableCell>
                              {item.image ? (
                                  <img src={item.image} alt={item.name} className="h-10 w-10 object-cover rounded-lg border shadow-sm" />
                              ) : (
                                  <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center text-[10px] text-muted-foreground border">No Img</div>
                              )}
                          </TableCell>
                          <TableCell className="font-semibold text-gray-800 dark:text-gray-200">{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {categories.find(c => c.id === item.category)?.name || 'Uncategorized'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-orange-600">Rs. {item.price}</TableCell>
                          <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${item.stock_quantity < 5 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                                <span className={item.stock_quantity < 5 ? "text-red-600 font-bold" : "text-gray-700"}>
                                    {item.stock_quantity} {item.unit}
                                </span>
                              </div>
                          </TableCell>
                          <TableCell>
                            {/* Correctly show the actual visibility state of the item */}
                            {!(item as any).is_active ? (
                              <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
                                <AlertCircle className="mr-1 h-3 w-3" /> Hidden
                              </Badge>
                            ) : (item as any).is_approved ? (
                              <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Live
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50">
                                <Clock className="mr-1 h-3 w-3" /> Pending Review
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                              <div className="flex justify-end gap-1 opacity-10 md:opacity-100 group-hover:opacity-100 transition-opacity">
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              className="h-9 w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                              onClick={() => handleEdit(item)}
                                          >
                                              <Pencil className="h-4 w-4" />
                                          </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Edit Product</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                              onClick={() => setItemToDelete(item.id)}
                                          >
                                              <Trash2 className="h-4 w-4" />
                                          </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Delete Product</TooltipContent>
                                  </Tooltip>
                              </div>
                          </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="p-4 border-t flex justify-center">
                  <DataTablePagination 
                      currentPage={currentPage}
                      totalPages={Math.ceil(filteredItems.length / itemsPerPage)}
                      onPageChange={setCurrentPage}
                  />
              </div>
              </TooltipProvider>
            )}
          </CardContent>
        </Card>
        
        {/* Help Tip */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 rounded-xl border border-blue-100 dark:border-blue-900/30">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-bold">Important Information:</p>
            <p className="mt-1 opacity-90">
              Any changes to product name, price or images will temporarily hide the product from the shop until an Administrator approves the changes to ensure catalog quality.
            </p>
          </div>
        </div>

        <ActionConfirmationDialog
            open={itemToDelete !== null}
            onOpenChange={(open) => !open && setItemToDelete(null)}
            onConfirm={handleDelete}
            title="Delete Product?"
            description="This action cannot be undone. The product will be permanently removed from your inventory and the shop."
            confirmLabel="Delete Product"
            cancelLabel="Keep Product"
            isDestructive={true}
            isLoading={isDeleting}
        />
      </div>
    </DashboardLayout>
  );
}
