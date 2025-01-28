// server.js
const express = require('express');
const cors = require('cors');

const { faker } = require('@faker-js/faker');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory ticket storage (replace with database in production)
let tickets = [];

// Generate some initial fake tickets
function generateTicket() {
    const categories = ['Login', 'Billing', 'Technical', 'Other'];
    const priorities = ['Low', 'Medium', 'High', 'Critical'];
    const statuses = ['Open', 'In Progress', 'Resolved'];

    return {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        description: faker.lorem.paragraph(),
        category: faker.helpers.arrayElement(categories),
        priority: faker.helpers.arrayElement(priorities),
        status: faker.helpers.arrayElement(statuses),
        created_at: faker.date.recent(),
        user_email: faker.internet.email(),
        agent_assigned: Math.random() > 0.3 ? faker.person.fullName() : null,
        resolved_at: null
    };
}

// Generate initial tickets
for (let i = 0; i < 20; i++) {
    tickets.push(generateTicket());
}

// Routes
app.post('/api/tickets', async (req, res) => {
    try {
        const { name, description, user_email } = req.body;
        
        // Create new ticket
        const newTicket = {
            id: faker.string.uuid(),
            name,
            description,
            user_email,
            category: 'Other', // Will be updated by AI
            priority: 'Medium',
            status: 'Open',
            created_at: new Date(),
            agent_assigned: null,
            resolved_at: null
        };

        // Auto-categorize ticket (simplified for MVP)
        const keywords = {
            Login: ['login', 'password', 'account', 'authentication'],
            Billing: ['payment', 'invoice', 'charge', 'subscription'],
            Technical: ['error', 'bug', 'crash', 'not working'],
            Other: []
        };

        for (const [category, words] of Object.entries(keywords)) {
            if (words.some(word => 
                description.toLowerCase().includes(word)
            )) {
                newTicket.category = category;
                break;
            }
        }

        tickets.push(newTicket);
        res.status(201).json(newTicket);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/tickets', (req, res) => {
    const { status, category } = req.query;
    let filteredTickets = [...tickets];

    if (status) {
        filteredTickets = filteredTickets.filter(t => t.status === status);
    }
    if (category) {
        filteredTickets = filteredTickets.filter(t => t.category === category);
    }

    res.json(filteredTickets);
});

app.get('/api/analytics', (req, res) => {
    const resolvedTickets = tickets.filter(t => t.status === 'Resolved');
    const analytics = {
        total_tickets: tickets.length,
        open_tickets: tickets.filter(t => t.status === 'Open').length,
        avg_resolution_time: resolvedTickets.length ? 
            resolvedTickets.reduce((acc, t) => 
                acc + (t.resolved_at - t.created_at), 0) / resolvedTickets.length / (1000 * 3600) // in hours
            : 0,
        tickets_by_category: tickets.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + 1;
            return acc;
        }, {})
    };
    
    res.json(analytics);
});

app.put('/api/tickets/:id', (req, res) => {
    const ticket = tickets.find(t => t.id === req.params.id);
    if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
    }

    Object.assign(ticket, req.body);
    if (req.body.status === 'Resolved' && !ticket.resolved_at) {
        ticket.resolved_at = new Date();
    }

    res.json(ticket);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});