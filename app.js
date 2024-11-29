const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema } = require("./schema.js");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "./public")));
app.use(methodOverride("_method"));

app.engine("ejs", ejsMate);

main()
  .then((res) => {
    console.log("db connected");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
  } catch (err) {
    console.log("error in main() function");
    throw err;
  }
}

const validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    return next();
  }
};

//Home route
app.get("/", (req, res) => {
  res.send("Home route");
});

// Index Route
app.get(
  "/listings",
  wrapAsync(async (req, res) => {
    const allListings = await Listing.find();
    res.render("./listings/index.ejs", { allListings });
  })
);

// New route
app.get("/listings/new", (req, res) => {
  res.render("./listings/new.ejs");
});

// Create route
app.post(
  "/listings",
  validateListing,
  wrapAsync(async (req, res) => {
    //let { title, desc, price, location, country } = req.body;
    let newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
  })
);

// Show Route
app.get(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const list = await Listing.findById(`${id}`);
    res.render("listings/show.ejs", { list });
  })
);

//Edit route
app.get(
  "/listings/:id/edit",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(`${id}`);
    res.render("./listings/edit.ejs", { listing });
  })
);

//Update route
app.put(
  "/listings/:id",
  validateListing,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndUpdate(`${id}`, { ...req.body.listing }); // if we do not use '...' still it should not cause prob as req.body.listing is a plain js obj in our case
    res.redirect(`/listings/${id}`);
  })
);

// Delete route
app.delete(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(`${id}`);
    console.log(deletedListing);
    res.redirect("/listings");
  })
);

// app.get("/testListing", async (req, res) => {
//   let sampleListing = new Listing({
//     title: "My New Villa",
//     desc: "By The Mountains",
//     price: 1110,
//     location: "Hovden, Norway",
//     country: "Europe",
//   });

//   await sampleListing
//     .save()
//     .then((res) => {
//       console.log(res);
//     })
//     .catch((err) => {
//       console.log(err);
//     });
//   res.send("succesfully added ");
// });

app.all("*", (req, res, next) => {
  return next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
  let { status, message = "something went wrong!" } = err;
  res.status(status).render("error.ejs", { message });
  // res.status(status).send(message);
});

app.listen(3000, () => console.log("server working"));
