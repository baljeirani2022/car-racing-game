class EndScene extends Phaser.Scene {
  constructor() {
    super({ key: "EndScene" });
  }

  init(data) {
    this.won = data.won;
    this.score = data.score;
    this.finishTime = data.time;
  }

  create() {
    // Background
    this.paused = true;
    this.endMenuItems = [];
    this.blurBg = this.add.image(0, 0, "blurBg").setOrigin(0, 0).setDepth(11);
    this.endMenu = this.add
      .image(300, 450, "gameOver")
      .setOrigin(0.5, 0)
      .setDepth(11)
      .setScale(1);
    this.scoreText = this.add
      .text(300, 706, this.score, {
        fontFamily: "Nunito, sans-serif",
        fontStyle: "bold italic",
        fontSize: "45px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(11)
      .setInteractive({ useHandCursor: true });
    this.crossBtnP = this.add
      .image(525, 492, "ic_close_dialog")
      .setOrigin(0.5)
      .setDepth(11)
      .setScale(1.6)
      .setInteractive({ useHandCursor: true });

    this.endMenuItems.push(this.blurBg);
    this.endMenuItems.push(this.endMenu);
    this.endMenuItems.push(this.yesBtn);
    this.endMenuItems.push(this.crossBtnP);

    this.scoreText.on("pointerdown", () => {
      this.tweens.add({
        targets: this.scoreText,
        scale: 0.6,
        duration: 100,
        ease: "Power1",
        yoyo: true,
        onComplete: () => {
          // this.scene.start("StartScene");
        },
      });
    });
    this.crossBtnP.on("pointerdown", () => {
      this.tweens.add({
        targets: this.crossBtnP,
        scale: 1.3,
        duration: 100,
        ease: "Power1",
        yoyo: true,
        onComplete: () => {
          this.endMenuItems.forEach((item) => {
            if (item) {
              item.destroy();
            }
          });
          this.endMenuItems = [];
          this.scene.start("StartScene");
        },
      });
    });
  }
}

export default EndScene;
