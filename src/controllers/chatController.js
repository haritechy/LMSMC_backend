const { Op } = require("sequelize");
const { Message, User, Role } = require("../models/associations");

const { clients } = require("../socket/socket");

// 🔹 Get messages between two users (used for chat page)
exports.getMessages = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  try {
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId },
        ]
      },
      order: [['createdAt', 'ASC']],
    });

    res.json(messages);
  } catch (err) {
    console.error("Failed to fetch messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// 🔹 Send message
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Validate receiver exists
    const receiverUser = await User.findByPk(receiverId);
    if (!receiverUser) {
      return res.status(400).json({ error: "Receiver does not exist" });
    }

    // Optional: detect inappropriate content
    const isInappropriate = content.toLowerCase().includes("inappropriate");
    const newMessage = await Message.create({
      senderId,
      receiverId,
      content,
      status: isInappropriate ? "flagged" : "delivered",
      priority: isInappropriate ? "high" : "normal",
    });

    // Send to receiver via WebSocket
    const receiver = clients.get(receiverId);
    if (receiver && receiver.ws) {
      receiver.ws.send(
        JSON.stringify({
          from: senderId,
          content,
          createdAt: newMessage.createdAt,
        })
      );
    }

    res.json(newMessage);
  } catch (err) {
    console.error("Failed to send message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// 🔹 Get all messages (Admin view only with metadata)
exports.getAllMessages = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const messages = await Message.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "Sender",
          attributes: ["id", "name"],
          include: [{ model: Role, attributes: ["name"] }]
        },
        {
          model: User,
          as: "Receiver",
          attributes: ["id", "name"],
          include: [{ model: Role, attributes: ["name"] }]
        }
      ]
    });

    const formatted = messages.map((msg) => ({
      id: msg.id,
      senderName: msg.Sender?.name || "Unknown",
      senderRole: msg.Sender?.Role?.name || "-",
      receiverName: msg.Receiver?.name || "Unknown",
      receiverRole: msg.Receiver?.Role?.name || "-",
      preview: msg.content.slice(0, 100),
      length: msg.content.length,
      status: msg.status,
      priority: msg.priority,
      timestamp: msg.createdAt,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Failed to fetch all messages:", err);
    res.status(500).json({ error: "Failed to fetch all messages" });
  }
};

// 🔹 Get chat history between current user and another user (detailed)
exports.getChatHistory = async (req, res) => {
  const { otherUserId } = req.params;
  const currentUserId = req.user.id;

  try {
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId }
        ]
      },
      order: [['createdAt', 'ASC']],
      attributes: ['id', 'senderId', 'receiverId', 'content', 'createdAt', 'status', 'priority'],
      include: [
        {
          model: User,
          as: 'Sender',
          attributes: ['id', 'name'],
          include: [{ model: Role, attributes: ['name'] }]
        },
        {
          model: User,
          as: 'Receiver',
          attributes: ['id', 'name'],
          include: [{ model: Role, attributes: ['name'] }]
        }
      ]
    });

    res.json(messages);
  } catch (err) {
    console.error("Failed to fetch chat history:", err);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
};

// 🔹 Admin: Delete a message by ID
exports.deleteMessage = async (req, res) => {
  const { messageId } = req.params;

  try {
    // Check admin permission
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const message = await Message.findByPk(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    await message.destroy();
    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    console.error("Failed to delete message:", err);
    res.status(500).json({ error: "Failed to delete message" });
  }
};
