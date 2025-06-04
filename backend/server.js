const express = require("express");
const mysql = require('mysql2');
const cors = require("cors");
const path = require('path');
const fs = require('fs');
let multer;
let sharp;

try {
  multer = require('multer');
  sharp = require('sharp');
} catch (err) {
  console.error("Required packages not installed. File upload or image processing might not work.");
  console.error("Please install them using: npm install multer sharp --save");
  
  // Create a mock multer implementation
  if (!multer) {
    multer = function() {
      return {
        single: () => (req, res, next) => {
          console.warn("Multer is not installed. File upload failed.");
          req.file = null;
          next();
        }
      };
    };
    
    multer.diskStorage = () => ({
      getDestination: (req, file, cb) => cb(null, ''),
      getFilename: (req, file, cb) => cb(null, file.originalname)
    });
  }
  
  // Create a mock sharp implementation
  if (!sharp) {
    sharp = () => ({
      resize: () => ({ toFile: (output, cb) => cb(null) })
    });
  }
}

const app = express();

// Standard image dimensions
const STANDARD_WIDTH = 600;
const STANDARD_HEIGHT = 400;

// Middleware to allow cross-origin requests from React frontend
app.use(cors({
  origin: 'http://localhost:5173', // Replace with your frontend's origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // To handle JSON requests

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Configure multer for image uploads if available
let upload;
if (multer.diskStorage) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  });

  // File filter to only allow images
  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  };

  upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 1
    }
  });
} else {
  throw new Error("Multer is not properly initialized");
}

// Error handling middleware for file uploads
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'File size too large. Maximum size is 10MB.' 
      });
    }
    return res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  }
  next(err);
});

// Middleware to resize images
const resizeImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  
  try {
    const filePath = req.file.path;
    const resizedFilename = `resized-${req.file.filename}`;
    const resizedFilePath = path.join(uploadDir, resizedFilename);
    
    await sharp(filePath)
      .resize(STANDARD_WIDTH, STANDARD_HEIGHT, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(resizedFilePath);
    
    // Delete the original file
    fs.unlinkSync(filePath);
    
    // Update file info
    req.file.filename = resizedFilename;
    req.file.path = resizedFilePath;
    
    next();
  } catch (error) {
    console.error('Error resizing image:', error);
    next();
  }
};

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "foodsystem",
  port: 3306
});
db.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    return;
  }
  console.log("Connected to MySQL database.");
});

// Handle login requests
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const query = "SELECT userid, name, email, phone, role FROM User WHERE email = ? AND password = ?";
  db.query(query, [email, password], (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    if (result.length > 0) {
      const user = result[0];
      console.log('User logged in:', user); // Debug log
      return res.status(200).json({ 
        success: true, 
        message: "Login successful", 
        user: {
          userid: user.userid, // Use userid consistently
          id: user.userid,    // Include both for compatibility
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      });
    } else {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  });
});

// Add new user registration endpoint
app.post("/api/register", (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Name, email and password are required" });
  }

  const query = "INSERT INTO User (name, email, password, phone) VALUES (?, ?, ?, ?)";
  db.query(query, [name, email, password, phone], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: "Email or phone number already exists" });
      }
      console.error("Error executing query:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    return res.status(201).json({ 
      success: true, 
      message: "User registered successfully",
      userId: result.insertId
    });
  });
});

// Categories endpoints
app.get("/api/categories", (req, res) => {
  const query = "SELECT * FROM Category";
  db.query(query, (err, result) => {
    if (err) {
      console.error("Error fetching categories:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    
    // Add full URL for image paths
    const categoriesWithImageUrl = result.map(category => ({
      ...category,
      image_url: category.image_url ? 
        `http://localhost:3000/uploads/${path.basename(category.image_url)}` : 
        null
    }));
    
    res.json({ success: true, categories: categoriesWithImageUrl });
  });
});

app.post("/api/categories", upload.single('image'), resizeImage, (req, res) => {
  try {
    const { name, description, image_url } = req.body;
    let imageUrl = image_url;
    
    // If file was uploaded, use its path instead of the provided URL
    if (req.file) {
      imageUrl = req.file.filename;
    }
    
    console.log("Creating category with:", {
      name, 
      description, 
      image_url: imageUrl
    });
    
    const query = "INSERT INTO Category (name, description, image_url) VALUES (?, ?, ?)";
    
    db.query(query, [name, description, imageUrl], (err, result) => {
      if (err) {
        console.error("Error creating category:", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
      }
      res.json({ success: true, categoryId: result.insertId });
    });
  } catch (error) {
    console.error("Exception in category creation:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

app.put("/api/categories/:id", upload.single('image'), resizeImage, (req, res) => {
  try {
    const { name, description, image_url, current_image_url, delete_image } = req.body;
    let imageUrl = image_url || current_image_url;
    
    // If delete_image is true, set imageUrl to null and delete the image file
    if (delete_image === 'true' || delete_image === true) {
      if (current_image_url) {
        const oldFilePath = path.join(uploadDir, path.basename(current_image_url));
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
            console.log(`Deleted image file: ${oldFilePath}`);
          } catch (err) {
            console.error("Error deleting old image:", err);
          }
        }
      }
      imageUrl = null;
    }
    // If new file was uploaded, use it and delete old file if exists
    else if (req.file) {
      imageUrl = req.file.filename;
      
      // If there was an old image, try to delete it
      if (current_image_url) {
        const oldFilePath = path.join(uploadDir, path.basename(current_image_url));
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (err) {
            console.error("Error deleting old image:", err);
          }
        }
      }
    }
    
    console.log("Updating category with:", {
      name, 
      description, 
      image_url: imageUrl,
      delete_image
    });
    
    const query = "UPDATE Category SET name = ?, description = ?, image_url = ? WHERE categoryid = ?";
    
    db.query(query, [name, description, imageUrl, req.params.id], (err, result) => {
      if (err) {
        console.error("Error updating category:", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
      }
      res.json({ success: true });
    });
  } catch (error) {
    console.error("Exception in category update:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

app.delete("/api/categories/:id", (req, res) => {
  // First get the category to find its image
  db.query("SELECT image_url FROM Category WHERE categoryid = ?", [req.params.id], (err, result) => {
    if (err) {
      console.error("Error getting category:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    
    // If category has an image, delete it
    if (result.length > 0 && result[0].image_url) {
      const imagePath = path.join(uploadDir, path.basename(result[0].image_url));
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (err) {
          console.error("Error deleting image:", err);
        }
      }
    }
    
    // Now delete the category
    const query = "DELETE FROM Category WHERE categoryid = ?";
    
    db.query(query, [req.params.id], (err, result) => {
      if (err) {
        console.error("Error deleting category:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
      res.json({ success: true });
    });
  });
});

// Food Items endpoints
app.get("/api/food-items", (req, res) => {
  const query = `
    SELECT f.*, c.name as category_name 
    FROM FoodItem f 
    LEFT JOIN Category c ON f.categoryid = c.categoryid
  `;
  
  db.query(query, (err, result) => {
    if (err) {
      console.error("Error fetching food items:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    
    // Add full URL for image paths
    const foodItemsWithImageUrl = result.map(item => ({
      ...item,
      image_url: item.image_url ? 
        `http://localhost:3000/uploads/${path.basename(item.image_url)}` : 
        null
    }));
    
    res.json({ success: true, foodItems: foodItemsWithImageUrl });
  });
});

app.post("/api/food-items", upload.single('image'), resizeImage, (req, res) => {
  try {
    const { name, description, price, availability, stock_quantity, categoryid, image_url } = req.body;
    let imageUrl = image_url;
    
    // Convert string values to appropriate types
    const isAvailable = availability === 'true' || availability === true;
    const stockQty = parseInt(stock_quantity) || 0;
    
    // If file was uploaded, use its path
    if (req.file) {
      imageUrl = req.file.filename;
    }
    
    // Validate and convert price to number
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid price value" 
      });
    }

    console.log("Creating food item with:", {
      name, 
      description, 
      price: numericPrice, 
      availability: isAvailable, 
      stock_quantity: stockQty, 
      image_url: imageUrl, 
      categoryid
    });

    const query = `
      INSERT INTO FoodItem (name, description, price, availability, stock_quantity, image_url, categoryid) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [name, description, numericPrice, isAvailable, stockQty, imageUrl, categoryid], (err, result) => {
      if (err) {
        console.error("Error creating food item:", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
      }
      res.json({ success: true, foodItemId: result.insertId });
    });
  } catch (error) {
    console.error("Exception in food item creation:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

app.put("/api/food-items/:id", upload.single('image'), resizeImage, (req, res) => {
  try {
    const { name, description, price, availability, stock_quantity, categoryid, image_url, current_image_url, delete_image } = req.body;
    let imageUrl = image_url || current_image_url;
    
    // Convert string values to appropriate types
    const isAvailable = availability === 'true' || availability === true;
    const stockQty = parseInt(stock_quantity) || 0;
    
    // If delete_image is true, set imageUrl to null and delete the image file
    if (delete_image === 'true' || delete_image === true) {
      if (current_image_url) {
        const oldFilePath = path.join(uploadDir, path.basename(current_image_url));
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
            console.log(`Deleted image file: ${oldFilePath}`);
          } catch (err) {
            console.error("Error deleting old image:", err);
          }
        }
      }
      imageUrl = null;
    }
    // If new file was uploaded, use it and delete old file if exists
    else if (req.file) {
      imageUrl = req.file.filename;
      
      // If there was an old image, try to delete it
      if (current_image_url) {
        const oldFilePath = path.join(uploadDir, path.basename(current_image_url));
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (err) {
            console.error("Error deleting old image:", err);
          }
        }
      }
    }
    
    // Validate and convert price to number
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid price value" 
      });
    }

    console.log("Updating food item with:", {
      name, 
      description, 
      price: numericPrice, 
      availability: isAvailable, 
      stock_quantity: stockQty, 
      image_url: imageUrl, 
      categoryid,
      delete_image
    });

    const query = `
      UPDATE FoodItem 
      SET name = ?, description = ?, price = ?, availability = ?, 
          stock_quantity = ?, image_url = ?, categoryid = ? 
      WHERE fooditemid = ?
    `;
    
    db.query(query, [name, description, numericPrice, isAvailable, stockQty, imageUrl, categoryid, req.params.id], (err, result) => {
      if (err) {
        console.error("Error updating food item:", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
      }
      res.json({ success: true });
    });
  } catch (error) {
    console.error("Exception in food item update:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

app.delete("/api/food-items/:id", (req, res) => {
  // First get the food item to find its image
  db.query("SELECT image_url FROM FoodItem WHERE fooditemid = ?", [req.params.id], (err, result) => {
    if (err) {
      console.error("Error getting food item:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    
    // If food item has an image, delete it
    if (result.length > 0 && result[0].image_url) {
      const imagePath = path.join(uploadDir, path.basename(result[0].image_url));
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (err) {
          console.error("Error deleting image:", err);
        }
      }
    }
    
    // Now delete the food item
    const query = "DELETE FROM FoodItem WHERE fooditemid = ?";
    
    db.query(query, [req.params.id], (err, result) => {
      if (err) {
        console.error("Error deleting food item:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
      res.json({ success: true });
    });
  });
});

// Orders endpoints
app.get("/api/orders", (req, res) => {
  const query = `
    SELECT o.*, u.name as user_name 
    FROM Orders o 
    LEFT JOIN User u ON o.userid = u.userid 
    ORDER BY o.order_date DESC
  `;
  
  db.query(query, (err, result) => {
    if (err) {
      console.error("Error fetching orders:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    res.json({ success: true, orders: result });
  });
});

app.get("/api/orders/pending", (req, res) => {
  const query = `
    SELECT o.*, u.name as user_name 
    FROM Orders o 
    LEFT JOIN User u ON o.userid = u.userid 
    WHERE o.status = 'Pending' 
    ORDER BY o.order_date ASC
  `;
  
  db.query(query, (err, result) => {
    if (err) {
      console.error("Error fetching pending orders:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    res.json({ success: true, orders: result});
  });
});

app.get("/api/orders/completed", (req, res) => {
  const query = `
    SELECT o.*, u.name as user_name 
    FROM Orders o 
    LEFT JOIN User u ON o.userid = u.userid 
    WHERE o.status = 'Completed' 
    ORDER BY o.order_date DESC
  `;
  
  db.query(query, (err, result) => {
    if (err) {
      console.error("Error fetching completed orders:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    res.json({ success: true, orders: result });
  });
});

app.get("/api/orders/:id/details", (req, res) => {
  const query = `
    SELECT 
      oi.*,
      f.name,
      f.image_url,
      CAST(oi.price_at_order AS DECIMAL(10,2)) as price_at_order
    FROM OrderItem oi
    JOIN FoodItem f ON oi.fooditemid = f.fooditemid
    WHERE oi.orderid = ?
  `;
  
  db.query(query, [req.params.id], (err, results) => {
    if (err) {
      console.error("Error fetching order details:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Error fetching order details",
        error: err.message 
      });
    }

    // Format the results to ensure numbers are properly parsed
    const formattedResults = results.map(item => ({
      ...item,
      quantity: parseInt(item.quantity, 10),
      price_at_order: parseFloat(item.price_at_order || 0)
    }));

    console.log('Order details:', formattedResults); // Debug log

    res.json({ 
      success: true, 
      orderItems: formattedResults || [] 
    });
  });
});

app.put("/api/orders/:id/status", (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;

  // Start a transaction
  db.beginTransaction(async (err) => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    try {
      // Get the current order status
      const [currentOrder] = await db.promise().query(
        "SELECT status FROM Orders WHERE orderid = ?",
        [orderId]
      );

      if (currentOrder.length === 0) {
        throw new Error("Order not found");
      }

      const oldStatus = currentOrder[0].status;

      // Update order status
      await db.promise().query(
        "UPDATE Orders SET status = ? WHERE orderid = ?",
        [status, orderId]
      );

      // Get order items
      const [orderItems] = await db.promise().query(
        "SELECT oi.fooditemid, oi.quantity, f.stock_quantity FROM OrderItem oi JOIN FoodItem f ON oi.fooditemid = f.fooditemid WHERE oi.orderid = ?",
        [orderId]
      );

      // Handle stock updates based on status change
      for (const item of orderItems) {
        let stockUpdate = 0;

        // If cancelling an order, add stock back
        if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
          stockUpdate = item.quantity;
        }
        // If un-cancelling an order, remove stock
        else if (oldStatus === 'Cancelled' && status !== 'Cancelled') {
          stockUpdate = -item.quantity;
        }

        if (stockUpdate !== 0) {
          await db.promise().query(
            "UPDATE FoodItem SET stock_quantity = stock_quantity + ? WHERE fooditemid = ?",
            [stockUpdate, item.fooditemid]
          );
        }
      }

      // If order is cancelled, notify the user
      if (status === 'Cancelled') {
        // Get user ID for the order
        const [orderUser] = await db.promise().query(
          "SELECT userid FROM Orders WHERE orderid = ?",
          [orderId]
        );

        if (orderUser.length > 0) {
          // You could implement a notifications table here
          console.log(`Order ${orderId} cancelled for user ${orderUser[0].userid}`);
        }
      }

      await db.promise().commit();

      res.json({ 
        success: true,
        message: `Order status updated to ${status}`,
        notifyUser: status === 'Cancelled'
      });

    } catch (error) {
      await db.promise().rollback();
      console.error("Error updating order status:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error updating order status",
        error: error.message 
      });
    }
  });
});

// Get menu items with categories
app.get('/api/menu', (req, res) => {
  const query = `
    SELECT f.*, c.name as category_name 
    FROM FoodItem f 
    LEFT JOIN Category c ON f.categoryid = c.categoryid 
    WHERE f.availability = true
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching menu:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    
    // Add full URL for image paths
    const menuItemsWithImageUrl = results.map(item => ({
      ...item,
      image_url: item.image_url ? 
        `http://localhost:3000/uploads/${path.basename(item.image_url)}` : 
        null
    }));
    
    res.json({ success: true, items: menuItemsWithImageUrl });
  });
});

// Get cart items for a user
app.get('/api/cart/:userId', (req, res) => {
  const userId = req.params.userId;
  const query = `
    SELECT 
      c.cartitemid,
      c.userid,
      c.fooditemid,
      c.quantity,
      f.name,
      f.description,
      f.price,
      f.image_url,
      f.availability,
      f.stock_quantity
    FROM CartItem c 
    JOIN FoodItem f ON c.fooditemid = f.fooditemid 
    WHERE c.userid = ?
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching cart:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    console.log('Cart items for user', userId, ':', results); // Debug log
    res.json({ success: true, items: results || [] }); // Ensure items is always an array
  });
});

// Get cart count for a user
app.get('/api/cart/:userId/count', (req, res) => {
  const userId = req.params.userId;
  const query = 'SELECT COUNT(*) as count FROM CartItem WHERE userid = ?';
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching cart count:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, count: results[0].count });
  });
});

// Add item to cart
app.post('/api/cart', (req, res) => {
  const userId = req.body.userId || req.body.userid;
  const foodItemId = req.body.foodItemId || req.body.fooditemid;
  const { quantity } = req.body;
  
  if (!userId || !foodItemId || !quantity) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields' 
    });
  }

  // First check stock availability
  db.query(
    'SELECT stock_quantity, name FROM FoodItem WHERE fooditemid = ?',
    [foodItemId],
    (err, results) => {
      if (err) {
        console.error('Error checking stock:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error checking stock' 
        });
      }

      if (results.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Food item not found' 
        });
      }

      const item = results[0];
      
      // Check if adding this quantity would exceed available stock
      if (quantity > item.stock_quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Not enough stock for ${item.name}. Available: ${item.stock_quantity}` 
        });
      }

      // Check current cart quantity
      db.query(
        'SELECT quantity FROM CartItem WHERE userid = ? AND fooditemid = ?',
        [userId, foodItemId],
        (err, cartResults) => {
          if (err) {
            console.error('Error checking cart:', err);
            return res.status(500).json({ 
              success: false, 
              message: 'Error checking cart' 
            });
          }

          const currentCartQty = cartResults.length > 0 ? cartResults[0].quantity : 0;
          const totalQty = currentCartQty + quantity;

          if (totalQty > item.stock_quantity) {
            return res.status(400).json({ 
              success: false, 
              message: `Cannot add ${quantity} more. Only ${item.stock_quantity - currentCartQty} available.` 
            });
          }

          // If we get here, we can safely add to cart
          if (cartResults.length > 0) {
            // Update existing cart item
            db.query(
              'UPDATE CartItem SET quantity = quantity + ? WHERE userid = ? AND fooditemid = ?',
              [quantity, userId, foodItemId],
              (err) => {
                if (err) {
                  console.error('Error updating cart:', err);
                  return res.status(500).json({ 
                    success: false, 
                    message: 'Error updating cart' 
                  });
                }
                res.json({ 
                  success: true, 
                  message: 'Cart updated successfully' 
                });
              }
            );
          } else {
            // Add new cart item
            db.query(
              'INSERT INTO CartItem (userid, fooditemid, quantity) VALUES (?, ?, ?)',
              [userId, foodItemId, quantity],
              (err) => {
                if (err) {
                  console.error('Error adding to cart:', err);
                  return res.status(500).json({ 
                    success: false, 
                    message: 'Error adding to cart' 
                  });
                }
                res.json({ 
                  success: true, 
                  message: 'Item added to cart successfully' 
                });
              }
            );
          }
        }
      );
    }
  );
});

// Update cart item quantity
app.put('/api/cart/:cartItemId', (req, res) => {
  const { cartItemId } = req.params;
  const { quantity } = req.body;
  const query = 'UPDATE CartItem SET quantity = ? WHERE cartitemid = ?';
  
  db.query(query, [quantity, cartItemId], (err) => {
    if (err) {
      console.error('Error updating cart:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, message: 'Cart updated' });
  });
});

// Remove item from cart
app.delete('/api/cart/:cartItemId', (req, res) => {
  const { cartItemId } = req.params;
  const query = 'DELETE FROM CartItem WHERE cartitemid = ?';
  
  db.query(query, [cartItemId], (err) => {
    if (err) {
      console.error('Error removing from cart:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, message: 'Item removed from cart' });
  });
});

// Place order
app.post('/api/orders', (req, res) => {
  const userId = req.body.userId || req.body.userid;
  
  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      message: 'User ID is required' 
    });
  }

  // First, get all cart items for the user with current stock quantities
  const cartQuery = `
    SELECT c.*, f.price, f.name, f.stock_quantity
    FROM CartItem c
    JOIN FoodItem f ON c.fooditemid = f.fooditemid
    WHERE c.userid = ?
  `;

  db.query(cartQuery, [userId], async (err, cartItems) => {
    if (err) {
      console.error('Error fetching cart items:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching cart items' 
      });
    }

    if (cartItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cart is empty' 
      });
    }

    // Check stock availability for all items
    for (const item of cartItems) {
      if (item.quantity > item.stock_quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${item.name}. Available: ${item.stock_quantity}`,
          item: item
        });
      }
    }

    db.beginTransaction(async (err) => {
      if (err) {
        console.error('Error starting transaction:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Server error' 
        });
      }

      try {
        // Create order
        const [orderResult] = await db.promise().query(
          'INSERT INTO Orders (userid, status) VALUES (?, "Pending")',
          [userId]
        );
        const orderId = orderResult.insertId;

        // Add order items and update stock
        for (const item of cartItems) {
          await db.promise().query(
            'INSERT INTO OrderItem (orderid, fooditemid, quantity, price_at_order) VALUES (?, ?, ?, ?)',
            [orderId, item.fooditemid, item.quantity, item.price]
          );

          // Update stock quantity
          await db.promise().query(
            'UPDATE FoodItem SET stock_quantity = stock_quantity - ? WHERE fooditemid = ?',
            [item.quantity, item.fooditemid]
          );
        }

        // Clear cart
        await db.promise().query(
          'DELETE FROM CartItem WHERE userid = ?',
          [userId]
        );

        await db.promise().commit();

        res.json({ 
          success: true, 
          message: 'Order placed successfully',
          orderId,
          items: cartItems 
        });

      } catch (error) {
        await db.promise().rollback();
        console.error('Error processing order:', error);
        res.status(500).json({ 
          success: false, 
          message: 'Error processing order',
          error: error.message 
        });
      }
    });
  });
});

// Get user's orders
app.get('/api/orders/:userId', (req, res) => {
  const userId = req.params.userId;
  const query = `
    SELECT o.*, 
           oi.quantity, 
           oi.price_at_order,
           f.name as item_name
    FROM Orders o
    JOIN OrderItem oi ON o.orderid = oi.orderid
    JOIN FoodItem f ON oi.fooditemid = f.fooditemid
    WHERE o.userid = ?
    ORDER BY o.order_date DESC
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching orders:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, orders: results });
  });
});

// Favorites endpoints
app.get('/api/favorites/:userId', (req, res) => {
  const userId = req.params.userId;
  
  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      message: 'User ID is required' 
    });
  }

  console.log('Fetching favorites for user:', userId); // Debug log
  
  const query = `
    SELECT 
      f.*,
      c.name as category_name,
      c.categoryid,
      CASE 
        WHEN f.image_url IS NOT NULL THEN CONCAT('http://localhost:3000/uploads/', f.image_url)
        ELSE NULL
      END as image_url
    FROM FoodItem f 
    JOIN UserFavorites uf ON f.fooditemid = uf.fooditemid
    LEFT JOIN Category c ON f.categoryid = c.categoryid
    WHERE uf.userid = ?
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching favorites:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error',
        error: err.message 
      });
    }

    console.log('Found favorites:', results); // Debug log
    
    // Ensure we always return an array
    res.json({ 
      success: true, 
      items: results || [],
      count: results.length 
    });
  });
});

app.post('/api/favorites/:userId/:foodItemId', (req, res) => {
  const { userId, foodItemId } = req.params;

  // First check if user exists
  db.query('SELECT userid FROM User WHERE userid = ?', [userId], (userErr, userResults) => {
    if (userErr) {
      console.error('Error checking user:', userErr);
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking user',
        error: userErr.message 
      });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Then check if food item exists
    db.query('SELECT fooditemid FROM FoodItem WHERE fooditemid = ?', [foodItemId], (foodErr, foodResults) => {
      if (foodErr) {
        console.error('Error checking food item:', foodErr);
        return res.status(500).json({ 
          success: false, 
          message: 'Error checking food item',
          error: foodErr.message 
        });
      }

      if (foodResults.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Food item not found' 
        });
      }

      // If both exist, try to add to favorites
      const query = 'INSERT INTO UserFavorites (userid, fooditemid) VALUES (?, ?)';
      db.query(query, [userId, foodItemId], (err) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
              success: false, 
              message: 'Item already in favorites' 
            });
          }
          console.error('Error adding to favorites:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Error adding to favorites',
            error: err.message 
          });
        }
        res.json({ 
          success: true, 
          message: 'Added to favorites' 
        });
      });
    });
  });
});

app.delete('/api/favorites/:userId/:foodItemId', (req, res) => {
  const { userId, foodItemId } = req.params;
  const query = 'DELETE FROM UserFavorites WHERE userid = ? AND fooditemid = ?';
  
  db.query(query, [userId, foodItemId], (err) => {
    if (err) {
      console.error('Error removing from favorites:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    res.json({ success: true, message: 'Removed from favorites' });
  });
});

// Get current order for a user
app.get('/api/orders/current/:userId', async (req, res) => {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }

  try {
    // First get the most recent pending/processing/ready order
    const [orders] = await db.promise().query(
      `SELECT * FROM Orders 
       WHERE userid = ? 
       AND status IN ('pending', 'processing', 'ready') 
       ORDER BY order_date DESC 
       LIMIT 1`,
      [userId]
    );

    if (orders.length === 0) {
      return res.json({ 
        success: true, 
        order: null, 
        items: [] 
      });
    }

    const order = orders[0];

    // Then get the order items with food item details
    const [items] = await db.promise().query(
      `SELECT oi.*, fi.name as item_name, fi.description, fi.image_url, c.name as category_name,
              CAST(oi.price_at_order AS DECIMAL(10,2)) as price_at_order
       FROM OrderItem oi
       JOIN FoodItem fi ON oi.fooditemid = fi.fooditemid
       LEFT JOIN Category c ON fi.categoryid = c.categoryid
       WHERE oi.orderid = ?`,
      [order.orderid]
    );

    // Format the items to include the price at order time
    const formattedItems = items.map(item => ({
      orderitemid: item.orderitemid,
      item_name: item.item_name,
      description: item.description,
      image_url: item.image_url,
      category_name: item.category_name,
      quantity: parseInt(item.quantity, 10),
      price_at_order: parseFloat(item.price_at_order)
    }));

    // Debug log to check the data
    console.log('Formatted items:', formattedItems);

    return res.json({
      success: true,
      order: {
        orderid: order.orderid,
        userid: order.userid,
        order_date: order.order_date,
        status: order.status,
        notes: order.notes
      },
      items: formattedItems
    });

  } catch (error) {
    console.error('Error fetching current order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching current order',
      error: error.message 
    });
  }
});

// Order History endpoint
app.get('/api/orders/history/:userId', (req, res) => {
  const userId = req.params.userId;
  const query = `
    SELECT 
      o.orderid,
      o.order_date,
      o.status,
      GROUP_CONCAT(
        CONCAT(f.name, ' (', oi.quantity, ')')
        SEPARATOR ', '
      ) as items,
      CAST(SUM(oi.quantity * oi.price_at_order) AS DECIMAL(10,2)) as total_amount,
      COUNT(oi.orderitemid) as item_count
    FROM Orders o
    JOIN OrderItem oi ON o.orderid = oi.orderid
    JOIN FoodItem f ON oi.fooditemid = f.fooditemid
    WHERE o.userid = ? AND o.status IN ('Completed', 'Processing', 'Ready', 'Cancelled')
    GROUP BY o.orderid
    ORDER BY o.order_date DESC
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching order history:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching order history',
        error: err.message 
      });
    }

    // Format the results to ensure numbers are properly parsed
    const formattedResults = results.map(order => ({
      ...order,
      total_amount: parseFloat(order.total_amount || 0),
      order_date: new Date(order.order_date).toLocaleString()
    }));

    console.log('Order history for user', userId, ':', formattedResults);

    res.json({ 
      success: true, 
      orders: formattedResults || [] 
    });
  });
});

// Admin Orders endpoints
app.get('/api/admin/orders', (req, res) => {
  const query = `
    SELECT 
      o.orderid,
      u.name as user_name,
      o.order_date,
      o.status,
      CAST(SUM(oi.quantity * oi.price_at_order) AS DECIMAL(10,2)) as total_amount,
      COUNT(oi.orderitemid) as items_count
    FROM Orders o
    JOIN User u ON o.userid = u.userid
    JOIN OrderItem oi ON o.orderid = oi.orderid
    GROUP BY o.orderid, o.order_date, o.status, u.name
    ORDER BY o.order_date DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching orders:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
    
    res.json({ success: true, orders: results });
  });
});

app.get('/api/admin/orders/:orderId', (req, res) => {
  const orderId = req.params.orderId;
  
  // Get order details
  const orderQuery = `
    SELECT 
      o.*,
      u.name as user_name,
      u.email,
      u.phone
    FROM Orders o
    JOIN User u ON o.userid = u.userid
    WHERE o.orderid = ?
  `;
  
  // Get order items
  const itemsQuery = `
    SELECT 
      oi.orderitemid,
      oi.orderid,
      oi.fooditemid,
      oi.quantity,
      f.name,
      f.price,
      f.image_url,
      (oi.quantity * oi.price_at_order) as total
    FROM OrderItem oi
    JOIN FoodItem f ON oi.fooditemid = f.fooditemid
    WHERE oi.orderid = ?
  `;
  
  db.query(orderQuery, [orderId], (err, orderResults) => {
    if (err) {
      console.error('Error fetching order details:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch order details' });
    }
    
    if (orderResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    const orderDetail = orderResults[0];
    
    db.query(itemsQuery, [orderId], (err, itemResults) => {
      if (err) {
        console.error('Error fetching order items:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch order items' });
      }
      
      try {
        // Calculate totals
        const subtotal = itemResults.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
        const tax = subtotal * 0.05; // Assuming 5% tax
        const delivery_fee = 50.00; // Fixed delivery fee
        const discount = 0; // Default discount value
        
        // Ensure all order properties exist
        const orderDetails = {
          orderid: orderDetail.orderid,
          user_name: orderDetail.user_name || 'Unknown',
          email: orderDetail.email || '',
          phone: orderDetail.phone || '',
          delivery_address: orderDetail.delivery_address || '',
          payment_method: orderDetail.payment_method || 'Cash',
          payment_id: orderDetail.payment_id || '',
          items: itemResults || [],
          subtotal: subtotal,
          tax: tax,
          delivery_fee: delivery_fee,
          discount: discount,
          total: subtotal + tax + delivery_fee - discount
        };
        
        return res.json({ success: true, orderDetails });
      } catch (error) {
        console.error('Error processing order details:', error);
        return res.status(500).json({ success: false, message: 'Failed to process order details' });
      }
    });
  });
});

app.put('/api/admin/orders/:orderId/status', (req, res) => {
  const orderId = req.params.orderId;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }
  
  const validStatuses = ['Pending', 'Processing', 'Completed', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  
  const query = 'UPDATE Orders SET status = ? WHERE orderid = ?';
  
  db.query(query, [status, orderId], (err) => {
    if (err) {
      console.error('Error updating order status:', err);
      return res.status(500).json({ success: false, message: 'Failed to update order status' });
    }
    
    res.json({ success: true, message: 'Order status updated successfully' });
  });
});

// Admin Revenue Today Endpoint
app.get('/api/admin/revenue/today', (req, res) => {
  // Get today's date in YYYY-MM-DD format for comparison
  const today = new Date();
  const todayDateString = today.toISOString().split('T')[0];
  
  const query = `
    SELECT SUM(oi.quantity * oi.price_at_order) as today_revenue 
    FROM Orders o
    JOIN OrderItem oi ON o.orderid = oi.orderid
    WHERE DATE(o.order_date) = ?
  `;
  
  db.query(query, [todayDateString], (err, results) => {
    if (err) {
      console.error('Error fetching today\'s revenue:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch today\'s revenue' });
    }
    
    const todayRevenue = results[0].today_revenue || 0;
    return res.json({ 
      success: true, 
      today_revenue: todayRevenue 
    });
  });
});

// Create UserFavorites table if it doesn't exist
const createUserFavoritesTable = `
  CREATE TABLE IF NOT EXISTS UserFavorites (
    userid INT,
    fooditemid INT,
    PRIMARY KEY (userid, fooditemid),
    FOREIGN KEY (userid) REFERENCES User(userid) ON DELETE CASCADE,
    FOREIGN KEY (fooditemid) REFERENCES FoodItem(fooditemid) ON DELETE CASCADE
  )
`;

// Create OrderItem table if it doesn't exist
const createOrderItemTable = `
  CREATE TABLE IF NOT EXISTS OrderItem (
    orderitemid INT PRIMARY KEY AUTO_INCREMENT,
    orderid INT,
    fooditemid INT,
    quantity INT NOT NULL DEFAULT 1,
    price_at_order DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (orderid) REFERENCES Orders(orderid) ON DELETE CASCADE,
    FOREIGN KEY (fooditemid) REFERENCES FoodItem(fooditemid) ON DELETE CASCADE
  )
`;

// Create Orders table if it doesn't exist
const createOrdersTable = `
  CREATE TABLE IF NOT EXISTS Orders (
    orderid INT PRIMARY KEY AUTO_INCREMENT,
    userid INT,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Processing', 'Completed', 'Cancelled') DEFAULT 'Pending',
    FOREIGN KEY (userid) REFERENCES User(userid) ON DELETE CASCADE
  )
`;

// Execute table creation queries
db.query(createOrdersTable, (err) => {
  if (err) {
    console.error('Error creating Orders table:', err);
  } else {
    console.log('Orders table ready');
    // Create OrderItem table after Orders table is created
    db.query(createOrderItemTable, (err) => {
      if (err) {
        console.error('Error creating OrderItem table:', err);
      } else {
        console.log('OrderItem table ready');
      }
    });
  }
});

db.query(createUserFavoritesTable, (err) => {
  if (err) {
    console.error('Error creating UserFavorites table:', err);
  } else {
    console.log('UserFavorites table ready');
  }
});

// Get all uploaded images
app.get('/api/images', (req, res) => {
  try {
    // Read all files from the uploads directory
    fs.readdir(uploadDir, (err, files) => {
      if (err) {
        console.error('Error reading uploads directory:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error reading uploads directory' 
        });
      }
      
      // Filter for image files only
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|gif)$/i.test(file)
      );
      
      // Generate URL paths for each image
      const images = imageFiles.map(file => ({
        filename: file,
        url: `http://localhost:3000/uploads/${file}`,
        uploaded: fs.statSync(path.join(uploadDir, file)).mtime
      }));
      
      // Sort by upload date (newest first)
      images.sort((a, b) => b.uploaded - a.uploaded);
      
      res.json({ 
        success: true, 
        images: images 
      });
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching images',
      error: error.message 
    });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});