const { DeviceDiscovery } = require('sonos');
const server = require('http').createServer();
const io = require('socket.io')(server);
require('dotenv').config();

const ROOMNAME = process.env.ROOMNAME;

const getDeviceAsync = () =>
  new Promise((resolve, reject) => {
    console.log('Searching for ' + ROOMNAME);

    DeviceDiscovery(async device => {
      const { roomName } = await device.deviceDescription();

      console.log(roomName);

      if (roomName === ROOMNAME) resolve(device);
    });

    setTimeout(() => reject(new Error('Device not found :(')), 10000);
  });

const setupCurrentTrackListener = async (device, onTrackChanged = () => {}) => {
  device.on('CurrentTrack', trackInfo => {
    console.log(trackInfo);

    onTrackChanged(trackInfo);
  });
};

const start = async () => {
  try {
    const device = await getDeviceAsync();
    console.log(device);

    io.on('connection', async client => {
      const trackInfo = await device.currentTrack();
      client.emit('track', trackInfo);
    });

    setupCurrentTrackListener(device, trackInfo => io.emit('track', trackInfo));

    server.listen(50205);
  } catch (err) {
    console.log(err);

    return process.exit();
  }
};

start();
