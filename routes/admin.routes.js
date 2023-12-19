const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const multer = require('multer');
const path = require('path');
// Set up storage for multer
const storage = multer.diskStorage({
   destination: function (req, file, cb) {
     cb(null, 'uploads/events');
   },
   filename: function (req, file, cb) {
     cb(null, Date.now() + path.extname(file.originalname));
   },
 });
 var upload = multer({
   storage: storage
 });

 const banner_storage = multer.diskStorage({
   destination: function (req, file, cb) {
     cb(null, 'uploads/banners');
   },
   filename: function (req, file, cb) {
     cb(null, Date.now() + path.extname(file.originalname));
   },
 });
 var banner_upload = multer({
   storage: banner_storage
 });

const authController = require("../controllers/admin/auth_controller");
const sellerController = require("../controllers/seller_controller");


router.post("/login",authController.login);


router.post("/seller", sellerController.create_seller);
router.put("/seller/:id", auth, sellerController.update_seller);

router.get("/seller", auth, sellerController.get_sellers);
router.get("/seller/:id", auth, sellerController.get_seller);
router.get("/seller_by_user_id/:id",auth,sellerController.get_seller_by_user_id);
router.delete("/seller/:id", auth, sellerController.delete_seller);
router.delete("/seller", auth, sellerController.delete_sellers);



module.exports = router;