rule "Hold Crouch to Kill Self":
    @Event eachPlayer
    @Condition eventPlayer.isDummy() == false
    @Condition eventPlayer.isHoldingButton(Button.CROUCH)
    waitUntil(eventPlayer.isHoldingButton(Button.CROUCH) == false, 3)
    if eventPlayer.isHoldingButton(Button.CROUCH):
        kill(eventPlayer)
