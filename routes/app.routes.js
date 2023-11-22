const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { checkSellerMemberShipPlanStatus } = require("../middleware/checkMemberShipPlanStatus");
const cron = require("node-cron");


const userController = require("../controllers/user_controller");
const eventController = require("../controllers/event_controller");
const guestController = require("../controllers/guest_controller");
const menuController = require("../controllers/menu_controller");
const sellerController = require("../controllers/seller_controller");
const validatorController = require("../controllers/validator_controller");
const validatorEventController = require("../controllers/validator_event_controller");
const transactionController = require("../controllers/transaction_controller");
const orderItemController = require("../controllers/order_item_controller");
const invitationController = require("../controllers/invitation_controller");
const relativeController = require("../controllers/relative_controller");
const subscriptionPlanController = require("../controllers/subscription_plan_controller");
const membershipController = require("../controllers/membership_controller");
const orderController = require("../controllers/order_controller");
const loyalityController = require("../controllers/loyalty_controller");
const facilityController = require("../controllers/facility_controller");
const bookingController = require("../controllers/booking_controller");
const feedbackController = require("../controllers/feedback_controller");
const notificationController = require("../controllers/notification_controller");
const upiController = require("../controllers/upi_controller");
const categoryController = require("../controllers/category_controller");
const uomController = require("../controllers/uom_controller");

router.post("/user",auth, userController.login);
router.put("/user/:id", auth, userController.update_user);
router.get("/user", auth, userController.get_users);
router.get("/user/:id", auth, userController.get_user);
router.delete("/user/:id", auth, userController.delete_user);
router.delete("/user", auth, userController.delete_users);

router.post("/guest", auth, guestController.create_guest);
router.put("/guest/:id", auth, guestController.update_guest);
router.get("/guest", auth, guestController.get_guests);
router.get("/guest/:id", auth, guestController.get_guest);
router.get("/guest_by_user_id/:id", auth, guestController.get_guest_by_user_id);
router.delete("/guest/:id", auth, guestController.delete_guest);
router.delete("/guest", auth, guestController.delete_guests);

router.post("/seller", auth, sellerController.create_seller);
router.put("/seller/:id", auth, sellerController.update_seller);

router.get("/seller", auth, sellerController.get_sellers);
router.get("/seller/:id", auth, sellerController.get_seller);
router.get("/seller_by_user_id/:id",auth,sellerController.get_seller_by_user_id);
router.delete("/seller/:id", auth, sellerController.delete_seller);
router.delete("/seller", auth, sellerController.delete_sellers);

router.post("/validator", validatorController.create_validator);
router.put("/validator/:id", validatorController.update_validator);
router.get("/validator", validatorController.get_validators);
router.get("/validator/:id", validatorController.get_validator);
router.get("/validator_by_user_id/:id",auth,validatorController.get_validator_by_user_id);
router.delete("/validator/:id", auth, validatorController.delete_validator);
router.delete("/validator", auth, validatorController.delete_validators);

router.post("/event", eventController.create_event);
router.put("/event/:id", auth, eventController.update_event);
router.get("/event", auth, eventController.get_events);
router.get("/search_event/:keyword", auth, eventController.search_events);
router.get("/event_by_seller_id/:id", auth, eventController.event_by_seller_id);
router.get("/event/:id", auth, eventController.get_event);
router.delete("/event/:id", auth, eventController.delete_event);
router.delete("/event", auth, eventController.delete_events);

router.post("/menu", auth, menuController.create_menu);
router.put("/menu/:id", auth, menuController.update_menu);
router.get("/menu", auth, menuController.get_menus);
router.get("/menu_by_event_id/:id", auth, menuController.get_menu_by_event_id);
router.get("/menu/:id", auth, menuController.get_menu);
router.delete("/menu/:id", auth, menuController.delete_menu);
router.delete("/menu", auth, menuController.delete_menus);

router.post("/validator-event",validatorEventController.create_validator_event);
router.put("/validator-event/:id",validatorEventController.update_validator_event);
router.get("/validator-event",validatorEventController.get_validator_events);
router.get("/validator-event/:id",validatorEventController.get_validator_event);
router.delete("/validator-event/:id",validatorEventController.delete_validator_event);
router.delete("/validator-event",validatorEventController.delete_validator_events);

router.post("/order-item", orderItemController.create_order_item);
router.put("/order-item/:id", orderItemController.update_order_item);
router.get("/order-item", orderItemController.get_order_items);
router.get("/order-item/:id", orderItemController.get_order_item);
router.delete("/order-item/:id", orderItemController.delete_order_item);
router.delete("/order-item", orderItemController.delete_order_items);

router.post("/transaction", transactionController.create_transaction);
router.put("/transaction/:id", transactionController.update_transaction);
router.get("/transaction", transactionController.get_transactions);
router.get("/transaction/:id", transactionController.get_transaction);
router.delete("/transaction/:id",transactionController.delete_transaction);
router.delete("/transaction", auth, transactionController.delete_transactions);

router.post("/invitation", auth, invitationController.create_invitation);
router.put("/invitation/:id", auth, invitationController.update_invitation);
router.get("/invitation", checkSellerMemberShipPlanStatus, invitationController.get_invitations);
router.get("/invitation/:id", checkSellerMemberShipPlanStatus, invitationController.get_invitation);
router.delete("/invitation/:id", checkSellerMemberShipPlanStatus, invitationController.delete_invitation);
router.delete("/invitation", checkSellerMemberShipPlanStatus, invitationController.delete_invitations);

router.post("/relative", relativeController.create_relative);
router.post("/many_relative", relativeController.create_many_relative);
router.put("/relative/:id", relativeController.update_relative);
router.get("/relative", relativeController.get_relatives);
router.get("/relative/:id",relativeController.get_relative);
router.delete("/relative/:id", relativeController.delete_relative);
router.delete("/relative",  relativeController.delete_relatives);

router.post("/subscription_plan",subscriptionPlanController.create_subscription_plan);
router.put("/subscription_plan/:id",subscriptionPlanController.update_subscription_plan);
router.get("/subscription_plan",checkSellerMemberShipPlanStatus,subscriptionPlanController.get_subscription_plans);
router.get("/search_subscription_plan/:keyword",subscriptionPlanController.search_subscription_plans);
router.get("/subscription_plan/:id",subscriptionPlanController.get_subscription_plan);
router.delete("/subscription_plan/:id",subscriptionPlanController.delete_subscription_plan);
router.delete("/subscription_plan",subscriptionPlanController.delete_subscription_plans);
router.post("/membership",membershipController.create_membership);
router.put("/membership/:id",membershipController.update_membership);
router.put("/update-membership-plan-status/:id", membershipController.update_membership_plan_status);

router.get("/membership", auth, membershipController.get_memberships);
router.get("/membership/:keyword",auth,membershipController.search_memberships);
router.get("/membership/:id", auth, membershipController.get_membership);
router.delete("/membership/:id", auth, membershipController.delete_membership);
router.delete("/membership", auth, membershipController.delete_memberships);

router.post("/create-order", orderController.create_order);
router.post("/consume-loyalty-point", loyalityController.consume_loyalty_point);


router.post("/add-facility", facilityController.add_facility);
router.put("/update-facility", facilityController.update_facility);
router.get("/facilities", facilityController.get_facilities);

// manage validator event status
router.put("/manage-validator-event-status/:id", validatorEventController.manage_validator_event_status);

// create loyalty order item
router.post("/create-loyalty-order-item", loyalityController.create_loyalty_order_items);

router.get("/get-guest-consumptions", loyalityController.get_guest_consumptions);
router.post("/approve-guest-consumption/:id", loyalityController.approve_guest_consumption);


// book event/loyalty

router.post("/book", bookingController.book);

// get cash event list 

router.get("/get-cash-bookings", bookingController.get_cash_bookings);


// get booking detail
router.get("/get-booking-detail", bookingController.get_booking_detail);


// get bookings
router.get("/get-bookings", bookingController.get_bookings);

// manage bookings
router.post("/manage-bookings", bookingController.manage_bookings);

// give feedback
router.post("/give-feedback", feedbackController.give_feedback);


// get notifications api

router.get("/get-notifications", notificationController.get_notifications);

// get unread notifications count api

router.get("/get-unread-notifications-count", notificationController.get_unread_notifications_count);

// create seller upi id api

router.post("/create-seller-upi-id", upiController.create_seller_upi_id);

// get seller upi id api

router.get("/get-seller-upi-id", upiController.get_seller_upi_id);

// update seller upi id api

router.put("/update-seller-upi-id", upiController.update_seller_upi_id);

// create category api
router.post("/create-category", categoryController.create_category);

// get  all categories api
router.get("/get-all-categories", categoryController.get_all_categories);

// get category api
router.get("/get-category", categoryController.get_category);

// update category api
router.put("/update-category", categoryController.update_category);

// delete category api
router.delete("/delete-category", categoryController.delete_category);

// Create UOM API
router.post("/create-uom", uomController.create_uom);

// Get all UOMs API
router.get("/get-all-uoms", uomController.get_all_uoms);

// Get UOM API
router.get("/get-uom", uomController.get_uom);

// Update UOM API
router.put("/update-uom", uomController.update_uom);

// Delete UOM API
router.delete("/delete-uom", uomController.delete_uom);


console.log("Before cron.schedule");
cron.schedule("* * * * *", function () {
    console.log("Cron job is running");
 // disableSellerServices();
   //sendEventNotification();
  // bookingController.sendExpiredEventNotification();
});

console.log("After cron.schedule");

module.exports = router;
