const ImportingProcess = require('../models/importingProcess');
const ImportingProcessEmitter = require('../events/importingProcessEmitter');

/**
 * Creates a new importing process
 * @param {Object} req.body
 * @param {string} req.body.targetCollection - The collection where data will be imported
 * @param {Object} req.body.fieldMapping - Mapping between CSV columns and model fields
 * @param {number} req.body.fileSize - Size of the file in bytes
 */
async function createImportingProcess(req, res) {
    try {
        const {
            targetCollection,
            fieldMapping,
            fileSize
        } = req.body;

        const importingProcess = new ImportingProcess({
            targetCollection,
            fieldMapping,
            fileSize,
            startedAt: new Date()
        });

        // Get emitter instance and emit import ready event
        const emitter = ImportingProcessEmitter.getInstance();
        emitter.emitImportReady(importingProcess._id);

        await importingProcess.save();

        res.status(201).json({
            success: true,
            data: {
                importId: importingProcess._id
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to create importing process'
        });
    }
}

module.exports = {
    createImportingProcess
};
