import { HeartHandshake, Phone } from "lucide-react";

/**
 * Kontak bantuan untuk pengguna di Indonesia. Tim perlu memverifikasi nomor
 * ini sebelum rilis dan mengubahnya di sini saja jika ada perubahan.
 */
export const SAFETY_CONTACTS = [
  {
    id: "sejiwa",
    label: "Layanan SEJIWA (Kemenkes)",
    description: "Konseling kesehatan jiwa, gratis.",
    display: "119 ext. 8",
    href: "tel:119",
  },
  {
    id: "emergency",
    label: "Darurat",
    description: "Jika kamu atau orang lain dalam bahaya sekarang.",
    display: "112",
    href: "tel:112",
  },
] as const;

export function SafetyNotice() {
  return (
    <section
      className="dy-safety"
      role="region"
      aria-labelledby="dy-safety-title"
    >
      <div className="dy-safety-heading">
        <HeartHandshake size={20} aria-hidden="true" />
        <div>
          <strong id="dy-safety-title">Kamu tidak sendirian</strong>
          <p>
            Terima kasih sudah berani bercerita. Yang kamu rasakan itu penting,
            dan kamu berhak mendapat bantuan dari orang yang bisa mendampingi
            langsung.
          </p>
        </div>
      </div>

      <ul className="dy-safety-steps">
        <li>
          Cerita ke orang dewasa yang kamu percaya, seperti orang tua, wali,
          guru, atau konselor sekolah.
        </li>
        <li>
          Kalau kamu merasa tidak aman sekarang, jangan tunggu. Hubungi layanan
          di bawah.
        </li>
      </ul>

      <ul className="dy-safety-contacts" aria-label="Kontak bantuan">
        {SAFETY_CONTACTS.map((contact) => (
          <li key={contact.id}>
            <a href={contact.href}>
              <Phone size={16} aria-hidden="true" />
              <span>
                <strong>{contact.label}</strong>
                <small>{contact.description}</small>
              </span>
              <b>{contact.display}</b>
            </a>
          </li>
        ))}
      </ul>

      <p className="dy-safety-note">
        Kamu tetap bisa melanjutkan menulis di sini kapan pun kamu mau.
      </p>
    </section>
  );
}
