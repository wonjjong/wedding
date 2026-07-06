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
let modalImage = document.getElementById("modalImage");
const modalClose = document.getElementById("modalClose");

const GALLERY_PHOTOS = Array.from({ length: 31 }, (_, i) => i + ".webp");

// 그리드 = 가벼운 썸네일, 확대(라이트박스) = 고해상도 풀 이미지
const THUMB_DIR = "./images/wedding-thumb/";
const FULL_DIR = "./images/wedding-full/";

let lbIndex = 0;
const modalCounter = document.getElementById("modalCounter");
const modalPrev = document.getElementById("modalPrev");
const modalNext = document.getElementById("modalNext");

function srcAt(i) {
  return FULL_DIR + encodeURI(GALLERY_PHOTOS[i]);
}

const _imgCache = {};
function preload(src) {
  if (_imgCache[src]) return _imgCache[src];
  const img = new Image();
  img.src = src;
  _imgCache[src] = img;
  return img;
}

async function setModalImage(i) {
  lbIndex = (i + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length;
  const nextSrc = srcAt(lbIndex);
  const myToken = ++setModalImage._token;

  preload(nextSrc);

  modalImage.classList.add("swapping");

  // Wait for the fade-out to finish (CSS 0.16s) before swapping src.
  await new Promise((r) => setTimeout(r, 180));
  if (myToken !== setModalImage._token) return;

  // Replace the <img> element entirely — avoids iOS Safari's stale
  // composite layer from the previous src.
  const fresh = modalImage.cloneNode(false);
  fresh.removeAttribute("src");
  fresh.classList.add("swapping");
  modalImage.replaceWith(fresh);
  modalImage = fresh;

  modalImage.src = nextSrc;
  if (modalCounter) {
    modalCounter.textContent =
      String(lbIndex + 1).padStart(2, "0") + " / " +
      String(GALLERY_PHOTOS.length).padStart(2, "0");
  }

  try { await modalImage.decode(); } catch {}
  if (myToken !== setModalImage._token) return;

  requestAnimationFrame(() => {
    if (myToken === setModalImage._token) modalImage.classList.remove("swapping");
  });
}
setModalImage._token = 0;

function openModalAt(i) {
  lbIndex = i;
  imageModal.classList.remove("single");
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

const mapSketchBtn = document.getElementById("mapSketchBtn");
if (mapSketchBtn) {
  mapSketchBtn.addEventListener("click", () => {
    imageModal.classList.add("single");
    modalImage.src = "./images/map.jpg";
    imageModal.classList.add("open");
    imageModal.setAttribute("aria-hidden", "false");
  });
}

document.addEventListener("keydown", (event) => {
  if (!imageModal.classList.contains("open")) return;
  if (event.key === "ArrowLeft")  navModal(-1);
  if (event.key === "ArrowRight") navModal(1);
});

let touchStartX = 0, touchStartY = 0, touchTracking = false;
function isZoomed() {
  // 핀치로 페이지가 확대된 상태(visualViewport.scale > 1)에서는
  // 한 손가락 드래그가 스와이프가 아니라 패닝이므로 네비게이션을 막는다.
  return !!(window.visualViewport && window.visualViewport.scale > 1.01);
}
imageModal.addEventListener("touchstart", (e) => {
  // 두 손가락 이상(핀치 줌)은 스와이프가 아니므로 추적하지 않는다.
  if (e.touches.length > 1) { touchTracking = false; return; }
  const t = e.changedTouches[0];
  touchStartX = t.clientX; touchStartY = t.clientY;
  touchTracking = true;
}, { passive: true });
imageModal.addEventListener("touchend", (e) => {
  // Ignore touchend whose touchstart didn't begin on the modal
  // (e.g. the tap that opened the lightbox lifts over the modal).
  if (!touchTracking) return;
  touchTracking = false;
  // 아직 다른 손가락이 남아있거나(핀치 중 한 손가락만 뗌), 줌인 상태면 무시.
  if (e.touches.length > 0 || isZoomed()) return;
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

  const INITIAL = 12;

  function makeItem(name, i) {
    const src = THUMB_DIR + encodeURI(name);
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
  imageModal.classList.remove("single");
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

// ============================================================
// 연락하기: 웹은 중앙 모달, 모바일은 바텀시트(CSS 미디어쿼리로 분기)
// ============================================================
const contactModal = document.getElementById("contactModal");
const contactOpen = document.getElementById("contactOpen");
const contactClose = document.getElementById("contactClose");
const contactBackdrop = document.getElementById("contactBackdrop");

function openContact() {
  contactModal.classList.add("open");
  contactModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeContact() {
  contactModal.classList.remove("open");
  contactModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

if (contactOpen) contactOpen.addEventListener("click", openContact);
if (contactClose) contactClose.addEventListener("click", closeContact);
if (contactBackdrop) contactBackdrop.addEventListener("click", closeContact);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && contactModal.classList.contains("open")) closeContact();
});

// ============================================================
// 방명록: Google Apps Script Web App URL 을 GAS_URL 에 채워넣으면
// 원격(스프레드시트) 저장으로 자동 전환. 비어 있으면 localStorage 폴백.
// ============================================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbxVoN7jocEckl1bGG4uZ2ZjMrme_er9SQ5LHDQnoHXz0XKZdUQDxXSPZOfdq8U_o5KoRA/exec";

const guestbookForm = document.getElementById("guestbookForm");
const guestbookList = document.getElementById("guestbookList");

const localStore = {
  key: "weddingGuestbookMessages",
  async list() {
    try { return JSON.parse(localStorage.getItem(this.key) || "[]"); }
    catch { return []; }
  },
  async add(item) {
    const arr = await this.list();
    arr.push(item);
    localStorage.setItem(this.key, JSON.stringify(arr));
  },
  async remove(id) {
    const arr = (await this.list()).filter((m) => String(m.id) !== String(id));
    localStorage.setItem(this.key, JSON.stringify(arr));
  },
};

const remoteStore = {
  async list() {
    const r = await fetch(GAS_URL + "?action=list", { cache: "no-store" });
    return await r.json();
  },
  async add(item) {
    await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "add", ...item }),
    });
  },
  async remove(id, pwhash) {
    await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "remove", id, pwhash }),
    });
  },
};

const guestStore = GAS_URL ? remoteStore : localStore;

async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function formatGbDate(ts) {
  const d = new Date(Number(ts));
  return (
    d.getFullYear() + "." +
    String(d.getMonth() + 1).padStart(2, "0") + "." +
    String(d.getDate()).padStart(2, "0") + " " +
    String(d.getHours()).padStart(2, "0") + ":" +
    String(d.getMinutes()).padStart(2, "0")
  );
}

async function renderMessages() {
  guestbookList.innerHTML = '<div class="guestbook-message"><p>불러오는 중…</p></div>';
  let messages;
  try {
    messages = await guestStore.list();
  } catch {
    guestbookList.innerHTML = '<div class="guestbook-message"><p>방명록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p></div>';
    return;
  }
  guestbookList.innerHTML = "";

  if (!messages.length) {
    guestbookList.innerHTML = '<div class="guestbook-message"><strong>축하 메시지</strong><p>첫 번째 축하 메시지를 남겨보세요.</p></div>';
    return;
  }

  messages
    .slice()
    .sort((a, b) => Number(b.ts || 0) - Number(a.ts || 0))
    .forEach((m) => {
      const item = document.createElement("div");
      item.className = "guestbook-message";
      item.dataset.id = m.id || "";

      const top = document.createElement("div");
      top.className = "gb-top";

      const name = document.createElement("strong");
      name.textContent = m.name || "";

      const meta = document.createElement("div");
      meta.className = "gb-meta";

      const dt = document.createElement("span");
      dt.className = "gb-date";
      dt.textContent = m.ts ? formatGbDate(m.ts) : "";

      const del = document.createElement("button");
      del.type = "button";
      del.className = "gb-del";
      del.setAttribute("aria-label", "삭제");
      del.textContent = "×";
      del.addEventListener("click", () => deleteMessage(m));

      meta.appendChild(dt);
      meta.appendChild(del);

      top.appendChild(name);
      top.appendChild(meta);

      const text = document.createElement("p");
      text.textContent = m.message || m.text || "";

      item.appendChild(top);
      item.appendChild(text);
      guestbookList.appendChild(item);
    });
}

async function deleteMessage(m) {
  if (!m || !m.id) return;
  let pwhash = "";
  if (m.pwhash) {
    const pw = prompt("비밀번호를 입력하세요");
    if (pw === null) return;
    pwhash = await sha256(pw);
    if (pwhash !== m.pwhash) {
      showToast("비밀번호가 일치하지 않습니다.");
      return;
    }
  } else if (!confirm("이 메시지를 삭제할까요?")) {
    return;
  }
  try {
    await guestStore.remove(m.id, pwhash);
    await renderMessages();
    showToast("삭제되었습니다.");
  } catch {
    showToast("삭제에 실패했습니다.");
  }
}

guestbookForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const nameInput = document.getElementById("guestName");
  const pwInput = document.getElementById("guestPw");
  const messageInput = document.getElementById("guestMessage");
  const submitBtn = event.target.querySelector('button[type="submit"]');

  const name = nameInput.value.trim();
  const message = messageInput.value.trim();
  const pw = pwInput ? pwInput.value : "";

  if (!name || !message || !pw) {
    showToast("이름, 비밀번호, 메시지를 모두 입력해주세요.");
    return;
  }

  submitBtn.disabled = true;
  const orig = submitBtn.textContent;
  submitBtn.textContent = "등록중…";

  const item = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    ts: Date.now(),
    name,
    message,
    pwhash: pw ? await sha256(pw) : "",
  };

  try {
    await guestStore.add(item);
    nameInput.value = "";
    if (pwInput) pwInput.value = "";
    messageInput.value = "";
    await renderMessages();
    showToast("메시지가 저장되었습니다.");
  } catch {
    showToast("저장에 실패했어요. 잠시 후 다시 시도해주세요.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = orig;
  }
});

renderMessages();

(function showBgmNotice() {
  const el = document.getElementById("bgmNotice");
  if (!el) return;
  setTimeout(() => el.classList.add("visible"), 600);
  setTimeout(() => {
    el.classList.remove("visible");
    el.classList.add("dismissed");
  }, 3600);
  setTimeout(() => el.remove(), 4400);
})();

const VENUE = {
  name: "루이비스컨벤션 강서점",
  address: "서울 강서구 양천로 476",
  lat: 37.5611,
  lng: 126.8546,
};

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
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

window.openTmap = openTmap;

(function initNaverMap() {
  if (typeof naver === "undefined" || !naver.maps) return;
  const el = document.getElementById("map");
  if (!el) return;

  const fallback = new naver.maps.LatLng(VENUE.lat, VENUE.lng);
  const map = new naver.maps.Map(el, {
    center: fallback,
    zoom: 17,
    scrollWheel: true,
    pinchZoom: true,
    disableDoubleTapZoom: false,
    zoomControl: true,
    zoomControlOptions: {
      style: naver.maps.ZoomControlStyle.SMALL,
      position: naver.maps.Position.TOP_RIGHT,
    },
  });

  const marker = new naver.maps.Marker({ position: fallback, map });
  const info = new naver.maps.InfoWindow({
    content: `<div style="padding:6px 10px;font-size:12px;font-weight:600;color:#332923;">${VENUE.name}</div>`,
    borderWidth: 0,
    backgroundColor: "#fff",
    disableAnchor: false,
    pixelOffset: new naver.maps.Point(0, -4),
  });
  info.open(map, marker);

  if (naver.maps.Service && naver.maps.Service.geocode) {
    naver.maps.Service.geocode({ query: VENUE.address }, (status, response) => {
      if (status !== naver.maps.Service.Status.OK) return;
      const items = response && response.v2 && response.v2.addresses;
      if (!items || !items.length) return;
      const it = items[0];
      const ll = new naver.maps.LatLng(parseFloat(it.y), parseFloat(it.x));
      map.setCenter(ll);
      marker.setPosition(ll);
      info.open(map, marker);
    });
  }
})();

(function initBgm() {
  const audio = document.getElementById("bgm");
  const btn = document.getElementById("bgmToggle");
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
      btn.setAttribute("aria-label", playing ? "배경음악 끄기" : "배경음악 켜기");
    }

    function tryPlay() {
      return audio.play().then(
        () => setPlayingUI(true),
        () => setPlayingUI(false)
      );
    }

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (audio.paused) tryPlay();
      else { audio.pause(); setPlayingUI(false); }
    });

    setPlayingUI(false);
  }
})();
