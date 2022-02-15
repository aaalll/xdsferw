const express = require("express");
const router = new express.Router();
const User = require("../model/user");
const multer = require("multer");
const sharp = require("sharp");
const auth = require("../middleware/auth");

// Creating User
router.post("/api/signup", async (req, res) => {
  const user = new User(req.body);
  try {
    const token = await user.generateAuthToken();
    await user.save();
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Signing User
router.post("/api/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.username,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Invalid Login Details" });
  }
});

// Uploading of Profile Picture
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 500000 },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload a jpg, jpeg or png file"));
    }
    cb(undefined, true);
  },
});

// Loging Out user
router.post("/api/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.status(200).json({
      status: "Success",
      message: "Successfully Logged out from all Devices",
    });
  } catch (error) {
    res.status(500).send({ message: "Internal Error" });
  }
});

router.post("/api/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.status(200).json({
      status: "Success",
      message: "Successfully Logged out",
    });
  } catch (error) {
    res.status(500).send({ message: "Internal Error" });
  }
});

// Fetching Profile
router.get("/api/users/me", auth, async (req, res) => {
  const user = await req.user;
  res.json({
    status: "Success",
    data: user,
  });
});

// Fetching single user
router.get("/api/user/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Updating my Profile
router.patch("/api/user/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowUpdates = ["username", "password"];
  const isValidOperation = updates.every((updates) =>
    allowUpdates.includes(updates)
  );
  if (!isValidOperation)
    return res.status(400).send({ error: "Invalid Update " });
  try {
    const user = await req.user;

    updates.forEach((update) => (user[update] = req.body[update]));
    await user.save();
    if (!user) return res.status(404).send();
    res.json({
      message: "Success",
      data: user,
    });
  } catch (error) {
    res.status(404).send(error);
  }
});

router.patch("/api/user/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowUpdates = ["username", "password"];
  const isValidOperation = updates.every((updates) =>
    allowUpdates.includes(updates)
  );
  if (!isValidOperation)
    return res.status(400).send({ error: "Invalid Update " });
  try {
    const user = await User.findById(req.params.id);

    updates.forEach((update) => (user[update] = req.body[update]));
    await user.save();
    if (!user) return res.status(404).send();
    res.send(user);
  } catch (error) {
    res.status(404).send(error);
  }
});

// Deleting of your profile
router.delete("/api/user/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.json({
      data: req.user,
      message: "Your Profile deleted Successfully",
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

/* Delete User fom DB */
router.delete("/api/user/:id", auth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).send({ error: "User not Found" });
    res.send(user, "User deleted Successfully");
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
