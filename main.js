
window.onload = function () {
  display.titleTimer.tick()

  game.aiSpeed = game.config.aiBaseSpeed
  game.aiMoveSpeedModifier = game.config.aiBaseMoveSpeedModifier
}

$('#rumble-nav').click(function () {
  $('#nav').hide()
  game.createChar()
})

$('#ai-rumble-nav').click(function () {
  $('#nav').hide()
  game.aiRumble()
})

let game = {
  config: {
    baseHealth: 20,
    healthMultiplier: 2,
    resistanceModifier: .04,
    resistanceLimit: .90,
    lifeStealModifier: .05,
    rollAmount: 6,
    baseStatPoints: 20,
    baseMaxHealthPoints: 10,
    baseMaxAttackPoints: 10,
    baseMaxDefencePoints: 10,
    playerFightSpeed: 300,
    playerDamageMitigation: .1,
    spawnLevelSplit: 1.3,
    aiBaseSpeed: 1000,
    aiMaxSpeed: 50,
    aiBaseMoveSpeedModifier: .04,
    renderSpeed: 33,
    xTileCount: 8,
    yTileCount: 8,
  },
  playerEmoticon: null,
  lastCharStats: null,
  gameOverState: false,
  aiSpeed: null,
  aiMoveSpeedModifier: null,
  board: [],
  leaderboard: [],
  aiMoveTimers: [],
  fightTimers: [],
  createBoard: function () {
    game.config.xTileCount = Math.floor((window.innerWidth - 20) / display.tileSize)
    game.config.yTileCount = Math.floor((window.innerHeight - 120) / display.tileSize)

    game.board = Array(game.config.yTileCount).fill(null).map(() => new Array(game.config.xTileCount).fill(null))
  },
  createAIMoveTimer(e1) {
    let timer = {
      emoticon: e1,
      timer: null,
      tick(thisTimer) {
        if (thisTimer === undefined)
          thisTimer = this

        if (!thisTimer.emoticon.inCombat)
          thisTimer.emoticon.moveToTarget()

        let moveSpeedMultiplier = 1 - (thisTimer.emoticon.level * game.aiMoveSpeedModifier)
        let moveSpeed = Math.floor((game.aiSpeed * moveSpeedMultiplier) + getRandomInt(100))
        if (moveSpeed < game.config.aiMaxSpeed)
          moveSpeed = game.config.aiMaxSpeed



        thisTimer.timer = window.setTimeout(thisTimer.tick, moveSpeed, thisTimer);
      },
      stopTimer() {
        clearTimeout(this.timer)
      }
    }
    timer.tick()
    game.aiMoveTimers.push(timer)
  },
  removeAIMoveTimer(e1) {
    game.aiMoveTimers.forEach(t => {
      if (t.emoticon === e1) {
        t.stopTimer()
        const index = game.aiMoveTimers.indexOf(t)
        if (index > -1) {
          game.aiMoveTimers.splice(index, 1)
        }
      }
    })
  },
  removeFightTimer(fightTimer) {
    game.fightTimers.forEach(t => {
      if (t.timer === fightTimer.timer) {
        t.stopTimer()
        const index = game.fightTimers.indexOf(t)
        if (index > -1) {
          game.fightTimers.splice(index, 1)
        }
      }
    })
  },
  isEmpty(posX, posY) {
    if (posX < 0 || posX > game.config.xTileCount - 1 || posY < 0 || posY > game.config.yTileCount - 1)
      return null

    if (game.board[posY][posX] === null)
      return true
    else
      return false
  },
  isEmoticon(posX, posY) {
    if (posX < 0 || posX > game.config.xTileCount - 1 || posY < 0 || posY > game.config.yTileCount - 1)
      return null

    if (game.board[posY][posX] instanceof Emoticon) {
      return true
    }
    else {
      return false
    }
  },
  findEmoticon(e1) {
    for (let y = 0; y < game.board.length; y++) {
      let x = game.board[y].indexOf(e1)
      if (x > -1) {
        return [x, y]
      }
    }
    return null
  },
  spawnEmoticon(level, e1) {
    let spawnLimit = Math.floor((game.config.xTileCount + game.config.yTileCount) / 2)
    if (level === undefined || level < 1) {
      level = 1
    }
    if (game.aiMoveTimers.length < spawnLimit) {
      let spawnAttempts = 20
      while (spawnAttempts > 0) {
        let posX = getRandomInt(game.config.xTileCount)
        let posY = getRandomInt(game.config.yTileCount)
        if (game.isEmpty(posX, posY) && !game.isEmoticon(posX + 1, posY) && !game.isEmoticon(posX, posY + 1) && !game.isEmoticon(posX - 1, posY) && !game.isEmoticon(posX, posY - 1)) {
          if (e1 === undefined)
            e1 = new Emoticon()
          if (level > 1) {
            for (let i = 1; i < level; i++) {
              e1.levelUp()
            }
          }
          game.board[posY][posX] = e1
          if (!e1.player)
            game.createAIMoveTimer(game.board[posY][posX])
          break
        }
        spawnAttempts--
      }

    }
  },
  startingSpawn(type) {
    if (type === 'player')
      game.spawnEmoticon(1, game.playerEmoticon)

    let startSpawnAmount = Math.floor((game.config.xTileCount + game.config.yTileCount) / 3)
    if (startSpawnAmount < 2)
      startSpawnAmount = 2
    for (let i = 0; i < startSpawnAmount; i++) {
      game.spawnEmoticon()
    }
  },
  playerControls(event) {
    if (document.body.getAttribute('keypress-listener') !== 'true') {
      document.body.addEventListener('keydown', game.playerControls, false)

      document.body.setAttribute('keypress-listener', 'true');
    } else {
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(event.code) > -1) {
        event.preventDefault()
      }

      if (event) {
        let key = event.key.toLowerCase()

        if (key === "w" || key === "arrowup")
          game.playerEmoticon.move('N')
        if (key === "a" || key === "arrowleft")
          game.playerEmoticon.move('W')
        if (key === "s" || key === "arrowdown")
          game.playerEmoticon.move('S')
        if (key === "d" || key === "arrowright")
          game.playerEmoticon.move('E')

        if (key === 'r') {
          game.restartRumble()
        }
      }
    }
  },
  removePlayerControls() {
    document.body.removeEventListener('keydown', game.playerControls, false);
    document.body.setAttribute('keypress-listener', 'false');
  },
  rumble() {
    game.createBoard()
    display.renderer.tick()
    display.leaderboardRenderer.tick()
    display.drawRestartButton()
    display.drawBackButton()
    game.startingSpawn('player')
    game.playerControls()
  },
  createChar() {
    display.drawCreateChar()
  },
  aiRumble() {
    game.aiMoveSpeedModifier = .05
    game.createBoard()
    display.drawAIRumbleButtons()
    display.renderer.tick()
    display.leaderboardRenderer.tick()
    game.startingSpawn()
  },
  reset() {
    display.renderer.stopTimer()
    display.leaderboardRenderer.stopTimer()

    game.aiMoveTimers.forEach(t => {
      t.stopTimer()
    })
    game.aiMoveTimers = []
    game.fightTimers.forEach(t => {
      t.stopTimer()
    })
    game.fightTimers = []


    game.aiSpeed = game.config.aiBaseSpeed
    game.aiMoveSpeedModifier = game.config.aiBaseMoveSpeedModifier
    game.gameOverState = false
    game.playerEmoticon = null
    game.board = []
    game.leaderboard = []
    $('#display').text('')
    $('#create-char').text('')
    $('#game-buttons').text('')
    $('#leaderboard').text('')

    game.removePlayerControls()
  },
  restartRumble() {
    game.reset()
    game.playerEmoticon = new Emoticon(game.lastCharStats.emoticon, game.lastCharStats.health, game.lastCharStats.attack, game.lastCharStats.defence)
    game.playerEmoticon.player = true
    game.rumble()
  },
  gameOver() {
    game.gameOverState = true
  }
}

let display = {
  titleTimer: {
    timer: null,
    tick() {
      $('#title').empty()
      let titleTimerSpeed = 4000
      if (game.playerEmoticon !== null) {
        $('#title').append(`[Emoticon]&nbsp;&nbsp;&nbsp;&nbsp;❤️${game.playerEmoticon.stats.currentHealth}⚔️${game.playerEmoticon.stats.attack}🛡️${game.playerEmoticon.stats.defence}&nbsp;&nbsp;&nbsp;&nbsp;[Rumble]`)
        titleTimerSpeed = 33
      }
      else {
        $('#title').append(`${createEmoticon()} [Emoticon] [Rumble] ${createEmoticon()}`)
      }
      display.titleTimer.timer = window.setTimeout('display.titleTimer.tick()', titleTimerSpeed)
    },
    stopTimer() {
      display.titleTimer.tickNumber = 0
      clearTimeout(display.titleTimer.timer)
    }
  },
  tileSize: 80,
  leaderboardRenderer: {
    tickNumber: 0,
    timer: null,
    tick() {
      display.drawLeaderboard()
      display.leaderboardRenderer.tickNumber++
      display.leaderboardRenderer.timer = window.setTimeout('display.leaderboardRenderer.tick()', 2000)
    },
    stopTimer() {
      display.leaderboardRenderer.tickNumber = 0
      clearTimeout(display.leaderboardRenderer.timer)
    }
  },
  renderer: {
    tickNumber: 0,
    timer: null,
    tick() {
      display.drawGame()
      display.renderer.tickNumber++
      display.renderer.timer = window.setTimeout('display.renderer.tick()', game.config.renderSpeed)
    },
    stopTimer() {
      display.renderer.tickNumber = 0
      clearTimeout(display.renderer.timer)
    }
  },
  drawBoard(ctx) {
    for (let y = 0; y < game.config.yTileCount; y++) {
      for (let x = 0; x < game.config.xTileCount; x++) {
        if (y % 2 === 0) {
          if (x % 2 === 0)
            ctx.fillStyle = "#c7ecff"
          else
            ctx.fillStyle = "#fff4ff"
        } else {
          if (x % 2 !== 0)
            ctx.fillStyle = "#c7ecff"
          else
            ctx.fillStyle = "#fff4ff"
        }
        ctx.fillRect(x * display.tileSize, y * display.tileSize, display.tileSize, display.tileSize)
      }
    }
    ctx.lineWidth = 8
    ctx.strokeStyle = "#c7ecff"
    ctx.strokeRect(0, 0, game.config.xTileCount * display.tileSize, game.config.yTileCount * display.tileSize)

    for (let y = 0; y < game.config.yTileCount; y++) {
      for (let x = 0; x < game.config.xTileCount; x++) {
        if (game.isEmoticon(x, y)) {
          let e1 = game.board[y][x]
          ctx.fillStyle = "black"
          ctx.lineWidth = 3;
          //Level Border
          if (game.playerEmoticon === null) {
            if (e1.level > 4) {
              ctx.strokeStyle = "#99ff99"
              if (e1.level > 9)
                ctx.strokeStyle = "#3399ff"
              if (e1.level > 14)
                ctx.strokeStyle = "#ff66ff"
              if (e1.level > 19)
                ctx.strokeStyle = "#ff3333"
              ctx.strokeRect(x * display.tileSize, y * display.tileSize, display.tileSize, display.tileSize)
            }
          } else {
            if (e1.player) {
              ctx.strokeStyle = "#33cc33"
              ctx.strokeRect(x * display.tileSize, y * display.tileSize, display.tileSize, display.tileSize)
            } else {
              if (e1.level >= game.playerEmoticon.level) {
                let difference = e1.level - game.playerEmoticon.level
                ctx.strokeStyle = "rgb(55, 155, 255)"
                let intensity = 1 - (e1.level - game.playerEmoticon.level) / 8
                if (intensity < 0)
                  intensity = 0
                ctx.strokeStyle = `rgba(${55 * intensity}, ${155 * intensity}, ${255 * intensity})`
              }
              if (e1.level < game.playerEmoticon.level) {
                let intensity = 1 - ((game.playerEmoticon.level - e1.level) / 10)
                if (intensity < 0 || e1.level <= game.playerEmoticon.level - 10)
                  intensity = 0
                ctx.strokeStyle = `rgba(55, 155, 255, ${intensity})`
              }
              ctx.strokeRect(x * display.tileSize, y * display.tileSize, display.tileSize, display.tileSize)
            }
          }
          //Stats
          ctx.font = "11px Verdana"
          let stats = `❤️${e1.stats.currentHealth}⚔️${e1.stats.attack}🛡️${e1.stats.defence}`
          ctx.fillText(stats, x * display.tileSize + ((display.tileSize / 2) - (ctx.measureText(stats).width / 2)), y * display.tileSize + Math.floor(display.tileSize / 3.3))
          //Emoticon
          ctx.font = "16px Verdana"
          ctx.fillText(e1.emoticon, x * display.tileSize + ((display.tileSize / 2) - (ctx.measureText(e1.emoticon).width / 2)), y * display.tileSize + Math.floor(display.tileSize / 1.8))
          //Level
          ctx.font = "12px Verdana"
          let level = `⭐${e1.level}`
          ctx.fillText(level, x * display.tileSize + ((display.tileSize / 2) - (ctx.measureText(level).width / 2)), y * display.tileSize + Math.floor(display.tileSize / 1.25))

          //Attack Direction
          if (e1.attackDirection !== null) {
            ctx.font = "16px Verdana"
            if (e1.attackDirection === 'N')
              ctx.fillText('⚔️', x * display.tileSize + ((display.tileSize / 2) - (ctx.measureText('⚔️').width / 2)), y * display.tileSize + Math.floor(display.tileSize / 10))
            if (e1.attackDirection === 'S')
              ctx.fillText('⚔️', x * display.tileSize + ((display.tileSize / 2) - (ctx.measureText('⚔️').width / 2)), y * display.tileSize + display.tileSize + Math.floor(display.tileSize / 10))
            if (e1.attackDirection === 'E')
              ctx.fillText('⚔️', x * display.tileSize + (display.tileSize - (ctx.measureText('⚔️').width / 2)), y * display.tileSize + Math.floor(display.tileSize / 1.8))
            if (e1.attackDirection === 'W')
              ctx.fillText('⚔️', x * display.tileSize + (0 - (ctx.measureText('⚔️').width / 2)), y * display.tileSize + Math.floor(display.tileSize / 1.8))
          }
        }
      }
    }

    if (game.gameOverState) {
      let gameOverText = '⚰️'

      if (game.playerEmoticon.level % 2 === 0)
        gameOverText = '☠️'

      ctx.font = 'bold ' + Math.floor((ctx.canvas.clientWidth + ctx.canvas.clientHeight) / 10) + 'px Verdana'
      ctx.fillText(gameOverText, (ctx.canvas.clientWidth / 2) - (ctx.measureText(gameOverText).width / 2), (ctx.canvas.clientHeight / 2) + (ctx.canvas.clientHeight / 10))
    }
  },
  drawLeaderboard() {
    let leaderboard = game.leaderboard.sort((a, b) => {
      if (a.wins > b.wins)
        return -1
      if (a.wins < b.wins)
        return 1
      return 0
    })
    if (leaderboard.length > 1000) {
      leaderboard.splice(1000, leaderboard.length - 1000)
      game.leaderboard = leaderboard
    }

    $('#leaderboard').text('')

    let amountToShow = leaderboard.length < 10 ? leaderboard.length : 10
    let output = ''
    for (let i = 0; i < amountToShow; i++) {
      output += `<div style="display: inline-block;"><div style="display: inline-block; width:53px;">#${i + 1}${i === 0 ? '👑' : ''}: </div>
      <div class="emoticon">${leaderboard[i].emoticon}</div> 🏆:${leaderboard[i].wins} ⭐:${leaderboard[i].level} ❤️:${leaderboard[i].stats.health} ⚔️:${leaderboard[i].stats.attack} 🛡️:${leaderboard[i].stats.defence}  ${leaderboard[i].player ? '👈' : ''}</div><br>`
    }

    output += `<br><br>`
    for (let i = 0; i < leaderboard.length; i++) {
      output += `<div class="emoticon">${leaderboard[i].emoticon}</div>&nbsp;&nbsp;&nbsp;`
    }

    $('#leaderboard').append(output)
  },
  drawAIRumbleButtons() {
    $('#game-buttons').append(
      `<span id="slower-button" class="game-button"><span>🐢</span></span> 
      <span id="faster-button" class="game-button"><span>🐇</span></span>`)

    $('#slower-button').click(function () {
      game.aiSpeed += 100
      if (game.aiSpeed > 100 && game.aiSpeed < 200)
        game.aiSpeed = 100
    })
    $('#faster-button').click(function () {
      if (game.aiSpeed < 200)
        game.aiSpeed = game.config.aiMaxSpeed
      else
        game.aiSpeed -= 100
    })

    display.drawBackButton()
  },
  drawBackButton() {
    $('#game-buttons').append(`<span id="back-button" class="game-button"><span>🔙</span></span>`)

    $('#back-button').click(function () {
      game.reset()
      $('#nav').show()
    })
  },
  drawRestartButton() {
    $('#game-buttons').append(`<span id="restart-button" class="game-button"><span>🔄</span></span>`)

    $('#restart-button').click(game.restartRumble)
  },
  drawCreateChar() {
    $('#create-char').append(
      `<h3 id="points-to-spend">Spend ${game.config.baseStatPoints} Points</h3>
      <label class="char-label" id="emoticon-input-label" for="emoticon-input">Emoticon:</label>
      <input type="text" class="char-input" id="emoticon-input" name="emoticon-input" maxlength="5" value="${createEmoticon()}">
      <span id="random-button"><span>🔄</span></span> <br>
      <label class="char-label" id="health-label" for="char-h">❤️Health:</label>
      <input type="range" class="char-input" id="char-h" name="char-h" value="0" min="0" max="${game.config.baseMaxHealthPoints}"><span id="h-amount">0</span><br>
      <label class="char-label" for="char-a">⚔️Attack:</label>
      <input type="range" class="char-input" id="char-a" name="char-a" value="0" min="0" max="${game.config.baseMaxAttackPoints}"><span id="a-amount">0</span><br>
      <label class="char-label" for="char-d">🛡️Defence:</label>
      <input type="range" class="char-input" id="char-d" name="char-d" value="0" min="0" max="${game.config.baseMaxDefencePoints}"><span id="d-amount">0</span><br><br>
      <div class="nav-button" id="create-char-btn"><span>Create Character</span></div>`)

    $("#create-char-btn").addClass("btn-disable")

    $("#random-button").click(function () {
      $("#emoticon-input").val(createEmoticon())
    })
    $("#emoticon-input").on("input", function () {
      let totalSpent = +$("#h-amount").text() + +$("#a-amount").text() + +$("#d-amount").text()
      if (totalSpent >= game.config.baseStatPoints && $("#emoticon-input").val().length > 0)
        $("#create-char-btn").removeClass("btn-disable")
      else
        $("#create-char-btn").addClass("btn-disable")
    })

    $("#char-h").on("input", function () {
      let totalSpent = +this.value + +$("#a-amount").text() + +$("#d-amount").text()

      $("#points-to-spend").html(`Spend ${totalSpent <= 20 ? 20 - totalSpent : 0} Points`)

      if (totalSpent >= game.config.baseStatPoints) {
        let difference = game.config.baseStatPoints - (+$("#a-amount").text() + +$("#d-amount").text())
        this.value = difference
        $("#h-amount").text(difference)
        if ($("#emoticon-input").val().length > 0)
          $("#create-char-btn").removeClass("btn-disable")
      } else {
        $("#h-amount").html(this.value)
        $("#create-char-btn").addClass("btn-disable")
      }
    })
    $("#char-a").on("input", function () {
      let totalSpent = +$("#h-amount").text() + +this.value + +$("#d-amount").text()

      $("#points-to-spend").html(`Spend ${totalSpent <= 20 ? 20 - totalSpent : 0} Points`)

      if (totalSpent >= game.config.baseStatPoints) {
        let difference = game.config.baseStatPoints - (+$("#h-amount").text() + +$("#d-amount").text())
        this.value = difference
        $("#a-amount").text(difference)
        if ($("#emoticon-input").val().length > 0)
          $("#create-char-btn").removeClass("btn-disable")
      } else {
        $("#a-amount").html(this.value)
        $("#create-char-btn").addClass("btn-disable")
      }
    })
    $("#char-d").on("input", function () {
      let totalSpent = +$("#h-amount").text() + +$("#a-amount").text() + +this.value

      $("#points-to-spend").html(`Spend ${totalSpent <= 20 ? 20 - totalSpent : 0} Points`)

      if (totalSpent >= game.config.baseStatPoints) {
        let difference = game.config.baseStatPoints - (+$("#h-amount").text() + +$("#a-amount").text())
        this.value = difference
        $("#d-amount").text(difference)
        if ($("#emoticon-input").val().length > 0)
          $("#create-char-btn").removeClass("btn-disable")
      } else {
        $("#d-amount").html(this.value)
        $("#create-char-btn").addClass("btn-disable")
      }
    })

    $("#create-char-btn").click(function () {
      let h = +$("#h-amount").text()
      let a = +$("#a-amount").text()
      let d = +$("#d-amount").text()
      let emoticon = $("#emoticon-input").val()
      let e1 = new Emoticon(emoticon, h, a, d)
      e1.player = true
      game.playerEmoticon = e1
      game.lastCharStats = { emoticon, health: h, attack: a, defence: d }

      display.titleTimer.stopTimer()
      display.titleTimer.tick()
      $('#create-char').text('')
      game.rumble()
    })
  },
  drawGame() {
    if (document.getElementById("canvas") === null) {
      $('#display').append(`<canvas id="canvas" width="${game.config.xTileCount * display.tileSize}" height="${game.config.yTileCount * display.tileSize}">`)
      $('body').css('min-width', game.config.xTileCount * display.tileSize)
      $('#leaderboard').css('min-width', $('body').css('min-width'))
    }

    let canvas = document.getElementById("canvas")
    let ctx = canvas.getContext("2d")
    display.drawBoard(ctx)
  }
}

class Emoticon {
  constructor(emoticon, health, attack, defence) {
    if (emoticon === undefined)
      this.emoticon = createEmoticon()
    else
      this.emoticon = emoticon

    if (health !== undefined && attack !== undefined && defence !== undefined) {
      health = (health * game.config.healthMultiplier) + game.config.baseHealth
      this.stats = { health, currentHealth: health, attack, defence }
      this.custom = true
    }
    else
      this.stats = createStats()

    this.level = ((this.stats.health - game.config.baseHealth) / game.config.healthMultiplier) + this.stats.attack + this.stats.defence - (game.config.baseStatPoints - 1)
    this.wins = 0
    this.target = null
    this.inCombat = false
    this.attackDirection = null
    this.player = false
  }

  levelUp(e2) {
    let points = 0

    if (e2 !== undefined) {
      points++

      if (e2.level >= this.level) {
        points++
        points += Math.floor((e2.level - this.level) / 2)
      }
    }

    for (let i = 0; i < points; i++) {
      let rand = getRandomInt(3)
      if (rand === 0)
        this.stats.health += 1 * game.config.healthMultiplier
      else if (rand === 1)
        this.stats.attack++
      else if (rand === 2)
        this.stats.defence++

      this.level++
    }

    //ai speed in rumble
    if (this.player) {
      game.aiSpeed = game.config.aiBaseSpeed - (this.level * 50)
      if (game.aiSpeed < 300)
        game.aiSpeed = 300
    }
  }

  lifeSteal(e2) {
    if (this.level > e2.level) {
      let lifeSteal = 1 - ((this.level - e2.level) * game.config.lifeStealModifier)
      if (lifeSteal < 0)
        lifeSteal = 0

      this.stats.currentHealth += Math.floor(e2.stats.health * lifeSteal)
      if (this.stats.currentHealth > this.stats.health)
        this.stats.currentHealth = this.stats.health
    } else {
      this.stats.currentHealth = this.stats.health
    }
  }

  getPosition() {
    for (let y = 0; y < game.board.length; y++) {
      let x = game.board[y].indexOf(this)
      if (x > -1) {
        return [x, y]
      }
    }
    return null
  }

  remove() {
    game.removeAIMoveTimer(this)
    let pos = this.getPosition()
    if (pos !== null)
      game.board[pos[1]][pos[0]] = null
  }

  findTarget() {
    let potentialTargets = []
    for (let y = 0; y < game.config.yTileCount; y++) {
      for (let x = 0; x < game.config.xTileCount; x++) {
        if (game.isEmoticon(x, y)) {
          let pos = this.getPosition()
          if (pos !== null) {
            if (x !== pos[0] && y !== pos[1]) {
              if (game.board[y][x].level >= this.level)
                if (!game.board[y][x].inCombat)
                  potentialTargets.push(game.board[y][x])
            }
          }
        }
      }
    }
    if (potentialTargets.length > 0)
      this.target = potentialTargets[getRandomInt(potentialTargets.length)]
    else
      this.target = null
  }

  moveToTarget() {
    if (this.target === null)
      this.findTarget()
    else if (game.findEmoticon(this.target) === null)
      this.findTarget()

    let pos = this.getPosition()
    if (pos !== null) {
      if (this.target !== null) {
        let targetPos = this.target.getPosition()
        let moveX = pos[0]
        let moveY = pos[1]

        if (pos[0] === targetPos[0]) {
          if (pos[1] < targetPos[1])
            moveY += 1
          else
            moveY -= 1
        } else if (pos[1] === targetPos[1]) {
          if (pos[0] < targetPos[0])
            moveX += 1
          else
            moveX -= 1
        } else {
          let xOrY = getRandomInt(2)
          if (xOrY) {
            if (pos[1] < targetPos[1])
              moveY += 1
            else
              moveY -= 1
          } else {
            if (pos[0] < targetPos[0])
              moveX += 1
            else
              moveX -= 1
          }
        }

        if (game.isEmpty(moveX, moveY)) {
          game.board[pos[1]][pos[0]] = null
          game.board[moveY][moveX] = this
        } else if (game.isEmoticon(moveX, moveY)) {
          if (!game.board[moveY][moveX].inCombat) {
            if (pos[0] - moveX > 0)
              this.attackDirection = 'W'
            if (pos[0] - moveX < 0)
              this.attackDirection = 'E'
            if (pos[1] - moveY > 0)
              this.attackDirection = 'N'
            if (pos[1] - moveY < 0)
              this.attackDirection = 'S'

            fight(this, game.board[moveY][moveX])
          }
        }

      } else {
        let moves = [1, -1]
        let xOrY = getRandomInt(2)
        let moveX = pos[0]
        let moveY = pos[1]
        if (xOrY)
          moveX = moves[getRandomInt(2)] + pos[0]
        else
          moveY = moves[getRandomInt(2)] + pos[1]

        if (game.isEmpty(moveX, moveY)) {
          game.board[pos[1]][pos[0]] = null
          game.board[moveY][moveX] = this
        } else if (game.isEmoticon(moveX, moveY)) {
          if (!game.board[moveY][moveX].inCombat) {
            if (pos[0] - moveX > 0)
              this.attackDirection = 'W'
            if (pos[0] - moveX < 0)
              this.attackDirection = 'E'
            if (pos[1] - moveY > 0)
              this.attackDirection = 'N'
            if (pos[1] - moveY < 0)
              this.attackDirection = 'S'

            fight(this, game.board[moveY][moveX])
          }
        }
      }
    }
  }

  move(direction) {
    if (!this.inCombat) {
      let pos = this.getPosition()
      let moveX = pos[0]
      let moveY = pos[1]

      if (direction === 'W')
        moveX--
      else if (direction === 'E')
        moveX++
      else if (direction === 'N')
        moveY--
      else if (direction === 'S')
        moveY++

      if (game.isEmpty(moveX, moveY)) {
        game.board[pos[1]][pos[0]] = null
        game.board[moveY][moveX] = this
      } else if (game.isEmoticon(moveX, moveY)) {
        if (!game.board[moveY][moveX].inCombat) {
          if (pos[0] - moveX > 0)
            this.attackDirection = 'W'
          if (pos[0] - moveX < 0)
            this.attackDirection = 'E'
          if (pos[1] - moveY > 0)
            this.attackDirection = 'N'
          if (pos[1] - moveY < 0)
            this.attackDirection = 'S'

          fight(this, game.board[moveY][moveX])
        }
      }
    }
  }
}

function fight(e1, e2) {
  e1.inCombat = true
  e2.inCombat = true

  let aiFight = function (e1, e2, fightTimer) {
    game.removeFightTimer(fightTimer)

    while (true) {
      attack(e1, e2)
      attack(e2, e1)

      let status = checkStatus(e1, e2)

      if (status) {
        fightOutcome(e1, e2, status)
        break
      }
    }
  }

  let playerFight = function (e1, e2) {
    game.removeFightTimer(fightTimer)

    while (true) {
      attack(e1, e2)
      attack(e2, e1)

      let status = checkStatus(e1, e2)

      if (status) {
        fightOutcome(e1, e2, status)
        break
      }
    }
  }

  let fightSpeed = game.aiSpeed

  if (e1.player || e2.player) //{
    fightSpeed = game.config.playerFightSpeed
  //} else {
  let fightTimer = {
    timer: null,
    stopTimer: function () {
      clearTimeout(this.timer)
    }
  }
  fightTimer.timer = window.setTimeout(aiFight, fightSpeed, e1, e2, fightTimer)
  game.fightTimers.push(fightTimer)
  //}
}

function attack(e1, e2) {
  let roll = 1 + getRandomInt(game.config.rollAmount)

  let resistance = Math.floor((game.config.resistanceModifier * e2.stats.defence) * 100) / 100
  if (resistance > game.config.resistanceLimit)
    resistance = game.config.resistanceLimit

  let hit = Math.floor((e1.stats.attack + roll) * (1 - resistance))

  if (e2.player) {
    hit = Math.floor(hit * (1 - game.config.playerDamageMitigation))
    if (hit === 0)
      hit++
  }

  e2.stats.currentHealth = e2.stats.currentHealth - hit
  return { roll, hit }
}

function checkStatus(e1, e2) {
  if (e1.stats.currentHealth < 1 && e2.stats.currentHealth < 1) {
    e1.stats.currentHealth = 0
    e2.stats.currentHealth = 0
    return 'draw'
  }
  if (e2.stats.currentHealth < 1) {
    e2.stats.currentHealth = 0
    return 'win'
  }
  if (e1.stats.currentHealth < 1) {
    e1.stats.currentHealth = 0
    return 'lose'
  }
  return null
}

function fightOutcome(e1, e2, status) {
  if (status === 'draw') {
    if (getRandomInt(2))
      status = 'win'
    else
      status = 'lose'
  }
  if (status === 'win') {
    if (e2.player)
      game.gameOver()

    e1.wins++
    e1.levelUp(e2)
    e1.lifeSteal(e2)

    if (e2.level > 1)
      game.spawnEmoticon(Math.ceil(e2.level / game.config.spawnLevelSplit))
    game.spawnEmoticon(Math.ceil(e2.level / game.config.spawnLevelSplit))

    if (e2.level > 1)
      game.leaderboard.push(e2)
    e2.remove()

    e1.attackDirection = null
    e1.target = null
    e1.inCombat = false
  }
  if (status === 'lose') {
    if (e1.player)
      game.gameOver()

    e2.wins++
    e2.levelUp(e1)
    e2.lifeSteal(e1)

    if (e1.level > 1)
      game.spawnEmoticon(Math.ceil(e1.level / game.config.spawnLevelSplit))
    game.spawnEmoticon(Math.ceil(e1.level / game.config.spawnLevelSplit))

    if (e1.level > 1)
      game.leaderboard.push(e1)
    e1.remove()

    e2.target = null
    e2.inCombat = false
  }
}

function createStats() {
  let health = 0
  let attack = 0
  let defence = 0

  for (let i = 0; i < game.config.baseStatPoints; i++) {
    if (game.config.baseStatPoints > game.config.baseMaxHealthPoints + game.config.baseMaxAttackPoints + game.config.baseMaxDefencePoints) {
      health = game.config.baseMaxHealthPoints
      attack = game.config.baseMaxAttackPoints
      defence = game.config.baseMaxDefencePoints
      break
    }

    let rand = getRandomInt(3)
    if (rand === 0 && health < game.config.baseMaxHealthPoints)
      health++
    else
      if (rand === 1 && attack < game.config.baseMaxAttackPoints)
        attack++
      else
        if (rand === 2 && defence < game.config.baseMaxDefencePoints)
          defence++
        else
          i--
  }
  health = (health * game.config.healthMultiplier) + game.config.baseHealth
  return { health, currentHealth: health, attack, defence }
}

function createEmoticon() {
  let parts = {
    facesLeft: ['(', '[', '{', 'ʕ', '≧', '>', '=', '༼', '|', '｡', '⋟', '꒰'],
    facesRight: [')', ']', '}', 'ʔ', '≦', '<', '=', '༽', '|', '｡', '⋞', '꒱'],
    eyes: ['^', ';', '╥', '*', '•', '●', '◔', '◑', '◉', '˘', '❛', '◠', '︺', '⊙', '♡', 'x', 'Q', 'ಠ', '°', '☆', 'Θ', 'ఠ', '¬'],
    mouths: ['ᴥ', 'v', 'o', '_', '.', '-', '◡', '⌓', '︹', '︿', 'ᆺ', '﹏', 'ᆽ', 'Д', 'w', '□', 'ω', ' ͜ʖ', '±', '◇', '～', '∇', '⍨', '₃', 'ε']
  }

  let faceIndex = getRandomInt(parts.facesLeft.length)
  let eyeIndex = getRandomInt(parts.eyes.length)
  let mouthIndex = getRandomInt(parts.mouths.length)

  return parts.facesLeft[faceIndex] + parts.eyes[eyeIndex] + parts.mouths[mouthIndex] + parts.eyes[eyeIndex] + parts.facesRight[faceIndex]
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max)
}

function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}