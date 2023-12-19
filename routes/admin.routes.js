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
const sellerController = require("../controllers/admin/seller_controller");
const guestController = require("../controllers/admin/guest_controller");
const validatorController = require("../controllers/admin/validator_controller");

// auth routes

router.post("/login",authController.login);

// seller routes

router.get("/seller", auth, sellerController.get_sellers);
router.get("/seller/:id",auth, sellerController.get_seller);
router.put("/seller/:id",auth, sellerController.update_seller);
router.delete("/seller/:id", auth, sellerController.delete_seller);

// guest routes

router.get("/guest", auth, guestController.get_guests);
router.get("/guest/:id", auth, guestController.get_guest);
router.put("/guest/:id", auth, guestController.update_guest);
router.delete("/guest/:id", auth, guestController.delete_guest);


// validator routes


router.get("/validator", validatorController.get_validators);
router.get("/validator/:id", auth,validatorController.get_validator);
router.put("/validator/:id", auth,validatorController.update_validator);
router.delete("/validator/:id", auth, validatorController.delete_validator);



module.exports = router;