const express = require('express');
const { Spot } = require('@binance/connector');

const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());

const getClient = (apiKey, secretKey) => {
    return new Spot(apiKey, secretKey, { baseURL: 'https://testnet.binance.vision/' });
};

// Helper function to validate API keys in headers
const validateHeaders = (req, res, next) => {
    const { binanceapikey, binancesecretkey } = req.headers;
    if (!binanceapikey || !binancesecretkey) {
        return res.status(400).json({ message: "API key and secret key are required in headers" });
    }
    req.client = getClient(binanceapikey, binancesecretkey);
    next();
};

// Route to place a market order
app.post('/place-order', validateHeaders, async (req, res) => {
    const { symbol, quantity, quoteOrderQty } = req.body;

    if (!symbol || (!quantity && !quoteOrderQty)) {
        return res.status(400).json({ message: "Symbol and either quantity or quoteOrderQty are required" });
    }

    try {
        const order = await req.client.newOrder(symbol, 'BUY', 'MARKET', {
            quantity: quantity || undefined,
            quoteOrderQty: quoteOrderQty || undefined
        });
        res.json({ message: "Order placed successfully!", data: order.data });
    } catch (error) {
        res.status(500).json({ message: "Error placing order", error: error.message });
    }
});

// Route to place a limit order
app.post('/place-limit-order', validateHeaders, async (req, res) => {
    const { symbol, price, quantity, timeInForce = 'GTC' } = req.body;

    if (!symbol || !price || !quantity) {
        return res.status(400).json({ message: "Symbol, price, and quantity are required" });
    }

    try {
        const order = await req.client.newOrder(symbol, 'BUY', 'LIMIT', {
            price: price.toFixed(2),
            quantity: quantity.toFixed(2),
            timeInForce
        });
        res.json({ message: "Limit order placed successfully!", data: order.data });
    } catch (error) {
        res.status(500).json({ message: "Error placing limit order", error: error.message });
    }
});

// Route to fetch account balances
app.get('/fetch-balances', validateHeaders, async (req, res) => {
    try {
        const response = await req.client.account();
        const balances = response.data.balances.filter(balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0);
        res.json({ message: "Balances fetched successfully", balances });
    } catch (error) {
        res.status(500).json({ message: "Error fetching balances", error: error.message });
    }
});

// Route to fetch open orders for a symbol
app.get('/open-orders/:symbol', validateHeaders, async (req, res) => {
    const { symbol } = req.params;

    try {
        const openOrders = await req.client.openOrders({ symbol });
        res.json({ message: "Open orders fetched successfully", data: openOrders.data });
    } catch (error) {
        res.status(500).json({ message: "Error fetching open orders", error: error.message });
    }
});

// Route to fetch all orders for a symbol
app.get('/all-orders/:symbol', validateHeaders, async (req, res) => {
    const { symbol } = req.params;
    const { orderId } = req.query;

    try {
        const allOrders = await req.client.allOrders(symbol, { orderId: orderId || undefined });
        res.json({ message: "All orders fetched successfully", data: allOrders.data });
    } catch (error) {
        res.status(500).json({ message: "Error fetching all orders", error: error.message });
    }
});

// Route to cancel a specific order
app.delete('/cancel-order/:symbol', validateHeaders, async (req, res) => {
    const { symbol } = req.params;
    const { orderId } = req.query;

    if (!orderId) {
        return res.status(400).json({ message: "orderId is required" });
    }

    try {
        const cancelOrder = await req.client.cancelOrder(symbol, orderId);
        res.json({ message: "Order canceled successfully", data: cancelOrder.data });
    } catch (error) {
        res.status(500).json({ message: "Error canceling order", error: error.message });
    }
});

// Route to cancel all open orders for a symbol
app.delete('/cancel-open-orders/:symbol', validateHeaders, async (req, res) => {
    const { symbol } = req.params;

    try {
        const openOrders = await req.client.openOrders({ symbol });
        const cancelPromises = openOrders.data.map(order => req.client.cancelOrder(symbol, order.orderId));
        await Promise.all(cancelPromises);

        res.json({ message: "All open orders canceled successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error canceling open orders", error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
