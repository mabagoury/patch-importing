const EventEmitter = require('events');

class ImportingProcessEmitter extends EventEmitter {
    static instance = null;
    
    // Events constants
    static EVENTS = {
        IMPORT_READY: 'importReady',
        IMPORT_COMPLETED: 'importCompleted',
        IMPORT_FAILED: 'importFailed'
    };

    constructor() {
        super();
        if (ImportingProcessEmitter.instance) {
            return ImportingProcessEmitter.instance;
        }
        ImportingProcessEmitter.instance = this;
    }

    /**
     * Emit event when a new import is ready to be processed
     * @param {string} importId - The ID of the importing process
     */
    emitImportReady(importId) {
        this.emit(ImportingProcessEmitter.EVENTS.IMPORT_READY, importId);
    }

    /**
     * Emit event when an import is completed
     * @param {string} importId - The ID of the importing process
     * @param {Object} stats - Import statistics
     */
    emitImportCompleted(importId, stats) {
        this.emit(ImportingProcessEmitter.EVENTS.IMPORT_COMPLETED, importId, stats);
    }

    /**
     * Emit event when an import fails
     * @param {string} importId - The ID of the importing process
     * @param {Error} error - The error that occurred
     */
    emitImportFailed(importId, error) {
        this.emit(ImportingProcessEmitter.EVENTS.IMPORT_FAILED, importId, error);
    }

    // Singleton getter
    static getInstance() {
        if (!ImportingProcessEmitter.instance) {
            ImportingProcessEmitter.instance = new ImportingProcessEmitter();
        }
        return ImportingProcessEmitter.instance;
    }
}

module.exports = ImportingProcessEmitter; 