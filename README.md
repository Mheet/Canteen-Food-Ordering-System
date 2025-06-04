# Canteen Order System

A full-stack web application for managing food orders in a canteen/cafeteria environment. This system includes features for both customers and administrators.

## Screenshots

### User Interface

![User Dashboard](https://github.com/Mheet/Canteen-Food-Ordering-System/raw/main/docs/images/user-dashboard.png)
_Menu page showing available food items with prices and stock status_

![Order History](https://github.com/Mheet/Canteen-Food-Ordering-System/raw/main/docs/images/order-history.png)
_Track order status and view order history_

### Admin Interface

![Admin Dashboard](https://github.com/Mheet/Canteen-Food-Ordering-System/raw/main/docs/images/admin-dashboard.png)
_Admin dashboard showing key metrics and statistics_

![Food Management](https://github.com/Mheet/Canteen-Food-Ordering-System/raw/main/docs/images/food-management.png)
_Category and food item management interface_

## Features

### User Features

- User registration and authentication
- Browse food menu with categories
- Add items to cart
- Place orders
- View order history
- Mark favorite items
- Track current order status

### Admin Features

- Manage food categories
- Add/Edit/Delete food items
- Manage user accounts
- View and process orders
- Track order status
- View revenue reports

## Tech Stack

### Frontend

- React.js
- Material-UI
- React Router
- Axios
- Context API for state management

### Backend

- Node.js
- Express.js
- MySQL Database
- Multer for file uploads
- Sharp for image processing

## Prerequisites

- Node.js (v22.14.0 or higher)
- MySQL Server
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Mheet/Canteen-Food-Ordering-System.git
cd Canteen-Food-Ordering-System
```

2. Install dependencies for both frontend and backend:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up the database:

- Create a MySQL database named 'foodsystem'
- Import the database schema from `database_schema.sql`

4. Configure environment variables:
   Create a `.env` file in the backend directory with:

```
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=foodsystem
PORT=3000
```

## Running the Application

1. Start the backend server:

```bash
cd backend
node server.js
```

2. Start the frontend development server:

```bash
cd frontend
npm run dev
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Project Structure

```
Canteen-Food-Ordering-System/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── uploads/
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── docs/
│   └── images/
│       ├── user-dashboard.png
│       ├── order-history.png
│       ├── admin-dashboard.png
│       └── food-management.png
└── database_schema.sql
```

## API Endpoints

### Authentication

- POST /api/register - Register new user
- POST /api/login - User login

### Food Items

- GET /api/food-items - Get all food items
- POST /api/food-items - Create new food item
- PUT /api/food-items/:id - Update food item
- DELETE /api/food-items/:id - Delete food item

### Categories

- GET /api/categories - Get all categories
- POST /api/categories - Create new category
- PUT /api/categories/:id - Update category
- DELETE /api/categories/:id - Delete category

### Orders

- GET /api/orders - Get all orders
- POST /api/orders - Create new order
- PUT /api/orders/:id/status - Update order status
- GET /api/orders/:id/details - Get order details

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Mheet Singh - [GitHub](https://github.com/Mheet)

Project Link: [https://github.com/Mheet/Canteen-Food-Ordering-System](https://github.com/Mheet/Canteen-Food-Ordering-System)
