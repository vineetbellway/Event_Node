const express = require("express");
const router = express.Router();
const Product = require("../models/product/product.model");

//multer
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images/product_images");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "-") +
        "." +
        req.params.id +
        "." +
        file.mimetype.split("/")[1]
    );
  },
});
var upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg" ||
      file.mimetype == "image/pjpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg and .jpeg .pjpeg format allowed!"));
    }
  },
});

//imports
const userController = require("../controllers/user_controller/user_controller");
const adminController = require("../controllers/admin_controller/crud");
const employeeController = require("../controllers/employee_controller/crud");
const customerController = require("../controllers/customer_controller/crud");
const taskController = require("../controllers/task_controller/crud");
const productController = require("../controllers/product_controller/crud");
const orderController = require("../controllers/order_controller/crud");
const searchController = require("../controllers/search_controller/search");
const paymentController = require("../controllers/employee_controller/payment_controller");
const totalReportController = require("../controllers/report_controller/total_report");

//+++++++++++++++++++++++++++++++++++++++++           (AUTHENTICATION AND AUTHORIZATION ROUTES)           +++++++++++++++++++++++++++++++++++++++++++++++

router.post("/admin_login", userController.admin_login);
router.post("/admin", adminController.create_admin);
router.post("/employee_login", userController.employee_login);
// router.post("/customer_login", userController.customer_login);

//+++++++++++++++++++++++++++++++++++++++++           (PRODUCT ROUTES)           +++++++++++++++++++++++++++++++++++++++++++++++

// router.post("/product", productController.create_product);
router.get("/product", productController.get_product);
router.get("/product", productController.get_product_by_id);
router.post("/product", upload.array("images", 4), async (req, res) => {
  if (!req.body) {
    res
      .status(400)
      .send({ status: false, message: "failure", error: "body missing" });
  } else {
    try {
      var product = await Product(req.body).save();
      var check = req.files.length;
      console.log(check);
      if (req.files.length == 0) {
        console.log("then");
        res.status(201).send({
          status: true,
          message: "product created without adding product images",
          product,
        });
      } else {
        console.log(req.files);

        console.log(product._id.toString());
        console.log("else then");
        var stringArray = [];
        for (var i = 0; i < req.files.length; i++) {
          stringArray.push(req.files[i].originalname);
        }
        console.log(stringArray);
        await Product.findByIdAndUpdate(
          { _id: product._id.toString() },
          {
            $set: {
              name: req.body.name,
              tasks: req.body.tasks,
              product_image: stringArray,
            },
          }
        )
          .then((link) => {
            // console.log(req.files);
            if (link) {
              console.log(link);
              res.status(200).send({
                status: true,
                message: `product created successfully with ${stringArray} images`,
              });
              //"location: public/product_images/" + stringArray,
            } else {
              res
                .status(404)
                .send({ status: false, message: "images could not be added!" });
            }
          })
          .catch((error) => {
            console.log(req.file);
            res.send({
              status: false,
              message: error.message ?? "images could not be added!",
            });
          });
      }
    } catch (error) {
      res.status(500).send({
        status: false,
        message: "failure",
        error: error.toString() ?? "Internal Server Error",
      });
    }
  }
});

router.delete("/delete_image/:id", productController.delete_product_image);
router.put("/product/:id", productController.update_product);
router.delete("/product/:id", productController.delete_product);
router.get("/product_pdf", productController.create_pdf);
// router.get("/product_size/:id", productController.order_by_size);

//+++++++++++++++++++++++++++++++++++++++++           (ORDER ROUTES)           +++++++++++++++++++++++++++++++++++++++++++++++

router.post("/order", orderController.create_order);
router.get("/order", orderController.get_order);
router.get("/order/:id", orderController.get_order_by_id);
router.get(
  "/products_under_order/:product_id",
  orderController.products_used_in_order
);
router.put("/order/:id", orderController.update_order);
router.delete("/order/:id", orderController.delete_order);
router.get("/order_by_order_status", orderController.get_order_by_order_status);
router.get(
  "/order_by_payment_status",
  orderController.get_order_by_payment_status
);
router.get("/date_wise_profit", orderController.date_wise_profit);
router.get(
  "/get_orders_by_employee_id/:id",
  orderController.get_orders_by_employee_id
);
router.get("/order_pdf", orderController.create_pdf);
//+++++++++++++++++++++++++++++++++++++++++           (EMPLOYEES ROUTES)           +++++++++++++++++++++++++++++++++++++++++++++++

router.post("/employee", employeeController.create_employee);
router.get("/employee", employeeController.get_employee);
router.get("/employee/:id", employeeController.get_employee_by_id);
router.put("/employee/:id", employeeController.update_employee);
router.delete("/employee/:id", employeeController.delete_employee);
router.get("/employee_pdf", employeeController.create_pdf);

//+++++++++++++++++++++++++++++++++++++++++           (CUSTOMER ROUTES)           +++++++++++++++++++++++++++++++++++++++++++++++

router.post("/customer", customerController.create_customer);
router.get("/customer", customerController.get_customer);
router.get("/customer/:id", customerController.get_customer_by_id);
router.put("/customer/:id", customerController.update_customer);
router.delete("/customer/:id", customerController.delete_customer);
router.get("/customer_pdf", customerController.create_pdf);

//+++++++++++++++++++++++++++++++++++++++++           (TASK ROUTES)           +++++++++++++++++++++++++++++++++++++++++++++++

router.post("/task", taskController.create_task);
router.get("/task", taskController.get_task);
router.get("/task/:id", taskController.get_task_by_id);
router.get("/task_by_task_status", taskController.get_task_by_task_status);
router.get(
  "/task_by_payment_status",
  taskController.get_task_by_payment_status
);
router.get("/task_by_emp_id/:id", taskController.get_task_by_employee_id);
router.get("/task_by_order_id/:order_id", taskController.get_task_by_order_id);
router.put("/task/:id", taskController.update_task);
router.delete("/task/:id", taskController.delete_task);
// router.get(
//   "/get_orders_by_employee_id/:id",
//   taskController.get_orders_by_employee_id
// );

//+++++++++++++++++++++++++++++++++++++++++           (TASK SIZE ROUTES)           +++++++++++++++++++++++++++++++++++++++++++++++

router.post("/task_size", taskController.create_task_size);
router.get("/task_size", taskController.get_task_size);
router.get("/task_size/:id", taskController.get_task_size_by_id);
router.get(
  "/task_size_by_task_id/:task_id",
  taskController.get_task_size_by_task_id
);
router.put("/task_size/:id", taskController.update_task_size);
router.delete("/task_size/:id", taskController.delete_task_size);

//+++++++++++++++++++++++++++++++++++++++++           (ORDER SIZE ROUTES)           +++++++++++++++++++++++++++++++++++++++++++++++

router.post("/order_size", orderController.create_order_size);
router.get("/order_size", orderController.get_order_size);
router.get("/order_size/:id", orderController.get_order_size_by_id);
router.put("/order_size/:id", orderController.update_order_size);
router.delete("/order_size/:id", orderController.delete_order_size);

//+++++++++++++++++++++++++++++++++++++++++           (SEARCH ROUTES)           +++++++++++++++++++++++++++++++++++++++++++++++
router.get("/search_customer", searchController.search_customer);
router.get("/search_product", searchController.search_product);
router.get("/search_employee", searchController.search_employee);

//having issues
// router.get(
//   "/search_order_by_product_id/:product_id",
//   searchController.search_order_by_product_id
// );
//search_order_by_product_id (searching in order )

//+++++++++++++++++++++++++++++++++++++++++           (STATISTICS ROUTES)           +++++++++++++++++++++++++++++++++++++++++++++++
router.get("/dashboard_data", totalReportController.dashboard_data);
router.get("/order_graph", totalReportController.order_graph);
// router.get("/profit_graph", totalReportController.profit_graph);
router.get("/orders_statuses", totalReportController.orders_statuses);

//+++++++++++++++++++++++++++++++++++++++++           (PAYMENT ROUTES)           +++++++++++++++++++++++++++++++++++++++++++++++
router.post("/create_payment", paymentController.create_payment);
router.get("/payment", paymentController.get_payment);
router.get("/payment/:id", paymentController.get_payment_by_id);
router.put("/payment/:id", paymentController.update_payment);
router.delete("/payment/:id", paymentController.delete_payment);
router.get("/employee_payments/:id", paymentController.employee_payments);
router.get(
  "/check_payment_history/:id",
  paymentController.check_payment_history
);
router.get(
  "/employee_overall_payments/:id",
  paymentController.employee_overall_payments
);

router.get("/payment_pdf", paymentController.create_pdf);
router.get("/pdf", function (req, res) {
  const docDefinition = { content: "hi, wasib" };

  generatePdf(
    docDefinition,
    function (binary) {
      res.contentType("application/pdf");
      res.send(binary);
    },
    function (error) {
      res.send("ERROR:" + error);
    }
  );
});
module.exports = router;
