import express from 'express';
import { createInvgenRecord, getAllInvgenRecords, updateInvgenRecord } from '../controllers/recordController.js';

const router = express.Router();
router.get('/get', getAllInvgenRecords);
router.post('/create', createInvgenRecord);
router.put('/edit/:id', updateInvgenRecord);

export default router;
