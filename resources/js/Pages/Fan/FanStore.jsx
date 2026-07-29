import React, { useState } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, Link } from '@inertiajs/react';
import { toast } from 'sonner';
import AdPlaceholder from '@/Components/Common/AdPlaceholder';
import DashboardHero from '@/Components/Common/DashboardHero';

export default function FanStore({ auth, products, categories }) {
    const [activeCategory, setActiveCategory] = useState('All');
    const [cart, setCart] = useState([]);

    const filteredProducts = activeCategory === 'All' 
        ? products 
        : products.filter(p => p.category === activeCategory);

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => 
                    item.id === product.id 
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <FanLayout title="Fan Store">
            {/* Hero Section */}
            <DashboardHero role="fan" 
                title="Fan Store"
                subtitle="Official World Cup 2026 merchandise and fan gear"
                breadcrumbs={[{ label: 'Store' }]}
                bgImage="/assets/img/fan/backgrounds/gaming_hero.png"
            />

            {/* Ad Placeholder */}
            <div className="mb-4">
                <AdPlaceholder position="horizontal" />
            </div>

            {/* Summary Cards */}
            <div className="summary-cards-grid">
                <div className="fan-card-premium glow-red">
                    <div className="card-content-gaming">
                        <div className="card-icon-gaming" style={{ color: '#ff2d55' }}>
                            <i className="fas fa-tshirt"></i>
                        </div>
                        <h3 className="card-title-gaming">Products</h3>
                        <div className="card-value-gaming">{products.length}</div>
                        <div className="text-white-50 small mt-1">Available items</div>
                    </div>
                </div>
                
                <div className="fan-card-premium glow-blue">
                    <div className="card-content-gaming">
                        <div className="card-icon-gaming" style={{ color: '#00d2ff' }}>
                            <i className="fas fa-tags"></i>
                        </div>
                        <h3 className="card-title-gaming">Categories</h3>
                        <div className="card-value-gaming">{categories.length - 1}</div>
                        <div className="text-white-50 small mt-1">Shop by type</div>
                    </div>
                </div>
                
                <div className="fan-card-premium glow-red">
                    <div className="card-content-gaming">
                        <div className="card-icon-gaming" style={{ color: '#ff2d55' }}>
                            <i className="fas fa-shopping-cart"></i>
                        </div>
                        <h3 className="card-title-gaming">Cart Items</h3>
                        <div className="card-value-gaming">{cartCount}</div>
                        <div className="text-white-50 small mt-1">KES {new Intl.NumberFormat().format(cartTotal)}</div>
                    </div>
                </div>
                
                <div className="fan-card-premium glow-blue">
                    <div className="card-content-gaming">
                        <div className="card-icon-gaming" style={{ color: '#00d2ff' }}>
                            <i className="fas fa-percent"></i>
                        </div>
                        <h3 className="card-title-gaming">Fan Discount</h3>
                        <div className="card-value-gaming">20% OFF</div>
                        <div className="text-white-50 small mt-1">Members only</div>
                    </div>
                </div>
            </div>

            {/* Category Filter */}
            <div className="content-card mt-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        <i className="fas fa-store"></i>
                        <h3>Shop Products</h3>
                    </div>
                    <div className="d-flex gap-2">
                        {categories.map(cat => (
                            <button 
                                key={cat}
                                className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Grid */}
                <div className="row g-4 p-3">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="col-md-6 col-lg-4">
                            <div className="card bg-dark border-secondary h-100">
                                <div className="card-img-top bg-secondary d-flex align-items-center justify-content-center" style={{height: '180px'}}>
                                    <i className="fas fa-image fa-3x text-white-50"></i>
                                </div>
                                <div className="card-body">
                                    <span className="badge bg-secondary mb-2">{product.category}</span>
                                    <h5 className="card-title text-white">{product.name}</h5>
                                    <p className="card-text text-white-50 small">{product.description}</p>
                                    <div className="d-flex justify-content-between align-items-center mt-3">
                                        <span className="h5 mb-0 text-danger">KES {new Intl.NumberFormat().format(product.price)}</span>
                                        {product.in_stock ? (
                                            <button 
                                                className="btn btn-primary btn-sm"
                                                onClick={() => addToCart(product)}
                                            >
                                                <i className="fas fa-cart-plus me-1"></i> Add
                                            </button>
                                        ) : (
                                            <span className="badge bg-warning text-dark">Out of Stock</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-5">
                        <i className="fas fa-box-open fa-3x text-white-50 mb-3"></i>
                        <h4 className="text-white">No products in this category</h4>
                        <p className="text-white-50">Check out other categories for more items</p>
                    </div>
                )}
            </div>

            {/* Cart Summary (if items in cart) */}
            {cart.length > 0 && (
                <div className="content-card mt-4">
                    <div className="card-header">
                        <i className="fas fa-shopping-cart"></i>
                        <h3>Your Cart ({cartCount} items)</h3>
                    </div>
                    <div className="p-3">
                        {cart.map(item => (
                            <div key={item.id} className="d-flex justify-content-between align-items-center py-2 border-bottom border-secondary">
                                <div>
                                    <span className="text-white">{item.name}</span>
                                    <span className="text-white-50 ms-2">x{item.quantity}</span>
                                </div>
                                <span className="text-danger">KES {new Intl.NumberFormat().format(item.price * item.quantity)}</span>
                            </div>
                        ))}
                        <div className="d-flex justify-content-between align-items-center pt-3">
                            <span className="h5 text-white mb-0">Total</span>
                            <span className="h4 text-danger mb-0">KES {new Intl.NumberFormat().format(cartTotal)}</span>
                        </div>
                        <button className="btn btn-primary w-100 mt-3" onClick={() => toast.info('Checkout coming soon!')}>
                            <i className="fas fa-credit-card me-2"></i>Proceed to Checkout
                        </button>
                    </div>
                </div>
            )}
        </FanLayout>
    );
}
