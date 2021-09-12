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
        const some_query = await query(`select orders.product_id, products.price, orders.quantity
        from orders, products
        where orders.product_id = products.product_id`);
        let total = 0;
        some_query.forEach((item) => { total += item.price * item.quantity })
        res.render('index', {customers_num:customers_num, products_num:products_num, orders_num:orders_num, total:total.toFixed(2)});
    } catch (err) {
        throw err;
    }
});


app.get('/customers', async (req, res) => {
    try{
        const customers = await query("SELECT * FROM customers");

        res.render('customers', {customers:customers});
    } catch (error) {
        throw err;
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

    var sql = `INSERT INTO customers (name, email, phone, city, street, zipcode) 
    VALUES('${name}', '${email}', '${phone}', '${city}', '${street}', '${zipcode}')`;
    try{
        await query(sql);
    } catch (err) {
        throw err;
    }

    res.redirect('/customers');
});


app.post('/customer/delete/:customer_id', (req, res) => {
    conn.query('DELETE FROM `customers` WHERE customer_id = ?', [req.params.customer_id], (err, results) => {
        if (err) throw err;
        else{
            res.redirect('/customers');
        }
    });
});


app.get('/customer/edit/:customer_id', (req, res) => {
    conn.query('SELECT * FROM `customers` WHERE customer_id=?',[req.params.customer_id] , (err, result) => {
        if (err)  throw err;
        res.render('edit_customer',{customer:result[0]});
    });
});


app.post('/customer/edit/:customer_id', (req, res) => {
    const update_name = req.body.name;
    const update_email = req.body.email;
    const update_phone = req.body.phone;
    const update_city = req.body.city;
    const update_street = req.body.street;
    const update_zipcode = req.body.zipcode;

    const customer_id = req.params.customer_id;
    conn.query('UPDATE `customers` SET name=?, email=?, phone=?, city=?, street=?, zipcode=? WHERE customer_id=?', 
    [update_name, update_email, update_phone, update_city, update_street, update_zipcode, customer_id], (err, results) => {
        if (err) throw err;
        if(results.changedRows === 1){
            return res.redirect('/customers');
        }
    });
});


// Product routes

app.get('/products', (req, res) => {
    conn.query("SELECT * FROM products", function(err, result){
        if (err) throw err;
        else{
            res.render('products', {products:result});
        }
    })
});

app.get('/product/add', (req, res) => {
    res.render('add_product');
})


app.post('/product/add', (req, res) => {
    var name = req.body.name;
    var quantity = req.body.quantity;
    var price = req.body.price;

    var sql = "INSERT INTO products (name, quantity, price) VALUES('"+name+"', '"+quantity+"', '"+price+"')";
    conn.query(sql, function(err, result){
        if (err) throw err;
        res.end();
    });
    res.redirect('/products');
});


app.post('/product/delete/:product_id', (req, res) => {
    conn.query('DELETE FROM `products` WHERE product_id = ?', [req.params.product_id], (err, results) => {
        if (err) throw err;
        else{
            res.redirect('/products');
        }
    });
});


app.get('/product/edit/:product_id', (req, res) => {
    conn.query('SELECT * FROM `products` WHERE product_id=?',[req.params.product_id] , (err, result) => {
        if (err)  throw err;
        res.render('edit_product',{product:result[0]});
    });
});


app.post('/product/edit/:product_id', (req, res) => {
    const update_name = req.body.name;
    const update_quantity = req.body.quantity;
    const update_price = req.body.price;

    const product_id = req.params.product_id;
    conn.query('UPDATE `products` SET name=?, quantity=?, price=? WHERE product_id=?', 
    [update_name, update_quantity, update_price, product_id], (err, results) => {
        if (err) throw err;
        if(results.changedRows === 1){
            console.log('Post Updated');
            return res.redirect('/products');
        }
    });
});


// Order routes
app.get('/orders', (req, res) => {
    conn.query("SELECT * FROM orders", function(err, results){
        if (err) throw err;
        else{
            res.render('orders', {orders:results});
        }
    });
});


app.get('/order/add', (req, res) => {
    conn.query("SELECT customer_id FROM customers", function(err, results1){
        if (err) throw err;
        else{
            conn.query("SELECT product_id FROM products", function(err, results2){
                if (err) throw err;
                else{
                    res.render('add_order', {customer_ids:results1, product_ids:results2});
                }
            })
        }
    });
});


app.post('/order/add', (req, res) => {
    var selected_cus = req.body.customer_ids;
    var selected_pro = req.body.product_ids;
    var quantity = req.body.quantity;

    var sql = "INSERT INTO orders (customer_id, product_id, quantity) VALUES('"+selected_cus+"', '"+selected_pro+"', '"+quantity+"')";
    conn.query(sql, function(err, result){
        if (err) throw err;
        res.end();
    });
    res.redirect('/orders');
});
 

app.post('/order/delete/:order_id', (req, res) => {
    conn.query('DELETE FROM `orders` WHERE order_id = ?', [req.params.order_id], (err, results) => {
        if (err) throw err;
        else{
            res.redirect('/orders');
        }
    });
});


app.get('/order/edit/:order_id', (req, res) => {
    conn.query("SELECT customer_id FROM customers", function(err, results1){
        if (err) throw err;
        else{
            conn.query("SELECT product_id FROM products", function(err, results2){
                if (err) throw err;
                else{
                    conn.query('SELECT * FROM `orders` WHERE order_id=?',[req.params.order_id] , (err, result) => {
                        if (err)  throw err;
                        res.render('add_order', {customer_ids:results1, product_ids:results2, order:result[0]});
                    });
                }
            })
        }
    });
});


app.post('/order/edit/:order_id', (req, res) => {
    const update_cus_id = req.body.customer_ids;
    const update_pro_id = req.body.product_ids;
    const update_quantity = req.body.quantity;

    const order_id = req.params.order_id;
    conn.query('UPDATE `orders` SET customer_id=?, product_id=?, quantity=? WHERE order_id=?', 
    [update_cus_id, update_pro_id, update_quantity, order_id], (err, results) => {
        if (err) throw err;
        if(results.changedRows === 1){
            return res.redirect('/orders');
        }
    });
});



app.listen(3000, () => {
    console.log('Server is running on port: 3000');
});
