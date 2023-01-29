/**
 * 恐龙类
 * @param {HTMLCanvasElement} canvas 
 * @param {Object} spritePos 
 */
function Trex(canvas, spritePos) {
    if (Trex.instance_) {
        return Trex.instance_;
    } else {
        Trex.instance_ = this;
    }
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.spritePos = spritePos; //精灵图坐标
    this.xPos = 0;  //在画布中x的坐标
    this.yPos = 0;  //在画布中y的坐标
    this.groundYPos = 0;    //初始化地面的高度
    this.currentFrame = 0;  //初始化动画帧
    this.currentAnimFrames = [];  //记录当前状态的动画帧
    this.blinkDelay = 0;    //眨眼延迟(随机)
    this.animStartTime = 0; //动画开始的时间
    this.timer = 0; //计时器
    this.msPerFrame = 1000 / FPS;   //默认帧率
    this.config = Trex.config;  //拷贝一个配置的副本方法方便以后使用
    this.normalJumpConfig = Trex.normalJumpConfig;
    this.jumpVelocity = 0;  //跳跃的初始速度

    this.status = '';  //初始化默认状态为待机状态

    //为各种状态建立标识
    this.jumping = false;   //是否处于跳跃
    this.ducking = false;   //是否处于闪避
    this.reachedMinHeight = false;  //是否到达最小跳跃高度
    this.speedDrop = false; //是否加速降落
    this.jumpCount = 0; //跳跃次数


    this.init();
}

Trex.config = {
    DROP_VELOCITY: -5, //下降速度
    BLINK_TIMING: 6000,  //眨眼间隔
    WIDTH: 44,        //站立时宽度
    WIDTH_DUCK: 59,    //闪避时宽度
    HEIGHT: 47,    //站立时高度
    BOTTOM_PAD: 10,
    MIN_JUMP_HEIGHT: 30 //最小起跳高度
};

//缓慢模式跳跃设置
Trex.slowJumpConfig = {
    GRAVITY: 0.25,
    MAX_JUMP_HEIGHT: 50,
    MIN_JUMP_HEIGHT: 45,
    INITIAL_JUMP_VELOCITY: -20,
};

//正常模式跳跃设置
Trex.normalJumpConfig = {
    GRAVITY: 0.6,
    MAX_JUMP_HEIGHT: 30,
    MIN_JUMP_HEIGHT: 30,
    INITIAL_JUMP_VELOCITY: -10,
};

//状态
Trex.status = {
    CRASHED: 'CRASHED', //与障碍物发生碰撞
    DUCKING: 'DUCKING', //闪避
    JUMPING: 'JUMPING', //跳跃
    RUNNING: 'RUNNING', //跑动
    WAITING: 'WAITING', //待机
}

//元数据(metadata)，记录各个状态的动画帧和帧率
Trex.animFrames = {
    WAITING: {//待机状态
        frames: [44, 0],//动画帧x坐标在44和0之间切换，由于在雪碧图中的y坐标是0所以不用记录
        msPerFrame: 1000 / 3    //一秒3帧
    },
    RUNNING: {
        frames: [88, 132],
        msPerFrame: 1000 / 12
    },
    CRASHED: {
        frames: [220],
        msPerFrame: 1000 / 60
    },
    JUMPING: {
        frames: [0],
        msPerFrame: 1000 / 60
    },
    DUCKING: {
        frames: [262, 321],
        msPerFrame: 1000 / 8
    }
};

Trex.collisionBoxes = {
    DUCKING: [
        new CollisionBox(1, 18, 55, 25)
    ],
    RUNNING: [
        new CollisionBox(22, 0, 17, 16),
        new CollisionBox(1, 18, 30, 9),
        new CollisionBox(10, 35, 14, 8),
        new CollisionBox(1, 24, 29, 5),
        new CollisionBox(5, 30, 21, 4),
        new CollisionBox(9, 34, 15, 4)
    ]
}



Trex.prototype = {
    init: function () {
        this.groundYPos = DEFAULT_HEIGHT - this.config.HEIGHT - this.config.BOTTOM_PAD;
        this.yPos = this.groundYPos;
        //计算出最小跳跃高度
        this.minJumpHeight = this.groundYPos - this.config.MIN_JUMP_HEIGHT;

        this.draw(0, 0);
        this.update(0, Trex.status.WAITING);
    },

    /**
     * 重新设置为初始值
     */
    reset: function () {
        this.yPos = this.groundYPos;
        this.jumpVelocity = 0;
        this.jumping = false;
        this.ducking = false;
        this.update(0, Trex.status.RUNNING);
        this.speedDrop = false;
        // this.jumpCount = 0;
    },



    /**
     * 设置眨眼间隔时间
     */
    setBlinkDelay: function () {
        //设置随机眨眼间隔时间
        this.blinkDelay = Math.ceil(Math.random() * Trex.config.BLINK_TIMING);
    },

    /**
     * 更新画布
     * @param {Number} deltaTime 每帧时间 
     * @param {String} opt_status 当前恐龙状态 
     */
    update: function (deltaTime, opt_status) {
        this.timer += deltaTime;

        if (opt_status && this.status != opt_status) {
            this.status = opt_status;
            this.currentFrame = 0;
            //得到当前对应的帧率
            //1000ms/3fps=333ms/fps
            this.msPerFrame = Trex.animFrames[opt_status].msPerFrame;
            this.currentAnimFrames = Trex.animFrames[opt_status].frames;
            if (opt_status === Trex.status.WAITING) {
                if (!this.animStartTime) {
                    //开始记y时
                    this.animStartTime = getTimeStamp();
                    //设置延时
                    this.setBlinkDelay();
                }
            }
        }

        //计时器超过一帧的时间，切换到下一帧
        if (this.timer >= this.msPerFrame) {
            this.currentFrame = this.currentFrame === this.currentAnimFrames.length - 1 ? 0 : this.currentFrame + 1;
            this.timer = 0;
        }

        //待机状态
        if (this.status === Trex.status.WAITING) {
            //执行眨眼动作
            this.blink(getTimeStamp());
        } else if (this.status === Trex.status.JUMPING) {
            this.updateJump(deltaTime);
            this.draw(this.currentAnimFrames[this.currentFrame], 0);
        } else {
            this.draw(this.currentAnimFrames[this.currentFrame], 0);
        }
    },

    /**
     * 控制眨眼
     * @param {Number} time 当前时间(毫秒) 
     */
    blink: function (time) {
        let deltaTime = time - this.animStartTime;

        if (deltaTime >= this.blinkDelay) {
            this.draw(this.currentAnimFrames[this.currentFrame], 0);
            if (this.currentFrame === 1) { //0闭眼，1睁眼
                //设置新的眨眼时间
                this.setBlinkDelay();
                this.animStartTime = time;
            }
        } else {
            //正常情况下绘制睁眼的小恐龙
            this.draw(this.currentAnimFrames[1], 0);
        }


    },

    /**
     * 开始跳跃
     * @param {Number} speed 速度 
     */
    startJump: function (speed) {
        if (!this.jumping) {
            //切换到jump状态
            this.update(0, Trex.status.JUMPING);
            //设置跳跃速度，恐龙上升为负，下降为正
            this.jumpVelocity = this.normalJumpConfig.INITIAL_JUMP_VELOCITY - (speed / 10);
            this.jumping = true;
            this.reachedMinHeight = false;
        }
    },

    /**
     * 终止跳跃
     */
    endJump: function () {
        if (this.reachedMinHeight && this.jumpVelocity < this.config.DROP_VELOCITY) {
            //？
            this.jumpVelocity = this.config.DROP_VELOCITY;
        }
    },



    /**
     * 更新跳跃
     * @param {Number} deltaTime 每帧的时间
     */
    updateJump: function (deltaTime) {
        //帧切换速率
        let msPerFrame = Trex.animFrames[this.status].msPerFrame;
        //经过的帧数 
        let framesElapsed = deltaTime / msPerFrame;

        //更新y轴坐标
        this.yPos += Math.round(this.jumpVelocity * framesElapsed);

        //由于速度受重力影响，需要对速度进行修正
        this.jumpVelocity += this.normalJumpConfig.GRAVITY * framesElapsed;

        //达到最小跳跃高度
        if (this.yPos < this.minJumpHeight || this.speedDrop) {
            this.reachedMinHeight = true;
        }

        //达到最大跳跃高度后停止跳跃
        if (this.yPos < this.normalJumpConfig.MAX_JUMP_HEIGHT || this.speedDrop) {
            this.endJump();
        }
        if (this.yPos > this.groundYPos) {
            this.reset();
            this.jumpCount++;
        }
        // this.update(deltaTime, Trex.status.JUMPING);
    },

    /**
     * 设置快速下降
     */
    setSpeedDrop: function () {
        this.speedDrop = true;
        this.jumpVelocity = 1;  //将速度设置为1，正方向向下
    },

    /**
     * 绘制小恐龙
     * @param {Number} x  x坐标
     * @param {Number} y  y坐标
     */
    draw: function (x, y) {
        let sourceX = x;
        let sourceY = y;
        let sourceWidth = this.ducking && this.status != Trex.status.CRASHED
            ? this.config.WIDTH_DUCK : this.config.WIDTH;

        let sourceHeight = this.config.HEIGHT;
        sourceX += this.spritePos.x;
        sourceY += this.spritePos.y;

        this.ctx.drawImage(Runner.instance_.imgSprite,
            sourceX, sourceY,
            sourceWidth, sourceHeight,
            this.xPos, this.yPos,
            this.config.WIDTH, this.config.HEIGHT);
    }
}
