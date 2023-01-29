/**
 * 
 * @param {HTMLCanvasElement} canvas 
 * @param {String} type 障碍物的类型
 * @param {Object} spriteImgPos 雪碧图坐标
 * @param {Object} dimensions 屏幕尺寸
 * @param {Number} gapCoeffcient 障碍物间隔
 * @param {Number} speed 障碍物移动速度
 * @param {Number} opt_xOffset 障碍物水平偏移量
 */
function Obstacle(canvas, type, spriteImgPos, dimensions, gapCoeffcient, speed, opt_xOffset) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.spritePos = spriteImgPos;
    //障碍物类型(仙人掌，翼龙)
    this.typeConfig = type;
    this.gapCoeffcient = gapCoeffcient;
    //每个障碍物的数量
    this.size = getRandomNum(1, Obstacle.MAX_OBSTACLE_LENGTH);
    this.dimensions = dimensions;
    //障碍物是否可以移除
    this.remove = false;
    //水平坐标
    this.xPos = dimensions.WIDTH + (opt_xOffset || 0);
    this.yPos = 0;
    this.width = 0;
    this.gap = 0;
    this.speedOffset = 0; //速度修正

    //障碍物的动画帧
    this.currentFrame = 0;
    //动画帧切换的计时器
    this.timer = 0;

    this.init(speed);
}

//存储障碍物的数组
Obstacle.obstacles = [];
//记录障碍物数组中障碍物的类型
Obstacle.obstacleHistory = [];
//障碍物最大间距系数
Obstacle.MAX_GAP_COEFFICIENT = 1.5;
//每组障碍物的最大数量
Obstacle.MAX_OBSTACLE_LENGTH = 3;
//相邻的障碍物类型的最大重复数
Obstacle.MAX_OBSTACLE_DUPLICATION = 2;

Obstacle.types = [
    {
        type: 'CACTUS_SMALL', //小仙人掌
        width: 17,  //宽
        height: 35, //高
        yPos: 105,  //在画布上的y坐标
        multipleSpeed: 4,
        minGap: 120,    //最小间距
        minSpeed: 0,    //最低速度
        collisionBoxes: [new CollisionBox(0, 7, 5, 27), new CollisionBox(4, 0, 6, 34), new CollisionBox(10, 4, 7, 14)] //碰撞盒子
    },
    {
        type: 'CACTUS_LARGE',   //大仙人掌
        width: 25,
        height: 50,
        yPos: 90,
        multipleSpeed: 7,
        minGap: 120,
        minSpeed: 0,
        collisionBoxes: [new CollisionBox(0, 12, 7, 38), new CollisionBox(8, 0, 7, 49), new CollisionBox(13, 10, 10, 38)]
    },
    {
        type: 'PTERODACTYL',    //翼龙
        width: 46,
        height: 40,
        yPos: [100, 75, 50], //有高、中、低三种高度
        multipleSpeed: 999,
        minSpeed: 8.5,
        minGap: 150,
        collisionBoxes: [new CollisionBox(15, 15, 16, 5), new CollisionBox(18, 21, 24, 6), new CollisionBox(2, 14, 4, 3), new CollisionBox(6, 10, 4, 7), new CollisionBox(10, 8, 6, 9)],
        numFrames: 2,   //有两个动画帧
        frameRate: 1000 / 6,  //动画帧的切换速率，这里为一秒6帧
        speedOffset: .8 //速度修正

    }
];

Obstacle.prototype = {
    init: function (speed) {
        //如果随机障碍物是翼龙，则只出现一只
        //翼龙的multipleSpeed是999，远大于speed
        if (this.size > 1 && this.typeConfig.multipleSpeed > speed) {
            this.size = 1;
        }
        if (this.size > 1) {//只针对仙人掌
            this.typeConfig.collisionBoxes[1].width = this.typeConfig.width - this.typeConfig.collisionBoxes[0].width - this.typeConfig.collisionBoxes[2].width;
            this.typeConfig.collisionBoxes[2].x = this.typeConfig.width - this.typeConfig.collisionBoxes[2].width;
        }
        //障碍物的总宽度等于单个障碍物的宽度乘以个数
        this.width = this.typeConfig.width * this.size;

        //若障碍物的纵坐标是一个数组，则随机选一个
        if (Array.isArray(this.typeConfig.yPos)) {
            let yPosConfig = this.typeConfig.yPos;
            this.yPos = yPosConfig[getRandomNum(0, yPosConfig.length - 1)];
        } else {
            this.yPos = this.typeConfig.yPos;
        }

        this.draw();

        //对翼龙的速度进行修正，让它看起来有的飞得快一点，有的飞得慢一点
        if (this.typeConfig.speedOffset) {
            this.speedOffset = Math.random() > 0.5 ? this.typeConfig.speedOffset : -this.typeConfig.speedOffset;
        }

        //障碍物之间的间隙，与游戏速度有关
        this.gap = this.getGap(this.gapCoeffcient, speed);
    },
    //障碍物之间的间隙，gapCoefficient为间隔系数
    getGap: function (gapCoeffcient, speed) {
        let minGap = Math.round(this.width * speed + this.typeConfig.minGap * gapCoeffcient);
        let maxGap = Math.round(minGap * Obstacle.MAX_GAP_COEFFICIENT);
        return getRandomNum(minGap, maxGap);
    },
    //判断障碍物是否移除屏幕外
    isVisible: function () {
        return this.xPos + this.width > 0;
    },
    draw: function () {
        //障碍物宽高
        let sourceWidth = this.typeConfig.width;
        let sourceHeight = this.typeConfig.height;

        //根据障碍物数量计算障碍物在雪碧图上的x坐标
        //this.size的取值范围是1-3
        let sourceX = (sourceWidth * this.size) * (0.5 * (this.size - 1)) + this.spritePos.x;

        //如果当前动画帧大于0，说明障碍物类型是翼龙
        //更新翼龙的雪碧图使其匹配第二帧动画,使得翅膀挥舞
        //TODO
        if (this.currentFrame > 0) {
            sourceX += sourceWidth * this.currentFrame;
        }

        this.ctx.drawImage(Runner.instance_.imgSprite,
            sourceX, this.spritePos.y,
            sourceWidth * this.size, sourceHeight,
            this.xPos, this.yPos,
            sourceWidth * this.size, sourceHeight);
    },
    //单个障碍物的移动
    update: function (deltaTime, speed) {
        //如果障碍物没有移出屏幕外
        if (!this.remove) {
            //如果有速度修正则修正速度
            if (this.typeConfig.speedOffset) {
                speed += this.speedOffset;
            }
            //更新x坐标
            this.xPos -= Math.floor((speed * FPS / 1000) * deltaTime);
            //翼龙动画帧更新
            if (this.typeConfig.numFrames) {
                this.timer += deltaTime;
                if (this.timer >= this.typeConfig.frameRate) {
                    //在两个动画帧之间来回切换以达到动画效果（0,1）
                    this.currentFrame = this.currentFrame === this.typeConfig.numFrames - 1 ? 0 : this.currentFrame + 1;
                    //重置
                    this.timer = 0;
                }
            }
            this.draw();

            if (!this.isVisible()) {
                this.remove = true;
            }
        }
    },
    //管理多个障碍物移动
    updateObstacles: function (deltaTime, currentSpeed) {
        //保存有一个障碍物列表的副本
        let updateObstacles = Obstacle.obstacles.slice(0);

        for (let i = 0; i < Obstacle.obstacles.length; i++) {
            let obstacle = Obstacle.obstacles[i];
            obstacle.update(deltaTime, currentSpeed);

            //移出被标记为删除的障碍物
            if (obstacle.remove) {
                updateObstacles.shift();
            }
        }
        Obstacle.obstacles = updateObstacles;

        if (Obstacle.obstacles.length > 0) {
            //获取障碍物列表中的最后一个障碍物
            let lastObstacle = Obstacle.obstacles[Obstacle.obstacles.length - 1];
            //若满足间距条件则添加障碍物
            if (lastObstacle &&
                lastObstacle.isVisible() &&
                (lastObstacle.xPos + lastObstacle.width + lastObstacle.gap) < this.dimensions.WIDTH) {
                this.addNewObstacle(currentSpeed);
            }
        } else {//没有就添加
            this.addNewObstacle(currentSpeed);
        }
    },
    //随机添加障碍
    addNewObstacle: function (currentSpeed) {
        //随机选取一种类型的障碍
        let obstacleTypeIndex = getRandomNum(0, Obstacle.types.length - 1);
        let obstacleType = Obstacle.types[obstacleTypeIndex];

        //检查随机取到的障碍物类型是否与前两个重复
        //或者检查其速度是否合法，这样可以保证游戏在低速时不出现翼龙
        //如果检查不通过，则重新再选一次直到通过为止
        if (this.duplicateObstacleCheck(obstacleType.type) || currentSpeed < obstacleType.minSpeed) {
            this.addNewObstacle(currentSpeed);
        } else {
            //检查通过，获取其雪碧图中的坐标
            let obstacleSpritePos = Runner.spriteDefinition[obstacleType.type];
            //生成新的障碍物并存入数组
            Obstacle.obstacles.push(new Obstacle(this.canvas, obstacleType, obstacleSpritePos, this.dimensions,
                this.gapCoeffcient, currentSpeed, obstacleType.width));
            //同时将障碍物的类型存入history数组
            Obstacle.obstacleHistory.unshift(obstacleType.type);
        }

        //若history数组的长度大于1，则清空最前面的两个障碍物类型
        if (Obstacle.obstacleHistory.length > 1) {
            Obstacle.obstacleHistory.splice(Obstacle.MAX_OBSTACLE_DUPLICATION);
        }
    },
    //检查障碍物是否超过允许的最大重复数
    duplicateObstacleCheck: function (nextObstacleType) {
        let duplicateCount = 0;
        //与history数组中的障碍物类型比较，最大只允许重复两次
        for (let i = 0; i < Obstacle.obstacleHistory.length; i++) {
            duplicateCount = Obstacle.obstacleHistory[i] === nextObstacleType ? duplicateCount + 1 : 0;
        }
        return duplicateCount >= Obstacle.MAX_OBSTACLE_DUPLICATION;
    }
}

