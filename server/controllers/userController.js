import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

// Middleware to ensure Clerk authentication
export const requireAuth = ClerkExpressRequireAuth();

// Ensure user exists in MongoDB
const ensureUserInDB = async (clerkId, email, name, image) => {
    let user = await User.findOne({ clerkId });
    if (!user) {
        user = new User({ clerkId, email, name, image });
        await user.save();
    }
    return user;
};

// Get User Data
export const getUserData = async (req, res) => {
    try {
        const { userId, emailAddresses, fullName, imageUrl } = req.auth;
        
        const user = await ensureUserInDB(userId, emailAddresses[0].emailAddress, fullName, imageUrl);
        res.json({ success: true, user });
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Apply For Job
export const applyForJob = async (req, res) => {
    try {
        const { jobId } = req.body;
        const { userId, emailAddresses, fullName, imageUrl } = req.auth;
        
        const user = await ensureUserInDB(userId, emailAddresses[0].emailAddress, fullName, imageUrl);
        
        const isAlreadyApplied = await JobApplication.exists({ jobId, userId: user._id });
        if (isAlreadyApplied) {
            return res.status(400).json({ success: false, message: 'Already Applied' });
        }
        
        const jobData = await Job.findById(jobId);
        if (!jobData) {
            return res.status(404).json({ success: false, message: 'Job Not Found' });
        }
        
        await JobApplication.create({
            companyId: jobData.companyId,
            userId: user._id,
            jobId,
            date: Date.now()
        });
        
        res.json({ success: true, message: 'Applied Successfully' });
    } catch (error) {
        console.error("Error applying for job:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Get User Applied Applications Data
export const getUserJobApplications = async (req, res) => {
    try {
        const { userId, emailAddresses, fullName, imageUrl } = req.auth;
        const user = await ensureUserInDB(userId, emailAddresses[0].emailAddress, fullName, imageUrl);
        
        const applications = await JobApplication.find({ userId: user._id })
            .populate('companyId', 'name email image')
            .populate('jobId', 'title description location category level salary');
        
        if (!applications.length) {
            return res.status(404).json({ success: false, message: 'No job applications found.' });
        }
        
        res.json({ success: true, applications });
    } catch (error) {
        console.error("Error fetching job applications:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Update User Resume
export const updateUserResume = async (req, res) => {
    try {
        const { userId, emailAddresses, fullName, imageUrl } = req.auth;
        const resumeFile = req.file;
        
        const user = await ensureUserInDB(userId, emailAddresses[0].emailAddress, fullName, imageUrl);
        
        if (resumeFile) {
            const resumeUpload = await cloudinary.uploader.upload(resumeFile.path);
            user.resume = resumeUpload.secure_url;
            await user.save();
        }
        
        res.json({ success: true, message: 'Resume Updated' });
    } catch (error) {
        console.error("Error updating resume:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
