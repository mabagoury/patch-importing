const ImportingProcessEmitter = require('../events/importingProcessEmitter');

class ImportingProcessListener {
    constructor() {
        this.emitter = ImportingProcessEmitter.getInstance();
        this.setupListeners();
    }

    setupListeners() {
        // Listen for new imports ready to be processed
        this.emitter.on(ImportingProcessEmitter.EVENTS.IMPORT_READY, async (importId) => {
            const { bulkImportWithErrorTracking } = require('../utils/importingProcessUtils');
            const stats = await bulkImportWithErrorTracking(data, importId, modelName);
            console.log(`Import ${importId} processed successfully`, stats);
            // error is handled partially in the bulkImportWithErrorTracking function to track the failed records
         

        });

        // Listen for completed imports
        this.emitter.on(ImportingProcessEmitter.EVENTS.IMPORT_COMPLETED, (importId, stats) => {
            // TODO: Implement completion handling
            console.log(`Import ${importId} completed`, stats);
           this.emitter.on(ImportingProcessEmitter.EVENTS.IMPORT_COMPLETED, async (importId, stats) => {
                // TODO: Implement completion handling
                console.log(`Import ${importId} completed`, stats);
                await ImportingProcess.findByIdAndUpdate(importId, {
                    status: 'success', 
                    updatedAt: new Date()
                });
            });
        });

        // Listen for failed imports
        this.emitter.on(ImportingProcessEmitter.EVENTS.IMPORT_FAILED, async (importId, error) => {
            // TODO: Implement error handling
            console.error(`Import ${importId} failed:`, error);
            await ImportingProcess.findByIdAndUpdate(importId, {
                status: 'failed',
                updatedAt: new Date(),
                failedRows: [{
                    rowData: data,
                    errorMessage: error.message,
                    timestamp: new Date()
                }]
            });

        });
    }
}

module.exports = ImportingProcessListener; 