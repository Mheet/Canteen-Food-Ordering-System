import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Collapse,
  useTheme,
  Divider,
} from '@mui/material';
import {
  Search,
  ExpandMore,
  ExpandLess,
  Clear,
  AccessTime,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';

function Orders() {
  const theme = useTheme();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialOrderId = searchParams.get('id');
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(initialOrderId ? parseInt(initialOrderId) : null);
  const [orderDetails, setOrderDetails] = useState({});
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (expandedOrderId) {
      fetchOrderDetails(expandedOrderId);
    }
  }, [expandedOrderId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/admin/orders');
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
      } else {
        console.error('Failed to fetch orders:', data.message);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    // Check if we already have the details
    if (orderDetails[orderId]) return;
    
    try {
      setOrderDetails(prev => ({
        ...prev,
        [orderId]: { loading: true, error: null, data: null }
      }));
      
      const response = await fetch(`http://localhost:3000/api/admin/orders/${orderId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          // Try to parse as JSON
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || 'Failed to fetch order details';
        } catch (e) {
          // If not JSON, use the text or status
          errorMessage = response.status === 404 
            ? 'Order not found' 
            : `Server error (${response.status})`;
        }
        
        console.error(`Error fetching order details for ID ${orderId}: ${errorMessage}`);
        setOrderDetails(prev => ({
          ...prev,
          [orderId]: { loading: false, error: errorMessage, data: null }
        }));
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setOrderDetails(prev => ({
          ...prev,
          [orderId]: { loading: false, error: null, data: data.orderDetails }
        }));
      } else {
        console.error(`Failed to fetch order details for ID ${orderId}:`, data.message);
        setOrderDetails(prev => ({
          ...prev,
          [orderId]: { loading: false, error: data.message || 'Failed to fetch order details', data: null }
        }));
      }
    } catch (error) {
      console.error(`Error fetching order details for ID ${orderId}:`, error);
      setOrderDetails(prev => ({
        ...prev,
        [orderId]: { loading: false, error: 'Network error. Please try again.', data: null }
      }));
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleToggleOrderDetails = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const handleOpenStatusDialog = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setOpenStatusDialog(true);
  };

  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false);
    setSelectedOrder(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/admin/orders/${selectedOrder.orderid}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the order status in our state
        const updatedOrders = orders.map(order => 
          order.orderid === selectedOrder.orderid 
            ? { ...order, status: newStatus } 
            : order
        );
        
        setOrders(updatedOrders);
        handleCloseStatusDialog();
      } else {
        console.error('Failed to update order status:', data.message);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // Filter orders based on search query and status filter
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      searchQuery === '' || 
      order.user_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      order.orderid.toString().includes(searchQuery);
    
    const matchesStatus = statusFilter === '' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Apply pagination
  const paginatedOrders = filteredOrders.slice(
    page * rowsPerPage, 
    page * rowsPerPage + rowsPerPage
  );

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return { color: 'warning', bg: theme.palette.warning.light };
      case 'Processing':
        return { color: 'info', bg: theme.palette.info.light };
      case 'Completed':
        return { color: 'success', bg: theme.palette.success.light };
      case 'Cancelled':
        return { color: 'error', bg: theme.palette.error.light };
      default:
        return { color: 'default', bg: theme.palette.grey[300] };
    }
  };

  return (
    <Box>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          background: `linear-gradient(45deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'white',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Orders
        </Typography>
        <Typography variant="body1">
          Manage and track customer orders.
        </Typography>
      </Paper>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder="Search orders..."
            variant="outlined"
            size="small"
            sx={{ flexGrow: 1, maxWidth: { xs: '100%', sm: 300 } }}
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton onClick={() => setSearchQuery('')} edge="end" size="small">
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl 
            variant="outlined" 
            size="small" 
            sx={{ minWidth: 150 }}
          >
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="Status"
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Processing">Processing</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          
          {(searchQuery || statusFilter) && (
            <Button 
              variant="outlined"
              size="small"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedOrders.length > 0 ? (
                    paginatedOrders.map((order) => (
                      <React.Fragment key={order.orderid}>
                        <TableRow 
                          hover
                          onClick={() => handleToggleOrderDetails(order.orderid)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>#{order.orderid}</TableCell>
                          <TableCell>{order.user_name}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <AccessTime fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: 16 }} />
                              {new Date(order.order_date).toLocaleString()}
                            </Box>
                          </TableCell>
                          <TableCell>₹{parseFloat(order.total_amount || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={order.status}
                              color={getStatusColor(order.status).color}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{order.items_count}</TableCell>
                          <TableCell align="right">
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenStatusDialog(order);
                              }}
                            >
                              Update Status
                            </Button>
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleOrderDetails(order.orderid);
                              }}
                              sx={{ ml: 1 }}
                            >
                              {expandedOrderId === order.orderid ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                        
                        {/* Order details row */}
                        <TableRow>
                          <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                            <Collapse in={expandedOrderId === order.orderid} timeout="auto" unmountOnExit>
                              <Box sx={{ py: 2, px: 3, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                                <Typography variant="h6" gutterBottom>
                                  Order Details
                                </Typography>
                                
                                {!orderDetails[order.orderid] ? (
                                  <Box sx={{ py: 2, textAlign: 'center' }}>
                                    <CircularProgress size={24} />
                                  </Box>
                                ) : orderDetails[order.orderid].loading ? (
                                  <Box sx={{ py: 2, textAlign: 'center' }}>
                                    <CircularProgress size={24} />
                                  </Box>
                                ) : orderDetails[order.orderid].error ? (
                                  <Box sx={{ py: 2, textAlign: 'center' }}>
                                    <Typography color="error">{orderDetails[order.orderid].error}</Typography>
                                    <Button 
                                      variant="outlined" 
                                      size="small" 
                                      onClick={() => fetchOrderDetails(order.orderid)}
                                      sx={{ mt: 1 }}
                                    >
                                      Retry
                                    </Button>
                                  </Box>
                                ) : (
                                  <>
                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                      <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                          Delivery Address
                                        </Typography>
                                        <Typography variant="body2">
                                          {orderDetails[order.orderid].data.delivery_address || 'N/A'}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                          Contact
                                        </Typography>
                                        <Typography variant="body2">
                                          {orderDetails[order.orderid].data.phone || 'N/A'}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                          Payment Method
                                        </Typography>
                                        <Typography variant="body2">
                                          {orderDetails[order.orderid].data.payment_method || 'N/A'}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                          Payment ID
                                        </Typography>
                                        <Typography variant="body2">
                                          {orderDetails[order.orderid].data.payment_id || 'N/A'}
                                        </Typography>
                                      </Grid>
                                    </Grid>
                                    
                                    <Typography variant="subtitle1" gutterBottom>
                                      Order Items
                                    </Typography>
                                    
                                    {orderDetails[order.orderid].data.items.length === 0 ? (
                                      <Typography variant="body2" color="text.secondary">No items in this order</Typography>
                                    ) : (
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow>
                                            <TableCell>Item</TableCell>
                                            <TableCell align="right">Price</TableCell>
                                            <TableCell align="right">Quantity</TableCell>
                                            <TableCell align="right">Total</TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {orderDetails[order.orderid].data.items.map((item) => (
                                            <TableRow key={item.orderitemid || item.id}>
                                              <TableCell>{item.name || 'Unknown Item'}</TableCell>
                                              <TableCell align="right">₹{parseFloat(item.price || 0).toFixed(2)}</TableCell>
                                              <TableCell align="right">{item.quantity || 0}</TableCell>
                                              <TableCell align="right">₹{parseFloat(item.total || 0).toFixed(2)}</TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    )}
                                    
                                    <Box sx={{ mt: 2, textAlign: 'right' }}>
                                      <Grid container spacing={1} justifyContent="flex-end">
                                        <Grid item xs={6} sm={3}>
                                          <Typography variant="body2" color="text.secondary">
                                            Subtotal:
                                          </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={2}>
                                          <Typography variant="body2">
                                            ₹{parseFloat(orderDetails[order.orderid].data.subtotal || 0).toFixed(2)}
                                          </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                          <Typography variant="body2" color="text.secondary">
                                            Delivery Fee:
                                          </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={2}>
                                          <Typography variant="body2">
                                            ₹{parseFloat(orderDetails[order.orderid].data.delivery_fee || 0).toFixed(2)}
                                          </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                          <Typography variant="body2" color="text.secondary">
                                            Tax:
                                          </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={2}>
                                          <Typography variant="body2">
                                            ₹{parseFloat(orderDetails[order.orderid].data.tax || 0).toFixed(2)}
                                          </Typography>
                                        </Grid>
                                        {(orderDetails[order.orderid].data.discount || 0) > 0 && (
                                          <>
                                            <Grid item xs={6} sm={3}>
                                              <Typography variant="body2" color="text.secondary">
                                                Discount:
                                              </Typography>
                                            </Grid>
                                            <Grid item xs={6} sm={2}>
                                              <Typography variant="body2" color="error">
                                                -₹{parseFloat(orderDetails[order.orderid].data.discount || 0).toFixed(2)}
                                              </Typography>
                                            </Grid>
                                          </>
                                        )}
                                        <Grid item xs={12}>
                                          <Divider sx={{ my: 1 }} />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                          <Typography variant="subtitle2">
                                            Total:
                                          </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={2}>
                                          <Typography variant="subtitle2" fontWeight={700}>
                                            ₹{parseFloat(orderDetails[order.orderid].data.total || 0).toFixed(2)}
                                          </Typography>
                                        </Grid>
                                      </Grid>
                                    </Box>
                                  </>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No orders found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredOrders.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Status Update Dialog */}
      <Dialog open={openStatusDialog} onClose={handleCloseStatusDialog}>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Order #: {selectedOrder?.orderid}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Customer: {selectedOrder?.user_name}
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Processing">Processing</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog}>Cancel</Button>
          <Button 
            onClick={handleUpdateStatus}
            variant="contained"
            color="primary"
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Helper Grid component since we're not importing it from MUI
const Grid = ({ container, item, spacing, justifyContent, xs, sm, md, children, sx }) => {
  let className = [];
  if (container) className.push('MuiGrid-container');
  if (item) className.push('MuiGrid-item');
  
  const gridStyles = {
    ...(container && {
      display: 'flex',
      flexWrap: 'wrap',
      gap: spacing * 8,
      justifyContent,
    }),
    ...(item && {
      flexBasis: xs === 12 ? '100%' : `${(xs / 12) * 100}%`,
      '@media (min-width: 600px)': {
        flexBasis: sm ? `${(sm / 12) * 100}%` : 'auto',
      },
      '@media (min-width: 960px)': {
        flexBasis: md ? `${(md / 12) * 100}%` : 'auto',
      },
    }),
    ...(sx || {}),
  };
  
  return (
    <Box className={className.join(' ')} sx={gridStyles}>
      {children}
    </Box>
  );
};

export default Orders; 