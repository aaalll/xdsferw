const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      trim: true,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    file: {
      type: Buffer,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const UserFile = mongoose.model("File", fileSchema);

module.exports = UserFile;
