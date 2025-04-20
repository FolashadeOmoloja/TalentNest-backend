import jwt from "jsonwebtoken";

const isAuthenticated = (requiredRole) => {
  return async (req, res, next) => {
    try {
      // Retrieve the token from cookies
      const token = req.cookies.token;

      // Check if the token is not provided
      if (!token) {
        return res.status(401).json({
          message: "Authentication required",
          success: false,
        });
      }

      // Verify the token
      const decoded = await jwt.verify(token, process.env.SECRET_KEY);

      // If the token is invalid or expired
      if (!decoded) {
        return res.status(401).json({
          message: "Invalid or expired token",
          success: false,
        });
      }

      // Check if the role matches the required role
      if (decoded.role !== requiredRole) {
        return res.status(403).json({
          message: "Forbidden: Access is denied",
          success: false,
        });
      }

      // Attach the user ID to the request object for use in subsequent middleware or routes
      req.id = decoded.userId;

      // Proceed to the next middleware or route handler
      next();
    } catch (error) {
      console.error("Authentication error:", error);

      // Send a generic error response
      return res.status(500).json({
        message: "An error occurred during authentication",
        success: false,
      });
    }
  };
};

export default isAuthenticated;
