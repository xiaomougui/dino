/**
 * 绘制地面
 * @param {HTMLCanvasElement} canvas 地面将绘制到此画布上
 * @param {Object} spritePos 地面在雪碧图中的坐标
 */
function HorizonLine(canvas, spritePos) {
    this.spritePos = spritePos;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dimensions = HorizonLine.dimensions;

    //在精灵图中坐标为2和602分别为不同的地形
    this.sourceXPos = [this.spritePos.x, this.spritePos.x + this.dimensions.WIDTH];

    //地面在画布中的x坐标
    this.xPos = [];
    //地面在画布中的y坐标
    this.yPos = 0;

    //随机地面系数
    this.bumpThreshold = 0.5;

    this.setSourceDimesions();
    this.draw();
}




//定义属性
HorizonLine.dimensions = {
    //宽600
    WIDTH: 600,
    //高12像素
    HEIGHT: 12,
    //在canvas中的位置
    YPOS: 127,
}

HorizonLine.prototype = {
    setSourceDimesions: function () {
        //地面在画布上的位置
        this.xPos = [0, this.dimensions.WIDTH];
        this.yPos = this.dimensions.YPOS;
    },

    /**
     * 随机地形
     * @returns 第一段地形或是第二段地形
     */
    getRandomType: function () {
        return Math.random() > this.bumpThreshold ? this.dimensions.WIDTH : 0;
    },

    draw: function () {
        //绘制地形
        this.ctx.drawImage(Runner.instance_.imgSprite,
            this.sourceXPos[0], this.spritePos.y,
            this.dimensions.WIDTH, this.dimensions.HEIGHT,
            this.xPos[0], this.yPos,
            this.dimensions.WIDTH, this.dimensions.HEIGHT);
        this.ctx.drawImage(Runner.instance_.imgSprite,
            this.sourceXPos[1], this.spritePos.y,
            this.dimensions.WIDTH, this.dimensions.HEIGHT,
            this.xPos[1], this.yPos,
            this.dimensions.WIDTH, this.dimensions.HEIGHT);
    },

    /**
     * 更新地面x轴坐标
     * @param {Number} pos 地面标志符 
     * @param {Number} increment 地面每帧移动的距离 
     */
    updateXPos: function (pos, increment) {
        let line1 = pos, line2 = pos == 0 ? 1 : 0;
        this.xPos[line1] -= increment;
        this.xPos[line2] = this.xPos[line1] + this.dimensions.WIDTH;

        //若第一段地面完全移出canvas外
        if (this.xPos[line1] <= -this.dimensions.WIDTH) {
            //则将其移动至canvas外右侧
            this.xPos[line1] += this.dimensions.WIDTH * 2;
            //同时将第二段地面移动到canvas内
            this.xPos[line2] = this.xPos[line1] - this.dimensions.WIDTH;

            //选择随机地形
            this.sourceXPos[line1] = this.getRandomType() + this.spritePos.x;
        }
    },

    /**
     * 更新地面
     * @param {Number} deltaTime 从游戏开始到当前的时间 
     * @param {Number} speed 速度参数 
     */
    update: function (deltaTime, speed) {
        let increment = Math.floor((speed * FPS / 1000) * deltaTime * 100) / 100;

        //交换地面一二
        if (this.xPos[0] <= 0) {
            this.updateXPos(0, increment);
        } else {
            this.updateXPos(1, increment);
        }

        this.draw();
    },

    reset: function () {
        this.xPos[0] = 0;
        this.xPos[1] = this.dimensions.WIDTH;
    }
}