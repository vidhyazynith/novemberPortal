import Customer from "../models/Customer.js";
import { parsePhoneNumberFromString } from 'libphonenumber-js';
 
// Add customer
export const addCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, company, customerType, status, paymentTerms } = req.body;
   
    // Validation
    if (!name || !email || !phone) {
      return res.status(400).json({ message: "Contact Person, email, and phone are required fields" });
    }

    // Validate phone number format
    if (phone) {
      const phoneNumber = parsePhoneNumberFromString(phone);
      if (!phoneNumber || !phoneNumber.isValid()) {
        return res.status(400).json({ message: 'Invalid phone number format for the selected country' });
      }
    }

    // Validate payment terms
    const paymentTermsValue = paymentTerms || 30;
    if (paymentTermsValue < 0 || paymentTermsValue > 365) {
      return res.status(400).json({ message: "Payment terms must be between 0 and 365 days" });
    }
 
    // Check if customer already exists with same email
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ message: "Customer with this email already exists" });
    }
 
    const newCustomer = new Customer({
      name,
      email,
      phone,
      address: address || '',
      company: company || '',
      customerType: customerType || 'individual',
      paymentTerms: paymentTermsValue,
      status: status || 'active', // Include status with default value
      joinDate: new Date() // Add join date
    });
   
    await newCustomer.save();
    res.status(201).json({ message: "Customer added successfully", customer: newCustomer });
  } catch (error) {
    console.error("Error adding customer:", error);
    res.status(500).json({ message: "Error adding customer", error: error.message });
  }
};
 
// Get all customers
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    console.log('Customers with status:', customers.map(cust => ({
      name: cust.name,
      email: cust.email,
      status: cust.status,
      paymentTerms: cust.paymentTerms,
      paymentTermsDisplay: cust.paymentTermsDisplay
    })));
    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Error fetching customers", error: error.message });
  }
};
 
// Get customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ message: "Error fetching customer", error: error.message });
  }
};
 
// Update customer
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, phone, paymentTerms, ...otherFields } = req.body;

    // Validate phone number if provided
    if (phone) {
      const phoneNumber = parsePhoneNumberFromString(phone);
      if (!phoneNumber || !phoneNumber.isValid()) {
        return res.status(400).json({ message: 'Invalid phone number format for the selected country' });
      }
    }

    // Validate payment terms if provided
    const paymentTermsValue = paymentTerms !== undefined ? paymentTerms : otherFields.paymentTerms;
    if (paymentTermsValue !== undefined && (paymentTermsValue < 0 || paymentTermsValue > 365)) {
      return res.status(400).json({ message: "Payment terms must be between 0 and 365 days" });
    }
   
    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      {
        ...otherFields,
        ...(phone && { phone }),
        ...(paymentTerms !== undefined && { paymentTerms }),
        status: status || 'active' // Ensure status is included
      },
      { new: true, runValidators: true }
    );
   
    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }
   
    res.json({ message: "Updated Customer successfully", customer: updatedCustomer });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ message: "Error updating customer", error: error.message });
  }
};
 
// Delete customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCustomer = await Customer.findByIdAndDelete(id);
   
    if (!deletedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }
   
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ message: "Error deleting customer", error: error.message });
  }
};
 
// Update customer status
export const updateCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
   
    // Validate status
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: "Status must be either 'active' or 'inactive'" });
    }
   
    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
   
    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }
   
    res.json({
      message: `Customer status updated to ${status} successfully`,
      customer: updatedCustomer
    });
  } catch (error) {
    console.error("Error updating customer status:", error);
    res.status(500).json({ message: "Error updating customer status", error: error.message });
  }
};