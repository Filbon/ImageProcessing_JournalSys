// src/controllers/imageController.js
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

// Upload an image
exports.uploadImage = (req, res) => {
    const file = req.file;
    console.log(req.file); // Log the file object to verify

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.status(200).json({
        message: 'Image uploaded successfully',
        imageUrl: `http://localhost:5000/api/images/${file.filename}`,
        filePath: req.file.filename
    });
};

// Retrieve an image by filename
exports.getImage = async (req, res) => {
    const { filename } = req.params;
    const imagePath = path.join(__dirname, '../../uploads', filename);

    try {
        await fs.access(imagePath);  // Check if the file exists asynchronously
        res.sendFile(imagePath);  // File exists, send it
    } catch (error) {
        res.status(404).json({ error: 'Image not found' });  // File does not exist, return 404
    }
};

exports.annotateImage = async (req, res) => {
    console.log('Received annotate request:', req.body);

    const { imageId, text } = req.body;

    if (!imageId || !text) {
        return res.status(400).json({ error: 'Both imageId and text are required.' });
    }

    const imagePath = path.join(__dirname, '../../uploads', imageId);
    const annotatedImagePath = path.join(__dirname, '../../uploads', `annotated-${imageId}`);

    try {
        // Check if the image exists
        await fs.access(imagePath);
        console.log('Image exists:', imagePath);

        // Get the dimensions of the base image
        const { width, height } = await sharp(imagePath).metadata();
        console.log(`Image dimensions: ${width}x${height}`);

        // Generate the SVG with the same dimensions as the base image
        const svgText = `
            <svg width="${width}" height="${height}">
                <rect x="0" y="${height - 100}" width="${width}" height="100" fill="rgba(0, 0, 0, 0.5)" />
                <text x="10" y="${height - 50}" font-size="40" fill="white">${text}</text>
            </svg>
        `;

        // Annotate the image
        await sharp(imagePath)
            .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
            .toFile(annotatedImagePath);

        console.log('Image annotated successfully:', annotatedImagePath);

        res.status(200).json({
            message: 'Image annotated successfully',
            imageUrl: `http://localhost:5000/api/images/annotated-${imageId}`,
        });
    } catch (error) {
        console.error('Error during annotation:', error);
        res.status(500).json({ error: 'Error annotating image', details: error.message });
    }
};

