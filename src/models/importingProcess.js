const mongoose = require('mongoose');

const importingProcessSchema = new mongoose.Schema({
    // The name of the collection where data will be imported
    targetCollection: {
        type: String,
        required: true
    },

    // Mapping between CSV columns and model fields
    // Example: { "First Name": "firstName", "Last Name": "lastName" }
    fieldMapping: {
        type: Map,
        of: String,
        required: true
    },

    // Store failed rows with error messages
    failedRows: [{
        rowData: {
            type: Map,
            of: mongoose.Schema.Types.Mixed
        },
        rowNumber: Number,
        errorMessage: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],

    // Store duplicate rows that were found during import
    duplicateRows: [{
        rowData: {
            type: Map,
            of: mongoose.Schema.Types.Mixed
        },
        rowNumber: Number,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],

    // Import status
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },

    // Statistics
    totalRows: {
        type: Number,
        default: 0
    },
    processedRows: {
        type: Number,
        default: 0
    },
    successfulRows: {
        type: Number,
        default: 0
    },

    // Timestamps for tracking the import process
    startedAt: Date,
    completedAt: Date,

    // Original file information
    fileName: String,
    fileSize: Number,
    filePath: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
importingProcessSchema.index({ status: 1 });
importingProcessSchema.index({ createdAt: 1 });

const ImportingProcess = mongoose.model('ImportingProcess', importingProcessSchema);

module.exports = ImportingProcess;
