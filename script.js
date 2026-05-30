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

document.querySelectorAll(".gallery-photo").forEach((button) => {
  button.addEventListener("click", () => {
    modalImage.src = button.dataset.image;
    imageModal.classList.add("open");
    imageModal.setAttribute("aria-hidden", "false");
  });
});

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

  audio.volume = 0.5;

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
})();
