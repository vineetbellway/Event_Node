async function getMenu(menu_id){
    try {
        await Menu.aggregate([
          {
            $match: {
              _id: new mongoose.Types.ObjectId(menu_id),
            },
          },
        ])
          .then((result) => {
            if (result) {
              res.status(200).send({
                status: true,
                message: "success",
                data: result[0],
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
        res.status(500).send({
          status: false,
          message: error.toString() ?? "Internal Server Error",
        });
      }
}

async function updateMenu(menu_id,total_stock){
    try {
    Menu.findByIdAndUpdate(menu_id,{total_stock:total_stock}, { new: true })
    .then((result) => {
      if (result) {
        res.status(201).send({
          status: true,
          message: "Updated",
          data: result,
        });
      } else {
        res.status(404).send({ status: false, message: "Not updated" });
      }
    })
    .catch((error) => {
      res.send({
        status: false,
        message: error.toString() ?? "Error",
      });
    });
} catch (error) {
  res.status(500).send({
    status: false,
    message: "failure",
    error: error ?? "Internal Server Error",
  });
}
}

module.exports = {getMenu,up};