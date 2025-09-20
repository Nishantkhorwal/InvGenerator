import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import InvGenUser from '../models/userModel.js';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;



export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, project } = req.body;

    // check existing user
    const existingUser = await InvGenUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // enforce project rule
    if (role === 'User' && !project) {
      return res.status(400).json({ message: 'Project is required for User role' });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = await InvGenUser.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'User', // default = User
      project: role === 'Admin' ? null : project, // Admins don’t need project
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        project: user.project,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};



// Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password, project, role } = req.body;

    // find user
    let user;

    // if Admin, only match email (ignore project)
    user = await InvGenUser.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email, project, or password' });
    }
    if (user.role !== role) {
      return res.status(403).json({ message: "Access denied: role mismatch" });
    }

    // for Users, project must match
    if (user.role === 'User' && user.project !== project) {
      return res.status(400).json({ message: 'Invalid project for this user' });
    }

    // verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email, project, or password' });
    }

    // create token with role + project info
    const token = jwt.sign(
      { id: user._id, role: user.role, project: user.project },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        project: user.project,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};





export const editUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, password, role, project } = req.body;

    const updatedFields = {};
    if (name) updatedFields.name = name;
    if (email) updatedFields.email = email;
    if (role) updatedFields.role = role;
    if (project) updatedFields.project = project;

    if (password) {
      updatedFields.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await InvGenUser.findByIdAndUpdate(
      userId,
      updatedFields,
      { new: true }
    ).select('-password');

    res.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


export const getUser = async (req, res) => {
  try {
    const requesterId = req.user.id;

    // find the logged-in user (to check role & project)
    const requester = await InvGenUser.findById(requesterId).select('-password');
    if (!requester) {
      return res.status(404).json({ message: 'Requester not found' });
    }

    let users;

    if (requester.role === 'Admin') {
      // Admin can see everyone
      users = await InvGenUser.find().select('-password');
    } else {
      // User can see only users from their own project
      users = await InvGenUser.find({ project: requester.project }).select('-password');
    }

    res.json({
      message: 'Users fetched successfully',
      users,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


