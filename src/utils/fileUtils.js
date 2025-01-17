const fs = require('fs');
const csv = require('csv-parse');
const path = require('path');
const ImportingProcessEmitter = require('../events/importingProcessEmitter');
const { bulkImportWithErrorTracking } = require('./importingProcessUtils');

/**
 * Read and process CSV file in chunks with resume capability
 * @param {string} filePath - Path to the CSV file
 * @param {string} importId - ID of the importing process
 * @param {string} modelName - Name of the target model
 * @param {Object} fieldMapping - Mapping of CSV headers to model fields
 * @param {number} chunkSize - Number of rows to process at once (default: 1000)
 */
async function processCSVFileInChunks(filePath, importId, modelName, fieldMapping, chunkSize = 1000) {
    // Create position tracking file
    const positionFile = path.join(
        path.dirname(filePath),
        `${path.basename(filePath)}.position`
    );

    let startPosition = 0;
    let headers = null;
    const stats = {
        total: 0,
        successful: 0,
        failed: 0,
        duplicates: 0
    };

    try {
        // Check if we have a saved position
        if (fs.existsSync(positionFile)) {
            startPosition = parseInt(fs.readFileSync(positionFile, 'utf8'));
        }

        // Create read stream starting from the saved position
        const fileStream = fs.createReadStream(filePath, {
            start: startPosition,
            encoding: 'utf8'
        });

        // Create CSV parser
        const parser = csv({
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        let currentChunk = [];
        let processedBytes = startPosition;
        let isFirstChunk = true;

        // Process the file
        for await (const record of fileStream.pipe(parser)) {
            // Skip header row if resuming
            if (isFirstChunk && startPosition > 0) {
                isFirstChunk = false;
                continue;
            }

            // Map CSV fields to model fields
            const mappedRecord = {};
            for (const [csvField, modelField] of Object.entries(fieldMapping)) {
                mappedRecord[modelField] = record[csvField];
            }

            currentChunk.push(mappedRecord);

            // Process chunk when it reaches the specified size
            if (currentChunk.length >= chunkSize) {
                const chunkStats = await bulkImportWithErrorTracking(
                    currentChunk,
                    importId,
                    modelName
                );

                // Update overall stats
                stats.total += chunkStats.total;
                stats.successful += chunkStats.successful;
                stats.failed += chunkStats.failed;
                stats.duplicates += chunkStats.duplicates;

                // Save current position
                processedBytes = fileStream.bytesRead + startPosition;
                fs.writeFileSync(positionFile, processedBytes.toString());

                // Clear the chunk
                currentChunk = [];
            }
        }

        // Process remaining records
        if (currentChunk.length > 0) {
            const chunkStats = await bulkImportWithErrorTracking(
                currentChunk,
                importId,
                modelName
            );

            // Update overall stats
            stats.total += chunkStats.total;
            stats.successful += chunkStats.successful;
            stats.failed += chunkStats.failed;
            stats.duplicates += chunkStats.duplicates;
        }

        // Clean up position file
        cleanupPositionFile(positionFile);

        // Emit completion event
        ImportingProcessEmitter.getInstance().emitImportCompleted(importId, stats);

        return stats;
    } catch (error) {
        // Save the current position for resume capability
        if (processedBytes > 0) {
            fs.writeFileSync(positionFile, processedBytes.toString());
        }

        // Emit failure event
        ImportingProcessEmitter.getInstance().emitImportFailed(importId, error);
        throw error;
    }
}

/**
 * Get the current progress of file processing
 * @param {string} filePath - Path to the CSV file
 * @returns {Object} Progress information
 */
function getFileProcessingProgress(filePath) {
    const positionFile = path.join(
        path.dirname(filePath),
        `${path.basename(filePath)}.position`
    );

    if (!fs.existsSync(positionFile)) {
        return {
            processed: 0,
            total: fs.statSync(filePath).size,
            percentage: 0
        };
    }

    const processedBytes = parseInt(fs.readFileSync(positionFile, 'utf8'));
    const totalBytes = fs.statSync(filePath).size;

    return {
        processed: processedBytes,
        total: totalBytes,
        percentage: Math.round((processedBytes / totalBytes) * 100)
    };
}

/**
 * Delete the position tracking file if it exists
 * @param {string} positionFile - Path to the position file
 */
function cleanupPositionFile(positionFile) {
    if (fs.existsSync(positionFile)) {
        fs.unlinkSync(positionFile);
    }
}


module.exports = {
    processCSVFileInChunks,
    getFileProcessingProgress,
    cleanupPositionFile
};
