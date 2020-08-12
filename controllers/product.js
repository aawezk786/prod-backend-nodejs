const Product = require("../models/product");
const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");
const product = require("../models/product");
const { sortBy } = require("lodash");

exports.getProductById = (req, res, next, id) => {
  Product.findById(id)
    .populate("category")
    .exec((err, product) => {
      if (err) {
        return res.status(400).json({
          error: "Product not found",
        });
      }
      req.product = product;
      next();
    });
};

exports.createProduct = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, (err, fields, file) => {
    if (err) {
      return res.status(400).json({
        error: "Problem with image",
      });
    }

    //Destructure the field
    const { name, description, price, category, stock } = fields;
    if (!name || !description || !price || !category || !stock) {
      return res.status(400).json({
        error: "Please include all fields",
      });
    }

    let product = new Product(fields);

    //Handle file here
    if (file.photo) {
      if (file.photo.size > 3000000) {
        return res.status(400).json({
          error: "File size too big!",
        });
      }
      product.photo.data = fs.readFileSync(file.photo.path);
      product.photo.contentType = file.photo.type;
    }

    //Save to the DB
    product.save((err, product) => {
      if (err) {
        res.status(400).json({
          error: "Saving tshirt in DB failed",
        });
      }
      res.json(product);
    });
  });
};

exports.getProduct = (req, res) => {
  req.product.photo = undefined;
  return res.json(req.product);
};

//Middleware
exports.photo = (req, res, next) => {
  if (req.product.photo.data) {
    res.set("Content-Type", req.product.photo.contentType);
    return res.send(req.product.photo.contentType);
  }
  next();
};

exports.deleteProduct = (req, res) => {
  let product = req.product;
  product.remove((err, deletedproduct) => {
    if (err) {
      res.status(400).json({
        error: "Failed to delete Product",
      });
    }
    res.json({
      message: "Successfully Deleted",
      deletedproduct,
    });
  });
};

exports.updateProduct = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, (err, fields, file) => {
    if (err) {
      return res.status(400).json({
        error: "Problem with image",
      });
    }

    // Updation Code
    let product = req.product;
    product = _.extend(product, fields);

    //Handle file here
    if (file.photo) {
      if (file.photo.size > 3000000) {
        return res.status(400).json({
          error: "File size too big!",
        });
      }
      product.photo.data = fs.readFileSync(file.photo.path);
      product.photo.contentType = file.photo.type;
    }

    //Save to the DB
    product.save((err, product) => {
      if (err) {
        res.status(400).json({
          error: "Updation of product failed",
        });
      }
      res.json(product);
    });
  });
};

//Get all the Products
exports.getAllProducts = (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 8;
  let sortBy = req.query.sortBy ? req.query.sortBy : "_id";

  Product.find()
    .select("-photo")
    .sort([[sortBy, "asc"]])
    .limit(limit)
    .exec((err, products) => {
      if (err) {
        res.status(400).json({
          error: "Failed to get all the products",
        });
      }
      res.json(products);
    });
};

// Fetch all the unique categories
exports.getAllUniqueCategories = (req, res) => {
  Product.distinct("category", {}, (err, category) => {
    if (err) {
      res.status(400).json({
        error: "No Category is found.",
      });
    }
    res.json(category);
  });
};

//Maintain Inventory
exports.updateStock = (req, res, next) => {
  let myOperations = req.body.order.products.map((prod) => {
    return {
      updateOne: {
        filter: { _id: prod._id },
        update: { $inc: { stock: -prod.count, sold: +prod.count } },
      },
    };
  });
  Product.bulkWrite(myOperations, {}, (err, products) => {
    if (err) {
      res.status(400).json({
        error: "Bulk Operation Failed",
      });
    }
    next();
  });
};
