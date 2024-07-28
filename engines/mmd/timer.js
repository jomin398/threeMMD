
/**
 * @export
 * @class Timer
 * @typedef {Object} Timer
 * @property {Array<Object>} helpers mmdHelper or else.
 * @property {Object} gui dat gui object.
 * @property {Object?} audio Three.Audio
 * @property {Number?} duration
 * @property {Number?} remainTime
 * @property {Number?} offset
 * @property {Array<HTMLDivElement>?} elm display element
 * @property {Function} update timer update function
 * @property {Function} addDisp add display to GUI.
 * @property {CallableFunction?} togglePlay
 */
export class Timer {
    /**
     * Creates an instance of Timer.
     * @constructor
     * @param {Array} helpers mmdHelper or else. 
     * @param {Object} gui dat gui object.
     */
    constructor(helpers, gui) {
        /** @type {Array} array of helper */
        this.helpers = helpers;
        /** @type {Object} dat gui Obj */
        this.gui = gui;
        //audio
        this.audio = null;
        //duration
        this.duration = -1;
        //remaining
        this.remainTime = -1;
        //offset
        this.offset = 0;
        /** @type {Array<HTMLDivElement>?} elm display element */
        this.elm = null;
    }
    togglePlay = null;
    /** @type {Number} progress */
    #p = -1;
    #updatePaused = false;

    #timeDisphtmlStr = `<li class="cr sprog">
    <progress></progress>
    <div><span id="c" title="current time">0:00</span><span class="material-symbols-outlined" id="sw">
    pending
    </span><span id="e" title="remaining">0:00</span></div>
  </li>`
    update() {
        //sec to time format 0:1.123
        const sec2str = s => `${Math.floor(s / 60) ?? 0}:${((s % 60) ?? 0).toFixed(3)}`;
        const audio = this.helpers[0].audio;
        if (audio == null && !this.#updatePaused) {
            this.elm[0].parentElement.insertAdjacentHTML('beforeend', `<span class="timerWarn">SORRY! NO TIMER INFO.</span>`)
            this.#updatePaused = true;
            return;
        } else this.#updatePaused = false;
        let t = null;
        if (audio) {
            t = Math.abs(this.helpers[0].audioManager.currentTime); // - this.data.timer.a._startedAt
            this.duration = this.audio.buffer.duration;
            this.remainTime = this.duration - t;
            this.#p = ((Math.abs(this.duration - this.remainTime) / this.duration) * 100).toFixed(2);
            if (this.gui && this.elm) {
                //progress
                this.elm[0].value = this.#p;
                //timer div
                const timeDiv = this.elm[1].children;
                timeDiv[0].innerText = sec2str(t);
                timeDiv[2].innerText = sec2str(this.duration);
            }
        }
    }

    addDisp() {
        let s = Object.values(this.gui.__folders)[0];
        s.__ul.insertAdjacentHTML('beforeend', this.#timeDisphtmlStr);
        this.elm = s.__ul.lastChild.children;
        this.elm[1].children[1].onclick = this.togglePlay;
    }
}
