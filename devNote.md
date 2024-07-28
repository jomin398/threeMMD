# milestones
- [v] zip file support
- [v] drag and drop
- [v] Spine Animation Rendering.
- [v] support older versions of Spine Engine (v3.7 ~ )
- [v] MMD Rendering.
- [v] MMD Rendering support without bgm.
- [v] unzipped file upload support.
- [v] Multiple MMD Models support. (thay are same motion)
- [v] separately configable MMD Models support. (prefix with `chr_`)
- [v] standalone support user config to load data from CDM (Cloud Urls).
- [v] stage positionning, rotation settings support in setup file.
- [v] light positionning, rotation settings support in setup file.
- [v] fix the song credit for displaying copyright information.
- [v] fix the model credit for displaying copyright information.
- [v] fix the stage credit for displaying copyright information.
- [v] fix the motion credit for displaying copyright information.
- [v] spine background support
- [v] fix mmd load, when zip contains multiple pmx files.
- [v] add configable ambientLight.
- [v] Multiple Stage models support. (prefix with `stg_`);
- [ ] fix the Multiple stage credit for displaying copyright information.
- [ ] effect Setting with INI (for low Spec Graphic Device).
- [ ] effect Setting GUI (Bloom or else).
- [ ] lyrics support
- [ ] audio effects support (reverb effect)
- [ ] support text input for dynamic ini file.
- [ ] services on the live web.

## notes for mmd
- Do not put a music file together where the model file is located.
- Do not leave the stage model file together where the model file is located.

(If you ignore the corresponding matters, an error occurs and rendering is not rendered.)

- With the camera motion file, moving the camera by a user, it's will be ignored. 

## notes for spine
- Do not put a voice files together where the model file is located.
- It can throw Error on the loading, when if not match the file name of the image uploaded from the image pointed from the `.atlas` file.
- Without `config.ini` file, voices will not played properly.

## supported file formats
- `.pmx` for mmd Rendering
- `.vmd` for mmd motion, camera animation.
- `.mp3`, `.wav`, `.ogg` for bgm or character voices
- `.skel` (or `.json`) & `.atlas` for spine model Rendering.
- `config.ini` for custiom configuration