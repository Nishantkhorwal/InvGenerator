import InvGenPayment from '../models/paymentModel.js';
import InvGenRecords from '../models/recordModel.js'; // optional, if you want to validate reference
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Create Payment
export const createPayment = async (req, res) => {
  try {
    const {
      invGenRecord, // ObjectId string
      paymentType,  // 'Security' or 'Facility'
      paymentAmount,
      paymentDate,
      notes,
    } = req.body;

    const allowedTypes = ['Security', 'Facility'];
    if (!allowedTypes.includes(paymentType)) {
      return res.status(400).json({ message: 'Invalid payment type' });
    }

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ message: 'Payment amount must be a positive number' });
    }
    if (isNaN(new Date(paymentDate).getTime())) {
      return res.status(400).json({ message: 'Invalid payment date' });
    }


    // Optional: Validate invGenRecord exists
    const recordExists = await InvGenRecords.findById(invGenRecord);
    if (!recordExists) {
      return res.status(400).json({ message: 'Invalid InvGenRecord reference' });
    }

    const payment = await InvGenPayment.create({
      invGenRecord,
      paymentType,
      paymentAmount,
      paymentDate,
      notes: notes?.trim(),
    });

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create payment',
      error: error.message,
    });
  }
};





export const getAllPaymentsGroupedByRecord = async (req, res) => {
  try {
    const groupedData = await InvGenRecords.aggregate([
      {
        $lookup: {
          from: 'invgenpayments', // collection name (should match MongoDB collection name, usually lowercase plural of model)
          localField: '_id',
          foreignField: 'invGenRecord',
          as: 'payments',
        },
      },
      {
        $project: {
          _id: 1,
          unitNo: 1,
          name: 1,
          emailId: 1,
          contactNo: 1,
          unitType: 1,
          areaSqYrd: 1,
          payments: 1,
        },
      },
    ]);

    res.status(200).json(groupedData);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch grouped payments',
      error: error.message,
    });
  }
};


// Update Payment
export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      paymentType,
      paymentAmount,
      paymentDate,
      notes,
    } = req.body;

    const updatedPayment = await InvGenPayment.findByIdAndUpdate(
      id,
      {
        paymentType,
        paymentAmount,
        paymentDate,
        notes,
      },
      { new: true }
    );

    if (!updatedPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json({
      message: 'Payment updated successfully',
      payment: updatedPayment,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update payment',
      error: error.message,
    });
  }
};


// Delete Payment
export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPayment = await InvGenPayment.findByIdAndDelete(id);

    if (!deletedPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json({
      message: 'Payment deleted successfully',
      payment: deletedPayment,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete payment',
      error: error.message,
    });
  }
};






// Generate PDF Invoice
export const generateInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await InvGenPayment.findById(id).populate('invGenRecord');
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const record = payment.invGenRecord;

    // HTML content for invoice
    const htmlContent = `
      <html>
        <head>
          <style>
            body { 
              font-family: 'Helvetica Neue', Arial, sans-serif; 
              padding: 0;
              margin: 0;
              color: #333;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 30px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              border-bottom: 2px solid #eee;
              padding-bottom: 20px;
            }
            .invoice-title {
              font-size: 24px;
              font-weight: bold;
              color: #2c3e50;
            }
            .invoice-meta {
              text-align: right;
            }
            .invoice-meta div {
              margin-bottom: 5px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin: 25px 0 15px 0;
              color: #2c3e50;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            .payment-details {
              background: #f9f9f9;
              padding: 20px;
              border-radius: 5px;
              margin-top: 20px;
            }
            .payment-row {
              display: flex;
              margin-bottom: 10px;
            }
            .payment-label {
              font-weight: bold;
              width: 150px;
            }
            .payment-value {
              flex: 1;
            }
            .highlight {
              font-size: 18px;
              font-weight: bold;
              color: #27ae60;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #7f8c8d;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="invoice-title">PAYMENT RECEIPT</div>
              <div class="invoice-meta">
                <div><strong>Receipt #:</strong> ${payment._id}</div>
                <div><strong>Date:</strong> ${new Date(payment.paymentDate).toLocaleDateString('en-IN')}</div>
              </div>
            </div>

            <div class="section-title">CUSTOMER INFORMATION</div>
            <div class="payment-row">
              <div class="payment-label">Name:</div>
              <div class="payment-value">${record.name}</div>
            </div>
            <div class="payment-row">
              <div class="payment-label">Unit No:</div>
              <div class="payment-value">${record.unitNo}</div>
            </div>

            <div class="section-title">PAYMENT DETAILS</div>
            <div class="payment-details">
              <div class="payment-row">
                <div class="payment-label">Payment Type:</div>
                <div class="payment-value">${payment.paymentType}</div>
              </div>
              <div class="payment-row">
                <div class="payment-label">Amount Paid:</div>
                <div class="payment-value highlight">₹${payment.paymentAmount.toLocaleString('en-IN')}</div>
              </div>
              ${payment.notes ? `
              <div class="payment-row">
                <div class="payment-label">Notes:</div>
                <div class="payment-value">${payment.notes}</div>
              </div>
              ` : ''}
            </div>

            <div class="footer">
              Thank you for your payment. This receipt serves as confirmation of your transaction.
            </div>
          </div>
        </body>
      </html>
    `;

    // Generate PDF with Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ 
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="payment-receipt-${payment._id}.pdf"`,
    });

    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to generate invoice PDF',
      error: error.message,
    });
  }
};







export const generateOverallInvoicePDF = async (req, res) => {
  try {
    const { recordId } = req.params;

    const record = await InvGenRecords.findById(recordId);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    const payments = await InvGenPayment.find({ invGenRecord: recordId });

    const totalSecurity = payments
      .filter(p => p.paymentType === 'Security')
      .reduce((sum, p) => sum + p.paymentAmount, 0);

    const totalFacility = payments
      .filter(p => p.paymentType === 'Facility')
      .reduce((sum, p) => sum + p.paymentAmount, 0);

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; }
            h1, h2, h3 { margin: 0; }
            .title { text-align: center; margin-bottom: 40px; }
            .section { margin-bottom: 25px; }
            .row { margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td {
              border: 1px solid #ccc;
              padding: 8px 12px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
          </style>
        </head>
        <body>
          <div class="title">
            <h1>ROF - Payment Summary Invoice</h1>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="section">
            <h2>Customer Details</h2>
            <div class="row"><strong>Name:</strong> ${record.name}</div>
            <div class="row"><strong>Unit No:</strong> ${record.unitNo}</div>
            <div class="row"><strong>Email:</strong> ${record.emailId}</div>
            <div class="row"><strong>Contact:</strong> ${record.contactNo}</div>
            <div class="row"><strong>Unit Type:</strong> ${record.unitType}</div>
            <div class="row"><strong>Area (sq. yd.):</strong> ${record.areaSqYrd}</div>
          </div>

          <div class="section">
            <h2>Payment Details</h2>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>Amount (₹)</th>
                  <th>Date</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${payments.map((p, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${p.paymentType}</td>
                    <td>₹${p.paymentAmount.toFixed(2)}</td>
                    <td>${new Date(p.paymentDate).toLocaleDateString()}</td>
                    <td>${p.notes || '—'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Summary</h2>
            <div class="row"><strong>Total Security Paid:</strong> ₹${totalSecurity.toFixed(2)}</div>
            <div class="row"><strong>Total Facility Paid:</strong> ₹${totalFacility.toFixed(2)}</div>
            <div class="row"><strong>Grand Total:</strong> ₹${(totalSecurity + totalFacility).toFixed(2)}</div>
          </div>

          <p style="margin-top:40px;">Thank you for your payments!</p>
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'load' });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="summary-invoice-${record.unitNo}.pdf"`,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Overall Invoice PDF Error:', error);
    res.status(500).json({
      message: 'Failed to generate overall invoice',
      error: error.message,
    });
  }
};




