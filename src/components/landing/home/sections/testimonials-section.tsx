import { homeTestimonial } from "@/components/landing/home/home-content";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function HomeTestimonialsSection() {
  return (
    <section className="testimonial section" id="testi">
      <div className="shell testimonial-inner">
        <div className="testimonial-heading">
          <span className="kicker">Cerita mereka</span>
          <h2>
            Kata yang tumbuh
            <br />
            dari <em>pengalaman.</em>
          </h2>
        </div>
        <div className="testimonial-card">
          <span className="quote-mark" aria-hidden="true">
            “
          </span>
          <blockquote>{homeTestimonial.quote}</blockquote>
          <div className="person">
            <span>{getInitials(homeTestimonial.name)}</span>
            <p>
              <strong>{homeTestimonial.name}</strong>
              <small>{homeTestimonial.role}</small>
            </p>
          </div>
          <p className="placeholder-note">
            Testimoni contoh — dapat diganti dengan testimoni terverifikasi.
          </p>
        </div>
      </div>
    </section>
  );
}
