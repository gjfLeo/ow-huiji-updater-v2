settings {
    "gamemodes": {
        "skirmish": {
            "enabledMaps": [
                "workshopExpanse"
            ],
            "enablePerks": false
        },
        "general": {
            "heroLimit": "off",
            "respawnTime%": 30,
            "enableRandomHeroes": true
        }
    },
    "heroes": {
        "team1": {
            "ana": {
                "enablePrimaryFire": false,
                "enableAbility1": false,
                "enableAbility2": false,
            },
            "enabledHeroes": ["ana"]
        }
    }
}

globalvar dummy
playervar timer

rule "Init":
    @Event global
    wait(1)
    createDummy(Hero.SOLDIER, Team.1, -1, vect(0, 0, 0), vect(0, 0, 0))
    dummy = getLastCreatedEntity()
    hudHeader(getAllPlayers() if hostPlayer.timer > 0 else [], updateEveryFrame(hostPlayer.timer), HudPosition.TOP)

rule "Reset":
    @Event eachPlayer
    @Condition eventPlayer == hostPlayer
    @Condition eventPlayer.isHoldingButton(Button.RELOAD)
    stopChasingVariable(hostPlayer.timer)
    eventPlayer.timer = 0
    eventPlayer.setUltCharge(100)
    kill(dummy)
    wait(0.16)
    dummy.resurrect()
    damage(dummy, null, 100)

rule "Start Timer":
    @Event eachPlayer
    @Condition eventPlayer == hostPlayer
    @Condition eventPlayer.isHoldingButton(Button.ULTIMATE)
    if updateEveryFrame(eventPlayer.getUltCharge()) < 100:
        eventPlayer.timer = 0
        chaseAtRate(eventPlayer.timer, Math.INFINITY, 1000)

rule "End Timer":
    @Event playerReceivedHealing
    @Condition eventPlayer == dummy
    stopChasingVariable(hostPlayer.timer)