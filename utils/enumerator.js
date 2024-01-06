const userStatus = {
  pending: "pending",
  active: "active",
  deleted: "deleted",
};

const userTypes = {
  admin: "admin",
  guest: "guest",
  seller: "seller",
  validator: "validator",
};

const baseStatus = {
  pending: "pending",
  active: "active",
  rejected: "rejected",
  blocked: "blocked",
  deleted: "deleted",
  expired: "expired"
};

const sellerStatus = {
  pending: "pending",
  active: "active",
  blocked: "blocked",
  deleted: "deleted",
};

const validatorRoles = {
  cashier: "cashier",
  bar_attender: "bar_attender",
  booker: "booker"
};

module.exports = {
  userStatus,
  userTypes,
  baseStatus,
  validatorRoles,
};
