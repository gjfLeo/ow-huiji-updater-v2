settings {
    "main": {
        "modeName": "专项测试：索杰恩大招期间左键加能量吗？",
        "description": "1XANT\n\n不加。\n\n按Q后每0.8秒自动放右键，可以看到无论是否左键，每次不暴击伤害都是100点（除了第一次有前摇）。",
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
            "enableRandomHeroes": true
        }
    },
    "heroes": {
        "team1": {
            "sojourn": {
                "enableAbility1": false,
                "enableAbility2": false,
                "enableSpawningWithUlt": true
            },
            "enabledHeroes": ["sojourn"]
        }
    }
}

globalvar doomfistDummy
playervar timer
playervar lastSecondaryFireInterval

rule "Init Dummy":
    @Event global
    wait(1)
    createDummy(Hero.DOOMFIST, Team.2, -1, vect(0, 0, 0), vect(0, 0, 0))
    doomfistDummy = getLastCreatedEntity()
    doomfistDummy.setStatusEffect(null, Status.UNKILLABLE, Math.INFINITY)
    doomfistDummy.setMaxHealth(100000)

rule "Heal Dummy":
    @Event eachPlayer
    @Condition eventPlayer == doomfistDummy
    @Condition eventPlayer.getHealth() < eventPlayer.getMaxHealth() * 0.5
    eventPlayer.setHealth(eventPlayer.getMaxHealth())

rule "Init Player":
    @Event eachPlayer
    @Hero sojourn
    eventPlayer.timer = 0
    eventPlayer.lastSecondaryFireInterval = 0
    eventPlayer.disableGamemodeHud()
    hudSubtext(eventPlayer, "按Q后每0.8秒自动右键", HudPosition.ACTUALLY_LEFT)
    hudSubtext(eventPlayer if eventPlayer.lastSecondaryFireInterval > 0 else null, f"上次右键伤害间隔：{eventPlayer.lastSecondaryFireInterval}ms", HudPosition.RIGHT)
    waitUntil(eventPlayer.hasSpawned())
    eventPlayer.teleport(vect(8, 0, 0))
    eventPlayer.setFacing(vect(-1, 0, 0), Relativity.TO_WORLD)

rule "Auto Secondary Fire":
    @Event eachPlayer
    @Hero sojourn
    @Condition eventPlayer.isHoldingButton(Button.ULTIMATE)
    for eventPlayer.I in range(0, 10):
        wait(0.8)
        eventPlayer.forceButtonPress(Button.SECONDARY_FIRE)

rule "Secondary Fire Timer":
    @Event playerDealtDamage
    @Hero sojourn
    @Condition eventAbility == Button.SECONDARY_FIRE or eventAbility == Button.ULTIMATE
    smallMessage(eventPlayer, f'  伤害：{eventDamage}')
    stopChasingVariable(eventPlayer.timer)
    eventPlayer.lastSecondaryFireInterval = updateEveryFrame(eventPlayer.timer)
    eventPlayer.timer = 0
    chaseAtRate(eventPlayer.timer, Math.INFINITY, 1000)

rule "Get Ultimate Charge":
    @Event eachPlayer
    @Hero sojourn
    @Condition eventPlayer.isHoldingButton(Button.ULTIMATE)
    eventPlayer.setUltCharge(100)
