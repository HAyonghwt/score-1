'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, User, Calendar, Trash2 } from 'lucide-react';
import type { GameRecord } from '@/lib/types';
import { cn } from '@/lib/utils';
import { exportScoreTableToImage } from './ClientRecordDetail.exportImage';
import { useToast } from '@/hooks/use-toast';
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

const HOLE_COUNT = 9;

export default function ClientRecordDetail() {
    const router = useRouter();
    const params = useParams();
    const recordId = params.recordId as string;

    const [record, setRecord] = useState<GameRecord | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        // [Workaround] 페이지 첫 로드 시 발생하는 서버/클라이언트 렌더링 불일치(Hydration)로 인한
        // 테마 색상 깨짐 현상을 해결하기 위해, 첫 방문 시에만 페이지를 한 번 새로고침합니다.
        // 이 방법은 근본적인 해결책은 아니지만, 현재 겪고 있는 복잡한 렌더링 오류를
        // 안정적으로 우회하는 실용적인 해결책입니다.
        const reloadedKey = `reloaded_record_${recordId}`;
        if (sessionStorage.getItem(reloadedKey) !== 'true') {
            sessionStorage.setItem(reloadedKey, 'true');
            window.location.reload();
            return; // 새로고침 후에는 아래 로직을 실행하지 않음
        }

        setIsClient(true);
        if (recordId) {
            const savedRecords = localStorage.getItem('golfGameRecords');
            if (savedRecords) {
                const records: GameRecord[] = JSON.parse(savedRecords);
                const currentRecord = records.find(r => r.id === recordId);
                setRecord(currentRecord || null);
            }
        }
    }, [recordId]);

    const calculateTotalScores = (courseScores: string[][]) => {
        if (!courseScores || courseScores.length === 0) return [];
        return Array(4).fill(0).map((_, playerIndex) =>
            courseScores.reduce((total, holeScores) => {
                const score = parseInt(holeScores[playerIndex], 10);
                return total + (isNaN(score) ? 0 : score);
            }, 0)
        );
    };

    if (!isClient) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    const handleDeleteRecord = () => {
        if (!record) return;

        setIsDeleting(true);
        try {
            const savedRecords = localStorage.getItem('golfGameRecords');
            if (savedRecords) {
                const records: GameRecord[] = JSON.parse(savedRecords);
                const updatedRecords = records.filter(r => r.id !== record.id);
                localStorage.setItem('golfGameRecords', JSON.stringify(updatedRecords));

                toast({
                    title: "기록 삭제 완료",
                    description: "선택한 기록이 삭제되었습니다.",
                });

                router.push('/records');
                router.refresh();
            }
        } catch (error) {
            console.error('기록 삭제 중 오류 발생:', error);
            toast({
                title: "오류 발생",
                description: "기록 삭제 중 오류가 발생했습니다.",
                variant: "destructive"
            });
        } finally {
            setIsDeleting(false);
            setIsConfirmingDelete(false);
        }
    };

    if (!record) {
        return (
            <div className="container mx-auto p-4 max-w-lg min-h-screen bg-background">
                <header className="flex items-center justify-between my-6">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/records')}>
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-2xl font-bold text-center truncate">기록 없음</h1>
                    <div className="w-10"></div>
                </header>
                <Card className="text-center p-8 border-dashed">
                    <CardTitle>기록을 찾을 수 없습니다.</CardTitle>
                    <CardDescription className="mt-2">삭제되었거나 잘못된 기록입니다.</CardDescription>
                </Card>
            </div>
        )
    }

    const recordDate = new Date(record.date);

    const courseKey = (record?.courseName?.[0] || 'a').toLowerCase();
    return (
        <div className="container mx-auto p-4 max-w-lg min-h-screen bg-background" data-theme={`course-${courseKey}`}>
            <header className="flex items-center justify-between my-6">
                <Button variant="ghost" size="icon" onClick={() => router.push('/records')}>
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-2xl font-bold text-center truncate">경기 상세 기록</h1>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="text-destructive hover:text-destructive/80"
                    disabled={isDeleting}
                >
                    <Trash2 className="w-5 h-5" />
                </Button>
            </header>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>{record.courseName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{recordDate.toLocaleString('ko-KR', { dateStyle: 'long', timeStyle: 'short' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{record.playerNames.filter(n => n && n.trim()).join(', ')}</span>
                    </div>
                </CardContent>
            </Card>

            <main className="space-y-6">
                {record.playedCourses.map((subCourse, index) => {
                    const courseScores = record.allScores[index];
                    const courseSignatures = record.signatures[index];
                    const totalScores = calculateTotalScores(courseScores);
                    const theme = `course-${(subCourse.name || 'a').toLowerCase()}`;

                    return (
                        <div data-theme={theme} key={subCourse.name}>
                            <Card className="overflow-hidden">
                                <CardHeader className="bg-primary text-primary-foreground p-4">
                                    <CardTitle className="text-xl">{subCourse.name} 코스</CardTitle>
                                </CardHeader>
                                <div className="flex justify-end px-2 pt-3">
                                    <Button size="sm" variant="outline" onClick={async () => {
                                        toast({ title: "이미지 생성 중...", description: "스코어카드 이미지를 만들고 있습니다. 잠시만 기다려주세요.", duration: 2000 });
                                        try {
                                            const dataUrl = await exportScoreTableToImage(`score-table-capture-${index}`);
                                            if (dataUrl) {
                                                const fileName = `golf_score_${index + 1}.png`;
                                                const blob = await (await fetch(dataUrl)).blob();
                                                const file = new File([blob], fileName, { type: 'image/png' });

                                                // 1. 모바일 기기 등 공유 API 지원 시 (파일명 보존에 가장 확실함)
                                                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                                                    try {
                                                        await navigator.share({
                                                            files: [file],
                                                            title: '파크골프 스코어카드',
                                                            text: `${record.courseName} - ${subCourse.name} 코스 결과입니다.`
                                                        });
                                                        toast({ title: "공유창 열기 성공", description: "갤러리에 저장하거나 카카오톡으로 공유해보세요.", duration: 3000 });
                                                        return;
                                                    } catch (shareError) {
                                                        if (shareError instanceof Error && shareError.name !== 'AbortError') {
                                                            console.error('Share error:', shareError);
                                                        } else {
                                                            return; // 사용자가 취소한 경우
                                                        }
                                                    }
                                                }

                                                // 2. 데스크톱 및 공유 미지원 환경 (개선된 다운로드 로직)
                                                const fileUrl = window.URL.createObjectURL(file);
                                                const link = document.createElement('a');
                                                link.href = fileUrl;
                                                link.download = fileName;
                                                link.style.display = 'none';

                                                document.body.appendChild(link);
                                                link.click();

                                                // 브라우저 처리를 위해 잠시 후 삭제
                                                setTimeout(() => {
                                                    if (document.body.contains(link)) {
                                                        document.body.removeChild(link);
                                                    }
                                                    window.URL.revokeObjectURL(fileUrl);
                                                }, 1000);

                                                toast({ title: "이미지 저장 완료", description: "브라우저 다운로드 폴더를 확인해주세요.", duration: 3000 });
                                            } else {
                                                toast({ title: "저장 실패", description: "이미지 생성 중 오류가 발생했습니다.", variant: "destructive", duration: 2000 });
                                            }
                                        } catch (e) {
                                            console.error('Download error:', e);
                                            toast({ title: "저장 실패", description: "이미지 저장 중 오류가 발생했습니다.", variant: "destructive", duration: 2000 });
                                        }
                                    }}>
                                        이미지로 저장하기
                                    </Button>
                                </div>
                                <div className="overflow-x-auto">
                                    <div
                                        id={`score-table-capture-${index}`}
                                        className="score-table-capture-export p-2 sm:p-4 bg-white rounded-lg shadow-md"
                                        style={{ minWidth: '100%', maxWidth: '100%', margin: '0 auto' }}
                                    >
                                        <div className="flex flex-col items-center mb-2">
                                            <span className="font-bold text-lg">{record.courseName} - {subCourse.name} 코스</span>
                                            <span className="text-sm text-muted-foreground">
                                                {recordDate.toLocaleString('ko-KR', { dateStyle: 'long', timeStyle: 'short' })}
                                            </span>
                                        </div>
                                        <Table className="min-w-full border-separate border-spacing-x-0 table-fixed">
                                            <TableHeader>
                                                <TableRow className="border-none">
                                                    <TableHead className="bg-primary text-primary-foreground py-2 text-center text-sm font-bold w-[34px] min-w-[34px] max-w-[34px] rounded-tl-lg">홀</TableHead>
                                                    <TableHead className="bg-primary text-primary-foreground py-2 text-center text-sm font-bold w-[34px] min-w-[34px] max-w-[34px]">Par</TableHead>
                                                    {record.playerNames.map((name, pIdx) => (
                                                        <TableHead
                                                            key={pIdx}
                                                            className={cn("bg-primary text-primary-foreground px-1 py-2 text-center text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis", {
                                                                "rounded-tr-lg": pIdx === 3
                                                            })}
                                                            style={{ width: 'calc((100% - 68px) / 4)' }}
                                                        >
                                                            {name}
                                                        </TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {Array.from({ length: HOLE_COUNT }).map((_, holeIndex) => {
                                                    const par = subCourse.pars[holeIndex];
                                                    return (
                                                        <TableRow key={holeIndex} className="border-none hover:bg-transparent">
                                                            <TableCell className={cn("bg-primary text-primary-foreground text-center p-0 font-bold w-[34px] min-w-[34px] max-w-[34px]", holeIndex === HOLE_COUNT - 1 && "rounded-bl-lg")} style={{ fontSize: '1.1rem' }}>{holeIndex + 1}</TableCell>
                                                            <TableCell className="text-center p-0 font-normal w-[34px] min-w-[34px] max-w-[34px]" style={{ fontSize: '1.2rem' }}>{par}</TableCell>
                                                            {Array.from({ length: 4 }).map((_, playerIndex) => {
                                                                const score = courseScores[holeIndex]?.[playerIndex];
                                                                const diff = score && !isNaN(parseInt(score)) ? parseInt(score) - Number(par) : null;
                                                                return (
                                                                    <TableCell key={playerIndex} className="p-0.5 text-center align-middle" style={{ width: 'calc((100% - 68px) / 4)' }}>
                                                                        <div className='w-full h-11 text-center rounded-lg border-2 border-border bg-white flex flex-col items-center justify-center p-0'>
                                                                            <span className="text-xl font-bold leading-none" style={{ marginTop: diff !== null ? '-2px' : '0' }}>{score || ''}</span>
                                                                            {diff !== null && (
                                                                                <span className={cn('text-[11px] font-extrabold leading-none mt-0.5', {
                                                                                    'text-destructive': diff > 0,
                                                                                    'text-primary': diff < 0,
                                                                                    'text-muted-foreground': diff === 0
                                                                                })}>
                                                                                    {diff === 0 ? 'E' : diff > 0 ? `+${diff}` : `${diff}`}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </TableCell>
                                                                );
                                                            })}
                                                        </TableRow>
                                                    )
                                                })}
                                                <TableRow className="bg-muted hover:bg-muted" style={{ height: '60px' }}>
                                                    <TableCell colSpan={2} className="text-center font-bold text-lg p-1">합계</TableCell>
                                                    {totalScores.map((total, index) => (
                                                        <TableCell key={index} className="text-center font-bold text-2xl p-1" style={{ color: '#222' }}>{total || ''}</TableCell>
                                                    ))}
                                                </TableRow>
                                                <TableRow className="bg-muted hover:bg-muted" style={{ height: '60px' }}>
                                                    <TableCell colSpan={2} className="text-center font-bold text-lg p-1">서명</TableCell>
                                                    {(courseSignatures || []).map((sig, index) => (
                                                        <TableCell key={index} className="text-center p-1" style={{ height: '60px' }}>
                                                            {sig ? <img src={sig} alt="signature" className="mx-auto h-full object-contain" style={{ maxHeight: '50px' }} /> : null}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    );
                })}
            </main>

            {/* 삭제 확인 모달 */}
            <AlertDialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>정말로 이 기록을 삭제하시겠습니까?</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteRecord}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? '삭제 중...' : '삭제'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}