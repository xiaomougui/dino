GameOverPanel.dimensions = {
    TEXT_X: 0,
    TEXT_Y: 13, //数字下面
    TEXT_WIDTH: 191,
    TEXT_HEIGHT: 11,
    RESTART_WIDTH: 36,
    RESTART_HEIGHT: 32
};

/**
 * 
 * @param {*} canvas 
 * @param {*} textImgPos 
 * @param {*} restartImgPos 
 * @param {*} dimensions 
 */
function GameOverPanel(canvas, textImgPos, restartImgPos, dimensions) {
    this.canvas = canvas;
    this.canvasCtx = canvas.getContext('2d');
    this.canvasDimensions = dimensions;
    this.textImgPos = textImgPos;
    this.restartImgPos = restartImgPos;
    this.controlIndex = 0;
}

GameOverPanel.prototype = {
    /**
     * 绘制出重新开始按钮
     * @returns Promise
     */
    draw: function () {
        return new Promise((reslove, reject) => {
            let dimensions = GameOverPanel.dimensions;

            let centerX = this.canvasDimensions.WIDTH / 2;

            // Game over text
            let textSourceX = dimensions.TEXT_X;
            let textSourceY = dimensions.TEXT_Y;
            let textSourceWidth = dimensions.TEXT_WIDTH;
            let textSourceHeight = dimensions.TEXT_HEIGHT;

            let textTargetX = Math.round(centerX - (dimensions.TEXT_WIDTH / 2));
            let textTargetY = Math.round((this.canvasDimensions.HEIGHT - 25) / 3);
            let textTargetWidth = dimensions.TEXT_WIDTH;
            let textTargetHeight = dimensions.TEXT_HEIGHT;

            let restartSourceWidth = dimensions.RESTART_WIDTH;
            let restartSourceHeight = dimensions.RESTART_HEIGHT;
            let restartTargetX = centerX - (dimensions.RESTART_WIDTH / 2);
            let restartTargetY = this.canvasDimensions.HEIGHT / 2;

            textSourceX += this.textImgPos.x;
            textSourceY += this.textImgPos.y;

            // Game over text from sprite.
            this.canvasCtx.drawImage(Runner.instance_.imgSprite, textSourceX, textSourceY, textSourceWidth, textSourceHeight, textTargetX, textTargetY, textTargetWidth, textTargetHeight);

            //TODO
            // Restart button.
            this.canvasCtx.drawImage(Runner.instance_.imgSprite, this.restartImgPos.x + restartSourceWidth, this.restartImgPos.y, restartSourceWidth, restartSourceHeight, restartTargetX, restartTargetY, dimensions.RESTART_WIDTH, dimensions.RESTART_HEIGHT);
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    this.canvasCtx.drawImage(Runner.instance_.imgSprite, this.restartImgPos.x + restartSourceWidth * i, this.restartImgPos.y, restartSourceWidth, restartSourceHeight, restartTargetX, restartTargetY, dimensions.RESTART_WIDTH, dimensions.RESTART_HEIGHT);
                    if (i = 7) {
                        reslove(true);
                    }
                }, 300);
            }

        })
    },
};

