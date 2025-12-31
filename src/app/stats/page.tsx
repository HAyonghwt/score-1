'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import LineBarCharts from "@/app/components/LineBarCharts";

// 단일 코스의 총점 계산 (플레이어1 기준)
function getCourseTotalScore(courseScores: any[]): number {
  if (!courseScores || !courseScores.length) return 0;
  let total = 0;
  for (let i = 0; i < courseScores.length; i++) {
    const myScore = courseScores[i][0]; // 플레이어1(본인) 점수
    if (myScore && !isNaN(Number(myScore))) {
      total += Number(myScore);
    }
  }
  return total;
}

// 레코드의 모든 코스 점수 반환
function getAllCourseScores(record: any): {score: number, courseName: string}[] {
  if (!record.allScores || !record.allScores.length) return [];
  
  return record.allScores.map((courseScores: any[], index: number) => ({
    score: getCourseTotalScore(courseScores),
    courseName: record.playedCourses?.[index]?.name || `코스 ${String.fromCharCode(65 + index)}`
  }));
}

export default function StatsPage() {
  const [isClient, setIsClient] = useState(false);
  const [monthlyData, setMonthlyData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const [byCourseData, setByCourseData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const [recentRoundsData, setRecentRoundsData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const recordsRaw = localStorage.getItem('golfGameRecords');
    if (!recordsRaw) return;
    let records: any[] = [];
    try {
      records = JSON.parse(recordsRaw);
    } catch {
      return;
    }

    // 1. 월별 점수 추이 데이터
    const monthlyMap: { [key: string]: { totalScore: number, courseCount: number } } = {};
    
    records.forEach((record: any) => {
      const d = new Date(record.date);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const courseScores = getAllCourseScores(record);
      
      if (!monthlyMap[ym]) {
        monthlyMap[ym] = { totalScore: 0, courseCount: 0 };
      }
      
      courseScores.forEach(course => {
        if (course.score > 0) {
          monthlyMap[ym].totalScore += course.score;
          monthlyMap[ym].courseCount++;
        }
      });
    });
    
    const monthlyLabels = Object.keys(monthlyMap).sort();
    const monthlyAverages = monthlyLabels.map(month => {
      const { totalScore, courseCount } = monthlyMap[month];
      return courseCount > 0 ? parseFloat((totalScore / courseCount).toFixed(2)) : 0;
    });
    setMonthlyData({ labels: monthlyLabels, data: monthlyAverages });

    // 2. 구장별 평균 점수 데이터
    const byCourseMap: { [key: string]: { totalScore: number, courseCount: number } } = {};
    
    records.forEach((record: any) => {
      const venueName = record.courseName || "기타";
      const courseScores = getAllCourseScores(record);
      
      if (!byCourseMap[venueName]) {
        byCourseMap[venueName] = { totalScore: 0, courseCount: 0 };
      }
      
      courseScores.forEach(course => {
        if (course.score > 0) {
          byCourseMap[venueName].totalScore += course.score;
          byCourseMap[venueName].courseCount++;
        }
      });
    });
    
    const byCourseLabels = Object.keys(byCourseMap);
    const byCourseAverages = byCourseLabels.map(venue => {
      const { totalScore, courseCount } = byCourseMap[venue];
      return courseCount > 0 ? parseFloat((totalScore / courseCount).toFixed(2)) : 0;
    });
    setByCourseData({ labels: byCourseLabels, data: byCourseAverages });

    // 3. 최근 라운드별 점수 데이터
    interface CourseScore {
      date: Date;
      courseLabel: string;
      score: number;
      timestamp: number;
    }
    
    const allCourses: CourseScore[] = [];
    records.forEach(record => {
      const recordDate = new Date(record.date);
      
      if (record.playedCourses && record.playedCourses.length > 0 && record.allScores && record.allScores.length > 0) {
        record.allScores.forEach((courseScores: any[], courseIndex: number) => {
          if (courseIndex < (record.playedCourses?.length || 0)) {
            const venueFirstChar = record.courseName ? record.courseName.charAt(0) : '기';
            const subCourseName = record.playedCourses[courseIndex]?.name || String.fromCharCode(65 + courseIndex);
            const courseLabel = `${venueFirstChar}${subCourseName}`;
            
            // 한 코스의 점수 합산
            const totalScore = courseScores.reduce((sum: number, holeScores: string[]) => {
              const score = parseInt(holeScores[0], 10);
              return sum + (isNaN(score) ? 0 : score);
            }, 0);

            if (totalScore > 0) {
              allCourses.push({
                date: recordDate,
                courseLabel,
                score: totalScore,
                timestamp: recordDate.getTime()
              });
            }
          }
        });
      }
    });
    
    allCourses.sort((a, b) => b.timestamp - a.timestamp);
    const recentCourses = allCourses.slice(0, 10).reverse(); // 시간 순으로 다시 정렬하여 그래프 표시
    
    setRecentRoundsData({ 
      labels: recentCourses.map(c => c.courseLabel), 
      data: recentCourses.map(c => c.score) 
    });
  }, [isClient]);

  if (!isClient) return null;

  return (
    <div className="container mx-auto p-4 max-w-lg min-h-screen bg-background">
      <header className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">나의 통계 분석</h1>
      </header>

      <main className="space-y-6">
        <LineBarCharts
          monthlyData={monthlyData}
          byCourseData={byCourseData}
          recentRoundsData={recentRoundsData}
        />
        
        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm text-blue-700 leading-relaxed">
            💡 최근 기록을 바탕으로 분석된 데이터입니다. 꾸준한 라운딩으로 점수 변화를 확인해보세요!
          </p>
        </div>
      </main>
    </div>
  );
}
