"use client"

import { useState, useEffect } from "react"

export default function GetEntry() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalEntries, setTotalEntries] = useState(0)
  const [selectedEntry, setSelectedEntry] = useState(null) // for modal
  const [exportOption, setExportOption] = useState(""); // e.g., "week", "month", "10days"


  const [filters, setFilters] = useState({
    project: user.role === "Admin" ? "" : user.project,
    dateFilter: "",
    search: "",
    type: "",
  })

  const [itemsPerPage, setItemsPerPage] = useState(12)

  // Fetch entries
  const fetchEntries = async (currentPage = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("page", currentPage)
      params.append("limit", itemsPerPage)
      if (filters.project) params.append("project", filters.project)
      if (filters.dateFilter) params.append("dateFilter", filters.dateFilter)
      if (filters.search) params.append("search", filters.search)
      if (filters.type) params.append("type", filters.type)

      const res = await fetch(`${API_BASE_URL}/api/entry/records?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to fetch records")

      setEntries(data.entries)
      setPage(data.page)
      setTotalPages(data.totalPages)
      setTotalEntries(data.total || 0)
    } catch (err) {
      showNotification(err.message, "error")
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    fetchEntries(1)
  }, [filters, itemsPerPage])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return
    fetchEntries(newPage)
  }

  const renderPaginationButtons = () => {
    const buttons = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              page === i
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {i}
          </button>,
        )
      }
    } else {
      // Always show first page
      buttons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            page === 1
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          1
        </button>,
      )

      // Show ellipsis if needed
      if (page > 3) {
        buttons.push(
          <span key="ellipsis1" className="px-2 py-2 text-gray-500">
            ...
          </span>,
        )
      }

      // Show pages around current page
      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)

      for (let i = start; i <= end; i++) {
        buttons.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              page === i
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {i}
          </button>,
        )
      }

      // Show ellipsis if needed
      if (page < totalPages - 2) {
        buttons.push(
          <span key="ellipsis2" className="px-2 py-2 text-gray-500">
            ...
          </span>,
        )
      }

      // Always show last page
      if (totalPages > 1) {
        buttons.push(
          <button
            key={totalPages}
            onClick={() => handlePageChange(totalPages)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              page === totalPages
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {totalPages}
          </button>,
        )
      }
    }

    return buttons
  }

  // Notification
  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ ...notification, show: false }), 3000)
  }

  const clearFilters = () => {
    setFilters({
      project: user.role === "Admin" ? "" : user.project,
      dateFilter: "",
      search: "",
      type: "",
    })
  }
  const handleExport = async () => {
  if (!exportOption) {
    showNotification("Please select an export option", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/entry/export?option=${exportOption}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to export records");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `entries_${exportOption}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    showNotification(err.message, "error");
  }
};


  return (
    <div className="min-h-screen bg-black/10">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-balance">Records Management</h1>
              
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">
                Page {page} of {totalPages}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {notification.show && (
          <div
            className={`mb-6 p-4 rounded-lg border-l-4 ${
              notification.type === "success"
                ? "bg-green-50 border-green-400 text-green-800"
                : "bg-red-50 border-red-400 text-red-800"
            }`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                {notification.type === "success" ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters & Search</h2>
            <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           

            {/* Project Filter */}
            {user.role === "Admin" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Project</label>
                <input
                  type="text"
                  name="project"
                  value={filters.project}
                  onChange={handleFilterChange}
                  placeholder="Enter project name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            )}

            

            {/* Date Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Date Range</label>
              <select
                name="dateFilter"
                value={filters.dateFilter}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
              </select>
            </div>
            
          </div>
          


          {/* Items per page selector */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div>
            <div className="flex gap-2">
              <select
                value={exportOption}
                onChange={(e) => setExportOption(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Export Option</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="10days">Last 10 Days</option>
                <option value="month">This Month</option>
              </select>

              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Export
              </button>
          </div>
          </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: itemsPerPage }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse"
              >
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No records found</h3>
            <p className="mt-2 text-gray-500">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {entries.map((entry) => (
              <div
                key={entry._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200 group"
              >
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  <img
                    src={`${API_BASE_URL}${entry.image}`}
                    alt={entry.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      e.target.src = "/api/placeholder/300/200"
                    }}
                  />
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {entry.type}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 text-balance">{entry.name}</h3>
                  <div className="space-y-2">
                    {entry.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                      {entry.email}
                    </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      {entry.project}
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                      <div className="flex">
                      <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {new Date(entry.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                       
                      })}
                      </div>
                      <button onClick={() => setSelectedEntry(entry)} className="text-blue-600">
                        View Details
                      </button> 
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {selectedEntry && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
      <button
        onClick={() => setSelectedEntry(null)}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
      >
        ✕
      </button>

      <h2 className="text-xl font-semibold mb-4">{selectedEntry.name}</h2>
      
      <div className="space-y-3 text-gray-700">

        {/* Common fields */}
        {selectedEntry.phone && <p><strong>Phone:</strong> {selectedEntry.phone}</p>}
        <p><strong>Project:</strong> {selectedEntry.project}</p>
        {selectedEntry.remarks && <p><strong>Remarks:</strong> {selectedEntry.remarks}</p>}

        {/* Broker-specific fields */}
        {selectedEntry.type === "Broker" && (
          <>
            {selectedEntry.brokerName && <p><strong>Broker Name:</strong> {selectedEntry.brokerName}</p>}
            {selectedEntry.firmName && <p><strong>Firm Name:</strong> {selectedEntry.firmName}</p>}
            {selectedEntry.brokerContactNo && <p><strong>Broker Contact:</strong> {selectedEntry.brokerContactNo}</p>}
          </>
        )}
      </div>
    </div>
  </div>
)}


        {totalPages > 1 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="text-sm text-gray-700">
                Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, totalEntries)} of{" "}
                {totalEntries} results
              </div>

              <div className="flex items-center space-x-2">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1">{renderPaginationButtons()}</div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
