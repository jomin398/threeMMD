class audioHandler {
    constructor(element) {
        /** @type {HTMLAudioElement?} */
        this.element = element;
    }
    show() {
        this.element.style.opacity = 1;
    }
    hide(){
        this.element.style.opacity = 0;
    }
}