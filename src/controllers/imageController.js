// src/controllers/imageController.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Upload an image
exports.uploadImage = (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.status(200).json({ message: 'Image uploaded successfully', imageUrl: `/api/images/${file.filename}` });
};

// Retrieve an image by filename
exports.getImage = (req, res) => {
    const { filename } = req.params;
    const imagePath = path.join(__dirname, '../../uploads', filename);

    fs.exists(imagePath, (exists) => {
        if (exists) {
            res.sendFile(imagePath);
        } else {
            res.status(404).json({ error: 'Image not found' });
        }
    });
};

// Annotate an image (add text on image)
exports.annotateImage = async (req, res) => {
    const { imageId, text } = req.body;
    const imagePath = path.join(__dirname, '../../uploads', imageId);

    // Check if image exists
    if (!fs.existsSync(imagePath)) {
        return res.status(404).json({ error: 'Image not found' });
    }

    // Annotating the image with text using sharp
    try {
        const annotatedImagePath = path.join(__dirname, '../../uploads', 'annotated-' + imageId);
        await sharp(imagePath)
            .composite([{
                input: Buffer.from(`<svg width="500" height="500">
                              <text x="10" y="50" font-size="50" fill="white">${text}</text>
                             </svg>`),
                gravity: 'southeast',
            }])
            .toFile(annotatedImagePath);

        res.status(200).json({ message: 'Image annotated successfully', imageUrl: `/api/images/${'annotated-' + imageId}` });
    } catch (error) {
        res.status(500).json({ error: 'Error annotating image', details: error.message });
    }
};
