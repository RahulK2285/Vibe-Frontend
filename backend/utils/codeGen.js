exports.generateRoomCode = () => {
  // Generates a random 6-character alphanumeric string
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};