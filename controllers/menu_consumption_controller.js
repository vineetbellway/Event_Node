const MenuConsumption = require("../models/menu_consumption.model");
const Menu = require("../models/menu.model");

exports.add_guest_consumption_of_menu_item = async (req, res, next) => {

  var menu_id = req.body.menu_id;
  var guest_id = req.body.guest_id;
  var quantity = req.body.quantity;
  var price = req.body.selling_price;
  var total_price = quantity * price;

  if (!menu_id || !quantity || !price || !guest_id) {
    res.status(400).send({ status: false, message: " menu id,quantity , price , guest id missing", data: null });
  } else {
    try {
      var data = {
        'menu_id': menu_id,
        'quantity': quantity,
        'total_price': total_price,
        'guest_id': guest_id,
      };    
      const result = await MenuConsumption(data).save();
      if (result) {
        var menuRecord = await Menu.findById(menu_id);  
        await Menu.findByIdAndUpdate(menu_id, { 'total_stock': menuRecord.total_stock - quantity });

        res.status(201).send({ status: true, message: "Item consumed successfully", data: result });
      } else {
        res.status(500).send({ status: false, message: "Failed ! Please try again", data: null });
      }
    } catch (error) {
      console.log("error", error);
      res.status(500).send({ status: false, message: error.toString() ?? "Internal Server Error", data: null });
    }
  }
};
