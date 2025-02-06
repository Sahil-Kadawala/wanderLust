const mongoose = require("mongoose");
const Review = require("./review.js");
const Schema = mongoose.Schema;
const { cloudinary } = require("../cloudConfig.js");

const listSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
  },
  image: {
    url: String,
    filename: String,
  },
  price: {
    type: Number,
    required: true,
  },

  location: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },

  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  geometry: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
});

//Mongoose Middleware - To handle deletion of listing and propogating deletion to Review
listSchema.post("findOneAndDelete", async (listing) => {
  if (listing.reviews.length) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
    // no need to call next() as this is called after, it is handle asynchronously, however u need to next() in pre Middleware
  }
  if (listing.image && listing.image.filename) {
    await cloudinary.uploader.destroy(listing.image.filename);
  }
});

const Listing = mongoose.model("Listing", listSchema);

module.exports = Listing;
