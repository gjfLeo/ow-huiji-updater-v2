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

playervar timestamp

playervar basicSpeed = 0
playervar speedMax = 0
playervar hSpeedMax = 0
playervar vSpeedMax = 0
playervar vSpeedMin = 0

rule "Add Hud Text":
    @Event eachPlayer
    hudSubheader(eventPlayer, "位置：{}，朝向：{}，高度：{}".format(
        updateEveryFrame(eventPlayer.getPosition()),
        updateEveryFrame(eventPlayer.getFacingDirection()),
        updateEveryFrame(eventPlayer.getAltitude())
    ), HudPosition.ACTUALLY_LEFT)
    hudSubheader(eventPlayer, "速度：{} ({}%) [{}]，朝向速度：{} ({}%)，基础速度：{}".format(
        updateEveryFrame(eventPlayer.getSpeed()),
        updateEveryFrame(eventPlayer.getSpeed() / eventPlayer.basicSpeed * 100),
        updateEveryFrame(eventPlayer.speedMax),
        updateEveryFrame(eventPlayer.getSpeedInDirection(eventPlayer.getFacingDirection())),
        updateEveryFrame(eventPlayer.getSpeedInDirection(eventPlayer.getFacingDirection()) / eventPlayer.basicSpeed * 100),
        updateEveryFrame(eventPlayer.basicSpeed)
    ), HudPosition.ACTUALLY_LEFT)
    hudSubheader(eventPlayer, "水平速度：{} ({}%) [{}]，垂直速度：{} [{}~{}]".format(
        updateEveryFrame(eventPlayer.getHorizontalSpeed()),
        updateEveryFrame(eventPlayer.getHorizontalSpeed() / eventPlayer.basicSpeed * 100),
        updateEveryFrame(eventPlayer.hSpeedMax),
        updateEveryFrame(eventPlayer.getVerticalSpeed()),
        updateEveryFrame(eventPlayer.vSpeedMin),
        updateEveryFrame(eventPlayer.vSpeedMax)
    ), HudPosition.ACTUALLY_LEFT)

rule "Reset Statistics":
    @Event eachPlayer
    @Condition eventPlayer.isHoldingButton(Button.RELOAD)
    eventPlayer.basicSpeed = updateEveryFrame(eventPlayer.getSpeed())
    eventPlayer.speedMax = 0
    eventPlayer.hSpeedMax = 0
    eventPlayer.vSpeedMax = 0
    eventPlayer.vSpeedMin = 0

rule "Calculate Speed":
    @Event eachPlayer
    @Condition eventPlayer.hasSpawned()
    eventPlayer.basicSpeed = 5.5 if eventPlayer.getHero() != Hero.GENJI and eventPlayer.getHero() != Hero.TRACER else 6
    eventPlayer.speedMax = 0
    eventPlayer.hSpeedMax = 0
    eventPlayer.vSpeedMax = 0
    eventPlayer.vSpeedMin = 0
    while ruleCondition:
        eventPlayer.speedMax = max(eventPlayer.speedMax, updateEveryFrame(eventPlayer.getSpeed()))
        eventPlayer.hSpeedMax = max(eventPlayer.hSpeedMax, updateEveryFrame(eventPlayer.getHorizontalSpeed()))
        eventPlayer.vSpeedMax = max(eventPlayer.vSpeedMax, updateEveryFrame(eventPlayer.getVerticalSpeed()))
        eventPlayer.vSpeedMin = min(eventPlayer.vSpeedMin, updateEveryFrame(eventPlayer.getVerticalSpeed()))
        wait()

globalvar LucioDummy
rule "Lucio Dummy":
    @Event global
    wait(1)
    createDummy(Hero.LUCIO, Team.1, -1, vect(0, 0, 0), vect(0, 0, 0))
    LucioDummy = getLastCreatedEntity()

rule "Lucio Dummy Toggle":
    @Event eachPlayer
    @Condition eventPlayer.isHoldingButton(Button.INTERACT)
    @Condition raycast(eventPlayer.getEyePosition(), eventPlayer.getEyePosition() + eventPlayer.getFacingDirection() * 100, getAllPlayers(), eventPlayer, true).getPlayerHit() == LucioDummy
    LucioDummy.forceButtonPress(Button.ABILITY_1)

# rule "Log movement":
#     @Event eachPlayer
#     @Condition eventPlayer == hostPlayer
#     @Condition updateEveryFrame(eventPlayer.getSpeed()) > 0
#     logToInspector("\tT\tSpeed\tHSpeed\tVSpeed\tFSpeed")
#     eventPlayer.timestamp = 0
#     chaseAtRate(eventPlayer.timestamp, Math.INFINITY, 1000)
#     while updateEveryFrame(eventPlayer.getSpeed()) > 0 and eventPlayer.timestamp <= 8000:
#         logToInspector("Speed\t{}\t{}\t{}\t{}\t{}".format(
#             eventPlayer.timestamp,
#             updateEveryFrame(eventPlayer.getSpeed()),
#             updateEveryFrame(eventPlayer.getHorizontalSpeed()),
#             updateEveryFrame(eventPlayer.getVerticalSpeed()),
#             updateEveryFrame(eventPlayer.getSpeedInDirection(eventPlayer.getFacingDirection()))
#         ))
#         wait()
#     stopChasingVariable(eventPlayer.timestamp)
#     eventPlayer.timestamp = 0
#     smallMessage(eventPlayer, "Stopped")

rule "Test Falling Speed":
    @Event eachPlayer
    @Condition eventPlayer == hostPlayer
    @Condition eventPlayer.isHoldingButton(Button.INTERACT)
    @Condition angleBetweenVectors(eventPlayer.getFacingDirection(), Vector.UP) < 5
    eventPlayer.teleport(vect(0, 1000, 0))
rule "Return to ground":
    @Event eachPlayer
    @Condition eventPlayer == hostPlayer
    @Condition eventPlayer.isHoldingButton(Button.INTERACT)
    @Condition angleBetweenVectors(eventPlayer.getFacingDirection(), Vector.DOWN) < 5
    eventPlayer.teleport(vect(0, 0, 0))

rule "Change Hero":
    @Event eachPlayer
    @Condition eventPlayer.isCommunicating(Comms.NEED_HEALING)
    eventPlayer.setAllowedHeroes(getAllHeroes().exclude(eventPlayer.getHero()))
    wait()
    eventPlayer.setAllowedHeroes(getAllHeroes())