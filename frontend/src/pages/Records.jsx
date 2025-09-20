


import React, { useState, useEffect } from "react";
import { PlusCircle, Pen, Trash2,  Search, Filter, X  } from "lucide-react";
import axios from "axios";

export default function RecordManagement() {
  const [showForm, setShowForm] = useState(false);
  const token = localStorage.getItem('token');
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState({
    unitNo: "",
    name: "",
    emailId: "",
    contactNo: "",
    unitType: "",
    areaSqYrd: ""
  });
  const [editingId, setEditingId] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [paymentData, setPaymentData] = useState({
    type: "",
    amount: "",
    date: "",
    description: "",
  });
  const [payments, setPayments] = useState([]);
   const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    recordId: null,
    recordUnitNo: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [unitTypeFilter, setUnitTypeFilter] = useState("");
  const [areaRange, setAreaRange] = useState({ min: "", max: "" });
  const [showFilters, setShowFilters] = useState(false);

  const filteredRecords = records.filter(record => {
    // Search term filter (matches unitNo, name, or email)
    const matchesSearch = 
      record.unitNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.emailId.toLowerCase().includes(searchTerm.toLowerCase());

    // Unit type filter
    const matchesUnitType = !unitTypeFilter || record.unitType === unitTypeFilter;

    // Area range filter
    const recordArea = parseFloat(record.areaSqYrd) || 0;
    const minArea = parseFloat(areaRange.min) || 0;
    const maxArea = parseFloat(areaRange.max) || Infinity;
    const matchesArea = recordArea >= minArea && recordArea <= maxArea;

    return matchesSearch && matchesUnitType && matchesArea;
  });

  // Get unique unit types for filter dropdown
  const unitTypes = [...new Set(records.map(record => record.unitType))].filter(Boolean);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setUnitTypeFilter("");
    setAreaRange({ min: "", max: "" });
  };

  // Fetch records on component mount
  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/record/get',{
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include'
      });

    if (!response.ok) {
    throw new Error('Failed to fetch records');
    }

    const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData({
      ...paymentData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update existing record
        const response = await fetch(`http://localhost:3002/api/record/edit/${editingId}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(formData),
        });

        if (!response.ok) {
        throw new Error('Failed to update record');
        }

        setEditingId(null);
      } else {
        // Create new record
        const response = await fetch('http://localhost:3002/api/record/create', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(formData),
        });

        if (!response.ok) {
        throw new Error('Failed to create record');
        }
      }
      fetchRecords(); // Refresh the list
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving record:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      unitNo: "",
      name: "",
      emailId: "",
      contactNo: "",
      unitType: "",
      areaSqYrd: ""
    });
  };

  const handleEdit = (record) => {
    setFormData({
      unitNo: record.unitNo,
      name: record.name,
      emailId: record.emailId,
      contactNo: record.contactNo,
      unitType: record.unitType,
      areaSqYrd: record.areaSqYrd
    });
    setEditingId(record._id);
    setShowForm(true);
  };

  const handlePaymentSubmit = async (e) => {
  e.preventDefault();

  if (!selectedRecordId) return;

  const payload = {
    invGenRecord: selectedRecordId,
    paymentType: paymentData.type.charAt(0).toUpperCase() + paymentData.type.slice(1), // Capitalize: 'security' → 'Security'
    paymentAmount: Number(paymentData.amount),
    paymentDate: paymentData.date,
    notes: paymentData.description,
  };

  try {
    const response = await fetch('http://localhost:3002/api/payment/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to add payment');
    }

    alert('Payment added successfully');

    // Optionally update local state or refetch payments here
    setPaymentData({
      type: "",
      amount: "",
      date: "",
      description: "",
    });
    setShowPaymentForm(false);
    setSelectedRecordId(null);
  } catch (error) {
    console.error('Error adding payment:', error);
    alert(error.message);
  }
};


  const closePaymentForm = () => {
    setShowPaymentForm(false);
    setSelectedRecordId(null);
    setPaymentData({
      type: "",
      amount: "",
      date: "",
      description: "",
    });
  };

  const handleAddPayment = (id) => {
    setSelectedRecordId(id);
    setShowPaymentForm(true);
  };

  const handleDeleteRecord = async () => {
    if (!deleteModal.recordId) return;
    
    try {
      const response = await fetch(`http://localhost:3002/api/record/delete/${deleteModal.recordId}`, {
        method: 'DELETE',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete record');
      }

      // Remove the record from local state
      setRecords(records.filter(record => record._id !== deleteModal.recordId));
      setDeleteModal({ isOpen: false, recordId: null, recordUnitNo: "" });
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const openDeleteModal = (recordId, unitNo) => {
    setDeleteModal({
      isOpen: true,
      recordId,
      recordUnitNo: unitNo
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      recordId: null,
      recordUnitNo: ""
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 font-sans">Records</h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
        <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Filter className="h-5 w-5 mr-2 text-gray-500" />
            Filters
          </button>

          {/* Add Record Button */}
          <button
            onClick={() => {
              resetForm();
              setEditingId(null);
              setShowForm(!showForm);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center transition-colors duration-200"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Record
          </button>
        </div>
      </div>
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            <button 
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Unit Type Filter */}
            <div>
              <label htmlFor="unitTypeFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Unit Type
              </label>
              <select
                id="unitTypeFilter"
                value={unitTypeFilter}
                onChange={(e) => setUnitTypeFilter(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">All Types</option>
                {unitTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Area Range Filters */}
            <div>
              <label htmlFor="minArea" className="block text-sm font-medium text-gray-700 mb-1">
                Min Area (sq yrd)
              </label>
              <input
                type="number"
                id="minArea"
                value={areaRange.min}
                onChange={(e) => setAreaRange({...areaRange, min: e.target.value})}
                placeholder="Minimum"
                className="mt-1 block w-full pl-3 pr-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              />
            </div>

            <div>
              <label htmlFor="maxArea" className="block text-sm font-medium text-gray-700 mb-1">
                Max Area (sq yrd)
              </label>
              <input
                type="number"
                id="maxArea"
                value={areaRange.max}
                onChange={(e) => setAreaRange({...areaRange, max: e.target.value})}
                placeholder="Maximum"
                className="mt-1 block w-full pl-3 pr-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              />
            </div>
          </div>

          {/* Active Filters */}
          {(searchTerm || unitTypeFilter || areaRange.min || areaRange.max) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: {searchTerm}
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {unitTypeFilter && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Type: {unitTypeFilter}
                  <button 
                    onClick={() => setUnitTypeFilter("")}
                    className="ml-1.5 inline-flex text-green-400 hover:text-green-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {(areaRange.min || areaRange.max) && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Area: {areaRange.min || "0"} - {areaRange.max || "∞"}
                  <button 
                    onClick={() => setAreaRange({ min: "", max: "" })}
                    className="ml-1.5 inline-flex text-purple-400 hover:text-purple-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl mx-auto border border-gray-200 animate-fadeIn">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            {editingId ? "Edit Record" : "New Record"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="unitNo" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit No.
                </label>
                <input
                  type="text"
                  id="unitNo"
                  name="unitNo"
                  value={formData.unitNo}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter unit number"
                />
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label htmlFor="emailId" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="emailId"
                  name="emailId"
                  value={formData.emailId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label htmlFor="contactNo" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact No.
                </label>
                <input
                  type="tel"
                  id="contactNo"
                  name="contactNo"
                  value={formData.contactNo}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter contact number"
                />
              </div>
              <div>
                <label htmlFor="unitType" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Type
                </label>
                <select
                  id="unitType"
                  name="unitType"
                  value={formData.unitType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="" disabled>Select unit type</option>
                  <option value="1 BHK">1 BHK</option>
                  <option value="2 BHK">2 BHK</option>
                  <option value="3 BHK">3 BHK</option>
                  <option value="Studio">Studio</option>
                  <option value="Penthouse">Penthouse</option>
                </select>
              </div>

              <div>
                <label htmlFor="areaSqYrd" className="block text-sm font-medium text-gray-700 mb-1">
                  Area (sq. yards)
                </label>
                <input
                  type="number"
                  id="areaSqYrd"
                  name="areaSqYrd"
                  value={formData.areaSqYrd}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter area in square yards"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                {editingId ? "Update" : "Submit"}
              </button>
            </div>
          </form>
        </div>
        </div>
      )}

      {/* Payment form remains the same */}
      {showPaymentForm && selectedRecordId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Add Payment</h2>
            <p className="text-sm text-gray-600 mb-4">Adding payment for Record ID: {selectedRecordId}</p>
            <form onSubmit={handlePaymentSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={paymentData.type}
                    onChange={handlePaymentInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select payment type</option>
                    <option value="security">Security</option>
                    <option value="facility">Facility</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Amount
                  </label>
                  <input
                    type="text"
                    id="amount"
                    name="amount"
                    value={paymentData.amount}
                    onChange={handlePaymentInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter payment amount"
                  />
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={paymentData.date}
                    onChange={handlePaymentInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={paymentData.description}
                    onChange={handlePaymentInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter payment description"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closePaymentForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                >
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit No.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Area
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No records found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.unitNo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.unitType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.areaSqYrd}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.emailId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                    <button
                      onClick={() => handleEdit(record)}
                      className="text-blue-600 hover:text-blue-900 transition-colors duration-200 p-1"
                      title="Edit"
                    >
                      <Pen className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(record._id, record.unitNo)}
                      className="text-red-600 hover:text-red-900 transition-colors duration-200 p-1"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleAddPayment(record._id)}
                      className="text-green-600 hover:text-green-900 hover:underline font-medium transition-colors duration-200"
                    >
                      Add Payment
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-4 border border-gray-200 animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Confirm Deletion</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete record for Unit No. {deleteModal.recordUnitNo}? 
              This will also delete all associated payments and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRecord}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
