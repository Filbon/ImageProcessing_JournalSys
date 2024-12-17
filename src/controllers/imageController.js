// src/controllers/imageController.js
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');

let imageHashes = {};

exports.uploadImage = async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // Calculate hash of the image content
        const fileBuffer = await fs.readFile(file.path);
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Check if the hash already exists
        if (imageHashes[hash]) {
            // Duplicate detected
            await fs.unlink(file.path); // Delete the newly uploaded file
            return res.status(200).json({
                message: 'Duplicate image detected, reusing existing image.',
                imageUrl: `https://image-processing-backend.app.cloud.cbh.kth.se/api/images/${imageHashes[hash]}`,
                filePath: imageHashes[hash],
            });
        }

        // No duplicate found: Generate a new imageId and store the hash
        const imageId = file.filename; // You already generate unique filenames
        imageHashes[hash] = imageId;

        res.status(200).json({
            message: 'Image uploaded successfully',
            imageUrl: `https://image-processing-backend.app.cloud.cbh.kth.se/api/images/${imageId}`,
            filePath: imageId,
        });
    } catch (error) {
        console.error('Error during upload:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
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
    const tempPath = path.join(__dirname, '../../uploads', `temp-${imageId}`);

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

        // Composite the annotation onto a temporary file
        await sharp(imagePath)
            .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
            .toFile(tempPath); // Save to a temporary file

        // Replace the original file with the temporary file
        await fs.unlink(imagePath); // Remove the original file
        await fs.rename(tempPath, imagePath); // Rename temp file to original

        res.status(200).json({
            message: 'Image annotated successfully',
            imageUrl: `https://image-processing-backend.app.cloud.cbh.kth.se/api/images/${imageId}`,
        });
    } catch (error) {
        console.error('Error annotating image:', error);
        res.status(500).json({ error: 'Error annotating image', details: error.message });
    }
};


exports.drawOnImage = async (req, res) => {
    const { imageId, drawingData, x = 0, y = 0 } = req.body;

    if (!imageId || !drawingData) {
        return res.status(400).json({ error: 'imageId and drawingData are required.' });
    }

    const imagePath = path.join(__dirname, '../../uploads', imageId);
    const tempPath = path.join(__dirname, '../../uploads', `temp-${imageId}`);

    try {
        // Ensure the image exists
        await fs.access(imagePath);

        // Load the original image to get its dimensions
        const { width, height } = await sharp(imagePath).metadata();

        // Load the drawing buffer and get its dimensions
        const drawingBuffer = Buffer.from(drawingData, 'base64');
        const { width: drawWidth, height: drawHeight } = await sharp(drawingBuffer).metadata();

        console.log('Original Image Size:', width, height);
        console.log('Drawing Data Size:', drawWidth, drawHeight);

        // Resize the drawing to fit within the base image dimensions if needed
        let resizedDrawingBuffer = drawingBuffer;
        if (drawWidth > width || drawHeight > height) {
            resizedDrawingBuffer = await sharp(drawingBuffer)
                .resize(width, height, {
                    fit: 'contain', // Ensures the drawing stays proportional and within bounds
                    withoutEnlargement: true // Prevents upscaling if the drawing is smaller
                })
                .toBuffer();
        }

        // Composite the drawing onto the base image at the provided coordinates (x, y)
        await sharp(imagePath)
            .composite([{ input: resizedDrawingBuffer, blend: 'over', top: y, left: x }])
            .toFile(tempPath); // Save to a temporary file

        // Replace the original file with the temporary file
        await fs.unlink(imagePath); // Remove the original file
        await fs.rename(tempPath, imagePath); // Rename the temp file to the original path

        res.status(200).json({
            message: 'Drawing applied successfully',
            imageUrl: `https://image-processing-backend.app.cloud.cbh.kth.se/api/images/${imageId}`,
        });
    } catch (error) {
        console.error('Error applying drawing:', error);
        res.status(500).json({ error: 'Error applying drawing', details: error.message });
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
                url: `https://image-processing-backend.app.cloud.cbh.kth.se/api/images/${file}`
            }))
        });
    } catch (error) {
        console.error('Error retrieving image list:', error);
        res.status(500).json({ error: 'Error retrieving images', details: error.message });
    }
};







