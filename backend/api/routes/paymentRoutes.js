import express from 'express';
import { createPayment, deletePayment, generateInvoicePDF, generateOverallInvoicePDF, getAllPaymentsGroupedByRecord, updatePayment } from '../controllers/paymentController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.post('/create',authenticateUser, createPayment);
router.get('/get', getAllPaymentsGroupedByRecord);
router.put('/edit/:id', updatePayment);
router.delete('/delete/:id', deletePayment);
router.get('/:id/invoice/pdf', generateInvoicePDF);
router.get('/:recordId/invoice/summary', generateOverallInvoicePDF);


export default router;
