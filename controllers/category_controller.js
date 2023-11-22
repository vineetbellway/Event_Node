const Category = require("../models/category.model"); 
const mongoose = require("mongoose");

const create_category = async (req, res) => {
    try {
      // Check if a category with the same name already exists
      const existingCategory = await Category.findOne({ name: req.body.name ,  seller_id: req.body.seller_id });

      if (existingCategory) {
        // Category with the same name already exists
        return res.status(409).send({
          status: false,
          message: "Category already exists",
        });
      }
  
      // Create and save the new category
      const newCategory = new Category(req.body);
      const savedCategory = await newCategory.save();
  
      // Send a success response
      res.status(201).send({
        status: true,
        message: "Category added successfully",
        data: savedCategory,
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send({
        status: false,
        message: error.toString() || "Internal Server Error",
      });
    }
  };
  

const get_all_categories = async (req, res) => {
  const seller_id = req.query.seller_id;
        try {
            await Category.aggregate([
              {
                $match: {
                  seller_id: new mongoose.Types.ObjectId(seller_id),
                },
              },
              {
                $sort: { createdAt: -1 }, // Sort by createdAt in descending order
              },
            ])
              .then((result) => {
                if (result) {
                  res.status(200).send({
                    status: true,
                    message: "Data found",
                    data: result,
                  });
                }
              })
              .catch((error) => {
                res.send({
                  status: false,
                  message: error.toString() ?? "Error",
                });
              });
          } catch (error) {
            console.log("error",error)
            res.status(500).send({
              status: false,
              message: error.toString() ?? "Internal Server Error",
            });
          }
    
};

const get_category = async (req, res) => {
    const category_id = req.query.category_id;
    if (!category_id) {
        res.status(400).send({ status: false, message: "category id missing" });
    } else {
        try {
            await Category.findById(category_id).exec()
              .then((result) => {
                if (result) {
                  res.status(200).send({
                    status: true,
                    message: "Data found",
                    data: result,
                  });
                }
              })
              .catch((error) => {
                res.send({
                  status: false,
                  message: error.toString() ?? "Error",
                });
              });
          } catch (error) {
            console.log("error",error)
            res.status(500).send({
              status: false,
              message: error.toString() ?? "Internal Server Error",
            });
          }
    }
};



const update_category = async (req, res) => {
    const category_id = req.body.category_id;
  
    try {
      const updatedCategoryData = req.body;
  
      // Check if a category with the updated name already exists
      const existingCategory = await Category.findOne({
        _id: { $ne: category_id }, // Exclude the current category being updated
        name: updatedCategoryData.name,
        seller_id: req.body.seller_id
      });
  
      if (existingCategory) {
        // Category with the updated name already exists
        return res.status(409).send({
          status: false,
          message: "Category already exists",
        });
      }
  
      // Update the category
      const updatedCategory = await Category.findByIdAndUpdate(
        { _id: category_id },
        updatedCategoryData,
        { new: true }
      );
  
      if (updatedCategory) {
        res.status(200).send({
          status: true,
          message: "Category updated successfully",
          data: updatedCategory,
        });
      } else {
        res.status(404).send({ status: false, message: "Category not found" });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send({
        status: false,
        message: "Internal Server Error",
        error: error.toString(),
      });
    }
  };
  

  const delete_category = async (req, res) => {
    const category_id = req.query.category_id;
   // console.log("category_id",category_id)
    if (!category_id) {
      return res.status(400).send({ status: false, message: "Category ID missing" });
    }
  
    try {
      const result = await Category.findByIdAndDelete(category_id);
  
      if (result) {
        return res.status(200).send({ status: false, message: "Category deleted" }); 
      } else {
        return res.status(404).send({ status: false, message: "Category not found" });
      }
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).send({
        status: false,
        message: "Internal Server Error",
        error: error.toString(),
      });
    }
  };

module.exports = {
    create_category,
    get_all_categories,
    get_category,
    update_category,
    delete_category
};
