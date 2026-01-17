'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, ArrowLeft, RotateCw, Share2, Trash2, Save } from "lucide-react";
import type { Course, GameRecord } from '@/lib/types';
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
import html2canvas from 'html2canvas';
import { useParams } from 'next/navigation';

const DEFAULT_NAMES = ['이름1', '이름2', '이름3', '이름4'];
const HOLE_COUNT = 9;

// 2025년형 최신 트렌드 세련된 파크골프 점수표 스타일 전역 적용
if (typeof window !== 'undefined') {
  const styleId = 'park-golf-2025-style-v2';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;600;700&display=swap');
      [data-theme^="course-"] {
        font-family: 'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', Arial, sans-serif !important;
        background: #f7f8fa !important;
      }
      [data-theme^="course-"] .container {
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 4px 32px 0 rgba(30, 41, 59, 0.10);
        padding: 18px 8px 12px 8px;
        margin: 0 auto;
        max-width: 420px;
        min-height: 96vh;
      }
      [data-theme^="course-"] header {
        background: transparent;
        border-radius: 12px 12px 0 0;
        box-shadow: none;
        padding: 0 0 12px 0;
        margin-bottom: 0.5rem;
      }
      [data-theme^="course-"] .flex.w-full.mb-2.gap-1, [data-theme^="course-"] .flex.w-full.mb-2 {
        background: #f3f4f8;
        border-radius: 8px;
        padding: 4px 4px 0 4px;
        margin-bottom: 18px;
        box-shadow: 0 2px 8px 0 rgba(30,41,59,0.04);
      }
      [data-theme^="course-"] button[aria-current], [data-theme^="course-"] .tab-active {
        background: var(--theme-color, #2563eb) !important;
        color: #fff !important;
        box-shadow: 0 2px 8px 0 rgba(30,41,59,0.10);
        font-weight: 700;
        border-radius: 4px 4px 0 0 !important;
        border: none !important;
      }
      /* 강조 스타일 고정 */
      [data-theme^="course-"] .table-fixed td button.w-full.h-14.is-next-hole {
        background-color: #ffffff !important;
        border: 2px solid #cfd8dc !important;
        box-shadow: 0 0 6px rgba(0,0,0,0.08) !important;
        opacity: 1 !important;
        z-index: 5;
        position: relative;
        border-radius: 4px !important;
      }

      /* 탭 및 기타 UI 스타일 복원 */
      [data-theme^="course-"] .tab-scroll { overflow-x: auto; white-space: nowrap; -ms-overflow-style: none; scrollbar-width: none; margin-bottom: 4px; display: flex; }
      [data-theme^="course-"] .tab-scroll::-webkit-scrollbar { display: none; }
      [data-theme^="course-"] .tab-btn { border: none !important; outline: none !important; box-shadow: none !important; background: #f3f4f8; color: #adb5bd; font-weight: 600; border-radius: 4px 4px 0 0; margin-right: 2px; transition: background 0.2s, color 0.2s; flex: 1 1 0; min-width: 0; padding: 0.5em 0.2em; font-size: 1.1rem; height: 38px; display: flex; align-items: center; justify-content: center; }
      [data-theme^="course-"] .tab-btn.selected { background: var(--theme-color,#2563eb); color: #fff; font-weight: 700; }
      [data-theme="course-c"] .tab-btn.selected { color: #222 !important; }
      [data-theme="course-d"] .tab-btn.selected { background: #e9ecef !important; color: #222 !important; }

      [data-theme^="course-"] .animate-spin { animation: spin 1s linear infinite; }
      @keyframes spin { 100% { transform: rotate(360deg); } }
      
      [data-theme^="course-"] .no-scrollbar::-webkit-scrollbar { display: none; }
      [data-theme^="course-"] .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

      [data-theme^="course-"] .table-fixed th:first-child { border-top-left-radius: 8px !important; }
      [data-theme^="course-"] .table-fixed th:last-child { border-top-right-radius: 8px !important; }
      
      [data-theme^="course-"] .table-fixed td.hole-cell {
        background: var(--theme-color, #2563eb) !important;
        color: #fff !important;
        font-weight: 700;
        text-align: center;
        border-radius: 0 !important;
        vertical-align: middle !important;
        line-height: 1.2;
        height: 48px;
        min-width: 36px;
        display: table-cell;
      }
      [data-theme^="course-"] .table-fixed th,
      [data-theme^="course-"] .table-fixed td {
        font-size: 17px;
        padding: 0.7em 0.2em;
        border: none !important;
      }
      [data-theme^="course-"] .table-fixed th {
        background: var(--theme-color, #2563eb) !important;
        color: #fff !important;
        font-weight: 700;
        border-radius: 0 !important;
      }
      [data-theme="course-c"] .table-fixed th {
        background: var(--theme-color, #fbc02d) !important;
        color: #222 !important;
      }
      [data-theme="course-d"] .table-fixed th {
        background: #e9ecef !important;
        color: #222 !important;
      }
      [data-theme="course-c"] .table-fixed td.hole-cell {
        background: var(--theme-color, #fbc02d) !important;
        color: #222 !important;
      }
      [data-theme="course-d"] .table-fixed td.hole-cell {
        background: #e9ecef !important;
        color: #222 !important;
      }
      [data-theme^="course-"] .table-fixed td {
        background: #f7f8fa !important;
      }
      [data-theme^="course-"] .bg-card {
        background-color: #f7f8fa !important;
      }
      
      /* 입력 버튼 기본 스타일 */
      [data-theme^="course-"] .table-fixed td button.w-full.h-14 {
        background: #fff;
        border: 2px solid #e5e7eb !important;
        border-radius: 4px !important;
        font-size: 1.8rem;
        font-weight: 700;
        color: #222;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0.1em auto;
        transition: border 0.2s, box-shadow 0.2s;
      }
    `;
    document.head.appendChild(style);
  }
}

// theme-color 변수 동적 지정 (코스별)
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

export default function ClientPlayDetail() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const courseId = params.courseId as string;

  const [isClient, setIsClient] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);

  // Game state
  const [playerNames, setPlayerNames] = useState<string[]>(DEFAULT_NAMES);
  const [allScores, setAllScores] = useState<string[][][]>([]);
  const [signatures, setSignatures] = useState<(string | null)[][]>([]);

  const [activeCourseIndex, setActiveCourseIndex] = useState(0);

  // Modals and UI states
  const [isNumberPadOpen, setIsNumberPadOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ holeIndex: number; playerIndex: number } | null>(null);
  const [tempScore, setTempScore] = useState('');
  const [isConfirmingNameReset, setIsConfirmingNameReset] = useState(false);

  // PAR edit states
  const [isParEditOpen, setIsParEditOpen] = useState(false);
  const [selectedParCell, setSelectedParCell] = useState<{ holeIndex: number; courseIndex: number } | null>(null);
  const [tempPar, setTempPar] = useState('');

  // 코스 전환 시 입력폼 및 진행 상태 완전 초기화
  useEffect(() => {
    setSelectedCell(null);
    setTempScore('');
    setIsNumberPadOpen(false);
    setIsEditing(false);
    setPlayerStartHole([null, null, null, null]);
    setPlayerInputOrder([[], [], [], []]);
    setPlayerCurrentStep([0, 0, 0, 0]);
  }, [activeCourseIndex]);

  // 점수 리셋/전체 리셋 시에도 상태 동기화(useEffect에서 이미 보장됨)

  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [tempPlayerNames, setTempPlayerNames] = useState(playerNames);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signingPlayerIndex, setSigningPlayerIndex] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isConfirmingSave, setIsConfirmingSave] = useState(false);
  const [isConfirmingSaveAndDelete, setIsConfirmingSaveAndDelete] = useState(false);
  const [isConfirmingCourseReset, setIsConfirmingCourseReset] = useState(false);
  const [isConfirmingAllReset, setIsConfirmingAllReset] = useState(false);

  // [플레이어별 시작홀/진행상태 state 배열로 관리]
  const [playerStartHole, setPlayerStartHole] = useState<(number | null)[]>([null, null, null, null]); // 각 플레이어별 시작홀
  const [playerInputOrder, setPlayerInputOrder] = useState<{ hole: number, player: number }[][]>([[], [], [], []]); // 각 플레이어별 입력 순서
  const [playerCurrentStep, setPlayerCurrentStep] = useState<number[]>([0, 0, 0, 0]); // 각 플레이어별 현재 입력 인덱스

  // [상태 동기화: playerStartHole이 바뀔 때 필요한 경우만 order 생성]
  useEffect(() => {
    setPlayerInputOrder(prev => prev.map((order, idx) => {
      if (playerStartHole[idx] !== null && (order.length === 0 || (order[0]?.hole !== playerStartHole[idx]))) {
        return makePlayerInputOrder(playerStartHole[idx] as number, idx);
      }
      return order;
    }));
    // 여기서 step을 0으로 강제 초기화하는 로직이 handleSaveScore와 충돌하여 삭제/수정함
  }, [playerStartHole]);

  // 수정 모드 state 추가
  const [isEditing, setIsEditing] = useState(false);

  // 1. 캡처 시 서명 줄 제외를 위한 state 추가
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!courseId) return;

    const savedCourses = localStorage.getItem('golfCoursesList');
    if (savedCourses) {
      const courses: Course[] = JSON.parse(savedCourses);
      const currentCourse = courses.find(c => c.id === courseId);
      if (currentCourse) {
        setCourse(currentCourse);

        const savedGameState = localStorage.getItem(`gameState_${courseId}`);
        if (savedGameState) {
          const gameState = JSON.parse(savedGameState);
          setPlayerNames(gameState.playerNames || DEFAULT_NAMES);
          setAllScores(gameState.allScores || Array.from({ length: currentCourse.courses.length }, () => Array.from({ length: HOLE_COUNT }, () => Array(4).fill(''))));
          setSignatures(gameState.signatures || Array.from({ length: currentCourse.courses.length }, () => Array(4).fill(null)));
        } else {
          const numCourses = currentCourse.courses.length;
          setAllScores(Array.from({ length: numCourses }, () => Array.from({ length: HOLE_COUNT }, () => Array(4).fill(''))));
          setSignatures(Array.from({ length: numCourses }, () => Array(4).fill(null)));
        }
      } else {
        toast({ title: "오류", description: "구장 정보를 찾을 수 없습니다.", variant: "destructive", duration: 2000 });
        router.push('/');
      }
    } else if (courseId) {
      router.push('/');
    }
  }, [courseId, router, toast]);

  useEffect(() => {
    if (isClient && course) {
      const gameState = { playerNames, allScores, signatures };
      localStorage.setItem(`gameState_${courseId}`, JSON.stringify(gameState));
    }
  }, [playerNames, allScores, signatures, isClient, course, courseId]);

  const scores = useMemo(() => allScores[activeCourseIndex] || [], [allScores, activeCourseIndex]);

  const handleResetCourse = () => {
    const newScores = [...allScores];
    newScores[activeCourseIndex] = Array.from({ length: HOLE_COUNT }, () => Array(4).fill(''));
    setAllScores(newScores);

    const newSignatures = [...signatures];
    newSignatures[activeCourseIndex] = Array(4).fill(null);
    setSignatures(newSignatures);

    // 진행 상태도 초기화
    setPlayerStartHole([null, null, null, null]);
    setPlayerInputOrder([[], [], [], []]);
    setPlayerCurrentStep([0, 0, 0, 0]);
    setIsEditing(false);
    setSelectedCell(null);
    setTempScore('');

    toast({ title: "초기화 완료", description: `${course?.courses[activeCourseIndex].name} 코스의 점수와 서명이 초기화되었습니다.`, duration: 2000 });
    setIsConfirmingCourseReset(false);
  };

  const handleResetAll = () => {
    if (!course) return;
    const numCourses = course.courses.length;
    setAllScores(Array.from({ length: numCourses }, () => Array.from({ length: HOLE_COUNT }, () => Array(4).fill(''))));
    setSignatures(Array.from({ length: numCourses }, () => Array(4).fill(null)));

    // 진행 상태도 초기화
    setPlayerStartHole([null, null, null, null]);
    setPlayerInputOrder([[], [], [], []]);
    setPlayerCurrentStep([0, 0, 0, 0]);
    setIsEditing(false);
    setSelectedCell(null);
    setTempScore('');

    toast({ title: "전체 초기화 완료", description: "모든 코스의 점수와 서명이 초기화되었습니다.", duration: 2000 });
    setIsConfirmingAllReset(false);
  };

  const totalScoresByCourse = useMemo(() => {
    return (courseScores: string[][]) => {
      if (!courseScores || courseScores.length === 0) return Array(4).fill(0);
      return Array(4).fill(0).map((_, playerIndex) =>
        courseScores.reduce((total, holeScores) => {
          const score = parseInt(holeScores?.[playerIndex], 10);
          return total + (isNaN(score) ? 0 : score);
        }, 0)
      );
    }
  }, []);

  const handleScoreChange = (newScores: string[][]) => {
    const newAllScores = [...allScores];
    newAllScores[activeCourseIndex] = newScores;
    setAllScores(newAllScores);
  };

  // [플레이어별 입력 순서 배열 생성 함수]
  function makePlayerInputOrder(startHole: number, playerIdx: number) {
    const order: { hole: number, player: number }[] = [];
    for (let i = 0; i < HOLE_COUNT; i++) {
      const hole = (startHole + i) % HOLE_COUNT;
      order.push({ hole, player: playerIdx });
    }
    return order;
  }

  // [셀 상태 계산 함수: 플레이어별로]
  function getCellStatus(holeIdx: number, playerIdx: number) {
    if (playerStartHole[playerIdx] === null) return 'open'; // 아직 시작 전: 모두 열림
    const order = playerInputOrder[playerIdx];
    const idx = order.findIndex(o => o.hole === holeIdx && o.player === playerIdx);
    if (idx === -1) return 'disabled';
    if (idx < playerCurrentStep[playerIdx]) return 'locked'; // 이미 입력됨(잠김)
    if (idx === playerCurrentStep[playerIdx]) return 'open'; // 현재 입력 가능
    return 'disabled'; // 아직 입력 순서 아님(비활성화)
  }

  // 모달 상태 완전 초기화 함수
  function resetNumberPadState() {
    setIsNumberPadOpen(false);
    setSelectedCell(null);
    setTempScore('');
    setIsEditing(false);
  }

  // handleCellClick 보완: 깜빡임 제거
  const handleCellClick = (holeIndex: number, playerIndex: number, e?: React.MouseEvent) => {
    const status = getCellStatus(holeIndex, playerIndex);
    const isDouble = e && e.detail === 2;

    if (status === 'open') {
      setIsEditing(false);
      // 아직 시작하지 않은 플레이어라면 시작 홀 설정
      if (playerStartHole[playerIndex] === null) {
        const newStartHole = [...playerStartHole];
        newStartHole[playerIndex] = holeIndex;
        setPlayerStartHole(newStartHole);
        const newOrder = [...playerInputOrder];
        newOrder[playerIndex] = makePlayerInputOrder(holeIndex, playerIndex);
        setPlayerInputOrder(newOrder);
        const newStep = [...playerCurrentStep];
        newStep[playerIndex] = 0;
        setPlayerCurrentStep(newStep);
      }
      setSelectedCell({ holeIndex, playerIndex });
      setTempScore(scores[holeIndex]?.[playerIndex] || '');
      setIsNumberPadOpen(true);
    } else if (status === 'locked') {
      if (isDouble) {
        setIsEditing(true); // 수정 모드 진입
        setSelectedCell({ holeIndex, playerIndex });
        setTempScore(scores[holeIndex]?.[playerIndex] || '');
        setIsNumberPadOpen(true);
      } else {
        toast({ title: '수정 불가', description: '이미 입력된 칸입니다. 더블터치(더블클릭)로만 수정할 수 있습니다.', duration: 2000 });
      }
    } else if (status === 'disabled') {
      if (isDouble) {
        setIsEditing(true); // 비활성화 칸도 더블클릭 시 수정 모드 진입
        setSelectedCell({ holeIndex, playerIndex });
        setTempScore(scores[holeIndex]?.[playerIndex] || '');
        setIsNumberPadOpen(true);
      } else {
        const currentStep = playerCurrentStep[playerIndex];
        const order = playerInputOrder[playerIndex];
        const targetStepIdx = order.findIndex(o => o.hole === holeIndex);

        // 현재 차례인 홀의 인덱스 확인
        const currentHoleOrderIdx = order[currentStep]?.hole;
        const currentScore = scores[currentHoleOrderIdx]?.[playerIndex];
        const isCurrentHoleFilled = currentScore && currentScore.trim() !== '';

        // 점수가 입력되었는데 아직 저장되지 않은 상태에서 '바로 다음 홀'을 터치한 경우만 특별 안내
        if (targetStepIdx === currentStep + 1 && isCurrentHoleFilled) {
          toast({ title: '저장 필요', description: '이전 홀 점수를 먼저 저장하세요.', duration: 2000 });
        } else {
          toast({ title: '입력 순서 아님', description: '아직 입력할 차례가 아닙니다. 더블클릭으로 강제 수정이 가능합니다.', duration: 2000 });
        }
      }
    } else {
      toast({ title: '입력 순서 아님', description: '아직 입력할 차례가 아닙니다.', duration: 2000 });
    }
  };

  // handleSaveScore 개선: 원자적 업데이트로 깜빡임 방지 및 순서 로직 강화
  const handleSaveScore = () => {
    const wasEditingStatus = isEditing; // 기존 수정 모드 여부 저장
    setIsEditing(false);
    resetNumberPadState();

    const newStartHole = [...playerStartHole];
    const newOrder = [...playerInputOrder];
    const newStep = [...playerCurrentStep];
    let updated = false;

    for (let playerIdx = 0; playerIdx < 4; playerIdx++) {
      // 1. 시작홀이 지정되지 않은 경우 초기화
      if (newStartHole[playerIdx] === null) {
        const inputHoleIdx = scores.findIndex(row => row[playerIdx] && row[playerIdx].trim() !== '');
        if (inputHoleIdx !== -1) {
          newStartHole[playerIdx] = inputHoleIdx;
          newOrder[playerIdx] = makePlayerInputOrder(inputHoleIdx, playerIdx);
          newStep[playerIdx] = 0;
          updated = true;
        }
      }

      // 2. 이미 시작되었거나 방금 시작된 플레이어의 단계 진행 (빈 칸을 찾을 때까지 전진)
      if (newStartHole[playerIdx] !== null) {
        let currentStep = newStep[playerIdx];
        const currentOrder = newOrder[playerIdx];

        while (currentOrder.length > 0 && currentStep < currentOrder.length) {
          const { hole } = currentOrder[currentStep];
          if (scores[hole]?.[playerIdx] && scores[hole][playerIdx].trim() !== '') {
            currentStep++;
            newStep[playerIdx] = currentStep;
            updated = true;
          } else {
            break;
          }
        }
      }
    }

    if (updated) {
      setPlayerStartHole(newStartHole);
      setPlayerInputOrder(newOrder);
      setPlayerCurrentStep(newStep);

      if (wasEditingStatus) {
        toast({ title: '수정 완료', description: '점수가 변경되었습니다.', duration: 1200 });
      }
    } else if (!wasEditingStatus) {
      toast({ title: '저장 완료', description: '입력된 내용이 없습니다.', duration: 1500 });
    }
  };


  // handleCancelNumberPad 보완
  const handleCancelNumberPad = () => {
    setIsEditing(false);
    resetNumberPadState();
    // 점수 상태 변경 없이 모달만 닫음
  };

  const handleOpenNameModal = () => { setTempPlayerNames(playerNames); setIsNameModalOpen(true); };
  const handleSaveNames = () => {
    const finalNames = tempPlayerNames.map((name, index) => name.trim() === '' ? DEFAULT_NAMES[index] : name);
    setPlayerNames(finalNames); setIsNameModalOpen(false);
  };

  const handleOpenSignatureModal = (playerIndex: number) => { setSigningPlayerIndex(playerIndex); setIsSignatureModalOpen(true); };
  const handleSaveSignature = () => {
    if (canvasRef.current && signingPlayerIndex !== null) {
      const signatureDataUrl = canvasRef.current.toDataURL('image/png');
      const newSignaturesForCourse = [...(signatures[activeCourseIndex] || Array(4).fill(null))];
      newSignaturesForCourse[signingPlayerIndex] = signatureDataUrl;

      const newAllSignatures = [...signatures];
      newAllSignatures[activeCourseIndex] = newSignaturesForCourse;
      setSignatures(newAllSignatures);
      handleCloseSignatureModal();
    }
  };
  const handleCloseSignatureModal = () => { setIsSignatureModalOpen(false); setSigningPlayerIndex(null); contextRef.current = null; };
  const clearCanvas = () => { const canvas = canvasRef.current; if (canvas && contextRef.current) { contextRef.current.clearRect(0, 0, canvas.width, canvas.height); prepareCanvas(); } };

  const handleTabSwitch = (newTabValue: string) => {
    if (course) {
      setActiveCourseIndex(course.courses.findIndex(c => c.name === newTabValue));
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      toast({ title: "공유 기능 미지원", description: "사용 중인 브라우저에서는 공유 기능을 지원하지 않습니다.", variant: "destructive", duration: 2000 });
      return;
    }

    toast({ title: "이미지 생성 중...", description: "스코어카드 이미지를 만들고 있습니다. 잠시만 기다려주세요.", duration: 2000 });

    if (!course) return;

    setIsCapturing(true); // 캡처 시작
    await new Promise((r) => setTimeout(r, 100)); // 렌더링 대기

    const filesToShare: File[] = [];
    const now = new Date();
    const timestamp = now.toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    });

    for (let i = 0; i < course.courses.length; i++) {
      const courseScores = allScores[i] || [];
      const hasScores = courseScores.flat?.().some(s => s !== '');

      if (hasScores) {
        const elementId = `captureArea-${course.courses[i].name}`;
        const captureArea = document.getElementById(elementId);

        if (captureArea) {
          // 헤더 생성
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

          captureArea.style.position = 'relative';
          captureArea.style.paddingTop = '80px'; // 헤더 공간 확보
          captureArea.insertBefore(headerEl, captureArea.firstChild);

          try {
            const canvas = await html2canvas(captureArea, { scale: 2, useCORS: true });
            const dataUrl = canvas.toDataURL('image/png');
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `${course.name}-${course.courses[i].name}-스코어.png`, { type: 'image/png' });
            filesToShare.push(file);
          } catch (error) {
            console.error('Canvas 생성 오류:', error);
            toast({ title: "이미지 생성 실패", description: `${course.courses[i].name} 코스 이미지 생성에 실패했습니다.`, variant: "destructive", duration: 2000 });
          } finally {
            captureArea.removeChild(headerEl);
            captureArea.style.position = '';
            captureArea.style.paddingTop = '';
          }
        }
      }
    }

    setIsCapturing(false); // 캡처 끝

    if (filesToShare.length > 0) {
      try {
        await navigator.share({
          files: filesToShare,
          title: `${course.name} 스코어카드`,
          text: `[${course.name}] 경기 결과를 공유합니다.`,
        });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('공유 실패:', error);
          toast({ title: "공유 실패", description: "스코어카드 공유 중 오류가 발생했습니다.", variant: "destructive", duration: 2000 });
        }
      }
    } else {
      toast({ title: "공유할 내용 없음", description: "점수가 입력된 코스가 없습니다.", duration: 2000 });
    }
  };

  const handleSaveRecord = () => {
    if (!course) return;

    const playedIndices = course.courses
      .map((_, index) => index)
      .filter(index => allScores[index]?.flat().some(s => s.trim() !== ''));

    if (playedIndices.length === 0) {
      toast({ title: "저장할 기록 없음", description: "점수를 먼저 입력해주세요.", variant: 'destructive', duration: 2000 });
      return;
    }

    // 이미 저장된 코스 정보 불러오기
    const savedRecords = localStorage.getItem('golfGameRecords');
    let records: GameRecord[] = savedRecords ? JSON.parse(savedRecords) : [];

    // 점수까지 모두 비교하여 완전히 동일한 기록만 중복으로 간주
    const newIndices = playedIndices.filter(idx => {
      const thisCourseName = course.courses[idx].name;
      const thisScore = JSON.stringify(allScores[idx]);
      // 같은 courseId, 같은 playerNames, 같은 코스명, 그리고 점수까지 모두 같은 기록이 이미 있는지 확인
      const isDuplicate = records.some(record =>
        record.courseId === course.id &&
        JSON.stringify(record.playerNames) === JSON.stringify(playerNames) &&
        record.playedCourses[0]?.name === thisCourseName &&
        JSON.stringify(record.allScores[0]) === thisScore
      );
      return !isDuplicate;
    });
    if (newIndices.length === 0) {
      setIsConfirmingSave(false); // 안내 모달 닫기
      toast({ title: "저장할 새로운 기록 없음", description: "이미 저장된 코스는 제외되었습니다.", duration: 2000 });
      return;
    }

    // 코스별로 개별 기록으로 저장
    newIndices.forEach(idx => {
      const newRecord: GameRecord = {
        id: Date.now().toString() + '-' + idx,
        date: new Date().toISOString(),
        courseId: course.id,
        courseName: course.name,
        playerNames: playerNames,
        allScores: [allScores[idx]],
        signatures: [signatures[idx] || []],
        playedCourses: [course.courses[idx]],
      };
      records.unshift(newRecord);
    });
    localStorage.setItem('golfGameRecords', JSON.stringify(records));
    toast({ title: "점수를 저장하였습니다", description: '', duration: 2000 });
  };


  useEffect(() => { if (isSignatureModalOpen) { prepareCanvas(); } }, [isSignatureModalOpen]);
  const prepareCanvas = () => { const canvas = canvasRef.current; if (canvas) { const dpr = window.devicePixelRatio || 1; canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr; const ctx = canvas.getContext('2d'); if (ctx) { ctx.scale(dpr, dpr); ctx.lineCap = 'round'; ctx.strokeStyle = 'black'; ctx.lineWidth = 2; contextRef.current = ctx; } } };
  const getCoords = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => { const canvas = canvasRef.current; if (!canvas) return { offsetX: 0, offsetY: 0 }; const rect = canvas.getBoundingClientRect(); const nativeEvent = 'nativeEvent' in event ? event.nativeEvent : event; if (window.TouchEvent && nativeEvent instanceof TouchEvent) { if (nativeEvent.touches.length > 0) { return { offsetX: nativeEvent.touches[0].clientX - rect.left, offsetY: nativeEvent.touches[0].clientY - rect.top }; } } else if (nativeEvent instanceof MouseEvent) { return { offsetX: nativeEvent.offsetX, offsetY: nativeEvent.offsetY }; } return { offsetX: 0, offsetY: 0 }; };
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => { e.preventDefault(); if (!contextRef.current) return; const { offsetX, offsetY } = getCoords(e); contextRef.current.beginPath(); contextRef.current.moveTo(offsetX, offsetY); setIsDrawing(true); };
  const finishDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => { e.preventDefault(); if (!contextRef.current) return; contextRef.current.closePath(); setIsDrawing(false); };
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => { e.preventDefault(); if (!isDrawing || !contextRef.current) return; const { offsetX, offsetY } = getCoords(e); contextRef.current.lineTo(offsetX, offsetY); contextRef.current.stroke(); };

  // 숫자패드 입력 함수: 수정 모드에서는 덮어쓰기, 입력 모드에서는 append
  const handleNumberPadInput = (value: string) => {
    if (!selectedCell) return;
    const { holeIndex, playerIndex } = selectedCell;
    let newValue = '';
    if (value === '') {
      newValue = '';
    } else if (isEditing) {
      newValue = value; // 수정 모드: 덮어쓰기
    } else {
      newValue = tempScore === '0' ? value : tempScore + value; // 입력 모드: append
    }
    setTempScore(newValue);
    // 즉시 점수 저장
    const newScoresForCourse = scores.map((row, hIdx) => {
      if (hIdx !== holeIndex) return row || Array(4).fill('');
      const newRow = [...(row || Array(4).fill(''))];
      newRow[playerIndex] = newValue;
      return newRow;
    });
    handleScoreChange(newScoresForCourse);
  };

  // PAR 수정 핸들러
  const handleParCellDoubleClick = (holeIndex: number, courseIndex: number) => {
    setSelectedParCell({ holeIndex, courseIndex });
    setTempPar(String(course?.courses[courseIndex].pars[holeIndex] || 3));
    setIsParEditOpen(true);
  };

  const handleParInput = (value: string) => {
    if (value === '') {
      setTempPar('');
    } else {
      setTempPar(value);
    }
  };

  const handleSavePar = () => {
    if (!selectedParCell || !course) return;

    const newPar = parseInt(tempPar, 10);
    if (isNaN(newPar) || newPar <= 0 || newPar > 9) {
      toast({ title: "잘못된 입력", description: "PAR는 1~9 사이의 숫자여야 합니다.", variant: "destructive", duration: 2000 });
      return;
    }

    // 코스 정보 업데이트
    const updatedCourse = { ...course };
    updatedCourse.courses[selectedParCell.courseIndex].pars[selectedParCell.holeIndex] = newPar;
    setCourse(updatedCourse);

    // localStorage에 저장
    const savedCourses = localStorage.getItem('golfCoursesList');
    if (savedCourses) {
      const courses: Course[] = JSON.parse(savedCourses);
      const courseIndex = courses.findIndex(c => c.id === courseId);
      if (courseIndex !== -1) {
        courses[courseIndex] = updatedCourse;
        localStorage.setItem('golfCoursesList', JSON.stringify(courses));
      }
    }

    toast({ title: "PAR 수정 완료", description: `${selectedParCell.holeIndex + 1}번 홀 PAR가 ${newPar}로 변경되었습니다.`, duration: 2000 });
    setIsParEditOpen(false);
    setSelectedParCell(null);
    setTempPar('');
  };

  const handleCancelParEdit = () => {
    setIsParEditOpen(false);
    setSelectedParCell(null);
    setTempPar('');
  };

  const handleSaveButtonClick = () => {
    if (!course) return;
    const playedIndices = course.courses
      .map((_, index) => index)
      .filter(index => allScores[index]?.flat().some(s => s.trim() !== ''));
    if (playedIndices.length === 0) {
      toast({ title: "저장할 기록 없음", description: "점수를 먼저 입력해주세요.", variant: 'destructive', duration: 2000 });
      return;
    }
    const savedRecords = localStorage.getItem('golfGameRecords');
    let records: GameRecord[] = savedRecords ? JSON.parse(savedRecords) : [];
    // 점수까지 모두 비교하여 완전히 동일한 기록만 중복으로 간주
    const newIndices = playedIndices.filter(idx => {
      const thisCourseName = course.courses[idx].name;
      const thisScore = JSON.stringify(allScores[idx]);
      const isDuplicate = records.some(record =>
        record.courseId === course.id &&
        JSON.stringify(record.playerNames) === JSON.stringify(playerNames) &&
        record.playedCourses[0]?.name === thisCourseName &&
        JSON.stringify(record.allScores[0]) === thisScore
      );
      return !isDuplicate;
    });
    if (newIndices.length === 0) {
      toast({ title: "저장할 새로운 기록 없음", description: "이미 저장된 코스는 제외되었습니다.", duration: 2000 });
      return;
    }
    setIsConfirmingSave(true);
  };

  if (!isClient || !course) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }


  const theme = `course-${(course.courses[activeCourseIndex]?.name || 'a').toLowerCase()}`;
  const themeColor = getThemeColor(course.courses[activeCourseIndex]?.name);
  const isWhiteTheme = course.courses[activeCourseIndex]?.name?.toLowerCase() === 'd';
  const numberPadButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

  return (
    <div data-theme={theme} className="container mx-auto p-1 py-2 bg-card rounded-2xl shadow-lg my-4 max-w-[375px] flex flex-col min-h-[95vh]"
      style={{
        '--theme-color': themeColor,
        '--theme-shadow-color': 'rgba(30,136,229,0.10)',
      } as React.CSSProperties}
    >
      <header className="flex items-center p-2 mb-2">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')}> <ArrowLeft /> </Button>
        <h1 className="text-xl font-bold mx-auto">{course.name}</h1>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            aria-label="공유하기"
            className="p-1"
          >
            <img
              src="/images/share-icon.png"
              alt="공유하기"
              className="h-6 w-6 object-contain"
            />
          </Button>

        </div>
      </header>

      <div className="tab-scroll flex w-full mb-2 gap-1">
        {course.courses.map((c, idx) => (
          <button
            key={c.name}
            className={`tab-btn${activeCourseIndex === idx ? ' selected' : ''}`}
            onClick={() => setActiveCourseIndex(idx)}
            style={activeCourseIndex === idx ? { background: getThemeColor(c.name), color: (idx === 2 || (isWhiteTheme && idx === 3)) ? '#222' : '#fff' } : {}}
          >
            {c.name} 코스
          </button>
        ))}
      </div>

      <div className="flex-grow">
        {course.courses.map((subCourse, courseIdx) => {
          const currentScores = allScores[courseIdx] || [];
          return (
            <div
              key={subCourse.name}
              className={`mt-0 h-full ${activeCourseIndex !== courseIdx ? "hidden" : ""}`}
            >
              <div id={`captureArea-${subCourse.name}`} className={cn(
                "overflow-x-auto bg-card rounded-lg px-2 pt-2 h-full",
                isCapturing ? "pb-8 min-h-[650px]" : "pb-2 min-h-0"
              )}>
                <Table className="min-w-full border-separate border-spacing-x-0 table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hole-header text-center font-normal text-base p-0 w-8 min-w-0 max-w-8">홀</TableHead>
                      <TableHead className="par-header text-center font-normal text-base p-0 w-8 min-w-0 max-w-8 pr-2">Par</TableHead>
                      {playerNames.map((name, idx) => (
                        <TableHead
                          key={idx}
                          className="name-header text-center font-bold text-base p-0 w-auto cursor-pointer hover:text-primary"
                          onClick={handleOpenNameModal}
                          title="이름 변경"
                          style={{ userSelect: 'none' }}
                        >
                          {name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: HOLE_COUNT }).map((_, holeIndex) => {
                      return (
                        <TableRow key={holeIndex} className="border-b-0">
                          <TableCell className="hole-cell">{holeIndex + 1}</TableCell>
                          <TableCell
                            className="par-cell text-center text-xl p-0 font-normal cursor-pointer hover:bg-blue-50 transition-colors select-none"
                            onDoubleClick={() => handleParCellDoubleClick(holeIndex, courseIdx)}
                            onTouchEnd={(e) => {
                              const now = Date.now();
                              const lastTap = (e.currentTarget as any).lastTap || 0;
                              if (now - lastTap < 300) {
                                e.preventDefault();
                                handleParCellDoubleClick(holeIndex, courseIdx);
                              }
                              (e.currentTarget as any).lastTap = now;
                            }}
                            title="더블클릭하여 PAR 수정"
                            style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
                          >
                            {subCourse.pars[holeIndex]}
                          </TableCell>
                          {Array.from({ length: 4 }).map((_, playerIndex) => {
                            const score = currentScores[holeIndex]?.[playerIndex];
                            const par = subCourse.pars[holeIndex];
                            const diff = score && !isNaN(parseInt(score)) ? parseInt(score) - Number(par) : null;

                            return (
                              <TableCell key={playerIndex} className="score-cell p-0 py-0 text-center align-middle">
                                <button type="button"
                                  onClick={(e) => handleCellClick(holeIndex, playerIndex, e)}
                                  onDoubleClick={(e) => handleCellClick(holeIndex, playerIndex, e)}
                                  className={`w-full text-center rounded-none border border-1 focus:outline-none p-0 m-0 transition-opacity ${getCellStatus(holeIndex, playerIndex) === 'locked' ? 'text-muted-foreground' : ''} ${getCellStatus(holeIndex, playerIndex) === 'open' && playerStartHole[playerIndex] !== null ? 'is-next-hole' : ''}`}
                                  style={{ margin: 0, padding: 0, borderRadius: 4, borderWidth: 1.5, height: '56px', minHeight: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    width: '100%',
                                    lineHeight: 1,
                                    position: 'relative',
                                    gap: '4px',
                                  }}>
                                    <span style={{
                                      fontSize: '1.8rem',
                                      fontWeight: 700,
                                      color: '#222',
                                      lineHeight: 1,
                                      display: 'block',
                                      marginTop: '-8px',
                                    }}>
                                      {(isNumberPadOpen && selectedCell && selectedCell.holeIndex === holeIndex && selectedCell.playerIndex === playerIndex)
                                        ? tempScore || ''
                                        : score || ''}
                                    </span>
                                    {diff !== null && (
                                      <span style={{
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        color: diff > 0 ? '#e53935' : diff < 0 ? '#2563eb' : '#adb5bd',
                                        display: 'block',
                                        lineHeight: 1,
                                        marginBottom: '-8px',
                                      }}>
                                        {diff === 0 ? 'E' : diff > 0 ? `+${diff}` : `${diff}`}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              </TableCell>

                            );
                          })}
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-muted hover:bg-muted" style={{ height: '64px' }}>
                      <TableCell colSpan={2} className="text-center font-bold text-lg p-1 rounded-none align-middle" style={{ borderRadius: 0, height: '64px', verticalAlign: 'middle' }} >합계</TableCell>
                      {totalScoresByCourse(currentScores).map((total, pIdx) => (
                        <TableCell key={pIdx} className="text-center font-bold p-1 rounded-none align-middle" style={{ borderRadius: 0, height: '64px', verticalAlign: 'middle', fontSize: '1.8rem', color: '#222' }} >{total || ''}</TableCell>
                      ))}
                    </TableRow>
                    {!isCapturing && (
                      <TableRow className="bg-muted hover:bg-muted">
                        <TableCell colSpan={2} className="text-center font-bold text-lg p-1 rounded-none" style={{ borderRadius: 0 }} >서명</TableCell>
                        {Array.from({ length: 4 }).map((_, index) => {
                          const currentSignatures = signatures[courseIdx] || [];
                          return (
                            <TableCell key={index} className="text-center h-12 p-1 cursor-pointer hover:bg-primary/5 rounded-none" style={{ borderRadius: 0 }} onClick={() => handleOpenSignatureModal(index)}>
                              {currentSignatures[index] ? <img src={currentSignatures[index]} alt="signature" className="mx-auto h-full object-contain" /> : <span className="text-muted-foreground">싸인</span>}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto pt-4 space-y-2 px-2">
        <div className="flex w-full gap-1">
          <Button
            onClick={() => setIsConfirmingNameReset(true)}
            className="h-10 text-sm flex-1 min-w-0 px-1 rounded-[2px] border-none shadow-none font-bold"
            style={{ background: '#4CAF50', color: 'white', border: 'none', boxShadow: 'none', borderRadius: '2px', paddingLeft: 0, paddingRight: 0, fontSize: '0.95rem', minWidth: 0 }}
          >
            이름초기화
          </Button>
          <Button onClick={() => setIsConfirmingAllReset(true)} className="h-10 text-sm flex-1 min-w-0 px-1 bg-red-500 text-white rounded-[2px] border-none shadow-none hover:bg-red-600" style={{ paddingLeft: 0, paddingRight: 0, fontSize: '0.95rem', minWidth: 0 }}>
            점수초기화
          </Button>
          <Button
            onClick={handleSaveButtonClick}
            className="h-10 text-sm flex-1 min-w-0 px-1 bg-blue-500 text-white font-bold rounded-[2px] border-none shadow-none hover:bg-blue-600"
            style={{ paddingLeft: 0, paddingRight: 0, fontSize: '0.95rem', minWidth: 0 }}
          >
            기록보관
          </Button>
        </div>
      </div>

      {isNumberPadOpen && selectedCell && (
        <div
          className={cn(
            'fixed left-0 right-0 z-[9999] p-1 bg-[#212529] transition-transform duration-300 flex flex-col items-center',
            {
              'bottom-0 rounded-t-2xl': selectedCell.holeIndex < 7,
              'top-0 rounded-b-2xl': selectedCell.holeIndex >= 7,
            }
          )}
          style={{ maxWidth: '100vw', width: '100%', left: 0, transform: 'none', margin: 0 }}
        >
          <div className="grid grid-cols-5 gap-1 w-full max-w-xs mx-auto">
            {numberPadButtons.slice(0, 5).map(num => (
              <Button key={num} onClick={() => handleNumberPadInput(num)} className="h-10 text-base bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl select-none" style={{ fontSize: '1.1rem', WebkitTextSizeAdjust: 'none', MozTextSizeAdjust: 'none', textSizeAdjust: 'none', padding: 0 }}>{num}</Button>
            ))}
            {numberPadButtons.slice(5).map(num => (
              <Button key={num} onClick={() => handleNumberPadInput(num)} className="h-10 text-base bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl select-none" style={{ fontSize: '1.1rem', WebkitTextSizeAdjust: 'none', MozTextSizeAdjust: 'none', textSizeAdjust: 'none', padding: 0 }}>{num}</Button>
            ))}
            <div className="col-span-5 flex w-full gap-1">
              <Button
                onClick={() => handleNumberPadInput('')}
                className="h-10 text-base bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl flex-1"
                style={{
                  flex: '1 0 25%',
                  maxWidth: '25%',
                  fontSize: '1.1rem',
                  WebkitTextSizeAdjust: 'none',
                  MozTextSizeAdjust: 'none',
                  textSizeAdjust: 'none',
                  padding: 0
                }}
              >
                삭제
              </Button>
              <Button
                onClick={handleCancelNumberPad}
                className="h-10 text-base bg-gray-500 hover:bg-gray-400 text-white font-semibold rounded-xl flex-1"
                style={{
                  flex: '1 0 25%',
                  maxWidth: '25%',
                  fontSize: '1.1rem',
                  WebkitTextSizeAdjust: 'none',
                  MozTextSizeAdjust: 'none',
                  textSizeAdjust: 'none',
                  padding: 0
                }}
              >
                취소
              </Button>
              <Button
                onClick={handleSaveScore}
                className="h-10 text-base bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex-1"
                style={{
                  flex: '2 0 50%',
                  maxWidth: '50%',
                  fontSize: '1.1rem',
                  WebkitTextSizeAdjust: 'none',
                  MozTextSizeAdjust: 'none',
                  textSizeAdjust: 'none',
                  padding: 0
                }}
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PAR 수정 모달 */}
      {isParEditOpen && selectedParCell && (
        <div
          className="fixed left-0 right-0 bottom-0 z-[9999] p-1 bg-[#212529] rounded-t-2xl transition-transform duration-300 flex flex-col items-center"
          style={{ maxWidth: '100vw', width: '100%', left: 0, transform: 'none', margin: 0 }}
        >
          <div className="text-white text-lg font-bold mb-2 mt-2">
            {selectedParCell.holeIndex + 1}번 홀 PAR 수정
          </div>
          <div className="text-white text-3xl font-bold mb-3">
            {tempPar || '?'}
          </div>
          <div className="w-full max-w-xs mx-auto">
            <div className="grid grid-cols-3 gap-1 mb-3">
              {['3', '4', '5'].map(num => (
                <Button
                  key={num}
                  onClick={() => handleParInput(num)}
                  className="h-10 text-base bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl select-none"
                  style={{ fontSize: '1.1rem', padding: 0 }}
                >
                  {num}
                </Button>
              ))}
            </div>
            <div className="flex w-full gap-1">
              <Button
                onClick={() => handleParInput('')}
                className="h-10 text-base bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl flex-1"
                style={{ flex: '1 0 25%', maxWidth: '25%', fontSize: '1.1rem', padding: 0 }}
              >
                삭제
              </Button>
              <Button
                onClick={handleCancelParEdit}
                className="h-10 text-base bg-gray-500 hover:bg-gray-400 text-white font-semibold rounded-xl flex-1"
                style={{ flex: '1 0 25%', maxWidth: '25%', fontSize: '1.1rem', padding: 0 }}
              >
                취소
              </Button>
              <Button
                onClick={handleSavePar}
                className="h-10 text-base bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex-1"
                style={{ flex: '2 0 50%', maxWidth: '50%', fontSize: '1.1rem', padding: 0 }}
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      )}

      {isNameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card text-card-foreground rounded-2xl p-6 w-full max-w-[340px] mx-4 shadow-xl">
            <div className="flex flex-col gap-4">
              {tempPlayerNames.map((name, index) => (<div key={index}><Label htmlFor={`player-name-${index}`} className="font-semibold text-lg mb-1.5 block">이름 {index + 1}</Label>
                <div className="flex items-center gap-2">
                  <Input id={`player-name-${index}`} type="text" value={name === DEFAULT_NAMES[index] ? '' : name} onChange={(e) => { const newNames = [...tempPlayerNames]; newNames[index] = e.target.value; setTempPlayerNames(newNames) }} placeholder={index === 0 ? '본인을 여기에!' : '이름을 입력하세요'} className="h-14 text-lg" />
                  <Button variant="ghost" size="icon" className="h-14 w-14 text-muted-foreground" onClick={() => { const newNames = [...tempPlayerNames]; newNames[index] = ''; setTempPlayerNames(newNames) }}><X className="h-6 w-6" /></Button>
                </div></div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-6">
              <Button onClick={() => setTempPlayerNames(Array(4).fill(''))} className="h-12 text-base bg-red-500 text-white hover:bg-red-600">초기화</Button>
              <Button onClick={handleSaveNames} className="h-12 text-base bg-blue-700 text-white hover:bg-blue-800">저장</Button>
              <button
                onClick={() => setIsNameModalOpen(false)}
                style={{
                  backgroundColor: '#61666c',
                  color: '#fff',
                  height: '3rem',
                  fontSize: '1rem',
                  border: 'none',
                  borderRadius: '0.75rem',
                  boxShadow: 'none',
                  width: '100%'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {isSignatureModalOpen && signingPlayerIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onTouchMove={e => e.preventDefault()}>
          <div className="bg-card text-card-foreground rounded-2xl p-6 w-full max-w-[340px] mx-4 shadow-xl flex flex-col gap-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold">{playerNames[signingPlayerIndex]}</h2>
              <p className="text-4xl text-primary font-bold mt-1">Score: {totalScoresByCourse(scores)[signingPlayerIndex]}</p>
            </div>
            <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseUp={finishDrawing} onMouseMove={draw} onMouseLeave={finishDrawing} onTouchStart={startDrawing} onTouchEnd={finishDrawing} onTouchMove={draw} className="bg-gray-100 rounded-lg w-full h-[200px] border-2 border-border cursor-crosshair touch-none" />
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={handleCloseSignatureModal}
                style={{
                  backgroundColor: '#61666c',
                  color: '#fff',
                  height: '3rem',
                  fontSize: '1rem',
                  border: 'none',
                  borderRadius: '0.75rem',
                  boxShadow: 'none',
                  width: '100%'
                }}
              >
                닫기
              </button>
              <Button onClick={clearCanvas} className="h-12 text-base bg-red-500 text-white hover:bg-red-600">다시하기</Button>
              <Button onClick={handleSaveSignature} className="h-12 text-base bg-blue-700 text-white hover:bg-blue-800">저장</Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={isConfirmingNameReset} onOpenChange={setIsConfirmingNameReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이름을 초기화하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              모든 플레이어 이름이 기본값으로 초기화됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setPlayerNames(DEFAULT_NAMES);
                toast({ title: "이름이 초기화되었습니다.", duration: 2000 });
              }}
            >
              초기화
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isConfirmingSave} onOpenChange={setIsConfirmingSave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>기록을 저장하시겠습니까?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveRecord}>저장</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isConfirmingCourseReset} onOpenChange={setIsConfirmingCourseReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{course.courses[activeCourseIndex]?.name} 코스를 초기화하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              현재 코스의 모든 점수와 서명이 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetCourse}>초기화</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isConfirmingAllReset} onOpenChange={setIsConfirmingAllReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>모든 코스를 초기화하시겠습니까?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={handleResetAll}>
              전체 초기화
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
