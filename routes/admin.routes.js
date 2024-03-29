const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { admin_auth } = require("../middleware/admin_auth");
const multer = require('multer');
const path = require('path');
// Set up storage for multer
const storage = multer.diskStorage({
   destination: function (req, file, cb) {
     cb(null, 'uploads/logo');
   },
   filename: function (req, file, cb) {
     console.log("file",file)
     var fileMime = file.mimetype.split("/");
     var ext = fileMime[1];
     cb(null, Date.now() +"."+ext);
   },
 });
 var upload = multer({
   storage: storage
 });



const authController = require("../controllers/admin/auth_controller");
const sellerController = require("../controllers/admin/seller_controller");
const guestController = require("../controllers/admin/guest_controller");
const validatorController = require("../controllers/admin/validator_controller");
const businessSettingController = require("../controllers/admin/business_setting_controller");
const dashboardController = require("../controllers/admin/dashboard_controller");
const subscriptionPlanController = require("../controllers/admin/subscription_plan_controller");
const eventController = require("../controllers/admin/event_controller");

// auth routes

router.post("/login",authController.login);
router.put("/change-password",admin_auth,authController.changePassword);
router.get("/get-profile",admin_auth,authController.getProfile);
router.put("/update-profile",admin_auth,authController.updateProfile);
router.post("/logout",admin_auth,authController.logout);


// dashboard routes

router.get("/get-counts",admin_auth,dashboardController.getCounts);



// seller routes

router.get("/seller", admin_auth, sellerController.get_sellers); 
router.get("/seller/:id",admin_auth, sellerController.get_seller);
router.put("/seller/:id",admin_auth, sellerController.update_seller);
router.delete("/seller/:id", admin_auth, sellerController.delete_seller);

// guest routes

router.get("/guest", admin_auth, guestController.get_guests);
router.get("/guest/:id", admin_auth, guestController.get_guest);
router.put("/guest/:id", admin_auth, guestController.update_guest);
router.delete("/guest/:id", admin_auth, guestController.delete_guest);


// validator routes

router.get("/validator",admin_auth, validatorController.get_validators);
router.get("/validator/:id", admin_auth,validatorController.get_validator);
router.put("/validator/:id", admin_auth,validatorController.update_validator);
router.delete("/validator/:id", admin_auth, validatorController.delete_validator);

// business setting routes

router.post("/manage-business-settings",admin_auth,upload.single('logo'),businessSettingController.manageSetting);
router.get("/get-business-settings",admin_auth,businessSettingController.getAllSettings);

// subscription plan routes

router.post("/subscription-plan",admin_auth,subscriptionPlanController.create_subscription_plan);
router.get("/subscription-plan",admin_auth,subscriptionPlanController.get_subscription_plans);
router.get("/subscription-plan/:id",admin_auth,subscriptionPlanController.get_subscription_plan);
router.put("/subscription-plan/:id",admin_auth,subscriptionPlanController.update_subscription_plan);
router.delete("/subscription-plan/:id",admin_auth,subscriptionPlanController.delete_subscription_plan);

// event routes
router.get("/event",admin_auth,eventController.get_events);
router.delete("/event/:id",admin_auth,  eventController.delete_event);


module.exports = router;