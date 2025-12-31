'use client';

import React, { useState, useEffect } from 'react';
import "./register-sw";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PlusCircle, History, Trash2, Edit, Pencil, BarChart2, GripVertical } from 'lucide-react';
import type { Course } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// DND Kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const GolfFlagIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 100 150"
    {...props}
  >
    <line x1="20" y1="10" x2="20" y2="140" stroke="black" strokeWidth="4" />
    <rect x="20" y="20" width="60" height="40" fill="red" stroke="black" strokeWidth="1" />
  </svg>
);

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [userName, setUserName] = useState('나');
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [tempUserName, setTempUserName] = useState('');
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setIsClient(true);
    const savedCourses = localStorage.getItem('golfCoursesList');
    if (savedCourses) {
      setCourses(JSON.parse(savedCourses));
    }
    const savedName = localStorage.getItem('parkGolfUserName');
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('golfCoursesList', JSON.stringify(courses));
      if (userName && userName !== '나') {
        localStorage.setItem('parkGolfUserName', userName);
      } else {
        localStorage.removeItem('parkGolfUserName');
      }
    }
  }, [courses, userName, isClient]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setCourses((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    setCourseToDelete(courseId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (courseToDelete) {
      setCourses(courses.filter(course => course.id !== courseToDelete));
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCourseToDelete(null);
  };

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingPars, setEditingPars] = useState<(number | string)[][]>([]);

  const handleEditCourse = (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setEditingCourse(course);
      setEditingPars(course.courses.map(sc => [...sc.pars]));
      setEditDialogOpen(true);
    }
  };

  const handleEditParChange = (courseIdx: number, holeIdx: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    setEditingPars(prev => {
      const copy = prev.map(arr => [...arr]);
      copy[courseIdx][holeIdx] = value;
      return copy;
    });
  };

  const handleEditDialogSave = () => {
    if (!editingCourse) return;
    const updatedCourses = courses.map(c =>
      c.id === editingCourse.id
        ? {
          ...c,
          courses: c.courses.map((sc, i) => ({
            ...sc,
            pars: editingPars[i].map(p => {
              const val = parseInt(String(p), 10);
              return isNaN(val) || val <= 0 ? 3 : val;
            })
          }))
        }
        : c
    );
    setCourses(updatedCourses);
    setEditDialogOpen(false);
  };

  const handleNameSave = () => {
    const newName = tempUserName.trim();
    if (newName) {
      setUserName(newName);
    } else {
      setUserName('나');
    }
    setIsNameDialogOpen(false);
  };

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-lg min-h-screen bg-background">
      <header className="text-center my-8">
        <div className="flex items-center justify-center gap-1.5">
          <GolfFlagIcon className="w-8 h-8" />
          <h1 className="text-2xl font-bold whitespace-nowrap select-none cursor-default">
            {userName}의 파크골프
          </h1>
          <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setTempUserName(userName === '나' ? '' : userName)}>
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>사용자 이름 변경</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="username">이름</Label>
                <Input
                  id="username"
                  value={tempUserName}
                  onChange={e => setTempUserName(e.target.value)}
                  placeholder="사용자 이름을 입력하세요"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleNameSave();
                    }
                  }}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setIsNameDialogOpen(false)}>취소</Button>
                <Button type="submit" onClick={handleNameSave}>저장</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-2 text-base text-gray-500 font-normal">
          구장을 등록하고 스코어를 관리하세요
        </div>
      </header>

      <main className="space-y-4">

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={courses.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {courses.map((course) => (
                  <SortableCourseItem
                    key={course.id}
                    course={course}
                    onEdit={handleEditCourse}
                    onDelete={handleDeleteClick}
                    onClick={() => router.push(`/play/${course.id}`)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        ) : (
          <Card className="text-center p-8 border-dashed">
            <CardTitle className="text-xl sm:text-2xl whitespace-nowrap">등록된 구장이 없습니다</CardTitle>
            <CardDescription className="mt-2 text-base sm:text-lg break-keep">아래 버튼으로 구장을 추가해주세요.</CardDescription>
          </Card>
        )}
        <Link href="/add-course">
          <Button className="w-full h-12 text-base mt-4 bg-blue-100 text-blue-700 border border-blue-100 hover:bg-blue-200">
            <PlusCircle className="mr-2 w-5 h-5" />
            새 구장 추가
          </Button>
        </Link>

        {/* 코스별 파수 수정 다이얼로그 */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>코스별 기본 PAR 수정</DialogTitle>
            </DialogHeader>
            {editingCourse && (
              <div className="space-y-4">
                <div>
                  <Label className="block mb-1">구장명</Label>
                  <Input value={editingCourse.name} readOnly className="bg-gray-100" />
                </div>
                {editingCourse.courses.map((subCourse, courseIdx) => (
                  <Card key={subCourse.name + '-' + courseIdx} className="mb-2">
                    <CardHeader>
                      <CardTitle className="text-lg">{subCourse.name} 코스 PAR 정보</CardTitle>
                    </CardHeader>
                    <CardDescription className="px-4 pb-2 text-base">각 홀의 기본 PAR을 입력하세요</CardDescription>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2">
                        {subCourse.pars.map((par, holeIdx) => (
                          <div key={holeIdx} className="space-y-1">
                            <Label htmlFor={`edit-par-${courseIdx}-${holeIdx}`} className="text-sm">{holeIdx + 1}번 홀</Label>
                            <Input
                              id={`edit-par-${courseIdx}-${holeIdx}`}
                              type="tel"
                              value={editingPars[courseIdx]?.[holeIdx] ?? ''}
                              onChange={e => handleEditParChange(courseIdx, holeIdx, e.target.value)}
                              onFocus={e => e.target.select()}
                              placeholder="3"
                              className="h-10 text-center"
                              maxLength={1}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button variant="secondary" onClick={() => setEditDialogOpen(false)}>취소</Button>
              <Button onClick={handleEditDialogSave}>저장</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>구장 삭제</DialogTitle>
            <DialogDescription>
              이 구장을 정말로 삭제하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel}>취소</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>삭제</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="mt-8 text-center">
        <div className="flex gap-2">
          <Link href="/stats" className="flex-1">
            <Button className="w-full h-12 text-base border border-[#c4faf8] hover:bg-[#c4faf8]" style={{ backgroundColor: '#c4faf8', color: '#094993ff' }}>
              <BarChart2 className="mr-2 w-5 h-5" />
              나의 통계
            </Button>
          </Link>
          <Link href="/records" className="flex-1">
            <Button className="w-full h-12 text-base">
              <History className="mr-2" />
              기록 보기
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  );
}

function SortableCourseItem({
  course,
  onEdit,
  onDelete,
  onClick
}: {
  course: Course;
  onEdit: (e: React.MouseEvent, id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: course.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer hover:border-primary transition-colors text-2xl ${isDragging ? 'shadow-lg border-primary' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="p-3 flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-grow overflow-hidden">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-grow overflow-hidden">
            <CardTitle className="text-lg font-semibold truncate stadium-name select-none">{course.name}</CardTitle>
            <CardDescription className="truncate text-base">{course.courses.length}개 코스 ({course.courses.map(c => c.name).join(', ')}코스)</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => onEdit(e, course.id)}
            className="w-8 h-8"
          >
            <Edit className="w-5 h-5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => onDelete(e, course.id)}
            className="w-8 h-8"
          >
            <Trash2 className="w-5 h-5 text-destructive" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
