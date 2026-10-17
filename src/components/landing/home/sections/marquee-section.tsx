import { Fragment } from "react";

import { homeMarqueeMessages } from "@/components/landing/home/home-content";

export function HomeMarqueeSection() {
  // Dua belahan identik (masing-masing 4 salinan, lebih lebar dari layar 4K)
  // agar animasi geser -50% selalu terisi teks dan berulang tanpa putus.
  const loops = Array.from({ length: 8 }, (_, index) => index);

  return (
    <section className="marquee" aria-label="Pesan TemanTumbuh">
      <div>
        {loops.map((loop) =>
          homeMarqueeMessages.map((message) => (
            <Fragment key={`${loop}-${message}`}>
              <span aria-hidden={loop > 0}>{message}</span>
              <b aria-hidden="true">✦</b>
            </Fragment>
          )),
        )}
      </div>
    </section>
  );
}
