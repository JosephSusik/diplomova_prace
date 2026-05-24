import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET as string

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

// Helper middleware to extract user from JWT token
interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Invalid token" });

    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid token" });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== "Admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

const userPublicSelect = {
  id: true,
  email: true,
  name: true,
  surname: true,
  role: true,
  createdAt: true,
} as const;

// Register user
router.post("/register", async (req, res) => {
  const { email: rawEmail, name, surname, password } = req.body;
  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const nameVal = typeof name === "string" ? name.trim() || "" : "";
  const surnameVal = typeof surname === "string" ? surname.trim() || "" : "";

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name: nameVal,
        surname: surnameVal,
        password: hashedPassword,
      },
      select: userPublicSelect,
    });
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(201).json({ message: "User created", token, user });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "User already exists" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...userPublicSelect, password: true },
  });

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });

  const { password: _password, ...safeUser } = user;
  res.json({ message: "Login successful", token, user: safeUser });
});


// GET /users/me
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Invalid token" });

    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid token" });
  }
});

// GET /users - Get all users (admin only)
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});


export default router;
