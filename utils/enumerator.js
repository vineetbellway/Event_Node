const userStatus = {
  pending: "pending",
  active: "active",
  deleted: "deleted",
};

const userTypes = {
  admin: "admin",
  stitcher: "stitcher",
  embroider: "embroider",
  cutter: "cutter",
  packager: "packager",
  finisher: "finisher",
};

const baseStatus = {
  active: "active",
  blocked: "blocked",
  deleted: "deleted",
};

const workStatus = {
  pending: "pending",
  completed: "completed",
};

const orderStatus = {
  pending: "pending",
  completed: "complete",
  deleted: "deleted",
};

const paymentStatus = {
  pending: "pending",
  paid: "paid",
};
module.exports = {
  userStatus,
  userTypes,
  baseStatus,
  workStatus,
  paymentStatus,
  orderStatus,
};
