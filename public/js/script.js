const aplayer = document.querySelector("#aplayer")
if (aplayer) {
    let dataSong = aplayer.getAttribute("data-song")
    dataSong = JSON.parse(dataSong)
    let dataSinger = aplayer.getAttribute("data-singer")
    dataSinger = JSON.parse(dataSinger)

    const ap = new APlayer({
        container: document.getElementById('aplayer'),
        audio: [{
            name: dataSong.title,
            artist: dataSinger.fullName,
            url: dataSong.audio,
            cover: dataSong.avatar,
        }],
        autoplay: true,
    });

    ap.on('play', function () {
        const avatar = document.querySelector(".inner-play .inner-avatar")
        avatar.style.animationPlayState = "running"
    });
    ap.on('pause', function () {
        const avatar = document.querySelector(".inner-play .inner-avatar")
        avatar.style.animationPlayState = "paused"
    });
}
