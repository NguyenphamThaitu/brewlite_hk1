import * as path from 'path';
import * as fs from 'fs';

// 1. Tải cấu hình từ .env.test nếu tồn tại
const envTestPath = path.resolve(__dirname, '../.env.test');
if (fs.existsSync(envTestPath)) {
  const content = fs.readFileSync(envTestPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  }
}

// 2. Yêu cầu bắt buộc cấu hình TEST_DATABASE_URL riêng biệt
const testDbUrl = process.env.TEST_DATABASE_URL;
if (!testDbUrl) {
  throw new Error(
    `[BẢO VỆ DỮ LIỆU BẮT BUỘC] Không tìm thấy biến môi trường TEST_DATABASE_URL! ` +
      `Kiểm thử tích hợp / E2E yêu cầu bắt buộc phải cấu hình CSDL kiểm thử riêng biệt (Ví dụ trong .env.test: ` +
      `TEST_DATABASE_URL=postgresql://brew:brew@localhost:5432/brewlite_test). ` +
      `Hệ thống từ chối fallback về CSDL ứng dụng thông thường (brewlite) để bảo vệ toàn vẹn dữ liệu vận hành.`,
  );
}

const devDbUrl =
  process.env.DEV_DATABASE_URL ||
  'postgresql://brew:brew@localhost:5432/brewlite';

function normalizeDbName(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\//, '').toLowerCase();
  } catch {
    const parts = url.split('/');
    return (parts[parts.length - 1] || '').split('?')[0].toLowerCase();
  }
}

const targetDb = normalizeDbName(testDbUrl);
const devDb = normalizeDbName(devDbUrl);

// 3. Từ chối thực thi nếu trỏ vào CSDL development/production hoặc không có hậu tố _test
if (targetDb === devDb || targetDb === 'brewlite' || !targetDb.endsWith('_test')) {
  throw new Error(
    `[BẢO VỆ DỮ LIỆU BẮT BUỘC] Từ chối thực thi kiểm thử trên CSDL "${targetDb}"! ` +
      `Kiểm thử E2E/Integration bắt buộc phải chạy trên CSDL kiểm thử riêng biệt kết thúc bằng "_test" ` +
      `(Ví dụ: TEST_DATABASE_URL=postgresql://brew:brew@localhost:5432/brewlite_test) ` +
      `và tuyệt đối không được trùng với CSDL phát triển ("${devDb}").`,
  );
}

// 4. Thiết lập biến môi trường an toàn cho toàn bộ tiến trình kiểm thử
process.env.DATABASE_URL = testDbUrl;
process.env.NODE_ENV = 'test';
