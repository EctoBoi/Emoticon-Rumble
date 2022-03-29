
window.onload = function () {
  $(document).on('keydown', function (e) {
    if ([38, 37, 40, 39].indexOf(e.which) > -1) {
      e.preventDefault()
    }
    game.keys[e.which] = true
  }).on('keyup', function (e) {
    delete game.keys[e.which]
  });

  if (getCookie('dark-mode') === 'true') {
    display.toggleDarkMode()
  }

  display.titleTimer.tick()

  game.createPlayerLeaderboard()
  display.leaderboardRenderer.tick()

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

$('#briefing-nav').click(function () {
  $('#nav').hide()
  game.reset()
  display.drawBriefing()
})

$('#dark-mode-button').click(function () {
  display.toggleDarkMode()
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
    baseMaxHealthPoints: 20,
    baseMaxAttackPoints: 20,
    baseMaxDefencePoints: 20,
    playerFightSpeed: 700,
    playerMoveSpeed: 100,
    playerDamageMitigation: .1,
    spawnLevelSplit: 1.3,
    aiBaseSpeed: 1000,
    aiMaxSpeed: 50,
    aiBaseMoveSpeedModifier: .04,
    gameSpeed: 33,
    xTileCount: 8,
    yTileCount: 8,
  },

  playerEmoticon: null,
  keys: {},
  keyLockoutTimer: null,
  clickLockoutTimer: null,
  lastCharStats: null,
  gameOverState: false,
  aiSpeed: null,
  aiMoveSpeedModifier: null,
  board: [],
  leaderboard: [],
  aiMoveTimers: [],
  fightTimers: [],

  gameLoop: {
    tickNumber: 0,
    timer: null,
    tick() {
      display.drawGame()
      game.gameLoop.tickNumber++
      game.gameLoop.timer = window.setTimeout('game.gameLoop.tick()', game.config.gameSpeed)
      game.playerControls()
    },
    stopTimer() {
      clearTimeout(game.gameLoop.timer)
      game.gameLoop.tickNumber = 0
    }
  },

  createBoard: function () {
    game.config.xTileCount = Math.floor((window.innerWidth - 20 - display.offsetX * 2) / display.tileSize)
    game.config.yTileCount = Math.floor((window.innerHeight - 120 - display.offsetY * 2) / display.tileSize)
    if (game.config.xTileCount < 2)
      game.config.xTileCount = 2
    if (game.config.yTileCount < 2)
      game.config.yTileCount = 2

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

        thisTimer.timer = window.setTimeout(thisTimer.tick, moveSpeed, thisTimer)
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

  playerControls() {
    let lockout = function () {
      game.keyLockoutTimer = window.setTimeout(function () {
        game.keyLockoutTimer = null
      }, game.config.playerMoveSpeed);
    }

    if (game.playerEmoticon !== null) {
      if (game.keyLockoutTimer === null && game.clickLockoutTimer === null) {

        if (game.keys[87] || game.keys[38]) {
          lockout()
          game.playerEmoticon.move('N')
        }
        if (game.keys[68] || game.keys[39]) {
          lockout()
          game.playerEmoticon.move('E')
        }
        if (game.keys[83] || game.keys[40]) {
          lockout()
          game.playerEmoticon.move('S')
        }
        if (game.keys[65] || game.keys[37]) {
          lockout()
          game.playerEmoticon.move('W')
        }


        if (game.keys[82]) {
          lockout()
          game.restartRumble()
        }
      }
    }
  },

  playerClickControls() {
    $('#canvas').on('mousedown', function (e) {
      e.preventDefault()

      let lockout = function () {
        game.clickLockoutTimer = window.setTimeout(function () {
          game.clickLockoutTimer = null
        }, game.config.playerMoveSpeed);
      }

      let canvasRect = document.getElementById('canvas').getBoundingClientRect()
      let clickPosX = Math.floor((event.clientX - canvasRect.left) - display.offsetX)
      let clickPosY = Math.floor((event.clientY - canvasRect.top) - display.offsetY)

      let playerPosX = game.playerEmoticon.getPosition()[0] * display.tileSize + (display.tileSize / 2)
      let playerPosY = game.playerEmoticon.getPosition()[1] * display.tileSize + (display.tileSize / 2)

      let arr = [playerPosY - clickPosY, clickPosX - playerPosX, clickPosY - playerPosY, playerPosX - clickPosX]
      let indexOfMax = arr.indexOf(Math.max(...arr))

      if (game.playerEmoticon !== null) {
        if (game.keyLockoutTimer === null && game.clickLockoutTimer === null) {

          if (indexOfMax === 0) {
            lockout()
            game.playerEmoticon.move('N')
          }
          if (indexOfMax === 1) {
            lockout()
            game.playerEmoticon.move('E')
          }
          if (indexOfMax === 2) {
            lockout()
            game.playerEmoticon.move('S')
          }
          if (indexOfMax === 3) {
            lockout()
            game.playerEmoticon.move('W')
          }
        }
      }
    });
  },

  removePlayerClickControls() {
    $('#canvas').unbind('mousedown')
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

  isWall(posX, posY) {
    if (posX < 0 || posX > game.config.xTileCount - 1 || posY < 0 || posY > game.config.yTileCount - 1)
      return null

    if (game.board[posY][posX] instanceof Wall) {
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
    let spawnLimit = Math.floor((game.config.xTileCount + game.config.yTileCount) / 3.5)
    spawnLimit++
    if (level === undefined || level < 1) {
      level = 1
    }
    if (game.aiMoveTimers.length < spawnLimit) {
      let spawnAttempts = 33
      while (spawnAttempts > 0) {
        let posX = getRandomInt(game.config.xTileCount)
        let posY = getRandomInt(game.config.yTileCount)
        if (e1 !== undefined) {
          if (e1.player) {
            posX = (Math.floor(game.config.xTileCount / 2) - 1) + getRandomInt(3)
            posY = (Math.floor(game.config.yTileCount / 2) - 1) + getRandomInt(3)
          }
        }
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

  spawnWall() {
    let spawnAttempts = 33
    while (spawnAttempts > 0) {
      let posX = getRandomInt(game.config.xTileCount)
      let posY = getRandomInt(game.config.yTileCount)

      if (game.isEmpty(posX, posY)) {
        game.board[posY][posX] = new Wall()
        break
      }
      spawnAttempts--
    }
  },

  startingSpawn(type) {
    let wallSpawnAmount = (Math.floor((game.config.xTileCount + game.config.yTileCount) / 3) - 1) + getRandomInt(3)
    for (let i = 0; i < wallSpawnAmount; i++) {
      game.spawnWall()
    }

    if (type === 'player')
      game.spawnEmoticon(1, game.playerEmoticon)

    let startSpawnAmount = Math.floor((game.config.xTileCount + game.config.yTileCount) / 3)
    if (startSpawnAmount < 2)
      startSpawnAmount = 2
    for (let i = 0; i < startSpawnAmount; i++) {
      game.spawnEmoticon()
    }
  },

  createPlayerLeaderboard() {
    let leaderboardCookie = getCookie('player-leaderboard').split(',')
    if (leaderboardCookie[0] === '')
      leaderboardCookie = []

    for (let i = 0; i < leaderboardCookie.length / 5; i++) {
      let index = i * 5
      let emoticon = leaderboardCookie[index]
      let health = leaderboardCookie[index + 1]
      let attack = leaderboardCookie[index + 2]
      let defence = leaderboardCookie[index + 3]
      let wins = leaderboardCookie[index + 4]
      let e1 = new Emoticon(emoticon, +health, +attack, +defence)
      if (!isNaN(e1.stats.health)) {
        e1.wins = +wins
        game.leaderboard.push(e1)
      }
    }
  },

  addToPlayerLeaderboard(e1) {
    let leaderboardCookie = getCookie('player-leaderboard').split(',')
    if (leaderboardCookie[0] === '')
      leaderboardCookie = []

    let newPlayerLeaderboard = []
    let e1Template = {
      emoticon: e1.emoticon,
      health: healthToPoints(e1.stats.health),
      attack: e1.stats.attack,
      defence: e1.stats.defence,
      wins: e1.wins,
      level: e1.level
    }
    newPlayerLeaderboard.push(e1Template)

    for (let i = 0; i < leaderboardCookie.length / 5; i++) {
      let index = i * 5
      let emoticon = leaderboardCookie[index]
      let health = leaderboardCookie[index + 1]
      let attack = leaderboardCookie[index + 2]
      let defence = leaderboardCookie[index + 3]
      let wins = leaderboardCookie[index + 4]
      e1Template = { emoticon, health, attack, defence, wins }
      newPlayerLeaderboard.push(e1Template)
    }

    newPlayerLeaderboard = newPlayerLeaderboard.sort((a, b) => {
      if (a.wins + a.level > b.wins + b.level)
        return -1
      if (a.wins + a.level < b.wins + b.level)
        return 1
      return 0
    })

    if (newPlayerLeaderboard.length > 100) {
      newPlayerLeaderboard.splice(100, newPlayerLeaderboard.length - 100)
    }

    let newCookie = ""
    for (let i = 0; i < newPlayerLeaderboard.length; i++) {
      newCookie += newPlayerLeaderboard[i].emoticon + ',' + newPlayerLeaderboard[i].health + ',' + newPlayerLeaderboard[i].attack + ',' + newPlayerLeaderboard[i].defence + ',' + newPlayerLeaderboard[i].wins
      if (i < newPlayerLeaderboard.length - 1)
        newCookie += ','
    }
    setCookie('player-leaderboard', newCookie, 30)
  },

  rumble() {
    game.createBoard()
    game.gameLoop.tick()
    game.playerClickControls()
    display.leaderboardRenderer.tick()
    display.drawRestartButton()
    display.drawBackButton()
    game.startingSpawn('player')
  },

  createChar() {
    game.reset()
    display.drawCreateChar()
  },

  aiRumble() {
    game.reset()
    game.aiMoveSpeedModifier = .05
    game.createBoard()
    display.drawAIRumbleButtons()
    game.gameLoop.tick()
    display.leaderboardRenderer.tick()
    game.startingSpawn()
  },

  reset() {
    game.gameLoop.stopTimer()
    display.leaderboardRenderer.stopTimer()

    game.removePlayerClickControls()

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
  },

  restartRumble() {
    game.reset()
    game.playerEmoticon = new Emoticon(game.lastCharStats.emoticon, game.lastCharStats.health, game.lastCharStats.attack, game.lastCharStats.defence)
    game.playerEmoticon.player = true
    game.rumble()
  },

  gameOver() {
    game.gameOverState = true
    game.addToPlayerLeaderboard(game.playerEmoticon)
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
  offsetX: 50,
  offsetY: 30,
  darkMode: false,
  backgroundColor: "#fff4ff",
  tileColor: "#c7ecff",
  textColor: "black",
  damageTextColor: 'red',
  healTextColor: 'green',

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

  toggleDarkMode() {
    display.darkMode = !display.darkMode

    if (display.darkMode) {
      display.applyDarkMode()
    } else {
      display.applyLightMode()
    }
  },

  applyDarkMode() {
    let darkColor = '#1b2a32'
    let lightColor = "#2d4753"
    setCookie('dark-mode', 'true', 30)
    display.backgroundColor = darkColor
    display.tileColor = lightColor
    display.textColor = "#cddde4"
    display.damageTextColor = '#e81224'
    display.healTextColor = '#00e600'
    $('body').css('background-color', darkColor)
    $('body').css('color', '#cddde4')
    $('#dark-mode-button-emoji').text('☀️')
    $('.nav-button').css('background-color', lightColor)
    $('.nav-button').hover(function () { $(this).css('background-color', darkColor) }, function () { $(this).css('background-color', lightColor) })
    $('.game-button').css('background-color', lightColor)
    $('.game-button').hover(function () { $(this).css('background-color', darkColor) }, function () { $(this).css('background-color', lightColor) })
  },

  applyLightMode() {
    let darkColor = '#fff4ff'
    let lightColor = '#c7ecff'
    setCookie('dark-mode', 'false', 30)
    display.backgroundColor = darkColor
    display.tileColor = lightColor
    display.textColor = 'black'
    display.damageTextColor = 'red'
    display.healTextColor = 'green'
    $('body').css('background-color', darkColor)
    $('body').css('color', 'black')
    $('#dark-mode-button-emoji').text('🌑')
    $('.nav-button').css('background-color', '#ccefff')
    $('.nav-button').hover(function () { $(this).css('background-color', '#b3e7ff') }, function () { $(this).css('background-color', '#ccefff') })
    $('.game-button').css('background-color', '#ccefff')
    $('.game-button').hover(function () { $(this).css('background-color', '#b3e7ff') }, function () { $(this).css('background-color', '#ccefff') })
  },

  drawBriefing() {
    let briefing = `<h3 style='text-align:center;'>${createEmoticon()} Briefing ${createEmoticon()}</h3><div>The objective is to get the highest 🏅Score possible. Score is a combination of 🏆Wins and ⭐Level. Wins are simple, how many fights you survive: Levels on the other hand are situational. Winning a fight against an emoticon below your level awards you with one stat point, while an emoticon of equal level awards two levels and every two levels above you an additional one point. Stat points are distributed at random. The key factor to surviving is to pick your target wisely. You gain health back after a fight by stealing it from the opponent, and the lower their level from you, the less you steal. Note the following: Opacity of the enemy borders is dependent on level relative to your own. Lower levels are faded, showing that they provide less health when killed. Higher levels are darker, giving a clear sense of danger and indicating the amount of levels gained. The game speeds up as you level, so be quick with your fingers and see how far you can go!</div>`

    let controls = `<h3 style='text-align:center;'>${createEmoticon()} Controls ${createEmoticon()}</h3><div>If you have a ⌨️Keyboard, ⬆️➡️⬇️⬅️ and 🇼 🇦 🇸 🇩 move your character, otherwise 🖱️Clicking or 👆Tapping in a direction also works. You can also 🔄Restart with your current character by pressing 🇷.</div>`

    let details = `<h3 style='text-align:center;'>${createEmoticon()} Details ${createEmoticon()}</h3><div>-❤️Health is calculated by doubling the stat points and adding it to the base health of ${game.config.baseHealth}.<br><br>
    -⚔️Attack is used to determine the 🎯Hit by adding it to a six sided dice 🎲Roll.<br><br>
    -🛡️Defence reduced the incoming hit by a percentage, ${game.config.resistanceModifier * 100}% resistance per stat point. Defence has a limit of ${game.config.resistanceLimit * 100}%.<br><br>
    -The player has a multiplicative damage mitigation of ${game.config.playerDamageMitigation * 100}% to help withstand the onslaught.<br><br>
    -Lifesteal is reduced in effectiveness by ${game.config.lifeStealModifier * 100}% per level the opponent is below the players level.<br><br>
    -Not only do enemies speed up based on your level, but they also get ${game.config.aiBaseMoveSpeedModifier * 100}% faster per level of its own.<br><br>
    -If a fight ends in a draw there is a 50/50 chance of the player surviving, if this occurs there will be a 🎲 next to the heal above them.</div>`


    $('#display').append(`<div id='briefing'>${briefing}${controls}${details}<br></div>`)
    display.drawBackButton()
  },

  drawBoard(ctx) {
    ctx.fillStyle = display.backgroundColor
    ctx.fillRect(0, 0, (game.config.xTileCount * display.tileSize) + (display.offsetX * 2), (game.config.yTileCount * display.tileSize) + (display.offsetY * 2))
    for (let y = 0; y < game.config.yTileCount; y++) {
      for (let x = 0; x < game.config.xTileCount; x++) {
        if (y % 2 === 0) {
          if (x % 2 === 0)
            ctx.fillStyle = display.tileColor
          else
            ctx.fillStyle = display.backgroundColor
        } else {
          if (x % 2 !== 0)
            ctx.fillStyle = display.tileColor
          else
            ctx.fillStyle = display.backgroundColor
        }
        ctx.fillRect(x * display.tileSize + display.offsetX, y * display.tileSize + display.offsetY, display.tileSize, display.tileSize)
      }
    }
    ctx.lineWidth = 4
    ctx.strokeStyle = display.tileColor
    ctx.strokeRect(display.offsetX, display.offsetY, game.config.xTileCount * display.tileSize, game.config.yTileCount * display.tileSize)

    for (let y = 0; y < game.config.yTileCount; y++) {
      for (let x = 0; x < game.config.xTileCount; x++) {
        if (game.isEmoticon(x, y)) {
          let e1 = game.board[y][x]
          ctx.fillStyle = display.textColor
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
              ctx.strokeRect(x * display.tileSize + display.offsetX, y * display.tileSize + display.offsetY, display.tileSize, display.tileSize)
            }
          } else {
            if (e1.player) {
              ctx.strokeStyle = "#33cc33"
              ctx.strokeRect(x * display.tileSize + display.offsetX, y * display.tileSize + display.offsetY, display.tileSize, display.tileSize)
            } else {
              if (e1.level >= game.playerEmoticon.level) {
                let difference = e1.level - game.playerEmoticon.level
                let intensity = 1 - (e1.level - game.playerEmoticon.level) / 8
                if (intensity < 0)
                  intensity = 0
                if (!display.darkMode)
                  ctx.strokeStyle = `rgba(${55 * intensity}, ${155 * intensity}, ${255 * intensity})`
                else
                  ctx.strokeStyle = `rgba(${85 * intensity}, ${185 * intensity}, ${285 * intensity})`
              }
              if (e1.level < game.playerEmoticon.level) {
                let intensity = 1 - ((game.playerEmoticon.level - e1.level) / 15)
                if (intensity < 0 || e1.level <= game.playerEmoticon.level - 15)
                  intensity = 0
                if (!display.darkMode)
                  ctx.strokeStyle = `rgba(55, 155, 255, ${intensity})`
                else
                  ctx.strokeStyle = `rgba(85, 185, 285, ${intensity})`
              }
              ctx.strokeRect(x * display.tileSize + display.offsetX, y * display.tileSize + display.offsetY, display.tileSize, display.tileSize)
            }
          }
          //Stats
          ctx.font = "11px Verdana"
          let stats = `❤️${e1.stats.currentHealth}⚔️${e1.stats.attack}🛡️${e1.stats.defence}`
          ctx.fillText(stats, x * display.tileSize + display.offsetX + ((display.tileSize / 2) - (ctx.measureText(stats).width / 2)), y * display.tileSize + display.offsetY + Math.floor(display.tileSize / 3.3))
          //Emoticon
          ctx.font = "16px Verdana"
          ctx.fillText(e1.emoticon, x * display.tileSize + display.offsetX + ((display.tileSize / 2) - (ctx.measureText(e1.emoticon).width / 2)), y * display.tileSize + display.offsetY + Math.floor(display.tileSize / 1.8))
          //Level
          ctx.font = "14px Verdana"
          let level = `⭐${e1.level}`
          ctx.fillText(level, x * display.tileSize + display.offsetX + ((display.tileSize / 2) - (ctx.measureText(level).width / 2)), y * display.tileSize + display.offsetY + Math.floor(display.tileSize / 1.25))
        }
        //Walls
        if (game.isWall(x, y)) {
          let wall = game.board[y][x]
          ctx.font = "50px Verdana"
          ctx.fillText(wall.emoji, x * display.tileSize + display.offsetX + ((display.tileSize / 2) - (ctx.measureText(wall.emoji).width / 2)), y * display.tileSize + display.offsetY + Math.floor(display.tileSize / 1.4))
        }
      }
    }

    for (let y = 0; y < game.config.yTileCount; y++) {
      for (let x = 0; x < game.config.xTileCount; x++) {
        if (game.isEmoticon(x, y)) {
          let e1 = game.board[y][x]
          //Attack Direction
          if (e1.attackDirection !== null) {
            ctx.font = "16px Verdana"
            if (e1.attackDirection === 'N')
              ctx.fillText('⚔️', x * display.tileSize + display.offsetX + ((display.tileSize / 2) - (ctx.measureText('⚔️').width / 2)), y * display.tileSize + display.offsetY + Math.floor(display.tileSize / 10))
            if (e1.attackDirection === 'S')
              ctx.fillText('⚔️', x * display.tileSize + display.offsetX + ((display.tileSize / 2) - (ctx.measureText('⚔️').width / 2)), y * display.tileSize + display.offsetY + display.tileSize + Math.floor(display.tileSize / 10))
            if (e1.attackDirection === 'E')
              ctx.fillText('⚔️', x * display.tileSize + display.offsetX + (display.tileSize - (ctx.measureText('⚔️').width / 2)), y * display.tileSize + display.offsetY + Math.floor(display.tileSize / 1.8))
            if (e1.attackDirection === 'W')
              ctx.fillText('⚔️', x * display.tileSize + display.offsetX + (0 - (ctx.measureText('⚔️').width / 2)), y * display.tileSize + display.offsetY + Math.floor(display.tileSize / 1.8))
          }
          //Combat Display
          if (e1.combatDisplay !== null) {
            ctx.font = "Bold 16px Verdana"
            ctx.fillStyle = display.damageTextColor
            ctx.strokeStyle = display.tileColor
            ctx.lineWidth = 6;
            if (e1.attackDirection !== null || e1.attackerDirection !== null) {
              let text = e1.combatDisplay
              if (e1.attackDirection === 'N' || e1.attackerDirection === 'N') {
                ctx.strokeText(text, x * display.tileSize + display.offsetX + (display.tileSize - (ctx.measureText(text).width / 2)) + 25, y * display.tileSize + display.offsetY + (display.tileSize / 1.7))
                ctx.fillText(text, x * display.tileSize + display.offsetX + (display.tileSize - (ctx.measureText(text).width / 2)) + 25, y * display.tileSize + display.offsetY + (display.tileSize / 1.7))
              }
              if (e1.attackDirection === 'S' || e1.attackerDirection === 'S') {
                ctx.strokeText(text, x * display.tileSize + display.offsetX + (0 - (ctx.measureText(text).width / 2)) - 25, y * display.tileSize + display.offsetY + (display.tileSize / 1.7))
                ctx.fillText(text, x * display.tileSize + display.offsetX + (0 - (ctx.measureText(text).width / 2)) - 25, y * display.tileSize + display.offsetY + (display.tileSize / 1.7))
              }
              if (e1.attackDirection === 'E' || e1.attackerDirection === 'E') {
                ctx.strokeText(text, x * display.tileSize + display.offsetX + ((display.tileSize / 2) - (ctx.measureText(text).width / 2)), y * display.tileSize + display.offsetY + display.tileSize + (display.tileSize / 10) + 15)
                ctx.fillText(text, x * display.tileSize + display.offsetX + ((display.tileSize / 2) - (ctx.measureText(text).width / 2)), y * display.tileSize + display.offsetY + display.tileSize + (display.tileSize / 10) + 15)
              }
              if (e1.attackDirection === 'W' || e1.attackerDirection === 'W') {
                ctx.strokeText(text, x * display.tileSize + display.offsetX + ((display.tileSize / 2) - (ctx.measureText(text).width / 2)), y * display.tileSize + display.offsetY + (display.tileSize / 10) - 15)
                ctx.fillText(text, x * display.tileSize + display.offsetX + ((display.tileSize / 2) - (ctx.measureText(text).width / 2)), y * display.tileSize + display.offsetY + (display.tileSize / 10) - 15)
              }
            } else {
              ctx.fillStyle = display.healTextColor
              let text = e1.combatDisplay
              ctx.strokeText(text, x * display.tileSize + display.offsetX + ((display.tileSize / 2) - (ctx.measureText(text).width / 2)), y * display.tileSize + display.offsetY + (display.tileSize / 10) - 15)
              ctx.fillText(text, x * display.tileSize + display.offsetX + ((display.tileSize / 2) - (ctx.measureText(text).width / 2)), y * display.tileSize + display.offsetY + (display.tileSize / 10) - 15)

            }
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
    if (document.getElementById("canvas") !== null)
      $('#leaderboard').css('min-width', $('#canvas').css('width'))
    else
      $('#leaderboard').css('width', 'initial')

    let leaderboard = game.leaderboard.sort((a, b) => {
      if (a.wins + a.level > b.wins + b.level)
        return -1
      if (a.wins + a.level < b.wins + b.level)
        return 1
      return 0
    })
    if (leaderboard.length > 1000) {
      leaderboard.splice(1000, leaderboard.length - 1000)
      game.leaderboard = leaderboard
    }

    $('#leaderboard').text('')

    let amountToShow = leaderboard.length < 10 ? leaderboard.length : 10
    let output = '<div>'
    for (let i = 0; i < amountToShow; i++) {
      output += `<div style="display: inline-block;"><div style="display: inline-block; width:53px;">#${i + 1}${i === 0 ? '👑' : ''}: </div>
      <div class="emoticon">${leaderboard[i].emoticon}</div> 🏅:${leaderboard[i].wins + leaderboard[i].level} 🏆:${leaderboard[i].wins} ⭐:${leaderboard[i].level} ❤️:${leaderboard[i].stats.health} ⚔️:${leaderboard[i].stats.attack} 🛡️:${leaderboard[i].stats.defence}  ${leaderboard[i].player ? '👈' : ''}</div><br>`
    }

    output += `</div><br><br><div>`
    for (let i = 0; i < leaderboard.length; i++) {
      output += `<div class="emoticon">${leaderboard[i].emoticon}</div>&nbsp;&nbsp;&nbsp;`
    }
    output += `</div>`
    $('#leaderboard').append(output)
  },

  drawAIRumbleButtons() {
    $('#game-buttons').append(
      `<span id="slower-button" class="game-button"><span>🐢</span></span> 
      <span id="faster-button" class="game-button"><span>🐇</span></span>`)

    if (display.darkMode)
      display.applyDarkMode()
    else
      display.applyLightMode()

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

    if (display.darkMode)
      display.applyDarkMode()
    else
      display.applyLightMode()

    $('#back-button').click(function () {
      game.reset()
      game.createPlayerLeaderboard()
      display.leaderboardRenderer.tick()
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

    if (display.darkMode)
      display.applyDarkMode()
    else
      display.applyLightMode()

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
      $('#display').append(`<canvas id="canvas" width="${(game.config.xTileCount * display.tileSize) + (display.offsetX * 2)}" height="${(game.config.yTileCount * display.tileSize) + (display.offsetY * 2)}">`)
      $('body').css('min-width', (game.config.xTileCount * display.tileSize) + (display.offsetX * 2))
    }

    let canvas = document.getElementById("canvas")
    let ctx = canvas.getContext("2d")
    display.drawBoard(ctx)
  }
}

class Wall {
  constructor() {
    let emojis = ['🌳', '🌲', '⛰️', '🏔️', '🏠', '🏡', '🏘️', '🏦', '🏫', '🏥', '🏢', '⛪', '🏣', '🏬']
    this.emoji = emojis[getRandomInt(emojis.length)]
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
    }
    else
      this.stats = createStats()

    this.level = ((this.stats.health - game.config.baseHealth) / game.config.healthMultiplier) + this.stats.attack + this.stats.defence - (game.config.baseStatPoints - 1)
    this.wins = 0
    this.target = null
    this.inCombat = false
    this.attackDirection = null
    this.attackerDirection = null
    this.combatDisplay = null
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
    let heal = 0
    if (this.level > e2.level) {
      let lifeSteal = 1 - ((this.level - e2.level) * game.config.lifeStealModifier)
      if (lifeSteal < 0)
        lifeSteal = 0

      heal = Math.floor(e2.stats.health * lifeSteal)
      if (this.stats.currentHealth + heal > this.stats.health)
        heal = this.stats.health - this.stats.currentHealth

      this.stats.currentHealth += heal
    } else {
      heal = this.stats.health - this.stats.currentHealth

      this.stats.currentHealth += heal
    }

    if (this.player) {
      if (this.combatDisplay === '🎲')
        this.combatDisplay = `🎲+${heal}❤️`
      else
        this.combatDisplay = `+${heal}❤️`

      let clearCombatDisplayTimer = {
        timer: null,
        stopTimer: function () {
          clearTimeout(this.timer)
        }
      }

      clearCombatDisplayTimer.timer = window.setTimeout(function (timer, player) {
        game.removeFightTimer(timer)
        player.combatDisplay = null
      }, game.config.playerFightSpeed * 1.3, clearCombatDisplayTimer, this)
      game.fightTimers.push(clearCombatDisplayTimer)
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
        } else if (game.isWall(moveX, moveY)) {
          moveRandom(pos, this)
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
        moveRandom(pos, this)
      }
    }

    function moveRandom(pos, e1) {
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
        game.board[moveY][moveX] = e1
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

  if (e1.attackDirection === 'N')
    e2.attackerDirection = 'S'
  if (e1.attackDirection === 'S')
    e2.attackerDirection = 'N'
  if (e1.attackDirection === 'E')
    e2.attackerDirection = 'W'
  if (e1.attackDirection === 'W')
    e2.attackerDirection = 'E'

  let aiFight = function (e1, e2, fightTimer) {
    game.removeFightTimer(fightTimer)

    while (true) {
      attack(e1, e2)
      attack(e2, e1)

      let status = checkStatus(e1, e2)

      if (status) {
        let fightOutcomeTimer = {
          timer: null,
          stopTimer: function () {
            clearTimeout(this.timer)
          }
        }

        fightOutcomeTimer.timer = window.setTimeout(function (timer) {
          game.removeFightTimer(timer)
          e1.attackDirection = null
          e2.attackerDirection = null
          fightOutcome(e1, e2, status)
        }, game.aiSpeed, fightOutcomeTimer)
        game.fightTimers.push(fightOutcomeTimer)

        break
      }
    }
  }

  let playerFight = function (e1, e2, thisFight, fightTimer) {
    if (fightTimer)
      game.removeFightTimer(fightTimer)

    e2.combatDisplay = `-${attack(e1, e2)}🎯`
    e1.combatDisplay = `-${attack(e2, e1)}🎯`

    let status = checkStatus(e1, e2)

    if (status) {
      let fightOutcomeTimer = {
        timer: null,
        stopTimer: function () {
          clearTimeout(this.timer)
        }
      }

      fightOutcomeTimer.timer = window.setTimeout(function (timer) {
        game.removeFightTimer(timer)
        e1.attackDirection = null
        e2.attackerDirection = null
        e1.combatDisplay = null
        e2.combatDisplay = null
        fightOutcome(e1, e2, status)
      }, game.config.playerFightSpeed, fightOutcomeTimer)
      game.fightTimers.push(fightOutcomeTimer)
    } else {
      let fightTimer = {
        timer: null,
        stopTimer: function () {
          clearTimeout(this.timer)
        }
      }

      fightTimer.timer = window.setTimeout(thisFight, game.config.playerFightSpeed, e1, e2, thisFight, fightTimer)
      game.fightTimers.push(fightTimer)

      let clearCombatDisplayTimer = {
        timer: null,
        stopTimer: function () {
          clearTimeout(this.timer)
        }
      }

      clearCombatDisplayTimer.timer = window.setTimeout(function (timer) {
        game.removeFightTimer(timer)
        e2.combatDisplay = null
        e1.combatDisplay = null
      }, game.config.playerFightSpeed * .9, clearCombatDisplayTimer)
      game.fightTimers.push(clearCombatDisplayTimer)
    }
  }


  if (e1.player || e2.player) {
    playerFight(e1, e2, playerFight)
  } else {
    let fightTimer = {
      timer: null,
      stopTimer: function () {
        clearTimeout(this.timer)
      }
    }
    fightTimer.timer = window.setTimeout(aiFight, game.aiSpeed, e1, e2, fightTimer)
    game.fightTimers.push(fightTimer)
  }
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
  return hit
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
    if (getRandomInt(2)) {
      if (e1.player)
        e1.combatDisplay = '🎲'
      status = 'win'
    } else {
      if (e2.player)
        e2.combatDisplay = '🎲'
      status = 'lose'
    }
  }
  if (status === 'win') {
    if (e2.player)
      game.gameOver()

    e1.wins++
    e1.levelUp(e2)
    e1.lifeSteal(e2)

    if (e2.level > 1)
      game.leaderboard.push(e2)
    e2.remove()

    if (e2.level > 1)
      game.spawnEmoticon(Math.ceil(e2.level / game.config.spawnLevelSplit))
    game.spawnEmoticon(Math.ceil(e2.level / game.config.spawnLevelSplit))

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
      game.leaderboard.push(e1)
    e1.remove()

    if (e1.level > 1)
      game.spawnEmoticon(Math.ceil(e1.level / game.config.spawnLevelSplit))
    game.spawnEmoticon(Math.ceil(e1.level / game.config.spawnLevelSplit))

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
  let facesLeft = ['(', '[', '{', 'ʕ', '≧', '>', '=', '༼', '|', '｡', '⋟', '꒰']
  let facesRight = [')', ']', '}', 'ʔ', '≦', '<', '=', '༽', '|', '｡', '⋞', '꒱']
  let eyes = ['^', ';', '╥', '*', '•', '●', '◔', '◑', '◉', '˘', '❛', '◠', '︺', '⊙', '♡', 'x', 'Q', 'ಠ', '°', '☆', 'Θ', 'ఠ', '¬']
  let mouths = ['ᴥ', 'v', 'o', '_', '.', '-', '◡', '⌓', '︹', '︿', 'ᆺ', '﹏', 'ᆽ', 'Д', 'w', '□', 'ω', ' ͜ʖ', '±', '◇', '～', '∇', '⍨', '₃', 'ε']

  let faceIndex = getRandomInt(facesLeft.length)
  let eyeIndex = getRandomInt(eyes.length)
  let mouthIndex = getRandomInt(mouths.length)

  return facesLeft[faceIndex] + eyes[eyeIndex] + mouths[mouthIndex] + eyes[eyeIndex] + facesRight[faceIndex]
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max)
}

function healthToPoints(health) {
  return (health - game.config.baseHealth) / game.config.healthMultiplier
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