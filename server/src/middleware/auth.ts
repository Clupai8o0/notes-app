import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

interface AuthRequest extends Request {
  user?: IUser;
}

interface JwtPayload {
  id: string;
  iat?: number;
  exp?: number;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    let token;
    // eslint-disable-next-line no-console
    console.log("Auth Headers:", req.headers); // Debug log
    // eslint-disable-next-line no-console
    console.log("Auth Cookies:", req.cookies); // Debug log

    // Check Authorization header
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
      // eslint-disable-next-line no-console
      console.log("Token from Authorization header:", token); // Debug log
    }
    // Check cookies
    else if (req.cookies?.token) {
      token = req.cookies.token;
      // eslint-disable-next-line no-console
      console.log("Token from cookies:", token); // Debug log
    }

    if (!token) {
      // eslint-disable-next-line no-console
      console.log("No token found in request"); // Debug log
      return res
        .status(401)
        .json({ message: "Not authorized to access this route - No token found" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as JwtPayload;
      // eslint-disable-next-line no-console
      console.log("Decoded token:", decoded); // Debug log

      const user = await User.findById(decoded.id).select("-password");
      // eslint-disable-next-line no-console
      console.log("Found user:", user ? "Yes" : "No"); // Debug log

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      // eslint-disable-next-line no-console
      console.error("JWT verification error:", jwtError); // Debug log
      return res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Auth middleware error:", error); // Debug log
    res.status(401).json({ message: "Not authorized to access this route" });
  }
};
