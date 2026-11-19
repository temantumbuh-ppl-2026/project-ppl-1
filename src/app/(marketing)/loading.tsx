// Fallback saat halaman marketing dinamis (mis. Home) menunggu server.
// Hanya area konten yang kosong dan berwarna sama dengan latar, tanpa spinner
// layar penuh, sehingga Navbar dan Footer tetap terlihat dan perpindahan terasa halus.
export default function MarketingLoading() {
  return (
    <div
      aria-busy="true"
      style={{ minHeight: "70vh", background: "var(--tt-gray-50)" }}
    />
  );
}
