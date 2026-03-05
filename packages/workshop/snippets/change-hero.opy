playervar originalAllowedHeroes

rule "change hero":
    @Event eachPlayer
    @Condition eventPlayer.isDummy() == false
    @Condition eventPlayer.isCommunicating(Comms.NEED_HEALING) == true
    @Condition eventPlayer.getHero() != false

    eventPlayer.originalAllowedHeroes = eventPlayer.getAllowedHeroes()
    eventPlayer.setAllowedHeroes(eventPlayer.getAllowedHeroes().exclude(eventPlayer.getHero()))
    wait(0.16)
    eventPlayer.setAllowedHeroes(eventPlayer.originalAllowedHeroes)
    waitUntil(eventPlayer.getHero() != false)
