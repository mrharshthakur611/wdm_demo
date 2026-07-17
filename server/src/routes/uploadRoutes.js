const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "wdm-products", // The folder in cloudinary
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

const upload = multer({ storage: storage });

// POST /api/admin/upload
router.post("/upload", protect, adminOnly, (req, res) => {
  // Run multer manually so we can catch its errors and return JSON
  upload.single("image")(req, res, (err) => {
    if (err) {
      // multer or cloudinary threw — return JSON so frontend can display the message
      console.error("[Upload Error]", err);
      return res.status(500).json({
        message: err.message || "Image upload failed",
      });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No image provided" });
    }
    // req.file.path contains the public Cloudinary URL
    res.json({ imageUrl: req.file.path });
  });
});

module.exports = router;
