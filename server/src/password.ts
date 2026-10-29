// Băm mật khẩu bằng scrypt (có sẵn trong Node), mỗi mật khẩu một salt ngẫu nhiên 16 byte.
// Tham số theo khuyến nghị của OWASP cho scrypt: N = 2^17, r = 8, p = 1. Tham số và salt nằm ngay trong chuỗi băm,
// nên sau này tăng N vẫn kiểm tra được mật khẩu băm theo tham số cũ.
// Dạng lưu: scrypt$<N>$<r>$<p>$<salt base64url>$<mã băm base64url>. Không lưu, không ghi log mật khẩu gốc.

import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

const N = 2 ** 17;
const R = 8;
const P = 1;
const KEY_BYTES = 64;

function derive(password: string, salt: Buffer, opts: { N: number; r: number; p: number }): Promise<Buffer> {
  const options: ScryptOptions = { N: opts.N, r: opts.r, p: opts.p, maxmem: 256 * opts.N * opts.r };
  return new Promise((resolve, reject) => scrypt(password.normalize("NFC"), salt, KEY_BYTES, options, (err, key) => (err ? reject(err) : resolve(key))));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64url"), key.toString("base64url")].join("$");
}

/** Đúng mật khẩu thì true. Chuỗi băm sai dạng thì false (không ném lỗi). So bằng timingSafeEqual để không lộ qua thời gian so. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [kind, n, r, p, salt, key] = stored.split("$");
  if (kind !== "scrypt" || !salt || !key) return false;
  const expected = Buffer.from(key, "base64url");
  const actual = await derive(password, Buffer.from(salt, "base64url"), { N: Number(n), r: Number(r), p: Number(p) });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Mã băm của một mật khẩu không ai biết: khi không có tài khoản vẫn băm thử một lần, để thời gian trả lời không lộ tài khoản nào có thật. */
let dummy: Promise<string> | undefined;
export const dummyHash = () => (dummy ??= hashPassword(randomBytes(24).toString("base64url")));
