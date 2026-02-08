rule "Show Aiming Position":
    @Event eachPlayer
    @Condition eventPlayer.isDummy() == false
    # createBeam(eventPlayer, Beam.BAD, eventPlayer.getEyePosition() + vect(0, -0.1, 0), updateEveryFrame(raycast(eventPlayer.getEyePosition(), eventPlayer.getEyePosition() + eventPlayer.getFacingDirection() * 100, getAllPlayers(), eventPlayer, true).getHitPosition()), Color.TEAM_1)
    createEffect(eventPlayer, Effect.SPHERE, Color.GREEN, updateEveryFrame(raycast(eventPlayer.getEyePosition(), eventPlayer.getEyePosition() + eventPlayer.getFacingDirection() * 100, getAllPlayers(), eventPlayer, true).getHitPosition()), 0.225 / 2)