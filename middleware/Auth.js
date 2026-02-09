import jwt from "jsonwebtoken";

export const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.SESSION_SECRET, {
    expiresIn: "15d",
  });
};

export const Auth = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized Access" });
    }

    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    req.userId = decoded.userId;
    req.role = decoded.role;
    req.session = { userId: decoded.userId, role: decoded.role }; // Backward compatibility (optional)

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid Token", error: err.message });
  }
};

export const AdminAuth = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized Access" });
    }

    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin Access Required" });
    }

    req.userId = decoded.userId;
    req.role = decoded.role;
    req.session = { userId: decoded.userId, role: decoded.role }; // Backward compatibility

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid Token", error: err.message });
  }
};