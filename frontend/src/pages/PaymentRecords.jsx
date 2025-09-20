"use client"

import { useState, useEffect, useMemo } from "react"
import { ArrowDownToLine } from 'lucide-react';

export default function PaymentRecords() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUnitType, setSelectedUnitType] = useState("")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("")
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editPayment, setEditPayment] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInvoiceGenerating, setIsInvoiceGenerating] = useState(false)
  const [formData, setFormData] = useState({
    paymentType: "",
    paymentAmount: "",
    paymentDate: "",
    notes: ""
  })

  // API call to fetch payment data
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3002/api/payment/get')
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }
      const result = await response.json()
      setData(result || [])
    } catch (error) {
      console.error('Error fetching payment data:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  // Get unique unit types for filter
  const unitTypes = useMemo(() => {
    const types = [...new Set(data.map((record) => record.unitType))]
    return types.filter(Boolean)
  }, [data])

  // Filter and search logic
  const filteredData = useMemo(() => {
    return data.filter((record) => {
      const matchesSearch =
        record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.unitNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.emailId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.contactNo.includes(searchTerm)

      const matchesUnitType = !selectedUnitType || record.unitType === selectedUnitType

      const matchesPaymentStatus =
        !paymentStatusFilter ||
        (paymentStatusFilter === "with-payments" && record.payments.length > 0) ||
        (paymentStatusFilter === "no-payments" && record.payments.length === 0)

      return matchesSearch && matchesUnitType && matchesPaymentStatus
    })
  }, [data, searchTerm, selectedUnitType, paymentStatusFilter])

  const openPaymentModal = (record) => {
    setSelectedRecord(record)
    setIsModalOpen(true)
  }

  const closePaymentModal = () => {
    setSelectedRecord(null)
    setIsModalOpen(false)
  }

  const openEditModal = (payment) => {
    setEditPayment(payment)
    setFormData({
      paymentType: payment.paymentType,
      paymentAmount: payment.paymentAmount,
      paymentDate: payment.paymentDate.split('T')[0],
      notes: payment.notes || ""
    })
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setEditPayment(null)
    setIsEditModalOpen(false)
    setFormData({
      paymentType: "",
      paymentAmount: "",
      paymentDate: "",
      notes: ""
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleUpdatePayment = async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/payment/update/${editPayment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentType: formData.paymentType,
          paymentAmount: Number(formData.paymentAmount),
          paymentDate: formData.paymentDate,
          notes: formData.notes
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update payment')
      }

      const updatedPayment = await response.json()

      // Update the local state
      setData(prevData => 
        prevData.map(record => {
          if (record._id === selectedRecord._id) {
            return {
              ...record,
              payments: record.payments.map(payment => 
                payment._id === editPayment._id ? updatedPayment.payment : payment
              )
            }
          }
          return record
        })
      )

      if (selectedRecord) {
        setSelectedRecord(prev => ({
          ...prev,
          payments: prev.payments.map(payment => 
            payment._id === editPayment._id ? updatedPayment.payment : payment
          )
        }))
      }

      closeEditModal()
    } catch (error) {
      console.error('Error updating payment:', error)
    }
  }

  const handleDeletePayment = async (paymentId) => {
    try {
      const response = await fetch(`http://localhost:3002/api/payment/delete/${paymentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete payment')
      }

      const result = await response.json()

      // Update the local state
      setData(prevData => 
        prevData.map(record => {
          if (record._id === selectedRecord._id) {
            return {
              ...record,
              payments: record.payments.filter(payment => payment._id !== paymentId)
            }
          }
          return record
        })
      )

      if (selectedRecord) {
        setSelectedRecord(prev => ({
          ...prev,
          payments: prev.payments.filter(payment => payment._id !== paymentId)
        }))
      }

      setDeleteConfirmation(null)
    } catch (error) {
      console.error('Error deleting payment:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading records...</p>
        </div>
      </div>
    )
  }
  

  const downloadInvoice = async (paymentId) => {

    setIsGenerating(true);
  try {
    const response = await fetch(`http://localhost:3002/api/payment/${paymentId}/invoice/pdf`, {
      method: 'GET',
      credentials: 'include' // if using cookies/sessions
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errorData}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${paymentId}.pdf`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Error downloading invoice:', error);
    alert('Failed to download invoice: ' + error.message);
  } finally {
    // Hide loading state whether successful or not
    setIsGenerating(false);
  }
};


const downloadOverallInvoice = async (recordId) => {
  setIsInvoiceGenerating(true);
  try {
    const response = await fetch(`http://localhost:3002/api/payment/${recordId}/invoice/summary`);

    if (!response.ok) {
      throw new Error('Failed to fetch overall invoice');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-invoice-${recordId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading overall invoice:', error);
    alert('Error downloading invoice');
  } finally{
    setIsInvoiceGenerating(false);
  }
};



  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Payment Records</h1>
          <p className="mt-1 text-gray-600">Manage payment records and view payment details</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Unit Type Filter */}
            <div>
              <select
                value={selectedUnitType}
                onChange={(e) => setSelectedUnitType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Unit Types</option>
                {unitTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Records</option>
                <option value="with-payments">With Payments</option>
                <option value="no-payments">No Payments</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div>
              {(searchTerm || selectedUnitType || paymentStatusFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedUnitType("")
                    setPaymentStatusFilter("")
                  }}
                  className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit & Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{record.name}</div>
                        <div className="text-sm text-gray-500">Unit #{record.unitNo}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{record.emailId}</div>
                        <div className="text-sm text-gray-500">{record.contactNo}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{record.unitType}</div>
                        <div className="text-sm text-gray-500">{record.areaSqYrd} sq yrd</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.payments.length} payment{record.payments.length !== 1 ? "s" : ""}
                        </div>
                        {record.payments.length > 0 && (
                          <div className="text-sm text-green-600 font-medium">
                            {formatCurrency(record.payments.reduce((sum, p) => sum + p.paymentAmount, 0))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {record.payments.length > 0 ? (
                        <button
                          onClick={() => openPaymentModal(record)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View Payments
                        </button>
                      ) : (
                        <span className="text-gray-400">No Payments</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* No Results */}
          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No records found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Payment Details Modal */}
        {isModalOpen && selectedRecord && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop with blur */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
              onClick={closePaymentModal}
            ></div>

            {/* Modal Content */}
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="bg-white px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedRecord.name} - Payment Records</h2>
                      <p className="text-gray-600 text-sm">
                        Unit #{selectedRecord.unitNo} • {selectedRecord.unitType} • {selectedRecord.areaSqYrd} sq yrd
                      </p>
                    </div>
                    <button onClick={closePaymentModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                  {/* Contact Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Email: </span>
                        <span className="text-gray-900">{selectedRecord.emailId}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone: </span>
                        <span className="text-gray-900">{selectedRecord.contactNo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payments Table */}
                  <div className="bg-white  border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 flex justify-between bg-gray-50 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">
                        Payment History ({selectedRecord.payments.length} payments)
                      </h3>
                      <button
                        onClick={() => downloadOverallInvoice(selectedRecord._id)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        { isInvoiceGenerating ? "Generating..." : "Download Overall Invoice"}
                      </button>

                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Payment Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Payment Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Notes
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedRecord.payments
                            .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
                            .map((payment) => (
                              <tr key={payment._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      payment.paymentType === "Facility"
                                        ? "bg-blue-100 text-blue-800"
                                        : payment.paymentType === "Maintenance"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-purple-100 text-purple-800"
                                    }`}
                                  >
                                    {payment.paymentType}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatCurrency(payment.paymentAmount)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{formatDate(payment.paymentDate)}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-900 max-w-xs truncate">
                                    {payment.notes || "No notes"}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button 
                                     onClick={() => downloadInvoice(payment._id)}
                                    className="text-blue-600  hover:text-blue-900  mr-3"
                                    disabled={isGenerating}
                                  >
                                  {isGenerating ? "Generating..." : `Invoice`}
                                  </button>
                                  <button 
                                    onClick={() => openEditModal(payment)}
                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => setDeleteConfirmation(payment._id)}
                                    className="text-red-600 hover:text-red-900 mr-3"
                                  >
                                    Delete
                                  </button>
                                  

                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">Total Amount:</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(selectedRecord.payments.reduce((sum, p) => sum + p.paymentAmount, 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Payment Modal */}
        {isEditModalOpen && editPayment && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={closeEditModal}></div>
              <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Payment</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                      <select
                        name="paymentType"
                        value={formData.paymentType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Facility">Facility</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                      <input
                        type="number"
                        name="paymentAmount"
                        value={formData.paymentAmount}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                      <input
                        type="date"
                        name="paymentDate"
                        value={formData.paymentDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeEditModal}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdatePayment}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={() => setDeleteConfirmation(null)}></div>
              <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
                  <p className="text-gray-600 mb-6">Are you sure you want to delete this payment? This action cannot be undone.</p>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmation(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePayment(deleteConfirmation)}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}