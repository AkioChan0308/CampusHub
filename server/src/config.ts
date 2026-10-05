// Cấu hình đọc từ biến môi trường (xem .env.example).

export interface Config {
  port: number;
  authMode: "demo" | "google";
  qrSecret: string;
  webOrigin: string;
  /** Khóa đăng nhập Google. Trống thì nút Google trên trang đăng nhập bị ẩn. */
  googleClientId: string;
  googleClientSecret: string;
  /** Ghép email Google thật với người trong dữ liệu mẫu, để thử từng vai: email viết thường → mã người. */
  loginAs: Record<string, string>;
  /** Cookie chỉ gửi qua HTTPS: bật khi web chạy bằng https. */
  cookieSecure: boolean;
  /** Địa chỉ PostgreSQL (docs/postgresql.md). Trống thì dữ liệu chỉ nằm trong bộ nhớ, tắt máy chủ là mất. */
  databaseUrl: string;
}

const DEMO_QR_SECRET = "chi-dung-cho-ban-demo";

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const authMode = (env.AUTH_MODE ?? "demo") === "demo" ? "demo" : "google";
  const qrSecret = env.QR_SECRET || (authMode === "demo" ? DEMO_QR_SECRET : "");
  if (!qrSecret) throw new Error("Thiếu QR_SECRET. Bản thật phải đặt khóa bí mật để ký mã QR điểm danh.");
  const webOrigin = env.WEB_ORIGIN ?? "http://localhost:3000";
  return {
    port: Number(env.PORT ?? 4000),
    authMode,
    qrSecret,
    webOrigin,
    googleClientId: env.GOOGLE_CLIENT_ID ?? "",
    googleClientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
    loginAs: parseLoginAs(env.LOGIN_AS ?? ""),
    cookieSecure: webOrigin.startsWith("https://"),
    databaseUrl: env.DATABASE_URL ?? "",
  };
}

/** "ban@example.com=a001, khoa@example.com=a002" → { "ban@example.com": "a001", ... } */
function parseLoginAs(text: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const pair of text.split(",")) {
    const [email, personId] = pair.split("=").map((x) => x.trim());
    if (email && personId) map[email.toLowerCase()] = personId;
  }
  return map;
}
