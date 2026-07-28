//APLAYER
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
//End APLAYER

// Like song
const btnLike = document.querySelector("[button-like]")
if (btnLike) {
    btnLike.addEventListener("click", () => {
        const id = btnLike.getAttribute('button-like')

        const status = btnLike.classList.contains('active') ? 'dislike' : 'like'

        fetch(`/songs/like/${status}/${id}`, {
            method: "PATCH"
        })
            .then(res => res.json())
            .then(data => {
                if (data.code == 200) {
                    const elementNumber = btnLike.querySelector(".inner-number")
                    elementNumber.innerHTML = data.like;
                    btnLike.classList.toggle("active");
                }
            })
    })
}
// End Like song

// Favorite song
const listBtnFavorite = document.querySelectorAll("[button-favorite]")
if (listBtnFavorite.length > 0) {
    listBtnFavorite.forEach((btnFavorite) => {
        btnFavorite.addEventListener("click", () => {
            const id = btnFavorite.getAttribute('button-favorite')

            const status = btnFavorite.classList.contains('active') ? 'unfavorite' : 'favorite'

            fetch(`/songs/favorite/${status}/${id}`, {
                method: "PATCH"
            })
                .then(res => res.json())
                .then(data => {
                    if (data.code == 200) {
                        btnFavorite.classList.toggle("active");
                    }
                })
        })
    })
}
// End Favorite song

// Suggest search
const boxSearch = document.querySelector(".box-search")
if (boxSearch) {
  const input = boxSearch.querySelector("input[name='keyword']")
  input.addEventListener('input', () => {
    const keyword = input.value.trim();
    const innerSuggest = boxSearch.querySelector('.inner-suggest');
    const innerList = innerSuggest.querySelector('.inner-list');

    if (keyword !== "") {
      fetch(`/search/suggest?keyword=${keyword}`)
        .then(res => res.json())
        .then(data => {
          if (data.code == 200) {
            const songs = data.songDetail || [];
            if (songs.length > 0) {
              const arrHTML = songs.map(item => `
                <a href="/songs/detail/${item.slug}" class="inner-item">
                  <div class="inner-image">
                    <img src="${item.avatar}">
                  </div>
                  <div class="inner-info">
                    <div class="inner-title">${item.title}</div>
                    <div class="inner-singer">
                      <i class="fa-solid fa-microphone-lines"></i> ${item.singer.fullName}
                    </div>
                  </div>
                </a>
              `);
              innerList.innerHTML = arrHTML.join("");
              innerSuggest.classList.add('show');
            } else {
              innerList.innerHTML = "";
              innerSuggest.classList.remove('show');
            }
          }
        })
    } else {
      innerList.innerHTML = "";
      innerSuggest.classList.remove('show');
    }
  })
}

// End Suggest search