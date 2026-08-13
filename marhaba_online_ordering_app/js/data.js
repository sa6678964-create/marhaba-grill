// Marhaba Online Food Ordering - Data Store
const MARHABA_DATA = {
  categories: [
    {
      id: "all",
      name: "All Items",
      icon: "restaurant_menu",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRQzCqgsCzWSjCY5hrfCM4yNRLK2DwYX6fxEz4tX4tgbUEf69-f8J2NjEe2owEx0aO8iYgAUlDod97TI-7zp193-QDimSZIFPOMpefrKhW3JmVkq-oO_f9eyRjUdKpW75_RYjH505Ilxkz9i2bCOR7WeA2q_lPqMX2DGd1TGYf3KYDRsuL24eii-_noDckhr5JQs8EZxue7JqXLU4ZeLfQNNlNDjTJLoHfs7iyYwzeAELyEK-ILctY"
    },
    {
      id: "grill",
      name: "Grill & Kebab",
      icon: "local_fire_department",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRQzCqgsCzWSjCY5hrfCM4yNRLK2DwYX6fxEz4tX4tgbUEf69-f8J2NjEe2owEx0aO8iYgAUlDod97TI-7zp193-QDimSZIFPOMpefrKhW3JmVkq-oO_f9eyRjUdKpW75_RYjH505Ilxkz9i2bCOR7WeA2q_lPqMX2DGd1TGYf3KYDRsuL24eii-_noDckhr5JQs8EZxue7JqXLU4ZeLfQNNlNDjTJLoHfs7iyYwzeAELyEK-ILctY"
    },
    {
      id: "pizza",
      name: "Artisan Pizza",
      icon: "local_pizza",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlOYgCHhYtjAjQNWx-GrmWwxoHRRfxvNWfEXh0UCMRDZQsDBIrRNGgMWQSHo4jyCok0vd_Xozsyjmnzwd1KX4BEwIOm8-aQK7MXv1HAD8p4WTR5TKcvOc1PwPZ_0vNL2vqg-WeP0yEiwTB8R8O7Rfhn-8yjQ94oIs6z1PegIti5peG-EtDguNX5cSsEWXTyheTResAuYlcW4WTim9ZXI2Kq78DP59aAWSYoZ637MP-Lnzq7Qf7Ii8o"
    },
    {
      id: "continental",
      name: "Continental",
      icon: "dinner_dining",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOEFLt27W1WM6qeFI5Zs3dznD6gXyZrZTf8nPHXx8aAudqtUSkPXgREhY5pWpzSRq-IYF3p77Hfm1em-xS6fyZQqw_NO-8cxyBaShnbM0wVk9J7Xfwk7b56FqPGSbyHlIOQLV6JSs65SBOTvcoofpeyhsqb3K_ahuntNEfGpGe7btOYShPsRiJZfalB2JbYES_V9CfpAgZFhKF2-lpJ3KBdMXTJwB5b07vP4Jfdvgoecy_zCzMRTyd"
    },
    {
      id: "sides",
      name: "Sides & Extras",
      icon: "tapas",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBJWTH0ng-hBTGj1gBvVBjApi1tS4NITQDMyvfmkbOFhAOuoZBqGJJGYcSoZzLWZA3DW-A9_rPURBERN4kVYX0Lspfj71-X7SDoH5cMnmm9lq1qYV4Euy5rgQ9vIcthtNBYs8xCxQBsCRHOiK_ml5jfsazWnukRaUTScXG_fxhkd3lWhxZ1bFtlUKFgc6S8zHJdOiYRjLWYXqczfW2aQTjFRZCyT-osu6yfecKphdQ6JD83dDBe4W3T"
    },
    {
      id: "drinks",
      name: "Beverages",
      icon: "local_bar",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBvG0W84VM1zKRYyOKh292fDMUZq-T5esHszPLJqIDAji8ng6XNcwiCdEypM8QRDJS3NqGice0_r4TO_B1bye2-hePRSoCqbsIDfatZMD47VspzYOxMfRpoqQAvi-YdjDVJXW6VEMxNswoW9aANEPURLYfimKBzILw4KWn73KdJLgSF7UINStVaLOvjpwvcfAwnVfxKOoTSO07Gm5AO0QQi7K6ESSUwKTwdawCnVgLrWkwV_dZkVhMo"
    }
  ],

  items: [
    {
      id: "item-1",
      categoryId: "grill",
      name: "Royal Mixed Grill Platter",
      tagline: "Experience the authentic taste of the hearth",
      description: "Sizzling lamb chops, succulent chicken shish tawook, and spiced minced kafta kebabs. Served on garlic flatbread with grilled tomatoes, charred chili peppers, garlic toum, and sumac onions.",
      price: 24.50,
      rating: 4.9,
      reviewsCount: 342,
      badge: "Today's Special",
      isPopular: true,
      points: 250,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBiZyuNBk9MM91WR_3BnyWR14dySJTmSlc66RFUXEPx4tC4Az86j5vrScB3__BEf16y3Ya0tNZdPgteLnZt3SLVsetKVb3JYbfKoK0i7feGBKF29JF7PLxLweUiBoUEZTw9n2NUGtnznFBvfSeoQXiQPMS172TiTmPtPJjI7WEmd3wXHK6sfy349ZQ2VuUmTalgm7vBPoTmwit9p_cIWiFqMMVm9uNSuGzpmJvyjAiWZQpLZaQOuYR-",
      options: [
        { name: "Portion Size", type: "single", choices: [{ label: "Standard (Serves 1-2)", price: 0 }, { label: "Large Royal Platter (Serves 2-3)", price: 8.50 }] },
        { name: "Spice Level", type: "single", choices: [{ label: "Mild Classic", price: 0 }, { label: "Medium Spicy", price: 0 }, { label: "Extra Fiery Harissa", price: 0.50 }] },
        { name: "Extra Dips", type: "multi", choices: [{ label: "Garlic Toum Dip", price: 1.50 }, { label: "Hummus Dip", price: 2.00 }, { label: "Spicy Shatta Sauce", price: 1.00 }] }
      ]
    },
    {
      id: "item-2",
      categoryId: "grill",
      name: "Charcoal Shish Tawook",
      tagline: "Tender marinated chicken breast cubes",
      description: "Tender chicken breasts marinated in garlic, lemon, yogurt, and aromatic Mediterranean spices grilled over oak wood charcoal.",
      price: 18.00,
      rating: 4.8,
      reviewsCount: 215,
      badge: "Top Pick",
      isPopular: true,
      points: 180,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBvG0W84VM1zKRYyOKh292fDMUZq-T5esHszPLJqIDAji8ng6XNcwiCdEypM8QRDJS3NqGice0_r4TO_B1bye2-hePRSoCqbsIDfatZMD47VspzYOxMfRpoqQAvi-YdjDVJXW6VEMxNswoW9aANEPURLYfimKBzILw4KWn73KdJLgSF7UINStVaLOvjpwvcfAwnVfxKOoTSO07Gm5AO0QQi7K6ESSUwKTwdawCnVgLrWkwV_dZkVhMo",
      options: [
        { name: "Serving", type: "single", choices: [{ label: "With Rice & Salad", price: 0 }, { label: "With French Fries", price: 1.00 }] }
      ]
    },
    {
      id: "item-3",
      categoryId: "pizza",
      name: "Marhaba Signature Charcoal Pizza",
      tagline: "Stone-baked woodfire dough topped with smoked meats",
      description: "Artisan wood-fired pizza with charcoal smoked mozzarella, spiced lamb sausage, cherry tomatoes, fresh basil, and chili-infused honey drizzle.",
      price: 16.50,
      rating: 4.9,
      reviewsCount: 189,
      badge: "Chef's Special",
      isPopular: true,
      points: 165,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlOYgCHhYtjAjQNWx-GrmWwxoHRRfxvNWfEXh0UCMRDZQsDBIrRNGgMWQSHo4jyCok0vd_Xozsyjmnzwd1KX4BEwIOm8-aQK7MXv1HAD8p4WTR5TKcvOc1PwPZ_0vNL2vqg-WeP0yEiwTB8R8O7Rfhn-8yjQ94oIs6z1PegIti5peG-EtDguNX5cSsEWXTyheTResAuYlcW4WTim9ZXI2Kq78DP59aAWSYoZ637MP-Lnzq7Qf7Ii8o",
      options: [
        { name: "Crust Style", type: "single", choices: [{ label: "Thin Artisan Neapolitan", price: 0 }, { label: "Stuffed Garlic Crust", price: 2.50 }] }
      ]
    },
    {
      id: "item-4",
      categoryId: "continental",
      name: "Truffle & Herb Fettuccine",
      tagline: "Creamy parmesan pasta with wild mushrooms",
      description: "Fresh fettuccine pasta tossed in black truffle butter cream sauce, wild sautéed porcini mushrooms, Parmigiano-Reggiano, and fresh thyme.",
      price: 17.50,
      rating: 4.7,
      reviewsCount: 140,
      badge: "Vegetarian",
      isPopular: false,
      points: 175,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOEFLt27W1WM6qeFI5Zs3dznD6gXyZrZTf8nPHXx8aAudqtUSkPXgREhY5pWpzSRq-IYF3p77Hfm1em-xS6fyZQqw_NO-8cxyBaShnbM0wVk9J7Xfwk7b56FqPGSbyHlIOQLV6JSs65SBOTvcoofpeyhsqb3K_ahuntNEfGpGe7btOYShPsRiJZfalB2JbYES_V9CfpAgZFhKF2-lpJ3KBdMXTJwB5b07vP4Jfdvgoecy_zCzMRTyd",
      options: []
    },
    {
      id: "item-5",
      categoryId: "sides",
      name: "Cheesy Mozzarella Garlic Bread",
      tagline: "Golden crispy bread with garlic butter and herbs",
      description: "Freshly baked artisan baguette brushed with garlic parsley butter, topped with double layer melted mozzarella cheese.",
      price: 3.50,
      rating: 4.8,
      reviewsCount: 520,
      badge: "Must Try",
      isPopular: true,
      points: 35,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAzIs-yIc0IXlRNV6x0GduVbD36u7I1fpKPUkMuUEBctc_5gCEP_kpwm_lI4UeXvt1OrttTVGHKfo8VUeLpodpzi8LmUA1JWqScwBDWYaGR5mT3i3RV-Su_JQ5sHUSgB9rPGd_B34ylm0lhNHUTr-V51Gpp9MlYngUZ0QXZS5H0eBRkrnmmg1h7drUq-5cXFZRb-X9H1qifbWJP5mRyUsl9fC3Hg8T-GUcAq_mF1P9yLkxmZxF4ZTdz",
      options: []
    },
    {
      id: "item-6",
      categoryId: "sides",
      name: "Golden Hand-Cut Fries",
      tagline: "Crispy skin-on fries with sumac spice",
      description: "Crispy golden french fries dusted with Middle-Eastern sumac salt and served with homemade garlic toum.",
      price: 4.00,
      rating: 4.6,
      reviewsCount: 310,
      badge: "Popular",
      isPopular: false,
      points: 40,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBJWTH0ng-hBTGj1gBvVBjApi1tS4NITQDMyvfmkbOFhAOuoZBqGJJGYcSoZzLWZA3DW-A9_rPURBERN4kVYX0Lspfj71-X7SDoH5cMnmm9lq1qYV4Euy5rgQ9vIcthtNBYs8xCxQBsCRHOiK_ml5jfsazWnukRaUTScXG_fxhkd3lWhxZ1bFtlUKFgc6S8zHJdOiYRjLWYXqczfW2aQTjFRZCyT-osu6yfecKphdQ6JD83dDBe4W3T",
      options: []
    }
  ],

  promos: {
    "MARHABA20": { type: "percent", value: 20, description: "20% Off on your entire order" },
    "GRILL10": { type: "fixed", value: 10, description: "€10 Off on Orders above €30" },
    "FREEDEL": { type: "delivery", value: 0, description: "Free Delivery Fee" }
  },

  onboarding: [
    {
      step: 1,
      title: "Welcome to Marhaba Grill",
      subtitle: "Authentic hearth-cooked flavors delivered right to your doorstep with royal elegance.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBiZyuNBk9MM91WR_3BnyWR14dySJTmSlc66RFUXEPx4tC4Az86j5vrScB3__BEf16y3Ya0tNZdPgteLnZt3SLVsetKVb3JYbfKoK0i7feGBKF29JF7PLxLweUiBoUEZTw9n2NUGtnznFBvfSeoQXiQPMS172TiTmPtPJjI7WEmd3wXHK6sfy349ZQ2VuUmTalgm7vBPoTmwit9p_cIWiFqMMVm9uNSuGzpmJvyjAiWZQpLZaQOuYR-",
      tag: "Authentic & Fresh"
    },
    {
      step: 2,
      title: "Customized to Perfection",
      subtitle: "Tailor your spice levels, portion sizes, and extra dips with our interactive menu.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBvG0W84VM1zKRYyOKh292fDMUZq-T5esHszPLJqIDAji8ng6XNcwiCdEypM8QRDJS3NqGice0_r4TO_B1bye2-hePRSoCqbsIDfatZMD47VspzYOxMfRpoqQAvi-YdjDVJXW6VEMxNswoW9aANEPURLYfimKBzILw4KWn73KdJLgSF7UINStVaLOvjpwvcfAwnVfxKOoTSO07Gm5AO0QQi7K6ESSUwKTwdawCnVgLrWkwV_dZkVhMo",
      tag: "Interactive Customization"
    },
    {
      step: 3,
      title: "Live Order Tracking & Rewards",
      subtitle: "Follow your order live from the flaming grill to your door and earn points on every bite.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAzIs-yIc0IXlRNV6x0GduVbD36u7I1fpKPUkMuUEBctc_5gCEP_kpwm_lI4UeXvt1OrttTVGHKfo8VUeLpodpzi8LmUA1JWqScwBDWYaGR5mT3i3RV-Su_JQ5sHUSgB9rPGd_B34ylm0lhNHUTr-V51Gpp9MlYngUZ0QXZS5H0eBRkrnmmg1h7drUq-5cXFZRb-X9H1qifbWJP5mRyUsl9fC3Hg8T-GUcAq_mF1P9yLkxmZxF4ZTdz",
      tag: "Realtime Tracking"
    }
  ]
};
