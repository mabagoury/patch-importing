const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const ImportingProcess = require('../models/importingProcess');
const os = require('os');

/**
 * Handles file upload for the importing process
 * Supports resumable uploads and stores file in temp directory
 */
async function patchImportingController(req, res) {
    try {
        const importId = req.query.importId;
        const contentRange = req.headers['content-range'];
        
        if (!importId) {
            return res.status(400).json({
                success: false,
                error: 'Import ID is required'
            });
        }

        // Find the importing process
        const importingProcess = await ImportingProcess.findById(importId);
        if (!importingProcess) {
            return res.status(404).json({
                success: false,
                error: 'Importing process not found'
            });
        }

        // Parse content-range header if exists
        let start = 0;
        let end = 0;
        let total = 0;

        if (contentRange) {
            const matches = contentRange.match(/bytes (\d+)-(\d+)\/(\d+)/);
            if (matches) {
                start = parseInt(matches[1]);
                end = parseInt(matches[2]);
                total = parseInt(matches[3]);
            }
        }

        // Create temp directory if it doesn't exist
        const tempDir = path.join(os.tmpdir(), 'csv-imports');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Generate temp file path
        const tempFilePath = path.join(tempDir, `${importId}.csv`);

        // Check if file exists and its size for resume capability
        let currentSize = 0;
        if (fs.existsSync(tempFilePath)) {
            const stats = fs.statSync(tempFilePath);
            currentSize = stats.size;
        }

        // If client is checking file status
        if (req.method === 'HEAD') {
            res.set('Upload-Offset', currentSize.toString());
            res.set('Upload-Length', total.toString());
            return res.status(200).end();
        }

        // Validate resume position
        if (start !== currentSize) {
            return res.status(409).json({
                success: false,
                error: 'Invalid resume position',
                currentSize
            });
        }

        // Open write stream in append mode if resuming, otherwise in write mode
        const writeStream = fs.createWriteStream(tempFilePath, {
            flags: start > 0 ? 'a' : 'w'
        });

        // Pipe the request to file with error handling
        await pipeline(
            req,
            writeStream
        );

        // Update importing process with file information
        importingProcess.filePath = tempFilePath;
        importingProcess.fileName = req.headers['x-file-name'] || `import-${importId}.csv`;
        importingProcess.fileSize = total || req.headers['content-length'];
        await importingProcess.save();

        // Send response
        res.status(200).json({
            success: true,
            data: {
                bytesReceived: end + 1,
                totalBytes: total
            }
        });

    } catch (error) {
        // Clean up temp file if error occurs during initial upload
        const tempFilePath = path.join(os.tmpdir(), 'csv-imports', `${req.query.importId}.csv`);
        if (fs.existsSync(tempFilePath) && fs.statSync(tempFilePath).size === 0) {
            fs.unlinkSync(tempFilePath);
        }

        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process file upload'
        });
    }
}

module.exports = {
    patchImportingController
};