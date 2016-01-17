var Cylon = require('cylon');

Cylon.robot({
  connections: {
    audio: { adaptor: 'audio' }
  },

  devices: {
    audio: { driver: 'audio' }
  },

  work: function(my) {
    my.audio.on('playing', function(song){
      console.log('Playing this nice tune: "' + song + '"');
    });

    // You can pass a string with a full or relative path here,
    my.audio.play('./RoboSapien/43_highfive.mp3');
  }
}).start();
