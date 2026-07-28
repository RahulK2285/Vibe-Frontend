const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.signup = async (req, res) => {
    try {
        const { name, identifier, password } = req.body;
        
        const userExists = await User.findOne({ 
            $or: [{ email: identifier }, { phone: identifier }] 
        });

        if (userExists) return res.status(400).json({ message: "User already exists" });

        const isEmail = identifier.includes('@');
        const userData = {
            name,
            password,
            email: isEmail ? identifier : undefined,
            phone: !isEmail ? identifier : undefined
        };

        const user = await User.create(userData);
        
        res.status(201).json({
            token: generateToken(user._id),
            user: { _id: user._id, name: user.name, membershipStatus: user.membershipStatus }
        });
    } catch (err) {
        // ERROR WAS HERE: You likely had next(err) here without 'next' defined above
        console.error("Signup Logic Error:", err.message);
        res.status(500).json({ message: err.message });
    }
};

exports.login = async (req, res) => {
    const { identifier, password } = req.body;
    try {
        const user = await User.findOne({ 
            $or: [{ email: identifier }, { phone: identifier }] 
        });

        if (user && (await user.comparePassword(password))) {
            res.json({
                token: generateToken(user._id),
                user: { _id: user._id, name: user.name, membershipStatus: user.membershipStatus }
            });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (err) {
        console.error("Login Logic Error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
};

// This function verifies the user's token and sends their data back
exports.getMe = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "No token" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};