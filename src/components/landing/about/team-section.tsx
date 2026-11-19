import Image from "next/image";

import { teamMembers } from "@/components/landing/about/about-data";

export function AboutTeamSection() {
  return (
    <section className="team-section section" id="team">
      <div className="shell">
        <div className="team-heading">
          <span className="handwritten">orang-orang di balik layar</span>
          <h2>
            Di Balik <em>TemanTumbuh.</em>
          </h2>
          <p>
            Dibuat oleh mahasiswa Informatika Universitas Padjadjaran dengan
            semangat untuk menghadirkan teknologi yang lebih peduli.
          </p>
        </div>
        <div className="team-grid">
          {teamMembers.map((member) => (
            <article
              className={member.isAdvisor ? "advisor" : ""}
              key={member.name}
            >
              {member.isAdvisor && (
                <span className="advisor-label">Dosen pembimbing</span>
              )}
              <div className="team-photo">
                <Image
                  src={member.imgSrc}
                  alt=""
                  fill
                  sizes="(max-width: 720px) 50vw, 360px"
                  className="team-photo-bg"
                  aria-hidden="true"
                />
                <Image
                  src={member.imgSrc}
                  alt={`Foto ${member.name}`}
                  fill
                  sizes="(max-width: 720px) 50vw, 360px"
                  className="team-photo-fg"
                />
              </div>
              <div className="team-info">
                <h3>{member.name}</h3>
                <span>{member.role}</span>
                <p>{member.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
