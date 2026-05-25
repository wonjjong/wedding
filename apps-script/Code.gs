/**
 * 모바일 청첩장 방명록 백엔드 (Google Apps Script)
 *
 * 사용법
 *  1. Google 스프레드시트 생성
 *  2. 첫 행에 헤더 입력: id | ts | name | message | pwhash
 *  3. 시트 URL에서 SHEET_ID 추출 후 아래 상수에 붙여넣기
 *     예) https://docs.google.com/spreadsheets/d/[여기가_SHEET_ID]/edit
 *  4. 메뉴: 확장 프로그램 → Apps Script → 본 파일 내용 붙여넣기
 *  5. 배포 → 새 배포 → 유형: 웹 앱
 *     - 실행 권한: 나
 *     - 액세스: 모든 사용자
 *  6. 발급된 웹 앱 URL을 index.html 의 GAS_URL 에 붙여넣기
 */
const SHEET_ID = 'YOUR_SHEET_ID_HERE';
const SHEET_NAME = '시트1'; // 시트 탭 이름

function getSheet_() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
}

function readAll_() {
  const sh = getSheet_();
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const [head, ...rows] = values;
  return rows.map(r => {
    const o = {};
    head.forEach((h, i) => o[h] = r[i]);
    return o;
  });
}

function doGet(e) {
  try {
    const action = (e.parameter && e.parameter.action) || 'list';
    if (action === 'list') {
      return json_(readAll_());
    }
    return json_({ error: 'unknown action' });
  } catch (err) {
    return json_({ error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const sh = getSheet_();
    if (body.action === 'add') {
      sh.appendRow([
        body.id || '',
        body.ts || Date.now(),
        sanitize_(body.name),
        sanitize_(body.message),
        body.pwhash || ''
      ]);
      return json_({ ok: true });
    }
    if (body.action === 'remove') {
      const all = readAll_();
      const idx = all.findIndex(r => String(r.id) === String(body.id));
      if (idx < 0) return json_({ ok: false, reason: 'not_found' });
      // 비밀번호 검증
      if (all[idx].pwhash && all[idx].pwhash !== body.pwhash) {
        return json_({ ok: false, reason: 'pw_mismatch' });
      }
      // 헤더가 1행이므로 데이터는 2행부터 → idx+2
      sh.deleteRow(idx + 2);
      return json_({ ok: true });
    }
    return json_({ error: 'unknown action' });
  } catch (err) {
    return json_({ error: String(err) });
  }
}

function sanitize_(s) {
  if (s == null) return '';
  return String(s).slice(0, 1000); // 1KB 제한
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
