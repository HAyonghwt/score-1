'use client';
import './graph-bar-area.css';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import StatsPieChart from "@/app/components/StatsPieChart";
import { ArrowLeft, Trophy, Trash2 } from 'lucide-react';
import type { GameRecord } from '@/lib/types';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

// 1. 유틸 함수: 월별/일별 그룹핑
function groupRecordsByMonthAndDate(records: GameRecord[]) {
  const grouped: { [yearMonth: string]: { [date: string]: GameRecord[] } } = {};
  records.forEach(record => {
    const d = new Date(record.date);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!grouped[yearMonth]) grouped[yearMonth] = {};
    if (!grouped[yearMonth][dateStr]) grouped[yearMonth][dateStr] = [];
    grouped[yearMonth][dateStr].push(record);
  });
  return grouped;
}

// 2. 검색/필터 함수
function filterRecords(records: GameRecord[], searchText: string): GameRecord[] {
  if (!searchText.trim()) return records;
  const lower = searchText.toLowerCase();
  return records.filter(r =>
    (r.courseName && r.courseName.toLowerCase().includes(lower)) ||
    (r.date && r.date.toLowerCase().includes(lower))
  );
}

// 3. 평균 계산/색상 함수
function calculateAverage(record: GameRecord) {
  const playedCoursesScores = record.allScores;
  if (!playedCoursesScores || playedCoursesScores.length === 0) return { avg: 0 };
  let totalScorePlayer1 = 0;
  let numRounds = 0;
  playedCoursesScores.forEach((courseScores, index) => {
    const player1Scores = courseScores.map(s => s[0]);
    if (player1Scores.every(s => s && s.trim() !== '')) {
      totalScorePlayer1 += player1Scores.reduce((sum, score) => sum + (parseInt(score) || 0), 0);
      numRounds++;
    }
  });
  const avg = numRounds > 0 ? totalScorePlayer1 / numRounds : 0;
  return { avg: parseFloat(avg.toFixed(2)) };
}
function getScoreColor(avg: number) {
  if (avg === 0) return 'bg-gray-300';
  if (avg < 33) return 'bg-blue-500';
  if (avg === 33) return 'bg-white border-2';
  return 'bg-red-500';
}

// 4. 내보내기 함수
function exportToCSV(records: GameRecord[]) {
  // 헤더 행 - 모든 서브코스(A-F)에 대한 컬럼 추가
  const header = [
    '날짜', '시간', '구장', 
    'A코스', 'B코스', 'C코스', 'D코스', 'E코스', 'F코스'
  ].join(',');
  
  // 데이터 행 생성
  const dataRows = records.flatMap(record => {
    console.log('DEBUG_RECORD', record);
    const d = new Date(record.date);
    const { avg } = calculateAverage(record);
    
    // 날짜와 시간 분리
    const dateStr = d.toLocaleDateString('ko-KR');
    const timeStr = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    
    // 구장 이름 (코스명은 제외)
    const venue = record.courseName.split(' ')[0] || '';
    
    // 각 서브코스별 1번 플레이어의 총점 계산 (RecordDetail과 동일한 방식으로 계산)
    const courseScores: { [key: string]: number } = {};
    
    // RecordDetail 컴포넌트와 동일한 방식으로 총점 계산
    const calculateTotalScores = (courseScores: string[][]) => {
      if (!courseScores || courseScores.length === 0) return [0, 0, 0, 0];
      return Array(4).fill(0).map((_, playerIndex) =>
        courseScores.reduce((total, holeScores) => {
          const score = parseInt(holeScores[playerIndex], 10);
          return total + (isNaN(score) ? 0 : score);
        }, 0)
      );
    };
    
    // 각 서브코스별로 1번 플레이어(인덱스 0)의 총점 계산
    // 각 코스별로 1번 플레이어의 합계 점수를 정확히 계산
    // 각 코스별로 1번 플레이어의 합계 점수를 정확히 계산
    // allScores: [코스][홀][플레이어] 구조에 맞게 합계 계산
    record.playedCourses.forEach((subCourse, courseIndex) => {
      let sum = 0;
      if (
        record.allScores &&
        Array.isArray(record.allScores[courseIndex])
      ) {
        for (const holeScoreArr of record.allScores[courseIndex]) {
          sum += parseInt(holeScoreArr[0]) || 0;
        }
      }
      courseScores[subCourse.name] = sum;
    });
    
    // CSV 행 생성
    const row = [
      `"${dateStr.replace(/"/g, '""')}"`,
      `"${timeStr.replace(/"/g, '""')}"`,
      `"${venue.replace(/"/g, '""')}"`,
      `"${courseScores['A'] || 0}"`,
      `"${courseScores['B'] || 0}"`,
      `"${courseScores['C'] || 0}"`,
      `"${courseScores['D'] || 0}"`,
      `"${courseScores['E'] || 0}"`,
      `"${courseScores['F'] || 0}"`
    ];
    
    return row.join(',');
  });
  
  // 헤더와 데이터 결합
  const csv = [header, ...dataRows].join('\n');
  
  // UTF-8 BOM 추가 (한글 깨짐 방지)
  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `golf_records_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
async function exportToImage() {
  const target = document.body; // 또는 특정 div의 ref
  const canvas = await html2canvas(target);
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = 'golf_records.png';
  link.click();
}

export default function RecordsPage() {
  // Pie chart state
  const [pieLabels, setPieLabels] = useState<string[]>([]);
  const [pieData, setPieData] = useState<number[]>([]);

  useEffect(() => {
    // Aggregate play count by course
    const recordsRaw = localStorage.getItem('golfGameRecords');
    if (!recordsRaw) return;
    let records: any[] = [];
    try {
      records = JSON.parse(recordsRaw);
    } catch {
      return;
    }
    const courseCounts: { [course: string]: number } = {};
    records.forEach(r => {
      const course = r.courseName || "?";
      if (!courseCounts[course]) courseCounts[course] = 0;
      courseCounts[course]++;
    });
    setPieLabels(Object.keys(courseCounts));
    setPieData(Object.values(courseCounts));
  }, []);
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [openMonths, setOpenMonths] = useState<{[month: string]: boolean}>({});
  const [openDates, setOpenDates] = useState<{[date: string]: boolean}>({});
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const savedRecords = localStorage.getItem('golfGameRecords');
      if (savedRecords) {
        setRecords(JSON.parse(savedRecords));
      }
    }
  }, [isClient]);

  const handleResetAllRecords = () => {
    localStorage.removeItem('golfGameRecords');
    setRecords([]);
    setIsConfirmingDelete(false);
    toast({
      title: "모든 기록 삭제 완료",
      description: "저장된 모든 경기 기록이 삭제되었습니다.",
    });
  };

  // 아코디언 토글
  const toggleMonth = (month: string) => {
    setOpenMonths(prev => ({ ...prev, [month]: !prev[month] }));
  };
  const toggleDate = (date: string) => {
    setOpenDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  // 필터/그룹핑
  const filteredRecords = filterRecords(records, searchText);
  const grouped = groupRecordsByMonthAndDate(filteredRecords);

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-lg min-h-screen bg-background flex flex-col">
      {/* MAIN CONTENT START */}
      <header className="flex items-center justify-between my-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
          <ArrowLeft className="w-6 h-6"/>
        </Button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="w-7 h-7 text-primary" />
          경기 기록
        </h1>
        <div className="w-10"></div>
      </header>

      {/* 검색창 */}
      <div className="flex flex-col gap-2 mb-4 w-full">
        <input
          type="text"
          placeholder="월/일/코스명 검색"
          className="w-full px-3 py-2 rounded border border-input focus:outline-none focus:ring-2 focus:ring-primary"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
      </div>

      {/* 플레이 횟수 및 기록 통계 그래프 */}
      <div className="mb-8">
        <Card className="p-4">
          <CardTitle className="mb-2 text-lg">플레이 횟수 통계</CardTitle>
          <StatsPieChart labels={pieLabels} data={pieData} />
        </Card>
      </div>

      {/* 안내 문구 */}
      <div className="mb-6 text-center text-sm sm:text-base text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis px-2">
        기록은 아래 날짜별로 보관되어 있어요
      </div>

      {/* 월별-일별 아코디언 */}
      <main className="space-y-4 flex-grow">
        {Object.entries(grouped).length > 0 ? (
          Object.entries(grouped).map(([yearMonth, dates]) => (
            <div key={yearMonth} className="mb-6">
              {/* 월별 헤더 */}
              <div
                className="font-bold text-lg mb-2 border-b pb-1 cursor-pointer flex items-center"
                onClick={() => toggleMonth(yearMonth)}
              >
                <span>{yearMonth.replace('-', '년 ')}월</span>
                <span className="ml-2 text-xs">{openMonths[yearMonth] ? '▲' : '▼'}</span>
              </div>
              {openMonths[yearMonth] && (
                <div>
                  {Object.entries(dates).map(([date, recs]) => (
                    <div key={date} className="mb-2">
                      <div
                        className="flex items-center justify-between px-2 py-1 bg-gray-100 rounded cursor-pointer"
                        onClick={() => toggleDate(date)}
                      >
                        <span className="text-base font-semibold">{date.replace(/-/g, '.')}</span>
                        <span className="ml-2 text-xs">{openDates[date] ? '▲' : '▼'}</span>
                      </div>
                      {openDates[date] && (
                        <div className="pl-4 pt-1">
                          {recs.map(record => {
                            const { avg } = calculateAverage(record);
                            return (
                              <Link href={`/records/${record.id}`} key={record.id}>
                                <div className="flex items-center justify-between bg-white rounded p-2 mb-1 shadow-sm">
                                  {(() => {
  let label = record.courseName;
  if (record.date) {
    const d = new Date(record.date);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    label += ` (${h}:${m})`;
  }
  // 코스명 추가 (A코스/B코스 등)
  if (record.playedCourses && record.playedCourses[0]?.name) {
    label += ` ${record.playedCourses[0].name}코스`;
  }
  return <span className="truncate" style={{maxWidth:'80vw', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', display:'inline-block', verticalAlign:'middle'}}>{label}</span>;
})() }
                                <span className="flex items-center ml-2 graph-bar-area">
  <span className="text-base font-bold mr-2" style={{ whiteSpace: "nowrap" }}>{avg > 0 ? avg : '-'}</span>
  <span className={`w-3 h-7 rounded-sm ml-1 ${getScoreColor(avg)}`} />
</span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      ) : (
        <Card className="text-center p-8 border-dashed flex-grow flex flex-col justify-center">
          <CardTitle>저장된 기록이 없습니다</CardTitle>
          <CardDescription className="mt-2">경기를 완료하고 기록을 저장해보세요.</CardDescription>
        </Card>
      )}
    </main>

    {/* 평균타수 색상 설명 */}
    <div className="mt-4 mb-4 text-xs text-muted-foreground">
      <div>
        <span className="inline-block w-3 h-3 rounded-sm bg-gray-300 mr-1 align-middle" /> 내 평균 ±2타 이내
        <span className="inline-block w-3 h-3 rounded-sm bg-blue-500 mx-2 align-middle" /> 평균보다 -2타 이상(파랑)
        <span className="inline-block w-3 h-3 rounded-sm bg-red-500 mx-2 align-middle" /> 평균보다 +2타 이상(빨강)
      </div>
      <div>
        <b>설명:</b> 월별표는 1년평균, 일별표는 이달평균 기준으로 색상 표시됩니다.
      </div>
    </div>
    
    <div className="flex flex-col w-full gap-4">
      <Button
        onClick={() => exportToCSV(filteredRecords)}
        variant="default"
        className="w-full text-base h-12"
        style={{ minHeight: 48, fontWeight: 600 }}
      >
        엑셀파일로 내보내기
      </Button>
      <Button
        variant="destructive"
        className="w-full text-base h-12"
        style={{ minHeight: 48, fontWeight: 600 }}
        onClick={() => setIsConfirmingDelete(true)}
        disabled={records.length === 0}
      >
        <Trash2 className="mr-2" />
        전체 기록 초기화
      </Button>
    </div>
    <footer className="mt-8">
      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말로 모든 기록을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 저장된 모든 경기 기록이 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetAllRecords} className={buttonVariants({ variant: "destructive" })}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </footer>
    {/* MAIN CONTENT END */}
  </div>
  );
}