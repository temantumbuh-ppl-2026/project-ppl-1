import { HeartHandshake, Phone } from "lucide-react";

// Populate only with verified contacts for the supported country. Guidance
// remains available when no locally verified contact has been configured.
export const SAFETY_CONTACTS: readonly {
  id: string;
  label: string;
  description: string;
  display: string;
  href: string;
}[] = [];

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
            Aku ingin membantu kamu tetap aman. Kamu bisa meminta bantuan orang
            yang dapat mendampingi secara langsung.
          </p>
        </div>
      </div>

      <ul className="dy-safety-steps">
        <li>
          Hubungi orang dewasa yang kamu percaya dan aman untuk mendampingi,
          seperti guru, konselor sekolah, atau kerabat yang bukan sumber
          ancaman.
        </li>
        <li>
          Jika kamu atau orang lain dalam bahaya sekarang, minta bantuan layanan
          darurat setempat atau IGD terdekat. Jika memungkinkan, minta
          pendamping yang aman menemanimu.
        </li>
      </ul>

      {SAFETY_CONTACTS.length > 0 ? (
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
      ) : null}

      <p className="dy-safety-note">
        Kamu tetap bisa melanjutkan menulis di sini kapan pun kamu mau.
      </p>
    </section>
  );
}
