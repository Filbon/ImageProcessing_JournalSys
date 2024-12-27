const request = require('supertest');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const imageController = require('../src/controllers/imageController');

jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn(),
        unlink: jest.fn(),
        access: jest.fn(),
        readdir: jest.fn(),
        rename: jest.fn(),
    },
}));
jest.mock('sharp', () => {
    return jest.fn(() => ({
        metadata: jest.fn(() => Promise.resolve({ width: 1000, height: 1000 })),
        composite: jest.fn(() => ({
            toFile: jest.fn(() => Promise.resolve()),
        })),
        resize: jest.fn(() => ({
            toBuffer: jest.fn(() => Promise.resolve(Buffer.from('resized-image'))),
        })),
    }));
});

const app = express();
app.use(express.json());
app.post('/upload', imageController.uploadImage);
app.get('/images/:filename', imageController.getImage);
app.post('/annotate', imageController.annotateImage);
app.post('/draw', imageController.drawOnImage);
app.get('/images', imageController.listUploadedImages);

describe('Image Controller', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('uploadImage - success', async () => {
        // Mock the file object that would be attached to the request
        const mockFile = {
            path: path.join(__dirname, '../../uploads/test.jpg'), // Mocked file path
            filename: 'test.jpg', // Mocked file name
        };

        // Mock fs.readFile to return a buffer (simulating file content)
        fs.readFile.mockResolvedValue(Buffer.from('test-image-content'));

        // Mock imageHashes to simulate no duplicate (empty object)
        imageHashes = {}; // Ensuring no duplicate exists

        // Mock the req.file object (to simulate the file upload)
        const req = {
            file: mockFile,
        };

        // Mock the res object
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Call the uploadImage function directly with the mocked req and res
        await imageController.uploadImage(req, res);

        // Assertions
        expect(fs.readFile).toHaveBeenCalledWith(mockFile.path); // Ensure fs.readFile is called with the correct path
        expect(res.status).toHaveBeenCalledWith(200); // Expect status 200 (success)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Image uploaded successfully',
            imageUrl: 'https://image-processing-backend.app.cloud.cbh.kth.se/api/images/test.jpg',
            filePath: 'test.jpg',
        }));
    });



    test('getImage - file not found', async () => {
        fs.access.mockRejectedValue(new Error('File not found'));

        const response = await request(app).get('/images/nonexistent.jpg');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Image not found');
    });

    test('annotateImage - success', async () => {
        const mockBody = {
            imageId: 'test.jpg',
            text: 'Annotation',
            x: 50,
            y: 50,
        };
        const tempPath = path.join(__dirname, '../../uploads', 'temp-test.jpg');
        fs.access.mockResolvedValue();

        const response = await request(app).post('/annotate').send(mockBody);

        expect(fs.access).toHaveBeenCalledWith(path.join(__dirname, '../../uploads', 'test.jpg'));
        expect(fs.rename).toHaveBeenCalledWith(tempPath, path.join(__dirname, '../../uploads', 'test.jpg'));
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Image annotated successfully');
    });

    test('drawOnImage - missing fields', async () => {
        const response = await request(app).post('/draw').send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'imageId and drawingData are required.');
    });

    test('listUploadedImages - success', async () => {
        const mockFiles = ['image1.jpg', 'image2.png'];
        fs.readdir.mockResolvedValue(mockFiles);

        const response = await request(app).get('/images');

        expect(fs.readdir).toHaveBeenCalledWith(path.join(__dirname, '../../uploads'));
        expect(response.status).toBe(200);
        expect(response.body.images).toHaveLength(2);
    });

    test('listUploadedImages - no images', async () => {
        fs.readdir.mockResolvedValue([]);

        const response = await request(app).get('/images');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'No images found');
    });
});
