import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Database demo per le pizzerie
const pizzerias = {
  'demo': {
    name: "Pizzeria Demo",
    slug: "demo",
    config: {
      theme: "classic",
      colors: {
        primary: "#e74c3c",
        secondary: "#f39c12",
        background: "#f8f9fa"
      },
      settings: {
        currency: "€",
        language: "it",
        deliveryFee: 2.50
      }
    },
    info: {
      phone: "📞 0123 456789",
      address: "📍 Via Roma 123, Milano",
      email: "info@pizzeriademo.it"
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
              description: "Pomodoro, aglio, origano, olio",
              price: 5.00,
              ingredients: ["pomodoro", "aglio", "origano", "olio"],
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
  },
  'marios-pizza': {
    name: "Mario's Pizza",
    slug: "marios-pizza", 
    config: {
      theme: "classic",
      colors: {
        primary: "#27ae60",
        secondary: "#2ecc71",
        background: "#ecf0f1"
      },
      settings: {
        currency: "€",
        deliveryFee: 3.00
      }
    },
    info: {
      phone: "📞 0987 654321",
      address: "📍 Piazza Duomo 1, Milano"
    },
    menu: {
      categories: [
        {
          name: "Le Nostre Pizze",
          items: [
            {
              name: "Mario Special",
              description: "Pomodoro, mozzarella di bufala, prosciutto crudo, rucola",
              price: 12.00,
              ingredients: ["pomodoro", "mozzarella di bufala", "prosciutto crudo", "rucola"],
              extras: [
                { name: "Tartufo", price: 3.00 }
              ],
              available: true
            }
          ]
        }
      ]
    }
  }
};

// API: Carica configurazione pizzeria
app.get('/api/:slug', (req, res) => {
  const slug = req.params.slug;
  const pizzeria = pizzerias[slug] || pizzerias['demo'];
  
  if (pizzeria) {
    res.json(pizzeria);
  } else {
    res.status(404).json({ error: 'Pizzeria non trovata' });
  }
});

// API: Crea nuovo ordine
app.post('/api/:slug/orders', (req, res) => {
  const slug = req.params.slug;
  const pizzeria = pizzerias[slug] || pizzerias['demo'];
  
  if (!pizzeria) {
    return res.status(404).json({ error: 'Pizzeria non trovata' });
  }

  const orderData = req.body;
  
  // Genera numero ordine univoco
  const orderNumber = `ORD${Date.now()}`;
  
  console.log('🎯 NUOVO ORDINE RICEVUTO:');
  console.log('Pizzeria:', pizzeria.name);
  console.log('Ordine n:', orderNumber);
  console.log('Cliente:', orderData.customer?.name);
  console.log('Totale:', orderData.total);
  console.log('---');
  
  // Simula elaborazione
  setTimeout(() => {
    res.json({
      success: true,
      orderNumber: orderNumber,
      message: `Ordine ricevuto! La pizzeria ${pizzeria.name} ti contatterà presto.`,
      estimatedTime: "30-40 minuti"
    });
  }, 1000);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Pizza SaaS API',
    timestamp: new Date().toISOString(),
    pizzerias: Object.keys(pizzerias).length
  });
});

// Avvio server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('🍕 Pizza SaaS Server Avviato!');
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}/api/:slug`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
  console.log('Pizzerie disponibili:', Object.keys(pizzerias).join(', '));
});
