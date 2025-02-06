const { cloudinary } = require("../cloudConfig");
const Listing = require("../models/listing");

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
  const allListings = await Listing.find();
  res.render("./listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("./listings/new.ejs");
};

module.exports.createListing = async (req, res) => {
  let response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send();

  const { path: url, filename } = req.file;
  let newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  newListing.geometry = response.body.features[0].geometry;

  let finalListing = await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const list = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  if (!list) {
    req.flash("error", "Listing you requested does not exist!!");
    res.redirect("/listings");
  }
  res.render("listings/show.ejs", { list });
};

module.exports.editListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(`${id}`);
  if (!listing) {
    req.flash("error", "Listing you requested does not exist!");
    res.redirect("/listings");
  }

  let reducedQualityImage = listing.image.url;
  reducedQualityImage = reducedQualityImage.replace("/upload", "/upload/w_300");

  res.render("./listings/edit.ejs", { listing, reducedQualityImage });
};

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (typeof req.file !== "undefined") {
    let { path: url, filename } = req.file;

    if (listing.image && listing.image.filename) {
      await cloudinary.uploader.destroy(listing.image.filename);
    }
    listing.image = { url, filename };
    await listing.save();
  }
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(`${id}`);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};

module.exports.searchListing = async (req, res) => {
  let { search } = req.query;
  let searchResult = await Listing.find({ country: search });
  if (searchResult.length != 0) {
    res.render("./listings/index.ejs", { allListings: searchResult });
  } else {
    req.flash("error", "No result found, Please check country name properly!");
    res.redirect("/listings");
  }
};
