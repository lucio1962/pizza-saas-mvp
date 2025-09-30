class PizzaSaaSApp {
    constructor() {
        this.pizzeriaSlug = this.getSlugFromURL();
        this.pizzeriaConfig = null;
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.currentCategory = 'all';
        this.init();
    }

    getSlugFromURL() {
        // Per sviluppo: usa parametro URL ?slug=nome-pizzeria
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('slug') || 'demo';
    }

    async init() {
        await this.loadPizzeriaConfig();
        this.renderPizzeriaInfo();
        this.renderCategories();
        this.renderMenu();
        this.setupEventListeners();
        this.updateCartDisplay();
    }

    async loadPizzeriaConfig() {
        try {
            // Per sviluppo: carica da file locale
            const response = await fetch(`/api/${this.pizzeriaSlug}`);
            this.pizzeriaConfig = await response.json();
        } catch (error) {
            console.warn('API non disponibile, uso demo data');
            this.pizzeriaConfig = this.getDemoData();
        }
    }

    getDemoData() {
        return {
            name: "Pizzeria Demo",
            slug: "demo",
            config: {
                theme: "classic",
                colors: {
                    primary: "#e74c3c",
                    secondary: "#f39c12"
                },
                settings: {
                    currency: "€",
                    deliveryFee: 2.50
                }
            },
            info: {
                phone: "📞 0123 456789",
                address: "📍 Via Roma 123, Milano"
            },
            menu: {
                categories: [
                    {
                        name: "Pizze Classiche",
                        order: 1,
                        items: [
                            {
                                name: "Margherita",
                                description: "Pomodoro, mozzarella, basilico fresco",
                                price: 6.50,
                                ingredients: ["pomodoro", "mozzarella", "basilico"],
                                extras: [
                                    { name: "Extra mozzarella", price: 1.50 },
                                    { name: "Extra basilico", price: 0.50 }
                                ],
                                available: true
                            },
                            {
                                name: "Marinara",
                                description: "Pomodoro, aglio, origano",
                                price: 5.00,
                                ingredients: ["pomodoro", "aglio", "origano"],
                                extras: [],
                                available: true
                            }
                        ]
                    },
                    {
                        name: "Pizze Speciali",
                        order: 2,
                        items: [
                            {
                                name: "Diavola",
                                description: "Pomodoro, mozzarella, salame piccante",
                                price: 8.00,
                                ingredients: ["pomodoro", "mozzarella", "salame piccante"],
                                extras: [
                                    { name: "Extra piccante", price: 1.00 }
                                ],
                                available: true
                            }
                        ]
                    }
                ]
            }
        };
    }

    renderPizzeriaInfo() {
        document.getElementById('pizzeria-name').textContent = this.pizzeriaConfig.name;
        document.getElementById('pizzeria-phone').textContent = this.pizzeriaConfig.info.phone;
        document.getElementById('pizzeria-address').textContent = this.pizzeriaConfig.info.address;
        
        // Applica tema colori
        if (this.pizzeriaConfig.config.colors) {
            const root = document.documentElement;
            root.style.setProperty('--primary', this.pizzeriaConfig.config.colors.primary);
            root.style.setProperty('--secondary', this.pizzeriaConfig.config.colors.secondary);
        }
    }

    renderCategories() {
        const container = document.getElementById('categories-list');
        container.innerHTML = '';

        // Bottone "Tutto"
        const allBtn = document.createElement('button');
        allBtn.className = `category-btn ${this.currentCategory === 'all' ? 'active' : ''}`;
        allBtn.textContent = 'Tutto';
        allBtn.onclick = () => this.filterByCategory('all');
        container.appendChild(allBtn);

        // Categorie dal menu
        this.pizzeriaConfig.menu.categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = `category-btn ${this.currentCategory === category.name ? 'active' : ''}`;
            btn.textContent = category.name;
            btn.onclick = () => this.filterByCategory(category.name);
            container.appendChild(btn);
        });
    }

    renderMenu() {
        const container = document.getElementById('menu-container');
        container.innerHTML = '';

        this.pizzeriaConfig.menu.categories.forEach(category => {
            if (this.currentCategory !== 'all' && this.currentCategory !== category.name) {
                return;
            }

            category.items.forEach(item => {
                if (item.available) {
                    container.appendChild(this.createMenuItem(item, category.name));
                }
            });
        });
    }

    createMenuItem(item, category) {
        const itemEl = document.createElement('div');
        itemEl.className = 'menu-item';
        itemEl.innerHTML = `
            <h3>${item.name}</h3>
            <p class="item-description">${item.description}</p>
            <div class="item-ingredients">
                ${item.ingredients.map(ing => `<span class="ingredient">${ing}</span>`).join('')}
            </div>
            ${item.extras && item.extras.length > 0 ? `
                <div class="item-extras">
                    <strong>Extra disponibili:</strong>
                    ${item.extras.map(extra => `
                        <label class="extra-option">
                            <input type="checkbox" 
                                   data-name="${extra.name}" 
                                   data-price="${extra.price}">
                            ${extra.name} (+${this.formatPrice(extra.price)})
                        </label>
                    `).join('')}
                </div>
            ` : ''}
            <div class="item-footer">
                <span class="item-price">${this.formatPrice(item.price)}</span>
                <button class="btn-add-to-cart" 
                        data-item='${JSON.stringify(item).replace(/'/g, "&#39;")}'>
                    Aggiungi
                </button>
            </div>
        `;
        return itemEl;
    }

    filterByCategory(category) {
        this.currentCategory = category;
        this.renderCategories();
        this.renderMenu();
    }

    setupEventListeners() {
        // Toggle carrello
        document.getElementById('toggle-cart').addEventListener('click', () => {
            document.getElementById('cart').classList.toggle('open');
        });

        // Aggiungi al carrello
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-add-to-cart')) {
                const item = JSON.parse(e.target.dataset.item);
                const extras = this.getSelectedExtras(e.target.closest('.menu-item'));
                this.addToCart(item, extras);
            }
        });

        // Checkout
        document.getElementById('checkout-btn').addEventListener('click', () => {
            this.showCheckout();
        });
    }

    getSelectedExtras(menuItem) {
        const extras = [];
        const extraCheckboxes = menuItem.querySelectorAll('.item-extras input:checked');
        
        extraCheckboxes.forEach(checkbox => {
            extras.push({
                name: checkbox.dataset.name,
                price: parseFloat(checkbox.dataset.price)
            });
        });
        
        return extras;
    }

    addToCart(item, extras) {
        const cartItem = {
            id: Date.now() + Math.random(),
            name: item.name,
            basePrice: item.price,
            extras: extras,
            quantity: 1
        };

        cartItem.totalPrice = cartItem.basePrice + extras.reduce((sum, extra) => sum + extra.price, 0);
        
        this.cart.push(cartItem);
        this.saveCart();
        this.updateCartDisplay();
        
        // Mostra conferma
        this.showAddToCartConfirmation(item.name);
    }

    showAddToCartConfirmation(itemName) {
        // Implementa un toast di conferma
        alert(`✅ ${itemName} aggiunto al carrello!`);
    }

    updateCartDisplay() {
        const cartItems = document.getElementById('cart-items');
        const cartCount = document.getElementById('cart-count');
        const subtotalEl = document.getElementById('subtotal');
        const totalEl = document.getElementById('total');

        // Aggiorna conteggio
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;

        // Render items
        cartItems.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <strong>${item.name}</strong>
                    ${item.extras.map(extra => 
                        `<div style="font-size: 0.8rem; color: #666;">+ ${extra.name}</div>`
                    ).join('')}
                </div>
                <div class="cart-item-controls">
                    <button onclick="app.updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="app.updateQuantity(${item.id}, 1)">+</button>
                    <span style="margin-left: 1rem;">${this.formatPrice(item.totalPrice * item.quantity)}</span>
                    <button onclick="app.removeFromCart(${item.id})" style="background: #e74c3c;">×</button>
                </div>
            </div>
        `).join('');

        // Calcola totali
        const subtotal = this.cart.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0);
        const deliveryFee = this.pizzeriaConfig.config.settings.deliveryFee || 0;
        const total = subtotal + deliveryFee;

        subtotalEl.textContent = this.formatPrice(subtotal);
        document.getElementById('delivery-fee').textContent = this.formatPrice(deliveryFee);
        totalEl.textContent = this.formatPrice(total);
    }

    updateQuantity(itemId, change) {
        const item = this.cart.find(i => i.id === itemId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.removeFromCart(itemId);
            } else {
                this.saveCart();
                this.updateCartDisplay();
            }
        }
    }

    removeFromCart(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.saveCart();
        this.updateCartDisplay();
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    formatPrice(price) {
        const currency = this.pizzeriaConfig.config.settings.currency || '€';
        return `${currency}${price.toFixed(2)}`;
    }

    showCheckout() {
        if (this.cart.length === 0) {
            alert('Il carrello è vuoto!');
            return;
        }

        const modal = document.getElementById('checkout-modal');
        const form = document.getElementById('checkout-form');
        
        form.innerHTML = this.getCheckoutFormHTML();
        modal.style.display = 'block';

        // Setup form submission
        form.onsubmit = (e) => this.handleCheckout(e);
    }

    getCheckoutFormHTML() {
        return `
            <div class="form-group">
                <label>Nome *</label>
                <input type="text" name="customerName" required>
            </div>
            <div class="form-group">
                <label>Telefono *</label>
                <input type="tel" name="customerPhone" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" name="customerEmail">
            </div>
            <div class="form-group">
                <label>Indirizzo di consegna *</label>
                <textarea name="customerAddress" required></textarea>
            </div>
            <div class="form-group">
                <label>Note per la pizzeria</label>
                <textarea name="customerNotes"></textarea>
            </div>
            <div class="form-group">
                <label>Tipo di ordine</label>
                <select name="orderType">
                    <option value="delivery">Consegna a domicilio</option>
                    <option value="pickup">Ritiro in pizzeria</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" onclick="this.closest('.modal').style.display='none'">Annulla</button>
                <button type="submit" class="btn-primary">Invia Ordine</button>
            </div>
        `;
    }

    async handleCheckout(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const orderData = {
            customer: {
                name: formData.get('customerName'),
                phone: formData.get('customerPhone'),
                email: formData.get('customerEmail'),
                address: formData.get('customerAddress'),
                notes: formData.get('customerNotes')
            },
            orderType: formData.get('orderType'),
            items: this.cart,
            subtotal: this.cart.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0),
            deliveryFee: this.pizzeriaConfig.config.settings.deliveryFee || 0,
            total: this.cart.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0) + 
                   (this.pizzeriaConfig.config.settings.deliveryFee || 0)
        };

        try {
            // Invia ordine al backend
            const response = await fetch(`/api/${this.pizzeriaSlug}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showOrderConfirmation(result.orderNumber);
                this.cart = [];
                this.saveCart();
                this.updateCartDisplay();
                document.getElementById('checkout-modal').style.display = 'none';
            } else {
                alert('Errore nell\'invio dell\'ordine: ' + result.error);
            }
        } catch (error) {
            console.error('Errore:', error);
            // Fallback: mostra dati ordine per contatto manuale
            this.showOrderFallback(orderData);
        }
    }

    showOrderConfirmation(orderNumber) {
        alert(`🎉 Ordine confermato! Numero: ${orderNumber}\nLa pizzeria ti contatterà a breve.`);
    }

    showOrderFallback(orderData) {
        const orderText = `
ORDINE PIZZERIA ${this.pizzeriaConfig.name}

Cliente: ${orderData.customer.name}
Telefono: ${orderData.customer.phone}
Indirizzo: ${orderData.customer.address}

Ordine:
${this.cart.map(item => `${item.quantity}x ${item.name} - ${this.formatPrice(item.totalPrice * item.quantity)}`).join('\n')}

TOTALE: ${this.formatPrice(orderData.total)}

Chiama la pizzeria per confermare: ${this.pizzeriaConfig.info.phone}
        `;
        
        alert(`📞 Backend non disponibile\n\nCopia questo messaggio e invialo alla pizzeria:\n\n${orderText}`);
    }
}

// Inizializza l'app
const app = new PizzaSaaSApp();
