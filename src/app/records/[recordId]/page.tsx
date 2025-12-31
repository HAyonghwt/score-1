import ClientRecordDetail from './ClientRecordDetail';

export default function RecordDetailPageWrapper() {
  return <ClientRecordDetail />;
}

export async function generateStaticParams() {
  return [
    { recordId: '1' },
    { recordId: '2' },
    { recordId: '3' },
    { recordId: '1751466261710' },
  ];
}
