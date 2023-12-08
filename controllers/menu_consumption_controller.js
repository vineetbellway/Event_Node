const MenuConsumption = require("../models/menu_consumption.model");
const Menu = require("../models/menu.model");
const BookingMenu = require("../models/booking_menu.model");

exports.add_guest_consumption_of_menu_item = async (req, res, next) => {

  var menu_id = req.body.menu_id;
  var guest_id = req.body.guest_id;
  var quantity = req.body.quantity;
  var booking_id = req.body.booking_id;
  

  if (!menu_id || !quantity || !price || !guest_id) {
    res.status(400).send({ status: false, message: " menu id,quantity , price , guest id missing", data: null });
  } else {
    try {
      var menuRecord = await Menu.findById(menu_id);  
      var total_price = quantity *  menuRecord.selling_price;

      var data = {
        'menu_id': menu_id,
        'quantity': quantity,
        'total_price': total_price,
        'guest_id': guest_id,
      };    
      const result = await MenuConsumption(data).save();
      if (result) {
        
        await BookingMenu.findByIdAndUpdate(booked_menu_id, { 'booking_id': booking_id,total_stock: menuRecord.quantity - quantity });



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
