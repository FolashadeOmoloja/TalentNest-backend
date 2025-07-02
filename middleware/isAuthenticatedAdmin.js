import jwt from "jsonwebtoken";

const isAuthenticated = (requiredRoles = []) => {
  return async (req, res, next) => {
    try {
      // Retrieve the token from cookies
      const token = req.cookies.token_admin;

      // Check if the token is not provided
      if (!token) {
        return res.status(401).json({
          message: "Authentication required",
          success: false,
        });
      }

      // Verify the token
      const decoded = jwt.verify(token, process.env.ADMIN_SECRET_KEY);
      // Attach the admin ID and role to the request object
      req.id = decoded.adminId;
      req.role = decoded.role; // If role is needed elsewhere

      // If the token is valid but role-based access control is required
      if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
        return res.status(403).json({
          message: "Forbidden: Access is denied",
          success: false,
        });
      }
      // Proceed to the next middleware or route handler
      next();
    } catch (error) {
      console.error("Authentication error:", error);

      // Differentiate between token errors
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Session expired. Please log in again.",
          success: false,
        });
      } else if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          message: "Invalid token.",
          success: false,
        });
      }

      // Send a generic error response for other errors
      return res.status(500).json({
        message: "An error occurred during authentication",
        success: false,
      });
    }
  };
};

export default isAuthenticated;
