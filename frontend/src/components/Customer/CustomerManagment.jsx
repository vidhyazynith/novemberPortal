import React, { useState, useEffect } from 'react';
import { customerService } from '../../services/customer';
import './CustomerManagment.css';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { isValidPhoneNumber } from 'react-phone-number-input';

const CustomerManagment = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [phoneError, setPhoneError] = useState('');
  const [paymentTermsError, setPaymentTermsError] = useState('');

  // Form state with proper default values
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    customerType: 'individual',
    paymentTerms: 30 // Default to 30 days as number
  });

  // Payment terms display function
  const getPaymentTermsDisplay = (terms) => {
    if (terms === 0) return 'Due on receipt';
    if (terms === 1) return 'Net 1 day';
    return `Net ${terms} days`;
  };

  // Fetch customers from MongoDB
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      alert('Error fetching customers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convert paymentTerms to number
    if (name === 'paymentTerms') {
      const numValue = value === '' ? '' : Number(value);
      setForm({ ...form, [name]: numValue });
      
      // Validate payment terms
      // if (value === '') {
      //   setPaymentTermsError('Payment terms is required');
      if (numValue < 0 || numValue > 365) {
        setPaymentTermsError('Payment terms must be between 0 and 365 days');
      } else {
        setPaymentTermsError('');
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Phone validation function
  const validatePhoneNumber = (phone) => {
    if (!phone) {
      setPhoneError('Phone number is required');
      return false;
    }
    
    if (!isValidPhoneNumber(phone)) {
      setPhoneError('Please enter a valid phone number for the selected country');
      return false;
    }
    
    setPhoneError('');
    return true;
  };

  // Validate payment terms
  const validatePaymentTerms = (paymentTerms) => {
    // if (paymentTerms === '' || paymentTerms === null || paymentTerms === undefined) {
    //   setPaymentTermsError('Payment terms is required');
    //   return false;
    // }
    
    const terms = Number(paymentTerms);
    if (isNaN(terms)) {
      setPaymentTermsError('Payment terms must be a number');
      return false;
    }
    
    if (terms < 0 || terms > 365) {
      setPaymentTermsError('Payment terms must be between 0 and 365 days');
      return false;
    }
    
    setPaymentTermsError('');
    return true;
  };

  // Handle phone number change
  const handlePhoneChange = (value) => {
    setForm({
      ...form,
      phone: value
    });
    
    // Real-time phone validation
    if (value) {
      if (!isValidPhoneNumber(value)) {
        setPhoneError('Please enter a valid phone number for the selected country');
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('Phone number is required');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
   
    try {
      // Validate phone number
      if (!validatePhoneNumber(form.phone)) {
        setLoading(false);
        return;
      }

      // Validate payment terms
      if (!validatePaymentTerms(form.paymentTerms)) {
        setLoading(false);
        return;
      }

      // Prepare data for submission
      const submitData = {
        ...form,
        paymentTerms: form.paymentTerms === '' ? 30 : Number(form.paymentTerms)
      };

      if (editingCustomer) {
        // Update existing customer
        await customerService.updateCustomer(editingCustomer._id, submitData);
        alert('Customer updated successfully!');
      } else {
        // Add new customer
        await customerService.createCustomer(submitData);
        alert('Customer added successfully!');
      }
     
      // Refresh customers list
      await fetchCustomers();
     
      // Reset form
      setForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        company: '',
        customerType: 'individual',
        paymentTerms: 30
      });
      setShowAddForm(false);
      setEditingCustomer(null);
      setPhoneError('');
      setPaymentTermsError('');
    } catch (error) {
      alert('Error saving customer: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setForm({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      company: customer.company || '',
      customerType: customer.customerType || 'individual',
      paymentTerms: customer.paymentTerms || 30
    });
    setEditingCustomer(customer);
    setPhoneError('');
    setPaymentTermsError('');
    setShowAddForm(true);
  };

  const handleStatusChange = async (customerId, currentStatus, newStatus) => {
    const confirmationMessage = `Are you sure you want to change the status from ${currentStatus} to ${newStatus}?`;
   
    if (window.confirm(confirmationMessage)) {
      try {
        await customerService.updateCustomerStatus(customerId, newStatus);
        await fetchCustomers();
       
        // Auto-switch tabs based on new status
        if (newStatus === 'active') {
          setActiveTab('active');
        } else {
          setActiveTab('inactive');
        }
      } catch (error) {
        alert('Error updating customer status: ' + error.message);
      }
    }
  };

  const handleCancel = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      company: '',
      customerType: 'individual',
      paymentTerms: 30
    });
    setShowAddForm(false);
    setEditingCustomer(null);
    setPhoneError('');
    setPaymentTermsError('');
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  // Filter customers based on active tab
  const statusFilteredCustomers = filteredCustomers.filter(customer =>
    activeTab === 'active'
      ? customer.status === 'active' || !customer.status
      : customer.status === 'inactive'
  );

  const activeCustomers = customers.filter(c => c.status === 'active' || !c.status).length;
  const inactiveCustomers = customers.filter(c => c.status === 'inactive').length;
  const corporateCustomers = customers.filter(c => c.customerType === 'corporate').length;

  return (
    <div className="customer-management-container">
      {/* Stats Cards */}
      <div className="customer-stats-grid">
        <div className="customer-stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Customers</h3>
            <span className="stat-number">{customers.length}</span>
          </div>
        </div>
       
        <div className="customer-stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Active Customers</h3>
            <span className="stat-number">{activeCustomers}</span>
          </div>
        </div>
       
        <div className="customer-stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>Corporate Clients</h3>
            <span className="stat-number">{corporateCustomers}</span>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="customer-actions-section">
        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search customers by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="action-buttons-header">
            <button
              className="add-customer-btn"
              onClick={() => setShowAddForm(true)}
            >
              <span className="btn-icon">+</span>
              Add Customer
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Customer Form */}
      {showAddForm && (
        <div className="customer-forme-modal">
          <div className="customer-forme-card">
            <div className="forme-header">
              <h3>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button className="close-btn" onClick={handleCancel}>×</button>
            </div>
           
            <form onSubmit={handleSubmit} className="customer-forme">
              <div className="forme-grid">
                <div className="forme-group">
                  <label>Contact Person *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter contact person name"
                    required
                  />
                </div>
               
                <div className="forme-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>
               
                <div className="forme-group">
                  <label>Phone Number *</label>
                  <div className="phone-input-container">
                    <PhoneInput
                      international
                      countryCallingCodeEditable={false}
                      defaultCountry="IN"
                      value={form.phone}
                      onChange={handlePhoneChange}
                      placeholder="Enter phone number"
                      className={`customer-phone-input ${phoneError ? 'invalid-input' : ''}`}
                    />
                  </div>
                  {phoneError && (
                    <small className="error-text" style={{ color: '#dc2626', marginTop: '4px' }}>
                      {phoneError}
                    </small>
                  )}
                  <small style={{ color: '#64748b', marginTop: phoneError ? '2px' : '6px' }}>
                    Select country code and enter phone number
                  </small>
                </div>
               
                <div className="forme-group">
                  <label>Customer Type</label>
                  <select
                    name="customerType"
                    value={form.customerType}
                    onChange={handleChange}
                  >
                    <option value="individual">Individual</option>
                    <option value="corporate">Corporate</option>
                  </select>
                </div>
               
                <div className="forme-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Enter company name"
                  />
                </div>

                <div className="forme-group">
                  <label>Payment Terms (Days) *</label>
                  <input
                    type="number"
                    name="paymentTerms"
                    value={form.paymentTerms}
                    onChange={handleChange}
                    placeholder="Enter payment terms in days"
                    min="1"
                    max="365"
                    // required
                  />
                  {paymentTermsError && (
                    <small className="error-text" style={{ color: '#dc2626', marginTop: '4px' }}>
                      {paymentTermsError}
                    </small>
                  )}
                  <small style={{ color: '#64748b', marginTop: paymentTermsError ? '2px' : '6px' }}>
                    Number of days for payment (1-365).
                  </small>
                </div>
               
                <div className="forme-group full-width">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter full address"
                    rows="3"
                  />
                </div>
              </div>
             
              <div className="forme-actions">
                <button type="button" className="cancel-btn" onClick={handleCancel}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn" 
                  disabled={loading || phoneError || paymentTermsError}
                >
                  {loading ? 'Saving...' : (editingCustomer ? 'Update Customer' : 'Add Customer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Customers Table with Embedded Tabs */}
      <div className="customers-table-section">
        {/* Tab Navigation - Embedded in table card */}
        <div className="table-card-header">
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              Active Customers
            </button>
            <button
              className={`tab-button ${activeTab === 'inactive' ? 'active' : ''}`}
              onClick={() => setActiveTab('inactive')}
            >
              Inactive Customers
            </button>
          </div>
        </div>
       
        <div className="table-header">
          <h2>Customer List ({statusFilteredCustomers.length})</h2>
        </div>
       
        <div className="customers-table-container">
          <table className="customers-table">
            <thead>
              <tr>
                <th>Contact Person</th>
                <th>Contact Info</th>
                <th>Company</th>
                <th>Type</th>
                <th>Payment Terms</th>
                <th>Join Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="empty-cell">
                    Loading customers...
                  </td>
                </tr>
              ) : statusFilteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-cell">
                    No {activeTab === 'active' ? 'active' : 'inactive'} customers found
                  </td>
                </tr>
              ) : (
                statusFilteredCustomers.map(customer => (
                  <tr key={customer._id} className="customer-row">
                    <td>
                      <div className="customer-info">
                        <div className="customer-name">{customer.name}</div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="customer-email">{customer.email}</div>
                        <div className="customer-phone">{customer.phone}</div>
                      </div>
                    </td>
                    <td>
                      <div className="company-info">
                        {customer.company || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <span className={`customer-type ${customer.customerType}`}>
                        {customer.customerType}
                      </span>
                    </td>
                    <td>
                      <div className="payment-terms">
                        {getPaymentTermsDisplay(customer.paymentTerms)}
                      </div>
                    </td>
                    <td>
                      <div className="join-date">
                        {customer.joinDate
                          ? new Date(customer.joinDate).toLocaleDateString()
                          : customer.createdAt
                            ? new Date(customer.createdAt).toLocaleDateString()
                            : 'N/A'
                        }
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${customer.status || 'active'}`}>
                        {(customer.status || 'active').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEdit(customer)}
                        >
                          Edit
                        </button>
                        {activeTab === 'active' ? (
                          <button
                            className="action-btn deactivate-btn"
                            onClick={() => handleStatusChange(customer._id, 'active', 'inactive')}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            className="action-btn activate-btn"
                            onClick={() => handleStatusChange(customer._id, 'inactive', 'active')}
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerManagment;