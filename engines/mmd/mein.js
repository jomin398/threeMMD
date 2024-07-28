import { MMDRenderer as MMDModule } from './mmdRenderer.js';
import * as dat from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.9/+esm';
await new Promise(r => window.onload = () => r(true));
////console.log(1);
window.APP = new MMDModule({
  model: [{
    u: 'https://rawcdn.githack.com/jomin398/mmd_bk/c01152b8c568ba02207c977ef6210546830e0ee7/model/miku/School%20Uniform%20Miku.zip',
    pos: [0, 0, 1],
    motions: [
      {
        u: 'https://cdn.jsdelivr.net/gh/jomin398/mySongDB@master/audios/太陽系デスコ/motion.vmd'
      },
    ]
  }],
  audio: [
    {
      u: 'https://cdn.jsdelivr.net/gh/jomin398/mySongDB@master/audios/太陽系デスコ/太陽系デスコ.mp3'
    },
  ]
  //camera:['https://cdn.jsdelivr.net/gh/jomin398/mySongDB@master/audios/%E3%83%80%E3%83%80%E3%83%80%E3%83%80%E5%A4%A9%E4%BD%BF/Camera.vmd']
}, dat);
await APP.init()