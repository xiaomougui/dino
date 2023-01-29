/**
 * 碰撞盒子
 * @param {Number} x 盒子x坐标
 * @param {Number} y 盒子y坐标
 * @param {Number} w 盒子宽度
 * @param {Number} h 盒子高度
 */
function CollisionBox(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
}

/**
 * 大致检测是否碰撞
 * @param {CollisionBox} tRexBox 
 * @param {CollisionBox} obstacleBox 
 * @returns 是否碰撞
 */
function boxCompare(tRexBox, obstacleBox) {
    let tRexBoxX = tRexBox.x,
        tRexBoxY = tRexBox.y,
        obstacleBoxX = obstacleBox.x,
        obstacleBoxY = obstacleBox.y;

    //x,y方向双重叠代表碰撞
    return tRexBoxX < obstacleBoxX + obstacleBox.width &&
        tRexBoxX + tRexBox.width > obstacleBoxX &&
        tRexBoxY < obstacleBoxY + obstacleBox.height &&
        tRexBoxY + tRexBox.height > obstacleBoxY;
}

/**
 * 细致检测是否碰撞
 * @param {Obstacle} obstacle 
 * @param {Trex} tRex 
 * @returns 碰撞的盒子
 */
function checkForCollision(obstacle, tRex) {
    //创建最外层的大盒子
    let tRexBox = new CollisionBox(tRex.xPos + 1, tRex.yPos + 1, tRex.config.WIDTH - 2, tRex.config.HEIGHT - 2);
    let obstacleBox = new CollisionBox(obstacle.xPos + 1, obstacle.yPos + 1,
        obstacle.typeConfig.width * obstacle.size - 2, obstacle.typeConfig.height - 2);
    if (boxCompare(tRexBox, obstacleBox)) { //如果大盒子相撞
        let collisionBoxes = obstacle.typeConfig.collisionBoxes;
        let tRexCollisionBoxes = tRex.ducking ? Trex.collisionBoxes.DUCKING : Trex.collisionBoxes.RUNNING;

        for (let t = 0; t < tRexCollisionBoxes.length; t++) {
            for (let i = 0; i < collisionBoxes.length; i++) {
                //修正盒子,进行对比
                let adjTrexBox = createAdjustedCollisionBox(tRexCollisionBoxes[t], tRexBox);
                let adjObstacleBox = createAdjustedCollisionBox(collisionBoxes[i], obstacleBox);
                let crashed = boxCompare(adjTrexBox, adjObstacleBox);

                if (crashed) {
                    return [adjTrexBox, adjObstacleBox];
                }
            }
        }
    }
}

/**
 * 修正盒子的数值
 * @param {CollisionBox} box 碰撞盒子
 * @param {Object} adjustment 要修正的对象
 * @returns 
 */
function createAdjustedCollisionBox(box, adjustment) {
    return new CollisionBox(box.x + adjustment.x, box.y + adjustment.y, box.width, box.height);
}

