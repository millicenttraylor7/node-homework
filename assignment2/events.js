const EventEmitter = require("events");

// Create emitter
const emitter = new EventEmitter();

// Listener for 'time' event
emitter.on("time", (timeString) => {
  console.log("Time received: " + timeString);
});

// Emit event every 5 seconds
setInterval(() => {
  const currentTime = new Date().toString();
  emitter.emit("time", currentTime);
}, 5000);

// Export emitter
module.exports = emitter;
