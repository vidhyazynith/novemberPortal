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
    // Format the address data for the new structure
    const formattedData = this.formatCustomerData(customerData);
    const response = await api.post('/Customer/add-customer', formattedData);
    return response.data;
  },
 
  async updateCustomer(customerId, customerData) {
    // Format the address data for the new structure
    const formattedData = this.formatCustomerData(customerData);
    const response = await api.put(`/Customer/customers/${customerId}`, formattedData);
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
 
  // Helper function to format customer data for the new address structure
  formatCustomerData(customerData) {
    // If address is already in the new format (has country.code and state.code), return as-is
    if (customerData.address &&
        customerData.address.country &&
        typeof customerData.address.country === 'object' &&
        customerData.address.country.code &&
        customerData.address.state &&
        typeof customerData.address.state === 'object' &&
        customerData.address.state.code) {
      return customerData;
    }
 
    // If address is in old format or partial format, convert it
    const formattedData = { ...customerData };
   
    if (formattedData.address) {
      // Handle country - could be string or partial object
      let countryObj = { code: '', name: '' };
      if (formattedData.address.country) {
        if (typeof formattedData.address.country === 'string') {
          // Old format: country is a string
          countryObj = {
            code: formattedData.address.country.toUpperCase().substring(0, 2),
            name: formattedData.address.country
          };
        } else if (formattedData.address.country.code) {
          // Already has code, ensure name exists
          countryObj = {
            code: formattedData.address.country.code.toUpperCase(),
            name: formattedData.address.country.name || formattedData.address.country.code
          };
        }
      }
 
      // Handle state - could be string or partial object
      let stateObj = { code: '', name: '' };
      if (formattedData.address.state) {
        if (typeof formattedData.address.state === 'string') {
          // Old format: state is a string
          stateObj = {
            code: formattedData.address.state.toUpperCase().substring(0, 2),
            name: formattedData.address.state
          };
        } else if (formattedData.address.state.code) {
          // Already has code, ensure name exists
          stateObj = {
            code: formattedData.address.state.code.toUpperCase(),
            name: formattedData.address.state.name || formattedData.address.state.code
          };
        }
      }
 
      // Update the address with formatted objects
      formattedData.address = {
        addressLine1: formattedData.address.addressLine1 || '',
        addressLine2: formattedData.address.addressLine2 || '',
        country: countryObj,
        state: stateObj,
        city: formattedData.address.city || '',
        pinCode: formattedData.address.pinCode || ''
      };
    }
 
    return formattedData;
  },
 
  // Helper function to extract address for display
  formatAddressForDisplay(customer) {
    if (!customer || !customer.address) return '';
   
    const addr = customer.address;
    const parts = [];
   
    if (addr.addressLine1) parts.push(addr.addressLine1);
    if (addr.addressLine2) parts.push(addr.addressLine2);
   
    const cityStatePin = [];
    if (addr.city) cityStatePin.push(addr.city);
   
    // Handle both old and new state format
    if (addr.state) {
      if (typeof addr.state === 'string') {
        cityStatePin.push(addr.state);
      } else if (addr.state.name) {
        cityStatePin.push(addr.state.name);
      }
    }
   
    if (addr.pinCode) cityStatePin.push(addr.pinCode);
   
    if (cityStatePin.length > 0) parts.push(cityStatePin.join(', '));
   
    // Handle both old and new country format
    if (addr.country) {
      if (typeof addr.country === 'string') {
        parts.push(addr.country);
      } else if (addr.country.name) {
        parts.push(addr.country.name);
      }
    }
   
    return parts.join('\n');
  },
 
  // Run migration for existing customers (call this once from admin panel)
  async migrateCustomerAddresses() {
    const response = await api.post('/Customer/migrate-addresses');
    return response.data;
  }
};