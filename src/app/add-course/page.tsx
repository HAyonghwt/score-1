'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import type { Course, SubCourse } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const COURSE_NAMES = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function AddCoursePage() {
  const router = useRouter();
  const [courseName, setCourseName] = useState('');
  const [numCourses, setNumCourses] = useState(1);
  const [subCourses, setSubCourses] = useState<SubCourse[]>([
    { name: 'A', pars: Array(9).fill('') }
  ]);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isConfirmingDuplicate, setIsConfirmingDuplicate] = useState(false);
  const [duplicateCourseName, setDuplicateCourseName] = useState('');

  const handleNumCoursesChange = (value: string) => {
    const count = parseInt(value, 10);
    setNumCourses(count);
    const newSubCourses: SubCourse[] = [];
    for (let i = 0; i < count; i++) {
      const existingSubCourse = subCourses[i];
      newSubCourses.push({
        name: COURSE_NAMES[i],
        pars: existingSubCourse ? existingSubCourse.pars : Array(9).fill('')
      });
    }
    setSubCourses(newSubCourses);
    inputRefs.current = Array(count * 9).fill(null);
  };

  const handleParChange = (courseIndex: number, holeIndex: number, value: string) => {
    if (!/^\d?$/.test(value)) {
      return;
    }

    const newSubCourses = [...subCourses];
    newSubCourses[courseIndex].pars[holeIndex] = value;
    setSubCourses(newSubCourses);

    if (value.match(/^[1-9]$/)) {
      const currentInputIndex = courseIndex * 9 + holeIndex;
      const nextInputIndex = currentInputIndex + 1;
      const totalInputs = numCourses * 9;

      if (nextInputIndex < totalInputs && inputRefs.current[nextInputIndex]) {
        inputRefs.current[nextInputIndex]?.focus();
      }
    }
  };

  const handleSave = () => {
    if (!courseName.trim()) {
      setError('구장 이름을 입력해주세요.');
      return;
    }

    // 중복 이름 확인
    const savedCourses = localStorage.getItem('golfCoursesList');
    const courses: Course[] = savedCourses ? JSON.parse(savedCourses) : [];
    const existingCourse = courses.find(c => c.name.toLowerCase() === courseName.trim().toLowerCase());

    if (existingCourse) {
      setDuplicateCourseName(courseName.trim());
      setIsConfirmingDuplicate(true);
      return;
    }

    // 중복이 없으면 바로 저장
    saveNewCourse();
  };

  const saveNewCourse = () => {
    const finalSubCourses = subCourses.map(sc => ({
      ...sc,
      pars: sc.pars.map(p => {
        const val = parseInt(String(p), 10);
        return isNaN(val) || val <= 0 ? 3 : val;
      })
    }));

    const newCourse: Course = {
      id: Date.now().toString(),
      name: courseName.trim(),
      courses: finalSubCourses,
    };

    const savedCourses = localStorage.getItem('golfCoursesList');
    const courses: Course[] = savedCourses ? JSON.parse(savedCourses) : [];
    courses.push(newCourse);
    localStorage.setItem('golfCoursesList', JSON.stringify(courses));

    router.push('/');
  };

  return (
    <div className="container mx-auto p-4 max-w-lg min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between my-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-3xl font-bold">새 구장 추가</h1>
        <div className="w-10"></div>
      </header>

      <ScrollArea className="flex-grow pr-4 -mr-4 mb-4">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="courseName" className="text-xl font-semibold">구장 이름</Label>
            <Input
              id="courseName"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="예: 올림픽 파크골프장"
              className="h-14 text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numCourses" className="text-xl font-semibold">코스 수</Label>
            <Select onValueChange={handleNumCoursesChange} defaultValue="1">
              <SelectTrigger id="numCourses" className="h-14 text-lg">
                <SelectValue placeholder="코스 수를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <SelectItem key={num} value={String(num)} className="text-lg">{num}개 코스</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {subCourses.map((subCourse, courseIndex) => (
            <Card key={subCourse.name + '-' + courseIndex}>
              <CardHeader>
                <CardTitle className="text-2xl">{subCourse.name} 코스 PAR 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {subCourse.pars.map((par, holeIndex) => (
                    <div key={holeIndex} className="space-y-1">
                      <Label htmlFor={`par-${courseIndex}-${holeIndex}`} className="text-base font-medium">{holeIndex + 1}번 홀</Label>
                      <Input
                        ref={(el) => {
                          const index = courseIndex * 9 + holeIndex;
                          if (el) inputRefs.current[index] = el;
                          else inputRefs.current[index] = null;
                        }}
                        id={`par-${courseIndex}-${holeIndex}`}
                        type="tel"
                        value={par}
                        onChange={(e) => handleParChange(courseIndex, holeIndex, e.target.value)}
                        placeholder="3"
                        className="h-12 text-center text-lg"
                        maxLength={1}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {error && <p className="text-destructive text-center mt-auto">{error}</p>}

      <div className="mt-auto bg-background pt-4">
        <Button
          onClick={handleSave}
          className="w-full h-14 text-lg"
          style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #dbeafe' }}
          onMouseOver={e => (e.currentTarget.style.background = '#bfdbfe')}
          onMouseOut={e => (e.currentTarget.style.background = '#dbeafe')}
        >
          <Save className="mr-2" />
          구장 저장하기
        </Button>
      </div>

      {/* 중복 이름 확인 다이얼로그 */}
      <AlertDialog open={isConfirmingDuplicate} onOpenChange={setIsConfirmingDuplicate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>구장 이름 중복</AlertDialogTitle>
            <AlertDialogDescription>
              "{duplicateCourseName}"은(는) 이미 생성되어 있습니다. 그래도 추가로 생성하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setIsConfirmingDuplicate(false);
              saveNewCourse();
            }}>
              생성
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
