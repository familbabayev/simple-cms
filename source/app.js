var express = require('express');
var path = require('path');
var mysql = require('mysql2');
var util = require('util');

var app = express();

app.set('view engine', 'ejs');

const publicDir = path.join(__dirname, '../public')
app.use(express.static(publicDir));

app.use(express.urlencoded({extended : false}));

const conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
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
    try{
        const orders = await query("SELECT * FROM orders");

        res.render('orders', {orders:orders});
    } catch (error) {
        throw error;
    }
});


app.get('/order/add', async (req, res) => {
    try{
        let customer_ids = await query("SELECT customer_id FROM customers");
        let product_ids = await query("SELECT product_id FROM products");

        res.render('add_order', {customer_ids:customer_ids, product_ids:product_ids})
    } catch(error) {
        throw error;
    }
});


app.post('/order/add', async (req, res) => {
    var selected_cus = req.body.customer_ids;
    var selected_pro = req.body.product_ids;
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
        let customer_ids = await query("SELECT customer_id FROM customers");
        let product_ids = await query("SELECT product_id FROM products");
        let order = await query(`SELECT * FROM orders WHERE order_id='${req.params.order_id}'`)

        res.render('edit_order', {customer_ids:customer_ids, product_ids:product_ids, order:order[0]})
    } catch(error) {
        throw error;
    }
});


app.post('/order/edit/:order_id', async (req, res) => {
    const update_cus_id = req.body.customer_ids;
    const update_pro_id = req.body.product_ids;
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
