// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Storage key
const STORAGE_KEY = 'telegram_clothes_shop_products';

// State
let products = [];
let currentCategory = 'all';
let selectedImage = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    setupEventListeners();
    renderProducts();
    renderAdminProducts();
});

function setupEventListeners() {
    // Admin toggle
    document.getElementById('adminToggle').addEventListener('click', toggleAdmin);
    document.getElementById('closeAdmin').addEventListener('click', toggleAdmin);
    
    // Category filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            renderProducts();
        });
    });
    
    // Image upload
    const imageInput = document.getElementById('imageInput');
    const imageUploadArea = document.getElementById('imageUploadArea');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const uploadPreview = document.getElementById('uploadPreview');
    const previewImage = document.getElementById('previewImage');
    const removePreview = document.getElementById('removePreview');
    
    imageUploadArea.addEventListener('click', () => imageInput.click());
    
    imageInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    selectedImage = event.target.result;
                    previewImage.src = selectedImage;
                    uploadPlaceholder.style.display = 'none';
                    uploadPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                tg.showAlert('Please select a valid image file');
            }
        }
    });
    
    removePreview.addEventListener('click', function(e) {
        e.stopPropagation();
        selectedImage = null;
        imageInput.value = '';
        uploadPlaceholder.style.display = 'block';
        uploadPreview.style.display = 'none';
    });
    
    // Product form
    document.getElementById('productForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addProduct();
    });
    
    // Modal close
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('productModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
}

function toggleAdmin() {
    const shopView = document.getElementById('shopView');
    const adminView = document.getElementById('adminView');
    const isAdminVisible = adminView.style.display !== 'none';
    
    if (isAdminVisible) {
        shopView.style.display = 'block';
        adminView.style.display = 'none';
    } else {
        shopView.style.display = 'none';
        adminView.style.display = 'block';
        renderAdminProducts();
    }
    
    // Haptic feedback
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

function addProduct() {
    if (!selectedImage) {
        tg.showAlert('Please upload a product image');
        return;
    }
    
    const name = document.getElementById('productName').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const category = document.getElementById('productCategory').value;
    const size = document.getElementById('productSize').value.trim();
    const stock = parseInt(document.getElementById('productStock').value) || 0;
    
    if (!name || !price || !category) {
        tg.showAlert('Please fill in all required fields');
        return;
    }
    
    const product = {
        id: Date.now(),
        name: name,
        description: description,
        price: price,
        category: category,
        size: size,
        stock: stock,
        image: selectedImage,
        createdAt: new Date().toISOString()
    };
    
    products.push(product);
    saveProducts();
    
    // Reset form
    document.getElementById('productForm').reset();
    selectedImage = null;
    document.getElementById('uploadPlaceholder').style.display = 'block';
    document.getElementById('uploadPreview').style.display = 'none';
    
    // Update displays
    renderProducts();
    renderAdminProducts();
    
    tg.showAlert('Product added successfully!');
    
    // Haptic feedback
    if (tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== productId);
        saveProducts();
        renderProducts();
        renderAdminProducts();
        
        tg.showAlert('Product deleted');
        
        // Haptic feedback
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('medium');
        }
    }
}

function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');
    
    let filteredProducts = products;
    if (currentCategory !== 'all') {
        filteredProducts = products.filter(p => p.category === currentCategory);
    }
    
    if (filteredProducts.length === 0) {
        productsGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    productsGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    productsGrid.innerHTML = '';
    
    filteredProducts.forEach(product => {
        const card = createProductCard(product);
        productsGrid.appendChild(card);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.addEventListener('click', () => showProductModal(product));
    
    card.innerHTML = `
        <div class="product-image">
            ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '👕'}
        </div>
        <div class="product-info">
            <div class="product-name">${product.name}</div>
            <div class="product-category">${product.category}</div>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            ${product.stock > 0 ? `<div class="product-stock">${product.stock} in stock</div>` : '<div class="product-stock" style="color: var(--danger-color);">Out of stock</div>'}
        </div>
    `;
    
    return card;
}

function renderAdminProducts() {
    const adminProductsList = document.getElementById('adminProductsList');
    
    if (products.length === 0) {
        adminProductsList.innerHTML = '<p style="text-align: center; color: var(--tg-theme-hint-color); padding: 20px;">No products yet. Add your first product above!</p>';
        return;
    }
    
    adminProductsList.innerHTML = '';
    
    products.forEach(product => {
        const item = document.createElement('div');
        item.className = 'admin-product-item';
        
        item.innerHTML = `
            <div class="admin-product-image">
                ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '👕'}
            </div>
            <div class="admin-product-info">
                <div class="admin-product-name">${product.name}</div>
                <div class="admin-product-details">
                    ${product.category} • $${product.price.toFixed(2)} • Stock: ${product.stock}
                </div>
            </div>
            <div class="admin-product-actions">
                <button class="action-btn delete-btn" onclick="deleteProduct(${product.id})">🗑️</button>
            </div>
        `;
        
        adminProductsList.appendChild(item);
    });
}

function showProductModal(product) {
    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <div class="modal-product-image">
            ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '👕'}
        </div>
        <div class="modal-product-name">${product.name}</div>
        <div class="modal-product-category">${product.category}</div>
        <div class="modal-product-price">$${product.price.toFixed(2)}</div>
        ${product.description ? `<div class="modal-product-description">${product.description}</div>` : ''}
        <div class="modal-product-details">
            <div class="modal-detail-item">
                <div class="modal-detail-label">Size</div>
                <div class="modal-detail-value">${product.size || 'N/A'}</div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Stock</div>
                <div class="modal-detail-value">${product.stock}</div>
            </div>
            <div class="modal-detail-item">
                <div class="modal-detail-label">Category</div>
                <div class="modal-detail-value">${product.category}</div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    // Haptic feedback
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

function closeModal() {
    document.getElementById('productModal').style.display = 'none';
}

function saveProducts() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (e) {
        console.error('Error saving products:', e);
        tg.showAlert('Error saving products. Storage may be full.');
    }
}

function loadProducts() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            products = JSON.parse(saved);
        } else {
            // Add some sample products for demo
            products = [
                {
                    id: 1,
                    name: "Classic Blue Denim Shirt",
                    description: "Comfortable cotton denim shirt, perfect for casual wear",
                    price: 29.99,
                    category: "shirts",
                    size: "S, M, L, XL",
                    stock: 15,
                    image: null,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    name: "Slim Fit Chinos",
                    description: "Modern slim-fit chinos in various colors",
                    price: 39.99,
                    category: "pants",
                    size: "30, 32, 34, 36",
                    stock: 8,
                    image: null,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 3,
                    name: "Summer Floral Dress",
                    description: "Beautiful floral print dress for summer occasions",
                    price: 49.99,
                    category: "dresses",
                    size: "S, M, L",
                    stock: 5,
                    image: null,
                    createdAt: new Date().toISOString()
                }
            ];
            saveProducts();
        }
    } catch (e) {
        console.error('Error loading products:', e);
        products = [];
    }
}

// Make deleteProduct global for onclick handlers
window.deleteProduct = deleteProduct;

