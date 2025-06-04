import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  IconButton,
  Input,
  FormControl,
  FormLabel,
  CircularProgress,
  Tab,
  Tabs,
  Paper,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Image as ImageIcon, Link as LinkIcon, Upload as UploadIcon } from '@mui/icons-material';

// Simple data URL for a gray image with text
const fallbackImageUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='140' viewBox='0 0 300 140'%3E%3Crect width='300' height='140' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='18' text-anchor='middle' dominant-baseline='middle' fill='%23757575'%3ENo Image%3C/text%3E%3C/svg%3E";

// CSS for consistent image styling
const imageStyles = {
  objectFit: 'cover',
  width: '100%',
  height: '200px',
  display: 'block',
};

const previewImageStyles = {
  maxWidth: '100%',
  height: '200px',
  objectFit: 'cover',
  margin: '0 auto',
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    delete_image: false,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [imageInputTab, setImageInputTab] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchExistingImages = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/images');
      const data = await response.json();
      if (data.success) {
        setExistingImages(data.images);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const handleOpen = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        image_url: category.image_url || '',
        delete_image: false,
      });
      setPreviewUrl(category.image_url || '');
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        image_url: '',
        delete_image: false,
      });
      setPreviewUrl('');
    }
    setSelectedFile(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setImagePickerOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      image_url: '',
      delete_image: false,
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setImageInputTab(0);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create a preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData({ ...formData, image_url: url });
    setPreviewUrl(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      const url = editingCategory
        ? `http://localhost:3000/api/categories/${editingCategory.categoryid}`
        : 'http://localhost:3000/api/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';
      
      // Create a FormData object for the multipart/form-data request
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('name', formData.name);
      formDataToSubmit.append('description', formData.description);
      
      // Add the file if selected
      if (selectedFile) {
        formDataToSubmit.append('image', selectedFile);
      } else if (formData.image_url) {
        formDataToSubmit.append('image_url', formData.image_url);
      }
      
      // If editing and there's an existing image but no new file
      if (editingCategory && previewUrl && !selectedFile && !formData.image_url) {
        formDataToSubmit.append('current_image_url', previewUrl);
      }
      
      // Add delete_image flag if present
      if (formData.delete_image) {
        formDataToSubmit.append('delete_image', true);
      }
      
      const response = await fetch(url, {
        method,
        // Don't set Content-Type header when using FormData
        body: formDataToSubmit,
      });

      const data = await response.json();
      if (data.success) {
        fetchCategories();
        handleClose();
      }
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const response = await fetch(`http://localhost:3000/api/categories/${categoryId}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) {
          fetchCategories();
        }
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const handleImageTabChange = (event, newValue) => {
    setImageInputTab(newValue);
    // Clear preview if switching tabs
    if (newValue === 0) {
      setFormData({ ...formData, image_url: '' });
      if (!selectedFile) setPreviewUrl('');
    } else {
      setSelectedFile(null);
      setPreviewUrl(formData.image_url);
    }
  };

  const handleClearImage = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setFormData({
      ...formData,
      image_url: "",
      delete_image: true
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Categories</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Category
        </Button>
      </Box>

      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category.categoryid}>
            <Card>
              <CardMedia
                component="img"
                height={200}
                image={category.image_url || fallbackImageUrl}
                alt={category.name}
                sx={imageStyles}
              />
              <CardContent>
                <Typography variant="h6" component="div">
                  {category.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {category.description}
                </Typography>
              </CardContent>
              <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton onClick={() => handleOpen(category)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDelete(category.categoryid)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Category Name"
              type="text"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            
            <FormControl fullWidth margin="normal">
              <FormLabel>Category Image</FormLabel>
              
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={imageInputTab} onChange={handleImageTabChange}>
                  <Tab icon={<ImageIcon />} label="Upload" />
                  <Tab icon={<LinkIcon />} label="URL" />
                </Tabs>
              </Box>
              
              {imageInputTab === 0 ? (
                <Box sx={{ mt: 2 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    id="category-image-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="category-image-upload">
                    <Button 
                      variant="contained" 
                      component="span"
                      startIcon={<UploadIcon />}
                      sx={{ mr: 1 }}
                    >
                      Select Image
                    </Button>
                    {previewUrl && (
                      <Button 
                        variant="outlined" 
                        color="error"
                        onClick={handleClearImage}
                        startIcon={<DeleteIcon />}
                      >
                        Remove Image
                      </Button>
                    )}
                  </label>
                </Box>
              ) : (
                <TextField
                  margin="dense"
                  label="Image URL"
                  type="url"
                  fullWidth
                  value={formData.image_url}
                  onChange={handleImageUrlChange}
                  placeholder="https://example.com/image.jpg"
                />
              )}
            </FormControl>

            {previewUrl && (
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="subtitle2" gutterBottom>Image Preview</Typography>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    objectFit: 'contain',
                    marginBottom: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = fallbackImageUrl;
                  }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={uploading}
            >
              {uploading ? <CircularProgress size={24} /> : 
                editingCategory ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Categories; 