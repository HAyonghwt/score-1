import html2canvas from 'html2canvas';

export async function exportScoreTableToImage(targetId: string): Promise<string | null> {
  const target = document.getElementById(targetId);
  if (!target) return null;

  // 1. 스타일 백업 및 캡처 전용 스타일 설정
  const originalStyle = target.getAttribute('style') || '';
  Object.assign(target.style, {
    width: '600px',
    minWidth: '600px',
    backgroundColor: '#ffffff',
    position: 'relative',
    padding: '20px',
    zIndex: '1',
    overflow: 'visible'
  });

  try {
    // 2. 렌더링 안정화 대기 (충분한 시간 부여)
    await new Promise(r => setTimeout(r, 500));

    // 3. 캡처 수행
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 600,
      onclone: (clonedDoc) => {
        // 복제된 문서에서 스타일 강제 보정
        const clonedTarget = clonedDoc.getElementById(targetId);
        if (clonedTarget) {
          clonedTarget.style.width = '600px';
          clonedTarget.style.backgroundColor = '#ffffff';
        }
      }
    });

    // 4. Data URL로 반환 (일부 환경에서 Blob보다 파일명 인식이 잘 됨)
    return canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    console.error('이미지 생성 오류:', error);
    return null;
  } finally {
    // 5. 스타일 원복
    target.setAttribute('style', originalStyle);
  }
}
