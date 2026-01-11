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
    }
}

globalvar dvaDummy

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
    dvaDummy.setFacing(Vector.FORWARD * 10 + Vector.UP, Relativity.TO_PLAYER)
    dvaDummy.setAbilityCooldown(Button.ABILITY_1, 0)
    dvaDummy.setUltCharge(100)

rule "D.Va Self-Destruct":
    @Event eachPlayer
    @Condition eventPlayer.isHoldingButton(Button.INTERACT)
    @Condition raycast(eventPlayer.getEyePosition(), eventPlayer.getEyePosition() + eventPlayer.getFacingDirection() * 100, getAllPlayers(), eventPlayer, true).getPlayerHit() == dvaDummy

    dvaDummy.setAbilityCooldown(Button.ABILITY_1, 0)
    wait()
    dvaDummy.forceButtonPress(Button.ABILITY_1)
    wait(0.16)
    dvaDummy.setUltCharge(100)
    dvaDummy.forceButtonPress(Button.ULTIMATE)
    wait(0.16)
    dvaDummy.setAbilityCooldown(Button.ABILITY_1, 0)
    kill(dvaDummy)

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