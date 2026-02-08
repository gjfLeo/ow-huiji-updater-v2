settings {
    "lobby": {
        "team1Slots": 5,
        "team2Slots": 0,
        "allowPlayersInQueue": true
    },
    "gamemodes": {
        "skirmish": {
            "enabledMaps": [
                "workshopChamber"
            ]
        },
        "general": {
            "enablePerks": true,
            "heroLimit": "off",
            "roleLimit": "off",
            "enableRandomHeroes": false
        }
    }
}

globalvar dummy
playervar xp = 0

rule "Init game":
    createDummy(Hero.SOLDIER, Team.2, -1, vect(0, 50, 0), vect(0, 0, 0))
    dummy = getLastCreatedEntity()
    dummy.setStatusEffect(null, Status.UNKILLABLE, Math.INFINITY)
    dummy.setMaxHealth(10000)
    dummy.startHealingOverTime(null, Math.INFINITY, 1000000)

rule "Init player":
    @Event eachPlayer
    @Condition eventPlayer.isDummy() == false
    hudHeader(eventPlayer, eventPlayer.xp, HudPosition.ACTUALLY_LEFT)
    hudSubtext(eventPlayer, "Q: +100, E: +10, S: +1\nR: Restart", HudPosition.ACTUALLY_LEFT)
    waitUntil(eventPlayer.hasSpawned())
    eventPlayer.setAbility1Enabled(false)
    eventPlayer.setAbility2Enabled(false)
    eventPlayer.setUltEnabled(false)
    eventPlayer.setReloadEnabled(false)

rule "Get 1000 XP":
    @Event eachPlayer
    @Condition eventPlayer.isDummy() == false
    @Condition eventPlayer.isHoldingButton(Button.JUMP)
    waitUntil(dummy.getHealth() > 1000)
    damage(dummy, eventPlayer, 1000)
    eventPlayer.xp += 1000

rule "Get 100 XP":
    @Event eachPlayer
    @Condition eventPlayer.isDummy() == false
    @Condition eventPlayer.isHoldingButton(Button.ULTIMATE)
    waitUntil(dummy.getHealth() > 100)
    damage(dummy, eventPlayer, 100)
    eventPlayer.xp += 100

rule "Get 10 XP":
    @Event eachPlayer
    @Condition eventPlayer.isDummy() == false
    @Condition eventPlayer.isHoldingButton(Button.ABILITY_2)
    waitUntil(dummy.getHealth() > 10)
    damage(dummy, eventPlayer, 10)
    eventPlayer.xp += 10

rule "Get 1 XP":
    @Event eachPlayer
    @Condition eventPlayer.isDummy() == false
    @Condition eventPlayer.isHoldingButton(Button.ABILITY_1)
    waitUntil(dummy.getHealth() > 1)
    damage(dummy, eventPlayer, 1)
    eventPlayer.xp += 1

rule "Time end":
    wait(180)
    bigMessage(getAllPlayers(), "比赛时间超过180秒，威能获取提升")
    hudHeader(getAllPlayers(), "已超过180秒", HudPosition.TOP, 0, Color.RED)

rule "Restart game":
    @Event eachPlayer
    @Condition eventPlayer.isDummy() == false
    @Condition eventPlayer.isHoldingButton(Button.RELOAD)
    @Condition eventPlayer.isHoldingButton(Button.CROUCH)
    restartMatch()
