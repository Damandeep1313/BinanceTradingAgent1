const express = require('express');
const { Spot } = require('@binance/connector');

const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());

app.post('/place-order', async (req, res) => {
    const { binanceApiKey, binanceSecretKey } = req.headers;
    const { symbol, quantity, quoteOrderQty } = req.body;

    if (!binanceApiKey || !binanceSecretKey) {
        return res.status(400).json({ message: "API key and secret key are required in headers" });
    }

    if (!quantity && !quoteOrderQty) {
        return res.status(400).json({ message: "Either quantity or quoteOrderQty must be provided" });
    }

    const client = new Spot(binanceApiKey, binanceSecretKey, { baseURL: 'https://testnet.binance.vision/' });

    try {
        const order = await client.newOrder(symbol, 'BUY', 'MARKET', {
            quantity: quantity || undefined,
            quoteOrderQty: quoteOrderQty || undefined
        });
        res.json({ message: "Order placed successfully!", data: order.data });
    } catch (error) {
        res.status(500).json({ message: "Error placing order", error: error.message });
    }
});

app.post('/place-limit-order', async (req, res) => {
    const { binanceApiKey, binanceSecretKey } = req.headers;
    const { symbol, price, quantity, timeInForce = 'GTC' } = req.body;

    if (!binanceApiKey || !binanceSecretKey) {
        return res.status(400).json({ message: "API key and secret key are required in headers" });
    }

    if (!symbol || !price || !quantity) {
        return res.status(400).json({ message: "symbol, price, and quantity are required" });
    }

    const client = new Spot(binanceApiKey, binanceSecretKey, { baseURL: 'https://testnet.binance.vision/' });

    try {
        const order = await client.newOrder(symbol, 'BUY', 'LIMIT', {
            price: price.toFixed(2),
            quantity: quantity.toFixed(2),
            timeInForce
        });
        res.json({ message: "Limit order placed successfully!", data: order.data });
    } catch (error) {
        res.status(500).json({ message: "Error placing limit order", error: error.message });
    }
});

app.get('/fetch-balances', async (req, res) => {
    const { binanceApiKey, binanceSecretKey } = req.headers;

    if (!binanceApiKey || !binanceSecretKey) {
        return res.status(400).json({ message: "API key and secret key are required in headers" });
    }

    const client = new Spot(binanceApiKey, binanceSecretKey, { baseURL: 'https://testnet.binance.vision/' });

    try {
        const response = await client.account();
        const balances = response.data.balances.filter(balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0);
        res.json({ message: "Balances fetched successfully", balances });
    } catch (error) {
        res.status(500).json({ message: "Error fetching balances", error: error.message });
    }
});

app.get('/open-orders/:symbol', async (req, res) => {
    const { binanceApiKey, binanceSecretKey } = req.headers;
    const { symbol } = req.params;

    if (!binanceApiKey || !binanceSecretKey) {
        return res.status(400).json({ message: "API key and secret key are required in headers" });
    }

    const client = new Spot(binanceApiKey, binanceSecretKey, { baseURL: 'https://testnet.binance.vision/' });

    try {
        const openOrders = await client.openOrders({ symbol });
        res.json({ message: "Open orders fetched successfully", data: openOrders.data });
    } catch (error) {
        res.status(500).json({ message: "Error fetching open orders", error: error.message });
    }
});

app.get('/all-orders/:symbol', async (req, res) => {
    const { binanceApiKey, binanceSecretKey } = req.headers;
    const { symbol } = req.params;
    const { orderId } = req.query;

    if (!binanceApiKey || !binanceSecretKey) {
        return res.status(400).json({ message: "API key and secret key are required in headers" });
    }

    const client = new Spot(binanceApiKey, binanceSecretKey, { baseURL: 'https://testnet.binance.vision/' });

    try {
        const allOrders = await client.allOrders(symbol, { orderId: orderId || undefined });
        res.json({ message: "All orders fetched successfully", data: allOrders.data });
    } catch (error) {
        res.status(500).json({ message: "Error fetching all orders", error: error.message });
    }
});

app.delete('/cancel-order/:symbol', async (req, res) => {
    const { binanceApiKey, binanceSecretKey } = req.headers;
    const { symbol } = req.params;
    const { orderId } = req.query;

    if (!binanceApiKey || !binanceSecretKey) {
        return res.status(400).json({ message: "API key and secret key are required in headers" });
    }

    if (!orderId) {
        return res.status(400).json({ message: "orderId is required" });
    }

    const client = new Spot(binanceApiKey, binanceSecretKey, { baseURL: 'https://testnet.binance.vision/' });

    try {
        const cancelOrder = await client.cancelOrder(symbol, orderId);
        res.json({ message: "Order canceled successfully", data: cancelOrder.data });
    } catch (error) {
        res.status(500).json({ message: "Error canceling order", error: error.message });
    }
});

app.delete('/cancel-open-orders/:symbol', async (req, res) => {
    const { binanceApiKey, binanceSecretKey } = req.headers;
    const { symbol } = req.params;

    if (!binanceApiKey || !binanceSecretKey) {
        return res.status(400).json({ message: "API key and secret key are required in headers" });
    }

    const client = new Spot(binanceApiKey, binanceSecretKey, { baseURL: 'https://testnet.binance.vision/' });

    try {
        const openOrders = await client.openOrders({ symbol });
        const cancelPromises = openOrders.data.map(order => client.cancelOrder(symbol, order.orderId));
        await Promise.all(cancelPromises);

        res.json({ message: "All open orders canceled successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error canceling open orders", error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
