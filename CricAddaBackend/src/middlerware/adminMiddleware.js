
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(",") : [];

export const verifyAdmin = (req, res, next) => {
  
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (ADMIN_IDS.length === 0) {
    console.warn("⚠️  No ADMIN_IDS set — admin routes are open to all authenticated users!");
    return next();
  }

  if (!ADMIN_IDS.includes(userId)) {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  next();
};
