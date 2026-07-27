document.addEventListener('DOMContentLoaded', function() {
    const productsContainer = document.getElementById('productsContainer');
    const cartBtn = document.getElementById('cartBtn');
    const cartCount = document.getElementById('cartCount');
    const cartModal = $('#cartModal'); // Using jQuery for Bootstrap modal
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalEl = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    let products = [];
    let cart = [];

    // Fetch Products
    fetch('/TFE/api/merch.php?action=products')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                products = data.products;
                renderProducts();
            } else {
                productsContainer.innerHTML = `<div class="col-12 text-danger">Error loading products: ${data.message}</div>`;
            }
        })
        .catch(error => console.error('Error:', error));

    function renderProducts() {
        if (products.length === 0) {
            productsContainer.innerHTML = '<div class="col-12 text-center">No products available.</div>';
            return;
        }

        let html = '';
        products.forEach(product => {
            html += `
                <div class="col-md-3 mb-4">
                    <div class="card h-100 product-card">
                        <img src="${product.image_url || 'assets/images/placeholder.jpg'}" class="card-img-top" alt="${product.name}" style="height: 200px; object-fit: cover;">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text text-muted">${product.category}</p>
                            <p class="card-text font-weight-bold">KES ${new Intl.NumberFormat().format(product.price)}</p>
                            <button class="btn btn-outline-primary mt-auto add-to-cart-btn" data-id="${product.id}">
                                <i class="fas fa-cart-plus"></i> Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        productsContainer.innerHTML = html;

        // Add event listeners
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                addToCart(id);
            });
        });
    }

    function addToCart(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = cart.find(item => item.product_id === productId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({
                product_id: productId,
                name: product.name,
                price: parseFloat(product.price),
                quantity: 1
            });
        }
        updateCartUI();
        alert(`${product.name} added to cart!`);
    }

    function updateCartUI() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        
        if (totalItems > 0) {
            checkoutBtn.disabled = false;
        } else {
            checkoutBtn.disabled = true;
        }
    }

    function renderCart() {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-muted text-center">Your cart is empty.</p>';
            cartTotalEl.textContent = 'KES 0';
            return;
        }

        let html = '<ul class="list-group list-group-flush">';
        let total = 0;

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            html += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        ${item.name} <small class="text-muted">x ${item.quantity}</small>
                    </div>
                    <span>KES ${new Intl.NumberFormat().format(itemTotal)}</span>
                </li>
            `;
        });
        html += '</ul>';
        
        cartItemsContainer.innerHTML = html;
        cartTotalEl.textContent = 'KES ' + new Intl.NumberFormat().format(total);
    }

    cartBtn.addEventListener('click', function() {
        renderCart();
        cartModal.modal('show');
    });

    checkoutBtn.addEventListener('click', function() {
        const btn = this;
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        fetch('/TFE/api/merch.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'order',
                items: cart
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Order placed successfully! Order ID: ' + data.order_id);
                cart = [];
                updateCartUI();
                cartModal.modal('hide');
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => console.error('Error:', error))
        .finally(() => {
            btn.disabled = false;
            btn.innerHTML = originalText;
        });
    });
});
