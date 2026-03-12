const { Client } = require('pg');

const connectionString = 'postgresql://postgres:rohit5237@localhost:5432/restaurant_db?schema=public';

const client = new Client({
    connectionString: connectionString,
});

async function cleanup() {
    console.log('Connecting to database via pg...');
    try {
        await client.connect();
        console.log('Connected!');

        // Get IDs of pending orders first
        const resOrders = await client.query("SELECT id FROM orders WHERE status = 'pending'");
        const orderIds = resOrders.rows.map(row => `'${row.id}'`).join(',');

        if (orderIds.length > 0) {
            console.log(`Found ${resOrders.rowCount} pending orders. Cleaning dependencies...`);

            // 1. Delete Payment Transactions
            await client.query(`DELETE FROM payment_transactions WHERE order_id IN (${orderIds})`);
            console.log('Deleted related payment transactions.');

            // 2. Delete Order Items
            await client.query(`DELETE FROM order_items WHERE order_id IN (${orderIds})`);
            console.log('Deleted related order items.');

            // 3. Delete Delivery Details
            await client.query(`DELETE FROM delivery_details WHERE order_id IN (${orderIds})`);
            console.log('Deleted related delivery details.');

            // 4. Finally Delete Orders
            const res = await client.query(`DELETE FROM orders WHERE id IN (${orderIds})`);
            console.log(`Successfully deleted ${res.rowCount} pending orders.`);
        } else {
            console.log('No pending orders found.');
        }

    } catch (err) {
        console.error('Error executing query', err.stack);
    } finally {
        await client.end();
    }
}

cleanup();
