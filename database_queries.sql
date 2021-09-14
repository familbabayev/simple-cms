create database cms;
use cms;


CREATE TABLE customers(
	customer_id INT AUTO_INCREMENT,
    name VARCHAR(64),
    email VARCHAR(64),
    phone VARCHAR(64),
    city VARCHAR(64),
    street VARCHAR(64),
    zipcode VARCHAR(64),
    PRIMARY KEY(customer_id)
);


CREATE TABLE products(
	product_id INT AUTO_INCREMENT,
    name VARCHAR(64),
    quantity INT,
    price DOUBLE(10, 2),
    PRIMARY KEY(product_id)
);

CREATE TABLE orders(
	order_id INT AUTO_INCREMENT,
	customer_id INT,
	product_id INT,
    quantity INT,
    PRIMARY KEY(order_id),
    FOREIGN KEY(customer_id) REFERENCES customers(customer_id)
		ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES products(product_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


INSERT INTO customers (name, email, phone, city, street, zipcode) VALUES
('Henry Richard', 'henry@gmail.com', '12345674', 'Washington', 'Some Street 43', '1111'),
('Robert Jackson', 'robert@gmail.com', '7314454', 'London', 'Some Street 48', '2222'),
('Josh Reed', 'jreed@gmail.com', '7314454', 'France', 'Some Street 522', '341235'),
('Elvin Huseynov', 'elvinh@gmail.com', '5432643', 'Baku', 'Some Street 10', '464465');


INSERT INTO products (name, quantity, price) VALUES
('Product1', 5, 5.50),
('Product2', 40, 3.00),
('Product3', 30, 1.49),
('Product4', 59, 6.70),
('Product5', 23, 9.99),
('Product6', 37, 5.00);

INSERT INTO orders (customer_id, product_id, quantity) VALUES
(1, 1, 2),
(1, 2, 5),
(2, 4, 2),
(3, 3, 6),
(4, 2, 1),
(4, 3, 4),
(4, 4, 6),
(4, 5, 8),
(2, 3, 10),
(2, 4, 16);


CREATE TABLE deleted_customers(
	customer_id INT AUTO_INCREMENT,
    name VARCHAR(64),
    email VARCHAR(64),
    phone VARCHAR(64),
    city VARCHAR(64),
    street VARCHAR(64),
    zipcode VARCHAR(64),
    PRIMARY KEY(customer_id),
    deletedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE deleted_products(
	product_id INT AUTO_INCREMENT,
    name VARCHAR(64),
    quantity INT,
    price DOUBLE(10, 2),
    PRIMARY KEY(product_id),
    deletedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE deleted_orders(
	order_id INT AUTO_INCREMENT,
	customer_id INT,
	product_id INT,
    quantity INT,
    PRIMARY KEY(order_id),
    deletedAt TIMESTAMP DEFAULT NOW()
);



DELIMITER $$
CREATE TRIGGER before_delete_customers
BEFORE DELETE ON customers FOR EACH ROW
BEGIN
    INSERT INTO deleted_customers(name, email, phone, city, street, zipcode)
	VALUES(OLD.name, OLD.email, OLD.phone, OLD.city, OLD.street, OLD.zipcode);
END$$
DELIMITER ;


DELIMITER $$
CREATE TRIGGER before_delete_products
BEFORE DELETE ON products FOR EACH ROW
BEGIN
    INSERT INTO deleted_products(name, quantity, price)
	VALUES(OLD.name, OLD.quantity, OLD.price);
END$$
DELIMITER ;


DELIMITER $$
CREATE TRIGGER before_delete_orders
BEFORE DELETE ON orders FOR EACH ROW
BEGIN
    INSERT INTO deleted_orders(customer_id, product_id, quantity)
	VALUES(OLD.customer_id, OLD.product_id, OLD.quantity);
END$$
DELIMITER ;



DELIMITER //
CREATE PROCEDURE GetOrdersByCustomerId(
      IN customerID INT
)
BEGIN
	SELECT orders.customer_id, orders.order_id, orders.product_id, orders.quantity
	FROM orders
	WHERE orders.customer_id = customerID;
END //
DELIMITER ;

CALL GetOrdersByCustomerId('1');



