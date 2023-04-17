/**
 * 距离记录器
 * @param {HTMLCanvasElement} canvas 
 * @param {Object} spritePos 
 * @param {Number} canvasWidth 
 */
function DistanceMeter(canvas, spritePos, canvasWidth) {
    this.canvas = canvas;
    this.canvasCtx = canvas.getContext('2d');
    this.spritePos = spritePos;

    //相对坐标
    this.x = 0;
    this.y = 0;

    //最大分数
    this.maxScore = 0;
    //高分榜
    this.highScore = 0;
    this.highScoreArr = [];

    //是否进行闪动特效
    this.acheivement = false;
    this.defaultString = '';

    //闪动特效计时器
    this.flashTimer = 0;
    //闪动计时器
    this.flashIterations = 0;
    this.invertTrigger = false;

    this.config = DistanceMeter.config;
    //最大记录位数
    this.maxScoreUnits = this.config.MAX_DISTANCE_UNITS;
    this.init(canvasWidth);
}

DistanceMeter.dimensions = {
    WIDTH: 10,    //每个字符的宽度
    HEIGHT: 13,    //每个字符的高
    DEST_WIDTH: 11 //间隙
};

DistanceMeter.config = {
    // 初始时记录的分数上限为5位数，即99999
    MAX_DISTANCE_UNITS: 5,

    // 每隔100米距离记录器的数字出现闪动特效
    ACHIEVEMENT_DISTANCE: 100,

    // 将移动距离转化为合理的数值所用的转化系数
    COEFFICIENT: 0.025,

    // 每250ms闪动一次
    FLASH_DURATION: 1000 / 4,

    // 闪动次数
    FLASH_ITERATIONS: 3
};

DistanceMeter.prototype = {
    /**
     * 初始化
     * @param {Number} canvasWidth 
     */
    init: function (canvasWidth) {
        let maxDistanceStr = '';
        this.calcXPos(canvasWidth);
        for (let i = 0; i < this.maxScoreUnits; i++) {
            this.draw(i, 0);
            this.defaultString += '0';
            maxDistanceStr += '9';
        }

        this.audio = new Audio();

        this.highScoreStart();

        //99999
        this.maxScore = parseInt(maxDistanceStr);
    },

    /**
     * 获取高分
     */
    getHighScore() {
        if (!window.localStorage) {
            alert("浏览器不支持localstorage");
        } else {
            if (localStorage.getItem('highScore')) {
                this.highScore = localStorage.getItem('highScore');
            } else {
                this.highScore = 0;
            }
        }
    },

    /**
     * 计算出xPos
     * @param {Number} canvaWidth 
     */
    calcXPos: function (canvaWidth) {
        this.x = canvaWidth - (DistanceMeter.dimensions.DEST_WIDTH * (this.maxScoreUnits + 1));
    },

    draw: function (digitXpos, value, opt_highScore) {
        let sourceWidth = DistanceMeter.dimensions.WIDTH;
        let sourceHeight = DistanceMeter.dimensions.HEIGHT;
        let sourceX = DistanceMeter.dimensions.WIDTH * value;
        let sourceY = 0;

        let targetX = digitXpos * DistanceMeter.dimensions.DEST_WIDTH;
        let targetY = this.y;
        let targetWidth = DistanceMeter.dimensions.WIDTH;
        let targetHeight = DistanceMeter.dimensions.HEIGHT;

        sourceX += this.spritePos.x;
        sourceY += this.spritePos.y;

        this.canvasCtx.save();

        if (opt_highScore) {
            // 将最高分放至当前分数的左边
            let highScoreX = this.x - (this.maxScoreUnits * 2) * DistanceMeter.dimensions.WIDTH;
            this.canvasCtx.translate(highScoreX, this.y);

        } else {
            this.canvasCtx.translate(this.x, this.y);
        }

        this.canvasCtx.drawImage(Runner.instance_.imgSprite, sourceX, sourceY, sourceWidth, sourceHeight, targetX, targetY, targetWidth, targetHeight);

        this.canvasCtx.restore();
    },

    /**
     * 将像素距离转化为真实距离
     * @param {Number} distance 
     * @returns {Number}
     */
    getActualDistance: function (distance) {
        return distance ? Math.round(distance * this.config.COEFFICIENT) : 0;
    },

    update: function (deltaTime, distance) {
        let paint = true;
        let playSound = false;

        if (!this.acheivement) {
            distance = this.getActualDistance(distance);
            //分数超过最大分数增至十万位
            if (distance > this.maxScore && this.maxScoreUnits === this.config.MAX_DISTANCE_UNITS) {
                this.maxScoreUnits++;
                this.maxScore = parseInt(this.maxScore + '9');
            }

            if (distance > 0) {
                //每100距离开始闪动特效并播放声音
                if (distance % this.config.ACHIEVEMENT_DISTANCE === 0) {
                    this.acheivement = true;
                    this.flashTimer = 0;
                    //TODO
                    playSound = true;
                    Runner.instance_.playSound(Runner.instance_.audio[2], Runner.audioevent.GOAL);
                }

                //'00000'+999=00000999 =>00999
                let distanceStr = (this.defaultString + distance).substr(-this.maxScoreUnits);
                this.digits = distanceStr.split('');
            } else {
                this.digits = this.defaultString.split('');
            }
        } else {
            //到达目标分数时闪动分数
            if (this.flashIterations <= this.config.FLASH_ITERATIONS) {
                this.flashTimer += deltaTime;
                if (this.flashTimer < this.config.FLASH_DURATION) {
                    paint = false;
                } else if (this.flashTimer > this.config.FLASH_DURATION * 2) {
                    this.flashTimer = 0;
                    this.flashIterations++;
                }
            } else {
                this.acheivement = false;
                this.flashIterations = 0;
                this.flashTimer = 0;
            }
        }

        //非闪动时绘制分数
        if (paint) {
            for (let i = this.digits.length - 1; i >= 0; i--) {
                this.draw(i, parseInt(this.digits[i]));
            }
        }

        this.drawHighScore();
        return playSound;
    },

    /**
     * 开始关于高分的一系列操作
     */
    highScoreStart() {
        this.getHighScore();
        this.setHighScore();
        this.drawHighScore();
    },

    /**
     * 绘制高分榜
     */
    drawHighScore: function () {
        this.canvasCtx.save();
        //颜色浅
        this.canvasCtx.globalAlpha = .8;
        for (let i = this.highScoreArr.length - 1; i >= 0; i--) {
            this.draw(i, parseInt(this.highScoreArr[i], 10), true);
        }
        this.canvasCtx.restore();
    },

    /**
     * 设置高分
     * @param {Number} distance 
     */
    setHighScore: function (distance) {
        let highScoreStr;
        if (this.getActualDistance(distance) > this.highScore) {
            this.highScore = this.getActualDistance(distance);
            localStorage.setItem('highScore', this.highScore);
        } else if (this.highScoreArr = []) {
            highScoreStr = (this.defaultString + this.highScore).substr(- this.maxScoreUnits);
            //10和11分别对应雪碧图中的H、I
            this.highScoreArr = ['10', '11', ''].concat(highScoreStr.split(''));
        }
    },

    /**
     * 重置
     */
    reset: function () {
        this.highScoreStart();
        this.update(0);
        this.acheivement = false;
    }
}