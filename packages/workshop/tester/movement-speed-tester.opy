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

rule "Log movement":
    @Event eachPlayer
    @Condition eventPlayer == hostPlayer
    @Condition updateEveryFrame(eventPlayer.getSpeed()) > 0
    logToInspector("\tT\tSpeed\tHSpeed\tVSpeed\tFSpeed")
    eventPlayer.timestamp = 0
    chaseAtRate(eventPlayer.timestamp, Math.INFINITY, 1000)
    while updateEveryFrame(eventPlayer.getSpeed()) > 0 and eventPlayer.timestamp <= 8000:
        logToInspector("Speed\t{}\t{}\t{}\t{}\t{}".format(
            eventPlayer.timestamp,
            updateEveryFrame(eventPlayer.getSpeed()),
            updateEveryFrame(eventPlayer.getHorizontalSpeed()),
            updateEveryFrame(eventPlayer.getVerticalSpeed()),
            updateEveryFrame(eventPlayer.getSpeedInDirection(eventPlayer.getFacingDirection()))
        ))
        wait()
    stopChasingVariable(eventPlayer.timestamp)
    eventPlayer.timestamp = 0
    smallMessage(eventPlayer, "Stopped")

rule "Log button":
    @Event eachPlayer
    @Condition eventPlayer == hostPlayer
    @Condition eventPlayer.isHoldingButton(Button.JUMP)
    logToInspector("Jump\t{}".format(eventPlayer.timestamp))
    
rule "Teleport":
    @Event eachPlayer
    @Condition eventPlayer == hostPlayer
    @Condition eventPlayer.isHoldingButton(Button.INTERACT)
    eventPlayer.teleport(vect(0, 1000, 0))