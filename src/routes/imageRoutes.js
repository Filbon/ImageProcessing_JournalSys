const express = require('express');
const router = express.Router();
const multer = require('multer');
const imageController = require('../controllers/imageController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Set the upload directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Set the filename
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
});

// Route to upload image with multer middleware
router.post('/upload', upload.single('file'), imageController.uploadImage);

// Route to retrieve an image by filename
router.get('/:filename', imageController.getImage);

// Route to annotate an image
router.post('/annotate', imageController.annotateImage);

module.exports = router;


