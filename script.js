const weddingDate = new Date("2026-10-09T13:40:00+09:00");

const toast = document.getElementById("toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 1700);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("복사되었습니다.");
  } catch {
    showToast("복사 기능을 사용할 수 없습니다.");
  }
}

function updateDday() {
  const now = new Date();
  const diff = weddingDate.getTime() - now.getTime();

  const day = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  const hour = Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24));
  const minute = Math.max(0, Math.floor((diff / (1000 * 60)) % 60));
  const second = Math.max(0, Math.floor((diff / 1000) % 60));

  document.getElementById("dday").textContent = day;
  document.getElementById("dhour").textContent = String(hour).padStart(2, "0");
  document.getElementById("dminute").textContent = String(minute).padStart(2, "0");
  document.getElementById("dsecond").textContent = String(second).padStart(2, "0");
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", () => {
    copyText(button.dataset.copy);
  });
});

document.getElementById("shareButton").addEventListener("click", () => {
  copyText(window.location.href);
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
    }
  });
}, {
  threshold: 0.16
});

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

const imageModal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const modalClose = document.getElementById("modalClose");

const GALLERY_PHOTOS = [
  "0.webp", "1.webp", "2.webp", "3.webp",
  "3-1.webp", "3-1-1.webp", "3-1-1-1.webp",
  "4.webp", "5.webp", "6.webp", "7.webp", "8.webp", "9.webp",
  "10.webp", "11.webp", "12.webp", "13.webp", "14.webp",
  "15.webp", "16.webp", "17.webp", "18.webp", "19.webp", "20.webp",
  "21.webp", "22.webp", "23.webp", "24.webp", "25.webp", "26.webp",
  "27.webp",
];

let lbIndex = 0;
const modalCounter = document.getElementById("modalCounter");
const modalPrev = document.getElementById("modalPrev");
const modalNext = document.getElementById("modalNext");

function srcAt(i) {
  return "./images/wedding-webp/" + encodeURI(GALLERY_PHOTOS[i]);
}

function setModalImage(i) {
  lbIndex = (i + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length;
  modalImage.classList.add("swapping");
  setTimeout(() => {
    modalImage.src = srcAt(lbIndex);
    if (modalCounter) {
      modalCounter.textContent =
        String(lbIndex + 1).padStart(2, "0") + " / " +
        String(GALLERY_PHOTOS.length).padStart(2, "0");
    }
    requestAnimationFrame(() => modalImage.classList.remove("swapping"));
  }, 140);
}

function openModalAt(i) {
  lbIndex = i;
  modalImage.src = srcAt(i);
  if (modalCounter) {
    modalCounter.textContent =
      String(i + 1).padStart(2, "0") + " / " +
      String(GALLERY_PHOTOS.length).padStart(2, "0");
  }
  imageModal.classList.add("open");
  imageModal.setAttribute("aria-hidden", "false");
}

function navModal(d) { setModalImage(lbIndex + d); }

if (modalPrev) modalPrev.addEventListener("click", (e) => { e.stopPropagation(); navModal(-1); });
if (modalNext) modalNext.addEventListener("click", (e) => { e.stopPropagation(); navModal(1); });

document.addEventListener("keydown", (event) => {
  if (!imageModal.classList.contains("open")) return;
  if (event.key === "ArrowLeft")  navModal(-1);
  if (event.key === "ArrowRight") navModal(1);
});

let touchStartX = 0, touchStartY = 0;
imageModal.addEventListener("touchstart", (e) => {
  const t = e.changedTouches[0];
  touchStartX = t.clientX; touchStartY = t.clientY;
}, { passive: true });
imageModal.addEventListener("touchend", (e) => {
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
    navModal(dx > 0 ? -1 : 1);
  }
}, { passive: true });

(function buildGallery() {
  const grid = document.getElementById("galleryGrid");
  const moreBtn = document.getElementById("galleryMore");
  if (!grid) return;

  const INITIAL = 10;

  function makeItem(name, i) {
    const src = "./images/wedding-webp/" + encodeURI(name);
    const btn = document.createElement("button");
    btn.className = "gallery-photo";
    btn.type = "button";
    btn.dataset.image = src;
    const img = document.createElement("img");
    img.src = src;
    img.alt = "갤러리 사진 " + (i + 1);
    img.loading = "lazy";
    img.decoding = "async";
    btn.appendChild(img);
    btn.addEventListener("click", () => openModalAt(i));
    return btn;
  }

  function appendRange(from, to) {
    const frag = document.createDocumentFragment();
    for (let i = from; i < to && i < GALLERY_PHOTOS.length; i++) {
      frag.appendChild(makeItem(GALLERY_PHOTOS[i], i));
    }
    grid.appendChild(frag);
  }

  appendRange(0, INITIAL);

  if (moreBtn) {
    if (GALLERY_PHOTOS.length <= INITIAL) {
      moreBtn.style.display = "none";
    } else {
      moreBtn.textContent = `더 보기 (+${GALLERY_PHOTOS.length - INITIAL})`;
      moreBtn.addEventListener("click", () => {
        appendRange(INITIAL, GALLERY_PHOTOS.length);
        moreBtn.style.display = "none";
      }, { once: true });
    }
  }
})();

function closeModal() {
  imageModal.classList.remove("open");
  imageModal.setAttribute("aria-hidden", "true");
  modalImage.src = "";
}

modalClose.addEventListener("click", closeModal);
imageModal.addEventListener("click", (event) => {
  if (event.target === imageModal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

const guestbookForm = document.getElementById("guestbookForm");
const guestbookList = document.getElementById("guestbookList");
const storageKey = "weddingGuestbookMessages";

function getMessages() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

function saveMessages(messages) {
  localStorage.setItem(storageKey, JSON.stringify(messages));
}

function renderMessages() {
  const messages = getMessages();
  guestbookList.innerHTML = "";

  if (messages.length === 0) {
    guestbookList.innerHTML = '<div class="guestbook-message"><strong>축하 메시지</strong><p>첫 번째 축하 메시지를 남겨보세요.</p></div>';
    return;
  }

  messages.slice().reverse().forEach((message) => {
    const item = document.createElement("div");
    item.className = "guestbook-message";

    const name = document.createElement("strong");
    name.textContent = message.name;

    const text = document.createElement("p");
    text.textContent = message.text;

    item.appendChild(name);
    item.appendChild(text);
    guestbookList.appendChild(item);
  });
}

guestbookForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const nameInput = document.getElementById("guestName");
  const messageInput = document.getElementById("guestMessage");

  const name = nameInput.value.trim();
  const text = messageInput.value.trim();

  if (!name || !text) {
    showToast("이름과 메시지를 입력해주세요.");
    return;
  }

  const messages = getMessages();
  messages.push({ name, text, createdAt: new Date().toISOString() });
  saveMessages(messages.slice(-20));

  nameInput.value = "";
  messageInput.value = "";
  renderMessages();
  showToast("메시지가 저장되었습니다.");
});

updateDday();
window.setInterval(updateDday, 1000);
renderMessages();

const VENUE = {
  name: "루이비스컨벤션 강서점",
  lat: 37.5697,
  lng: 126.8623,
};

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function openNaverMap(event) {
  if (!isMobile()) return true;
  event.preventDefault();
  const name = encodeURIComponent(VENUE.name);
  window.location.href = `nmap://search?query=${name}&appname=wedding`;
  setTimeout(() => {
    window.location.href = `https://map.naver.com/p/search/${name}`;
  }, 1200);
  return false;
}

function openTmap(event) {
  event.preventDefault();
  const name = encodeURIComponent(VENUE.name);
  if (isMobile()) {
    window.location.href = `tmap://search?name=${name}`;
    setTimeout(() => {
      window.location.href = "https://tmap.life/";
    }, 1500);
  } else {
    alert("T맵은 모바일 앱에서 동작합니다. 데스크톱에서는 네이버/카카오 지도를 이용해 주세요.");
  }
  return false;
}

window.openNaverMap = openNaverMap;
window.openTmap = openTmap;

(function initBgm() {
  const audio = document.getElementById("bgm");
  const btn = document.getElementById("bgmToggle");
  const icon = document.getElementById("bgmIcon");
  if (!audio || !btn) return;

  const src = audio.dataset.src;
  if (!src) return;

  fetch(src, { method: "HEAD" }).then((r) => {
    if (!r.ok) return;
    setup();
  }).catch(() => {});

  function setup() {
    audio.src = src;
    audio.volume = 0.5;
    btn.hidden = false;

    function setPlayingUI(playing) {
      btn.classList.toggle("playing", playing);
      btn.classList.toggle("muted", !playing);
      icon.textContent = playing ? "♪" : "♪̸";
      btn.setAttribute("aria-label", playing ? "배경음악 끄기" : "배경음악 켜기");
    }

    function tryPlay() {
      return audio.play().then(
        () => setPlayingUI(true),
        () => setPlayingUI(false)
      );
    }

    tryPlay();

    function autoStartOnce() {
      if (audio.paused) tryPlay();
      window.removeEventListener("pointerdown", autoStartOnce);
      window.removeEventListener("touchstart", autoStartOnce);
      window.removeEventListener("keydown", autoStartOnce);
    }
    window.addEventListener("pointerdown", autoStartOnce, { once: true });
    window.addEventListener("touchstart", autoStartOnce, { once: true });
    window.addEventListener("keydown", autoStartOnce, { once: true });

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (audio.paused) tryPlay();
      else { audio.pause(); setPlayingUI(false); }
    });

    setPlayingUI(false);
  }
})();
