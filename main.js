
window.onload = function () {
  display.titleTimer.tick()
}

$('#rumble-nav').click(function () {
  //$('#nav').hide()
  game.rumble()
})

$('#ai-rumble-nav').click(function () {
  $('#nav').hide()
  game.aiRumble()
})

let game = {
  config: {
    baseHealth: 20,
    healthMultiplier: 2,
    blockChance: .04,
    blockLimit: .90,
    rollAmount: 6,
    baseStatPoints: 20,
    baseMaxHealthPoints: 10,
    baseMaxAttackPoints: 10,
    baseMaxDefencePoints: 10,
    lifeStealModifier: .05,
    renderSpeed: 33,
    aiSpeed: 1000,
    xTileCount: 8,
    yTileCount: 8,
  },
  board: [],
  leaderboard: [],
  aiMoveTimers: [],
  leaderboardRenderer: {
    tickNumber: 0,
    timer: null,
    tick: function () {
      display.drawLeaderboard()
      game.leaderboardRenderer.tickNumber++
      game.leaderboardRenderer.timer = window.setTimeout('game.leaderboardRenderer.tick()', 2000)
    },
    stopTimer: function () {
      game.leaderboardRenderer.tickNumber = 0
      clearTimeout(game.leaderboardRenderer.timer)
    }
  },
  createBoard: function () {
    game.config.xTileCount = Math.floor((window.innerWidth - 20) / display.tileSize)
    game.config.yTileCount = Math.floor((window.innerHeight - 58) / display.tileSize)

    game.board = Array(game.config.yTileCount).fill(null).map(() => new Array(game.config.xTileCount).fill(null))
  },
  renderer: {
    tickNumber: 0,
    timer: null,
    tick: function () {
      display.drawGame()
      game.renderer.tickNumber++
      game.renderer.timer = window.setTimeout('game.renderer.tick()', game.config.renderSpeed)
    },
    stopTimer: function () {
      game.renderer.tickNumber = 0
      clearTimeout(game.renderer.timer)
    }
  },
  createAIMoveTimer: function (e1) {
    let timer = {
      emoticon: e1,
      timer: null,
      tick: function (thisTimer) {
        if (thisTimer === undefined)
          thisTimer = this

        if (!thisTimer.emoticon.inCombat)
          thisTimer.emoticon.moveToTarget()
        this.timer = window.setTimeout(thisTimer.tick, game.config.aiSpeed + getRandomInt(100), thisTimer);
      }
    }
    timer.tick()
    game.aiMoveTimers.push(timer)
  },
  removeAIMoveTimer: function (e1) {
    game.aiMoveTimers.forEach(t => {
      if (t.emoticon === e1) {
        clearTimeout(t.timer)
        const index = game.aiMoveTimers.indexOf(t)
        if (index > -1) {
          game.aiMoveTimers.splice(index, 1)
        }
      }
    })
  },
  isEmpty: function (posX, posY) {
    if (posX < 0 || posX > game.config.xTileCount - 1 || posY < 0 || posY > game.config.yTileCount - 1)
      return null

    if (game.board[posY][posX] === null)
      return true
    else
      return false
  },
  isEmoticon: function (posX, posY) {
    if (posX < 0 || posX > game.config.xTileCount - 1 || posY < 0 || posY > game.config.yTileCount - 1)
      return null

    if (game.board[posY][posX] instanceof Emoticon) {
      return true
    }
    else {
      return false
    }
  },
  spawnEmoticon: function (level) {
    let spawnLimit = Math.floor(((game.config.xTileCount + game.config.yTileCount) / 2))
    if (level === undefined || level < 1) {
      level = 1
    }
    if (game.aiMoveTimers.length < spawnLimit) {
      let spawnAttempts = 20
      while (spawnAttempts >= 0) {
        let posX = getRandomInt(game.config.xTileCount)
        let posY = getRandomInt(game.config.yTileCount)
        if (game.isEmpty(posX, posY) && !game.isEmoticon(posX + 1, posY) && !game.isEmoticon(posX, posY + 1) && !game.isEmoticon(posX - 1, posY) && !game.isEmoticon(posX, posY - 1)) {
          let e1 = new Emoticon()
          if (level > 1) {
            for (let i = 1; i < level; i++) {
              e1.levelUp()
            }
          }
          game.board[posY][posX] = e1
          game.createAIMoveTimer(game.board[posY][posX])
          break
        }
        spawnAttempts--
      }

    }
  },
  findEmoticon: function (e1) {
    for (let y = 0; y < game.board.length; y++) {
      let x = game.board[y].indexOf(e1)
      if (x > -1) {
        return [x, y]
      }
    }
    return null
  },
  rumble: function () {

  },
  aiRumble: function () {
    game.createBoard()
    display.drawAIRumbleButtons()
    game.renderer.tick()
    game.leaderboardRenderer.tick()
    game.spawnEmoticon()
    game.spawnEmoticon()
  }
}

let display = {
  titleTimer: {
    timer: null,
    tick: function () {
      $('#title').empty()
      $('#title').append(`${createEmoticon()} [Emoticon] [Rumble] ${createEmoticon()}`)
      display.titleTimer.timer = window.setTimeout('display.titleTimer.tick()', 4000)
    }
  },
  tileSize: 80,
  drawBoard: function (ctx) {
    for (let y = 0; y < game.config.yTileCount; y++) {
      for (let x = 0; x < game.config.xTileCount; x++) {
        if (y % 2 === 0) {
          if (x % 2 === 0)
            ctx.fillStyle = "#c7ecff"
          else
            ctx.fillStyle = "#fff4ff"
        } else {
          if (x % 2 != 0)
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
          //Level Boarder
          if (e1.level > 4) {
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#99ff99";
            if (e1.level > 9)
              ctx.strokeStyle = "#3399ff";
            if (e1.level > 14)
              ctx.strokeStyle = "#ff66ff";
            if (e1.level > 19)
              ctx.strokeStyle = "#ff3333";
            ctx.strokeRect(x * display.tileSize, y * display.tileSize, display.tileSize, display.tileSize);
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
          if (e1.attackDirection != null) {
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
  },
  drawLeaderboard: function () {
    let leaderboard = game.leaderboard.sort((a, b) => {
      if (a.level > b.level)
        return -1
      if (a.level < b.level)
        return 1
      return 0
    })

    $('#leaderboard').text('')

    let fightersToShow = leaderboard.length < 10 ? leaderboard.length : 10
    let output = ''
    for (let i = 0; i < fightersToShow; i++) {
      output += `<div style="display: inline-block;"><div style="display: inline-block; width:53px;">#${i + 1}${i === 0 ? '👑' : ''}: </div><div class="emoticon">${leaderboard[i].emoticon}</div> ⭐${leaderboard[i].level} 🏆:${leaderboard[i].wins} ❤️:${leaderboard[i].stats.health} ⚔️:${leaderboard[i].stats.attack} 🛡️:${leaderboard[i].stats.defence}</div><br>`
    }

    output += `<br><br>`
    fightersToShow = leaderboard.length < 1000 ? leaderboard.length : 1000
    for (let i = 0; i < fightersToShow; i++) {
      output += `<div class="emoticon">${leaderboard[i].emoticon}</div>&nbsp;&nbsp;&nbsp;`
    }

    $('#leaderboard').append(output)
  },
  drawAIRumbleButtons: function () {
    $('#game-buttons').append(`<span id="slower-button" class="game-button"><span>🐢</span></span> <span id="faster-button" class="game-button"><span>🐇</span></span> <span id="back-button" class="game-button"><span>🔙</span></span>`)

    $('#back-button').click(function () {
      window.location.reload()
    })
    $('#slower-button').click(function () {
      game.config.aiSpeed += 100
      if (game.config.aiSpeed > 100 && game.config.aiSpeed < 200)
        game.config.aiSpeed = 100
    })
    $('#faster-button').click(function () {
      if (game.config.aiSpeed < 200)
        game.config.aiSpeed = 10
      else
        game.config.aiSpeed -= 100
    })
  },
  drawGame: function () {
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

    if (health != undefined && attack != undefined && defence != undefined) {
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
  }

  levelUp(e2) {
    let points = 0
    if (e2 != undefined) {
      if (e2.level < this.level)
        points += getRandomInt(2)

      if (e2.level >= this.level) {
        points++
        points += Math.floor((e2.level - this.level) / 2)
      }
    } else {
      points++
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
  }

  lifeSteal(e2) {
    if (this.level > e2.level) {
      let lifeSteal = 1 - ((this.level - e2.level) * game.config.lifeStealModifier)
      this.stats.currentHealth += Math.floor(this.stats.health * lifeSteal)
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
    if (pos != null)
      game.board[pos[1]][pos[0]] = null
  }

  findTarget() {
    let potentialTargets = []
    for (let y = 0; y < game.config.yTileCount; y++) {
      for (let x = 0; x < game.config.xTileCount; x++) {
        if (game.isEmoticon(x, y)) {
          let pos = this.getPosition()
          if (pos != null) {
            if (x != pos[0] && y != pos[1]) {
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
    if (pos != null) {
      if (this.target != null) {
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

            aiFight(this, game.board[moveY][moveX])
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

            aiFight(this, game.board[moveY][moveX])
          }
        }
      }
    }
  }
}

function aiFight(e1, e2) {
  e1.inCombat = true
  e2.inCombat = true
  let fight = function (e1, e2) {
    while (true) {
      attack(e1, e2)
      attack(e2, e1)

      let status = checkStatus(e1, e2)
      if (status === 'draw') {

        if (e1.level > 2 || e2.level > 2)
          game.spawnEmoticon()
        game.spawnEmoticon(Math.floor(e1.level / 2))
        game.spawnEmoticon(Math.floor(e2.level / 2))

        e1.remove()
        e2.remove()
        break
      }
      if (status === 'win') {
        e1.wins++
        e1.levelUp(e2)
        e1.lifeSteal(e2)

        if (e2.level > 2)
          game.spawnEmoticon(Math.floor(e2.level / 2))
        game.spawnEmoticon(Math.floor(e2.level / 2))

        if (e2.level > 1)
          game.leaderboard.push(e2)
        e2.remove()

        e1.attackDirection = null
        e1.target = null
        e1.inCombat = false
        break
      }
      if (status === 'lose') {
        e2.wins++
        e2.levelUp(e1)
        e2.lifeSteal(e1)

        if (e1.level > 2)
          game.spawnEmoticon(Math.floor(e1.level / 2))
        game.spawnEmoticon(Math.floor(e1.level / 2))

        if (e1.level > 1)
          game.leaderboard.push(e1)
        e1.remove()

        e2.target = null
        e2.inCombat = false
        break
      }
    }
  }
  window.setTimeout(fight, game.config.aiSpeed, e1, e2)
}

function attack(e1, e2) {
  let roll = 1 + getRandomInt(game.config.rollAmount)
  let hitChance = Math.random()
  let blockChance = Math.floor((game.config.blockChance * e2.stats.defence) * 100) / 100
  if (blockChance > game.config.blockLimit)
    blockChance = game.config.blockLimit
  if (hitChance > blockChance) {
    let hit = e1.stats.attack + roll
    e2.stats.currentHealth = e2.stats.currentHealth - hit
    return {
      result: 'hit',
      roll,
      hit
    }
  }
  return {
    result: 'block',
    blockChance: Math.round(blockChance * 100) / 100,
    hitChance: Math.round(hitChance * 100) / 100
  }
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
    facesLeft: ['(', '[', '{', 'ʕ', '≧', '>', '=', '༼', '|'],
    facesRight: [')', ']', '}', 'ʔ', '≦', '<', '=', '༽', '|'],
    eyes: ['^', ';', '*', '•́', '◔', '◑', '◉', '˘', '❛', '◠', '⊙', '♡', 'x', 'Q', 'ಠ', '°', '☆', 'Θ'],
    mouths: ['ᴥ', 'v', 'o', '_', '.', '-', '◡', '︹', '﹏', 'ᆽ', 'Д', 'w', '□', 'ω']
  }

  let faceIndex = getRandomInt(parts.facesLeft.length)
  let eyeIndex = getRandomInt(parts.eyes.length)
  let mouthIndex = getRandomInt(parts.mouths.length)

  return parts.facesLeft[faceIndex] + parts.eyes[eyeIndex] + parts.mouths[mouthIndex] + parts.eyes[eyeIndex] + parts.facesRight[faceIndex]
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max)
}