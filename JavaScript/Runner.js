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

    this.dimensions = Runner.defaultDimensions;

    this.outerContainerEl = document.getElementById(outerContainerId);
    this.canvasEl = null;
    this.canvasCtx = null;

    this.imgSprite = null;

    this.activated = false; //是否开始游戏
    this.paused = false;
    this.crashed = false;

    this.raqId = 0;

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

Runner.keycodes = {
    JUMP: { '38': 1, '32': 1 },  // Up, spacebar,↑和空格，跳跃
    DUCK: { '40': 1 },  // Down，↓，低头，躲避
    RESTART: { '13': 1 }  // Enter，重新开始
}

Runner.prototype = {
    init: function () {
        this.createCanvas();
        this.loadImages();

        this.horizon = new HorizonLine(this.canvasEl, Runner.spriteDefinition.HORIZON);
        this.cloud = new Cloud(this.canvasEl, Runner.spriteDefinition.CLOUD, DEFAULT_WIDTH);
        this.night = new NightMode(this.canvasEl, Runner.spriteDefinition.MOON, DEFAULT_WIDTH);
        this.obstacle = new Obstacle(this.canvasEl, Obstacle.types[0], Runner.spriteDefinition[Obstacle.types[0].type], { WIDTH: 600 }, 0.6, 1);
        this.trex = new Trex(this.canvasEl, Runner.spriteDefinition.TREX);

        this.activated = true;
        this.paused = false;

        this.startListener();

        this.update();
    },

    /**
     * 加载图像
     */
    loadImages: function () {
        this.imgSprite = new Image();
        this.imgSprite.src = './assets/all.png';
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
     * 开始监听事件
     */
    startListener: function () {
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
    },

    /**
     * 按键按下
     * @param {*} e 
     */
    onKeyDown: function (e) {
        if (Runner.keycodes.JUMP[e.keyCode]) {
            if (!Trex.instance_.jumping) {
                Trex.instance_.startJump(6);
            }
        } else if (Runner.keycodes.DUCK[e.keyCode]) {
            if (!Trex.instance_.jumping) {
                Trex.instance_.setSpeedDrop();    //加速下降
            }
        }
    },

    /**
     * 按键松开
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
     * 更新页面
     */
    update: function (time) {
        if (!this.crashed) {
            this.startTime = this.startTime || 0;
            let deltaTime = 0;
            let speed = 4;
            let ctx = this.canvasCtx;

            //游戏从开始到当前经历的帧的数量++
            this.gameFrame++;

            //清除画面
            ctx.clearRect(0, 0, 600, 150);

            time = time || 0;
            deltaTime = time - this.startTime;

            //执行
            this.trex.update(deltaTime, this.trex.status);
            this.horizon.update(deltaTime, speed);
            this.cloud.updateClouds(0.2);
            this.night.invert(deltaTime);
            this.obstacle.updateObstacles(deltaTime, speed);

            //检测碰撞
            this.isCrashed(Obstacle.obstacles[0], this.trex);

            this.startTime = time;

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
        if (!this.crashed) {
            this.activated = true;
            this.paused = false;

            window.onload = function () {
                this.update();
            }.bind(this);
        }
    },

    /**
     * 游戏结束
     */
    gameOver: function () {
        console.log(this.raqId);
        window.cancelAnimationFrame(this.raqId);
        this.raqId = 0;
        this.crashed = true;
        this.trex.update(0, Trex.status.CRASHED);

        if (!this.gameOverPanel) {
            this.gameOverPanel = new GameOverPanel(this.canvasEl, Runner.spriteDefinition.TEXT_SPRITE,
                Runner.spriteDefinition.RESTART, this.dimensions);
        } else {
            this.gameOverPanel.draw();
        }
    }
}