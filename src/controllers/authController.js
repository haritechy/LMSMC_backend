const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Role = require("../models/roleModel");
require("dotenv").config();

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email and include Role
    const user = await User.findOne({
      where: { email },
      include: Role,
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Create token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.Role.name, 
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Respond with token and user info
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.Role.name,
        mobile: user.mobile,
      },
    });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.register = async (req, res) => {
  const { name, email, password,mobile, roleid } = req.body;

  try {
    if(roleid !=2||roleid !=3){
        return res.status(400).json({message:"invalid role"});
    }
    const roleRecord = await Role.findOne({ where: { id: roleid } });
    if (!roleRecord) {
      return res.status(400).json({ message: "Invalid role provided." });
    }

    // 2. Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use." });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create user with RoleId
    const newUser = await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      RoleId: roleRecord.id,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        role: roleRecord.name,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
