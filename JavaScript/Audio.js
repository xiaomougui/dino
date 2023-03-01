/**
 * 游戏音乐
 * @param {String} outerContainerId 
 * @param {*} filename 
 */
function GameAudio(outerContainerId, filename) {
    this.outerContainer = document.getElementById(outerContainerId);
    this.filename = GameAudio.filename;
    this.audio = null;
}

GameAudio.filepath = "./assets";

GameAudio.filename = {
    FAIL: "fail.mp3",
    GOAL: "goal.mp3",
    JUMP: "jump.mp3"
}

GameAudio.prototype = {
    init() {
        this.audio = new Audio();
    },
    keydown(event) {
        this.audio.src = `${GameAudio.filepath}/${GameAudio.filename[event]}`;
    }
}