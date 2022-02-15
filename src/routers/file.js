const express = require("express");
const UserFile = require("../model/file");
const router = new express.Router();
const auth = require("../middleware/auth");
const multer = require("multer");
require("dotenv").config();

const upload = multer({
  limits: { fileSize: process.env.FILELIMIT ? process.env.FILELIMIT : 500000 },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload a jpg, jpeg or png file"));
    }
    cb(undefined, true);
  },
});

// Create UserFile
router.post("/api/add-file", auth, upload.single("file"), async (req, res) => {
  try {
    const incomingFileBuffer = req.file.buffer;
    const incomingFileName = req.file.originalname || req.file.fieldname;
    const incomingFileSize = req.file.size;
    const file = new UserFile({
      filename: incomingFileName,
      size: incomingFileSize,
      file: incomingFileBuffer,
      user: req.user._id,
    });
    await file.save();
    res.status(201).send({ id: file._id });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

// Fetching all UserFiles GET /files
// Paginating UserFiles GET /files?limit=10&skip=0
// Sorting UserFiles GET /file?createdBy:desc

router.get("/api/files", auth, async (req, res) => {
  const user = req.user._id;
  const limit = parseInt(req.query.limit);
  const skip = parseInt(req.query.skip);
  const { query, sortBy } = req.query;
  const sort = {};
  try {
    if (query) {
      const files = await UserFile.find({ query }, { file: 0 });
      res.json({
        message: "Success",
        data: files,
      });
    } else if (sortBy) {
      // Sorting
      const sortBySplit = sortBy.split(":");
      sort[sortBySplit[0]] = sortBySplit[1] === "desc" ? -1 : 1;
      const files = await UserFile.find({ user }, { file: 0 }).sort([
        sortBySplit,
      ]);

      if (!files)
        return res.status(404).json({ message: "UserFile not Found" });
      res.json({
        message: "Success",
        data: files,
      });
    } else {
      const files = await UserFile.find({ user }, { file: 0 })
        .limit(limit)
        .skip(skip);

      if (!files)
        return res.status(404).json({ message: "UserFile not Found" });
      res.json({
        message: "Success",
        data: files,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//Fetching single file
router.get("/api/file/:id", auth, async (req, res) => {
  try {
    const _id = req.params.id;
    const file = await UserFile.findOne({ _id, user: req.user._id });
    if (!file) return res.status(404).json({ message: "UserFile not Found" });
    res.json({
      message: "Success",
      data: file,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

// Updating UserFile
router.patch("/api/file/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowUpdates = ["title", "Description", "completed"];
  const isValidOperation = updates.every((updates) =>
    allowUpdates.includes(updates)
  );
  if (!isValidOperation)
    return res.status(400).send({ error: "Invalid Update " });
  try {
    const user = req.user._id;
    const file = await UserFile.findOne({ _id: req.params.id, user });

    if (!file) return res.status(404).json({ message: "UserFile not Found" });

    updates.forEach((update) => (file[update] = req.body[update]));

    res.json({
      message: "Success",
      data: file,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

// Delete UserFile from Database
router.delete("/api/file/:id", auth, async (req, res) => {
  const user = req.user._id;
  try {
    const file = await UserFile.findOneAndDelete({ _id: req.params.id, user });
    if (!file) return res.status(404).json({ error: "UserFile not found" });
    res.json({
      message: "Your UserFile deleted Successfully",
      data: file,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
