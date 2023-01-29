/**
 * 夜间模式
 * @param {HTMLCanvasElement} canvas 
 * @param {Object} spritePos 精灵图坐标
 * @param {Number} containWidth 容器宽度
 */
function NightMode(canvas, spritePos, containWidth) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.spritePos = spritePos;
    this.containWidth = containWidth;
    this.xPos = containWidth - 50;  //月亮的x坐标，一开始在画布右侧
    this.yPos = 30;
    this.currentPhase = 0;
    this.opacity = 0;
    this.stars = [];    //用来存储星星
    this.drawStars = false; //是否描绘星星
    this.placeStars();  //放置星星
}

NightMode.config = {
    FADE_SPEED: 0.035,    //淡入淡出速度
    HEIGHT: 40,    //月亮高度
    MOON_SPEED: 0.25,    //月亮移动速度
    NUM_STARS: 2,    //星星数量
    STAR_SIZE: 9,    //星星宽度
    STAR_SPEED: 0.3,//星星速度
    STAR_MAX_Y: 70,    //星星在画布上出现的位置
    WIDTH: 20    //半个月度宽度
};

//月亮在不同时期有不同的位置
NightMode.phases = [140, 120, 100, 60, 40, 20, 0];

//时间记录
NightMode.invertTimer = 0;
//是否可以进行昼夜交替
NightMode.inverted = false;
//用于控制样式切换
NightMode.invertTrigger = false;
//黑夜持续时间
NightMode.INVERT_FADE_DUARTION = 5000;

NightMode.prototype = {
    update: function (activated) {
        //当夜晚模式处于激活状态且opacity为0时
        //对月亮状态进行更新
        if (activated && this.opacity == 0) {
            this.currentPhase++;
            if (this.currentPhase >= NightMode.phases.length) {
                this.currentPhase = 0;
            }
        }

        //淡入
        if (activated && (this.opacity < 1 || this.opacity == 0)) {
            this.opacity += NightMode.config.FADE_SPEED;
        } else if (this.opacity > 0) {//淡出
            this.opacity -= NightMode.config.FADE_SPEED;
        }

        //当opacity大于0时移动月亮位置
        if (this.opacity > 0) {
            this.xPos = this.updateXPos(this.xPos, NightMode.config.MOON_SPEED);

            //移动星星
            if (this.drawStars) {
                for (let i = 0; i < NightMode.config.NUM_STARS; i++) {
                    this.stars[i].x = this.updateXPos(this.stars[i].x, NightMode.config.STAR_SPEED);
                }
                this.draw();
            }
        } else {
            this.opacity = 0;
            this.placeStars();
        }
        this.drawStars = true;
    },
    updateXPos: function (currentPos, speed) {
        if (currentPos < NightMode.config.WIDTH) {
            currentPos = this.containWidth;
        } else {
            currentPos -= speed;
        }
        return currentPos;
    },
    draw: function () {
        //周期为3时画满月
        let moonSourceWidth = this.currentPhase == 3 ? NightMode.config.WIDTH * 2 : NightMode.config.WIDTH;
        let moonSourceHeight = NightMode.config.HEIGHT;
        //从雪碧图上获取月亮正确的形状
        let moonSourceX = this.spritePos.x + NightMode.phases[this.currentPhase];
        let moonOutputWidth = moonSourceWidth;
        let starSize = NightMode.config.STAR_SIZE;
        let starSourceX = Runner.spriteDefinition.STAR.x;

        this.ctx.save();
        //画布透明度随之改变
        this.ctx.globalAlpha = this.opacity;

        //星星
        if (this.drawStars) {
            for (let i = 0; i < NightMode.config.NUM_STARS; i++) {
                this.ctx.drawImage(Runner.instance_.imgSprite,
                    starSourceX, this.stars[i].sourceY,
                    starSize, starSize,
                    Math.round(this.stars[i].x), this.stars[i].y,
                    NightMode.config.STAR_SIZE, NightMode.config.STAR_SIZE);
            }
        }

        //月亮
        this.ctx.drawImage(Runner.instance_.imgSprite,
            moonSourceX, this.spritePos.y,
            moonSourceWidth, moonSourceHeight,
            Math.round(this.xPos), this.yPos,
            moonOutputWidth, NightMode.config.HEIGHT);

        this.ctx.globalAlpha = 1;
        this.ctx.restore();
    },
    placeStars: function () {
        //将画布分为若干组
        let segmentSize = Math.round(this.containWidth / NightMode.config.NUM_STARS);
        for (let i = 0; i < NightMode.config.NUM_STARS; i++) {
            this.stars[i] = {};
            //每组星星位置随机
            this.stars[i].x = getRandomNum(segmentSize * i, segmentSize * (i + 1));
            this.stars[i].y = getRandomNum(0, NightMode.config.STAR_MAX_Y);
            //随机星星种类
            this.stars[i].sourceY = Runner.spriteDefinition.STAR.y + NightMode.config.STAR_SIZE * i;
        }
    },
    invert: function (deltaTime) {
        this.update(NightMode.inverted);

        //黑夜持续时间5秒
        if (NightMode.invertTimer > NightMode.INVERT_FADE_DUARTION) {
            NightMode.invertTimer = 0;
            NightMode.invertTrigger = false;
            NightMode.inverted = document.body.classList.toggle('inverted', NightMode.invertTrigger);
        } else if (NightMode.invertTimer) {
            NightMode.invertTimer += deltaTime;
        } else {
            //每500帧触发黑夜，这里只是为了模拟效果，完整游戏中是每700米触发一次黑夜
            NightMode.invertTrigger = !(Runner.instance_.gameFrame % 500);
            if (NightMode.invertTrigger && NightMode.invertTimer === 0) {
                NightMode.invertTimer += deltaTime;
                NightMode.inverted = document.body.classList.toggle('inverted', NightMode.invertTrigger);
            }
        }
    },
    reset: function () {
        this.currentPhase = 0;
        this.opacity = 0;
        this.update(false);
    }
}