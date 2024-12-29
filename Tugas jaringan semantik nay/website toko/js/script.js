let navbar = document.querySelector('.navbar');
let menuBtn = document.querySelector('#menu-btn');
let searchForm = document.querySelector('.search-form');
let cartOverlay = document.querySelector('.cart-overlay');

// Toggle menu dan form pencarian
menuBtn.onclick = () => {
    navbar.classList.toggle('active');
    searchForm.classList.remove('active');
    cartOverlay.classList.remove('active');
}

window.onscroll = () => {
    navbar.classList.remove('active');
    searchForm.classList.remove('active');
    cartOverlay.classList.remove('active');
}

// Global Variables
let cartItems = [];

// Fungsi untuk menambah item ke keranjang
function addToCart(name, price, imgSrc) {
    const existingItem = cartItems.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cartItems.push({
            name: name,
            price: price,
            quantity: 1,
            image: imgSrc
        });
    }
    
    updateCart();
    showNotification('Produk ditambahkan ke keranjang!', 'success');
}

// Fungsi untuk menghapus item dari keranjang
function removeFromCart(name) {
    cartItems = cartItems.filter(item => item.name !== name);
    updateCart();
    showNotification('Produk dihapus dari keranjang', 'info');
}

// Fungsi untuk memperbarui jumlah item di keranjang
function updateQuantity(name, change) {
    const item = cartItems.find(item => item.name === name);
    if (item) {
        item.quantity = Math.max(1, item.quantity + change);
        updateCart();
    }
}

// Fungsi untuk memperbarui tampilan keranjang
function updateCart() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const totalAmount = document.querySelector('.cart-total span');
    const cartCount = document.querySelector('.cart-count');
    
    if (!cartItemsContainer || !totalAmount || !cartCount) return;
    
    cartItemsContainer.innerHTML = '';
    let total = 0;
    
    cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItemHTML = `
            <div class="cart-item" data-name="${item.name}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <div class="cart-item-price">Rp${item.price.toLocaleString()}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn minus" onclick="updateQuantity('${item.name}', -1)">-</button>
                        <input type="number" value="${item.quantity}" min="1" readonly class="quantity-input">
                        <button class="quantity-btn plus" onclick="updateQuantity('${item.name}', 1)">+</button>
                    </div>
                </div>
                <button class="remove-item" onclick="removeFromCart('${item.name}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        cartItemsContainer.insertAdjacentHTML('beforeend', cartItemHTML);
    });
    
    totalAmount.textContent = `Rp${total.toLocaleString()}`;
    cartCount.textContent = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    
    // Simpan keranjang ke localStorage
    saveCartToLocalStorage();
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }, 100);
}

// Fungsi untuk menyimpan keranjang ke localStorage
function saveCartToLocalStorage() {
    try {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    } catch (error) {
        console.error('Error saving cart to localStorage:', error);
    }
}

// Fungsi untuk memuat keranjang dari localStorage
function loadCartFromLocalStorage() {
    try {
        const savedCart = localStorage.getItem('cartItems');
        if (savedCart) {
            cartItems = JSON.parse(savedCart);
            updateCart();
        }
    } catch (error) {
        console.error('Error loading cart from localStorage:', error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadCartFromLocalStorage();
    
    // Cart toggle
    const cartBtn = document.getElementById('cart-btn');
    const cartOverlay = document.querySelector('.shopping-cart');
    const closeCart = document.querySelector('#close-cart');
    
    // Menambahkan event listener untuk membuka keranjang
    cartBtn.addEventListener('click', () => {
        console.log('Keranjang dibuka');
        cartOverlay.classList.toggle('active');
    });
    
    // Menambahkan event listener untuk menutup keranjang
    closeCart.addEventListener('click', () => {
        cartOverlay.classList.remove('active');
    });
    
    // Checkout button
    document.querySelector('.checkout-btn').addEventListener('click', () => {
        if (cartItems.length === 0) {
            showNotification('Keranjang belanja kosong!', 'info');
            return;
        }
        
        // Mengumpulkan data pesanan
        const orderDetails = cartItems.map(item => {
            return {
                name: item.name,
                price: item.price,
                quantity: item.quantity
            };
        });

        // Mengirim data pesanan ke server
        const phoneNumber = prompt("Masukkan nomor WhatsApp Anda (dengan format +628123456789):");
        fetch('/send-invoice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phoneNumber, orderDetails })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data); // Tambahkan log untuk melihat data
            showNotification(data.message, 'success');
            // Kosongkan keranjang setelah checkout
            cartItems = [];
            updateCart();
            cartOverlay.classList.remove('active');
        })
        .catch(error => {
            console.error('Error:', error); // Log kesalahan
        });
    });
    
    // Event listener untuk tombol tambah ke keranjang
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', () => {
            const productName = button.getAttribute('data-name');
            const productPrice = parseFloat(button.getAttribute('data-price'));
            const productImage = button.getAttribute('data-image');
            addToCart(productName, productPrice, productImage);
        });
    });
});

document.getElementById('checkout-btn').onclick = function() {
    if (cartItems.length === 0) {
        alert('Keranjang Anda kosong!'); // Pesan jika keranjang kosong
    } else {
        const email = prompt("Masukkan alamat email Anda untuk menerima konfirmasi:");
        if (email) {
            // Mengumpulkan data pesanan
            const orderDetails = cartItems.map(item => {
                return {
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                };
            });

            // Mengirim data pesanan ke server
            fetch('/send-invoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, orderDetails })
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message); // Menampilkan pesan dari server
                // Kosongkan keranjang setelah checkout
                cartItems = [];
                updateCart();
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    }
};

var swiper = new Swiper('.portfolio-swiper', {
    slidesPerView: 3,
    spaceBetween: 30,
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
    breakpoints: {
        640: {
            slidesPerView: 1,
        },
        768: {
            slidesPerView: 2,
        },
        1024: {
            slidesPerView: 3,
        },
    },
});
