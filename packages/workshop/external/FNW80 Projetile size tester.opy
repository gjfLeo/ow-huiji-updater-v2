settings {
    "main": {
        "description": "Modified from workshop code 7QW6W",
        "modeName": "Proj size tester"
    },
    "lobby": {
        "spectatorSlots": 12,
        "team1Slots": 6,
        "team2Slots": 6
    },
    "gamemodes": {
        "skirmish": {
            "enabledMaps": [
                {
                    "havana": [
                        "morning"
                    ]
                }
            ],
            "heroLimit": "off",
            "respawnTime%": 30
        }
    },
    "heroes": {
        "team2": {
            "reinhardt": {
                "secondaryFireCooldown%": 0,
                "secondaryFireRechargeRate%": 500,
                "damageDealt%": 10,
                "damageReceived%": 10,
                "healingReceived%": 500,
                "health%": 500
            }
        },
        "allTeams": {
            "general": {
                "abilityCooldown%": 0,
                "ammoClipSize%": 500,
                "enableInfiniteAmmo": true,
                "enableSpawningWithUlt": true
            }
        }
    }
}

#Global variables

globalvar shieldDummyDefaultPos 0
globalvar helperDummyExists 4
globalvar canDoubleMoveDummy 5
globalvar gap 6
globalvar shieldDummyCurrentPos 17


#Only remove the following directive if the gamemode does not use tricks such as A+0, A*0, "am" == "**", etc which would otherwise be optimized out.
#!optimizeStrict


rule "Modified from workshop code 7QW6W":
    getAllPlayers().setAllowedHeroes(getAllHeroes())


rule "Create HUD":
    @Event eachPlayer
    @Team 1
    @Slot 0
    
    hudText(getPlayersInSlot(0, Team.1), l"({0})".format(getPlayersInSlot(0, Team.1).getPosition()), "XYZ", null, HudPosition.LEFT, 1, Color.WHITE, Color.WHITE, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudHeader(getPlayersInSlot(0, Team.1), l"({0})".format(getPlayersInSlot(0, Team.1).getFacingDirection()), HudPosition.LEFT, 1, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudText(getPlayersInSlot(0, Team.1), l"({0})".format(raycast(getPlayersInSlot(0, Team.1).getEyePosition(), getPlayersInSlot(0, Team.1).getEyePosition() + getPlayersInSlot(0, Team.1).getFacingDirection() * 1000, getAllPlayers(), eventPlayer, true).getHitPosition()), "XYZ", null, HudPosition.LEFT, 1, Color.WHITE, Color.WHITE, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudText(getAllPlayers(), "", null, "Interact: Gap +0.1 (Hold: +0.25) ", HudPosition.RIGHT, 0, Color.WHITE, Color.WHITE, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudText(getAllPlayers(), "", null, "Reload: Gap -0.1", HudPosition.RIGHT, 0, Color.WHITE, Color.WHITE, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudText(getAllPlayers(), "", null, "Jump (Hold): Reset gap", HudPosition.RIGHT, 0, Color.WHITE, Color.WHITE, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudText(getAllPlayers(), "", null, "Crouch (Hold): Hero select", HudPosition.RIGHT, 0, Color.WHITE, Color.WHITE, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudText(getAllPlayers(), "", null, "Jump + Crouch: Toggle extra dummy", HudPosition.RIGHT, 0, Color.WHITE, Color.WHITE, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudText(getAllPlayers(), "", null, "\"Group Up!\": Reset dummies", HudPosition.RIGHT, 0, Color.WHITE, Color.WHITE, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    hudText(getAllPlayers(), "", null, "\"Hello!\": Restart match", HudPosition.RIGHT, 0, Color.WHITE, Color.WHITE, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)


rule "HUD + INI":
    @Event eachPlayer
    @Team 1
    @Slot 0
    
    hudHeader(getPlayersInSlot(0, Team.1), "Gap: {0}m (=2r)".format(gap), HudPosition.TOP, 2, Color.WHITE, HudReeval.VISIBILITY_AND_STRING)
    getPlayersInSlot(0, Team.1).startHealingOverTime(getPlayersInSlot(0, Team.1), 9999, 100)
    helperDummyExists = 0


rule "Teleport Player":
    @Event eachPlayer
    @Condition getPlayersInSlot(0, Team.1).isInSpawnRoom() == true
    
    getPlayersInSlot(0, Team.1).teleport(vect(215, 27.5, -43))
    getPlayersInSlot(0, Team.1).setFacing(vect(1, 0, 0), Relativity.TO_WORLD)
    getPlayersInSlot(0, Team.1).startFacing(vect(1, 0, 0), 10000, Relativity.TO_WORLD, FacingReeval.NONE)
    wait()
    #loop()


rule "Create Dummies":
    @Event eachPlayer
    @Condition getNumberOfLivingPlayers(Team.ALL) == 1
    
    #if getPlayersInSlot(0, Team.1).isInSpawnRoom() == false:
    #        return
    shieldDummyDefaultPos[0] = vect(220, 27.5, -46.5)
    shieldDummyDefaultPos[1] = vect(220, 27.5, -39.722)
    shieldDummyCurrentPos[0] = shieldDummyDefaultPos[0]
    shieldDummyCurrentPos[1] = shieldDummyDefaultPos[1]
    createDummy(Hero.REINHARDT, Team.2, 0, shieldDummyCurrentPos[0], vect(-1, 0, 0))
    createDummy(Hero.REINHARDT, Team.2, 1, shieldDummyCurrentPos[1], vect(-1, 0, 0))
    #wait(0.25)
    #getPlayersInSlot(0, Team.2).setFacing(vect(-1, 1, 0), Relativity.TO_WORLD)
    #getPlayersInSlot(1, Team.2).setFacing(vect(-1, 1, 0), Relativity.TO_WORLD)


rule "Force Shield":
    @Event eachPlayer
    @Team 2
    @Hero reinhardt
    @Condition isHeroBeingPlayed(Hero.REINHARDT, Team.2) == true
    
    getPlayersOnHero(Hero.REINHARDT, Team.2).startForcingButton(Button.SECONDARY_FIRE)


rule "Interact: Gap +":
    @Event eachPlayer
    @Team 1
    @Slot 0
    @Condition getPlayersInSlot(0, Team.1).isHoldingButton(Button.INTERACT) == true
    @Condition gap < 5
    
    gap += 0.01


rule "Reload: Gap -":
    @Event eachPlayer
    @Team 1
    @Slot 0
    @Condition getPlayersInSlot(0, Team.1).isHoldingButton(Button.RELOAD) == true
    @Condition gap > 0
    
    gap -= 0.01


rule "Gap Count +0.24 Interact (1s)":
    @Event eachPlayer
    @Team 1
    @Slot 0
    @Condition getPlayersInSlot(0, Team.1).isHoldingButton(Button.INTERACT) == true
    @Condition gap < 5
    
    wait(1, Wait.ABORT_WHEN_FALSE)
    gap += 0.24
    canDoubleMoveDummy = 1


rule "Gap Count -0.24 Reload (1s)":
    @Event eachPlayer
    @Team 1
    @Slot 0
    @Condition getPlayersInSlot(0, Team.1).isHoldingButton(Button.RELOAD) == true
    @Condition gap > 0
    
    wait(1, Wait.ABORT_WHEN_FALSE)
    gap -= 0.24
    canDoubleMoveDummy = 1


rule "Gap Reset >= 5":
    @Event eachPlayer
    @Team 1
    @Slot 0
    @Condition getPlayersInSlot(0, Team.1).isHoldingButton(Button.INTERACT) == true
    @Condition gap >= 5
    
    gap = 0


rule "Gap Reset < 0":
    @Event eachPlayer
    @Team 1
    @Slot 0
    @Condition getPlayersInSlot(0, Team.1).isHoldingButton(Button.RELOAD) == true
    @Condition gap < 0
    
    gap = 0


rule "Jump (1s) to Reset the Gap":
    @Event eachPlayer
    @Team 1
    @Slot 0
    @Condition getPlayersInSlot(0, Team.1).isHoldingButton(Button.JUMP) == true
    
    wait(1, Wait.ABORT_WHEN_FALSE)
    gap = 0


rule "Crouch (1s) to kill/change Hero":
    @Event eachPlayer
    @Team 1
    @Slot 0
    @Condition eventPlayer.isHoldingButton(Button.CROUCH) == true
    
    wait(1, Wait.ABORT_WHEN_FALSE)
    kill(getPlayersInSlot(0, Team.1))
    eventPlayer.setAllowedHeroes(getAllHeroes().exclude(eventPlayer.getHero()))
    wait(0.25)
    eventPlayer.setAllowedHeroes(getAllHeroes())


rule "Modify Rein Pos":
    @Event eachPlayer
    @Condition (getPlayersInSlot(0, Team.ALL).isHoldingButton(Button.INTERACT) or getPlayersInSlot(0, Team.ALL).isHoldingButton(Button.RELOAD)) == true
    
    wait(0.032)
    shieldDummyCurrentPos[0] = shieldDummyDefaultPos[0] - vect(0, 0, gap / 2)
    shieldDummyCurrentPos[1] = shieldDummyDefaultPos[1] + vect(0, 0, gap / 2)
    getPlayersInSlot(0, Team.2).teleport(shieldDummyCurrentPos[0])
    getPlayersInSlot(1, Team.2).teleport(shieldDummyCurrentPos[1])
    canDoubleMoveDummy = 0


rule "Modify Rein Pos G0":
    @Event eachPlayer
    @Condition gap == 0
    
    wait(0.032)
    shieldDummyCurrentPos[0] = shieldDummyDefaultPos[0] - vect(0, 0, gap / 2)
    shieldDummyCurrentPos[1] = shieldDummyDefaultPos[1] + vect(0, 0, gap / 2)
    getPlayersInSlot(0, Team.2).teleport(shieldDummyCurrentPos[0])
    getPlayersInSlot(1, Team.2).teleport(shieldDummyCurrentPos[1])
    canDoubleMoveDummy = 0


rule "Modify Rein Pos":
    @Event eachPlayer
    @Condition canDoubleMoveDummy == 1
    
    wait(0.032)
    shieldDummyCurrentPos[0] = shieldDummyDefaultPos[0] - vect(0, 0, gap / 2)
    shieldDummyCurrentPos[1] = shieldDummyDefaultPos[1] + vect(0, 0, gap / 2)
    getPlayersInSlot(0, Team.2).teleport(shieldDummyCurrentPos[0])
    getPlayersInSlot(1, Team.2).teleport(shieldDummyCurrentPos[1])
    canDoubleMoveDummy = 0


rule "Create Extra Player ENEMY (Jump + Crouch)":
    @Event eachPlayer
    @Team 1
    @Slot 0
    @Condition getPlayersInSlot(0, Team.1).isHoldingButton(Button.JUMP) == true
    @Condition getPlayersInSlot(0, Team.1).isHoldingButton(Button.CROUCH) == true
    @Condition helperDummyExists == 0
    
    createDummy(Hero.ROADHOG, Team.2, 2, vect(226, 27.5, -43), vect(-1, 0, 0))
    wait(1)
    helperDummyExists = 1


rule "Destroy Extra Player ENEMY (Jump + Crouch)":
    @Event eachPlayer
    @Team 1
    @Slot 0
    @Condition getPlayersInSlot(0, Team.1).isHoldingButton(Button.JUMP) == true
    @Condition getPlayersInSlot(0, Team.1).isHoldingButton(Button.CROUCH) == true
    @Condition helperDummyExists == 1
    
    destroyDummy(Team.2, 2)
    wait(1)
    helperDummyExists = 0


rule "Create Extra Player Friendy":
    @Event eachPlayer
    @Team 1
    @Slot 0
    @Condition getPlayersInSlot(0, Team.1).isHoldingButton(Button.JUMP) == true
    @Condition getPlayersInSlot(0, Team.1).isHoldingButton(Button.CROUCH) == true
    @Condition helperDummyExists == 0
    @Disabled
    
    createDummy(Hero.SYMMETRA, Team.1, 2, vect(226, 27.5, -43), vect(-1, 0, 0))
    wait(1)
    helperDummyExists = 1


rule "Destroy Extra Player Friendly":
    @Event eachPlayer
    @Team 1
    @Slot 0
    @Condition getPlayersInSlot(0, Team.1).isHoldingButton(Button.JUMP) == true
    @Condition getPlayersInSlot(0, Team.1).isHoldingButton(Button.CROUCH) == true
    @Condition helperDummyExists == 1
    @Disabled
    
    destroyDummy(Team.1, 2)
    wait(1)
    helperDummyExists = 0


rule "Damage ally dummy":
    @Event eachPlayer
    @Team 1
    @Slot 2
    @Disabled
    
    damage(eventPlayer, null, 1)
    wait(0.25)
    loop()


rule "Reset ultimate":
    @Event eachPlayer
    @Condition eventPlayer.getUltCharge() < 100
    @Condition eventPlayer.isHoldingButton(Button.ULTIMATE) == true
    
    eventPlayer.setUltCharge(100)


rule "\"Group Up!\" to reset dummies":
    @Event eachPlayer
    @Condition eventPlayer.isCommunicating(Comms.GROUP_UP) == true
    
    destroyAllDummies()
    wait(0.25)
    createDummy(Hero.REINHARDT, Team.2, 0, shieldDummyCurrentPos[0], vect(-1, 0, 0))
    createDummy(Hero.REINHARDT, Team.2, 1, shieldDummyCurrentPos[1], vect(-1, 0, 0))


rule "Crouch + Reload (1.5s) to restart game":
    @Event eachPlayer
    @Condition eventPlayer.isCommunicating(Comms.HELLO) == true
    
    wait(1.25)
    restartMatch()


rule "Damage pop":
    @Event playerDealtDamage
    
    hudHeader(getAllPlayers(), eventDamage, HudPosition.TOP, 0, Color.RED, HudReeval.VISIBILITY_AND_STRING)
    wait(1)
    destroyHudText(getLastCreatedText())


