const Room = require('../models/Room');

const createRoom = async (req, res) => {
  try {
    const { name, description } = req.body;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const room = await Room.create({
      name,
      description,
      members: [req.user._id],
      admins: [req.user._id],
      inviteCode,
    });
    
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Error creating room', error: error.message });
  }
};

const getRooms = async (req, res) => {
  try {
    // Return rooms the user is a member of
    const rooms = await Room.find({ members: req.user._id });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rooms' });
  }
};

const joinRoom = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const room = await Room.findOne({ inviteCode: inviteCode.toUpperCase() });
    
    if (!room) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    if (!room.members.includes(req.user._id)) {
      room.members.push(req.user._id);
      await room.save();
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Error joining room' });
  }
};

module.exports = { createRoom, getRooms, joinRoom };
