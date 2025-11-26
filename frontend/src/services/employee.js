import api from './api';

export const employeeService = {

    async registerEmployee(employeeData) {
    const response = await api.post('/employees/register/employee', employeeData);
    return response.data;
  },
    // Get all employees (admin only)
  async getEmployees() {
    const response = await api.get('/employees');
    return response.data;
  },

  // Get employee by ID
  async getEmployeeById(employeeId) {
    const response = await api.get(`/employees/${employeeId}`);
    return response.data;
  },

  async getCountries() {
  try {
    console.log('🌍 Fetching countries from REST Countries API...');
   
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,cca3');
   
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
   
    const countries = await response.json();
   
    // Debug: Log what we're getting
    console.log('📊 Raw countries data sample:', countries.slice(0, 3));
   
    const formattedCountries = countries.map(country => ({
      id: country.cca2,
      code: country.cca2,
      name: country.name.common
    })).sort((a, b) => a.name.localeCompare(b.name));
   
    console.log('✅ Countries formatted:', formattedCountries.length);
    console.log('🔍 Sample formatted countries:', formattedCountries.slice(0, 5));
   
    return {
      success: true,
      countries: formattedCountries
    };
   
  } catch (error) {
    console.error('❌ Error fetching countries:', error);
    throw error;
  }
},

  // Update employee
  async updateEmployee(employeeId, employeeData) {
    const response = await api.put(`/employees/${employeeId}`, employeeData);
    return response.data;
  },

  // Delete employee
  async deleteEmployee(employeeId) {
    
    const response = await api.delete(`/employees/${employeeId}`);
    return response.data;
  },

  //upload photo for the employee dashboard
  uploadPhoto: (formData) => api.post('/upload/photo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),

    // Get categories for employee dropdowns
  getEmployeeDesignations: async () => {
    const response = await api.get('/categories/employee-designation');
    return response.data;
  },

  getEmployeeDepartments: async () => {
    // Since you have 'employee-role' type, we'll use that for departments
    // Or you might want to create a new type 'employee-department'
    const response = await api.get('/categories/employee-role');
    return response.data;
  },

  // Or get all categories at once
  getAllEmployeeCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
  
  removePhoto: () => api.delete('/upload/photo'),
};