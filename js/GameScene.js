function logToFile(message) {
  fetch('http://localhost:9000/log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message })
  }).catch(err => console.error('Failed to log:', err));
}

function exitedDetermination() {
  console.log("exited");
  logToFile("Game exited");
}
function gameCompleted(score) {
  console.log("game Completed - Score:", score);
  logToFile(`Game completed - Total points: ${score}`);
}

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }
  create() {
    console.log("game");
    this.initialRoadSpeed = 300;
    this.speedIncrease = 1; //1,0,-1
    this.speedIncreaseRate = 0.3; //in every 10 second
    this.obstacleSpawnRate = 2;
    this.coinSpawnRate = 2.5;
    this.jaziItemSpawnRate = 0.4;
    this.gameDuration = 60;
    this.coinPoints = 5;
    this.jaziItemPoints = 25;
    this.obstaclePointsPenalty = 5;
    this.maxSpeed = 500;

    // for adjust
    this.gameSpeed = 2;
    this.gameSpeedForIncrease = this.gameSpeed;
    this.score = 0;
    this.timer = 0;
    this.paused = false;
    this.finishLineTime = this.gameDuration - 1;
    this.finishCreated = false;
    this.finised = false;

    this.lene = [140, 250, 350, 460];
    this.currentCarLane = Phaser.Utils.Array.GetRandom(this.lene);
    this.currentCoinLane = Phaser.Utils.Array.GetRandom(this.lene);
    // this.scene.start("EndScene", {
    //   won: false,
    //   score: 12345546745654,
    //   time: this.gameDuration,
    // });
    this.bgAudio = this.sound.add("bgaudio", { loop: true, volume: 0.5 });
    this.bgAudio.play();

    this.directionInput = this.add
      .rectangle(0, 0, 600, 1300, 0x000000)
      .setOrigin(0)
      .setAlpha(0.4)
      .setInteractive();

    this.scaleBg = 2.6;
    this.bg = this.add
      .tileSprite(300, 650, 600 * this.scaleBg, 1300 * this.scaleBg, "bg")
      .setScale(1 / this.scaleBg);
    this.crossBtn = this.add
      .image(50, 50, "ic_cross")
      .setOrigin(0.5)
      .setDepth(10)
      .setScale(0.3)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.tweens.add({
          targets: this.crossBtn,
          scale: 0.26,
          duration: 100,
          ease: "Power1",
          onComplete: () => {
            this.tweens.add({
              targets: this.crossBtn,
              scale: 0.3,
              duration: 100,
              ease: "Power1",
              onComplete: () => {
                this.pauseMenu();
              },
            });
          },
        });
      });

    this.timerBG = this.add
      .image(20, 100, "timer")
      .setOrigin(0, 0)
      .setScale(0.55)
      .setDepth(10);
    this.scoreBG = this.add
      .image(580, 100, "score")
      .setOrigin(1, 0)
      .setScale(0.55)
      .setDepth(10);
    this.timerText = this.add
      .text(78, 130, `0`, {
        fontFamily: "Nunito, sans-serif",
        fontStyle: "bold ",
        fontSize: "25px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(10);
    this.updateTime(0);
    this.scoreText = this.add
      .text(600 - 150, 130, "0", {
        fontFamily: "Nunito, sans-serif",
        fontStyle: "bold ",
        fontSize: "25px",
        color: "#ffffff",
      })
      .setOrigin(0, 0.5)
      .setDepth(10);
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.gameDuration > 0) {
          this.finishLineTime--;
          this.updateTime(-1);
        } else {
          this.time.removeAllEvents();
          console.log("Time over!");
          this.timerEvent = this.time.addEvent({
            delay: 200,
            callback: () => {
              this.killAllTimeEvents();
              // this.scene.start("EndScene", {
              //   won: false,
              //   score: this.score,
              //   time: this.gameDuration,
              // });
            },
          });
        }
      },
      loop: true,
    });

    // Player car
    this.player = this.physics.add.sprite(250, 900, "ic_jazi_car");
    this.player.setCollideWorldBounds(true);
    this.playerScale = 0.4;
    this.player.setScale(this.playerScale).setDepth(5).setOrigin(0.5, 0);

    this.currentLaneIndex = 1;
    this.lanes = [140, 250, 350, 460];
    this.player.x = this.lanes[this.currentLaneIndex];

    const overlapItems = [
      { key: "obstacles", callback: this.hitObstacle },
      { key: "trophy", callback: this.hitTrophy },
      { key: "bonusTime", callback: this.hitbonusTime },
      { key: "coins", callback: this.hitCoins },
      { key: "finishLine", callback: this.hitFinishLine },
    ];

    overlapItems.forEach(({ key }) => {
      this[key] = this.physics.add.group();
    });

    overlapItems.forEach(({ key, callback }) => {
      this.physics.add.overlap(this.player, this[key], callback, null, this);
    });

    this.controlls();

    this.speedIncreaseEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.gameSpeed < this.maxSpeed) {
          this.gameSpeed +=
            this.gameSpeedForIncrease * this.speedIncreaseRate * 0.1;

          // Update spawn delays dynamically
          this.obstacleSpawnEvent.delay =
            1000 / (this.gameSpeed * 0.5 * this.obstacleSpawnRate);
          this.coinSpawnEvent.delay =
            1000 /
            (this.gameSpeed *
              0.5 *
              (this.coinSpawnRate + this.jaziItemSpawnRate));

          // Optional: speed up background scrolling smoothly
          if (this.myFunctionEvent) {
            this.myFunctionEvent.callback = () => {
              this.bg.tilePositionY -= 5 * this.gameSpeed * this.scaleBg;
            };
          }
        }
      },
      loop: true,
    });

    this.coinSpawnEvent = this.time.addEvent({
      delay:
        1000 /
        (this.gameSpeed * 0.5 * (this.coinSpawnRate + this.jaziItemSpawnRate)),
      callback: this.spawnCoins,
      callbackScope: this,
      loop: true,
    });

    this.obstacleSpawnEvent = this.time.addEvent({
      delay: 1000 / (this.gameSpeed * 0.5 * this.obstacleSpawnRate),
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true,
    });

    this.myFunctionEvent = this.time.addEvent({
      delay: 1000 / 60,
      loop: true,
      callback: () => {
        this.bg.tilePositionY -= 5 * this.gameSpeed * this.scaleBg;
      },
    });
  }
  controlls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.cursorActive = false;
    this.isDragging = false;
    this.minX = 100; // Left boundary
    this.maxX = 500; // Right boundary

    // Touch drag controls - car follows finger
    this.directionInput.on("pointerdown", (pointer) => {
      this.isDragging = true;
    });

    this.directionInput.on("pointermove", (pointer) => {
      if (!this.isDragging) return;

      // Smoothly move car to follow finger position
      let targetX = pointer.x;

      // Constrain to game boundaries
      targetX = Phaser.Math.Clamp(targetX, this.minX, this.maxX);

      // Smooth follow with interpolation
      this.player.x = Phaser.Math.Linear(this.player.x, targetX, 0.3);

      // Calculate tilt angle based on movement direction
      const deltaX = targetX - this.player.x;
      if (Math.abs(deltaX) > 2) {
        const tiltAngle = Phaser.Math.Clamp(deltaX * 0.3, -15, 15);
        this.player.angle = tiltAngle;
      } else {
        this.player.angle = 0;
      }
    });

    this.directionInput.on("pointerup", (pointer) => {
      this.isDragging = false;

      // Snap to nearest lane when released
      let closestLane = this.lanes[0];
      let minDistance = Math.abs(this.player.x - closestLane);

      for (let i = 1; i < this.lanes.length; i++) {
        const distance = Math.abs(this.player.x - this.lanes[i]);
        if (distance < minDistance) {
          minDistance = distance;
          closestLane = this.lanes[i];
          this.currentLaneIndex = i;
        }
      }

      // Smooth return to center of lane
      this.tweens.add({
        targets: this.player,
        x: closestLane,
        angle: 0,
        duration: 150,
        ease: "Power2",
      });
    });

    this.input.on("pointerupoutside", () => {
      if (this.isDragging) {
        this.isDragging = false;

        // Snap to nearest lane
        let closestLane = this.lanes[0];
        let minDistance = Math.abs(this.player.x - closestLane);

        for (let i = 1; i < this.lanes.length; i++) {
          const distance = Math.abs(this.player.x - this.lanes[i]);
          if (distance < minDistance) {
            minDistance = distance;
            closestLane = this.lanes[i];
            this.currentLaneIndex = i;
          }
        }

        this.tweens.add({
          targets: this.player,
          x: closestLane,
          angle: 0,
          duration: 150,
          ease: "Power2",
        });
      }
    });

    this.input.keyboard.on("keydown-LEFT", () => {
      if (!this.cursorActive && this.currentLaneIndex > 0) {
        this.cursorActive = true;
        this.currentLaneIndex--;
        this.tweens.add({
          targets: this.player,
          angle: -10,
          scale: this.playerScale * 1.1,
          duration: 50,
          yoyo: true,
          ease: "Power2",
        });
        this.tweens.add({
          targets: this.player,
          x: this.lanes[this.currentLaneIndex],
          duration: 100,
          ease: "Power2",
          onComplete: () => {
            this.cursorActive = false; // allow next pointer press
          },
        });
      }
    });

    // this.input.keyboard.on("keyup-LEFT", () => {
    //   this.cursorActive = false;
    // });

    this.input.keyboard.on("keydown-RIGHT", () => {
      if (!this.cursorActive && this.currentLaneIndex < this.lanes.length - 1) {
        this.cursorActive = true;
        this.currentLaneIndex++;
        this.tweens.add({
          targets: this.player,
          angle: +10,
          scale: this.playerScale * 1.1,
          duration: 50,
          yoyo: true,
          ease: "Power2",
        });
        this.tweens.add({
          targets: this.player,
          x: this.lanes[this.currentLaneIndex],
          duration: 100,
          ease: "Power2",
          onComplete: () => {
            this.cursorActive = false; // allow next pointer press
          },
        });
      }
    });

    // this.input.keyboard.on("keyup-RIGHT", () => {
    //   this.cursorActive = false;
    // });
  }
  pauseMenu() {
    this.pauseGame();
    this.exitMenuItems = [];
    this.blurBg = this.add.image(0, 0, "blurBg").setOrigin(0, 0).setDepth(11);
    this.exitMenu = this.add
      .image(300, 450, "ic_dialog")
      .setOrigin(0.5, 0)
      .setDepth(11)
      .setScale(0.75);
    this.yesBtn = this.add
      .image(300, 720, "btn_yes")
      .setOrigin(0.5)
      .setDepth(11)
      .setScale(0.7)
      .setInteractive({ useHandCursor: true });
    this.crossBtnP = this.add
      .image(525, 492, "ic_close_dialog")
      .setOrigin(0.5)
      .setDepth(11)
      .setScale(1.6)
      .setInteractive({ useHandCursor: true });

    this.exitMenuItems.push(this.blurBg);
    this.exitMenuItems.push(this.exitMenu);
    this.exitMenuItems.push(this.yesBtn);
    this.exitMenuItems.push(this.crossBtnP);

    this.yesBtn.on("pointerdown", () => {
      this.tweens.add({
        targets: this.yesBtn,
        scale: 0.6,
        duration: 100,
        ease: "Power1",
        yoyo: true,
        onComplete: () => {
          this.resumeGame();
          this.killAllTimeEvents();
          this.bgAudio.stop();
          this.bgAudio.destroy();
          exitedDetermination();
          this.scene.start("StartScene");
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
          this.exitMenuItems.forEach((item) => {
            if (item) {
              item.destroy();
            }
          });
          this.exitMenuItems = [];
          this.resumeGame();
        },
      });
    });
  }

  pauseGame() {
    if (this.paused) return;
    this.paused = true;
    // this.tweens.getAllTweens().forEach((tween) => tween.pause());
    this.time.paused = true;
    this.physics.world.pause();
    this.sound.pauseAll();
  }

  resumeGame() {
    if (!this.paused) return;
    this.paused = false;
    // this.tweens.getAllTweens().forEach((tween) => tween.resume());
    this.time.paused = false;
    this.physics.world.resume();
    this.sound.resumeAll();
  }

  updateTime(add) {
    this.gameDuration = this.gameDuration + add;
    this.timerText.setText(
      `${Math.floor(this.gameDuration / 60)}:${(this.gameDuration % 60)
        .toString()
        .padStart(2, "0")}`
    );
  }
  updateScore(add) {
    this.score += add;
    if (this.score < 0) {
      this.score = 0;
    }
    const color = add > 0 ? 0x22ff22 : 0xff2222;
    let addTextValue = add > 0 ? `+${add}` : `${add}`;
    let addText = this.add
      .text(this.player.x, this.player.y, addTextValue, {
        fontFamily: "Nunito, sans-serif",
        // fontStyle: "bold",
        fontSize: "45px",
        color: `#${color.toString(16).padStart(6, "0")}`,
      })
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({
      targets: addText,
      y: this.player.y - 50,
      alpha: 0,
      duration: 500,
      ease: "Power1",
      onComplete: () => {
        addText.destroy();
      },
    });

    if (add < 0) {
      this.tweens.add({
        targets: this.player,
        y: this.player.y - 8,
        scale: this.playerScale * 1.05,
        duration: 50,
        ease: "Power2",
        onComplete: () => {
          this.tweens.add({
            targets: this.player,
            y: this.player.y + 8,
            scale: this.playerScale * 1.05,
            duration: 50,
            ease: "Power2",
          });
        },
      });
    }

    this.scoreText.setText(this.score);
    // const oldScore = this.displayedScore || this.score - add; // previous visible value
    // const newScore = this.score;
    // this.displayedScore = oldScore;
    // this.tweens.addCounter({
    //   from: oldScore,
    //   to: newScore,
    //   duration: 400,
    //   ease: "Linear",
    //   onUpdate: (tween) => {
    //     const value = Math.floor(tween.getValue());
    //     this.scoreText.setText(value);
    //   },
    //   onComplete: () => {
    //     this.displayedScore = newScore;
    //   },
    // });
  }

  update() {
    // if (
    //   this.cursors.left.isDown &&
    //   !this.moveDirMouse.left &&
    //   this.currentLaneIndex > 0
    // ) {
    //   this.currentLaneIndex--;
    //   this.moveDirMouse.left = true; // prevent continuous movement
    //   this.tweens.add({
    //     targets: this.player,
    //     x: this.lanes[this.currentLaneIndex],
    //     duration: 200,
    //     ease: "Power2",
    //   });
    //   this.tweens.add({
    //     targets: this.player,
    //     angle: -20,
    //     duration: 150,
    //     scale: this.playerScale * 1.2,
    //     yoyo: true,
    //     ease: "Power2",
    //   });
    // } else if (
    //   (this.cursors.right.isDown || this.moveDir.right) &&
    //   this.currentLaneIndex < this.lanes.length - 1
    // ) {
    //   this.currentLaneIndex++;
    //   this.moveDir.right = false;
    //   this.tweens.add({
    //     targets: this.player,
    //     x: this.lanes[this.currentLaneIndex],
    //     duration: 200,
    //     ease: "Power2",
    //   });
    //   this.tweens.add({
    //     targets: this.player,
    //     angle: +20,
    //     scale: this.playerScale * 1.2,
    //     duration: 150,
    //     yoyo: true,
    //     ease: "Power2",
    //   });
    // }
    // Up/down movement (optional smooth)
    // let vy = 0;
    // if (this.cursors.up.isDown || this.moveDir.upDown === -1) vy = -300;
    // else if (this.cursors.down.isDown || this.moveDir.upDown === 1) vy = 300;
    // this.player.setVelocityY(vy);
    // Reset up/down input
    // if (vy === 0) this.moveDir.upDown = 0;
  }

  spawnCoins() {
    let x = Phaser.Utils.Array.GetRandom(this.lene);
    while (this.currentCoinLane === x || this.currentCarLane == x) {
      x = Phaser.Utils.Array.GetRandom(this.lene);
    }
    this.currentCoinLane = x;

    if (this.finishLineTime <= 0) {
      this.finised = true;
    }

    let randomObstacle = Phaser.Math.Between(
      1,
      this.coinSpawnRate * 10 + this.jaziItemSpawnRate * 10
    );
    if (randomObstacle < this.jaziItemSpawnRate * 10) {
      if (Phaser.Math.Between(1, 2) <= 1) {
        const obstacleKey = "ic_gift_box";
        const obstacle = this.bonusTime.create(x, -140, obstacleKey);
        obstacle.setVelocityY(this.gameSpeed * this.initialRoadSpeed);
        obstacle.setScale(1.3);

        this.time.delayedCall(7000, () => {
          if (obstacle) {
            obstacle.destroy();
          }
        });
      } else {
        const obstacleKey = "ic_trophy";
        const obstacle = this.trophy.create(x, -140, obstacleKey);
        obstacle.setVelocityY(this.gameSpeed * this.initialRoadSpeed);
        obstacle.setScale(0.35);
        this.time.delayedCall(7000, () => {
          if (obstacle) {
            obstacle.destroy();
          }
        });
      }
    } else {
      const obstacleKey = "ic_icon";
      const obstacle = this.coins.create(x, -140, obstacleKey);
      obstacle.setVelocityY(this.gameSpeed * this.initialRoadSpeed);
      obstacle.setScale(0.4);
      this.time.delayedCall(7000, () => {
        if (obstacle) {
          obstacle.destroy();
        }
      });
    }
    if (!this.finised) {
    } else {
      if (!this.finishCreated) {
        this.finishCreated = true;
        const obstacleKey = "ic_finish_line";
        const obstacle = this.finishLine.create(300, -100, obstacleKey);
        obstacle.setVelocityY(this.gameSpeed * this.initialRoadSpeed);
        obstacle.setScale(0.37);
        obstacle.setOrigin(0.5, 1);
        // this.time.delayedCall(7000, () => {
        //   if (obstacle) {
        //     obstacle.destroy();
        //   }
        // });
      }
    }
  }
  spawnObstacle() {
    let x = Phaser.Utils.Array.GetRandom(this.lene);
    while (this.currentCoinLane == x || this.currentCarLane == x) {
      x = Phaser.Utils.Array.GetRandom(this.lene);
    }
    this.currentCarLane = x;

    const obstacleKey = "ic_blocker_" + Phaser.Math.Between(1, 5);
    const obstacle = this.obstacles.create(x, -100, obstacleKey);
    obstacle.setVelocityY(this.gameSpeed * this.initialRoadSpeed * 0.9);
    obstacle.setScale(1.6);
    obstacle.setDepth(3);
    this.time.delayedCall(7000, () => {
      if (obstacle) {
        obstacle.destroy();
      }
    });
  }

  hitObstacle(player, obstacle) {
    obstacle.disableBody(true, true);
    obstacle.disableBody(true, true);
    this.updateScore(-this.obstaclePointsPenalty);
  }

  hitCoins(player, obstacle) {
    obstacle.disableBody(true, true);
    this.updateScore(this.coinPoints);
  }
  hitTrophy(player, obstacle) {
    obstacle.disableBody(true, true);
    this.updateScore(this.jaziItemPoints);
  }
  hitbonusTime(player, obstacle) {
    obstacle.disableBody(true, true);
    this.updateScore(this.jaziItemPoints);
  }
  hitFinishLine(player, obstacle) {
    this.bgAudio.stop();

    this.timerEvent = this.time.addEvent({
      delay: 100,
      callback: () => {
        obstacle.disableBody(true, true);
        // this.killAllTimeEvents();
        gameCompleted(this.score);
        this.scene.start("EndScene", {
          won: false,
          score: this.score,
          time: this.gameDuration,
        });
      },
    });
  }
  killAllTimeEvents() {
    this.timerEvent.remove(false);
    this.timerEvent = null;
    this.speedIncreaseEvent.remove(false);
    this.speedIncreaseEvent = null;
    this.coinSpawnEvent.remove(false);
    this.coinSpawnEvent = null;
    this.obstacleSpawnEvent.remove(false);
    this.obstacleSpawnEvent = null;
    this.myFunctionEvent.remove(false);
    this.myFunctionEvent = null;
  }
}

export default GameScene;
