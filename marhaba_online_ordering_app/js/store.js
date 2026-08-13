// Marhaba Online Food Ordering - Application State Manager
class MarhabaStore {
  constructor() {
    this.cart = this.loadCart();
    this.activeView = "onboarding";
    this.activeCategory = "all";
    this.searchQuery = "";
    this.selectedItemModal = null;
    this.appliedPromo = null;
    this.deliveryFee = 2.50;
    this.rewardsPoints = 1250;
    this.activeOrder = this.loadActiveOrder();
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.saveCart();
    this.listeners.forEach(cb => cb(this));
  }

  // LocalStorage Persistence
  saveCart() {
    try {
      localStorage.setItem("marhaba_cart", JSON.stringify(this.cart));
      if (this.activeOrder) {
        localStorage.setItem("marhaba_order", JSON.stringify(this.activeOrder));
      }
    } catch (e) {
      console.warn("LocalStorage save error", e);
    }
  }

  loadCart() {
    try {
      const saved = localStorage.getItem("marhaba_cart");
      return saved ? JSON.parse(saved) : [
        {
          id: "item-1",
          name: "Royal Mixed Grill Platter",
          price: 24.50,
          quantity: 1,
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBiZyuNBk9MM91WR_3BnyWR14dySJTmSlc66RFUXEPx4tC4Az86j5vrScB3__BEf16y3Ya0tNZdPgteLnZt3SLVsetKVb3JYbfKoK0i7feGBKF29JF7PLxLweUiBoUEZTw9n2NUGtnznFBvfSeoQXiQPMS172TiTmPtPJjI7WEmd3wXHK6sfy349ZQ2VuUmTalgm7vBPoTmwit9p_cIWiFqMMVm9uNSuGzpmJvyjAiWZQpLZaQOuYR-",
          optionsText: "Standard Portion • Medium Spicy"
        },
        {
          id: "item-5",
          name: "Cheesy Mozzarella Garlic Bread",
          price: 3.50,
          quantity: 2,
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAzIs-yIc0IXlRNV6x0GduVbD36u7I1fpKPUkMuUEBctc_5gCEP_kpwm_lI4UeXvt1OrttTVGHKfo8VUeLpodpzi8LmUA1JWqScwBDWYaGR5mT3i3RV-Su_JQ5sHUSgB9rPGd_B34ylm0lhNHUTr-V51Gpp9MlYngUZ0QXZS5H0eBRkrnmmg1h7drUq-5cXFZRb-X9H1qifbWJP5mRyUsl9fC3Hg8T-GUcAq_mF1P9yLkxmZxF4ZTdz",
          optionsText: "With Mozzarella"
        }
      ];
    } catch (e) {
      return [];
    }
  }

  loadActiveOrder() {
    try {
      const saved = localStorage.getItem("marhaba_order");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  }

  // Cart Management
  addToCart(item, quantity = 1, optionsText = "", extraPrice = 0) {
    const existingIndex = this.cart.findIndex(i => i.id === item.id && i.optionsText === optionsText);
    const unitPrice = item.price + extraPrice;
    
    if (existingIndex > -1) {
      this.cart[existingIndex].quantity += quantity;
    } else {
      this.cart.push({
        id: item.id,
        name: item.name,
        price: unitPrice,
        quantity: quantity,
        image: item.image,
        optionsText: optionsText || "Standard Portion"
      });
    }
    this.notify();
  }

  updateQuantity(index, delta) {
    if (this.cart[index]) {
      this.cart[index].quantity += delta;
      if (this.cart[index].quantity <= 0) {
        this.cart.splice(index, 1);
      }
      this.notify();
    }
  }

  clearCart() {
    this.cart = [];
    this.appliedPromo = null;
    this.notify();
  }

  getCartCount() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  getSubtotal() {
    return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getDiscount() {
    if (!this.appliedPromo) return 0;
    const subtotal = this.getSubtotal();
    const promo = MARHABA_DATA.promos[this.appliedPromo];
    if (!promo) return 0;
    if (promo.type === "percent") {
      return (subtotal * promo.value) / 100;
    } else if (promo.type === "fixed") {
      return Math.min(subtotal, promo.value);
    } else if (promo.type === "delivery") {
      return this.deliveryFee;
    }
    return 0;
  }

  getTotal() {
    const subtotal = this.getSubtotal();
    const discount = this.getDiscount();
    const fee = (this.appliedPromo && MARHABA_DATA.promos[this.appliedPromo]?.type === "delivery") ? 0 : this.deliveryFee;
    return Math.max(0, subtotal - discount + fee);
  }

  applyPromo(code) {
    const cleanCode = code.trim().toUpperCase();
    if (MARHABA_DATA.promos[cleanCode]) {
      this.appliedPromo = cleanCode;
      this.notify();
      return { success: true, message: `Promo '${cleanCode}' applied!` };
    }
    return { success: false, message: "Invalid promo code" };
  }

  removePromo() {
    this.appliedPromo = null;
    this.notify();
  }

  // View Navigation
  setView(viewName) {
    this.activeView = viewName;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.notify();
  }

  setCategory(catId) {
    this.activeCategory = catId;
    this.notify();
  }

  setSearch(query) {
    this.searchQuery = query;
    this.notify();
  }

  // Order Placement
  createOrder(paymentMethod = "Card", address = "Rua Almirante Gago Coutinho, Amadora") {
    const orderId = "MH-" + Math.floor(100000 + Math.random() * 900000);
    this.activeOrder = {
      orderId: orderId,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: [...this.cart],
      total: this.getTotal(),
      subtotal: this.getSubtotal(),
      paymentMethod: paymentMethod,
      address: address,
      statusStage: 1, // 1: Confirmed, 2: Preparing Grill, 3: Out for Delivery, 4: Delivered
      estimatedMinutes: 25,
      driver: {
        name: "Carlos M.",
        phone: "+351 912 345 678",
        vehicle: "White Honda Scooter (AB-42-XY)",
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
      }
    };
    
    // Earn rewards points (10 points per € spent)
    const pointsEarned = Math.floor(this.getTotal() * 10);
    this.rewardsPoints += pointsEarned;
    
    this.clearCart();
    this.setView("order-confirmed");
    this.notify();

    // Simulate order status progress
    this.simulateOrderStatus();
  }

  simulateOrderStatus() {
    if (!this.activeOrder) return;
    
    setTimeout(() => {
      if (this.activeOrder && this.activeOrder.statusStage === 1) {
        this.activeOrder.statusStage = 2;
        this.activeOrder.estimatedMinutes = 20;
        this.notify();
      }
    }, 15000);

    setTimeout(() => {
      if (this.activeOrder && this.activeOrder.statusStage === 2) {
        this.activeOrder.statusStage = 3;
        this.activeOrder.estimatedMinutes = 10;
        this.notify();
      }
    }, 35000);
  }
}

const store = new MarhabaStore();
