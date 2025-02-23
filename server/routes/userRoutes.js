import express from 'express';
import { applyForJob, getUserData, getUserJobApplications, updateUserResume, requireAuth } from '../controllers/userController.js';
import upload from '../config/multer.js';

const router = express.Router();

// Get user Data
router.get('/user', requireAuth, getUserData);

// Apply for a job
router.post('/apply', requireAuth, applyForJob);

// Get applied jobs data
router.get('/applications', requireAuth, getUserJobApplications);

// Update user profile (resume)
router.post('/update-resume', requireAuth, upload.single('resume'), updateUserResume);

export default router;
