const mongoose = require("mongoose");
const Listing = require("./models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
require("dotenv").config();

const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
  console.log("Database connected");

  const listings = await Listing.find({
    "geometry.coordinates": { $exists: false },
  });

  for (let listing of listings) {
    let response = await geocodingClient
      .forwardGeocode({
        query: listing.location,
        limit: 1,
      })
      .send();

    if (response.body.features.length > 0) {
      listing.geometry = {
        type: "Point",
        coordinates: response.body.features[0].geometry.coordinates,
      };
      await listing.save();
      console.log(`Updated listing: ${listing.title}`);
    } else {
      console.log(`Could not find coordinates for listing: ${listing.title}`);
    }
  }

  mongoose.connection.close();
}

main().catch((err) => {
  console.error(err);
  mongoose.connection.close();
});
