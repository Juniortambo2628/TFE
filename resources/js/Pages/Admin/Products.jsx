import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import StatCard from '@/Components/Common/StatCard';
import { Head, router, useForm } from '@inertiajs/react';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import DashboardModal from '@/Components/Common/DashboardModal';
import FilePondUploader from '@/Components/Common/FilePondUploader';
import DataTable from '@/Components/DataTable';
import AdminInput from '@/Components/Admin/Form/AdminInput';
import { toast } from 'sonner';

export default function Products({ auth, products, stats }) {
    const [showForm, setShowForm] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [productToEdit, setProductToEdit] = useState(null);
    const [imageFiles, setImageFiles] = useState([]);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '',
        category: '',
        price: '',
        description: '',
        stock_quantity: '',
        in_stock: true,
        image: null,
    });

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Products' }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();

        if (productToEdit) {
            // For file uploads in Laravel PUT requests, we usually need to use POST with _method=PUT
            post(route('admin.products.update', productToEdit.id), {
                _method: 'PUT',
                onSuccess: () => closeModal(),
                forceFormData: true
            });
        } else {
            post(route('admin.products.store'), {
                onSuccess: () => closeModal(),
                forceFormData: true
            });
        }
    };

    const closeModal = () => {
        setShowForm(false);
        setProductToEdit(null);
        setImageFiles([]);
        reset();
    };

    const handleDelete = () => {
        if (productToDelete) {
            router.delete(route('admin.products.destroy', productToDelete), {
                onSuccess: () => {
                    toast.success('Product deleted');
                    setProductToDelete(null);
                }
            });
        }
    };

    const handleEdit = (product) => {
        setProductToEdit(product);
        setData({
            name: product.name || '',
            category: product.category || '',
            price: product.price || '',
            description: product.description || '',
            stock_quantity: product.stock_quantity || '',
            in_stock: product.in_stock ?? true,
            image: null,
        });
        setImageFiles([]);
        setShowForm(true);
    };

    const columns = [
        {
            accessorKey: "name",
            header: "Product",
            cell: ({ row }) => (
                <div className="d-flex align-items-center gap-3">
                    <div className="rounded overflow-hidden bg-dark" style={{ width: '40px', height: '40px' }}>
                        {row.original.image_url ? (
                            <img src={row.original.image_url} alt={row.original.name} className="w-100 h-100 object-fit-cover" />
                        ) : (
                            <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary">
                                <i className="fas fa-image"></i>
                            </div>
                        )}
                    </div>
                    <div className="text-white fw-medium">{row.original.name}</div>
                </div>
            )
        },
        {
            accessorKey: "category",
            header: "Category",
            cell: ({ row }) => <span className="text-white opacity-75">{row.original.category}</span>
        },
        {
            accessorKey: "price",
            header: "Price",
            cell: ({ row }) => <span className="text-blue-400 fw-semibold">KES {new Intl.NumberFormat().format(row.original.price)}</span>
        },
        {
            accessorKey: "stock_quantity",
            header: "Stock",
            cell: ({ row }) => <span className="text-white">{row.original.stock_quantity} units</span>
        },
        {
            accessorKey: "in_stock",
            header: "Status",
            cell: ({ row }) => (
                <span className={`admin-badge ${row.original.in_stock ? 'admin-badge-blue' : 'admin-badge-red'}`}>
                    {row.original.in_stock ? 'In Stock' : 'Out of Stock'}
                </span>
            )
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="d-flex gap-2">
                    <button className="btn-admin-icon" title="Edit" onClick={() => handleEdit(row.original)}>
                        <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn-admin-icon" title="Delete" onClick={() => setProductToDelete(row.original.id)}>
                        <i className="fas fa-trash text-danger"></i>
                    </button>
                </div>
            )
        }
    ];

    return (
        <AdminLayout title="Product Management">
            <Head title="Products" />
            <DashboardHero role="admin" 
                title="Product Management"
                subtitle="Manage your store inventory, jerseys, and accessories."
                breadcrumbs={breadcrumbs}
                action={{
                    label: "Add Product",
                    icon: "fas fa-plus me-2",
                    onClick: () => {
                        reset();
                        setProductToEdit(null);
                        setImageFiles([]);
                        setShowForm(true);
                    }
                }}
            />

            <div className="admin-visual-cards mb-4">
                <StatCard 
                    type="visual"
                    label="Total Items" 
                    value={stats.total} 
                    icon="fas fa-boxes"
                    bgType="events"
                    className="flex-grow-1"
                />
                <StatCard 
                    type="visual"
                    label="Out of Stock" 
                    value={stats.out_of_stock} 
                    icon="fas fa-exclamation-triangle"
                    bgType="dashboard"
                    className="flex-grow-1"
                />
                <StatCard 
                    type="visual"
                    label="Inventory Value" 
                    value={`KES ${new Intl.NumberFormat().format(stats.total_value)}`} 
                    icon="fas fa-coins"
                    bgType="payments"
                    className="flex-grow-1"
                />
            </div>

            <div className="admin-card-dark">
                <div className="card-header">
                    <h3><i className="fas fa-store me-2"></i> Inventory List</h3>
                    <span className="admin-badge admin-badge-gray">{products.data.length} items</span>
                </div>
                
                <div className="card-body p-0">
                    <DataTable 
                        columns={columns} 
                        data={products.data} 
                    />
                </div>
            </div>

            <DashboardModal
                open={showForm}
                onOpenChange={(open) => {
                    setShowForm(open);
                    if (!open) closeModal();
                }}
                title={productToEdit ? "Edit Product" : "Add New Product"}
                label="Store Management"
                tabs={[{ id: 'details', label: 'Product Details', icon: 'fas fa-info-circle' }]}
            >
                <form onSubmit={handleSubmit} className="p-4">
                    <div className="row g-3">
                        <div className="col-md-12">
                            <AdminInput
                                label="Product Name"
                                placeholder="e.g. Official Tournament Jersey"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                error={errors.name}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <AdminInput
                                label="Category"
                                placeholder="e.g. Apparel"
                                value={data.category}
                                onChange={e => setData('category', e.target.value)}
                                error={errors.category}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <AdminInput
                                label="Price (KES)"
                                type="number"
                                value={data.price}
                                onChange={e => setData('price', e.target.value)}
                                error={errors.price}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <AdminInput
                                label="Stock Quantity"
                                type="number"
                                value={data.stock_quantity}
                                onChange={e => setData('stock_quantity', e.target.value)}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <div className="admin-form-group">
                                <label className="form-label">Status</label>
                                <div className="form-check form-switch mt-2">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        id="inStockSwitch"
                                        checked={data.in_stock}
                                        onChange={e => setData('in_stock', e.target.checked)}
                                    />
                                    <label className="form-check-label text-white" htmlFor="inStockSwitch">
                                        {data.in_stock ? 'In Stock' : 'Out of Stock'}
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="admin-form-group">
                                <label className="form-label">Description</label>
                                <textarea 
                                    className="form-control" 
                                    rows={3}
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="admin-form-group">
                                <label className="form-label">Product Image</label>
                                <FilePondUploader 
                                    files={imageFiles}
                                    onUpdateFiles={(files) => {
                                        setImageFiles(files);
                                        if (files[0]) setData('image', files[0].file);
                                    }}
                                    labelIdle='Drag & Drop image or <span class="filepond--label-action">Browse</span>'
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 d-flex justify-content-end gap-2">
                        <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                        <button type="submit" className="btn-submit-modal" disabled={processing}>
                            {productToEdit ? 'Update Product' : 'Save Product'}
                        </button>
                    </div>
                </form>
            </DashboardModal>

            <ConfirmationDialog
                open={!!productToDelete}
                onOpenChange={(open) => !open && setProductToDelete(null)}
                title="Delete Product?"
                description="Are you sure you want to remove this product from the inventory?"
                onConfirm={handleDelete}
                confirmText="Delete"
                variant="destructive"
            />
        </AdminLayout>
    );
}
