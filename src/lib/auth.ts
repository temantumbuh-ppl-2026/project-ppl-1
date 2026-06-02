import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
// If your Prisma file is located elsewhere, you can change the path

import { sendEmail } from "./email";
import { requestParentConsentEmail } from "./parent-consent";
import prisma from "./prisma";
import { openAPI } from "better-auth/plugins";

function normalizeOrigin(value?: string | null) {
  if (!value) {
    return null;
  }

  const withProtocol = value.startsWith("http") ? value : `https://${value}`;

  try {
    const url = new URL(withProtocol);
    return url.origin;
  } catch {
    return null;
  }
}

function isLocalOrigin(origin?: string | null) {
  if (!origin) {
    return false;
  }

  try {
    const hostname = new URL(origin).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function getAppOrigin() {
  const configuredAuthUrl = normalizeOrigin(process.env.BETTER_AUTH_URL);
  const configuredAppUrl = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  const vercelProductionUrl = normalizeOrigin(
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  );
  const vercelDeploymentUrl = normalizeOrigin(process.env.VERCEL_URL);

  if (process.env.VERCEL) {
    return (
      (configuredAppUrl && !isLocalOrigin(configuredAppUrl)
        ? configuredAppUrl
        : null) ||
      (configuredAuthUrl && !isLocalOrigin(configuredAuthUrl)
        ? configuredAuthUrl
        : null) ||
      vercelProductionUrl ||
      vercelDeploymentUrl ||
      configuredAppUrl ||
      configuredAuthUrl ||
      "http://localhost:3000"
    );
  }

  return configuredAuthUrl || configuredAppUrl || "http://localhost:3000";
}

function buildResetPasswordPageUrl(generatedUrl: string) {
  const appOrigin = getAppOrigin();

  try {
    const url = new URL(generatedUrl);
    const token = url.pathname.split("/").filter(Boolean).pop();

    if (!token) {
      return `${appOrigin}/reset-password`;
    }

    return `${appOrigin}/reset-password?token=${encodeURIComponent(token)}`;
  } catch {
    return `${appOrigin}/reset-password`;
  }
}

function getGooglePictureFromIdToken(idToken?: string | null) {
  if (!idToken) {
    return null;
  }

  try {
    const payloadPart = idToken.split(".")[1];
    if (!payloadPart) {
      return null;
    }

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(
      Buffer.from(padded, "base64").toString("utf8"),
    ) as {
      picture?: string;
    };

    return payload.picture || null;
  } catch {
    return null;
  }
}

async function syncGoogleImageForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });

  if (!user || user.image) {
    return;
  }

  const googleAccount = await prisma.account.findFirst({
    where: {
      userId,
      providerId: "google",
    },
    orderBy: { createdAt: "desc" },
    select: { idToken: true },
  });

  const picture = getGooglePictureFromIdToken(googleAccount?.idToken);
  if (!picture) {
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { image: picture },
  });
}

export const auth = betterAuth({
  // Uses the app URL so OAuth redirects always resolve to this Next.js app.
  baseURL: getAppOrigin(),
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      birthYear: {
        type: "number",
        required: false,
      },
      gender: {
        type: "string",
        required: false,
      },
      parentEmail: {
        type: "string",
        required: false,
      },
      profileFilled: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      isPremium: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      currentStreak: {
        type: "number",
        required: false,
        defaultValue: 0,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "Aktif",
      },
    },
  },
  databaseHooks: {
    user: {
      update: {
        before: async (data, ctx) => {
          const incoming = { ...(data as Record<string, unknown>) };

          if (!("parentEmail" in incoming)) {
            return { data: incoming };
          }

          const rawParentEmail =
            typeof incoming.parentEmail === "string"
              ? incoming.parentEmail.trim().toLowerCase()
              : "";
          const normalizedIncomingParentEmail = rawParentEmail || null;
          const userId = ctx?.context?.session?.user?.id;

          if (!normalizedIncomingParentEmail) {
            if (userId) {
              await prisma.parent.deleteMany({
                where: { userId },
              });
            }
            return {
              data: {
                ...incoming,
                parentEmail: null,
              },
            };
          }

          if (!userId) {
            return { data: incoming };
          }

          const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              name: true,
              parentEmail: true,
            },
          });

          if (!currentUser) {
            return { data: incoming };
          }

          const normalizedCurrentParentEmail =
            currentUser.parentEmail?.toLowerCase() || null;

          if (normalizedCurrentParentEmail === normalizedIncomingParentEmail) {
            return {
              data: {
                ...incoming,
                parentEmail: normalizedIncomingParentEmail,
              },
            };
          }

          const appUrl =
            process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL;

          if (!appUrl) {
            throw new Error(
              "BETTER_AUTH_URL atau NEXT_PUBLIC_APP_URL belum dikonfigurasi.",
            );
          }

          await requestParentConsentEmail({
            userId,
            childName:
              (typeof incoming.name === "string" && incoming.name.trim()) ||
              currentUser.name,
            parentEmail: normalizedIncomingParentEmail,
            appUrl,
          });

          return {
            data: {
              ...incoming,
              parentEmail: normalizedIncomingParentEmail,
            },
          };
        },
      },
    },
    account: {
      create: {
        after: async (account) => {
          if (account.providerId === "google") {
            await syncGoogleImageForUser(account.userId);
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const incoming = { ...(session as Record<string, unknown>) };
          const userId = incoming.userId as string;

          if (userId) {
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { status: true },
            });
            if (user?.status === "Nonaktif") {
              throw new APIError("UNAUTHORIZED", {
                message: "Akun kamu telah dinonaktifkan oleh Admin.",
              });
            }
          }
          return { data: incoming };
        },
        after: async (session) => {
          await syncGoogleImageForUser(session.userId);
        },
      },
    },
  },
  // Enables email/password sign up and requires verification before login.
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      const greetingName = user.name?.trim() || "Teman";
      const resetPasswordUrl = buildResetPasswordPageUrl(url);

      await sendEmail({
        to: user.email,
        subject: "Reset Password Akun TemanTumbuh",
        text:
          `Halo ${greetingName},\n\n` +
          "Kami menerima permintaan untuk mengatur ulang password akunmu.\n" +
          "Jika ini memang kamu, buka link berikut untuk membuat password baru:\n\n" +
          `${resetPasswordUrl}\n\n` +
          "Jika kamu tidak meminta reset password, abaikan email ini.",
        html: `
          <div style="background:#f3f8ff;padding:24px 12px;font-family:Arial,sans-serif;color:#1f2937;">
            <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dbe7f3;border-radius:14px;overflow:hidden;">
              <div style="background:linear-gradient(90deg,#0f6b60,#1a9688,#28b0a4);height:6px;"></div>
              <div style="padding:28px 24px;">
                <h2 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f6b60;">Halo ${greetingName}, reset password akunmu</h2>
                <p style="margin:0 0 10px;font-size:15px;line-height:1.7;">Kami menerima permintaan untuk mengatur ulang password akun TemanTumbuh kamu.</p>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.7;">Klik tombol di bawah untuk membuat password baru.</p>

                <div style="margin:22px 0 24px;text-align:center;">
                  <a href="${resetPasswordUrl}" style="display:inline-block;background:#1a9688;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:10px;">Atur Ulang Password</a>
                </div>

                <p style="margin:0 0 8px;font-size:13px;color:#4b5563;">Jika tombol tidak berfungsi, salin link ini:</p>
                <p style="margin:0 0 18px;word-break:break-all;"><a href="${resetPasswordUrl}" style="color:#0f6b60;font-size:13px;">${resetPasswordUrl}</a></p>

                <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">Jika kamu tidak merasa meminta reset password, abaikan email ini.</p>
              </div>
            </div>
          </div>
        `,
      });
    },
    onPasswordReset: async ({ user }) => {
      console.log(`Password untuk ${user.email} berhasil direset.`);
    },
  },
  // Sends verification links through SMTP and avoids timing attacks by not awaiting from auth flow.
  emailVerification: {
    autoSignInAfterVerification: true, // AUTO LOGIN AFTER VERIFICATION CLICK
    sendVerificationEmail: async ({ user, url }) => {
      try {
        const greetingName = user.name?.trim() || "Teman";

        // Harus kita await, agar kalau gagal mengirim email (misal tidak ada koneksi/kredensial SMTP mati),
        // kita bisa menangkap throw error nya dan membatalkan pembuatan user tersebut.
        await sendEmail({
          to: user.email,
          subject: "Verifikasi Email Akun TemanTumbuh",
          text:
            `Halo ${greetingName},\n\n` +
            "Terima kasih sudah mendaftar di TemanTumbuh.\n" +
            "Untuk melanjutkan dan mengamankan akunmu, silakan verifikasi email terlebih dahulu.\n\n" +
            `Link verifikasi: ${url}\n\n` +
            "Jika kamu tidak merasa membuat akun ini, kamu bisa abaikan email ini.",
          html: `
            <div style="background:#f3f8ff;padding:24px 12px;font-family:Arial,sans-serif;color:#1f2937;">
              <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dbe7f3;border-radius:14px;overflow:hidden;">
                <div style="background:linear-gradient(90deg,#0f6b60,#1a9688,#28b0a4);height:6px;"></div>
                <div style="padding:28px 24px;">
                  <h2 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f6b60;">Selamat datang di TemanTumbuh, ${greetingName}!</h2>
                  <p style="margin:0 0 10px;font-size:15px;line-height:1.7;">Terima kasih sudah membuat akun. Sebelum mulai, kami perlu memastikan bahwa email ini benar milikmu.</p>
                  <p style="margin:0 0 20px;font-size:15px;line-height:1.7;">Klik tombol di bawah untuk verifikasi email. Setelah terverifikasi, kamu akan langsung bisa lanjut melengkapi profil.</p>

                  <div style="margin:22px 0 24px;text-align:center;">
                    <a href="${url}" style="display:inline-block;background:#1a9688;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:10px;">Verifikasi Email Sekarang</a>
                  </div>

                  <p style="margin:0 0 8px;font-size:13px;color:#4b5563;">Jika tombol tidak berfungsi, salin dan buka link ini di browser:</p>
                  <p style="margin:0 0 18px;word-break:break-all;"><a href="${url}" style="color:#0f6b60;font-size:13px;">${url}</a></p>

                  <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">Kalau kamu tidak merasa membuat akun ini, abaikan email ini. Tidak ada perubahan apa pun pada akunmu.</p>
                </div>
              </div>
            </div>
          `,
        });
      } catch (error) {
        console.error(
          "Gagal mengirim email verifikasi, membatalkan pembuatan akun:",
          error,
        );
        // Hapus akun yang terlanjur terbuat jika email gagal terkirim.
        await prisma.user.deleteMany({
          where: {
            OR: [{ id: user.id }, { email: user.email }],
          },
        });
        throw new Error("Gagal mengirim email. Pembuatan akun dibatalkan.");
      }
    },
  },
  // Allows implicit linking by email for trusted OAuth providers.
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      disableImplicitLinking: false,
    },
  },
  // Configures Google OAuth and forces consent flow so refresh tokens can be issued.
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      accessType: "offline",
      prompt: "select_account consent",
      mapProfileToUser: (profile) => ({
        image: profile.picture,
      }),
    },
  },
  plugins: [openAPI()],
});

/**
 * Reads the logged-in user ID from a route handler request.
 */
export async function getAuthenticatedUserIdFromRequest(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  return session?.user?.id ?? null;
}

/**
 * Reads Better Auth account linkage/security state for a user.
 */
export async function getUserSecurityState(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: {
      providerId: true,
      password: true,
    },
  });

  const providerIds = accounts.map((account) => account.providerId);
  const isGoogleLinked = providerIds.includes("google");
  const hasPassword = accounts.some(
    (account) =>
      account.providerId === "credential" ||
      (typeof account.password === "string" &&
        account.password.trim().length > 0),
  );

  return {
    hasPassword,
    isGoogleLinked,
    providerIds,
  };
}

/**
 * Updates the parent email field stored on Better Auth user table.
 */
export async function setUserParentEmail(
  userId: string,
  parentEmail: string | null,
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      parentEmail,
    },
  });
}
