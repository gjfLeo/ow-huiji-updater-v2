settings {
    "main": {
        "description": "v.1.3, 2025-08-31 | Toolkit for testing hero interactions and ability properties. Perks enabled.",
        "modeName": "Interaction Testing Toolkit"
    },
    "lobby": {
        "allowPlayersInQueue": true
    },
    "gamemodes": {
        "practiceRange": {
            "tankPassiveHealthBonus": "alwaysEnabled"
        },
        "skirmish": {
            "enabledMaps": [],
            "enablePerks": true,
            "tankPassiveHealthBonus": "alwaysEnabled"
        },
        "general": {
            "gamemodeStartTrigger": "immediately",
            "healthPackRespawnTime%": 10,
            "heroLimit": "off",
            "enableKillCam": false,
            "respawnTime%": 0
        }
    },
    "heroes": {
        "allTeams": {
            "general": {
                "enableSpawningWithUlt": true,
                "passiveUltGen%": 0
            }
        }
    },
    "workshop": {
        "Hold delay s": 0.6,
        "Popup duration s": 1,
        "Projectile speed toggle multiplier %": 10
    }
}

#Global variables

globalvar WSSHoldDelay 0
globalvar WSSPopupDuration 1
globalvar heroArray 2
globalvar WSSProjSpeedMulti 3
globalvar mainMenuArray 4
globalvar WSSSlowMoMulti 5
globalvar WSSConfirmInput 6
globalvar playerArray 7
globalvar globalIterator 8
globalvar logginOn 9
globalvar flags 10
globalvar interruptDelay 11
globalvar WSSoverheadHP 12
globalvar buttonArray 13
globalvar attackModeArray 14
globalvar WSShideSelfHeal 15
globalvar WSSinstantPerks 16


#Player variables

playervar currentPosition 0
playervar saveUltCharge 1
playervar DSMenemyIndex 2
playervar DSMallyIndex 3
playervar setupAllyDummy 4
playervar lastDamageArray 5
playervar damageTimeArray 6
playervar lastEventTime 7
playervar activeMenuArray 8
playervar menuPosArray 9
playervar menuIndexArray 10
playervar menuEffectArray 11
playervar menuIterator 12
playervar currentMenuPos 13
playervar menuTextArray 14
playervar gameMode 15
playervar hudPopupArray 16
playervar speedArray 17
playervar savePosition 18
playervar lastHealArray 19
playervar healTimeArray 20
playervar sumDH 21
playervar flags 22
playervar valueAdjust 23
playervar damagePopArray 24
playervar pstData 25
playervar hudEffect 26


#Subroutine names

subroutine createMenu 0
subroutine destroyMenu 1
subroutine disableAbilitiesAndFire 2
subroutine enableAbilitiesAndFire 3
subroutine mainHUD 4
subroutine dsmOn 5
subroutine abilityDisplay 6
subroutine dsmOff 7
subroutine playerDisplay 8
subroutine clearPopupSet 9
subroutine uctHUD 10
subroutine pstHUD 11
subroutine pstInit 12
subroutine createAdjustFX 13
subroutine menuSelectSet 14
subroutine estHUD 16
subroutine estInit 17
subroutine instantPerks 18


#Activated extensions

#!extension beamEffects
#!extension beamSounds
#!extension buffStatusEffects
#!extension debuffStatusEffects
#!extension buffAndDebuffSounds


#Only remove the following directive if the gamemode does not use tricks such as A+0, A*0, "am" == "**", etc which would otherwise be optimized out.
#!optimizeStrict


rule "--- General stuff ---":
    @Disabled
    @Delimiter
    


rule "Global Init":
    disableInspector()
    logginOn = false
    getAllPlayers().setAllowedHeroes(getAllHeroes())
    WSSHoldDelay = createWorkshopSettingFloat("Config", "Hold delay (s)", 0.6, 0, 10)
    WSSPopupDuration = createWorkshopSettingFloat("Config", "Popup duration (s)", 1, 0, 10)
    WSSProjSpeedMulti = createWorkshopSettingFloat("Config", "Projectile speed toggle multiplier (%)", 10, 1, 100)
    WSSSlowMoMulti = createWorkshopSettingInt("Config", "Slow motion toggle multiplier (%)", 1, 1, 100)
    WSSoverheadHP = createWorkshopSettingBool("Config", "Show overhead health number", true)
    WSShideSelfHeal = createWorkshopSettingBool("Config", "Hide self-healing from logs", true)
    heroArray = getAllHeroes()
    buttonArray = [Button.PRIMARY_FIRE, Button.SECONDARY_FIRE, Button.ABILITY_1, Button.ABILITY_2, Button.ULTIMATE, Button.MELEE]
    attackModeArray = ["Press", " Press + Confirm", "Toggle (Off)", "Toggle (On)"]
    mainMenuArray = ["Practice pressing button", "Select Hero", "Dummy setup mode", "Ult cost tester", "Reset match", "Toggle fast CD", "Projectile size tester", "Reset ultimates", "Explosion size tester", "Snap", "Delay tester", "Toggle proj gravity", "Toggle proj speed", "Toggle slow motion", "Toggle logging"]
    #0: projGravity | 1: projSlowMo | 2: globalSlowMo | 3: fast CDs | 4: slowMS
    flags = [false, false, false, true, false]
    WSSinstantPerks = createWorkshopSettingBool("Config", "Instant perks", true)


rule "Player joined - not bot":
    @Event playerJoined
    @Condition eventPlayer.isDummy() == false
    
    eventPlayer.setAllowedHeroes(getAllHeroes())
    #0: pos | 1: eye pos | 2: ray cast pos | 3: facing direction
    eventPlayer.currentPosition = [null, null, null, null]
    eventPlayer.saveUltCharge = 0
    #0: hero | 1: ability | 2: cast mode 
    eventPlayer.DSMenemyIndex = [0, 0, 0]
    eventPlayer.DSMallyIndex = [0, 0, 0]
    eventPlayer.setupAllyDummy = false
    #ability info
    eventPlayer.lastDamageArray = [0, 0, 0]
    eventPlayer.damageTimeArray = [0, 0, 0]
    #0: last damage | 1: last healing | 2: ability press | 3: ability stop DIFF | 4: can fire DIFF | 5: button any press | 6: damage flagged DIFF | 7: heal flagged DIFF | 8:dmg/heal delay DIFF | 9: start firerate test
    eventPlayer.lastEventTime = [null, null, null, null, null, null, null, null, null, null, null]
    eventPlayer.lastHealArray = [0, 0, 0]
    eventPlayer.healTimeArray = [0, 0, 0]
    #menu vars
    eventPlayer.activeMenuArray = []
    #0: active menu | 1: menu item
    eventPlayer.menuIndexArray = [0, 0]
    eventPlayer.menuEffectArray = []
    eventPlayer.menuIterator = 0
    eventPlayer.currentMenuPos = null
    eventPlayer.menuTextArray = []
    #0: sandbox | 1: DSM | 2: UCT | 3: PST | 4: EST
    eventPlayer.gameMode = 0
    eventPlayer.hudPopupArray = []
    #0: max all| 1: max hor | 2: max ver | 3: prev speed | 4: accel | 5: accel max | 6: accel min | 7: dmg proj speed | 8: heal proj speed
    eventPlayer.speedArray = [0, 0, 0, eventPlayer.getSpeed(), 0, 0, 0, null, null]
    #0: pos | 1: eye pos | 2: ray cast pos | 3: facing direction | 4: respawn
    eventPlayer.savePosition = [null, null, null, null, null]
    eventPlayer.sumDH = [0, 0]
    #0: damageFlag | 1: healFlag | 2: delay test | 3: adjust value | 4: flight
    eventPlayer.flags = [false, false, false, false, false]
    #0: index | 1: step | 2: value UCT | 3: value PST
    eventPlayer.valueAdjust = [0, 100, 2000, 0.1, 0]
    eventPlayer.damagePopArray = []
    #0: shieldDummy1Offset | 1: shieldDummy2Offset | 2: shieldDummy1CurrentPos | 3: shieldDummy2CurrentPos | 4: eyePosDiff
    eventPlayer.pstData = [vect(-3.278, -1.314, 5), vect(3.5, -1.314, 5), null, null, eventPlayer.currentPosition[1] - eventPlayer.currentPosition[0]]
    eventPlayer.hudEffect = null
    wait(0.25)
    mainHUD()
    instantPerks()


rule "Update player - every frame":
    @Event eachPlayer
    
    eventPlayer.currentPosition = [updateEveryFrame(eventPlayer.getPosition()), updateEveryFrame(eventPlayer.getEyePosition()), updateEveryFrame(raycast(updateEveryFrame(eventPlayer.getEyePosition()), eventPlayer.getEyePosition() + 200 * eventPlayer.getFacingDirection(), getAllPlayers(), eventPlayer, true).getHitPosition()), vectorTowards(eventPlayer.getEyePosition(), eventPlayer.getFacingDirection())]
    if eventPlayer.getSpeed() > eventPlayer.speedArray[0]:
        eventPlayer.speedArray[0] = eventPlayer.getSpeed()
    if eventPlayer.getHorizontalSpeed() > eventPlayer.speedArray[1]:
        eventPlayer.speedArray[1] = eventPlayer.getHorizontalSpeed()
    if eventPlayer.getVerticalSpeed() > eventPlayer.speedArray[2]:
        eventPlayer.speedArray[2] = eventPlayer.getVerticalSpeed()
    #calc accel
    eventPlayer.speedArray[4] = (updateEveryFrame(eventPlayer.getSpeed()) - eventPlayer.speedArray[3]) / 0.016
    #save current speed now that accel is calculated
    eventPlayer.speedArray[3] = updateEveryFrame(eventPlayer.getSpeed())
    #max accel
    if eventPlayer.speedArray[4] > eventPlayer.speedArray[5]:
        eventPlayer.speedArray[5] = eventPlayer.speedArray[4]
    #min accel
    if eventPlayer.speedArray[4] < eventPlayer.speedArray[6]:
        eventPlayer.speedArray[6] = eventPlayer.speedArray[4]
    wait()
    loop()


rule "Update player - every second":
    @Event eachPlayer
    
    #fast cooldowns
    if flags[3]:
        for globalIterator in range(len(buttonArray)):
            getAllPlayers().setAbilityCooldown(buttonArray[globalIterator], 0)
        getAllPlayers().setAbilityCooldown(Button.JUMP, 0)
        getAllPlayers().setAbilityCooldown(Button.CROUCH, 0)
        #fast cooldowns END
    eventPlayer.speedArray[7] = (1000 * (distance(eventPlayer.currentPosition[1], eventPlayer.currentPosition[2]) - eventPlayer.valueAdjust[3])) / ((eventPlayer.lastEventTime[6] - eventPlayer.lastEventTime[8]) * (WSSProjSpeedMulti / 100 if flags[1] else 1))
    eventPlayer.speedArray[8] = (1000 * (distance(eventPlayer.currentPosition[1], eventPlayer.currentPosition[2]) - eventPlayer.valueAdjust[3])) / ((eventPlayer.lastEventTime[7] - eventPlayer.lastEventTime[8]) * (WSSProjSpeedMulti / 100 if flags[1] else 1))
    wait(1)
    loop()


rule "Overhead health number":
    @Event playerJoined
    @Condition WSSoverheadHP == true
    
    createInWorldText(getAllPlayers(), eventPlayer.getHealth(), eventPlayer.getEyePosition() + Vector.UP * 0.1, 1, Clip.NONE, WorldTextReeval.VISIBILITY_POSITION_AND_STRING)


def disableAbilitiesAndFire():
    @Name "Sub:Disable abilities and fire"
    
    if eventPlayer.getUltCharge() != 0:
        eventPlayer.saveUltCharge = eventPlayer.getUltCharge()
    wait()
    eventPlayer.setPrimaryFireEnabled(false)
    eventPlayer.setSecondaryFireEnabled(false)
    eventPlayer.setAbility1Enabled(false)
    eventPlayer.setAbility2Enabled(false)
    eventPlayer.setUltEnabled(false)


def enableAbilitiesAndFire():
    @Name "Sub:Enable abilities and fire"
    
    eventPlayer.setPrimaryFireEnabled(true)
    eventPlayer.setSecondaryFireEnabled(true)
    eventPlayer.setAbility1Enabled(true)
    eventPlayer.setAbility2Enabled(true)
    eventPlayer.setUltEnabled(true)
    wait()
    eventPlayer.setUltCharge(eventPlayer.saveUltCharge)


def clearPopupSet():
    @Name "Sub: HUD popup clear"
    
    wait(WSSPopupDuration)
    destroyHudText(eventPlayer.hudPopupArray[0])
    del eventPlayer.hudPopupArray[0]


def instantPerks():
    @Name "Sub: Instant Perks"
    
    if WSSinstantPerks:
        waitUntil(eventPlayer.getPosition() != null, 60)
        #wait(1)
        createDummy(Hero.ANA, Team.2, 9, eventPlayer.getPosition())
        wait(0.25)
        getPlayersInSlot(9, Team.2).addHealthPool(Health.NORMAL, 9999, true)
        damage(getPlayersInSlot(9, Team.2), eventPlayer, 6000)
        wait(0.25)
        destroyDummy(Team.2, 9)


rule "--- Hotkeys ---":
    @Disabled
    @Delimiter
    


rule "Reset measurements (Reload)":
    @Event eachPlayer
    @Condition eventPlayer.isHoldingButton(Button.RELOAD) == true
    #@Condition eventPlayer.isHoldingButton(Button.CROUCH) == true
    
    eventPlayer.savePosition = eventPlayer.currentPosition
    eventPlayer.sumDH = [0, 0]
    #0: max all| 1: max hor | 2: max ver | 3: prev speed | 4: accel | 5: accel max | 6: accel min
    #eventPlayer.speedArray = [0, 0, 0, eventPlayer.getSpeed(), 0, 0, 0]
    #0: max all| 1: max hor | 2: max ver | 3: prev speed | 4: accel | 5: accel max | 6: accel min
    #eventPlayer.speedArray = [0, 0, 0, eventPlayer.getSpeed(), 0, 0, 0]
    #0: max all| 1: max hor | 2: max ver | 3: prev speed | 4: accel | 5: accel max | 6: accel min
    getAllPlayers().speedArray = [0, 0, 0, eventPlayer.getSpeed(), 0, 0, 0]
    eventPlayer.lastEventTime[8] = 0


rule "Hold to Hero Select (Reload / Menu 1)":
    @Event eachPlayer
    @Condition eventPlayer.isHoldingButton(Button.RELOAD) == true
    
    wait(WSSHoldDelay, Wait.ABORT_WHEN_FALSE)
    if not eventPlayer.isCrouching():
        eventPlayer.savePosition[4] = eventPlayer.getPosition()
    eventPlayer.setAllowedHeroes(getAllHeroes().exclude(eventPlayer.getHero()))
    wait(0.25)
    eventPlayer.setAllowedHeroes(getAllHeroes())
    instantPerks()
    #tp player back to previous location from spawn
    if eventPlayer.savePosition[4] != null:
        eventPlayer.teleport(eventPlayer.savePosition[4])
        eventPlayer.savePosition[4] = null


rule "Hold to restart lobby (Crouch + Reload / Menu 4)":
    @Event eachPlayer
    @Condition eventPlayer.isHoldingButton(Button.RELOAD) == true
    @Condition eventPlayer.isHoldingButton(Button.CROUCH) == true
    @Condition eventPlayer == hostPlayer
    
    wait(WSSHoldDelay, Wait.ABORT_WHEN_FALSE)
    restartMatch()


rule "Reset ultimates (\"Ultimate Status\" / Menu 7)":
    @Event eachPlayer
    @Condition (eventPlayer.isCommunicating(Comms.ULTIMATE_STATUS) or eventPlayer.menuIndexArray == [1, 7]) == true
    
    if eventPlayer.menuIndexArray[0] == 1:
        menuSelectSet()
    getAllPlayers().setUltCharge(100)
    hudHeader(getAllPlayers(), "Ultimates reset", HudPosition.TOP, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    eventPlayer.hudPopupArray.append(getLastCreatedText())
    clearPopupSet()


rule "Toggle logging (\"Acknowledge\" / Menu 14)":
    @Event eachPlayer
    #@Condition eventPlayer.isCommunicating(Comms.ACKNOWLEDGE) == true
    @Condition eventPlayer == hostPlayer
    @Condition (eventPlayer.isCommunicating(Comms.ACKNOWLEDGE) or eventPlayer.menuIndexArray == [1, 14]) == true
    
    if eventPlayer.menuIndexArray[0] == 1:
        menuSelectSet()
    if logginOn == false:
        enableInspector()
        logginOn = true
        hudHeader(getAllPlayers(), "Logging to inspector enabled", HudPosition.TOP, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    else:
        disableInspector()
        logginOn = false
        hudHeader(getAllPlayers(), "Logging disabled", HudPosition.TOP, 0, Color.GRAY, HudReeval.VISIBILITY_AND_STRING)
    eventPlayer.hudPopupArray.append(getLastCreatedText())
    clearPopupSet()


rule "Snap (\"Need Healing\" / Menu 9)":
    @Event eachPlayer
    @Condition (eventPlayer.isCommunicating(Comms.NEED_HEALING) or eventPlayer.menuIndexArray == [1, 9]) == true
    
    if eventPlayer.menuIndexArray[0] == 1:
        menuSelectSet()
    playEffect(getAllPlayers(), DynamicEffect.BAD_EXPLOSION, Color.WHITE, eventPlayer, 50)
    playerArray = getAllPlayers()
    for globalIterator in range(len(playerArray)):
        damage(playerArray[globalIterator], null, 0.5 * playerArray[globalIterator].getHealth())


rule "Spawn damage/heal delay test dummy (\"Group Up\" / Menu 10)":
    @Event eachPlayer
    @Condition (eventPlayer.isCommunicating(Comms.GROUP_UP) or eventPlayer.menuIndexArray == [1, 10]) == true
    
    if eventPlayer.menuIndexArray[0] == 1:
        menuSelectSet()
    eventPlayer.setStatusEffect(null, Status.PHASED_OUT, 10)
    #if crouching, spawn ally dummy
    createDummy(Hero.WRECKING_BALL, eventPlayer.getTeam() if eventPlayer.isCrouching() else getOppositeTeam(eventPlayer.getTeam()), 5, eventPlayer.getPosition(), eventPlayer.getFacingDirection())
    wait(0.05)
    #damage players so they can be healed
    damage(getPlayersInSlot(5, Team.ALL), null, 300)
    #set delay test flag for damage/heal dealt rules
    eventPlayer.flags[2] = true
    hudHeader(getAllPlayers(), "Press botan to calibrate damage delay", HudPosition.TOP, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    eventPlayer.hudPopupArray.append(getLastCreatedText())
    clearPopupSet()


rule "Toggle projectile gravity (\"Hello\" / Menu 11)":
    @Event eachPlayer
    @Condition (eventPlayer.isCommunicating(Comms.HELLO) or eventPlayer.menuIndexArray == [1, 11]) == true
    
    if eventPlayer.menuIndexArray[0] == 1:
        menuSelectSet()
    if flags[0]:
        getAllPlayers().setProjectileGravity(100)
        flags[0] = false
        hudHeader(getAllPlayers(), "Projectile gravity enabled", HudPosition.TOP, 0, Color.GRAY, HudReeval.VISIBILITY_AND_STRING)
    else:
        getAllPlayers().setProjectileGravity(0)
        flags[0] = true
        hudHeader(getAllPlayers(), "Projectile gravity disabled", HudPosition.TOP, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    eventPlayer.hudPopupArray.append(getLastCreatedText())
    clearPopupSet()


rule "Toggle projectile speed (\"Thanks\" / Menu 12)":
    @Event eachPlayer
    @Condition (eventPlayer.isCommunicating(Comms.THANKS) or eventPlayer.menuIndexArray == [1, 12]) == true
    
    if eventPlayer.menuIndexArray[0] == 1:
        menuSelectSet()
    if flags[1]:
        getAllPlayers().setProjectileSpeed(100)
        flags[1] = false
        hudHeader(getAllPlayers(), "Slow projectiles disabled", HudPosition.TOP, 0, Color.GRAY, HudReeval.VISIBILITY_AND_STRING)
    else:
        getAllPlayers().setProjectileSpeed(WSSProjSpeedMulti)
        flags[1] = true
        hudHeader(getAllPlayers(), "Slow projectiles enabled", HudPosition.TOP, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    eventPlayer.hudPopupArray.append(getLastCreatedText())
    clearPopupSet()


rule "Toggle slowmo (\"Fall Back\" / Menu 13)":
    @Event eachPlayer
    @Condition (eventPlayer.isCommunicating(Comms.FALL_BACK) or eventPlayer.menuIndexArray == [1, 13]) == true
    
    if eventPlayer.menuIndexArray[0] == 1:
        menuSelectSet()
    if flags[2]:
        setSlowMotion(100)
        flags[2] = false
        WSSHoldDelay /= 0.1
        hudHeader(getAllPlayers(), "Slow motion disabled", HudPosition.TOP, 0, Color.GRAY, HudReeval.VISIBILITY_AND_STRING)
    else:
        setSlowMotion(WSSSlowMoMulti)
        flags[2] = true
        #adjust hold delay at the same, so it doesn't take ages during slow mo
        WSSHoldDelay *= 0.1
        hudHeader(getAllPlayers(), "Slow motion enabled", HudPosition.TOP, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    eventPlayer.hudPopupArray.append(getLastCreatedText())
    clearPopupSet()


rule "Flight Toggle (Jump + Crouch + Melee)":
    @Event eachPlayer
    @Condition eventPlayer.isInAir() == true
    @Condition eventPlayer.isHoldingButton(Button.JUMP) == true
    @Condition eventPlayer.isHoldingButton(Button.CROUCH) == true
    @Condition eventPlayer.isHoldingButton(Button.MELEE) == true
    
    if eventPlayer.flags[4]:
        eventPlayer.setGravity(100)
        eventPlayer.flags[4] = false
    else:
        eventPlayer.setGravity(0)
        eventPlayer.flags[4] = true


rule "--- Adjust value ---":
    @Disabled
    @Delimiter
    


rule "Adjust toggle":
    @Event eachPlayer
    @Condition eventPlayer.gameMode == 2
    @Disabled
    
    if eventPlayer.flags[3] == false:
        eventPlayer.flags[3] = true
    else:
        eventPlayer.flags[3] = false


rule "Adjust: Value up (Primary Fire)":
    @Event eachPlayer
    @Condition eventPlayer.isHoldingButton(Button.PRIMARY_FIRE) == true
    @Condition eventPlayer.flags[3] == true
    #disabled while in menu
    @Condition eventPlayer.menuIndexArray[0] == 0
    
    eventPlayer.valueAdjust[eventPlayer.valueAdjust[0]] += eventPlayer.valueAdjust[1]


rule "Adjust: Value down (Secondary Fire)":
    @Event eachPlayer
    @Condition eventPlayer.isHoldingButton(Button.SECONDARY_FIRE) == true
    @Condition eventPlayer.flags[3] == true
    #disabled while in menu
    @Condition eventPlayer.menuIndexArray[0] == 0
    
    eventPlayer.valueAdjust[eventPlayer.valueAdjust[0]] -= eventPlayer.valueAdjust[1]


rule "Adjust: Step up (Jump)":
    @Event eachPlayer
    @Condition eventPlayer.isHoldingButton(Button.JUMP) == true
    @Condition eventPlayer.flags[3] == true
    #disabled while in menu
    @Condition eventPlayer.menuIndexArray[0] == 0
    
    if (eventPlayer.gameMode == 3 or eventPlayer.gameMode == 4) and eventPlayer.valueAdjust[1] < 0.01:
        #undo projectile size custom limit
        eventPlayer.valueAdjust[1] = 0.01
    else:
        eventPlayer.valueAdjust[1] *= 10
    hudHeader(getAllPlayers(), "Step: {0}".format(eventPlayer.valueAdjust[1]), HudPosition.TOP, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    eventPlayer.hudPopupArray.append(getLastCreatedText())
    clearPopupSet()


rule "Adjust: Step down (Crouch)":
    @Event eachPlayer
    @Condition eventPlayer.isHoldingButton(Button.CROUCH) == true
    @Condition eventPlayer.flags[3] == true
    #disabled while in menu
    @Condition eventPlayer.menuIndexArray[0] == 0
    
    if (eventPlayer.gameMode == 3 or eventPlayer.gameMode == 4) and eventPlayer.valueAdjust[1] <= 0.01:
        #limit projectile radius to 5mm at the lower end, as the dummy positioning does not allow for more precision
        eventPlayer.valueAdjust[1] = 0.005
    else:
        eventPlayer.valueAdjust[1] /= 10
    hudHeader(getAllPlayers(), "Step: {0}".format(eventPlayer.valueAdjust[1]), HudPosition.TOP, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    eventPlayer.hudPopupArray.append(getLastCreatedText())
    clearPopupSet()


def createAdjustFX():
    @Name "Adjust: Create FX"
    
    playEffect(eventPlayer, DynamicEffect.DEBUFF_IMPACT_SOUND, Color.WHITE, eventPlayer, 50)
    createEffect(eventPlayer, Effect.ECHO_CLONING, Color.TEAM_1, eventPlayer, 1, EffectReeval.VISIBILITY_POSITION_AND_RADIUS)
    eventPlayer.hudEffect = getLastCreatedEntity()


rule "--- Main HUD ---":
    @Disabled
    @Delimiter
    


def mainHUD():
    @Name "Sub: Main HUD"
    
    #hudHeader(eventPlayer, "Position: {0}".format(getPlayersInSlot(0, Team.1).getPosition()), HudPosition.LEFT, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    abilityDisplay()
    playerDisplay()


def abilityDisplay():
    @Name "MHUD: Ability display"
    
    hudHeader(eventPlayer, "Ability", HudPosition.RIGHT, 0, Color.PURPLE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Total damage: {0}".format(eventPlayer.sumDH[0]), HudPosition.RIGHT, 1, Color.ORANGE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Last damage: [{0}, {1}, {2}]".format(eventPlayer.lastDamageArray[0], eventPlayer.lastDamageArray[1], eventPlayer.lastDamageArray[2]), HudPosition.RIGHT, 1, Color.ORANGE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Damage time diff: [{0}, {1}, {2}] ms".format(eventPlayer.damageTimeArray[0], eventPlayer.damageTimeArray[1], eventPlayer.damageTimeArray[2]), HudPosition.RIGHT, 1, Color.ORANGE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Total healing: {0}".format(eventPlayer.sumDH[1]), HudPosition.RIGHT, 2, Color.YELLOW, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Last healing: [{0}, {1}, {2}]".format(eventPlayer.lastHealArray[0], eventPlayer.lastHealArray[1], eventPlayer.lastHealArray[2]), HudPosition.RIGHT, 2, Color.YELLOW, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Heal time diff: [{0}, {1}, {2}] ms".format(eventPlayer.healTimeArray[0], eventPlayer.healTimeArray[1], eventPlayer.healTimeArray[2]), HudPosition.RIGHT, 2, Color.YELLOW, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Damage/heal delay: {0} ms".format(eventPlayer.lastEventTime[8]), HudPosition.RIGHT, 3, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Ability active: {0} ms".format(eventPlayer.lastEventTime[3]), HudPosition.RIGHT, 3, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Can fire: {0} ms".format(eventPlayer.lastEventTime[4]), HudPosition.RIGHT, 3, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    #displaying in meters doesnt show all decimals
    hudSubheader(eventPlayer, "Projectile radius: {0} mm".format(1000 * eventPlayer.valueAdjust[3]), HudPosition.RIGHT, 3, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    #proj radius and damage delay need to be set, turn proj gravity off for arcing, refresh every second
    hudSubheader(eventPlayer, "Proj. speed (dmg): {0} m/s".format(eventPlayer.speedArray[7]), HudPosition.RIGHT, 3, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Proj. speed (heal): {0} m/s".format(eventPlayer.speedArray[8]), HudPosition.RIGHT, 3, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)


def playerDisplay():
    @Name "MHUD: Player display"
    
    hudHeader(eventPlayer, "Self", HudPosition.LEFT, 0, Color.GREEN, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Position: {0} (Eye: {1})".format(eventPlayer.currentPosition[0], eventPlayer.currentPosition[1]), HudPosition.LEFT, 1, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Distance facing: {0} (pos: {1})".format(distance(eventPlayer.currentPosition[1], eventPlayer.currentPosition[2]), eventPlayer.currentPosition[2]), HudPosition.LEFT, 1, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Distance previous: {0}".format(distance(eventPlayer.currentPosition[0], eventPlayer.savePosition[0])), HudPosition.LEFT, 1, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Speed: {0} (H: {1}; V: {2})".format(eventPlayer.getSpeed(), eventPlayer.getHorizontalSpeed(), eventPlayer.getVerticalSpeed()), HudPosition.LEFT, 2, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Max speed: {0} (H: {1}; V: {2})".format(eventPlayer.speedArray[0], eventPlayer.speedArray[1], eventPlayer.speedArray[2]), HudPosition.LEFT, 2, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Speed mod% (H only): {0}% (max: {1}%)".format(100 * (eventPlayer.getHorizontalSpeed() / 5.5 - 1), 100 * (eventPlayer.speedArray[0] / 5.5 - 1)), HudPosition.LEFT, 2, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Acceleration: {0} (max: {1}; min: {2})".format(eventPlayer.speedArray[4], eventPlayer.speedArray[5], eventPlayer.speedArray[6]), HudPosition.LEFT, 2, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "View angle diff: {0} (H: {1}; V: {2})".format(distance(vect(0, angleDifference(verticalAngleOfDirection(vectorTowards(eventPlayer.getEyePosition(), eventPlayer.currentPosition[2])), verticalAngleOfDirection(vectorTowards(eventPlayer.getEyePosition(), eventPlayer.savePosition[2]))), 0), vect(0, 0, angleDifference(horizontalAngleOfDirection(vectorTowards(eventPlayer.getEyePosition(), eventPlayer.currentPosition[2])), horizontalAngleOfDirection(vectorTowards(eventPlayer.getEyePosition(), eventPlayer.savePosition[2]))))), angleDifference(horizontalAngleOfDirection(vectorTowards(eventPlayer.getEyePosition(), eventPlayer.currentPosition[2])), horizontalAngleOfDirection(vectorTowards(eventPlayer.getEyePosition(), eventPlayer.savePosition[2]))), angleDifference(verticalAngleOfDirection(vectorTowards(eventPlayer.getEyePosition(), eventPlayer.currentPosition[2])), verticalAngleOfDirection(vectorTowards(eventPlayer.getEyePosition(), eventPlayer.savePosition[2])))), HudPosition.LEFT, 2, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    #enemy
    hudHeader(eventPlayer, "Enemy", HudPosition.LEFT, 3, Color.RED, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Position: {0} (Eye: {1})".format(getPlayersInSlot(1, Team.2).currentPosition[0], getPlayersInSlot(2, Team.2).currentPosition[1]), HudPosition.LEFT, 4, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Distance to player: {0}".format(distance(eventPlayer.currentPosition[0], getPlayersInSlot(1, Team.2).currentPosition[0])), HudPosition.LEFT, 4, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Speed: {0} (H: {1}; V: {2})".format(getPlayersInSlot(1, Team.2).getSpeed(), getPlayersInSlot(1, Team.2).getHorizontalSpeed(), getPlayersInSlot(1, Team.2).getVerticalSpeed()), HudPosition.LEFT, 4, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Max speed: {0} (H: {1}; V: {2})".format(getPlayersInSlot(1, Team.2).speedArray[0], getPlayersInSlot(1, Team.2).speedArray[1], getPlayersInSlot(1, Team.2).speedArray[2]), HudPosition.LEFT, 4, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    #ally
    hudHeader(eventPlayer, "Ally", HudPosition.LEFT, 5, Color.BLUE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Position: {0} (Eye: {1})".format(getPlayersInSlot(1, Team.1).currentPosition[0], getPlayersInSlot(0, Team.2).currentPosition[1]), HudPosition.LEFT, 6, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Distance to player: {0}".format(distance(eventPlayer.currentPosition[0], getPlayersInSlot(1, Team.1).currentPosition[0])), HudPosition.LEFT, 6, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Speed: {0} (H: {1}; V: {2})".format(getPlayersInSlot(1, Team.1).getSpeed(), getPlayersInSlot(1, Team.1).getHorizontalSpeed(), getPlayersInSlot(1, Team.1).getVerticalSpeed()), HudPosition.LEFT, 6, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "Max speed: {0} (H: {1}; V: {2})".format(getPlayersInSlot(1, Team.1).speedArray[0], getPlayersInSlot(1, Team.1).speedArray[1], getPlayersInSlot(1, Team.1).speedArray[2]), HudPosition.LEFT, 6, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)


rule "--- Main Menu ---":
    @Disabled
    @Delimiter
    


rule "Menu on/off toggle (Interact)":
    @Event eachPlayer
    @Condition eventPlayer.isHoldingButton(Button.INTERACT) == true
    #@Condition eventPlayer == hostPlayer
    
    wait(WSSHoldDelay, Wait.ABORT_WHEN_FALSE)
    wait(0.25)
    #menu on
    if eventPlayer.menuIndexArray[0] == 0:
        eventPlayer.stopFacing()
        eventPlayer.menuIndexArray[0] = 1
        eventPlayer.activeMenuArray = mainMenuArray
        disableAbilitiesAndFire()
        createMenu()
        #menu off
    else:
        eventPlayer.menuIndexArray[0] = 0
        destroyMenu()
        enableAbilitiesAndFire()
        #if PST on, force facing again
        if eventPlayer.gameMode == 3:
            eventPlayer.setFacing(vect(1, 0, 0), Relativity.TO_WORLD)
            eventPlayer.startFacing(vect(1, 0, 0), 10000, Relativity.TO_WORLD, FacingReeval.NONE)


def createMenu():
    @Name "Sub:Create Menu"
    
    eventPlayer.menuPosArray = []
    eventPlayer.menuEffectArray = []
    eventPlayer.menuTextArray = []
    for eventPlayer.menuIterator in range(len(eventPlayer.activeMenuArray)):
        eventPlayer.currentMenuPos = worldVector(vect(2 - eventPlayer.menuIterator % 5, eventPlayer.getEyePosition() + 2.5 - floor(eventPlayer.menuIterator / 5), 4), eventPlayer, Transform.ROTATION_AND_TRANSLATION)
        eventPlayer.menuPosArray.append(eventPlayer.currentMenuPos)
        createEffect(eventPlayer, Effect.SPHERE, Color.WHITE, eventPlayer.currentMenuPos, 0.4, EffectReeval.NONE)
        eventPlayer.menuEffectArray.append(getLastCreatedEntity())
        createInWorldText(eventPlayer, eventPlayer.activeMenuArray[eventPlayer.menuIterator], eventPlayer.currentMenuPos, 1, Clip.NONE, WorldTextReeval.NONE)
        eventPlayer.menuTextArray.append(getLastCreatedText())


def destroyMenu():
    @Name "Sub:Destroy Menu"
    
    destroyEffect(eventPlayer.menuEffectArray)
    for eventPlayer.menuIterator in range(len(eventPlayer.menuTextArray)):
        destroyInWorldText(eventPlayer.menuTextArray[eventPlayer.menuIterator])


def menuSelectSet():
    @Name "Sub:Resolve menu select"
    
    wait()
    enableAbilitiesAndFire()
    destroyMenu()
    eventPlayer.menuIndexArray = [0, 0]


rule "Menu press button":
    @Event eachPlayer
    @Condition eventPlayer.isHoldingButton(Button.PRIMARY_FIRE) == true
    @Condition eventPlayer.menuIndexArray[0] != 0
    
    for eventPlayer.menuIterator in range(len(eventPlayer.activeMenuArray)):
        if distance(raycast(eventPlayer.getEyePosition(), eventPlayer.getEyePosition() + distance(eventPlayer.getEyePosition(), eventPlayer.menuPosArray[eventPlayer.menuIterator]) * eventPlayer.getFacingDirection(), null, eventPlayer, false).getHitPosition(), eventPlayer.menuPosArray[eventPlayer.menuIterator]) <= 0.4:
            playEffect(eventPlayer, DynamicEffect.GOOD_EXPLOSION, Color.BLUE, eventPlayer.menuPosArray[eventPlayer.menuIterator], 0.4)
            playEffect(eventPlayer, DynamicEffect.BUFF_IMPACT_SOUND, Color.WHITE, eventPlayer, 1)
            waitUntil(not eventPlayer.isHoldingButton(Button.PRIMARY_FIRE), 99999)
            eventPlayer.menuIndexArray[1] = eventPlayer.menuIterator
            break


rule "Hero select from menu":
    @Event eachPlayer
    @Condition (eventPlayer.menuIndexArray[0] == 1 and eventPlayer.menuIndexArray[1] == 1) == true
    
    wait()
    destroyMenu()
    eventPlayer.setAllowedHeroes(getAllHeroes().exclude(eventPlayer.getHero()))
    wait(0.25)
    eventPlayer.setAllowedHeroes(getAllHeroes())
    eventPlayer.menuIndexArray = [0, 0]
    enableAbilitiesAndFire()
    instantPerks()


rule "Restart lobby from menu":
    @Event eachPlayer
    @Condition (eventPlayer.menuIndexArray[0] == 1 and eventPlayer.menuIndexArray[1] == 4) == true
    
    wait()
    restartMatch()


rule "Fast CD toggle":
    @Event eachPlayer
    @Condition (eventPlayer.menuIndexArray[0] == 1 and eventPlayer.menuIndexArray[1] == 5) == true
    
    wait()
    enableAbilitiesAndFire()
    destroyMenu()
    if flags[3]:
        flags[3] = false
        hudHeader(getAllPlayers(), "Fast cooldowns disabled", HudPosition.TOP, 0, Color.GRAY, HudReeval.VISIBILITY_AND_STRING)
    else:
        flags[3] = true
        hudHeader(getAllPlayers(), "Fast cooldowns enabled", HudPosition.TOP, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    eventPlayer.menuIndexArray = [0, 0]
    eventPlayer.hudPopupArray.append(getLastCreatedText())
    clearPopupSet()


rule "--- Dummy setup mode (DSM) ---":
    @Disabled
    @Delimiter
    


rule "Dummy setup mode (DSM) toggle":
    @Event eachPlayer
    @Condition (eventPlayer.menuIndexArray[0] == 1 and eventPlayer.menuIndexArray[1] == 2) == true
    
    wait()
    destroyMenu()
    if eventPlayer.gameMode != 1:
        dsmOn()
    else:
        dsmOff()
    eventPlayer.menuIndexArray = [0, 0]


def dsmOn():
    @Name "Sub: DSM on"
    
    wait(0.25)
    eventPlayer.gameMode = 1
    createAdjustFX()
    disableAbilitiesAndFire()
    eventPlayer.setStatusEffect(null, Status.PHASED_OUT, 9999)
    destroyAllHudTexts()
    wait()
    #top
    hudHeader(eventPlayer, "Dummy Setup Mode", HudPosition.TOP, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    #left
    hudHeader(eventPlayer, "{0} Enemy {0}".format("" if eventPlayer.setupAllyDummy else "*"), HudPosition.LEFT, 0, Color.RED, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "{1} {0}".format(heroIcon(heroArray[eventPlayer.DSMenemyIndex[0]]), heroArray[eventPlayer.DSMenemyIndex[0]]), HudPosition.LEFT, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "{1} {0}".format(abilityIconString(heroArray[eventPlayer.DSMenemyIndex[0]], buttonArray[eventPlayer.DSMenemyIndex[1]]), buttonArray[eventPlayer.DSMenemyIndex[1]]), HudPosition.LEFT, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, attackModeArray[eventPlayer.DSMenemyIndex[2]], HudPosition.LEFT, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudHeader(eventPlayer, "{0} Ally {0}".format("*" if eventPlayer.setupAllyDummy else ""), HudPosition.LEFT, 1, Color.BLUE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "{1} {0}".format(heroIcon(heroArray[eventPlayer.DSMallyIndex[0]]), heroArray[eventPlayer.DSMallyIndex[0]]), HudPosition.LEFT, 1, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, "{1} {0}".format(abilityIconString(heroArray[eventPlayer.DSMallyIndex[0]], buttonArray[eventPlayer.DSMallyIndex[1]]), buttonArray[eventPlayer.DSMallyIndex[1]]), HudPosition.LEFT, 1, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubheader(eventPlayer, attackModeArray[eventPlayer.DSMallyIndex[2]], HudPosition.LEFT, 1, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Primary - Next Hero", HudPosition.RIGHT, 1, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Secondary - Previous Hero", HudPosition.RIGHT, 2, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Ability 1 - Toggle ally/enemy", HudPosition.RIGHT, 3, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Ability 2 - Cycle action", HudPosition.RIGHT, 4, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Ultimate Ability - Cycle attack mode", HudPosition.RIGHT, 5, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Crouch - Place Dummy", HudPosition.RIGHT, 6, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Melee - Dummy Attack", HudPosition.RIGHT, 7, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)


def dsmOff():
    @Name "Sub: DSM off"
    
    wait()
    eventPlayer.gameMode = 0
    eventPlayer.clearStatusEffect(Status.PHASED_OUT)
    enableAbilitiesAndFire()
    destroyAllHudTexts()
    wait()
    mainHUD()
    destroyEffect(eventPlayer.hudEffect)


rule "DSM: Toggle dummy team (Ability 1)":
    @Event eachPlayer
    @Condition eventPlayer.gameMode == 1
    @Condition eventPlayer.isHoldingButton(Button.ABILITY_1) == true
    
    if eventPlayer.setupAllyDummy:
        eventPlayer.setupAllyDummy = false
    else:
        eventPlayer.setupAllyDummy = true


rule "DSM: Cycle next hero (Primary Fire)":
    @Event eachPlayer
    @Condition eventPlayer.gameMode == 1
    @Condition eventPlayer.menuIndexArray[0] == 0
    @Condition eventPlayer.isHoldingButton(Button.PRIMARY_FIRE) == true
    
    if eventPlayer.setupAllyDummy:
        if eventPlayer.DSMallyIndex[0] < len(heroArray) - 1:
            eventPlayer.DSMallyIndex[0]++
        else:
            eventPlayer.DSMallyIndex[0] = 0
    else:
        if eventPlayer.DSMenemyIndex[0] < len(heroArray) - 1:
            eventPlayer.DSMenemyIndex[0]++
        else:
            eventPlayer.DSMenemyIndex[0] = 0


rule "DSM: Cycle previous hero (Secondary Fire)":
    @Event eachPlayer
    @Condition eventPlayer.gameMode == 1
    @Condition eventPlayer.menuIndexArray[0] == 0
    @Condition eventPlayer.isHoldingButton(Button.SECONDARY_FIRE) == true
    
    if eventPlayer.setupAllyDummy:
        if eventPlayer.DSMallyIndex[0] > 0:
            eventPlayer.DSMallyIndex[0]--
        else:
            eventPlayer.DSMallyIndex[0] = len(heroArray) - 1
    else:
        if eventPlayer.DSMenemyIndex[0] > 0:
            eventPlayer.DSMenemyIndex[0]--
        else:
            eventPlayer.DSMenemyIndex[0] = len(heroArray) - 1


rule "DSM: Spawn dummy (Crouch)":
    @Event eachPlayer
    @Condition eventPlayer.gameMode == 1
    @Condition eventPlayer.isHoldingButton(Button.CROUCH) == true
    
    if eventPlayer.setupAllyDummy:
        createDummy(heroArray[eventPlayer.DSMallyIndex[0]], Team.1, 1, eventPlayer.getPosition(), eventPlayer.getFacingDirection())
        wait(0.25)
        getPlayersInSlot(1, Team.1).setFacing(eventPlayer.getFacingDirection(), Relativity.TO_WORLD)
    else:
        createDummy(heroArray[eventPlayer.DSMenemyIndex[0]], Team.2, 1, eventPlayer.getPosition(), eventPlayer.getFacingDirection())
        wait(0.25)
        getPlayersInSlot(1, Team.2).setFacing(eventPlayer.getFacingDirection(), Relativity.TO_WORLD)


rule "DSM: Cycle ability (Ability 2)":
    @Event eachPlayer
    @Condition eventPlayer.gameMode == 1
    @Condition eventPlayer.isHoldingButton(Button.ABILITY_2) == true
    
    if eventPlayer.setupAllyDummy:
        if eventPlayer.DSMallyIndex[1] < len(buttonArray) - 1:
            eventPlayer.DSMallyIndex[1]++
        else:
            eventPlayer.DSMallyIndex[1] = 0
    else:
        if eventPlayer.DSMenemyIndex[1] < len(buttonArray) - 1:
            eventPlayer.DSMenemyIndex[1]++
        else:
            eventPlayer.DSMenemyIndex[1] = 0


rule "DSM: Cycle attack mode (Ultimate)":
    @Event eachPlayer
    @Condition eventPlayer.gameMode == 1
    @Condition eventPlayer.isHoldingButton(Button.ULTIMATE) == true
    
    if eventPlayer.setupAllyDummy:
        if eventPlayer.DSMallyIndex[2] < 2:
            eventPlayer.DSMallyIndex[2]++
        else:
            eventPlayer.DSMallyIndex[2] = 0
    else:
        if eventPlayer.DSMenemyIndex[2] < 2:
            eventPlayer.DSMenemyIndex[2]++
        else:
            eventPlayer.DSMenemyIndex[2] = 0


rule "DSM: Ally use ability (Melee)":
    @Event eachPlayer
    @Condition eventPlayer.isHoldingButton(Button.MELEE) == true
    
    #press
    if eventPlayer.DSMallyIndex[2] < 2:
        getPlayersInSlot(1, Team.1).forceButtonPress(buttonArray[eventPlayer.DSMallyIndex[1]])
        #+confirm
        if eventPlayer.DSMallyIndex[2] == 1:
            getPlayersInSlot(1, Team.1).forceButtonPress(WSSConfirmInput)
        #toggle on
    elif eventPlayer.DSMallyIndex[2] == 2:
        getPlayersInSlot(1, Team.1).startForcingButton(buttonArray[eventPlayer.DSMallyIndex[1]])
        eventPlayer.DSMallyIndex[2] = 3
        #toggle off
    else:
        getPlayersInSlot(1, Team.1).stopForcingButton(buttonArray[eventPlayer.DSMallyIndex[1]])
        eventPlayer.DSMallyIndex[2] = 2


rule "DSM: Enemy use ability (Melee)":
    @Event eachPlayer
    @Condition eventPlayer.isHoldingButton(Button.MELEE) == true
    
    #press or press+confirm
    if eventPlayer.DSMenemyIndex[2] < 2:
        getPlayersInSlot(1, Team.2).forceButtonPress(buttonArray[eventPlayer.DSMenemyIndex[1]])
        if eventPlayer.DSMenemyIndex[2] == 1:
            getPlayersInSlot(1, Team.2).forceButtonPress(WSSConfirmInput)
        #toggle on
    elif eventPlayer.DSMenemyIndex[2] == 2:
        getPlayersInSlot(1, Team.2).startForcingButton(buttonArray[eventPlayer.DSMenemyIndex[1]])
        eventPlayer.DSMenemyIndex[2] = 3
        #toggle off
    else:
        getPlayersInSlot(1, Team.2).stopForcingButton(buttonArray[eventPlayer.DSMenemyIndex[1]])
        eventPlayer.DSMenemyIndex[2] = 2


rule "--- Ult Cost Tester (UCT) --":
    @Disabled
    @Delimiter
    


rule "Ult cost tester (UCT) toggle":
    @Event eachPlayer
    @Condition (eventPlayer.menuIndexArray[0] == 1 and eventPlayer.menuIndexArray[1] == 3) == true
    
    wait()
    destroyMenu()
    if eventPlayer.gameMode != 2:
        eventPlayer.gameMode = 2
        #index pointer to value where adjustments are saved
        eventPlayer.valueAdjust[0] = 2
        eventPlayer.valueAdjust[1] = 100
        disableAbilitiesAndFire()
        destroyAllHudTexts()
        wait()
        #enable mouse value adjustments
        eventPlayer.flags[3] = true
        uctHUD()
        eventPlayer.setUltEnabled(true)
    else:
        eventPlayer.gameMode = 0
        enableAbilitiesAndFire()
        #disable mousevalue adjustments
        eventPlayer.flags[3] = false
        destroyDummy(Team.2, 2)
        destroyAllHudTexts()
        wait()
        mainHUD()
    eventPlayer.menuIndexArray = [0, 0]


def uctHUD():
    @Name "UCT: HUD"
    
    hudHeader(getAllPlayers(), "Ult Cost Tester", HudPosition.TOP, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudHeader(getAllPlayers(), "Damage: {0}".format(eventPlayer.valueAdjust[2]), HudPosition.LEFT, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudHeader(getAllPlayers(), "Step: {0}".format(eventPlayer.valueAdjust[1]), HudPosition.LEFT, 1, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Primary - Damage up", HudPosition.RIGHT, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Secondary - Damage down", HudPosition.RIGHT, 1, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Jump - Step up", HudPosition.RIGHT, 2, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Crouch - Step down", HudPosition.RIGHT, 3, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Interact - Execute", HudPosition.RIGHT, 4, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Reload (hold) - Hero select", HudPosition.RIGHT, 5, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)


rule "UCT: Execute":
    @Event eachPlayer
    @Condition eventPlayer.isHoldingButton(Button.INTERACT) == true
    @Condition eventPlayer.gameMode == 2
    
    eventPlayer.setUltCharge(0)
    #spawns test dummy
    createDummy(Hero.TRACER, Team.2, 2, eventPlayer.getFacingDirection() * 5 + eventPlayer.getPosition())
    wait(0.25)
    #add health to test dummy so it doesn't die
    getPlayersInSlot(2, Team.2).addHealthPool(Health.NORMAL, 5000, true)
    wait(0.25)
    #damage dummy
    damage(getPlayersInSlot(2, Team.2), eventPlayer, eventPlayer.valueAdjust[2])
    createBeam(getAllPlayers(), Beam.BAD, eventPlayer, getPlayersInSlot(2, Team.2), Color.PURPLE, EffectReeval.VISIBILITY_POSITION_AND_RADIUS)
    playEffect(getAllPlayers(), DynamicEffect.EXPLOSION_SOUND, Color.WHITE, getPlayersInSlot(2, Team.2), 100)
    wait(0.1)
    destroyEffect(getLastCreatedEntity())


rule "UCT: Damage popup":
    @Event playerTookDamage
    #@Condition eventPlayer.gameMode == 2
    
    createInWorldText(eventPlayer, "-{0}".format(eventDamage), Vector.UP * 0.5 + eventPlayer.getEyePosition(), 1.5, Clip.SURFACES, WorldTextReeval.VISIBILITY_POSITION_AND_STRING, Color.RED)
    eventPlayer.damagePopArray.append(getLastCreatedText())
    wait(1)
    destroyInWorldText(eventPlayer.damagePopArray[0])
    del eventPlayer.damagePopArray[0]


rule "--- Projectile Size Tester (PST) --":
    @Disabled
    
    #Note: accurate to 5mm, rounded down, because it is not possible to move the bots any more precisely
    #wait(0.25)


rule "Projectile size tester (PST) toggle":
    @Event eachPlayer
    @Condition (eventPlayer.menuIndexArray[0] == 1 and eventPlayer.menuIndexArray[1] == 6) == true
    
    wait()
    destroyMenu()
    if eventPlayer.gameMode != 3:
        eventPlayer.gameMode = 3
        destroyAllHudTexts()
        wait()
        pstHUD()
        pstInit()
    else:
        eventPlayer.gameMode = 0
        eventPlayer.flags[3] = false
        destroyDummy(Team.2, 6)
        destroyDummy(Team.2, 7)
        eventPlayer.clearStatusEffect(Status.PHASED_OUT)
        eventPlayer.stopFacing()
        destroyAllHudTexts()
        destroyEffect(eventPlayer.hudEffect)
        wait()
        mainHUD()
    eventPlayer.menuIndexArray = [0, 0]
    enableAbilitiesAndFire()


def pstHUD():
    @Name "PST: HUD"
    
    hudHeader(getAllPlayers(), "Projectile Size Tester", HudPosition.TOP, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    #note: converted to mm, bc default only shows up to 2 decimals
    hudHeader(eventPlayer, "Radius: {1} mm".format(null, 1000 * eventPlayer.valueAdjust[3]), HudPosition.LEFT, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudHeader(getAllPlayers(), "Step: {0} mm {1}".format(1000 * eventPlayer.valueAdjust[1], "(min)" if eventPlayer.valueAdjust[1] == 0.005 else ""), HudPosition.LEFT, 1, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Interact - Toggle gap size adjusting", HudPosition.RIGHT, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Primary - Increase gap", HudPosition.RIGHT, 1, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Secondary - Decrease gap", HudPosition.RIGHT, 2, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Jump - Step up", HudPosition.RIGHT, 3, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Crouch - Step down", HudPosition.RIGHT, 4, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Reload - Hero select", HudPosition.RIGHT, 5, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Reload (hold) - Hero select", HudPosition.RIGHT, 6, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)


def pstInit():
    @Name "PST: Initialize mode"
    
    eventPlayer.setStatusEffect(null, Status.PHASED_OUT, 9999)
    #need to tp player to a location so that the shield bot offsets are consistent
    eventPlayer.teleport(vect(0, 0, 0))
    eventPlayer.valueAdjust[0] = 3
    eventPlayer.valueAdjust[1] = 0.01
    eventPlayer.setFacing(vect(1, 0, 0), Relativity.TO_WORLD)
    eventPlayer.startFacing(vect(1, 0, 0), 10000, Relativity.TO_WORLD, FacingReeval.NONE)
    wait(0.25)
    #set current pos to defaultPos (pos-radius) 
    eventPlayer.pstData[2] = worldVector(eventPlayer.pstData[0], eventPlayer, Transform.ROTATION_AND_TRANSLATION)
    eventPlayer.pstData[3] = worldVector(eventPlayer.pstData[1], eventPlayer, Transform.ROTATION_AND_TRANSLATION)
    #helper dummy off
    #eventPlayer.pstData[5] = 0
    wait()
    #spawn dummies, slots 6 and 7
    createDummy(Hero.REINHARDT, Team.2, 6, eventPlayer.pstData[2] - eventPlayer.valueAdjust[3], vect(-1, 0, 0))
    createDummy(Hero.REINHARDT, Team.2, 7, eventPlayer.pstData[3] + eventPlayer.valueAdjust[3], vect(-1, 0, 0))
    wait()
    #shield on
    getPlayersInSlot(6, Team.2).startForcingButton(Button.SECONDARY_FIRE)
    getPlayersInSlot(7, Team.2).startForcingButton(Button.SECONDARY_FIRE)
    getPlayersInSlot(6, Team.2).setGravity(0)
    getPlayersInSlot(7, Team.2).setGravity(0)
    #teleport dummies to new gap
    getPlayersInSlot(6, Team.2).teleport(eventPlayer.pstData[2] + eventPlayer.currentPosition[1] - eventPlayer.currentPosition[0] + vect(0, 0, eventPlayer.valueAdjust[3]))
    getPlayersInSlot(7, Team.2).teleport(eventPlayer.pstData[3] + eventPlayer.currentPosition[1] - eventPlayer.currentPosition[0] + vect(0, 0, -1 * eventPlayer.valueAdjust[3]))
    wait()


rule "PST: Adjust value toggle (\"Interact\")":
    @Event eachPlayer
    @Condition eventPlayer.gameMode == 3
    @Condition eventPlayer.isHoldingButton(Button.INTERACT) == true
    
    #enable mouse adjustments
    if eventPlayer.flags[3] == false:
        eventPlayer.flags[3] = true
        createAdjustFX()
        disableAbilitiesAndFire()
        #exit adjust and teleport dummies
    else:
        eventPlayer.flags[3] = false
        #reset pos
        eventPlayer.pstData[2] = worldVector(eventPlayer.pstData[0], eventPlayer, Transform.ROTATION_AND_TRANSLATION)
        eventPlayer.pstData[3] = worldVector(eventPlayer.pstData[1], eventPlayer, Transform.ROTATION_AND_TRANSLATION)
        #teleport dummies to new gap
        getPlayersInSlot(6, Team.2).teleport(eventPlayer.pstData[2] + eventPlayer.currentPosition[1] - eventPlayer.currentPosition[0] + vect(0, 0, eventPlayer.valueAdjust[3]))
        getPlayersInSlot(7, Team.2).teleport(eventPlayer.pstData[3] + eventPlayer.currentPosition[1] - eventPlayer.currentPosition[0] + vect(0, 0, -1 * eventPlayer.valueAdjust[3]))
        destroyEffect(eventPlayer.hudEffect)
        enableAbilitiesAndFire()


rule "PST: Reset dummies (\"Reload\")":
    @Event eachPlayer
    @Condition eventPlayer.gameMode == 3
    @Condition eventPlayer.isHoldingButton(Button.RELOAD) == true
    
    destroyDummy(Team.2, 6)
    destroyDummy(Team.2, 7)
    #need to tp player to a location so that the shield bot offsets are consistent
    eventPlayer.teleport(vect(0, 0, 0))
    #reset pos
    eventPlayer.pstData[2] = worldVector(eventPlayer.pstData[0], eventPlayer, Transform.ROTATION_AND_TRANSLATION)
    eventPlayer.pstData[3] = worldVector(eventPlayer.pstData[1], eventPlayer, Transform.ROTATION_AND_TRANSLATION)
    wait(0.25)
    #spawn dummies, slots 6 and 7
    createDummy(Hero.REINHARDT, Team.2, 6, eventPlayer.pstData[2] - eventPlayer.valueAdjust[3], vect(-1, 0, 0))
    createDummy(Hero.REINHARDT, Team.2, 7, eventPlayer.pstData[3] + eventPlayer.valueAdjust[3], vect(-1, 0, 0))
    wait()
    #shield on
    getPlayersInSlot(6, Team.2).startForcingButton(Button.SECONDARY_FIRE)
    getPlayersInSlot(7, Team.2).startForcingButton(Button.SECONDARY_FIRE)
    getPlayersInSlot(6, Team.2).setGravity(0)
    getPlayersInSlot(7, Team.2).setGravity(0)
    #teleport dummies to new gap
    getPlayersInSlot(6, Team.2).teleport(eventPlayer.pstData[2] + eventPlayer.currentPosition[1] - eventPlayer.currentPosition[0] + vect(0, 0, eventPlayer.valueAdjust[3]))
    getPlayersInSlot(7, Team.2).teleport(eventPlayer.pstData[3] + eventPlayer.currentPosition[1] - eventPlayer.currentPosition[0] + vect(0, 0, -1 * eventPlayer.valueAdjust[3]))


rule "--- Explosion Size Tester (EST) --":
    @Disabled
    
    #Note: accurate to 5mm, rounded down, because it is not possible to move the bots any more precisely
    #wait(0.25)


rule "Explosion size tester (EST) toggle":
    @Event eachPlayer
    @Condition (eventPlayer.menuIndexArray[0] == 1 and eventPlayer.menuIndexArray[1] == 8) == true
    
    wait()
    destroyMenu()
    if eventPlayer.gameMode != 4:
        eventPlayer.gameMode = 4
        destroyAllHudTexts()
        wait()
        estHUD()
        estInit()
    else:
        eventPlayer.gameMode = 0
        eventPlayer.flags[3] = false
        destroyDummy(Team.2, 6)
        destroyDummy(Team.2, 7)
        eventPlayer.clearStatusEffect(Status.PHASED_OUT)
        eventPlayer.stopFacing()
        destroyAllHudTexts()
        destroyEffect(eventPlayer.hudEffect)
        wait()
        mainHUD()
    eventPlayer.menuIndexArray = [0, 0]
    enableAbilitiesAndFire()


def estHUD():
    @Name "EST: HUD"
    
    hudHeader(getAllPlayers(), "Explosion Size Tester", HudPosition.TOP, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    #note: converted to mm, bc default only shows up to 2 decimals
    hudHeader(eventPlayer, "Radius: {1} mm".format(null, 1000 * eventPlayer.valueAdjust[4]), HudPosition.LEFT, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudHeader(getAllPlayers(), "Step: {0} mm {1}".format(1000 * eventPlayer.valueAdjust[1], "(min)" if eventPlayer.valueAdjust[1] == 0.005 else ""), HudPosition.LEFT, 1, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Interact - Toggle gap size adjusting", HudPosition.RIGHT, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Primary - Increase gap", HudPosition.RIGHT, 1, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Secondary - Decrease gap", HudPosition.RIGHT, 2, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Jump - Step up", HudPosition.RIGHT, 3, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Crouch - Step down", HudPosition.RIGHT, 4, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Reload - Reset units", HudPosition.RIGHT, 5, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudSubtext(getAllPlayers(), "Reload (hold) - Hero select", HudPosition.RIGHT, 6, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)


def estInit():
    @Name "EST: Initialize mode"
    
    eventPlayer.setStatusEffect(null, Status.PHASED_OUT, 9999)
    #need to tp player to a location so that the shield bot offsets are consistent
    eventPlayer.teleport(vect(0, 0, 0))
    eventPlayer.valueAdjust[0] = 4
    eventPlayer.valueAdjust[1] = 0.1
    #spawn dummies, slots 6 and 7
    createDummy(Hero.JUNKRAT, Team.2, 6, vect(0, 0, 10), vect(1, 0, 0))
    #spawn dummies, slots 6 and 7
    createDummy(Hero.JUNKRAT, Team.2, 7, vect(0, 0, 10), vect(1, 0, 0))
    wait(0.5)
    getPlayersInSlot(6, Team.2).setStatusEffect(null, Status.PHASED_OUT, 9999)
    getPlayersInSlot(7, Team.2).setStatusEffect(null, Status.PHASED_OUT, 9999)
    wait(0.25)
    #teleport dummies to new gap
    getPlayersInSlot(6, Team.2).teleport(vect(0, 0, -0.416 - eventPlayer.valueAdjust[4]))
    #teleport dummies to new gap
    getPlayersInSlot(7, Team.2).teleport(vect(0, 0, 0.358 + eventPlayer.valueAdjust[4]))
    #wait(0.05)
    getPlayers(Team.2).setFacing(vect(0, 0, 1), Relativity.TO_WORLD)
    eventPlayer.setFacing(vect(1, 0, 0), Relativity.TO_WORLD)
    wait(0.25)
    getAllPlayers().startFacing(vect(0, -1, 0), 10000)
    wait(0.25)
    getPlayers(Team.2).forceButtonPress(Button.ABILITY_1)
    wait(0.25)
    getPlayersInSlot(6, Team.ALL).teleport(vect(10, 0, -10))
    getPlayersInSlot(7, Team.ALL).teleport(vect(10, 0, -10))


rule "EST: Adjust value toggle (\"Interact\")":
    @Event eachPlayer
    @Condition eventPlayer.gameMode == 4
    @Condition eventPlayer.isHoldingButton(Button.INTERACT) == true
    
    #enable mouse adjustments
    if eventPlayer.flags[3] == false:
        eventPlayer.flags[3] = true
        createAdjustFX()
        disableAbilitiesAndFire()
        #exit adjust and teleport dummies
    else:
        eventPlayer.flags[3] = false
        #teleport dummies to new gap
        getPlayersInSlot(6, Team.2).teleport(vect(0, 0, -0.416 - eventPlayer.valueAdjust[4]))
        #teleport dummies to new gap
        getPlayersInSlot(7, Team.2).teleport(vect(0, 0, 0.358 + eventPlayer.valueAdjust[4]))
        getPlayers(Team.2).forceButtonPress(Button.ABILITY_1)
        wait(0.25)
        getPlayersInSlot(6, Team.2).teleport(vect(10, 0, -10))
        getPlayersInSlot(7, Team.2).teleport(vect(10, 0, -10))
        destroyEffect(eventPlayer.hudEffect)
        enableAbilitiesAndFire()


rule "EST: Reset dummies (\"Reload\")":
    @Event eachPlayer
    @Condition eventPlayer.gameMode == 4
    @Condition eventPlayer.isHoldingButton(Button.RELOAD) == true
    
    destroyDummy(Team.2, 6)
    destroyDummy(Team.2, 7)
    eventPlayer.setStatusEffect(null, Status.PHASED_OUT, 9999)
    #need to tp player to a location so that the shield bot offsets are consistent
    eventPlayer.teleport(vect(0, 0, 0))
    #spawn dummies, slots 6 and 7
    createDummy(Hero.JUNKRAT, Team.2, 6, vect(0, 0, 10), vect(1, 0, 0))
    #spawn dummies, slots 6 and 7
    createDummy(Hero.JUNKRAT, Team.2, 7, vect(0, 0, 10), vect(1, 0, 0))
    wait(0.5)
    getPlayersInSlot(6, Team.2).setStatusEffect(null, Status.PHASED_OUT, 9999)
    getPlayersInSlot(7, Team.2).setStatusEffect(null, Status.PHASED_OUT, 9999)
    wait(0.25)
    #teleport dummies to new gap
    getPlayersInSlot(6, Team.2).teleport(vect(0, 0, -0.416 - eventPlayer.valueAdjust[4]))
    #teleport dummies to new gap
    getPlayersInSlot(7, Team.2).teleport(vect(0, 0, 0.358 + eventPlayer.valueAdjust[4]))
    #wait(0.05)
    getPlayers(Team.2).setFacing(vect(0, 0, 1), Relativity.TO_WORLD)
    eventPlayer.setFacing(vect(1, 0, 0), Relativity.TO_WORLD)
    wait(0.25)
    getAllPlayers().startFacing(vect(0, -1, 0), 10000)
    wait(0.25)
    getPlayers(Team.2).forceButtonPress(Button.ABILITY_1)
    wait(0.25)
    getPlayersInSlot(6, Team.2).teleport(vect(10, 0, -10))
    getPlayersInSlot(7, Team.2).teleport(vect(10, 0, -10))


rule "--- Event triggers ---":
    @Disabled
    @Delimiter
    


rule "Player dealt damage":
    @Event playerDealtDamage
    @Team 1
    
    #save last damage to array
    eventPlayer.lastDamageArray.append(eventDamage)
    #save time diff to last damage event as milliseconds
    eventPlayer.damageTimeArray.append(1000 * getTotalTimeElapsed() - eventPlayer.lastEventTime[0])
    #set current time as last event time
    eventPlayer.lastEventTime[0] = 1000 * getTotalTimeElapsed()
    logToInspector("T: {0} ms | dT: {1} | dmg: {2}".format(eventPlayer.lastEventTime[0], eventPlayer.damageTimeArray[3], eventDamage))
    #add to total damage since last reset
    eventPlayer.sumDH[0] += eventDamage
    #do not enable this or damage events on the same frame will fail to log
    #wait()
    #remove oldest values
    del eventPlayer.lastDamageArray[0]
    del eventPlayer.damageTimeArray[0]
    #damage flag save time diff
    if eventPlayer.flags[0] == true:
        eventPlayer.lastEventTime[6] = eventPlayer.lastEventTime[0] - eventPlayer.lastEventTime[5]
        #reset damage and heal flags
        eventPlayer.flags[0] = false
    #delay test save time diff
    if eventPlayer.flags[2] == true:
        eventPlayer.lastEventTime[8] = eventPlayer.lastEventTime[0] - eventPlayer.lastEventTime[5]
        #reset flag
        eventPlayer.flags[2] = false
        wait(0.25)
        #delete bots
        destroyDummy(getOppositeTeam(eventPlayer.getTeam()), 5)
        destroyDummy(eventPlayer.getTeam(), 5)
        eventPlayer.clearStatusEffect(Status.PHASED_OUT)
    #hudHeader(getAllPlayers(), "{0} m".format(distance(eventPlayer, victim)), HudPosition.TOP, 0, Color.WHITE, HudReeval.NONE)


rule "Player dealt healing":
    @Event playerDealtHealing
    @Team 1
    #prevent logging self-heal, so that support passive does not mess things up
    @Condition (healee != eventPlayer or not WSShideSelfHeal) == true
    
    #save last healing to array
    eventPlayer.lastHealArray.append(eventHealing)
    #save time diff to last heal event in milliseconds
    eventPlayer.healTimeArray.append(1000 * getTotalTimeElapsed() - eventPlayer.lastEventTime[1])
    #set current time as last event time
    eventPlayer.lastEventTime[1] = 1000 * getTotalTimeElapsed()
    #add to total healing since last reset
    eventPlayer.sumDH[1] += eventHealing
    logToInspector("T: {0} ms | dT: {1} | heal: {2}".format(eventPlayer.lastEventTime[1], eventPlayer.healTimeArray[3], eventHealing))
    #do not enable this or damage events on the same frame will fail to log
    #wait()
    #remove oldest values
    del eventPlayer.lastHealArray[0]
    del eventPlayer.healTimeArray[0]
    #heal flag save time diff
    if eventPlayer.flags[1] == true:
        eventPlayer.lastEventTime[7] = eventPlayer.lastEventTime[1] - eventPlayer.lastEventTime[5]
        #reset damage and heal flags
        eventPlayer.flags[1] = false
    #delay test save time diff
    if eventPlayer.flags[2] == true:
        eventPlayer.lastEventTime[8] = eventPlayer.lastEventTime[1] - eventPlayer.lastEventTime[5]
        #reset flag
        eventPlayer.flags[2] = false
        wait(0.25)
        #delete dummies
        destroyDummy(eventPlayer.getTeam(), 5)
        destroyDummy(getOppositeTeam(eventPlayer.getTeam()), 5)
        eventPlayer.clearStatusEffect(Status.PHASED_OUT)


rule "Button held, not primary - start timer":
    @Event eachPlayer
    #check button presses excl primary
    @Condition any([eventPlayer.isHoldingButton(i) for i in buttonArray.slice(1, len(buttonArray) - 1)]) == true
    @Condition eventPlayer.gameMode == 0
    
    #ability press in ms
    eventPlayer.lastEventTime[2] = 1000 * getTotalTimeElapsed()


rule "Button held, not primary - stop is using ability timer":
    @Event eachPlayer
    #check button presses excl primary
    @Condition any([eventPlayer.isHoldingButton(i) for i in buttonArray.slice(1, len(buttonArray) - 1)]) == true
    @Condition eventPlayer.gameMode == 0
    
    #wait until no ability is in use
    waitUntil(not eventPlayer.isFiringSecondaryFire() and not eventPlayer.isUsingAbility1() and not eventPlayer.isUsingAbility2() and not eventPlayer.isUsingUltimate() and not eventPlayer.isMeleeing(), 20)
    #save ability end in ms
    eventPlayer.lastEventTime[3] = 1000 * getTotalTimeElapsed() - eventPlayer.lastEventTime[2]


rule "Button held, not primary - stop can fire timer":
    @Event eachPlayer
    #check button presses excl primary
    @Condition any([eventPlayer.isHoldingButton(i) for i in buttonArray.slice(1, len(buttonArray) - 1)]) == true
    @Condition eventPlayer.gameMode == 0
    
    waitUntil(eventPlayer.isFiringPrimaryFire(), 20)
    #save can fire time in ms
    eventPlayer.lastEventTime[4] = 1000 * getTotalTimeElapsed() - eventPlayer.lastEventTime[2]


rule "Button held any - start timer":
    @Event eachPlayer
    #check button presses excl primary
    @Condition any([eventPlayer.isHoldingButton(player) for player in buttonArray]) == true
    @Condition eventPlayer.gameMode == 0
    
    #ability press in ms
    eventPlayer.lastEventTime[5] = 1000 * getTotalTimeElapsed()
    logToInspector("T: {0} - Press botan".format(eventPlayer.lastEventTime[5]))
    #set damage and heal flags to filter only first instance for stuff like proj speed testing
    eventPlayer.flags[0] = true
    eventPlayer.flags[1] = true
    #extend match time to 15 minutes whenever a button is pressed
    setMatchTime(900)


rule "-- Custom Macros (\"VL up\") --":
    @Disabled
    @Delimiter
    


rule "CM: Interruption tester":
    @Event eachPlayer
    @Condition eventPlayer.isCommunicating(Comms.VOICE_LINE_UP) == true
    @Disabled
    
    #0: start | 1: end | 2: step
    interruptDelay = [0.33, 0.34, 0.001]
    hudHeader(getAllPlayers(), 1000 * interruptDelay[0], HudPosition.TOP, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    eventPlayer.hudPopupArray.append(getLastCreatedText())
    while interruptDelay[0] <= interruptDelay[1]:
        eventPlayer.forceButtonPress(Button.ULTIMATE)
        #eventPlayer.startForcingButton(Button.SECONDARY_FIRE)
        wait(interruptDelay)
        eventPlayer.setStatusEffect(null, Status.HACKED, 1)
        wait()
        #eventPlayer.stopForcingButton(Button.SECONDARY_FIRE)
        wait(2)
        eventPlayer.setUltCharge(100)
        interruptDelay[0] += interruptDelay[2]
    wait(1)
    clearPopupSet()


rule "CM: Orbital Ray Duration test":
    @Event eachPlayer
    @Condition eventPlayer.isCommunicating(Comms.VOICE_LINE_UP) == true
    @Disabled
    
    eventPlayer.forceButtonPress(Button.ULTIMATE)
    wait(0.5)
    eventPlayer.teleport(vect(100, 100, 100))
    while not eventPlayer.isMeleeing():
        damage(eventPlayer, null, 1)
        damage(getPlayersInSlot(1, Team.ALL), eventPlayer, 1)
        heal(getPlayersInSlot(1, Team.ALL), null, 1)
        logToInspector("{0} ms | {1} HP".format(1000 * getTotalTimeElapsed(), eventPlayer.getHealth()))
        wait()


rule "CM: Log MSpeed and health":
    @Event eachPlayer
    @Condition eventPlayer.isCommunicating(Comms.VOICE_LINE_UP) == true
    
    enableInspector()
    #eventPlayer.forceButtonPress(Button.ULTIMATE)
    while not eventPlayer.isCrouching():
        #confirmation
        #eventPlayer.forceButtonPress(Button.PRIMARY_FIRE)
        #player
        logToInspector("{0} ms | {1} m/s | {2} HP".format(1000 * getTotalTimeElapsed(), eventPlayer.getSpeed(), eventPlayer.getHealth()))
        #ally dummy
        #logToInspector("{0} ms | {1} m/s | {2} HP".format(1000 * getTotalTimeElapsed(), getPlayersInSlot(1, Team.1).getSpeed(), getPlayersInSlot(1, Team.1).getHealth()))
        #enemy dummy
        #logToInspector("{0} ms | {1} m/s | {2} HP".format(1000 * getTotalTimeElapsed(), getPlayersInSlot(1, Team.2).getSpeed(), getPlayersInSlot(1, Team.2).getHealth()))
        if getPlayersInSlot(1, Team.2).hasStatus(Status.STUNNED):
            #player
            logToInspector("{0} ms | Stunned!".format(1000 * getTotalTimeElapsed()))
        #if getPlayersInSlot(1, Team.2).hasStatus(Status.KNOCKED_DOWN):
        #player
        #logToInspector("{0} ms | Knocked down!".format(1000 * getTotalTimeElapsed()))
        #__end__()
        wait()


rule "CM: Brig pack test":
    @Event eachPlayer
    @Condition eventPlayer.isCommunicating(Comms.VOICE_LINE_UP) == true
    @Disabled
    
    while not eventPlayer.isMeleeing():
        eventPlayer.forceButtonPress(Button.ABILITY_2)
        eventPlayer.setAbilityCharge(Button.ABILITY_2, 3)
        getPlayersInSlot(1, Team.ALL).setHealth(2)
        damage(getPlayersInSlot(1, Team.ALL), null, 1)
        wait()


rule "CM: Toggle MS multi":
    @Event eachPlayer
    @Condition eventPlayer.isCommunicating(Comms.VOICE_LINE_UP) == true
    @Disabled
    
    if flags[4]:
        flags[4] = false
        eventPlayer.setMoveSpeed(100)
    else:
        flags[4] = true
        eventPlayer.setMoveSpeed(10)


rule "CM: Lifeweaber charge test":
    @Event eachPlayer
    @Condition eventPlayer.isCommunicating(Comms.VOICE_LINE_UP) == true
    @Disabled
    
    #0: start | 1: end | 2: step
    interruptDelay = [5.4, 5.6, 0.01]
    hudHeader(getAllPlayers(), 1000 * interruptDelay[0], HudPosition.TOP, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    eventPlayer.hudPopupArray.append(getLastCreatedText())
    eventPlayer.forceButtonPress(Button.PRIMARY_FIRE)
    while interruptDelay[0] <= interruptDelay[1]:
        wait(interruptDelay)
        eventPlayer.sumDH[1] = 0
        getPlayersInSlot(1, Team.ALL).setHealth(2)
        damage(getPlayersInSlot(1, Team.ALL), null, 1)
        eventPlayer.forceButtonPress(Button.PRIMARY_FIRE)
        interruptDelay[0] += interruptDelay[2]
    wait(1)
    clearPopupSet()


rule "CM: speedcap test":
    @Event eachPlayer
    @Condition eventPlayer.isCommunicating(Comms.VOICE_LINE_UP) == true
    @Disabled
    
    createDummy(Hero.JUNO, Team.1, 6, eventPlayer)
    createDummy(Hero.LUCIO, Team.1, 7, eventPlayer)
    wait(0.25)
    getPlayersInSlot(6, Team.ALL).forceButtonPress(Button.ABILITY_2)
    getPlayersInSlot(7, Team.ALL).forceButtonPress(Button.ABILITY_2)
    wait(5)
    destroyDummy(Team.1, 6)
    destroyDummy(Team.1, 7)


rule "CM: Press botan":
    @Event eachPlayer
    @Condition eventPlayer.isHoldingButton(Button.ULTIMATE) == true
    @Disabled
    
    while not eventPlayer.isMeleeing():
        eventPlayer.forceButtonPress(Button.PRIMARY_FIRE)
        wait()
        #eventPlayer.startForcingButton(Button.SECONDARY_FIRE)
        #wait(0.992)
        #eventPlayer.stopForcingButton(Button.SECONDARY_FIRE)


rule "CM: Show raycast":
    @Event eachPlayer
    @Condition eventPlayer.isCommunicating(Comms.VOICE_LINE_UP) == true
    @Disabled
    
    createEffect(getAllPlayers(), Effect.SPHERE, Color.AQUA, eventPlayer.currentPosition[2], 0.1, EffectReeval.VISIBILITY_POSITION_AND_RADIUS)
    createEffect(getAllPlayers(), Effect.SPHERE, Color.PURPLE, eventPlayer.savePosition[2], 0.2, EffectReeval.VISIBILITY_POSITION_AND_RADIUS)


rule "CM: Gigabuff dummy":
    @Event eachPlayer
    @Condition eventPlayer.isCommunicating(Comms.VOICE_LINE_UP) == true
    @Disabled
    
    createDummy(Hero.HAZARD, Team.2, 6, eventPlayer.getPosition())
    getPlayersInSlot(6, Team.2).setMaxHealth(1000)


rule "CM: Kinetic test":
    @Event eachPlayer
    @Condition eventPlayer.isCommunicating(Comms.VOICE_LINE_UP) == true
    @Disabled
    
    createDummy(Hero.REINHARDT, Team.2, 5, vect(0, 0, 0))
    createDummy(Hero.REINHARDT, Team.2, 6, vect(-1, 0, 0))
    createDummy(Hero.REINHARDT, Team.2, 7, vect(-2, 0, 0))
    createDummy(Hero.REINHARDT, Team.2, 8, vect(-3, 0, 0))
    createDummy(Hero.REINHARDT, Team.2, 9, vect(1, 0, 0))
    createDummy(Hero.REINHARDT, Team.2, 10, vect(2, 0, 0))
    wait(0.25)
    getPlayers(Team.2).setFacing(eventPlayer.getEyePosition(), Relativity.TO_WORLD)
    wait()
    eventPlayer.forceButtonPress(Button.ABILITY_2)
    wait(1.08)
    eventPlayer.forceButtonPress(Button.ABILITY_1)
    getPlayers(Team.2).forceButtonPress(Button.ABILITY_2)
    while not eventPlayer.isCrouching():
        #player
        logToInspector("{0} ms | {1} s | {2} HP".format(1000 * getTotalTimeElapsed(), eventPlayer.getAbilityCooldown(Button.ABILITY_2), eventPlayer.getHealth()))
        wait()
    destroyAllDummies()


rule "CM: Teletubby":
    @Event eachPlayer
    @Condition eventPlayer.isCommunicating(Comms.VOICE_LINE_UP) == true
    @Disabled
    
    eventPlayer.forceButtonPress(Button.ABILITY_2)
    wait(1.5)
    eventPlayer.teleport(vect(100, 0, 0))


rule "CM: View angle check":
    @Event eachPlayer
    @Condition eventPlayer.isCommunicating(Comms.VOICE_LINE_UP) == true
    @Disabled
    
    hudHeader(getAllPlayers(), "distance: {0}".format(distance(vect(0, 1.3, 0) + getPlayersInSlot(1, Team.1).getPosition(), raycast(eventPlayer.getEyePosition(), eventPlayer.getEyePosition() + eventPlayer.getFacingDirection() * distance(eventPlayer.getPosition(), getPlayersInSlot(1, Team.1).getPosition()), null, getAllPlayers(), true).getHitPosition())), HudPosition.TOP, 0, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    eventPlayer.setFacing(localVector(getPlayersInSlot(1, Team.1).getPosition(), eventPlayer, Transform.ROTATION_AND_TRANSLATION), Relativity.TO_PLAYER)


rule "CM: Test fire rate":
    @Event eachPlayer
    @Condition eventPlayer.isCommunicating(Comms.VOICE_LINE_UP) == true
    
    eventPlayer.setAmmo(0, 101)
    eventPlayer.startFacing(vect(1, 0, 0), 10000)
    createDummy(Hero.ROADHOG, Team.2, 7, eventPlayer.getPosition() + vect(1, 0, 0))
    wait(0.25)
    getAllPlayers().setStatusEffect(null, Status.ROOTED, 9999)
    eventPlayer.lastEventTime[9] = 1000 * getTotalTimeElapsed()
    #enable to test ads
    #eventPlayer.startForcingButton(Button.SECONDARY_FIRE)
    eventPlayer.startForcingButton(Button.PRIMARY_FIRE)
    while eventPlayer.getAmmo() > 0:
        #toggle on for semi-auto weapons
        #eventPlayer.forceButtonPress(Button.PRIMARY_FIRE)
        heal(getAllPlayers(), null, 1000)
        wait()
    eventPlayer.stopForcingButton(Button.PRIMARY_FIRE)
    eventPlayer.stopForcingButton(Button.SECONDARY_FIRE)
    hudHeader(getAllPlayers(), "recovery: {0} ms | fire rate: {1} shots/s".format((1000 * getTotalTimeElapsed() - eventPlayer.lastEventTime[9]) / 100, 100000 / (1000 * getTotalTimeElapsed() - eventPlayer.lastEventTime[9])), HudPosition.TOP, 0, Color.WHITE, HudReeval.NONE)
    eventPlayer.hudPopupArray.append(getLastCreatedText())
    waitUntil(eventPlayer.isMeleeing(), 99999)
    clearPopupSet()
    eventPlayer.stopFacing()
    getAllPlayers().clearStatusEffect(Status.ROOTED)
    destroyDummy(Team.2, 7)


rule "CM: As all things should be":
    @Event eachPlayer
    @Condition eventPlayer.isCommunicating(Comms.VOICE_LINE_UP) == true
    @Disabled
    
    #createDummy(Hero.REINHARDT, Team.1, 5, vect(0, 0, 0))
    #createDummy(Hero.REINHARDT, Team.1, 6, vect(-1, 0, 0))
    #createDummy(Hero.REINHARDT, Team.1, 7, vect(-2, 0, 0))
    #createDummy(Hero.REINHARDT, Team.1, 8, vect(-3, 0, 0))
    #createDummy(Hero.REINHARDT, Team.1, 9, vect(1, 0, 0))
    wait(1)
    while not eventPlayer.isCrouching():
        #getPlayers(Team.1).setHealth(200)
        getPlayersInSlot(1, Team.ALL).setHealth(200)
        #damage(getPlayers(Team.1), null, 1)
        damage(getPlayersInSlot(1, Team.ALL), null, 1)
        #getPlayersInSlot(5, Team.ALL).setHealth(200)
        #damage(getPlayersInSlot(5, Team.ALL), null, 1)
        wait(0.1)


