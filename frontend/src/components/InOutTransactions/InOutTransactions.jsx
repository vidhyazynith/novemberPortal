import React, { useState, useEffect } from "react";
import { transactionService, typeOptions } from "../../services/transactions";
import { categoryService } from "../../services/categoryService";
import "./InOutTransactions.css";
 
const InOutTransactions = ({ onTransactionUpdate }) => {
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]); // Store all transactions
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionCategories, setTransactionCategories] = useState({
    income: [],
    expense: []
  });
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: '',
    category: '',
    remarks: '',
    attachment: null,
  });
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [totals, setTotals] = useState({
    income: 0,
    expenses: 0,
    net: 0
  });
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRecentOnly, setShowRecentOnly] = useState(true);
 
  // Fetch transactions and categories from backend
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterType) filters.type = filterType;
      if (filterCategory) filters.category = filterCategory;
      if (search) filters.search = search;
 
      const data = await transactionService.getTransactions(filters);
      setAllTransactions(data.transactions || []);
     
      // Apply recent transactions filter by default
      if (showRecentOnly) {
        const recentTransactions = getRecentTransactions(data.transactions || []);
        setTransactions(recentTransactions);
      } else {
        setTransactions(data.transactions || []);
      }
     
      setTotals(data.totals || { income: 0, expenses: 0, net: 0 });
      if (onTransactionUpdate) {
        onTransactionUpdate();
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setErrorMessage('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };
 
  // Get recent transactions (last 30 days)
  const getRecentTransactions = (transactionsList) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
   
    return transactionsList.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= thirtyDaysAgo;
    });
  };
 
  // Apply date filter
  const applyDateFilter = (selectedDate) => {
    if (!selectedDate) {
      // If no date selected, show recent transactions
      if (showRecentOnly) {
        setTransactions(getRecentTransactions(allTransactions));
      } else {
        setTransactions(allTransactions);
      }
      return;
    }
 
    const filtered = allTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const filterDate = new Date(selectedDate);
     
      return transactionDate.toDateString() === filterDate.toDateString();
    });
   
    setTransactions(filtered);
  };
 
  // Fetch transaction categories
  const fetchTransactionCategories = async () => {
    try {
      const response = await categoryService.getTransactionCategories();
      if (response.success) {
        setTransactionCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching transaction categories:', error);
      setErrorMessage('Failed to load categories');
    }
  };
 
  useEffect(() => {
    fetchTransactions();
    fetchTransactionCategories();
  }, [filterType, filterCategory, search]);
 
  // Update category options when transaction type changes
  useEffect(() => {
    if (newTransaction.type === 'Income') {
      setCategoryOptions(transactionCategories.income.map(cat => cat.name));
    } else if (newTransaction.type === 'Expense') {
      setCategoryOptions(transactionCategories.expense.map(cat => cat.name));
    } else {
      setCategoryOptions([]);
    }
   
    // Reset category when type changes
    if (newTransaction.type) {
      setNewTransaction(prev => ({ ...prev, category: '' }));
    }
  }, [newTransaction.type, transactionCategories]);
 
  // Handle recent transactions toggle
  useEffect(() => {
    if (showRecentOnly) {
      setTransactions(getRecentTransactions(allTransactions));
    } else {
      setTransactions(allTransactions);
    }
    // Clear date filter when toggling recent transactions
    setDateFilter('');
  }, [showRecentOnly, allTransactions]);
 
  // Handle date filter change
  useEffect(() => {
    applyDateFilter(dateFilter);
  }, [dateFilter, allTransactions]);
 
  // Open detail view modal
  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setDetailModalOpen(true);
  };
 
  // Close detail view modal
  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedTransaction(null);
  };
 
  // Download attachment
  const handleDownloadAttachment = async (transactionId, fileName) => {
    try {
      const response = await transactionService.downloadAttachment(transactionId);
     
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      setErrorMessage('Failed to download attachment');
    }
  };
 
  // Add new transaction
  const handleAddTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount || !newTransaction.type || !newTransaction.category) {
      setErrorMessage('Please fill in all required fields: Description, Amount, Type, and Category');
      return;
    }
 
    try {
      await transactionService.addTransaction(newTransaction);
     
      setSuccessMessage('Transaction added successfully!');
      setNewTransaction({
        description: '',
        amount: '',
        type: '',
        category: '',
        remarks: '',
        attachment: null
      });
      setOpen(false);
     
      fetchTransactions();
      if (onTransactionUpdate) {
        onTransactionUpdate();
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      setErrorMessage('Failed to add transaction');
    }
  };
 
  // Delete transaction
  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionService.deleteTransaction(transactionId);
        setSuccessMessage('Transaction deleted successfully');
        fetchTransactions();
        if (onTransactionUpdate) {
          onTransactionUpdate();
        }
      } catch (error) {
        console.error('Error deleting transaction:', error);
        setErrorMessage('Failed to delete transaction');
      }
    }
  };
 
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xlsx'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
     
      if (!allowedTypes.includes(fileExtension)) {
        setErrorMessage('Please select a valid file type: PDF, JPG, PNG, DOC, DOCX, XLSX');
        return;
      }
 
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('File size must be less than 5MB');
        return;
      }
 
      setNewTransaction({
        ...newTransaction,
        attachment: file
      });
    }
  };
 
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };
 
  // Format currency in Indian Rupees
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
 
  // Get all available categories for filter dropdown
  const getAllCategories = () => {
    const allCategories = [
      ...transactionCategories.income.map(cat => cat.name),
      ...transactionCategories.expense.map(cat => cat.name)
    ];
    return [...new Set(allCategories)]; // Remove duplicates
  };
 
  // Clear date filter
  const clearDateFilter = () => {
    setDateFilter('');
  };
 
  return (
    <div className="transactions-container">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="alert success">
          {successMessage}
          <button onClick={() => setSuccessMessage('')} className="close-alert">×</button>
        </div>
      )}
     
      {errorMessage && (
        <div className="alert error">
          {errorMessage}
          <button onClick={() => setErrorMessage('')} className="close-alert">×</button>
        </div>
      )}
 
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card income">
          <div className="card-icon">↑</div>
          <div className="card-content">
            <h3>Total Income</h3>
            <div className="amount">{formatCurrency(totals.income)}</div>
          </div>
        </div>
       
        <div className="summary-card expense">
          <div className="card-icon">↓</div>
          <div className="card-content">
            <h3>Total Expenses</h3>
            <div className="amount">{formatCurrency(totals.expenses)}</div>
          </div>
        </div>
       
        <div className="summary-card net">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>Net Income</h3>
            <div className={`amount ${totals.net >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(totals.net)}
            </div>
          </div>
        </div>
      </div>
 
      {/* Transaction History Header */}
      <div className="transaction-history-header">
        <h2>
          Transaction History ({transactions.length} records)
         
          {dateFilter && <span className="date-filter-badge">Filtered by Date</span>}
        </h2>
        <button className="add-transaction-btn" onClick={() => setOpen(true)}>
          + Add Transaction
        </button>
      </div>
 
      {/* Search and Filters */}
      <div className="filters-section">
        <div className="filters-left">
          <input
            type="text"
            className="search-input"
            placeholder="Search transactions or remarks"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
         
          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
 
          {/* Date Filter */}
          <div className="date-filter-container">
            <button
              className="date-filter-btn"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              📅 {dateFilter ? formatDate(dateFilter) : 'Filter by Date'}
            </button>
           
            {showCalendar && (
              <div className="calendar-popup">
                <div className="calendar-header">
                  <h4>Select Date</h4>
                  <button
                    className="clear-date-btn"
                    onClick={clearDateFilter}
                  >
                    Clear
                  </button>
                </div>
                <input
                  type="date"
                  className="date-picker"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setShowCalendar(false);
                  }}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}
          </div>
        </div>
 
        <div className="filters-right">
          {/* Recent Transactions Toggle */}
          <div className="recent-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showRecentOnly}
                onChange={(e) => setShowRecentOnly(e.target.checked)}
                disabled={!!dateFilter}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className="toggle-text">Show Recent Only</span>
          </div>
 
          {dateFilter && (
            <button
              className="clear-filters-btn"
              onClick={clearDateFilter}
            >
              Clear Date Filter
            </button>
          )}
        </div>
      </div>
 
      {/* Transactions Table */}
      <div className="transactions-table-container">
        {loading ? (
          <div className="loading">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="no-transactions">
            {dateFilter ? (
              <p>No transactions found for the selected date.</p>
            ) : showRecentOnly ? (
              <p>No recent transactions found in the last 30 days.</p>
            ) : (
              <p>No transactions found.</p>
            )}
          </div>
        ) : (
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Remarks</th>
                <th>Attachment</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id} onClick={() => handleViewDetails(transaction)}>
                  <td>{formatDate(transaction.date)}</td>
                  <td className="description-cell">{transaction.description}</td>
                  <td>
                    <span className={`category-tag ${transaction.type.toLowerCase()}`}>
                      {transaction.category}
                    </span>
                  </td>
                  <td className={`amount-cell ${transaction.type.toLowerCase()}`}>
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="remarks-cell">
                    {transaction.remarks || 'No remarks'}
                  </td>
                  <td className="attachment-cell">
                    {transaction.attachment ? (
                      <div className="file-attachment">
                        <span className="file-icon">📁</span>
                        <span className="file-name">{transaction.attachment.originalName}</span>
                      </div>
                    ) : (
                      <span className="no-file">No file</span>
                    )}
                  </td>
                  <td>
                    <span className={`type-badge ${transaction.type.toLowerCase()}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="action-btn-view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(transaction);
                      }}
                      title="View Details"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                    <button
                      className="action-btn-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTransaction(transaction._id);
                      }}
                      title="Delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
 
      {/* Add Transaction Modal */}
      {open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Transaction</h2>
              <button className="close-btn" onClick={() => setOpen(false)}>×</button>
            </div>
           
            <div className="modal-body">
              <div className="form-group">
                <label className="required">Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  placeholder="Enter transaction description"
                  required
                />
              </div>
 
              <div className="form-group">
                <label className="required">Amount</label>
                <input
                  type="number"
                  className="form-input"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  placeholder="Enter amount"
                  required
                />
              </div>
 
              <div className="form-group">
                <label className="required">Type</label>
                <select
                  className="form-select"
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
                  required
                >
                  <option value="">Select Type</option>
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
 
              <div className="form-group">
                <label className="required">Category</label>
                <select
                  className="form-select"
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  required
                  disabled={!newTransaction.type}
                >
                  <option value="">
                    {newTransaction.type ? `Select ${newTransaction.type} Category` : 'Select Type First'}
                  </option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {!newTransaction.type && (
                  <p className="form-hint"></p>
                )}
              </div>
 
              <div className="form-group">
                <label>Remarks</label>
                <textarea
                  className="form-textarea"
                  value={newTransaction.remarks}
                  onChange={(e) => setNewTransaction({ ...newTransaction, remarks: e.target.value })}
                  rows="3"
                  placeholder="Add any additional notes or details..."
                />
              </div>
 
              <div className="form-group">
                <label>Attach Receipt (Optional)</label>
                <div className="file-upload-section">
                  <input
                    type="file"
                    id="attachment-upload"
                    className="file-input"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="attachment-upload" className="file-upload-label">
                    {newTransaction.attachment ? (
                      <>
                        <span className="file-icon">📁</span>
                        <span>{newTransaction.attachment.name}</span>
                      </>
                    ) : (
                      'CHOOSE FILE (PDF, IMAGE, DOCUMENT)'
                    )}
                  </label>
                  <p className="file-hint">Max file size: 5MB • Supported: PDF, JPG, PNG, DOC, XLSX</p>
                </div>
              </div>
            </div>
 
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setOpen(false)}>
                CANCEL
              </button>
              <button
                className="btn-primary"
                onClick={handleAddTransaction}
                disabled={!newTransaction.description || !newTransaction.amount || !newTransaction.type || !newTransaction.category}
              >
                ADD TRANSACTION
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* Transaction Details Modal */}
      {detailModalOpen && selectedTransaction && (
        <div className="modal-overlay">
          <div className="modal-content details-modal">
            <div className="modal-header">
              <h2>Transaction Details</h2>
              <p className="read-only-note">Read Only - No editing allowed</p>
              <button className="close-btn" onClick={handleCloseDetailModal}>×</button>
            </div>
           
            <div className="modal-body">
              <div className="details-grid">
                <div className="details-column">
                  <div className="detail-item">
                    <label>Date</label>
                    <p>{formatDate(selectedTransaction.date)}</p>
                  </div>
                  <div className="detail-item">
                    <label>Description</label>
                    <p>{selectedTransaction.description}</p>
                  </div>
                  <div className="detail-item">
                    <label>Category</label>
                    <span className={`category-tag ${selectedTransaction.type.toLowerCase()}`}>
                      {selectedTransaction.category}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Type</label>
                    <span className={`type-badge ${selectedTransaction.type.toLowerCase()}`}>
                      {selectedTransaction.type}
                    </span>
                  </div>
                </div>
               
                <div className="details-column">
                  <div className="detail-item">
                    <label>Amount</label>
                    <p className={`amount-large ${selectedTransaction.type.toLowerCase()}`}>
                      {formatCurrency(selectedTransaction.amount)}
                    </p>
                  </div>
                  <div className="detail-item">
                    <label>Attachment</label>
                    {selectedTransaction.attachment ? (
                      <div className="attachment-details">
                        <span className="file-icon">📁</span>
                        <span className="file-name">{selectedTransaction.attachment.originalName}</span>
                        <button
                          className="download-btn"
                          onClick={() => handleDownloadAttachment(selectedTransaction._id, selectedTransaction.attachment.originalName)}
                        >
                          Download
                        </button>
                      </div>
                    ) : (
                      <p className="no-attachment">No attachment</p>
                    )}
                  </div>
                </div>
              </div>
 
              <div className="remarks-section">
                <label>Remarks</label>
                <div className="remarks-box">
                  {selectedTransaction.remarks || 'No remarks provided'}
                </div>
              </div>
            </div>
 
            <div className="modal-actions">
              <button className="btn-primary full-width" onClick={handleCloseDetailModal}>
                CLOSE DETAILS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default InOutTransactions;