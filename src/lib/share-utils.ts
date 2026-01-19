import html2canvas from 'html2canvas';
import type { Course } from './types';

// Helper to get theme color (duplicated to be self-contained)
function getThemeColor(courseName: string) {
    switch (courseName?.toLowerCase()) {
        case 'a': return '#e53935';
        case 'b': return '#1e88e5';
        case 'c': return '#fbc02d';
        case 'd': return '#e9ecef';
        case 'e': return '#fb8c00';
        case 'f': return '#8e24aa';
        default: return '#2563eb';
    }
}

interface ShareOptions {
    onSuccess: () => void;
    onError: (error: any) => void;
    onToast: (title: string, description: string, variant?: "default" | "destructive") => void;
}

export async function shareGameScore(
    course: Course,
    allScores: string[][][],
    options: ShareOptions
) {
    const filesToShare: File[] = [];
    const now = new Date();

    for (let i = 0; i < course.courses.length; i++) {
        const courseScores = allScores[i] || [];
        // Check if any score exists in this course
        const hasScores = courseScores.some(row => row.some(s => s !== ''));

        if (hasScores) {
            const elementId = `captureArea-${course.courses[i].name}`;
            const captureArea = document.getElementById(elementId);

            if (captureArea) {
                // Create Header
                const headerEl = document.createElement('div');
                const formattedDate = now.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short'
                });
                const formattedTime = now.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });

                headerEl.innerHTML = `
          <div style="font-size: 18px; font-weight: bold; color: #1a1a1a; margin-bottom: 4px;">
            ${course.name} - ${course.courses[i].name} 코스
          </div>
          <div style="font-size: 13px; color: #666;">
            ${formattedDate} ${formattedTime}
          </div>
        `;
                Object.assign(headerEl.style, {
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    backgroundColor: '#f8f9fa',
                    padding: '12px 16px',
                    borderBottom: '2px solid #dee2e6',
                    zIndex: '10',
                    textAlign: 'center'
                });

                const originalTheme = captureArea.getAttribute('data-theme');
                const originalStyle = captureArea.getAttribute('style');

                // Force theme colors for capture - prevent inheritance issues
                const currentCourse = course.courses[i];
                const courseNameKey = currentCourse.name.trim().toUpperCase()[0]; // 'A', 'B', 'C', 'D'
                const themeColor = getThemeColor(courseNameKey);

                const isDSub = courseNameKey === 'D';
                const isCSub = courseNameKey === 'C';
                const isASub = courseNameKey === 'A';
                const isBSub = courseNameKey === 'B';

                const themeBgCapture =
                    isASub ? '#FEEBF2' :
                        isBSub ? '#E3F2FD' :
                            isCSub ? '#FFFDE7' :
                                isDSub ? '#F8F9FA' :
                                    `${themeColor}26`;

                const themeTextColor = (isCSub || isDSub) ? '#222' : '#fff';

                captureArea.style.setProperty('--theme-color', themeColor);
                captureArea.style.setProperty('--theme-bg', themeBgCapture); // Force background variable
                captureArea.style.position = 'relative';
                captureArea.style.paddingTop = '70px'; // Header space

                // Adjust cells for capture - ONLY COLORS, NO SHAPE CHANGES
                captureArea.querySelectorAll('td, th').forEach((cell: any) => {
                    const isHeader =
                        cell.classList.contains('hole-cell') ||
                        cell.classList.contains('hole-header') ||
                        cell.classList.contains('par-header') ||
                        cell.classList.contains('name-header');

                    if (isHeader) {
                        cell.style.setProperty('color', themeTextColor, 'important');
                        cell.style.setProperty('background-color', themeColor, 'important');
                        cell.style.border = 'none';
                    }
                    if (cell.classList.contains('score-cell') || cell.classList.contains('par-cell')) {
                        cell.style.setProperty('background-color', themeBgCapture, 'important');
                        cell.style.border = 'none';
                    }
                });

                // Force header row background directly to ensure full row color
                const headerRow = captureArea.querySelector('thead tr');
                if (headerRow instanceof HTMLElement) {
                    headerRow.style.backgroundColor = themeColor;
                }

                // Header styling adjustment
                if (isCSub || isDSub) {
                    headerEl.style.backgroundColor = themeColor;
                    headerEl.style.color = '#222';
                }


                captureArea.insertBefore(headerEl, captureArea.firstChild);

                try {
                    const canvas = await html2canvas(captureArea, {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#ffffff'
                    });
                    const dataUrl = canvas.toDataURL('image/png');
                    const blob = await (await fetch(dataUrl)).blob();
                    const file = new File([blob], `${course.name}-${course.courses[i].name}-스코어.png`, { type: 'image/png' });
                    filesToShare.push(file);
                } catch (error) {
                    console.error('Canvas Error:', error);
                    options.onToast("이미지 생성 실패", `${course.courses[i].name} 코스 이미지 생성에 실패했습니다.`, "destructive");
                } finally {
                    captureArea.removeChild(headerEl);
                    // Restore Styles
                    if (originalTheme) captureArea.setAttribute('data-theme', originalTheme);
                    else captureArea.removeAttribute('data-theme');

                    if (originalStyle) captureArea.setAttribute('style', originalStyle);
                    else captureArea.removeAttribute('style');
                }
            }
        }
    }

    if (filesToShare.length > 0) {
        try {
            await navigator.share({
                files: filesToShare,
                title: `${course.name} 스코어카드`,
                text: `[${course.name}] 경기 결과를 공유합니다.`,
            });
            options.onSuccess();
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                options.onError(error);
            }
        }
    } else {
        options.onToast("공유할 내용 없음", "점수가 입력된 코스가 없습니다.");
    }
}
