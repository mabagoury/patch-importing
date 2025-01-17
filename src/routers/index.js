const express = require("express");

const {patchImportingController} = require("../controllers/patchImporting")
const { createImportingProcess } = require('../controllers/importingProcess');

const router = express.Router();

router.post("/upload", patchImportingController);
router.post('/importing-process', createImportingProcess);

module.exports = router;
