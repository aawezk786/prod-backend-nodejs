const Category = require("../models/category");

// etch Category by ID
exports.getCategoryById = (req, res, next, id) => {
  Category.findById(id).exec((err, cate) => {
    if (err) {
      res.status(400).json({
        error: "Category not found in DB",
      });
    }
    req.category = cate;
    next();
  });
};

//Create a Category
exports.createCategory = (req, res) => {
  const category = new Category(req.body);
  category.save((err, category) => {
    if (err) {
      res.status(400).json({
        error: "Not able to save Category in DB",
      });
    }
    res.json({ category });
  });
};

//Fetch a Category
exports.getCategory = (req, res) => {
  return res.json(req.category);
};

//Fetch all the Cateogry
exports.getAllCategory = (req, res) => {
  Category.find().exec((err, categories) => {
    if (err) {
      res.status(400).json({
        error: "No Category is found",
      });
    }
    return res.json(categories);
  });
};

//Update a category
exports.updateCategory = (req, res) => {
  const category = req.category;
  category.name = req.body.name;

  category.save((err, updatedCategory) => {
    if (err) {
      res.status(400).json({
        error: "Failed to update Category",
      });
    }
    res.json(updatedCategory);
  });
};

//Delete a category
exports.removeCategory = (req, res) => {
  const category = req.category;
  category.remove((err, category) => {
    if (err) {
      res.status(400).json({
        error: "Failed to delete Category",
      });
    }
    res.json({
      message: "Successfully deleted",
      category,
    });
  });
};
