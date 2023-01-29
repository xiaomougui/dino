/**
 * 得到指定范围的随机数字
 * @param {Number} min 
 * @param {Number} max 
 * @returns 
 */
function getRandomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 得到当前的时间
 */
function getTimeStamp() {
    let date = new Date();
    let time = date.getTime();
    return time;
}



