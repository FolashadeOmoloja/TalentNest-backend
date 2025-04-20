import jwt from "jsonwebtoken";

const verifyAuth = () => {
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

      let decoded;
      try {
        // Attempt to verify the token with the user secret key
        decoded = await jwt.verify(token, process.env.SECRET_KEY);
      } catch (err) {
        try {
          // If the first attempt fails, try with the company secret key
          decoded = await jwt.verify(token, process.env.COMPANY_SECRET_KEY);
        } catch (err) {
          // If both verifications fail, throw an error
          return res.status(401).json({
            message: "Invalid or expired token",
            success: false,
          });
        }
      }

      // Attach the user or company ID and role to the request object
      req.id = decoded.userId || decoded.companyId;
      req.role = decoded.role;

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

export default verifyAuth;
