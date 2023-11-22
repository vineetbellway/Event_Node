const UOM = require("../models/uom.model");
const mongoose = require("mongoose");

const create_uom = async (req, res) => {
  try {
    // Check if a UOM with the same name already exists
    const existingUOM = await UOM.findOne({ name: req.body.name });

    if (existingUOM) {
      // UOM with the same name already exists
      return res.status(409).send({
        status: false,
        message: "UOM already exists",
      });
    }

    // Create and save the new UOM
    const newUOM = new UOM(req.body);
    const savedUOM = await newUOM.save();

    // Send a success response
    res.status(201).send({
      status: true,
      message: "UOM added successfully",
      data: savedUOM,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
    });
  }
};

const get_all_uoms = async (req, res) => {
  const seller_id = req.query.seller_id;
  try {
    await UOM.aggregate([
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
    console.error("Error:", error);
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
    });
  }
};

const get_uom = async (req, res) => {
  const uom_id = req.query.uom_id;

  if (!uom_id) {
    res.status(400).send({ status: false, message: "UOM ID missing" });
  } else {
    try {
      const result = await UOM.findById(uom_id);

      if (result) {
        res.status(200).send({
          status: true,
          message: "Data found",
          data: result,
        });
      } else {
        res.status(404).send({ status: false, message: "UOM not found" });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send({
        status: false,
        message: error.toString() || "Internal Server Error",
      });
    }
  }
};

const update_uom = async (req, res) => {
  const uom_id = req.body.uom_id;

  try {
    const updatedUOMData = req.body;

    // Check if a UOM with the updated name already exists
    const existingUOM = await UOM.findOne({
      _id: { $ne: uom_id }, // Exclude the current UOM being updated
      name: updatedUOMData.name,
    });

    if (existingUOM) {
      // UOM with the updated name already exists
      return res.status(409).send({
        status: false,
        message: "UOM already exists",
      });
    }

    // Update the UOM
    const updatedUOM = await UOM.findByIdAndUpdate(
      { _id: uom_id },
      updatedUOMData,
      { new: true }
    );

    if (updatedUOM) {
      res.status(200).send({
        status: true,
        message: "UOM updated successfully",
        data: updatedUOM,
      });
    } else {
      res.status(404).send({ status: false, message: "UOM not found" });
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

const delete_uom = async (req, res) => {
  const uom_id = req.query.uom_id;

  if (!uom_id) {
    return res.status(400).send({ status: false, message: "UOM ID missing" });
  }

  try {
    const result = await UOM.findByIdAndDelete(uom_id);

    if (result) {
      return res.status(204).send(); // 204 No Content for successful DELETE
    } else {
      return res.status(404).send({ status: false, message: "UOM not found" });
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
  create_uom,
  get_all_uoms,
  get_uom,
  update_uom,
  delete_uom,
};
