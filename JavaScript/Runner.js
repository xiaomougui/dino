/**
 * 控制类
 * @param {HTMLDivElement} outerContainerId 
 * @param {Object} opt_config 
 * @returns 
 */
function Runner(outerContainerId, opt_config) {
    if (Runner.instance_) {
        return Runner.instance_;
    } else {
        Runner.instance_ = this;
    }

    this.config = Runner.config;

    this.dimensions = Runner.defaultDimensions;

    this.outerContainerEl = document.getElementById(outerContainerId);
    this.canvasEl = null;
    this.canvasCtx = null;

    this.audio = [];
    this.imgSprite = null;

    this.assestsPath = "./assets";
    this.imgName = "all.png";
    this.audiofile = Runner.audiofile;

    this.activated = false; //是否开始游戏
    this.paused = false;
    this.crashed = false;
    this.restartable = false;

    this.raqId = 0; //逐帧动画方法的id

    this.currentSpeed = 0;  //当前速度

    this.distance = 0;  //当前走过的距离

    this.isSoundPlay = false; //是否播放声音

    this.msPerFrame = 1000 / FPS;

    this.time = 0;

    this.gameFrame = 0;
    this.init();
}

Runner.defaultDimensions = {
    WIDTH: 600,
    HEIGHT: 150
}

Runner.spriteDefinition = {
    BACKGROUND_EL: { x: 86, y: 2 }, //背景
    CACTUS_LARGE: { x: 332, y: 2 }, //大仙人掌
    CACTUS_SMALL: { x: 228, y: 2 }, //小仙人掌
    OBSTACLE_2: { x: 332, y: 2 },   //障碍2
    OBSTACLE: { x: 228, y: 2 }, //障碍1
    CLOUD: { x: 86, y: 2 }, //云
    HORIZON: { x: 2, y: 54 },   //地面
    MOON: { x: 484, y: 2 }, //月亮
    PTERODACTYL: { x: 134, y: 2 },  //翼手龙
    RESTART: { x: 2, y: 68 },   //重新开始
    TEXT_SPRITE: { x: 655, y: 2 },  //正文
    TREX: { x: 848, y: 2 }, //小恐龙
    STAR: { x: 645, y: 2 }, //星星
    COLLECTABLE: { x: 2, y: 2 },    //收集物
    ALT_GAME_END: { x: 121, y: 2 }  //gameover
}

Runner.audiofile = {
    FAIL: "fail.mp3",
    GOAL: "goal.mp3",
    JUMP: "jump.mp3",
}

Runner.audioevent = {
    FAIL: "FAIL",
    GOAL: "GOAL",
    JUMP: "JUMP",
}

Runner.keycodes = {
    JUMP: { '38': 1, '32': 1 },  // Up, spacebar,↑和空格，跳跃
    DUCK: { '40': 1 },  // Down，↓，低头，躲避
    RESTART: { '13': 1 }  // Enter，重新开始
}

Runner.config = {
    ACCELERATION: 0.001,    //加速
    AUDIOCUE_PROXIMITY_THRESHOLD: 190,
    AUDIOCUE_PROXIMITY_THRESHOLD_MOBILE_A11Y: 250,
    GAP_COEFFICIENT: 0.6,   //缺口系数
    INVERT_DISTANCE: 700,   //倒置距离
    MAX_SPEED: 13,  //最大速度
    MOBILE_SPEED_COEFFICIENT: 1.2,  //手机(安卓)系数
    SPEED: 5    //速度
}

Runner.prototype = {
    init: function () {
        this.createCanvas();
        this.loadImages();
        this.loadAudios();

        this.imgSprite.onload = function () {
            this.setParams();
            this.createObjects();
            this.startListener();
            this.play();
        }.bind(this);

    },

    /**
     * 加载图像
     */
    loadImages: function () {
        this.imgSprite = new Image();
        this.imgSprite.src = `${this.assestsPath}/${this.imgName}`;
    },

    loadAudios: function () {
        for (let i = 0; i < 3; i++) {
            //TODO
            this.audio[i] = new Audio();
        }
    },

    /**
     * 创建画布
     */
    createCanvas: function () {
        this.canvasEl = document.createElement('canvas');
        this.canvasEl.width = DEFAULT_WIDTH;
        this.canvasEl.height = DEFAULT_HEIGHT;
        this.canvasEl.innerText = "你的浏览器不支持canvas，请升级浏览器";
        this.canvasEl.id = "canvasElem";
        this.outerContainerEl.appendChild(this.canvasEl);
        this.canvasCtx = this.canvasEl.getContext('2d');
    },

    /**
     * 创建对象
     */
    createObjects: function () {
        this.horizon = new HorizonLine(this.canvasEl, Runner.spriteDefinition.HORIZON);
        this.cloud = new Cloud(this.canvasEl, Runner.spriteDefinition.CLOUD, DEFAULT_WIDTH);
        this.night = new NightMode(this.canvasEl, Runner.spriteDefinition.MOON, DEFAULT_WIDTH);
        this.obstacle = new Obstacle(this.canvasEl, Obstacle.types[0], Runner.spriteDefinition[Obstacle.types[0].type], { WIDTH: 600 }, 0.6, 1);
        this.trex = new Trex(this.canvasEl, Runner.spriteDefinition.TREX);
        this.score = new DistanceMeter(this.canvasEl, Runner.spriteDefinition.TEXT_SPRITE, DEFAULT_WIDTH);
    },

    /**
     * 设置参数
     */
    setParams: function () {
        //初始化为默认速度
        this.currentSpeed = this.config.SPEED;
        //开始参数 
        this.activated = false;
        this.paused = false;
        this.crashed = false;
        this.restartable = false;

        this.distance = 0;
        this.startTime = 0;
        // this.time = performance.now();
    },

    /**
     * 开始监听事件
     */
    startListener: function () {
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        document.addEventListener('click', this.restart.bind(this));
    },

    /**
     * 键盘按键按下
     * @param {*} e 
     */
    onKeyDown: function (e) {
        if (Runner.keycodes.JUMP[e.keyCode]) {
            if (!this.crashed && !this.activated) {
                this.activated = true;
                this.playSound(this.audio[0], Runner.audioevent.JUMP);
                this.trex.update(0, Trex.status.RUNNING);
            } else if (this.crashed && this.restartable) {
                this.restart();
            } else if (!Trex.instance_.jumping) {
                this.playSound(this.audio[0], Runner.audioevent.JUMP);
                Trex.instance_.startJump(6);
            }
        } else if (Runner.keycodes.DUCK[e.keyCode]) {
            if (!Trex.instance_.jumping) {
                Trex.instance_.setSpeedDrop();    //加速下降
            }
        }
    },

    /**
     * 键盘按键松开
     * @param {*} e 
     */
    onKeyUp: function (e) {
        if (Runner.keycodes.DUCK[e.keyCode]) {
            Trex.instance_.speedDrop = false;
        }
    },

    /**
     * 停止
     */
    stop: function () {
        this.activated = false;
        this.paused = true;
        cancelAnimationFrame(this.raqId);
        this.raqId = 0;
    },

    /**
     * 计算距离
     */
    colcDistance: function (deltaTime) {
        this.distance += this.currentSpeed * deltaTime / this.msPerFrame;

    },

    /**
     * 设置速度
     */
    setSpeed: function () {
        if (this.currentSpeed < this.config.MAX_SPEED && this.trex.status === "RUNNING") {
            this.currentSpeed += this.config.ACCELERATION;
        }
    },

    /**
     * 更新页面
     */
    update: function (time) {
        if (!this.crashed) {
            this.startTime = this.startTime || performance.now();
            let deltaTime = 0;
            let ctx = this.canvasCtx;



            time = time || performance.now();
            deltaTime = time - this.startTime;

            //修复地面丢帧问题
            //由于update调用requestAnimationFrame时间与程序代码时间有一定时间差
            //time表示requestAnimationFrame函数运行到当前时间的毫秒数
            //performance.now()表示整体代码到当前时间的毫秒数
            //所以deltaTime有可能为负数
            deltaTime = deltaTime > 0 ? deltaTime : 0;

            //游戏从开始到当前经历的帧的数量++
            this.gameFrame++;

            //清除画面
            ctx.clearRect(0, 0, 600, 150);

            //执行
            this.trex.update(deltaTime, this.trex.status);
            this.horizon.draw();
            if (this.activated) {
                this.colcDistance(deltaTime);
                this.setSpeed();

                this.score.update(deltaTime, this.distance);
                console.log(this.currentSpeed);
                this.horizon.update(deltaTime, this.currentSpeed);
                this.cloud.updateClouds(0.2);
                this.night.invert(deltaTime);

                //延迟出现障碍物
                if (this.gameFrame > FPS) {
                    this.obstacle.updateObstacles(deltaTime, this.currentSpeed);
                }
                //检测碰撞
                this.isCrashed(Obstacle.obstacles[0], this.trex);
            }

            this.startTime = time;



            //TODO
            //默认会传递给调用函数（draw）一个时间戳，
            //代表requestAnimationFrame开始执行回调函数的时刻
            let aniId = window.requestAnimationFrame(this.update.bind(this));

            this.raqId = !this.raqId ? aniId : this.raqId;
        }

    },

    /**
     * 检测是否碰撞
     * @param {Obstacle} obstacle 
     * @param {Trex} tRex 
     */
    isCrashed: function (obstacle, tRex) {
        if (obstacle && Array.isArray(checkForCollision(obstacle, tRex))) {
            this.gameOver();
        }
    },

    /**
     * 运行
     */
    play: function () {
        if (!this.crashed && !this.paused) {
            this.update(this.time);
        }
    },

    playSound: function (audio, event) {
        this.isSoundPlay = true;
        audio.src = `${this.assestsPath}/${this.audiofile[event]}`;
        audio.play();
    },

    /**
     * 游戏结束
     */
    gameOver: function () {
        window.cancelAnimationFrame(this.raqId);
        this.raqId = 0;
        this.crashed = true;
        this.trex.update(0, Trex.status.CRASHED);

        this.playSound(this.audio[1], Runner.audioevent.FAIL);
        this.score.setHighScore(this.distance);
        if (!this.gameOverPanel) {
            this.gameOverPanel = new GameOverPanel(this.canvasEl, Runner.spriteDefinition.TEXT_SPRITE,
                Runner.spriteDefinition.RESTART, this.dimensions);
        }

        this.gameOverPanel.draw().then(value => {
            this.restartable = value;
        });
    },

    /**
     * 重新开始
     */
    restart: function () {
        if (this.crashed && this.restartable) {
            this.setParams();
            this.trex.reset();
            Obstacle.obstacles = [];
            this.horizon.reset();
            this.night.reset();
            this.score.reset();
            this.canvasCtx.clearRect(0, 0, 600, 150);
            this.activated = true;
            this.update(this.time);
        }
    }
}