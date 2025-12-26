const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatRoomSchema = new Schema({
  roomId: { type: String, required: true, unique: true },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  messages: [{
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    text: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' }
});

module.exports = mongoose.model('ChatRoom', ChatRoomSchema);
