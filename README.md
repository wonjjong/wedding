# 모바일 청첩장 — 원종민 ♡ 최수연

GitHub Pages로 호스팅하는 정적 모바일 청첩장. 댓글(방명록)은 Google Apps Script + 스프레드시트를 백엔드로 사용하며, 데이터는 시트 자체가 곧 백업본.

```
wedding/
├── index.html              ← 메인 (단일 파일)
├── images/
│   ├── main.webp           ← 메인(히어로) 이미지
│   └── gallery/01..14.webp ← 갤러리 사진 14장
├── apps-script/
│   └── Code.gs             ← 방명록 백엔드 (Apps Script에 붙여넣기)
└── README.md
```

---

## 1. 로컬에서 확인

```bash
cd ~/wedding
python3 -m http.server 8080
# 브라우저: http://localhost:8080
```

> `file://` 로 직접 열어도 화면은 나오지만 fetch 호출이 막힐 수 있어 권장하지 않음.

---

## 2. GitHub Pages 배포 (가장 간단, 무료)

```bash
cd ~/wedding
git init
git add .
git commit -m "wedding invitation"

# GitHub CLI 사용 시:
gh repo create wedding --public --source=. --push

# 또는 GitHub 웹에서 빈 레포 생성 후:
# git remote add origin git@github.com:<user>/wedding.git
# git push -u origin main
```

레포 페이지 → **Settings → Pages → Source: Deploy from branch → `main` / `/ (root)`** 저장.
1–2분 후 `https://<user>.github.io/wedding/` 로 접속 가능.

### 커스텀 도메인 (선택)
1. 도메인 구매 (가비아, Cloudflare Registrar 등 — 후자는 마진 없음)
2. DNS에 CNAME 추가:
   ```
   www  CNAME  <user>.github.io
   ```
3. 레포의 Settings → Pages → Custom domain 입력 후 "Enforce HTTPS" 체크.

---

## 3. 이미지 최적화

이미 적용되어 있음. 추가 사진을 더 넣고 싶다면:

```bash
brew install webp
# 갤러리 추가용: 짧은 변 1200px, 품질 82
cwebp -q 82 -resize 0 1200 새사진.jpg -o images/gallery/15.webp
# 메인 교체용: 짧은 변 1600px, 품질 85
cwebp -q 85 -resize 0 1600 새메인.jpg -o images/main.webp
```

`index.html` 갤러리 섹션에 `<div class="cell"><img src="images/gallery/15.webp" ...></div>` 한 줄 추가.

### 캐싱
- GitHub Pages는 자동으로 `Cache-Control: max-age=600` 적용.
- 더 강한 캐시가 필요하면 Cloudflare Pages로 옮긴 뒤 `_headers`에:
  ```
  /images/*
    Cache-Control: public, max-age=31536000, immutable
  ```
- 이미지 갱신 시엔 파일명에 버전 suffix를 붙여서 캐시 무효화 (예: `01-v2.webp`).

---

## 4. 방명록 백엔드 셋업 (5분)

### 4-1. 스프레드시트 만들기
1. https://sheets.google.com → 새 시트
2. 시트 이름은 그대로 `시트1` (또는 변경 시 `Code.gs`의 `SHEET_NAME` 수정)
3. **첫 행에 헤더 입력**:
   | A: id | B: ts | C: name | D: message | E: pwhash |
4. 시트 URL에서 ID 추출:
   `https://docs.google.com/spreadsheets/d/[여기가_SHEET_ID]/edit`

### 4-2. Apps Script 배포
1. 시트에서 **확장 프로그램 → Apps Script** 클릭
2. 기본 코드 지우고 `apps-script/Code.gs` 내용 통째로 붙여넣기
3. 상단의 `SHEET_ID = 'YOUR_SHEET_ID_HERE'` 를 위에서 추출한 ID로 교체
4. 우측 상단 **배포 → 새 배포** 클릭
   - 유형: **웹 앱**
   - 설명: `wedding-guestbook-v1` (자유)
   - 다음 사용자 인증으로 실행: **나**
   - 액세스 권한: **모든 사용자**
5. **배포** 클릭 → 권한 승인 → 발급된 **웹 앱 URL** 복사
   (`https://script.google.com/macros/s/AKfy.../exec`)

### 4-3. index.html에 URL 연결
`index.html` 상단의 방명록 섹션에서:

```javascript
const GAS_URL = ''; // ← 여기에 웹 앱 URL 붙여넣기
const ADMIN_KEY = 'wonjong-soyeon-1009'; // 백업용 비밀번호 (원하는 값으로 변경)
```

URL을 채워넣고 다시 push하면 자동 배포됨. URL이 비어있으면 자동으로 localStorage 폴백(로컬 데모 모드).

### 4-4. 동작 확인
1. 페이지에서 댓글 작성 → 시트에 새 행이 추가되는지 확인
2. 삭제 시 비밀번호 검증 후 시트의 해당 행이 사라지는지 확인

---

## 5. 데이터 백업

### 방법 A: 스프레드시트가 곧 백업본
- 시트 → **파일 → 다운로드 → CSV / Excel / PDF**
- Google Drive에 시트 자체가 영구 저장됨 → 추가 작업 필요 없음

### 방법 B: 웹에서 JSON으로 일괄 다운로드
1. 배포된 청첩장 URL 끝에 `#admin` 붙여서 접속
   예) `https://<user>.github.io/wedding/#admin`
2. 우측 하단에 **백업 다운로드** 버튼이 노출됨
3. 클릭 → 관리자 키 입력 (기본값: `wonjong-soyeon-1009`)
4. `guestbook-YYYY-MM-DD.json` 파일 다운로드

또는 브라우저 콘솔에서 `backup()` 호출 — 동일 동작.

---

## 6. 지도 길찾기 URL 메모

좌표가 확보되면 `index.html` 의 네이버/티맵 버튼을 도착지 자동 입력 URL로 강화 가능.

| 서비스 | URL (좌표 필요) |
|---|---|
| 네이버 (앱) | `nmap://route/car?dlat={lat}&dlng={lng}&dname=루이비스컨벤션 강서점&appname=wedding` |
| 네이버 (웹) | `https://map.naver.com/p/directions/-/{lng,lat,name}` |
| 카카오 | `https://map.kakao.com/link/to/루이비스컨벤션 강서점,{lat},{lng}` |
| 티맵 | `tmap://route?goalname=루이비스컨벤션 강서점&goalx={lng}&goaly={lat}` |

현재 카카오맵은 좌표 없이도 `eName` 파라미터로 도착지 자동 입력 동작.

---

## 7. 지도 (Leaflet + OpenStreetMap)

오시는 길 섹션의 인터랙티브 지도. **API 키 불필요, 완전 무료**.

### 좌표 수정
`index.html` 의 `initLeafletMap` 함수에서:
```javascript
const LAT = 37.5697;
const LNG = 126.8623;
```
정확한 좌표를 알면 위 값만 교체. 좌표 찾는 법:
1. https://www.openstreetmap.org 접속
2. 주소 검색 → 우클릭 → "이 위치 표시"
3. URL의 `?mlat=...&mlon=...` 부분 사용

### 한국 디테일이 부족하다면
OSM은 글로벌 지도라 한국 건물명/상호가 카카오/네이버보다 적게 표시됨. 더 디테일한 지도를 원하면:
- 카카오맵 SDK 사용 (https://developers.kakao.com 에서 키 발급, 무료)
- 또는 네이버 지도 캡쳐 이미지를 `images/map.png`로 저장 후 정적 이미지로 교체

---

## 8. 링크 공유 시 썸네일 (Open Graph)

카카오톡/페이스북/슬랙/iMessage 등에 URL 붙여넣으면 자동으로 썸네일이 뜨도록 OG 메타태그가 이미 설정돼 있음.

### 배포 후 한 번만 해야 할 일

`index.html` 상단의 OG 태그에서 `SITE_URL` 자리표시자를 **실제 배포 도메인으로 교체**.

```html
<meta property="og:image" content="https://SITE_URL/images/og-image.jpg">
<meta property="og:url"   content="https://SITE_URL/">
<meta name="twitter:image" content="https://SITE_URL/images/og-image.jpg">
```

예) GitHub Pages면 `wonjjong.github.io/wedding` 식으로:

```html
<meta property="og:image" content="https://wonjjong.github.io/wedding/images/og-image.jpg">
```

> OG의 `og:image`는 **절대 URL이어야** 작동함. 상대경로(`images/...`)는 미리보기 봇이 인식 못 함.

### 썸네일 이미지
- `images/og-image.jpg` (1200×1200 정사각형 JPG)
- 카카오톡은 정사각형 크롭이라 이게 가장 안전
- 다른 사진으로 교체하려면 같은 이름·해상도로 덮어쓰기

### 카카오톡 캐시 갱신
카카오톡은 한 번 미리보기를 캐싱하면 새 썸네일이 안 뜸. 강제 갱신:

1. https://developers.kakao.com/tool/debugger/sharing 접속
2. URL 입력 → "디버그" → "캐시 초기화"
3. 5분 후 카카오톡에서 다시 공유하면 새 썸네일 적용

### 미리 확인
배포 전에 미리보기 확인하려면:
- 페이스북 디버거: https://developers.facebook.com/tools/debug/
- 트위터 카드 검증기: https://cards-dev.twitter.com/validator
- 메타태그 종합 확인: https://www.opengraph.xyz/

---

## 9. 보안/개인정보 메모

- 비밀번호는 클라이언트에서 **SHA-256 해시 처리 후 전송**. 시트에는 해시만 저장.
- Apps Script Web App은 익명 접근 허용 상태 — 누구나 댓글 작성 가능. 스팸이 우려되면:
  - 작성 빈도 제한 (Apps Script 내에서 `LockService` 사용)
  - reCAPTCHA v3 추가 (한 번 설정해야 하므로 별도 작업)
- 청첩장 URL을 공개하지 않으면 사실상 충분.

---

## 10. 자주 수정하는 부분

| 항목 | 위치 (index.html) |
|---|---|
| 신랑신부 이름 | hero 섹션의 `.names`, 푸터 |
| 날짜/시간 | hero, 캘린더, 카운트다운 `target` |
| 식장명/주소 | hero `.venue`, location 섹션 `.place`, `.addr` |
| 혼주 정보 | greeting 섹션 `.parents` |
| 계좌번호 | account 섹션 (`onclick="copy('...')"` 와 표시 텍스트 둘 다) |
| 갤러리 사진 | `images/gallery/*.webp` 교체 |
| 메인 사진 | `images/main.webp` 교체 |
