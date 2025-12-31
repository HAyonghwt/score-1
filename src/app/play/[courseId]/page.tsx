import ClientPlayDetail from './ClientPlayDetail';

export default function PlayPageWrapper() {
  return <ClientPlayDetail />;
}

export async function generateStaticParams() {
  return [
    { courseId: '1' },
    { courseId: '2' },
    { courseId: '3' },
    { courseId: '1751463597820' },
    { courseId: '1751465100438' },
    { courseId: '1751465906823' },
    { courseId: '1751466065278' },
    { courseId: '1751466541852' },
    { courseId: '1751467112657' },
  ];
}
