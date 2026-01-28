settings {
    "gamemodes": {
        "skirmish": {
            "enabledMaps": [
                "workshopExpanse"
            ],
            "enablePerks": true
        },
        "general": {
            "heroLimit": "off",
            "respawnTime%": 30
        }
    },
    "heroes": {
        "team1": {
            "wreckingBall": {
                "jumpVerticalSpeed%": 200
            }
        }
    }
}

globalvar dvaDummy
globalvar angle = 10

rule "Init D.Va Dummy":
    @Event global
    wait(1)
    createDummy(Hero.DVA, Team.2, -1, vect(0, 0, 0), vect(0, 0, 0))
    dvaDummy = getLastCreatedEntity()

rule "D.Va Dummy Spawn":
    @Event eachPlayer
    @Condition eventPlayer == dvaDummy
    @Condition eventPlayer.getMaxHealth() > 200

    dvaDummy.teleport(vect(0, 0, 0))
    dvaDummy.setFacing(Vector.FORWARD * angle + Vector.UP, Relativity.TO_PLAYER)
    dvaDummy.setAbilityCooldown(Button.ABILITY_1, 0)
    dvaDummy.setUltCharge(100)

rule "D.Va Self-Destruct":
    @Event eachPlayer
    @Condition eventPlayer.isHoldingButton(Button.INTERACT)
    # @Condition raycast(eventPlayer.getEyePosition(), eventPlayer.getEyePosition() + eventPlayer.getFacingDirection() * 100, getAllPlayers(), eventPlayer, true).getPlayerHit() == dvaDummy

    dvaDummy.setAbilityCooldown(Button.ABILITY_1, 0)
    wait()
    dvaDummy.forceButtonPress(Button.ABILITY_1)
    wait(0.16)
    dvaDummy.setUltCharge(100)
    dvaDummy.forceButtonPress(Button.ULTIMATE)
    wait(0.16)
    dvaDummy.setAbilityCooldown(Button.ABILITY_1, 0)
    kill(dvaDummy)
    wait(0.16)
    waitUntil(dvaDummy.hasSpawned())
    wait(1)

rule "Toggle Angles":
    @Event eachPlayer
    @Condition eventPlayer.isHoldingButton(Button.RELOAD)
    if angle == 10:
        angle = 2
    else:
        angle = 10
    dvaDummy.setFacing(Vector.FORWARD * angle + Vector.UP, Relativity.TO_PLAYER)

rule "Init Player":
    @Event eachPlayer
    @Condition eventPlayer.isDummy() == false
    eventPlayer.disableGamemodeHud()
    hudSubtext(eventPlayer, "互动：命令D.Va施放自毁", HudPosition.ACTUALLY_LEFT)
    hudSubtext(eventPlayer, "装填：切换角度", HudPosition.ACTUALLY_LEFT)
    hudSubtext(eventPlayer, "需要治疗：切换英雄", HudPosition.ACTUALLY_LEFT)
    hudSubtext(eventPlayer, "按任意技能键重置冷却", HudPosition.ACTUALLY_LEFT)

# MARK: 通用

rule "Player Invincible":
    @Event eachPlayer
    @Condition eventPlayer.isDummy() == false
    @Condition eventPlayer.hasSpawned()
    eventPlayer.setStatusEffect(null, Status.INVINCIBLE, Math.INFINITY)
    eventPlayer.setKnockbackReceived(0)

rule "Change Hero":
    @Event eachPlayer
    @Condition eventPlayer.isCommunicating(Comms.NEED_HEALING)
    eventPlayer.setAllowedHeroes(getAllHeroes().exclude(eventPlayer.getHero()))
    wait()
    eventPlayer.setAllowedHeroes(getAllHeroes())

rule "Remove Cooldown":
    @Event eachPlayer
    @Condition eventPlayer.isHoldingButton(Button.ABILITY_1) or eventPlayer.isHoldingButton(Button.ABILITY_2) or eventPlayer.isHoldingButton(Button.JUMP) or eventPlayer.isHoldingButton(Button.CROUCH) or eventPlayer.isHoldingButton(Button.SECONDARY_FIRE) or eventPlayer.isHoldingButton(Button.ULTIMATE)
    wait(1)
    eventPlayer.setAbilityCooldown(Button.ABILITY_1, 0)
    eventPlayer.setAbilityCooldown(Button.ABILITY_2, 0)
    eventPlayer.setAbilityCooldown(Button.JUMP, 0)
    eventPlayer.setAbilityCooldown(Button.CROUCH, 0)
    eventPlayer.setAbilityCooldown(Button.SECONDARY_FIRE, 0)
    eventPlayer.setUltCharge(100)