/**
 * 绘制云朵
 * @param {HTMLCanvasElement} canvas
 * @param {Object} spritePos 雪碧图坐标
 * @param {Number} containWidth 容器宽度
 */
function Cloud(canvas, spritePos, containWidth) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.spritePos = spritePos;
    this.containWidth = containWidth;
    this.xPos = containWidth;   //云朵初始x坐标在屏幕外
    this.yPos = 0;  //云朵初始高度
    this.remove = false; //是否移除

    //云朵之间的间隙
    this.cloudsGap = getRandomNum(Cloud.config.MIN_CLOUD_GAP, Cloud.config.MAX_CLOUD_GAP);
    this.init();
}

Cloud.config = {
    HEIGHT: 14,  //云朵sprite的高度
    MAX_CLOUD_GAP: 400,  //两朵云之间的最大间隙
    MAX_SKY_LEVEL: 30,   //云朵的最大高度
    MIN_CLOUD_GAP: 100,  //两朵云之间的最小间隙
    MIN_SKY_LEVEL: 71,   //云朵的最小高度
    WIDTH: 46,    //云朵sprite的宽度
    MAX_CLOUDS: 6,//最大云朵数量
    CLOUD_FREQUENCY: .5 //云朵出现频率
}

//存储云朵
Cloud.clouds = [];

Cloud.prototype = {
    init: function () {
        //设置云朵高度为随机30-71
        this.yPos = getRandomNum(Cloud.config.MAX_SKY_LEVEL, Cloud.config.MIN_SKY_LEVEL);
        this.draw();
    },
    draw: function () {
        this.ctx.save();
        let sourceWidth = Cloud.config.WIDTH;
        let sourceHeight = Cloud.config.HEIGHT;
        // console.log(Cloud.clouds.length);
        this.ctx.drawImage(Runner.instance_.imgSprite,
            this.spritePos.x, this.spritePos.y,
            sourceWidth, sourceHeight,
            this.xPos, this.yPos,
            sourceWidth, sourceHeight);

        this.ctx.restore();
    },
    //添加云朵并控制其移动
    updateClouds: function (speed) {
        let numClouds = Cloud.clouds.length;
        //如果云朵存在
        if (numClouds) {
            for (let i = numClouds - 1; i >= 0; i--) {
                Cloud.clouds[i].update(speed);
            }
            let lastClouds = Cloud.clouds[numClouds - 1];

            //若当前存在的云朵数量小于最大数量
            //并且云朵位置大于间隙时，随机添加云朵
            if (numClouds < Cloud.config.MAX_CLOUDS &&
                (DEFAULT_WIDTH - lastClouds.xPos) > lastClouds.cloudsGap &&
                Cloud.config.CLOUD_FREQUENCY > Math.random()) {
                this.addCloud();
            }

            //过滤掉已经移出屏幕外的云朵
            Cloud.clouds = Cloud.clouds.filter(function (obj) {
                return !obj.remove;
            })

        } else {
            //直接添加
            this.addCloud();
        }
    },
    update: function (speed) {
        //仅绘制符合条件的云朵
        if (!this.remove) {
            //向左移动
            this.xPos -= Math.ceil(speed);

            this.draw();

            if (this.isVisible()) {
                this.remove = true;
            }
        }
    },
    //判断云朵是否移出屏幕外
    isVisible: function () {
        return this.xPos < 0;
    },
    //将云朵添加至数组
    addCloud: function () {
        let cloud = new Cloud(this.canvas, this.spritePos, DEFAULT_WIDTH);
        Cloud.clouds.push(cloud);
    }
}