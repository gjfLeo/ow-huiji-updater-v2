settings {
    "lobby": {
        "team1Slots": 1,
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
            "enableRandomHeroes": false,
            "respawnTime%": 0
        }
    },
    "heroes": {
        "team1": {
            "general": {
                "abilityCooldown%": 10,
                "enableSpawningWithUlt": true
            }
        }
    }
}

# PD62H

#!extension spawnMoreDummyBots


globalvar timer = 0
globalvar dummies = []
playervar originalPosition
playervar eliminatedTime

macro SpawnDummy(hero, position):
    createDummy(hero, Team.2, -1, position, vect(1, 0, 0))
    getLastCreatedEntity().originalPosition = position
    dummies.append(getLastCreatedEntity())
    getLastCreatedEntity().setMaxHealth(1)
    createInWorldText(getAllPlayers() if updateEveryFrame(evalOnce(getLastCreatedEntity()).eliminatedTime >= 0) else [], updateEveryFrame(evalOnce(getLastCreatedEntity()).eliminatedTime), evalOnce(getLastCreatedEntity()).getPosition(), 2)

rule "Init Dummies":
    SpawnDummy(Hero.ANA, vect(0, 0, 0))
    SpawnDummy(Hero.ANA, vect(-2, 0, 0))
    SpawnDummy(Hero.ANA, vect(-4, 0, 0))
    SpawnDummy(Hero.ANA, vect(-6, 0, 0))
    SpawnDummy(Hero.ANA, vect(-8, 0, 0))
    SpawnDummy(Hero.ANA, vect(-10, 0, 0))
    SpawnDummy(Hero.ANA, vect(-12, 0, 0))

    SpawnDummy(Hero.KIRIKO, vect(0, 0, 2))
    SpawnDummy(Hero.KIRIKO, vect(-4, 0, 2))
    SpawnDummy(Hero.KIRIKO, vect(-8, 0, 2))
    SpawnDummy(Hero.KIRIKO, vect(-12, 0, 2))
    SpawnDummy(Hero.KIRIKO, vect(0, 0, -2))
    SpawnDummy(Hero.KIRIKO, vect(-4, 0, -2))
    SpawnDummy(Hero.KIRIKO, vect(-8, 0, -2))
    SpawnDummy(Hero.KIRIKO, vect(-12, 0, -2))

    SpawnDummy(Hero.MERCY, vect(0, 4, 0))
    SpawnDummy(Hero.MERCY, vect(-4, 4, 0))
    SpawnDummy(Hero.MERCY, vect(-8, 4, 0))
    SpawnDummy(Hero.MERCY, vect(-12, 4, 0))
    SpawnDummy(Hero.MERCY, vect(0, 2, 0))
    SpawnDummy(Hero.MERCY, vect(-4, 2, 0))
    SpawnDummy(Hero.MERCY, vect(-8, 2, 0))
    SpawnDummy(Hero.MERCY, vect(-12, 2, 0))
    # SpawnDummy(Hero.MERCY, vect(0, 16, 0))
    # SpawnDummy(Hero.MERCY, vect(-4, 16, 0))
    # SpawnDummy(Hero.MERCY, vect(-8, 16, 0))
    # SpawnDummy(Hero.MERCY, vect(-12, 16, 0))
    # SpawnDummy(Hero.MERCY, vect(-16, 16, 0))
    # SpawnDummy(Hero.MERCY, vect(0, 20, 0))
    # SpawnDummy(Hero.MERCY, vect(-4, 20, 0))
    # SpawnDummy(Hero.MERCY, vect(-8, 20, 0))
    # SpawnDummy(Hero.MERCY, vect(-12, 20, 0))
    # SpawnDummy(Hero.MERCY, vect(-16, 20, 0))
    # SpawnDummy(Hero.MERCY, vect(0, 24, 0))
    # SpawnDummy(Hero.MERCY, vect(-4, 24, 0))
    # SpawnDummy(Hero.MERCY, vect(-8, 24, 0))
    # SpawnDummy(Hero.MERCY, vect(-12, 24, 0))
    # SpawnDummy(Hero.MERCY, vect(-16, 24, 0))

    # SpawnDummy(Hero.VENDETTA)

rule "Init Player":
    @Event eachPlayer
    @Condition eventPlayer.isDummy() == false
    eventPlayer.disableGamemodeHud()

rule "Dummies Spawned":
    @Event eachPlayer
    @Condition eventPlayer.isDummy() == true
    @Condition eventPlayer.hasSpawned() == true
    # eventPlayer.setMaxHealth(0.1)
    eventPlayer.startForcingPosition(eventPlayer.originalPosition, true)
    if eventPlayer.getHero() == Hero.MERCY:
        eventPlayer.startForcingButton(Button.JUMP)

rule "Reset":
    @Event eachPlayer
    @Condition eventPlayer.isDummy() == false
    @Condition eventPlayer.isHoldingButton(Button.RELOAD)

    stopChasingVariable(timer)
    timer = 0
    for P in range(len(dummies)):
        # dummies[P].teleport(dummies[P].originalPosition)
        dummies[P].startForcingPosition(dummies[P].originalPosition, true)
        dummies[P].eliminatedTime = -1
        dummies[P].setHealth(dummies[P].getMaxHealth())
    

rule "Slow Motion":
    @Event eachPlayer
    @Condition eventPlayer.isDummy() == false
    @Condition eventPlayer.isHoldingButton(Button.INTERACT)
    setSlowMotion(2)
    waitUntil(not ruleCondition)
    setSlowMotion(100)

rule "Dummy Eliminated":
    @Event playerDied
    @Condition eventPlayer.isDummy() == true
    eventPlayer.eliminatedTime = timer
    if timer == 0:
        chaseAtRate(timer, Math.INFINITY, 1)

# MARK: 通用

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