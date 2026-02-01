settings {
    "lobby": {
        "team1Slots": 6,
        "team2Slots": 0,
        "allowPlayersInQueue": true
    },
    "gamemodes": {
        "skirmish": {
            "enabledMaps": [
                "workshopChamber"
            ],
            "enablePerks": false
        },
        "general": {
            "heroLimit": "off",
            "enableRandomHeroes": true,
            "respawnTime%": 0,
        }
    },
    "heroes": {
        "team1": {
            "enabledHeroes": ["baptiste"],
            "baptiste": {
                "enablePrimaryFire": false,
                "enableSecondaryFire": false,
                "enableAbility1": false,
                "enableUlt": false,
            },
        }
    }
}

# MARK: 全局

globalvar dvaDummy1
globalvar dvaDummy2

rule "Init Game":
    @Event global
    wait(1)
    createDummy(Hero.DVA, Team.2, -1, vect(0, 0, 1), vect(0, 0, 0))
    dvaDummy1 = getLastCreatedEntity()
    dvaDummy1.startForcingPosition(vect(0, 0, 1))
    dvaDummy1.setStatusEffect(null, Status.INVINCIBLE, Math.INFINITY)
    createDummy(Hero.DVA, Team.2, -1, vect(0, 0, -1), vect(0, 0, 0))
    dvaDummy2 = getLastCreatedEntity()
    dvaDummy2.startForcingPosition(vect(0, 0, -1))
    dvaDummy2.setStatusEffect(null, Status.INVINCIBLE, Math.INFINITY)

# MARK: 玩家

playervar unkillableTime
rule "Player Init":
    @Event eachPlayer
    @Team 1
    eventPlayer.disableGamemodeHud()
    eventPlayer.unkillableTime = 0
    for eventPlayer.I in range(5):
        hudSubtext(eventPlayer, " ", HudPosition.TOP)
    hudHeader(eventPlayer if eventPlayer.unkillableTime > 0 else null, updateEveryFrame(eventPlayer.unkillableTime), HudPosition.TOP)

rule "Player Spawn":
    @Event eachPlayer
    @Team 1
    @Condition eventPlayer.getHealth() > 0
    eventPlayer.teleport(vect(8, 0, 0))
    eventPlayer.setFacing(vect(-1, 0, 0), Relativity.TO_WORLD)

rule "Player E":
    # 清除E冷却
    @Event eachPlayer
    @Hero baptiste
    # @Condition eventPlayer.getAbilityCooldown(Button.ABILITY_2) > 0
    @Condition updateEveryFrame(eventPlayer.isHoldingButton(Button.ABILITY_2))
    wait(0.688) # 0.016 * 43
    eventPlayer.setAbilityCooldown(Button.ABILITY_2, 0)

# rule "Unkillable Start":
#     @Event eachPlayer
#     @Team 1
#     @Condition updateEveryFrame(eventPlayer.hasStatus(Status.UNKILLABLE))
#     eventPlayer.unkillableTime = 0
#     chaseAtRate(eventPlayer.unkillableTime, Math.INFINITY, 1000)

# rule "Unkillable End":
#     @Event eachPlayer
#     @Team 1
#     @Condition updateEveryFrame(eventPlayer.hasStatus(Status.UNKILLABLE) == false)
#     stopChasingVariable(eventPlayer.unkillableTime)
#     smallMessage(eventPlayer, f'  效果持续时间：{updateEveryFrame(eventPlayer.unkillableTime)}')

# MARK: 操作

rule "Reset":
    @Event eachPlayer
    @Team 1
    @Condition eventPlayer.isHoldingButton(Button.RELOAD)
    # 使机器人召唤机甲
    if dvaDummy1.getMaxHealth() < 200:
        dvaDummy1.setUltCharge(100)
        dvaDummy1.forceButtonPress(Button.ULTIMATE)
    if dvaDummy2.getMaxHealth() < 200:
        dvaDummy2.setUltCharge(100)
        dvaDummy2.forceButtonPress(Button.ULTIMATE)
    # 重置玩家状态
    [p for p in getAllPlayers() if p.getTeam() == Team.1].teleport(vect(8, 0, 0))
    [p for p in getAllPlayers() if p.getTeam() == Team.1].setFacing(vect(-1, 0, 0), Relativity.TO_WORLD)
    [p for p in getAllPlayers() if p.getTeam() == Team.1].setHealth(1000)
    [p for p in getAllPlayers() if p.getTeam() == Team.1].unkillableTime = 0

rule "Run":
    @Event eachPlayer
    @Team 1
    @Condition eventPlayer.isHoldingButton(Button.INTERACT)
    eventPlayer.setAbilityCooldown(Button.ABILITY_2, 0)
    # 使两个机器人间隔1帧施放自毁
    dvaDummy1.setUltCharge(100)
    dvaDummy1.forceButtonPress(Button.ULTIMATE)
    wait()
    dvaDummy2.setUltCharge(100)
    dvaDummy2.forceButtonPress(Button.ULTIMATE)

rule "Run Single":
    @Event eachPlayer
    @Team 1
    @Condition eventPlayer.isHoldingButton(Button.PRIMARY_FIRE)
    eventPlayer.setAbilityCooldown(Button.ABILITY_2, 0)
    # 使瞄准的机器人施放自毁
    raycast(eventPlayer.getEyePosition(), eventPlayer.getEyePosition() + eventPlayer.getFacingDirection() * 100, getAllPlayers(), eventPlayer, true).getPlayerHit().setUltCharge(100)
    raycast(eventPlayer.getEyePosition(), eventPlayer.getEyePosition() + eventPlayer.getFacingDirection() * 100, getAllPlayers(), eventPlayer, true).getPlayerHit().forceButtonPress(Button.ULTIMATE)
