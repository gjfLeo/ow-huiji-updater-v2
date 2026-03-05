macro Player.getBaseSpeed():
    5.5 if eventPlayer.getHero() != Hero.TRACER and eventPlayer.getHero() != Hero.GENJI and eventPlayer.getHero() != Hero.ANRAN else 6

macro Player.getRelativeSpeed():
    eventPlayer.getSpeed() / eventPlayer.getBaseSpeed() * 100

rule "显示移动速度":
    @Event eachPlayer
    createInWorldText(
        getAllPlayers()
            if eventPlayer.getSpeed() > 0 
            else "",
        f"{updateEveryFrame(eventPlayer.getRelativeSpeed())}%",
        updateEveryFrame(eventPlayer.getPosition()),
        2
    )
