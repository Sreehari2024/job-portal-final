import jwt from 'jsonwebtoken';
import Company from '../models/Company.js';

// Middleware ( Protect Company Routes )
export const protectCompany = async (req, res, next) => {
    try {
        // Getting Token From Headers
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized, Login Again' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.company = await Company.findById(decoded.id).select('-password');

        if (!req.company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token, authorization failed' });
    }
};