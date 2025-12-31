// PWA 서비스워커 등록 (Next.js 클라이언트 엔트리)
if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
