const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");

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

router.post("/user", auth, userController.login);
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
router.get(
  "/seller_by_user_id/:id",
  auth,
  sellerController.get_seller_by_user_id
);
router.delete("/seller/:id", auth, sellerController.delete_seller);
router.delete("/seller", auth, sellerController.delete_sellers);

router.post("/validator", auth, validatorController.create_validator);
router.put("/validator/:id", auth, validatorController.update_validator);
router.get("/validator", auth, validatorController.get_validators);
router.get("/validator/:id", auth, validatorController.get_validator);
router.get(
  "/validator_by_user_id/:id",
  auth,
  validatorController.get_validator_by_user_id
);
router.delete("/validator/:id", auth, validatorController.delete_validator);
router.delete("/validator", auth, validatorController.delete_validators);

router.post("/event", auth, eventController.create_event);
router.put("/event/:id", auth, eventController.update_event);
router.get("/event", auth, eventController.get_events);
router.get("/search_event/:keyword", auth, eventController.search_events);
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

router.post(
  "/validator-event",
  auth,
  validatorEventController.create_validator_event
);
router.put(
  "/validator-event/:id",
  auth,
  validatorEventController.update_validator_event
);
router.get(
  "/validator-event",
  auth,
  validatorEventController.get_validator_events
);
router.get(
  "/validator-event/:id",
  auth,
  validatorEventController.get_validator_event
);
router.delete(
  "/validator-event/:id",
  auth,
  validatorEventController.delete_validator_event
);
router.delete(
  "/validator-event",
  auth,
  validatorEventController.delete_validator_events
);

router.post("/order-item", auth, orderItemController.create_order_item);
router.put("/order-item/:id", auth, orderItemController.update_order_item);
router.get("/order-item", auth, orderItemController.get_order_items);
router.get("/order-item/:id", auth, orderItemController.get_order_item);
router.delete("/order-item/:id", auth, orderItemController.delete_order_item);
router.delete("/order-item", auth, orderItemController.delete_order_items);

router.post("/transaction", auth, transactionController.create_transaction);
router.put("/transaction/:id", auth, transactionController.update_transaction);
router.get("/transaction", auth, transactionController.get_transactions);
router.get("/transaction/:id", auth, transactionController.get_transaction);
router.delete(
  "/transaction/:id",
  auth,
  transactionController.delete_transaction
);
router.delete("/transaction", auth, transactionController.delete_transactions);

router.post("/invitation", auth, invitationController.create_invitation);
router.put("/invitation/:id", auth, invitationController.update_invitation);
router.get("/invitation", auth, invitationController.get_invitations);
router.get("/invitation/:id", auth, invitationController.get_invitation);
router.delete("/invitation/:id", auth, invitationController.delete_invitation);
router.delete("/invitation", auth, invitationController.delete_invitations);

router.post("/relative", auth, relativeController.create_relative);
router.post("/many_relative", auth, relativeController.create_many_relative);
router.put("/relative/:id", auth, relativeController.update_relative);
router.get("/relative", auth, relativeController.get_relatives);
router.get("/relative/:id", auth, relativeController.get_relative);
router.delete("/relative/:id", auth, relativeController.delete_relative);
router.delete("/relative", auth, relativeController.delete_relatives);

module.exports = router;
