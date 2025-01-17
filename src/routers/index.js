const express = require("express");

const {patchImportingController} = require("../controllers/patchImporting")

const router = express.Router();

router.post("/upload", patchImportingController);

module.exports = router;
