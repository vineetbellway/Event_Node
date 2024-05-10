const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { checkSellerMemberShipPlanStatus } = require("../middleware/checkMemberShipPlanStatus");
const cron = require("node-cron");
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
const bannerController = require("../controllers/banner_controller");
const reportController = require("../controllers/report_controller");
const menuConsumptionController = require("../controllers/menu_consumption_controller");
const serviceController = require("../controllers/service_controller");
const businessSettingController = require("../controllers/business_setting_controller");



router.post("/user", auth,userController.login);
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

router.post("/validator", auth,validatorController.create_validator);
router.put("/validator/:id", auth,validatorController.update_validator);
router.get("/validator",auth, validatorController.get_validators);
router.get("/validator/:id",auth, validatorController.get_validator);
router.get("/validator_by_user_id/:id",auth,validatorController.get_validator_by_user_id);
router.delete("/validator/:id", auth, validatorController.delete_validator);
router.delete("/validator", auth, validatorController.delete_validators);

router.post("/event",auth,checkSellerMemberShipPlanStatus, upload.single('image'), eventController.create_event);
router.post("/event/:id",auth,checkSellerMemberShipPlanStatus, upload.single('image'),eventController.update_event);
router.get("/event", auth,checkSellerMemberShipPlanStatus,eventController.get_events);
router.get("/search_event/:keyword",auth,eventController.search_events);
router.get("/event_by_seller_id/:id",auth,checkSellerMemberShipPlanStatus,  eventController.event_by_seller_id);
router.get("/event/:id",auth,  eventController.get_event);
router.delete("/event/:id",auth,checkSellerMemberShipPlanStatus,  eventController.delete_event);
router.delete("/event",auth,  eventController.delete_events);

router.post("/menu",auth,menuController.create_menu);
router.put("/menu/:id",auth, menuController.update_menu);
router.get("/menu", auth,menuController.get_menus);
router.get("/menu_by_event_id/:id/:guest_id",auth, menuController.get_menu_by_event_id);
router.get("/menu_by_event_id_for_entry_food_event/:id/:guest_id",auth, menuController.get_menu_by_event_id_for_entry_food_event);
router.get("/menu_by_event_id_before_entry_food_event/:id/:guest_id",menuController.get_menu_by_event_id_before_entry_food_event);
router.get("/menu_by_event_id_3_weeks_ago/:id/:guest_id",menuController.get_menu_by_event_id_3_weeks_ago);
router.get("/menu/:id", auth,menuController.get_menu);
router.delete("/menu/:id", auth, menuController.delete_menu);
router.delete("/menu", auth, menuController.delete_menus);



router.post("/service",auth,serviceController.create_service);
router.get("/service",auth,serviceController.get_services);
router.get("/service/:id",auth,serviceController.get_service);
router.put("/service/:id",auth, serviceController.update_service);
router.delete("/service/:id",auth,serviceController.delete_service);
router.delete("/service",auth, serviceController.delete_services);
router.get("/service-by-event-id/:id",auth,serviceController.get_service_by_event_id);

// manage service item API
router.post("/manage-service-item",auth,serviceController.manage_service_item);

// get service items API
router.get("/get-service-items",auth,serviceController.get_service_items);

// book service items API
router.post("/book-service-items", auth,serviceController.book_service_items);

// get booked service items API
router.get("/get-booked-service-items", auth,serviceController.get_booked_service_items);

// approve service payment API
router.post("/approve-service-payment",auth,serviceController.approve_service_payment);

// get guest loyality points API
router.get("/get-guest-loyality-points",auth,serviceController.get_guest_loyalty_points);



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
router.get("/subscription_plan",subscriptionPlanController.get_subscription_plans);
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
router.get("/get-seller-membership-plan/:id",membershipController.get_membership_by_seller_id);


router.post("/create-order", orderController.create_order);
router.post("/consume-loyalty-point", loyalityController.consume_loyalty_point);


router.post("/add-facility",auth, facilityController.add_facility);
router.put("/update-facility",auth,  facilityController.update_facility);
router.get("/facilities",auth,  facilityController.get_facilities);

// manage validator event status
//router.put("/manage-validator-event-status/:id", validatorEventController.manage_validator_event_status);

// create loyalty order item
router.post("/create-loyalty-order-item", loyalityController.create_loyalty_order_items);

router.get("/get-guest-consumptions", loyalityController.get_guest_consumptions);
router.post("/approve-guest-consumption/:id", loyalityController.approve_guest_consumption);


// book event

router.post("/book", auth,bookingController.book);

// get bookings by payment mode

router.get("/get-bookings-by-payment-mode",auth, bookingController.get_bookings_by_payment_mode);

// get bookings
router.get("/get-bookings" ,auth, bookingController.get_bookings);

// get booking detail
router.get("/get-booking-detail",auth,  bookingController.get_booking_detail);

// manage bookings
router.post("/manage-bookings", auth,bookingController.manage_bookings);

// give feedback
router.post("/give-feedback",auth,  feedbackController.give_feedback);

// get notifications api
router.get("/get-notifications",auth,  notificationController.get_notifications);

// get unread notifications count api
router.get("/get-unread-notifications-count", auth, notificationController.get_unread_notifications_count);

// create seller upi id api
router.post("/create-seller-upi-id",auth,  upiController.create_seller_upi_id);

// get seller upi id api
router.get("/get-seller-upi-id",auth,  upiController.get_seller_upi_id);

// update seller upi id api
router.put("/update-seller-upi-id",auth,  upiController.update_seller_upi_id);

// create category api
router.post("/create-category",auth,  categoryController.create_category);

// get  all categories api
router.get("/get-all-categories",auth,  categoryController.get_all_categories);

// get category api
router.get("/get-category",auth,  categoryController.get_category);

// update category api
router.put("/update-category",auth,  categoryController.update_category);

// delete category api
router.delete("/delete-category",auth,  categoryController.delete_category);

// Create UOM API
router.post("/create-uom",auth, checkSellerMemberShipPlanStatus, uomController.create_uom);

// Get all UOMs API
router.get("/get-all-uoms",auth, checkSellerMemberShipPlanStatus, uomController.get_all_uoms);

// Get UOM API
router.get("/get-uom",auth,checkSellerMemberShipPlanStatus,  uomController.get_uom);

// Update UOM API
router.put("/update-uom",auth,checkSellerMemberShipPlanStatus,  uomController.update_uom);

// Delete UOM API
router.delete("/delete-uom",auth, checkSellerMemberShipPlanStatus, uomController.delete_uom);


// Create banner API
router.post("/create-banner",auth, checkSellerMemberShipPlanStatus,banner_upload.single('image'), bannerController.create_banner);

// Get all banners API
router.get("/get-all-banners", auth, checkSellerMemberShipPlanStatus, bannerController.get_all_banners);

// Get banner detail API
router.get("/get-banner-detail",auth, checkSellerMemberShipPlanStatus, bannerController.get_banner);

// Update banner API
router.put("/update-banner",auth, checkSellerMemberShipPlanStatus,banner_upload.single('image'),  bannerController.update_banner);

// Delete banner API
router.delete("/delete-banner",auth, checkSellerMemberShipPlanStatus,bannerController.delete_banner);

// Get seller events API
router.get("/get-seller-events", auth,eventController.get_seller_events);


// Add event validator API
router.post("/add-event-validator",auth, checkSellerMemberShipPlanStatus,validatorEventController.add_event_validator);

// get guest banner list API
router.get("/get-guest-banner-list", bannerController.get_guest_banner_list);

// get seller validator list API
router.get("/get-seller-validator-list",auth, validatorController.get_seller_validator_list);

// get validators'event list API
router.get("/get-event-validators-list",auth,checkSellerMemberShipPlanStatus, validatorEventController.get_event_validators_list);

// get not expired event validators list  API
router.get("/get-not-expired-event-validators-list",auth, validatorEventController.get_not_expired_event_validators_list);


// get not expired event list API
//router.get("/get-not-expired-event-list",auth, eventController.get_not_expired_event_list);


// get booked guest list API
router.get("/get-booked-guest-list",auth, bookingController.get_booked_guest_list);


// manage event's validator status API
router.put("/manage-event-validator-status",auth, validatorEventController.manage_event_validator_status);

// get validator's events list status API
router.get("/get-validator-events-list",auth, validatorEventController.get_validator_events_list);

// get item sales report API
router.get("/item-sales-report",auth,  reportController.get_item_sales_report);

// get number of guests for event API (cover report)
router.get("/number-of-guests-for-event",auth, reportController.get_number_of_guests_for_event);


// get repeated guests for seller attending events API
router.get("/repated-guests-for-seller",auth,reportController.get_repeated_guests_for_seller_attending_events);

// get the number of guests attending events by a specific seller (guest presence report)
router.get("/guest-presence-report",auth,reportController.guest_presence_report);

// get fns moving items report
router.get("/fns-moving-items-report",auth,reportController.fns_moving_item_report);

// get guest potential report
router.get("/guest-potential-report",auth,reportController.guest_potential_report);


// get guest loyality report
router.get("/loyalty-point-report",auth,reportController.guest_loyalty_point_report);

// get menu audit report
router.get("/menu-audit-report",auth,reportController.menu_audit_report);

// get revenue comparison report
router.get("/revenue-comparison-report",auth,reportController.revenue_comparison_report);


// get event validator detail API
router.get("/get-event-validator-detail",auth,validatorEventController.get_event_validator_detail);

// update event validator API
router.put("/update-event-validator",auth,checkSellerMemberShipPlanStatus,validatorEventController.update_event_validator);


// delete event validator API
router.delete("/delete-event-validator",auth,checkSellerMemberShipPlanStatus,validatorEventController.delete_event_validator);

// close event counter API
router.put("/close-event-counter",auth,eventController.close_event_counter);


// add guest consumptions of menu item API
router.post("/add-guest-menu-item-consumptions",auth,menuConsumptionController.add_guest_consumption_of_menu_item);


// manage menu item API
router.post("/manage-menu-item",auth,menuController.manage_menu_item);

// get menu item API
router.get("/get-menu-items",auth,menuController.get_menu_items);

// get guest coupon balance API
router.get("/get-guest-coupon-balance",auth,bookingController.get_guest_coupon_balance);

// get guest list API
router.get("/get-guest-list-for-banner", bannerController.get_guest_list_for_banner);



// book menu items API
router.post("/book-menu-items",auth, menuController.book_menu_items);


// get booked menu items API
router.get("/get-booked-menu-items",auth, menuController.get_booked_menu_items);

// approve menu payment API
router.post("/approve-menu-payment",auth, menuController.approve_menu_payment);

// get expired events API
router.get("/get-expired-events/:id/:type",auth, eventController.get_expired_events);


// get pending guest list by event id API
router.get("/get-pending-guest-list-by-event-id",auth,bookingController.get_pending_guest_list_by_event_id);

// get pending guest list API
router.get("/get-pending-guest-list",auth,bookingController.get_pending_guest_list);

// send entry request to guest API

router.post("/send-entry-request-to-guest",auth,bookingController.send_entry_request_to_guest);


// approve entry request API

router.post("/approve-entry-request",auth,bookingController.approve_entry_request);


// get approved booking cost API
router.get("/get-approved-booking-cost", bookingController.get_approved_booking_cost);

// read all notifications api
router.post("/read-all-notifications",auth, notificationController.read_all_notifications);

// feedback list
router.get("/get-feedbacks",auth,  feedbackController.get_feedbacks);

// close event by seller
router.put("/close-event-by-seller",auth,bookingController.close_event_by_seller);

// close menu counter by validator
router.put("/close-menu-counter-by-validator",auth,menuController.close_menu_counter_by_validator);

// event participated guests
router.get("/get-event-participated-guests",auth, sellerController.get_event_participating_guests);

//  active city events
router.get("/get-active-city-events",auth, guestController.get_active_city_events);


// get booked menu list API
router.get("/get-booked-menu-list", auth,bookingController.get_booked_menu_list);


// book event menu items API
router.post("/book-event-menu-items",auth,bookingController.book_event_menu_items);


// manage event menu items booking API
router.post("/approve-event-menu-items-booking",bookingController.approve_event_menu_items_booking);

// get business settings 
router.get("/get-business-settings",auth,businessSettingController.getBusinessSettings);

// get booking detail of fnb event by payment id
router.get("/get-booking-detail-by-payment-id",menuController.getBookingDetailByPaymentId);

// get guest loyality events API
router.get("/get-guest-loyalty-events",auth,serviceController.get_guest_loyalty_events);

// get remind list API
router.get("/get-remind-list-for-event",auth, bannerController.get_remind_list_for_event);

router.get("/send-remind-list-for-event", auth, bannerController.sendRemindNotificationOfEvent);

// get event menu list API
router.get("/get-event-menu-list",auth,menuController.get_event_menu_list);


// update consumed menu quantity API
router.put("/update-consumed-menu-quantity",auth,menuController.update_consumed_menu_quantity);


router.get("/get_approved_booking_cost_of_all_validators",auth,bookingController.get_approved_booking_cost_of_all_validators);

router.put("/manage-validator-event-balance",auth,bookingController.manage_validator_event_balance);


router.get("/get-active-event-of-validator",auth,validatorEventController.get_active_event_of_validator);

// give feedback reply
router.post("/give-feedback-reply",auth,feedbackController.give_feedback_reply);

// get fns moving items report
router.get("/fns-moving-items-report",auth,reportController.fns_moving_item_report);

// get active and expired loyalty events
router.get("/get-active-and-expired-loyalty-events",auth,reportController.get_active_and_expired_loyalty_events);


// get rating breakup list
router.get("/get-rating-breakup-list",auth, feedbackController.get_rating_breakup_list);

cron.schedule("* * * * *", function() {
    //bookingController.sendEventNotification();
    bookingController.sendExpireEventNotification();
    bookingController.sendExpiredEventNotification();
});

cron.schedule("0 0 * * *", function() {
    membershipController.disableSellerServices();
    bannerController.sendRemindNotificationOfEvent();
});





module.exports = router;
