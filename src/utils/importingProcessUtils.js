const mongoose = require('mongoose');
const ImportingProcess = require('../models/importingProcess');
const ImportingProcessEmitter = require('../events/importingProcessEmitter');

/**
 * Import data in bulk to specified collection with error tracking
 * @param {Array} data - Array of objects to import
 * @param {string} importId - ID of the importing process
 * @param {string} modelName - Name of the mongoose model to import to
 * @returns {Promise<Object>} Import statistics
 */
async function bulkImportWithErrorTracking(data, importId, modelName) {
    const session = await mongoose.startSession();
    const Model = mongoose.model(modelName);
    const stats = {
        total: data.length,
        successful: 0,
        failed: 0,
        duplicates: 0
    };

    try {
        await session.withTransaction(async () => {
            const importingProcess = await ImportingProcess.findById(importId);
            if (!importingProcess) {
                throw new Error('Importing process not found');
            }

            // Process data in chunks to avoid memory issues
            const chunkSize = 1000;
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                const operations = [];
                const failedRows = [];
                const duplicateRows = [];

                // Prepare operations for each item in chunk
                for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
                    const item = chunk[rowIndex];
                    const absoluteRowIndex = i + rowIndex;

                    try {
                        // Check for duplicates (assuming there's a unique field defined in the schema)
                        const existingDoc = await Model.findOne(item).session(session);
                        if (existingDoc) {
                            duplicateRows.push({
                                rowData: item,
                                rowNumber: absoluteRowIndex + 1,
                                timestamp: new Date()
                            });
                            stats.duplicates++;
                            continue;
                        }

                        operations.push({
                            insertOne: {
                                document: item
                            }
                        });
                    } catch (error) {
                        failedRows.push({
                            rowData: item,
                            rowNumber: absoluteRowIndex + 1,
                            errorMessage: error.message,
                            timestamp: new Date()
                        });
                        stats.failed++;
                    }
                }

                // Execute bulk operations if any
                if (operations.length > 0) {
                    try {
                        const result = await Model.bulkWrite(operations, { session });
                        stats.successful += result.insertedCount;
                    } catch (error) {
                        // If bulk write fails, mark all operations as failed
                        failedRows.push(...operations.map((op, index) => ({
                            rowData: op.insertOne.document,
                            rowNumber: i + index + 1,
                            errorMessage: error.message,
                            timestamp: new Date()
                        })));
                        stats.failed += operations.length;
                        stats.successful -= operations.length;
                    }
                }

                // Update importing process with failed and duplicate rows
                if (failedRows.length > 0 || duplicateRows.length > 0) {
                    await ImportingProcess.findByIdAndUpdate(
                        importId,
                        {
                            $push: {
                                failedRows: { $each: failedRows },
                                duplicateRows: { $each: duplicateRows }
                            },
                            $inc: {
                                processedRows: chunk.length
                            }
                        },
                        { session }
                    );
                }
            }

            // Update final statistics
            await ImportingProcess.findByIdAndUpdate(
                importId,
                {
                    status: stats.failed === data.length ? 'failed' : 'completed',
                    completedAt: new Date(),
                    totalRows: stats.total,
                    successfulRows: stats.successful
                },
                { session }
            );
        });
        
        return stats;
    } catch (error) {
        // Emit failure event
        ImportingProcessEmitter.getInstance().emitImportFailed(importId, error);
        throw error;
    } finally {
        await session.endSession();
    }
}

module.exports = {
    bulkImportWithErrorTracking
};
