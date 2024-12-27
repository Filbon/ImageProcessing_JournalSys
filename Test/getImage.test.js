const request = require('supertest');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const mockFs = require('mock-fs'); // for mocking file system
const app = express();

// Your original method
const { getImage } = require('../src/controllers/imageController');

// Define the route
app.get('/image/:filename', getImage);

describe('GET /image/:filename', () => {
    afterEach(() => {
        mockFs.restore(); // Restore the file system after each test
    });

    it('should return the image file if it exists', async () => {
        const filename = 'test-image.jpg';
        const imagePath = path.join(__dirname, '../../uploads', filename);

        // Mock the file system to simulate the file being present
        mockFs({
            [imagePath]: 'image data', // Mock the file content
        });

        const response = await request(app).get(`/image/${filename}`);

        expect(response.status).toBe(200);  // File should be found
        expect(response.header['content-type']).toMatch(/image/); // Optional: check content type
    });

    it('should return 404 if the image does not exist', async () => {
        const filename = 'nonexistent-image.jpg';

        // Mock the file system to simulate the file not being present
        mockFs({});

        const response = await request(app).get(`/image/${filename}`);

        expect(response.status).toBe(404);  // File should not be found
        expect(response.body.error).toBe('Image not found');
    });
});
