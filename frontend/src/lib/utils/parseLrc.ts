// Parse lyrics từ DB — dạng HTML có [mm:ss.xx] timestamp và &agrave; entities và <br>

export interface LrcLine {
  time: number; // giây
  text: string; // lời đã decode HTML entities
}

// Decode HTML entities (chạy trên cả server lẫn client)
function decodeHtml(html: string): string {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&agrave;/g, "à").replace(/&aacute;/g, "á").replace(/&acirc;/g, "â").replace(/&atilde;/g, "ã")
    .replace(/&egrave;/g, "è").replace(/&eacute;/g, "é").replace(/&ecirc;/g, "ê")
    .replace(/&igrave;/g, "ì").replace(/&iacute;/g, "í")
    .replace(/&ograve;/g, "ò").replace(/&oacute;/g, "ó").replace(/&ocirc;/g, "ô").replace(/&otilde;/g, "õ")
    .replace(/&ugrave;/g, "ù").replace(/&uacute;/g, "ú").replace(/&ucirc;/g, "û")
    .replace(/&yacute;/g, "ý")
    .replace(/&nbsp;/g, " ")
    // Ký tự tiếng Việt có dấu thêm
    .replace(/&Agrave;/g, "À").replace(/&Aacute;/g, "Á").replace(/&Acirc;/g, "Â")
    .replace(/&Egrave;/g, "È").replace(/&Eacute;/g, "É").replace(/&Ecirc;/g, "Ê")
    .replace(/&Ograve;/g, "Ò").replace(/&Oacute;/g, "Ó").replace(/&Ocirc;/g, "Ô")
    .replace(/&Ugrave;/g, "Ù").replace(/&Uacute;/g, "Ú")
    .replace(/&Yacute;/g, "Ý")
    // Xoá tag HTML còn sót
    .replace(/<[^>]+>/g, "")
    .trim();
}

// Parse timestamp [mm:ss.xx] → giây
function parseTime(mm: string, ss: string): number {
  return parseInt(mm, 10) * 60 + parseFloat(ss);
}

export function parseLrc(raw: string): LrcLine[] {
  if (!raw) return [];

  // DB lưu dạng <p>[00:12.5] text<br>[00:15.0] text...</p>
  // Bước 1: strip tag <p> ngoài cùng nếu có
  const stripped = raw.replace(/^<p>|<\/p>$/gi, "").trim();

  // Bước 2: split theo <br>
  const parts = stripped.split(/<br\s*\/?>/i);

  const lines: LrcLine[] = [];
  const timeRegex = /^\[(\d{2}):(\d{2}(?:\.\d+)?)\]\s*(.*)$/;

  for (const part of parts) {
    const decoded = decodeHtml(part.trim());
    const match = decoded.match(timeRegex);
    if (!match) continue;
    const [, mm, ss, text] = match;
    lines.push({
      time: parseTime(mm, ss),
      text: text.trim(),
    });
  }

  return lines;
}

// Tìm index dòng đang phát dựa vào currentTime
export function getActiveIndex(lines: LrcLine[], currentTime: number): number {
  let idx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (currentTime >= lines[i].time) idx = i;
    else break;
  }
  return idx;
}
