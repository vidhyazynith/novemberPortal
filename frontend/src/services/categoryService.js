import api from './api';

const CATEGORY_API_URL = '/categories';

export const categoryService = {
  // Get all categories grouped by type with statistics
  async getAllCategories() {
    const response = await api.get(CATEGORY_API_URL);
    return response.data;
  },

  // Get categories by specific type
  async getCategoriesByType(type) {
    const response = await api.get(`${CATEGORY_API_URL}/${type}`);
    return response.data;
  },

  // Get category suggestions
  async getCategorySuggestions(type) {
    const response = await api.get(`${CATEGORY_API_URL}/suggestions/${type}`);
    return response.data;
  },

  // Create new category
  async createCategory(categoryData) {
    const response = await api.post(CATEGORY_API_URL, categoryData);
    return response.data;
  },

  // Update category
  async updateCategory(id, categoryData) {
    const response = await api.put(`${CATEGORY_API_URL}/${id}`, categoryData);
    return response.data;
  },

  // Delete category
  async deleteCategory(id) {
    const response = await api.delete(`${CATEGORY_API_URL}/${id}`);
    return response.data;
  },

  // Validation
  validateCategory(category) {
    const errors = {};
    
    if (!category.name?.trim()) {
      errors.name = 'Category name is required';
    } else if (category.name.length > 100) {
      errors.name = 'Category name cannot exceed 100 characters';
    }
    
    if (!category.type) {
      errors.type = 'Category type is required';
    }
    
    if (category.description && category.description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
    }
    
    return errors;
  }
};

// Default category structure
export const defaultCategory = {
  name: '',
  type: '',
  description: ''
};

// Category type configurations (this is just UI configuration, not hardcoded data)
export const categoryTypes = [
  {
    id: 'employee-role',
    title: 'Employee Departments',
    description: 'Manage job departments in your organization',
    icon: '👨‍💼',
    color: '#3B82F6',
  },
  {
    id: 'employee-designation',
    title: 'Designations',
    description: 'Manage hierarchy levels and position titles',
    icon: '📊',
    color: '#10B981',
  },
  {
    id: 'transaction-income',
    title: 'Income Categories',
    description: 'Manage categories for income tracking',
    icon: '💰',
    color: '#F59E0B',
  },
  {
    id: 'transaction-expense',
    title: 'Expense Categories',
    description: 'Manage categories for expense tracking',
    icon: '💰',
    color: '#F59E0B',
  }
];