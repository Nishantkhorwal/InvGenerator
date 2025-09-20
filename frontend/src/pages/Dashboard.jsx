import { useState, useEffect, useMemo } from "react"

export default function UnifiedDashboard() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  // Payment data state
  const [paymentData, setPaymentData] = useState([])
  const [paymentLoading, setPaymentLoading] = useState(true)

  // Entry data state
  const [entryData, setEntryData] = useState([])
  const [entryLoading, setEntryLoading] = useState(true)
  const [entryPage, setEntryPage] = useState(1)
  const [entryTotalPages, setEntryTotalPages] = useState(1)
  const [entryTotalCount, setEntryTotalCount] = useState(0)
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUnitType, setSelectedUnitType] = useState("")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [projectFilter, setProjectFilter] = useState(user.role === "Admin" ? "" : user.project)
  const [activeTab, setActiveTab] = useState("entries")

  // Notification state
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" })

  // Fetch payment data
  const fetchPaymentData = async () => {
    setPaymentLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/payment/get`)
      if (!response.ok) throw new Error("Failed to fetch payment data")
      const result = await response.json()
      setPaymentData(result || [])
    } catch (error) {
      console.error("Error fetching payment data:", error)
      setPaymentData([])
      showNotification("Failed to fetch payment data", "error")
    } finally {
      setPaymentLoading(false)
    }
  }

  // Fetch entry data
  const fetchEntryData = async (currentPage = 1) => {
    setEntryLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("page", currentPage)
      params.append("limit", 50)
      if (projectFilter) params.append("project", projectFilter)
      if (dateFilter) params.append("dateFilter", dateFilter)

      const res = await fetch(`${API_BASE_URL}/api/entry/records?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to fetch entry records")


        
      setEntryData(data.entries || [])
      setEntryPage(data.page || 1)
      setEntryTotalPages(data.totalPages || 1)
      setEntryTotalCount(data.totalEntries || 0)
    } catch (err) {
      console.error("Error fetching entry data:", err)
      showNotification(err.message, "error")
    } finally {
      setEntryLoading(false)
    }
  }

  useEffect(() => {
    fetchPaymentData()
    fetchEntryData()
  }, [])

  useEffect(() => {
    fetchEntryData(1)
  }, [projectFilter, dateFilter])

  // Show notification
  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000)
  }

  // Get unique unit types for filter
  const unitTypes = useMemo(() => {
    const types = [...new Set(paymentData.map((record) => record.unitType))]
    return types.filter(Boolean)
  }, [paymentData])

  // Filter payment data
  const filteredPaymentData = useMemo(() => {
    return paymentData.filter((record) => {
      const matchesSearch =
        record.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.unitNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.emailId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.contactNo?.includes(searchTerm)

      const matchesUnitType = !selectedUnitType || record.unitType === selectedUnitType

      const matchesPaymentStatus =
        !paymentStatusFilter ||
        (paymentStatusFilter === "with-payments" && record.payments?.length > 0) ||
        (paymentStatusFilter === "no-payments" && (!record.payments || record.payments.length === 0))

      return matchesSearch && matchesUnitType && matchesPaymentStatus
    })
  }, [paymentData, searchTerm, selectedUnitType, paymentStatusFilter])

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalPaymentRecords = filteredPaymentData.length
    const recordsWithPayments = filteredPaymentData.filter((r) => r.payments?.length > 0).length
    const recordsWithoutPayments = totalPaymentRecords - recordsWithPayments
    const totalPayments = filteredPaymentData.reduce((sum, record) => sum + (record.payments?.length || 0), 0)
    const totalPaymentAmount = filteredPaymentData.reduce(
      (sum, record) =>
        sum + (record.payments?.reduce((paySum, payment) => paySum + (payment.paymentAmount || 0), 0) || 0),
      0,
    )

    const totalEntryRecords = entryTotalCount
    const todayEntries = entryTotalCount

    return {
      totalPaymentRecords,
      recordsWithPayments,
      recordsWithoutPayments,
      totalPayments,
      totalPaymentAmount,
      totalEntryRecords,
      todayEntries,
    }
  }, [filteredPaymentData, entryData, entryTotalCount])

  // Payment trends data for chart
  const paymentTrendsData = useMemo(() => {
    const monthlyData = {}

    filteredPaymentData.forEach((record) => {
      if (record.payments) {
        record.payments.forEach((payment) => {
          const date = new Date(payment.paymentDate)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { month: monthKey, amount: 0, count: 0 }
          }

          monthlyData[monthKey].amount += payment.paymentAmount || 0
          monthlyData[monthKey].count += 1
        })
      }
    })

    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
  }, [filteredPaymentData])

  // Entry trends data for chart
  const entryTrendsData = useMemo(() => {
    const dailyData = {}

    entryData.forEach((entry) => {
      const date = new Date(entry.createdAt)
      const dayKey = date.toISOString().split("T")[0]

      if (!dailyData[dayKey]) {
        dailyData[dayKey] = { date: dayKey, count: 0 }
      }

      dailyData[dayKey].count += 1
    })

    return Object.values(dailyData)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7)
  }, [entryData])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedUnitType("")
    setPaymentStatusFilter("")
    setDateFilter("")
    setProjectFilter(user.role === "Admin" ? "" : user.project)
  }

  // Simple Bar Chart Component
  // Updated BarChart
const BarChart = ({ data, dataKey, valueKey, title, color = "bg-blue-500" }) => {
  const maxValue = Math.max(...data.map((item) => item[valueKey]), 1) // avoid maxValue=0

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => {
          const widthPercent = (item[valueKey] / maxValue) * 100
          return (
            <div key={index} className="flex items-center">
              <div className="w-20 text-sm text-gray-600 truncate">{item[dataKey]}</div>
              <div className="flex-1 mx-3">
                <div className="bg-gray-200 rounded-full h-4 relative">
                  <div
                    className={`${color} h-4 rounded-full transition-all duration-500`}
                    style={{ width: `${widthPercent}%`, minWidth: "20px" }}
                  ></div>
                </div>
              </div>
              <div className="w-16 text-sm font-medium text-gray-900 text-right">
                {typeof item[valueKey] === "number" && item[valueKey] > 1000
                  ? formatCurrency(item[valueKey])
                  : item[valueKey]}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Updated LineChart
const LineChart = ({ data, dataKey, valueKey, title }) => {
  const maxValue = Math.max(...data.map((item) => item[valueKey]), 1) // avoid maxValue=0

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-48 flex items-end space-x-2">
        {data.map((item, index) => {
          const heightPercent = (item[valueKey] / maxValue) * 100
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="bg-green-500 w-full rounded-t transition-all duration-500"
                style={{ height: `${heightPercent}%`, minHeight: "20px" }}
              ></div>
              <div className="text-xs text-gray-600 mt-2 truncate w-full text-center">{item[dataKey]}</div>
              <div className="text-xs font-medium text-gray-900">{item[valueKey]}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


  if (paymentLoading && entryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-blue-100 mt-2">Payment & Entry Management System</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">Welcome, {user.name || "User"}</div>
              <div className="text-xs text-blue-200">
                {user.role || "User"} • {user.project || "All Projects"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notification */}
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  ></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Payment Records</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.totalPaymentRecords}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  ></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summaryStats.totalPaymentAmount)}</p>
              </div>
            </div>
          </div>

          {/* <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  ></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Entry Records</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.totalEntryRecords}</p>
              </div>
            </div>
          </div> */}

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Entries</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.todayEntries}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {/* <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button> */}
              <button
                onClick={() => setActiveTab("entries")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "entries"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Entry Records
              </button>
              <button
                onClick={() => setActiveTab("payments")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "payments"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Payment Records
              </button>
              
            </nav>
          </div>

          {/* Filters */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filters & Search</h2>
              <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                </div>
              </div>

              {/* Unit Type Filter */}
              {activeTab === "payments" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit Type</label>
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
              )}

              {/* Payment Status Filter */}
              {activeTab === "payments" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
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
              )}

              {/* Project Filter */}
              {user.role === "Admin" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                  <input
                    type="text"
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    placeholder="Enter project name..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="thisWeek">This Week</option>
                  <option value="thisMonth">This Month</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Records with Payments</span>
                  <span className="font-semibold text-green-600">{summaryStats.recordsWithPayments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Records without Payments</span>
                  <span className="font-semibold text-red-600">{summaryStats.recordsWithoutPayments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Payments</span>
                  <span className="font-semibold text-blue-600">{summaryStats.totalPayments}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-gray-900 font-medium">Total Revenue</span>
                  <span className="font-bold text-green-600 text-lg">
                    {formatCurrency(summaryStats.totalPaymentAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Entry Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Entry Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Entry Records</span>
                  <span className="font-semibold text-blue-600">{summaryStats.totalEntryRecords}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Today's Entries</span>
                  <span className="font-semibold text-green-600">{summaryStats.todayEntries}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Page</span>
                  <span className="font-semibold text-purple-600">
                    {entryPage} of {entryTotalPages}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPaymentData.map((record) => (
              <div key={record._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{record.name}</h3>
                      <p className="text-sm text-gray-600">Unit #{record.unitNo}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        record.payments?.length > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {record.payments?.length > 0 ? "Has Payments" : "No Payments"}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        ></path>
                      </svg>
                      <span className="text-gray-600">{record.emailId}</span>
                    </div>

                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        ></path>
                      </svg>
                      <span className="text-gray-600">{record.contactNo}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 text-gray-400 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          ></path>
                        </svg>
                        <span className="text-gray-600">{record.unitType}</span>
                      </div>
                      <span className="text-gray-600">{record.areaSqYrd} sq yrd</span>
                    </div>

                    {record.payments?.length > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            {record.payments.length} Payment{record.payments.length !== 1 ? "s" : ""}
                          </span>
                          <span className="text-sm font-semibold text-green-600">
                            {formatCurrency(record.payments.reduce((sum, p) => sum + (p.paymentAmount || 0), 0))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "entries" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {entryData.map((entry) => (
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{entry.name}</h3>
                  <div className="space-y-2">
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
                    <div className="flex items-center text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                      <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {formatDate(entry.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {((activeTab === "payments" && filteredPaymentData.length === 0) ||
          (activeTab === "entries" && entryData.length === 0)) && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No records found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
