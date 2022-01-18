
window.onload = function () {
  titleTimer.tick()
}

$('#rumble-nav').click(function () {
  //$('#nav').hide()
  game.rumble()
})

$('#ai-rumble-nav').click(function () {
  $('#nav').hide()
  game.aiRumble()
})

let titleTimer = {
  timer: null,
  tick: function () {
    $('#title').empty()
    $('#title').append(`${createEmoticon()} [Emoticon] [Rumble] ${createEmoticon()}`)
    titleTimer.timer = window.setTimeout('titleTimer.tick()', 4000)
  }
}

let game = {
  config: {
    baseHealth: 20,
    healthMultiplier: 2,
    blockChance: .05,
    baseRollAmount: 6,
    baseStatPoints: 20,
    baseMaxHealthPoints: 10,
    baseMaxAttackPoints: 10,
    baseMaxDefencePoints: 10,
    lifeStealModifier: .1,
    renderSpeed: 40,
    aiSpeed: 800,
    xTileCount: 8,
    yTileCount: 8,
  },
  board: [],
  leaderboard: [],
  leaderboardRenderer: {
    tickNumber: 0,
    timer: null,
    tick: function () {
      display.drawLeaderboard()
      this.tickNumber++
      this.timer = window.setTimeout('game.leaderboardRenderer.tick()', 2000)
    },
    stopTimer: function () {
      this.tickNumber = 0
      clearTimeout(this.timer)
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
      this.tickNumber++
      this.timer = window.setTimeout('game.renderer.tick()', game.config.renderSpeed)
    },
    stopTimer: function () {
      this.tickNumber = 0
      clearTimeout(this.timer)
    }
  },
  aiMoveTimers: [],
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
  spawnEmoticon: function (count) {
    for (let i = 0; i < count; i++) {
      let spawnAttempts = 20
      while (spawnAttempts > 0) {
        let posX = getRandomInt(game.config.xTileCount)
        let posY = getRandomInt(game.config.yTileCount)
        if (game.isEmpty(posX, posY) && game.isEmoticon(posX + 1, posY) == false && game.isEmoticon(posX, posY + 1) == false && game.isEmoticon(posX - 1, posY) == false && game.isEmoticon(posX, posY - 1) == false) {
          game.board[posY][posX] = new Emoticon()
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
    game.renderer.tick()
    game.leaderboardRenderer.tick()
    game.spawnEmoticon(2)
  }
}


let display = {
  titleTimer: {
    timer: null,
    tick: function () {
      $('#title').empty()
      $('#title').append(`${createEmoticon()} [Emoticon] [Rumble] ${createEmoticon()}`)
      titleTimer.timer = window.setTimeout('titleTimer.tick()', 4000)
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
          //Stats
          ctx.font = "11px Verdana"
          let stats = `❤️${e1.stats.currentHealth}⚔️${e1.stats.attack}🛡️${e1.stats.defence}`
          ctx.fillText(stats, x * display.tileSize + (40 - (ctx.measureText(stats).width / 2)), y * display.tileSize + 24)
          //Emoticon
          ctx.font = "16px Verdana"
          ctx.fillText(e1.emoticon, x * display.tileSize + (40 - (ctx.measureText(e1.emoticon).width / 2)), y * display.tileSize + 44)
          //Level
          ctx.font = "12px Verdana"
          let level = `⭐${e1.level}`
          ctx.fillText(level, x * display.tileSize + (40 - (ctx.measureText(level).width / 2)), y * display.tileSize + 64)
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

    $('#leaderboard').css('min-width', $('body').css('min-width'))
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
  drawGame: function () {
    if (document.getElementById("canvas") === null) {
      $('#display').append(`<canvas id="canvas" width="${game.config.xTileCount * display.tileSize}" height="${game.config.yTileCount * display.tileSize}">`)
      $('body').css('min-width', game.config.xTileCount * display.tileSize)
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
    let points = 1
    if (e2.level > this.level)
      points += Math.floor((e2.level - this.level) / 2)

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
      let lifeStealModifier = (this.level - e2.level) * game.config.lifeStealModifier
      this.stats.currentHealth += Math.floor(this.stats.health * (1 - lifeStealModifier))
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
              this.attackDirection = 'E'
            if (pos[0] - moveX < 0)
              this.attackDirection = 'W'
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
              this.attackDirection = 'E'
            if (pos[0] - moveX < 0)
              this.attackDirection = 'W'
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
        e1.remove()
        e2.remove()
        game.spawnEmoticon(2)
        break
      }
      if (status === 'win') {
        e1.wins++
        e1.levelUp(e2)
        e1.lifeSteal(e2)

        let spawn = 1
        if (e2.level > 2)
          spawn++
        game.spawnEmoticon(spawn)

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

        let spawn = 1
        if (e1.level > 2)
          spawn++
        game.spawnEmoticon(spawn)

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
  let roll = 1 + getRandomInt(game.config.baseRollAmount)
  let hitChance = Math.random()
  let blockChance = game.config.blockChance * e2.stats.defence
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