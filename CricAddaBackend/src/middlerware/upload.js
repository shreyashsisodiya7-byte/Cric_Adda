import fs from 'fs'
import path from 'path'
import multer from 'multer'

// Ensure the uploads folder exists (prevents ENOENT errors)
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .replace(/__+/g, '_');

    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });
export default upload;
