-- Food Ordering System Database Schema

-- User Table
CREATE TABLE User (
    userid INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_email CHECK (email LIKE '%@%.%')
);

-- Category Table
CREATE TABLE Category (
    categoryid INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FoodItem Table
CREATE TABLE FoodItem (
    fooditemid INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    availability BOOLEAN DEFAULT TRUE,
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    image_url VARCHAR(255),
    categoryid INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoryid) REFERENCES Category(categoryid) ON DELETE SET NULL
);

-- Orders Table
CREATE TABLE Orders (
    orderid INT PRIMARY KEY AUTO_INCREMENT,
    userid INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Processing', 'Completed', 'Cancelled') DEFAULT 'Pending',
    notes TEXT,
    FOREIGN KEY (userid) REFERENCES User(userid) ON DELETE CASCADE
);

-- OrderItem Table
CREATE TABLE OrderItem (
    orderitemid INT PRIMARY KEY AUTO_INCREMENT,
    orderid INT NOT NULL,
    fooditemid INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price_at_order DECIMAL(10,2) NOT NULL CHECK (price_at_order >= 0),
    FOREIGN KEY (orderid) REFERENCES Orders(orderid) ON DELETE CASCADE,
    FOREIGN KEY (fooditemid) REFERENCES FoodItem(fooditemid) ON DELETE CASCADE
);

-- UserFavorites Table
CREATE TABLE UserFavorites (
    userid INT NOT NULL,
    fooditemid INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userid, fooditemid),
    FOREIGN KEY (userid) REFERENCES User(userid) ON DELETE CASCADE,
    FOREIGN KEY (fooditemid) REFERENCES FoodItem(fooditemid) ON DELETE CASCADE
);

-- CartItem Table
CREATE TABLE CartItem (
    cartitemid INT PRIMARY KEY AUTO_INCREMENT,
    userid INT NOT NULL,
    fooditemid INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userid) REFERENCES User(userid) ON DELETE CASCADE,
    FOREIGN KEY (fooditemid) REFERENCES FoodItem(fooditemid) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (userid, fooditemid)
);

-- Table Descriptions and Constraints Summary:

-- User Table:
-- Primary Key: userid (Auto-incrementing integer)
-- Unique Constraints: email, phone
-- Not Null: name, email, password
-- Check Constraint: email format validation
-- Default: role = 'user', created_at = current timestamp

-- Category Table:
-- Primary Key: categoryid (Auto-incrementing integer)
-- Unique Constraints: name
-- Not Null: name
-- Default: created_at = current timestamp

-- FoodItem Table:
-- Primary Key: fooditemid (Auto-incrementing integer)
-- Foreign Key: categoryid references Category(categoryid)
-- Not Null: name, price, stock_quantity
-- Check Constraints: price >= 0, stock_quantity >= 0
-- Default: availability = TRUE, created_at = current timestamp

-- Orders Table:
-- Primary Key: orderid (Auto-incrementing integer)
-- Foreign Key: userid references User(userid)
-- Not Null: userid
-- Default: order_date = current timestamp, status = 'Pending'
-- Enum Constraint: status can only be 'Pending', 'Processing', 'Completed', or 'Cancelled'

-- OrderItem Table:
-- Primary Key: orderitemid (Auto-incrementing integer)
-- Foreign Keys: orderid references Orders(orderid), fooditemid references FoodItem(fooditemid)
-- Not Null: orderid, fooditemid, quantity, price_at_order
-- Check Constraints: quantity > 0, price_at_order >= 0
-- Default: quantity = 1

-- UserFavorites Table:
-- Composite Primary Key: (userid, fooditemid)
-- Foreign Keys: userid references User(userid), fooditemid references FoodItem(fooditemid)
-- Not Null: userid, fooditemid
-- Default: created_at = current timestamp

-- CartItem Table:
-- Primary Key: cartitemid (Auto-incrementing integer)
-- Foreign Keys: userid references User(userid), fooditemid references FoodItem(fooditemid)
-- Not Null: userid, fooditemid, quantity
-- Check Constraint: quantity > 0
-- Unique Constraint: (userid, fooditemid) combination must be unique
-- Default: quantity = 1, created_at = current timestamp 