// Marhaba Online Food Ordering - UI Controller & Renderer

document.addEventListener("DOMContentLoaded", () => {
  // Subscribe UI renderer to Store changes
  store.subscribe(() => renderApp());
  
  // Initial setup
  initApp();
});

let onboardingStep = 1;
let selectedModalOptions = { portion: 0, spice: 0, dips: [] };

function initApp() {
  renderApp();
  setupGlobalEventListeners();
}

function setupGlobalEventListeners() {
  // Navigation tabs
  document.querySelectorAll("[data-nav]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const view = e.currentTarget.getAttribute("data-nav");
      store.setView(view);
    });
  });
}

// Toast notification helper
function showToast(message, isError = false) {
  const toast = document.getElementById("toast-notification");
  if (!toast) return;
  
  toast.innerText = message;
  toast.className = `fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-full shadow-lg text-sm font-semibold transition-all duration-300 ${
    isError ? "bg-red-600 text-white" : "bg-[#1d1b17] text-[#fef8f1]"
  }`;
  
  toast.classList.remove("opacity-0", "pointer-events-none", "translate-y-4");
  
  setTimeout(() => {
    toast.classList.add("opacity-0", "pointer-events-none", "translate-y-4");
  }, 2500);
}

// Main View Router
function renderApp() {
  const viewContainer = document.getElementById("view-content");
  if (!viewContainer) return;

  // Update Cart Badge Counters
  const cartBadges = document.querySelectorAll(".cart-badge");
  const count = store.getCartCount();
  cartBadges.forEach(b => {
    b.innerText = count;
    b.classList.toggle("hidden", count === 0);
  });

  // Highlight active bottom tab
  document.querySelectorAll("[data-nav]").forEach(btn => {
    const navView = btn.getAttribute("data-nav");
    const isActive = store.activeView === navView;
    btn.classList.toggle("text-[#a33818]", isActive);
    btn.classList.toggle("text-[#5c5c5c]", !isActive);
  });

  // Render view template
  switch (store.activeView) {
    case "onboarding":
      viewContainer.innerHTML = renderOnboardingView();
      break;
    case "home":
      viewContainer.innerHTML = renderHomeView();
      break;
    case "menu":
      viewContainer.innerHTML = renderMenuView();
      break;
    case "cart":
    case "checkout":
      viewContainer.innerHTML = renderCheckoutView();
      break;
    case "order-confirmed":
      viewContainer.innerHTML = renderOrderConfirmedView();
      break;
    case "order-status":
      viewContainer.innerHTML = renderOrderStatusView();
      break;
    case "rewards":
      viewContainer.innerHTML = renderRewardsView();
      break;
    default:
      viewContainer.innerHTML = renderHomeView();
  }
}

/* ==========================================================================
   VIEW TEMPLATES
   ========================================================================== */

// 1. Onboarding View
function renderOnboardingView() {
  const data = MARHABA_DATA.onboarding.find(o => o.step === onboardingStep) || MARHABA_DATA.onboarding[0];
  
  return `
    <div class="view-container min-h-screen flex flex-col justify-between bg-[#fef8f1] px-margin-mobile pt-safe pb-12">
      <!-- Top Logo Bar -->
      <div class="flex items-center justify-between pt-6">
        <div class="flex items-center gap-2">
          <div class="w-10 h-10 rounded-full bg-[#a33818] flex items-center justify-center text-white">
            <span class="material-symbols-outlined text-2xl">local_fire_department</span>
          </div>
          <span class="font-headline text-2xl font-bold text-[#a33818]">MARHABA</span>
        </div>
        <button onclick="store.setView('home')" class="text-[#5c5c5c] font-semibold text-sm hover:text-[#a33818]">
          Skip
        </button>
      </div>

      <!-- Hero Artwork Card -->
      <div class="my-auto py-6">
        <div class="relative w-full h-80 rounded-2xl overflow-hidden shadow-xl mb-6 group">
          <img src="${data.image}" alt="${data.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          <div class="absolute top-4 left-4 px-3 py-1 bg-[#a33818] text-white text-xs font-bold uppercase rounded-full tracking-wider">
            ${data.tag}
          </div>
        </div>

        <div class="text-center px-4">
          <h1 class="font-headline text-3xl font-extrabold text-[#1d1b17] mb-3 leading-tight">${data.title}</h1>
          <p class="text-[#58423c] text-base leading-relaxed">${data.subtitle}</p>
        </div>
      </div>

      <!-- Pagination & Action CTA -->
      <div class="flex flex-col gap-6">
        <!-- Dots -->
        <div class="flex justify-center items-center gap-2">
          ${MARHABA_DATA.onboarding.map(item => `
            <div class="h-2.5 rounded-full transition-all duration-300 ${
              item.step === onboardingStep ? "w-8 bg-[#a33818]" : "w-2.5 bg-[#e7e2db]"
            }"></div>
          `).join('')}
        </div>

        <button onclick="nextOnboardingStep()" class="w-full h-14 bg-[#a33818] hover:bg-[#862303] text-white rounded-xl font-headline font-bold text-lg shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
          ${onboardingStep === 3 ? "Explore Menu & Order" : "Continue"}
          <span class="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  `;
}

function nextOnboardingStep() {
  if (onboardingStep < 3) {
    onboardingStep++;
    renderApp();
  } else {
    store.setView("home");
  }
}

// 2. Home View
function renderHomeView() {
  const specials = MARHABA_DATA.items.filter(i => i.isPopular);

  return `
    <div class="view-container pb-28 pt-16">
      <!-- Header -->
      <header class="fixed top-0 w-full z-40 glass-header pt-safe">
        <div class="h-16 px-margin-mobile flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-full bg-[#a33818] flex items-center justify-center text-white shadow-sm">
              <span class="material-symbols-outlined text-xl">local_fire_department</span>
            </div>
            <div>
              <span class="font-headline font-bold text-xl text-[#a33818]">Marhaba</span>
              <span class="text-xs text-[#8b716a] block -mt-1 font-medium">Grill & Artisan Pizza</span>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button onclick="store.setView('rewards')" class="flex items-center gap-1 px-3 py-1 bg-[#ffdbd1] text-[#862303] rounded-full text-xs font-bold">
              <span class="material-symbols-outlined text-sm">stars</span>
              ${store.rewardsPoints} pts
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex flex-col gap-6 mt-2">
        <!-- Today's Special Hero Banner -->
        <section class="px-margin-mobile">
          <div onclick="openItemModal('item-1')" class="relative h-64 w-full rounded-2xl overflow-hidden shadow-lg cursor-pointer group active:scale-[0.99] transition-transform">
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10"></div>
            <img src="${MARHABA_DATA.items[0].image}" alt="Royal Mixed Grill" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div class="absolute bottom-0 left-0 p-5 z-20">
              <span class="inline-block px-3 py-1 bg-[#a33818] text-white text-[11px] font-bold rounded-full mb-2 uppercase tracking-wider">Today's Special • 20% OFF</span>
              <h2 class="font-headline text-2xl font-bold text-white mb-1">Royal Mixed Grill Platter</h2>
              <p class="text-white/90 text-sm line-clamp-1 mb-2">Lamb Chops, Chicken Tawook & Spiced Kafta with Garlic Dip</p>
              <div class="flex items-center gap-3">
                <span class="text-white font-bold text-lg">€24.50</span>
                <span class="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-lg flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs">add_shopping_cart</span> Quick Add
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Search Bar -->
        <section class="px-margin-mobile">
          <div class="relative flex items-center">
            <span class="material-symbols-outlined absolute left-4 text-[#8b716a]">search</span>
            <input type="text" 
                   placeholder="Search for grill platters, pizza, sides..." 
                   value="${store.searchQuery}"
                   oninput="handleSearch(this.value)"
                   class="w-full h-12 pl-12 pr-4 bg-[#f3ede6] rounded-xl text-base text-[#1d1b17] focus:outline-none focus:ring-2 focus:ring-[#a33818]/30 transition-all" />
          </div>
        </section>

        <!-- Categories Horizontal Scroll -->
        <section>
          <div class="flex items-center justify-between px-margin-mobile mb-3">
            <h3 class="font-headline font-bold text-xl text-[#1d1b17]">Categories</h3>
            <button onclick="store.setView('menu')" class="text-[#a33818] font-bold text-xs uppercase hover:underline">View All</button>
          </div>
          
          <div class="flex overflow-x-auto no-scrollbar gap-4 px-margin-mobile pb-2">
            ${MARHABA_DATA.categories.map(cat => `
              <div onclick="selectCategory('${cat.id}')" class="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer group">
                <div class="w-20 h-20 rounded-2xl ${store.activeCategory === cat.id ? "bg-[#a33818] text-white shadow-md" : "bg-[#f3ede6] text-[#1d1b17]"} flex flex-col items-center justify-center transition-all group-hover:scale-105">
                  <span class="material-symbols-outlined text-3xl mb-1">${cat.icon}</span>
                  <span class="text-[11px] font-bold tracking-tight">${cat.name.split(" ")[0]}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Featured & Popular Grill Platters -->
        <section class="px-margin-mobile">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <h3 class="font-headline font-bold text-xl text-[#1d1b17]">Popular Dishes</h3>
              <span class="h-2.5 w-2.5 rounded-full bg-[#a33818] animate-ping"></span>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4">
            ${specials.map(item => `
              <div onclick="openItemModal('${item.id}')" class="bg-white rounded-2xl p-3 shadow-sm border border-[#e7e2db]/60 flex gap-4 cursor-pointer active:scale-[0.98] transition-transform">
                <div class="w-28 h-28 rounded-xl overflow-hidden relative flex-shrink-0">
                  <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover" />
                  <span class="absolute top-2 left-2 bg-[#a33818] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">${item.badge}</span>
                </div>

                <div class="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h4 class="font-headline font-bold text-base text-[#1d1b17] line-clamp-1">${item.name}</h4>
                    <p class="text-xs text-[#58423c] line-clamp-2 mt-1">${item.description}</p>
                  </div>

                  <div class="flex items-center justify-between mt-2">
                    <span class="font-headline font-bold text-lg text-[#a33818]">€${item.price.toFixed(2)}</span>
                    <button class="w-9 h-9 rounded-xl bg-[#ffdbd1] text-[#862303] flex items-center justify-center font-bold hover:bg-[#a33818] hover:text-white transition-colors">
                      <span class="material-symbols-outlined text-xl">add</span>
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Active Order Floating Tracker Banner (if any) -->
        ${store.activeOrder ? `
          <section class="px-margin-mobile">
            <div onclick="store.setView('order-status')" class="bg-[#1d1b17] text-white p-4 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer active:scale-98 transition-transform">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-[#a33818] flex items-center justify-center pulse-badge">
                  <span class="material-symbols-outlined text-xl">local_shipping</span>
                </div>
                <div>
                  <h4 class="font-headline font-bold text-sm">Order #${store.activeOrder.orderId}</h4>
                  <p class="text-xs text-white/70">
                    ${store.activeOrder.statusStage === 1 ? "Order Received" : store.activeOrder.statusStage === 2 ? "Grill Preparing" : "Out for Delivery"}
                    • Est ${store.activeOrder.estimatedMinutes} mins
                  </p>
                </div>
              </div>
              <span class="material-symbols-outlined text-xl text-[#ffdbd1]">chevron_right</span>
            </div>
          </section>
        ` : ''}
      </main>
    </div>
  `;
}

function handleSearch(query) {
  store.setSearch(query);
  if (store.activeView !== "menu") {
    store.setView("menu");
  }
}

function selectCategory(catId) {
  store.setCategory(catId);
  store.setView("menu");
}

// 3. Menu View
function renderMenuView() {
  let filteredItems = MARHABA_DATA.items;

  if (store.activeCategory !== "all") {
    filteredItems = filteredItems.filter(i => i.categoryId === store.activeCategory);
  }

  if (store.searchQuery.trim() !== "") {
    const q = store.searchQuery.toLowerCase();
    filteredItems = filteredItems.filter(i => 
      i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
    );
  }

  return `
    <div class="view-container pb-28 pt-16">
      <header class="fixed top-0 w-full z-40 glass-header pt-safe">
        <div class="h-16 px-margin-mobile flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button onclick="store.setView('home')" class="w-9 h-9 rounded-full bg-[#f3ede6] flex items-center justify-center text-[#1d1b17]">
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 class="font-headline font-bold text-xl text-[#1d1b17]">Full Menu</h1>
          </div>
          <span class="text-xs text-[#58423c] font-semibold">${filteredItems.length} Items</span>
        </div>
      </header>

      <!-- Category Filter Pills -->
      <div class="sticky top-16 z-30 bg-[#fef8f1]/90 backdrop-blur-md py-3 px-margin-mobile border-b border-[#e7e2db]">
        <div class="flex overflow-x-auto no-scrollbar gap-2">
          ${MARHABA_DATA.categories.map(cat => `
            <button onclick="store.setCategory('${cat.id}')" 
                    class="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      store.activeCategory === cat.id ? "bg-[#a33818] text-white shadow-sm" : "bg-[#f3ede6] text-[#58423c]"
                    }">
              ${cat.name}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Menu Grid -->
      <main class="px-margin-mobile mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        ${filteredItems.length === 0 ? `
          <div class="col-span-full py-12 text-center">
            <span class="material-symbols-outlined text-5xl text-[#8b716a] mb-2">search_off</span>
            <p class="text-[#58423c] font-medium text-base">No dishes found matching '${store.searchQuery}'</p>
          </div>
        ` : filteredItems.map(item => `
          <div onclick="openItemModal('${item.id}')" class="bg-white rounded-2xl p-4 shadow-sm border border-[#e7e2db]/70 flex flex-col justify-between cursor-pointer active:scale-[0.98] transition-transform">
            <div>
              <div class="w-full h-44 rounded-xl overflow-hidden relative mb-3">
                <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover" />
                <span class="absolute top-3 left-3 bg-[#a33818] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                  ${item.badge}
                </span>
                <span class="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                  <span class="material-symbols-outlined text-yellow-400 text-sm">star</span> ${item.rating} (${item.reviewsCount})
                </span>
              </div>

              <h3 class="font-headline font-bold text-lg text-[#1d1b17] mb-1">${item.name}</h3>
              <p class="text-xs text-[#58423c] line-clamp-2 mb-4">${item.description}</p>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-[#f3ede6]">
              <span class="font-headline font-bold text-xl text-[#a33818]">€${item.price.toFixed(2)}</span>
              <button class="px-4 py-2 rounded-xl bg-[#a33818] text-white font-bold text-xs flex items-center gap-1 shadow-sm hover:bg-[#862303] transition-colors">
                <span class="material-symbols-outlined text-sm">add</span> Customize & Add
              </button>
            </div>
          </div>
        `).join('')}
      </main>
    </div>
  `;
}

// 4. Item Customization Modal
function openItemModal(itemId) {
  const item = MARHABA_DATA.items.find(i => i.id === itemId);
  if (!item) return;

  selectedModalOptions = { portion: 0, spice: 0, dips: [], quantity: 1 };

  const modalContainer = document.getElementById("item-modal-container");
  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-[90] modal-backdrop flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div class="bg-[#fef8f1] w-full max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-3xl overflow-y-auto shadow-2xl flex flex-col animate-slide-up">
        
        <!-- Modal Image Header -->
        <div class="relative h-64 w-full flex-shrink-0">
          <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover" />
          <button onclick="closeItemModal()" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center">
            <span class="material-symbols-outlined">close</span>
          </button>
          <span class="absolute bottom-4 left-4 bg-[#a33818] text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
            ${item.badge}
          </span>
        </div>

        <!-- Content & Customization -->
        <div class="p-6 flex-1 flex flex-col gap-6">
          <div>
            <div class="flex justify-between items-start mb-2">
              <h2 class="font-headline font-bold text-2xl text-[#1d1b17]">${item.name}</h2>
              <span class="font-headline font-bold text-2xl text-[#a33818]">€${item.price.toFixed(2)}</span>
            </div>
            <p class="text-sm text-[#58423c] leading-relaxed">${item.description}</p>
          </div>

          <!-- Options -->
          ${item.options.map((opt, optIndex) => `
            <div>
              <h4 class="font-headline font-bold text-sm text-[#1d1b17] uppercase tracking-wider mb-3">${opt.name}</h4>
              <div class="space-y-2">
                ${opt.choices.map((choice, choiceIndex) => `
                  <label class="flex items-center justify-between p-3 rounded-xl border border-[#e7e2db] bg-white cursor-pointer hover:border-[#a33818]">
                    <div class="flex items-center gap-3">
                      <input type="${opt.type === 'single' ? 'radio' : 'checkbox'}" 
                             name="opt-${optIndex}" 
                             ${choiceIndex === 0 && opt.type === 'single' ? 'checked' : ''}
                             onchange="handleOptionChange(${optIndex}, ${choiceIndex}, '${opt.type}')"
                             class="accent-[#a33818] w-4 h-4" />
                      <span class="text-sm font-semibold text-[#1d1b17]">${choice.label}</span>
                    </div>
                    ${choice.price > 0 ? `<span class="text-xs font-bold text-[#a33818]">+€${choice.price.toFixed(2)}</span>` : ''}
                  </label>
                `).join('')}
              </div>
            </div>
          `).join('')}

          <!-- Quantity Stepper & Add Button -->
          <div class="pt-4 border-t border-[#e7e2db] flex items-center justify-between gap-4">
            <div class="flex items-center bg-[#f3ede6] rounded-xl p-1">
              <button onclick="updateModalQty(-1)" class="w-10 h-10 rounded-lg bg-white text-[#1d1b17] font-bold text-lg shadow-sm flex items-center justify-center">-</button>
              <span id="modal-qty-val" class="w-12 text-center font-bold text-base">1</span>
              <button onclick="updateModalQty(1)" class="w-10 h-10 rounded-lg bg-white text-[#1d1b17] font-bold text-lg shadow-sm flex items-center justify-center">+</button>
            </div>

            <button onclick="confirmAddToCart('${item.id}')" class="flex-1 h-14 bg-[#a33818] hover:bg-[#862303] text-white font-headline font-bold text-base rounded-xl shadow-lg flex items-center justify-center gap-2">
              <span class="material-symbols-outlined">shopping_bag</span> Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function handleOptionChange(optIndex, choiceIndex, type) {
  if (!selectedModalOptions.choices) selectedModalOptions.choices = {};
  if (type === 'single') {
    selectedModalOptions.choices[optIndex] = choiceIndex;
  } else {
    if (!selectedModalOptions.choices[optIndex]) selectedModalOptions.choices[optIndex] = [];
    const arr = selectedModalOptions.choices[optIndex];
    const pos = arr.indexOf(choiceIndex);
    if (pos > -1) arr.splice(pos, 1);
    else arr.push(choiceIndex);
  }
}

function updateModalQty(delta) {
  if (!selectedModalOptions.quantity) selectedModalOptions.quantity = 1;
  selectedModalOptions.quantity = Math.max(1, selectedModalOptions.quantity + delta);
  const qtyEl = document.getElementById("modal-qty-val");
  if (qtyEl) qtyEl.innerText = selectedModalOptions.quantity;
}

function closeItemModal() {
  const modalContainer = document.getElementById("item-modal-container");
  if (modalContainer) modalContainer.innerHTML = "";
}

function confirmAddToCart(itemId) {
  const item = MARHABA_DATA.items.find(i => i.id === itemId);
  if (!item) return;

  const qty = selectedModalOptions.quantity || 1;
  let extraPrice = 0;
  let selectedTexts = [];

  if (item.options && item.options.length > 0) {
    item.options.forEach((opt, optIndex) => {
      const userChoice = selectedModalOptions.choices ? selectedModalOptions.choices[optIndex] : undefined;
      if (opt.type === 'single') {
        const choiceIdx = userChoice !== undefined ? userChoice : 0;
        const choice = opt.choices[choiceIdx];
        if (choice) {
          extraPrice += choice.price || 0;
          selectedTexts.push(choice.label);
        }
      } else if (Array.isArray(userChoice)) {
        userChoice.forEach(cIdx => {
          const choice = opt.choices[cIdx];
          if (choice) {
            extraPrice += choice.price || 0;
            selectedTexts.push(choice.label);
          }
        });
      }
    });
  }

  const optionsText = selectedTexts.length > 0 ? selectedTexts.join(" • ") : "Standard Portion";
  store.addToCart(item, qty, optionsText, extraPrice);
  closeItemModal();
  showToast(`Added ${qty}x ${item.name} to cart!`);
}

// 5. Checkout / Cart View
function renderCheckoutView() {
  const subtotal = store.getSubtotal();
  const discount = store.getDiscount();
  const total = store.getTotal();

  return `
    <div class="view-container pb-32 pt-16">
      <header class="fixed top-0 w-full z-40 glass-header pt-safe">
        <div class="h-16 px-margin-mobile flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button onclick="store.setView('home')" class="w-9 h-9 rounded-full bg-[#f3ede6] flex items-center justify-center text-[#1d1b17]">
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 class="font-headline font-bold text-xl text-[#1d1b17]">Your Cart & Checkout</h1>
          </div>
          ${store.cart.length > 0 ? `
            <button onclick="store.clearCart()" class="text-xs font-bold text-red-600 uppercase">Clear All</button>
          ` : ''}
        </div>
      </header>

      <main class="px-margin-mobile mt-4 flex flex-col gap-6">
        <!-- Step Progress Indicator -->
        <div class="flex items-center justify-between bg-[#f3ede6] p-4 rounded-2xl">
          <div class="flex items-center gap-2 text-[#a33818] font-bold text-xs uppercase">
            <span class="w-6 h-6 rounded-full bg-[#a33818] text-white flex items-center justify-center text-xs">1</span>
            Cart Items
          </div>
          <div class="h-0.5 flex-1 bg-[#e7e2db] mx-3"></div>
          <div class="flex items-center gap-2 text-[#a33818] font-bold text-xs uppercase">
            <span class="w-6 h-6 rounded-full bg-[#a33818] text-white flex items-center justify-center text-xs">2</span>
            Checkout
          </div>
        </div>

        <!-- Cart Items List -->
        ${store.cart.length === 0 ? `
          <div class="py-16 text-center">
            <span class="material-symbols-outlined text-6xl text-[#8b716a] mb-3">shopping_basket</span>
            <h3 class="font-headline font-bold text-xl text-[#1d1b17] mb-1">Your cart is empty</h3>
            <p class="text-sm text-[#58423c] mb-6">Explore our delicious grill items and artisan pizzas.</p>
            <button onclick="store.setView('menu')" class="px-6 py-3 bg-[#a33818] text-white font-bold rounded-xl text-sm shadow-md">
              Browse Menu
            </button>
          </div>
        ` : `
          <div class="space-y-3">
            <h3 class="font-headline font-bold text-lg text-[#1d1b17]">Order Items (${store.cart.length})</h3>
            ${store.cart.map((item, index) => `
              <div class="bg-white p-3.5 rounded-2xl border border-[#e7e2db] flex items-center justify-between gap-3 shadow-sm">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-xl object-cover" />
                
                <div class="flex-1">
                  <h4 class="font-headline font-bold text-sm text-[#1d1b17] line-clamp-1">${item.name}</h4>
                  <p class="text-xs text-[#58423c]">${item.optionsText}</p>
                  <span class="font-headline font-bold text-sm text-[#a33818] block mt-1">€${(item.price * item.quantity).toFixed(2)}</span>
                </div>

                <div class="flex items-center bg-[#f3ede6] rounded-xl p-1">
                  <button onclick="store.updateQuantity(${index}, -1)" class="w-7 h-7 rounded-lg bg-white font-bold text-sm shadow-sm">-</button>
                  <span class="w-8 text-center font-bold text-xs">${item.quantity}</span>
                  <button onclick="store.updateQuantity(${index}, 1)" class="w-7 h-7 rounded-lg bg-white font-bold text-sm shadow-sm">+</button>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Promo Code Section -->
          <div class="bg-white p-4 rounded-2xl border border-[#e7e2db] shadow-sm">
            <label class="text-xs font-bold text-[#58423c] uppercase tracking-wider block mb-2">Have a Promo Code?</label>
            <div class="flex gap-2">
              <input type="text" 
                     id="promo-input" 
                     placeholder="e.g. MARHABA20" 
                     value="${store.appliedPromo || ''}"
                     class="flex-1 px-4 py-2.5 bg-[#f3ede6] rounded-xl text-sm font-semibold uppercase focus:outline-none" />
              <button onclick="applyPromoCode()" class="px-5 py-2.5 bg-[#1d1b17] text-white font-bold rounded-xl text-xs uppercase hover:bg-black">
                Apply
              </button>
            </div>
            ${store.appliedPromo ? `
              <p class="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">check_circle</span> Promo '${store.appliedPromo}' applied!
              </p>
            ` : ''}
          </div>

          <!-- Delivery Address -->
          <div class="bg-white p-4 rounded-2xl border border-[#e7e2db] shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-[#58423c] uppercase tracking-wider">Delivery Address</span>
              <button class="text-xs font-bold text-[#a33818]">Edit</button>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-[#ffdbd1] text-[#862303] flex items-center justify-center">
                <span class="material-symbols-outlined text-xl">location_on</span>
              </div>
              <div>
                <p class="font-headline font-bold text-sm text-[#1d1b17]">Home</p>
                <p class="text-xs text-[#58423c]">Rua Almirante Gago Coutinho, Amadora</p>
              </div>
            </div>
          </div>

          <!-- Payment Method -->
          <div class="bg-white p-4 rounded-2xl border border-[#e7e2db] shadow-sm">
            <span class="text-xs font-bold text-[#58423c] uppercase tracking-wider block mb-3">Select Payment Method</span>
            <div class="grid grid-cols-3 gap-2">
              <button onclick="setPaymentMethod('Card')" class="p-3 rounded-xl border-2 border-[#a33818] bg-[#ffdbd1]/30 flex flex-col items-center gap-1">
                <span class="material-symbols-outlined text-[#a33818]">credit_card</span>
                <span class="text-[11px] font-bold text-[#1d1b17]">Card</span>
              </button>
              <button onclick="setPaymentMethod('MB Way')" class="p-3 rounded-xl border border-[#e7e2db] bg-[#f3ede6] flex flex-col items-center gap-1">
                <span class="material-symbols-outlined text-[#58423c]">phone_iphone</span>
                <span class="text-[11px] font-bold text-[#1d1b17]">MB Way</span>
              </button>
              <button onclick="setPaymentMethod('Cash')" class="p-3 rounded-xl border border-[#e7e2db] bg-[#f3ede6] flex flex-col items-center gap-1">
                <span class="material-symbols-outlined text-[#58423c]">payments</span>
                <span class="text-[11px] font-bold text-[#1d1b17]">Cash</span>
              </button>
            </div>
          </div>

          <!-- Price Summary Breakdown -->
          <div class="bg-white p-4 rounded-2xl border border-[#e7e2db] shadow-sm space-y-2">
            <div class="flex justify-between text-sm text-[#58423c]">
              <span>Subtotal</span>
              <span>€${subtotal.toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-sm text-[#58423c]">
              <span>Delivery Fee</span>
              <span>€${store.deliveryFee.toFixed(2)}</span>
            </div>
            ${discount > 0 ? `
              <div class="flex justify-between text-sm text-emerald-600 font-bold">
                <span>Discount</span>
                <span>-€${discount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="pt-2 border-t border-[#e7e2db] flex justify-between text-lg font-headline font-bold text-[#1d1b17]">
              <span>Total</span>
              <span class="text-[#a33818]">€${total.toFixed(2)}</span>
            </div>
          </div>

          <!-- Confirm Order CTA -->
          <button onclick="store.createOrder()" class="w-full h-14 bg-[#a33818] hover:bg-[#862303] text-white font-headline font-bold text-lg rounded-xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
            <span class="material-symbols-outlined">check_circle</span> Place Order • €${total.toFixed(2)}
          </button>
        `}
      </main>
    </div>
  `;
}

function applyPromoCode() {
  const input = document.getElementById("promo-input");
  if (!input) return;
  const res = store.applyPromo(input.value);
  showToast(res.message, !res.success);
}

function setPaymentMethod(method) {
  showToast(`Payment method set to ${method}`);
}

// 6. Order Confirmed Celebration View
function renderOrderConfirmedView() {
  const order = store.activeOrder;
  if (!order) {
    store.setView("home");
    return "";
  }

  return `
    <div class="view-container min-h-screen flex flex-col justify-center items-center px-margin-mobile text-center py-12">
      <div class="w-24 h-24 rounded-full bg-[#ffdbd1] text-[#a33818] flex items-center justify-center mb-6 animate-bounce shadow-lg">
        <span class="material-symbols-outlined text-6xl">celebration</span>
      </div>

      <h1 class="font-headline font-extrabold text-3xl text-[#1d1b17] mb-2">Order Confirmed!</h1>
      <p class="text-sm text-[#58423c] mb-6 max-w-xs">Your order <span class="font-bold text-[#1d1b17]">#${order.orderId}</span> has been sent to our master grill chef.</p>

      <div class="bg-white p-5 rounded-2xl border border-[#e7e2db] shadow-md w-full max-w-sm text-left mb-8 space-y-3">
        <div class="flex justify-between items-center pb-3 border-b border-[#f3ede6]">
          <span class="text-xs text-[#58423c] font-bold uppercase">Estimated Delivery</span>
          <span class="font-headline font-bold text-lg text-[#a33818]">${order.estimatedMinutes} Minutes</span>
        </div>

        <div class="flex items-center gap-3">
          <img src="${order.driver.image}" class="w-12 h-12 rounded-full object-cover border-2 border-[#a33818]" />
          <div>
            <h4 class="font-headline font-bold text-sm text-[#1d1b17]">${order.driver.name}</h4>
            <p class="text-xs text-[#58423c]">${order.driver.vehicle}</p>
          </div>
        </div>
      </div>

      <button onclick="store.setView('order-status')" class="w-full max-w-sm h-14 bg-[#a33818] hover:bg-[#862303] text-white font-headline font-bold text-base rounded-xl shadow-lg flex items-center justify-center gap-2">
        <span class="material-symbols-outlined">map</span> Track Live Order Status
      </button>
    </div>
  `;
}

// 7. Live Order Status Tracker View
function renderOrderStatusView() {
  const order = store.activeOrder;
  if (!order) {
    return `
      <div class="view-container py-24 text-center px-margin-mobile">
        <span class="material-symbols-outlined text-6xl text-[#8b716a] mb-3">no_food</span>
        <h3 class="font-headline font-bold text-xl text-[#1d1b17] mb-2">No active orders</h3>
        <button onclick="store.setView('menu')" class="px-6 py-3 bg-[#a33818] text-white font-bold rounded-xl text-sm">Order Food Now</button>
      </div>
    `;
  }

  const stages = [
    { id: 1, title: "Order Confirmed", desc: "Received at Marhaba Grill kitchen" },
    { id: 2, title: "Preparing on Flaming Charcoal", desc: "Chef is grilling your selection" },
    { id: 3, title: "Out for Delivery", desc: `${order.driver.name} is on the way` },
    { id: 4, title: "Delivered", desc: "Enjoy your hot meal!" }
  ];

  return `
    <div class="view-container pb-28 pt-16">
      <header class="fixed top-0 w-full z-40 glass-header pt-safe">
        <div class="h-16 px-margin-mobile flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button onclick="store.setView('home')" class="w-9 h-9 rounded-full bg-[#f3ede6] flex items-center justify-center text-[#1d1b17]">
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 class="font-headline font-bold text-xl text-[#1d1b17]">Live Order Tracker</h1>
          </div>
          <span class="px-3 py-1 bg-[#ffdbd1] text-[#862303] text-xs font-bold rounded-full">#${order.orderId}</span>
        </div>
      </header>

      <main class="px-margin-mobile mt-4 flex flex-col gap-6">
        <!-- Live ETA Card -->
        <div class="bg-[#1d1b17] text-white p-6 rounded-3xl shadow-xl flex items-center justify-between">
          <div>
            <span class="text-xs font-bold text-white/70 uppercase tracking-wider">Estimated Delivery</span>
            <h2 class="font-headline font-extrabold text-3xl text-[#ffdbd1] mt-1">${order.estimatedMinutes} Mins</h2>
            <p class="text-xs text-white/80 mt-1">Order placed at ${order.createdAt}</p>
          </div>
          <div class="w-14 h-14 rounded-full bg-[#a33818] flex items-center justify-center pulse-badge">
            <span class="material-symbols-outlined text-3xl">two_wheeler</span>
          </div>
        </div>

        <!-- Order Timeline Progress -->
        <div class="bg-white p-6 rounded-3xl border border-[#e7e2db] shadow-sm">
          <h3 class="font-headline font-bold text-lg text-[#1d1b17] mb-6">Order Status Timeline</h3>

          <div class="space-y-6 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#e7e2db]">
            ${stages.map(stage => {
              const isPassed = order.statusStage >= stage.id;
              const isCurrent = order.statusStage === stage.id;
              return `
                <div class="flex items-start gap-4 relative z-10">
                  <div class="w-8 h-8 rounded-full ${isPassed ? "bg-[#a33818] text-white" : "bg-[#e7e2db] text-[#58423c]"} flex items-center justify-center font-bold text-xs shadow-sm">
                    ${isPassed ? '<span class="material-symbols-outlined text-sm">check</span>' : stage.id}
                  </div>
                  <div>
                    <h4 class="font-headline font-bold text-base ${isCurrent ? "text-[#a33818]" : "text-[#1d1b17]"}">${stage.title}</h4>
                    <p class="text-xs text-[#58423c]">${stage.desc}</p>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Driver Info Card -->
        <div class="bg-white p-4 rounded-2xl border border-[#e7e2db] shadow-sm flex items-center justify-between">
          <div class="flex items-center gap-3">
            <img src="${order.driver.image}" class="w-12 h-12 rounded-full object-cover border-2 border-[#a33818]" />
            <div>
              <h4 class="font-headline font-bold text-sm text-[#1d1b17]">${order.driver.name}</h4>
              <p class="text-xs text-[#58423c]">${order.driver.vehicle}</p>
            </div>
          </div>
          <a href="tel:${order.driver.phone}" class="w-10 h-10 rounded-full bg-[#ffdbd1] text-[#862303] flex items-center justify-center font-bold">
            <span class="material-symbols-outlined">call</span>
          </a>
        </div>
      </main>
    </div>
  `;
}

// 8. Rewards View
function renderRewardsView() {
  return `
    <div class="view-container pb-28 pt-16">
      <header class="fixed top-0 w-full z-40 glass-header pt-safe">
        <div class="h-16 px-margin-mobile flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button onclick="store.setView('home')" class="w-9 h-9 rounded-full bg-[#f3ede6] flex items-center justify-center text-[#1d1b17]">
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 class="font-headline font-bold text-xl text-[#1d1b17]">Marhaba Rewards</h1>
          </div>
        </div>
      </header>

      <main class="px-margin-mobile mt-4 flex flex-col gap-6">
        <div class="bg-gradient-to-br from-[#a33818] to-[#862303] text-white p-6 rounded-3xl shadow-xl">
          <div class="flex justify-between items-center mb-4">
            <span class="text-xs font-bold uppercase tracking-widest opacity-80">Available Balance</span>
            <span class="material-symbols-outlined text-2xl">stars</span>
          </div>
          <h2 class="font-headline font-extrabold text-4xl mb-2">${store.rewardsPoints} Points</h2>
          <p class="text-xs text-white/80">Earn 10 points for every €1 spent on orders.</p>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-[#e7e2db] shadow-sm">
          <h3 class="font-headline font-bold text-base text-[#1d1b17] mb-3">Claim Your Rewards</h3>
          
          <div class="space-y-3">
            <div class="flex justify-between items-center p-3 rounded-xl bg-[#f3ede6]">
              <div>
                <h4 class="font-bold text-sm text-[#1d1b17]">Free Cheesy Garlic Bread</h4>
                <p class="text-xs text-[#58423c]">500 Points</p>
              </div>
              <button onclick="showToast('Redeemed Free Garlic Bread!')" class="px-3 py-1.5 bg-[#a33818] text-white text-xs font-bold rounded-lg">Redeem</button>
            </div>

            <div class="flex justify-between items-center p-3 rounded-xl bg-[#f3ede6]">
              <div>
                <h4 class="font-bold text-sm text-[#1d1b17]">€10 Off Any Order</h4>
                <p class="text-xs text-[#58423c]">1,000 Points</p>
              </div>
              <button onclick="showToast('Redeemed €10 Voucher!')" class="px-3 py-1.5 bg-[#a33818] text-white text-xs font-bold rounded-lg">Redeem</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
}
