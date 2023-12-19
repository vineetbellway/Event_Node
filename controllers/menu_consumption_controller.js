const MenuConsumption = require("../models/menu_consumption.model");
const Menu = require("../models/menu.model");
const BookingMenu = require("../models/booking_menu.model");

exports.add_guest_consumption_of_menu_item = async (req, res, next) => {
  try {
    const menuItems = req.body.menu_items;

    if (!Array.isArray(menuItems)) {
      res.status(400).send({ status: false, message: "Invalid request format. Expected an array.", data: null });
      return;
    }

    const batchSize = 5;
    const results = [];

    for (let i = 0; i < menuItems.length; i += batchSize) {
      const batch = menuItems.slice(i, i + batchSize);

      const batchResults = await Promise.all(batch.map(async (menuItem) => {
        const { menu_id, guest_id, quantity, booking_id } = menuItem;

        if (!menu_id || !quantity || !guest_id || !booking_id) {
          return { status: false, message: "menu_id, quantity, guest_id, or booking_id missing", data: null };
        }

        const menuRecord = await Menu.findById(menu_id);

        if (!menuRecord) {
          return { status: false, message: "Menu not found", data: null };
        }

        const total_price = quantity * menuRecord.selling_price;

        const data = {
          menu_id,
          quantity,
          total_price,
          guest_id,
        };

        const result = await MenuConsumption(data).save();

        if (result) {
          await BookingMenu.findOneAndUpdate(
            { menu_id, booking_id },
            { $inc: { quantity: -quantity } }
          );

          return result;
        } else {
          return null;
        }
      }));

      // Filter out null values from batchResults
      results.push(...batchResults.filter((result) => result !== null));
    }

    res.status(201).send({ status: true, message: "Item consumed successfully", data: results });
  } catch (error) {
    console.log("error", error);
    res.status(500).send({ status: false, message: error.toString() || "Internal Server Error", data: null });
  }
};





