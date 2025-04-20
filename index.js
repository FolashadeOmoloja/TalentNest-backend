import express from "express"; // Import Express module
import cookieParser from "cookie-parser"; // Import cookie-parser middleware
import cors from "cors"; // Import CORS middleware
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import apllicantsRoute from "./routes/applicants.route.js";
import adminRoute from "./routes/admin.route.js";
import blogRoute from "./routes/blog.route.js";
import resetRoute from "./routes/reset.route.js";

dotenv.config({});

const app = express(); // Create an instance of an Express application

// Middleware
app.use(express.json()); // Parse incoming requests with JSON payloads
app.use(express.urlencoded({ extended: true })); // Parse incoming requests with URL-encoded payloads
app.use(cookieParser()); // Parse cookies attached to the client request object

// CORS configuration options
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3002",
    "https://frack.vercel.app/",
    "https://frack-admin.vercel.app/",
  ],
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
};

// Use CORS middleware with the specified options
app.use(cors(corsOptions));

const PORT = process.env.PORT || 3000; // Define the port number
//api's
app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/applicants", apllicantsRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/blog", blogRoute);
app.use("/api/v1/reset", resetRoute);
// "http://localhost:8000/api/v1/user/registerTalent"
// "http://localhost:8000/api/v1/user/login"
// "http://localhost:8000/api/v1/user/profile/update"

// Global Error Handling Middleware (Example)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    success: false,
  });
});

app.listen(PORT, () => {
  // Start the server
  connectDB(); //connects to mongo bd
  console.log(`Server running on ${PORT}`);
});
