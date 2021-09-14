import express from 'express';
import mysql from 'mysql2';
import util from 'util';
import dotenv from 'dotenv';
import { URL } from 'url';

const app = express();
dotenv.config();

app.set('view engine', 'ejs');

const __dirname = new URL('.', import.meta.url).pathname;
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({extended : false}));

const conn = mysql.createConnection({
    host: "localhost",
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: "cms"
});

const query = util.promisify(conn.query).bind(conn);

conn.connect((error) => {
    if(error){
      console.log(error);
    }else{
      console.log('Connected!');
    }
});

app.get('/', async (req, res) => {
    try{
        const customers_num = await query("SELECT COUNT(*) as count FROM customers");
        const products_num = await query("SELECT COUNT(*) as count FROM products");
        const orders_num = await query("SELECT COUNT(*) count FROM orders");
        const total_sales = await query(`SELECT orders.product_id, products.price, orders.quantity
                                        FROM orders, products
                                        WHERE orders.product_id = products.product_id`);
        let total = 0;
        total_sales.forEach((item) => { total += item.price * item.quantity })

        res.render('index', {customers_num:customers_num, products_num:products_num, 
                            orders_num:orders_num, total:total.toFixed(2)});
    } catch (error) {
        throw error;
    }
});


app.get('/customers', async (req, res) => {
    try{
        const customers = await query("SELECT * FROM customers");

        res.render('customers', {customers:customers});
    } catch (error) {
        throw error;
    }
});


app.get('/customer/add', (req, res) => {
    res.render('add_customer');
})


app.post('/customer/add', async (req, res) => {
    var name = req.body.name;
    var email = req.body.email;
    var phone = req.body.phone;
    var city = req.body.city;
    var street = req.body.street;
    var zipcode = req.body.zipcode;

    let sql = `INSERT INTO customers (name, email, phone, city, street, zipcode) 
    VALUES('${name}', '${email}', '${phone}', '${city}', '${street}', '${zipcode}')`;

    try{
        await query(sql);

        res.redirect('/customers');
    } catch (error) {
        throw error;
    }
});


app.post('/customer/delete/:customer_id', async (req, res) => {
    let sql = `DELETE FROM customers WHERE customer_id = ${req.params.customer_id}`;

    try{
        await query(sql);

        res.redirect('/customers');
    } catch (error) {
        throw error;
    }
});


app.get('/customer/edit/:customer_id', async (req, res) => {
    let sql = `SELECT * FROM customers WHERE customer_id = ${req.params.customer_id}`;

    try{
        const customer = await query(sql);

        res.render('edit_customer',{customer:customer[0]});
    } catch (error) {
        throw error;
    }
});


app.post('/customer/edit/:customer_id', async (req, res) => {
    const update_name = req.body.name;
    const update_email = req.body.email;
    const update_phone = req.body.phone;
    const update_city = req.body.city;
    const update_street = req.body.street;
    const update_zipcode = req.body.zipcode;

    const customer_id = req.params.customer_id;

    let sql = `UPDATE customers SET name='${update_name}', email='${update_email}', phone='${update_phone}', 
    city='${update_city}', street='${update_street}', zipcode='${update_zipcode}' WHERE customer_id='${customer_id}'`;

    try{
        await query(sql);

        return res.redirect('/customers');
    } catch (error) {
        throw error;
    }
});


// Product routes

app.get('/products', async (req, res) => {
    try{
        const products = await query("SELECT * FROM products");

        res.render('products', {products:products});
    } catch (error) {
        throw error;
    }
});

app.get('/product/add', (req, res) => {
    res.render('add_product');
})


app.post('/product/add', async (req, res) => {
    var name = req.body.name;
    var quantity = req.body.quantity;
    var price = req.body.price;

    let sql = `INSERT INTO products (name, quantity, price) 
    VALUES('${name}', '${quantity}', '${price}')`;

    try{
        await query(sql);

        res.redirect('/products');
    } catch (error) {
        throw error;
    }
});


app.post('/product/delete/:product_id', async (req, res) => {
    let sql = `DELETE FROM products WHERE product_id = ${req.params.product_id}`;

    try{
        await query(sql);

        res.redirect('/products');
    } catch (error) {
        throw error;
    }
});


app.get('/product/edit/:product_id', async (req, res) => {
    let sql = `SELECT * FROM products WHERE product_id = ${req.params.product_id}`;

    try{
        const product = await query(sql);

        res.render('edit_product',{product:product[0]});
    } catch (error) {
        throw error;
    }
});


app.post('/product/edit/:product_id', async (req, res) => {
    const update_name = req.body.name;
    const update_quantity = req.body.quantity;
    const update_price = req.body.price;

    const product_id = req.params.product_id;

    let sql = `UPDATE products SET name='${update_name}', quantity='${update_quantity}', 
                price='${update_price}' WHERE product_id='${product_id}'`;

    try{
        await query(sql);

        return res.redirect('/products');
    } catch (error) {
        throw error;
    }
});


// Order routes
app.get('/orders', async (req, res) => {
    let sql = `SELECT order_id, orders.customer_id, customers.name AS customer_name, 
                      orders.product_id, products.name AS product_name, price, orders.quantity 
               FROM customers, orders, products
               WHERE orders.customer_id = customers.customer_id
               AND orders.product_id = products.product_id
               ORDER BY order_id`;

    try{
        const orders = await query(sql);

        res.render('orders', {orders:orders});
    } catch (error) {
        throw error;
    }
});


app.get('/order/add', async (req, res) => {
    try{
        let customers = await query("SELECT customer_id, name FROM customers");
        let products = await query("SELECT product_id, name FROM products");

        res.render('add_order', {customers:customers, products:products})
    } catch(error) {
        throw error;
    }
});


app.post('/order/add', async (req, res) => {
    var selected_cus = req.body.customers;
    var selected_pro = req.body.products;
    var quantity = req.body.quantity;

    let sql = `INSERT INTO orders (customer_id, product_id, quantity) 
    VALUES('${selected_cus}', '${selected_pro}', '${quantity}')`;

    try{
        await query(sql);

        res.redirect('/orders');
    } catch (error) {
        throw error;
    }
});
 

app.post('/order/delete/:order_id', async (req, res) => {
    let sql = `DELETE FROM orders WHERE order_id = ${req.params.order_id}`;

    try{
        await query(sql);

        res.redirect('/orders');
    } catch (error) {
        throw error;
    }
});


app.get('/order/edit/:order_id', async (req, res) => {
    try{
        let customers = await query("SELECT customer_id, name FROM customers");
        let products = await query("SELECT product_id, name FROM products");
        let order = await query(`SELECT * FROM orders WHERE order_id='${req.params.order_id}'`)

        res.render('edit_order', {customers:customers, products:products, order:order[0]})
    } catch(error) {
        throw error;
    }
});


app.post('/order/edit/:order_id', async (req, res) => {
    const update_cus_id = req.body.customers;
    const update_pro_id = req.body.products;
    const update_quantity = req.body.quantity;

    const order_id = req.params.order_id;

    let sql = `UPDATE orders SET customer_id='${update_cus_id}', product_id='${update_pro_id}', 
                quantity='${update_quantity}' WHERE order_id='${order_id}'`;

    try{
        await query(sql);

        return res.redirect('/orders');
    } catch (error) {
        throw error;
    }
});



app.listen(3000, () => {
    console.log('Server is running on port: 3000');
});
