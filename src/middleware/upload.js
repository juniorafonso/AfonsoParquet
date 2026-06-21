const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fileType = require('file-type');

// Upload limits from environment
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '100');
const MAX_PHOTOS_PER_DEVIS = parseInt(process.env.MAX_PHOTOS_PER_DEVIS || '10');
const MAX_VIDEOS_PER_DEVIS = parseInt(process.env.MAX_VIDEOS_PER_DEVIS || '2');
const MAX_TOTAL_SIZE_MB = parseInt(process.env.MAX_TOTAL_SIZE_MB || '250');

// Allowed mime types
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/quicktime', 'video/webm'];

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    // Generate UUID filename
    const uuid = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${uuid}${ext}`);
  }
});

// File filter (basic check, will do magic-byte validation after upload)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov', '.webm'];
  
  if (!allowedExts.includes(ext)) {
    return cb(new Error('File type not allowed'), false);
  }
  
  cb(null, true);
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, // Convert MB to bytes
    files: MAX_PHOTOS_PER_DEVIS + MAX_VIDEOS_PER_DEVIS
  }
});

/**
 * Validate uploaded files with magic-byte checking
 * Ensures files match their declared mime type
 */
async function validateUploadedFiles(files) {
  const errors = [];
  let photoCount = 0;
  let videoCount = 0;
  let totalSize = 0;
  
  for (const file of files) {
    // Check magic bytes
    const type = await fileType.fromFile(file.path);
    
    if (!type) {
      errors.push(`${file.originalname}: Could not determine file type`);
      continue;
    }
    
    // Validate image
    if (ALLOWED_IMAGE_MIMES.includes(type.mime)) {
      photoCount++;
      if (photoCount > MAX_PHOTOS_PER_DEVIS) {
        errors.push(`Maximum ${MAX_PHOTOS_PER_DEVIS} photos allowed`);
      }
    }
    // Validate video
    else if (ALLOWED_VIDEO_MIMES.includes(type.mime)) {
      videoCount++;
      if (videoCount > MAX_VIDEOS_PER_DEVIS) {
        errors.push(`Maximum ${MAX_VIDEOS_PER_DEVIS} videos allowed`);
      }
    }
    // Invalid type
    else {
      errors.push(`${file.originalname}: File type ${type.mime} not allowed`);
    }
    
    totalSize += file.size;
  }
  
  // Check total size
  if (totalSize > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
    errors.push(`Total file size exceeds ${MAX_TOTAL_SIZE_MB} MB`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    photoCount,
    videoCount,
    totalSize
  };
}

module.exports = {
  upload,
  validateUploadedFiles,
  ALLOWED_IMAGE_MIMES,
  ALLOWED_VIDEO_MIMES
};
