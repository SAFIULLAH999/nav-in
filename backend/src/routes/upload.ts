import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { logger } from '../utils/logger';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Accept images and documents
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('application/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// Upload single file
router.post('/single', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No file uploaded',
          statusCode: 400,
        },
      });
    }

    res.json({
      success: true,
      data: {
        file: {
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: `/uploads/${req.file.filename}`,
        },
      },
    });
  } catch (error) {
    logger.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'File upload failed',
        statusCode: 500,
      },
    });
  }
});

// Upload multiple files
router.post('/multiple', upload.array('files', 5), (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No files uploaded',
          statusCode: 400,
        },
      });
    }

    const uploadedFiles = files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
    }));

    res.json({
      success: true,
      data: { files: uploadedFiles },
    });
  } catch (error) {
    logger.error('Multiple file upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'File upload failed',
        statusCode: 500,
      },
    });
  }
});

export default router;