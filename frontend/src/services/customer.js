import api from './api';

export const customerService = {
    async getCustomers() {
    const response = await api.get('/Customer/customers');
    return response.data;
  },

  async getCustomerById(customerId) {
    const response = await api.get(`/Customer/customers/${customerId}`);
    return response.data;
  },

  async createCustomer(customerData) {
    const response = await api.post('/Customer/add-customer', customerData);
    return response.data;
  },

  async updateCustomer(customerId, customerData) {
    const response = await api.put(`/Customer/customers/${customerId}`, customerData);
    return response.data;
  },

  async deleteCustomer(customerId) {
    const response = await api.delete(`/Customer/customers/${customerId}`);
    return response.data;
  },

  async updateCustomerStatus(customerId, status) {
    const response = await api.patch(`/Customer/customers/${customerId}`, { status });
    return response.data;
  },
  
  async getActiveCustomers() {
    const response = await api.get('/Customer/active-customers');
    return response.data;
  }, 

    async getCountries() {
    const response = await api.get('/Customer/countries/list');
    return response.data.countries || response.data;
  },

  async getStates(countryCode) {
    const response = await api.get(`/Customer/states/${countryCode}`);
    return response.data.states || response.data;
  },

};