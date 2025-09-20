import InvGenEntry from "../models/entryModel.js";
import ExcelJS from "exceljs";


export const addPerson = async (req, res) => {
  try {
    const { name, phone, type, remarks, brokerName, firmName, brokerContactNo } = req.body;

    // Basic validation
    if (!name || !type) {
      return res.status(400).json({ message: "Name and type are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    // Extra validation for Brokers
    if (type === "Broker") {
      if (!brokerName || !firmName || !brokerContactNo) {
        return res.status(400).json({
          message: "Broker name, firm name, and contact no. are required for Brokers",
        });
      }
    }

    // project auto-fills from logged-in user
    const project = req.user.project;

    const personData = {
      name,
      phone, // ✅ replaced email with phone
      type,
      remarks,
      image: `/uploads/${req.file.filename}`, // file path
      project,
      createdBy: req.user.id,
    };

    // Add broker fields only if type is Broker
    if (type === "Broker") {
      personData.brokerName = brokerName;
      personData.firmName = firmName;
      personData.brokerContactNo = brokerContactNo;
    }

    const person = await InvGenEntry.create(personData);

    res.status(201).json({
      message: "Person added successfully",
      person,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};






// GET entries with pagination and filters
export const getEntries = async (req, res) => {
  try {
    const { page = 1, project, dateFilter } = req.query; // page number, project filter, date filter
    const perPage = 8;
    const user = req.user; // from authenticateUser middleware

    const query = {};

    // Role-based: Users see only their project
    if (user.role !== "Admin") {
      query.project = user.project;
    } else if (project) {
      query.project = project; // Admin can filter by project
    }

    // Date filter
    if (dateFilter) {
      const now = new Date();
      let startDate, endDate;

      switch (dateFilter) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case "thisWeek":
          const firstDay = now.getDate() - now.getDay(); // Sunday as first day
          startDate = new Date(now.getFullYear(), now.getMonth(), firstDay);
          endDate = new Date(now.getFullYear(), now.getMonth(), firstDay + 7);
          break;
        case "thisMonth":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        default:
          startDate = null;
          endDate = null;
      }

      if (startDate && endDate) {
        query.createdAt = { $gte: startDate, $lt: endDate };
      }
    }

    // Count total documents for pagination
    const total = await InvGenEntry.countDocuments(query);

    // Fetch paginated results
    const entries = await InvGenEntry.find(query)
      .sort({ createdAt: -1 }) // latest first
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("createdBy", "name email role"); // optional: fetch creator info

    res.json({
      message: "Entries fetched successfully",
      page: Number(page),
      totalPages: Math.ceil(total / perPage),
      totalEntries: total,
      entries,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


export const exportEntriesToExcel = async (req, res) => {
  try {
    const { option, project } = req.query; // ✅ changed from dateFilter → option
    const user = req.user;

    const query = {};

    // Role-based project access
    if (user.role !== "Admin") {
      query.project = user.project;
    } else if (project) {
      query.project = project;
    }

    // Date range handling
    const now = new Date();
    let startDate, endDate;

    switch (option) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;

      case "week":
        const firstDay = now.getDate() - now.getDay(); // Sunday as start
        startDate = new Date(now.getFullYear(), now.getMonth(), firstDay);
        endDate = new Date(now.getFullYear(), now.getMonth(), firstDay + 7);
        break;

      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;

      case "10days":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 10);
        endDate = now;
        break;

      default:
        startDate = null;
        endDate = null;
    }

    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lt: endDate };
    }

    // Fetch entries
    const entries = await InvGenEntry.find(query).populate("createdBy", "name email");

    if (!entries.length) {
      return res.status(404).json({ message: "No entries found for export" });
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Entries");

    // Headers
    worksheet.columns = [
      { header: "Name", key: "name", width: 20 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Type", key: "type", width: 15 },
      { header: "Remarks", key: "remarks", width: 30 },
      { header: "Broker Name", key: "brokerName", width: 20 },
      { header: "Firm Name", key: "firmName", width: 20 },
      { header: "Broker Contact No", key: "brokerContactNo", width: 20 },
      { header: "Created By", key: "createdBy", width: 20 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    // Rows
    entries.forEach((entry) => {
      worksheet.addRow({
        name: entry.name,
        phone: entry.phone,
        type: entry.type,
        remarks: entry.remarks || "",
        brokerName: entry.brokerName || "",
        firmName: entry.firmName || "",
        brokerContactNo: entry.brokerContactNo || "",
        createdBy: entry.createdBy?.name || "",
        createdAt: entry.createdAt.toLocaleString(),
      });
    });

    // Send response
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=entries_${option || "all"}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Excel Export Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



