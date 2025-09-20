import { useState, useEffect } from "react"
import { UserCircle, CheckCircle } from "lucide-react"
import { jwtDecode } from "jwt-decode";


export default function Settings() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  const token = localStorage.getItem("token")

  // User state
  const [user, setUser] = useState({
    id: "",
    name: "",
    email: "",
    role: "",
    project: "",
  })

  // Password state
  const [passwords, setPasswords] = useState({
    new: "",
    confirm: "",
  })

  // UI state
  const [isEditing, setIsEditing] = useState({
    profile: false,
    password: false,
  })
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  })

  // Form validation state
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/get`, {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  credentials: 'include'
  

});

if (!res.ok) throw new Error("Failed to fetch user info");

const data = await res.json();

// decode token to get logged-in user id
const decoded = jwtDecode(token);
const loggedInUserId = decoded.id;

// find logged-in user in the list
const loggedInUser = data.users.find(u => u._id === loggedInUserId);

if (!loggedInUser) throw new Error("Logged in user not found");

setUser({
  id: loggedInUser._id || "",
  name: loggedInUser.name || "",
  email: loggedInUser.email || "",
});


      } catch (err) {
        console.error(err)
        showNotification("Failed to load user data", "error")
      }
    }

    fetchUserInfo()
  }, [])

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault()

    let valid = true
    const newErrors = { ...errors }

    if (!user.name.trim()) {
      newErrors.name = "Name is required"
      valid = false
    } else {
      newErrors.name = ""
    }

    if (!user.email.trim()) {
      newErrors.email = "Email is required"
      valid = false
    } else if (!/\S+@\S+\.\S+/.test(user.email)) {
      newErrors.email = "Email is invalid"
      valid = false
    } else {
      newErrors.email = ""
    }

    setErrors(newErrors)
    if (!valid) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          project: user.role === "User" ? user.project : undefined, // only update project if role is User
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to update profile")

      showNotification("Profile updated successfully", "success")
      setIsEditing({ ...isEditing, profile: false })
    } catch (err) {
      showNotification(err.message || "Something went wrong", "error")
    }
  }

  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    let valid = true
    const newErrors = { ...errors }

    if (!passwords.new) {
      newErrors.newPassword = "New password is required"
      valid = false
    } else if (passwords.new.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters"
      valid = false
    } else {
      newErrors.newPassword = ""
    }

    if (!passwords.confirm) {
      newErrors.confirmPassword = "Please confirm your password"
      valid = false
    } else if (passwords.new !== passwords.confirm) {
      newErrors.confirmPassword = "Passwords do not match"
      valid = false
    } else {
      newErrors.confirmPassword = ""
    }

    setErrors(newErrors)
    if (!valid) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: passwords.new }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to change password")

      showNotification("Password updated successfully", "success")
      setPasswords({ new: "", confirm: "" })
      setIsEditing({ ...isEditing, password: false })
    } catch (err) {
      showNotification(err.message || "Something went wrong", "error")
    }
  }

  // Show notification
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type })
    setTimeout(() => {
      setNotification({ ...notification, show: false })
    }, 3000)
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your account information and password</p>
        </div>

        {/* Notification */}
        {notification.show && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center ${
              notification.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>{notification.message}</span>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          {/* Profile Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
              <button
                onClick={() => setIsEditing({ ...isEditing, profile: !isEditing.profile })}
                className="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {isEditing.profile ? "Cancel" : "Edit"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={user.name}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                  disabled={!isEditing.profile}
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 disabled:text-gray-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  disabled={!isEditing.profile}
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 disabled:text-gray-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              

              {/* Project (only if User) */}
              {user.role === "User" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select
                    value={user.project}
                    onChange={(e) => setUser({ ...user, project: e.target.value })}
                    disabled={!isEditing.profile}
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50 disabled:text-gray-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="Normanton">Normanton</option>
                    <option value="Blank">Blank</option>
                  </select>
                </div>
              )}
            </div>

            {isEditing.profile && (
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={handleProfileSubmit}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Password Section */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Change Password</h2>
              <button
                onClick={() => setIsEditing({ ...isEditing, password: !isEditing.password })}
                className="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                {isEditing.password ? "Cancel" : "Change"}
              </button>
            </div>

            {isEditing.password ? (
              <form onSubmit={handlePasswordSubmit} className="grid gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-gray-600">We recommend updating your password regularly for security.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
