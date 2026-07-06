/**
 * 결혼식 방명록 백엔드 (Google Apps Script Web App)
 *
 * 사용법:
 * 1. 구글 스프레드시트를 새로 만든다 (sheets.new)
 * 2. 확장 프로그램 → Apps Script 를 열고 이 파일 내용을 통째로 붙여넣는다
 * 3. 배포 → 새 배포 → 유형: 웹 앱
 *    - 실행 계정: 나
 *    - 액세스 권한: 모든 사용자
 * 4. 발급된 웹 앱 URL(…/exec)을 script.js 의 GAS_URL 에 넣는다
 *
 * 클라이언트(script.js remoteStore)와의 프로토콜:
 *   GET  ?action=list                                → [{id, ts, name, message, pwhash}, …]
 *   POST {action:"add", id, ts, name, message, pwhash} → {ok:true}
 *   POST {action:"remove", id, pwhash}                 → {ok:true|false}
 */

const SHEET_NAME = "guestbook";

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["id", "ts", "name", "message", "pwhash"]);
  }
  return sheet;
}

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : "";
  if (action === "list") return json_(listMessages_());
  return json_({ ok: true, hint: "?action=list 로 목록을 조회하세요" });
}

function doPost(e) {
  let body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: "invalid json" });
  }
  if (body.action === "add") return json_(addMessage_(body));
  if (body.action === "remove") return json_(removeMessage_(body));
  return json_({ ok: false, error: "unknown action" });
}

function listMessages_() {
  const rows = getSheet_().getDataRange().getValues();
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const [id, ts, name, message, pwhash] = rows[i];
    if (!id) continue;
    out.push({
      id: String(id),
      ts: Number(ts),
      name: String(name),
      message: String(message),
      pwhash: String(pwhash || ""),
    });
  }
  return out;
}

function addMessage_(body) {
  const name = String(body.name || "").trim().slice(0, 30);
  const message = String(body.message || "").trim().slice(0, 500);
  if (!name || !message) return { ok: false, error: "missing fields" };

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    getSheet_().appendRow([
      String(body.id || Utilities.getUuid()),
      Number(body.ts || Date.now()),
      name,
      message,
      String(body.pwhash || ""),
    ]);
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

function removeMessage_(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const sheet = getSheet_();
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) !== String(body.id)) continue;
      const stored = String(rows[i][4] || "");
      if (stored && stored !== String(body.pwhash || "")) {
        return { ok: false, error: "wrong password" };
      }
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
    return { ok: false, error: "not found" };
  } finally {
    lock.releaseLock();
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
