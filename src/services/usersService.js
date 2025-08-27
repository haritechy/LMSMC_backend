const User = require("../models/userModel");

exports.getRolesWithCount = async (roleId = 1) => {
  try {

    const userCount = await User.findAll({
      where: { RoleId:roleId },
    });
    return {
      userCount,
      totalCount: userCount.length
    };
  } catch (error) {
    console.error("Error fetching role counts:", error);
    throw error;
  }
};
