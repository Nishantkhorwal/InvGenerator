import { useState } from "react";

export default function Entry() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    remarks: "",
    type: "Customer", // default type
    brokerName: "",
    firmName: "",
    brokerContactNo: "",
    image: null,
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setFormData((prev) => ({ ...prev, image: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) {
      showNotification("Please upload an image", "error");
      return;
    }

    const data = new FormData();
    data.append("name", formData.name);
    data.append("phone", formData.phone);
    data.append("remarks", formData.remarks);
    data.append("type", formData.type);
    data.append("image", formData.image);

    if (formData.type === "Broker") {
      data.append("brokerName", formData.brokerName);
      data.append("firmName", formData.firmName);
      data.append("brokerContactNo", formData.brokerContactNo);
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/entry/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: data,
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Failed to add person");

      showNotification("Person added successfully", "success");

      // Reset form
      setFormData({
        name: "",
        phone: "",
        remarks: "",
        type: "Customer",
        brokerName: "",
        firmName: "",
        brokerContactNo: "",
        image: null,
      });
    } catch (err) {
      showNotification(err.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  // Show notification
  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 3000);
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-6">Add Person</h2>

      {notification.show && (
        <div
          className={`mb-4 p-3 rounded ${
            notification.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {notification.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="Customer">Customer</option>
            <option value="Broker">Broker</option>
          </select>
        </div>

        {/* Show broker fields only when type = Broker */}
        {formData.type === "Broker" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Broker Name</label>
              <input
                type="text"
                name="brokerName"
                value={formData.brokerName}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Firm Name</label>
              <input
                type="text"
                name="firmName"
                value={formData.firmName}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Broker Contact No.</label>
              <input
                type="tel"
                name="brokerContactNo"
                value={formData.brokerContactNo}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Image</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            capture="environment"
            onChange={handleChange}
            className="w-full"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            You can either select an image from your device or take a new photo.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Remarks</label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Project</label>
          <input
            type="text"
            value={user.project || ""}
            disabled
            className="w-full px-3 py-2 border rounded bg-gray-100 text-gray-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {loading ? "Submitting..." : "Add Person"}
        </button>
      </form>
    </div>
  );
}
