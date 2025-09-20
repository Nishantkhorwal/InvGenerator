import InvgenRecords from '../models/recordModel.js';
import InvGenPayment from '../models/paymentModel.js';

export const createInvgenRecord = async (req, res) => {
  try {
    const {
      unitNo,
      name,
      emailId,
      contactNo,
      bookingDate,
      unitType,
      areaSqYrd
    } = req.body;

    // Basic validation
    if (!unitNo || !name || !emailId || !contactNo || !bookingDate || !unitType || !areaSqYrd) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Create and save the new record
    const newRecord = new InvgenRecords({
      unitNo,
      name,
      emailId,
      contactNo,
      bookingDate,
      unitType,
      areaSqYrd
    });

    await newRecord.save();

    res.status(201).json({ message: 'Record created successfully.', data: newRecord });
  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ message: 'Server error while creating record.' });
  }
};



export const updateInvgenRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      unitNo,
      name,
      emailId,
      contactNo,
      bookingDate,
      unitType,
      areaSqYrd
    } = req.body;

    // Find and update the record
    const updatedRecord = await InvgenRecords.findByIdAndUpdate(
      id,
      {
        unitNo,
        name,
        emailId,
        contactNo,
        bookingDate,
        unitType,
        areaSqYrd
      },
      { new: true, runValidators: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ message: 'Record not found.' });
    }

    res.status(200).json({ message: 'Record updated successfully.', data: updatedRecord });
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ message: 'Server error while updating record.' });
  }
};


export const getAllInvgenRecords = async (req, res) => {
  try {
    const records = await InvgenRecords.find().sort({ bookingDate: -1 }); // Optional: sort by latest booking first
    res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ message: 'Server error while fetching records.' });
  }
};





export const deleteInvgenRecord = async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1: Delete the record
    const deletedRecord = await InvgenRecords.findByIdAndDelete(id);

    if (!deletedRecord) {
      return res.status(404).json({ message: 'Record not found.' });
    }

    // Step 2: Delete all related payments
    await InvGenPayment.deleteMany({ invGenRecord: id });

    res.status(200).json({ message: 'Record and associated payments deleted successfully.' });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ message: 'Server error while deleting record.' });
  }
};
