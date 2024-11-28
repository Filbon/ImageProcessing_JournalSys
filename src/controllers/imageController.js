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
    const { imageId, text, x, y } = req.body;

    if (!imageId || !text || x === undefined || y === undefined) {
        return res.status(400).json({ error: 'imageId, text, x, and y are required.' });
    }

    const imagePath = path.join(__dirname, '../../uploads', imageId);
    const annotatedImagePath = path.join(__dirname, '../../uploads', `annotated-${imageId}`);

    try {
        // Ensure the image exists
        await fs.access(imagePath);

        // Get dimensions of the image
        const { width, height } = await sharp(imagePath).metadata();

        // Font settings
        const fontSize = 20; // Customize font size here
        const textPadding = 10; // Padding around the text

        // Calculate text width (estimate based on font size and text length)
        const textWidth = text.length * (fontSize / 1.8); // Approximation for character width
        const textHeight = fontSize + textPadding; // Height of the box

        // Define the SVG with a black box dynamically sized to fit the text
        const svgText = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect 
                x="${x}" 
                y="${y - textHeight}" 
                width="${textWidth + textPadding}" 
                height="${textHeight}" 
                fill="rgba(0, 0, 0, 0.5)" 
            />
            <text 
                x="${x + textPadding / 2}" 
                y="${y - textPadding / 2}" 
                font-size="${fontSize}" 
                fill="white"
            >
                ${text}
            </text>
        </svg>
        `;

        // Composite the annotation on the image
        await sharp(imagePath)
            .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
            .toFile(annotatedImagePath);

        res.status(200).json({
            message: 'Image annotated successfully',
            imageUrl: `http://localhost:5000/api/images/annotated-${imageId}`,
        });
    } catch (error) {
        console.error('Error annotating image:', error);
        res.status(500).json({ error: 'Error annotating image', details: error.message });
    }
};

exports.drawOnImage = async (req, res) => {
    const { imageId, drawingData } = req.body;

    if (!imageId || !drawingData) {
        return res.status(400).json({ error: "imageId and drawingData are required." });
    }

    const imagePath = path.join(__dirname, '../../uploads', imageId);
    const annotatedImagePath = path.join(__dirname, '../../uploads', `drawn-${imageId}`);

    try {
        // Ensure the image exists
        await fs.access(imagePath);

        // Assuming drawingData is a PNG buffer sent from the client
        const drawingBuffer = Buffer.from(drawingData, 'base64');

        // Composite the drawing onto the image
        await sharp(imagePath)
            .composite([{ input: drawingBuffer, blend: 'over' }])
            .toFile(annotatedImagePath);

        res.status(200).json({
            message: "Drawing applied successfully",
            imageUrl: `http://localhost:5000/api/images/drawn-${imageId}`,
        });
    } catch (error) {
        console.error("Error applying drawing:", error);
        res.status(500).json({ error: "Error applying drawing", details: error.message });
    }
};

// List all uploaded images
exports.listUploadedImages = async (req, res) => {
    const uploadsPath = path.join(__dirname, '../../uploads');
    try {
        console.log('Accessing uploads path:', uploadsPath);
        const files = await fs.readdir(uploadsPath);
        console.log('Files found:', files);

        if (files.length === 0) {
            return res.status(404).json({ error: 'No images found' });
        }

        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
        console.log('Filtered image files:', imageFiles);

        if (imageFiles.length === 0) {
            return res.status(404).json({ error: 'No valid image files found' });
        }

        res.status(200).json({
            message: 'Uploaded images retrieved successfully',
            images: imageFiles.map(file => ({
                filename: file,
                url: `http://localhost:5000/api/images/${file}`
            }))
        });
    } catch (error) {
        console.error('Error retrieving image list:', error);
        res.status(500).json({ error: 'Error retrieving images', details: error.message });
    }
};







