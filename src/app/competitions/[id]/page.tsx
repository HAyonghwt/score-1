'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Competition } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Calendar, ExternalLink, Share2, Info } from 'lucide-react';
import { format } from 'date-fns';

// Helper function to safely parse dates (handles both ISO strings and Firebase Timestamps)
const safeDate = (dateVal: any) => {
    if (!dateVal) return new Date();
    if (dateVal.toDate && typeof dateVal.toDate === 'function') return dateVal.toDate();
    const parsed = new Date(dateVal);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
};

export default function CompetitionDetailPage() {
    const [competition, setCompetition] = useState<Competition | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    useEffect(() => {
        async function fetchDetail() {
            try {
                const docRef = doc(db, 'competitions', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCompetition({
                        id: docSnap.id,
                        ...data,
                        sourceUrl: data.sourceUrl || data.link // Handle mismatch
                    } as Competition);
                }
            } catch (error) {
                console.error("Error fetching competition detail:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchDetail();
    }, [id]);

    const handleShare = async () => {
        if (!competition) return;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: competition.title,
                    text: `[파크골프 대회 소식] ${competition.title}\n장소: ${competition.location}\n대회일: ${competition.eventDate ? format(safeDate(competition.eventDate), 'yyyy-MM-dd') : '상세정보 확인'}`,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Share failed', err);
            }
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('링크가 복사되었습니다!');
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4 max-w-lg min-h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!competition) {
        return (
            <div className="container mx-auto p-4 max-w-lg min-h-screen text-center py-20">
                <h2 className="text-2xl font-bold mb-4">대회 정보를 찾을 수 없습니다</h2>
                <Button onClick={() => router.push('/competitions')}>목록으로 돌아가기</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-lg min-h-screen bg-background pb-20">
            <header className="flex items-center justify-between my-6">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/competitions')} className="w-12 h-12">
                        <ArrowLeft className="w-8 h-8" />
                    </Button>
                    <h1 className="text-2xl font-bold">상세 내용</h1>
                </div>
                <Button variant="ghost" size="icon" onClick={handleShare} className="w-12 h-12">
                    <Share2 className="w-6 h-6" />
                </Button>
            </header>

            <main className="space-y-6">
                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0">
                        <div className="mb-4">
                            {competition.status === 'active' && <Badge className="bg-green-100 text-green-700 text-lg py-1 px-3">모집중</Badge>}
                            {competition.status === 'closed' && <Badge variant="secondary" className="text-lg py-1 px-3">마감</Badge>}
                            {competition.status === 'upcoming' && <Badge className="bg-blue-100 text-blue-700 text-lg py-1 px-3">예정</Badge>}
                        </div>
                        <CardTitle className="text-3xl font-bold leading-tight break-keep">
                            {competition.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 space-y-8">
                        <section className="bg-blue-50/50 p-6 rounded-2xl space-y-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-7 h-7 text-primary mt-1" />
                                <div>
                                    <div className="text-base text-gray-500 font-semibold">장소</div>
                                    <div className="text-xl font-bold">{competition.location}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="w-7 h-7 text-primary mt-1" />
                                <div>
                                    <div className="text-base text-gray-500 font-semibold">대회일</div>
                                    <div className="text-xl font-bold">{competition.eventDate ? format(safeDate(competition.eventDate), 'yyyy년 MM월 dd일') : '상세 페이지 확인'}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Info className="w-7 h-7 text-primary mt-1" />
                                <div>
                                    <div className="text-base text-gray-500 font-semibold">모집 기간</div>
                                    <div className="text-xl font-bold">
                                        {competition.applyStartDate && competition.applyEndDate ?
                                            `${format(safeDate(competition.applyStartDate), 'MM/dd')} ~ ${format(safeDate(competition.applyEndDate), 'MM/dd')}`
                                            : '상세 페이지 확인'
                                        }
                                    </div>
                                </div>
                            </div>
                        </section>

                        {competition.content && (
                            <section className="space-y-3">
                                <h3 className="text-2xl font-bold border-l-4 border-primary pl-3">대회 안내</h3>
                                <div className="text-xl leading-relaxed text-gray-700 break-keep whitespace-pre-wrap">
                                    {competition.content}
                                </div>
                            </section>
                        )}

                        <section className="pt-6">
                            <a href={competition.sourceUrl} target="_blank" rel="noopener noreferrer">
                                <Button className="w-full h-16 text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all">
                                    <ExternalLink className="mr-2 w-6 h-6" />
                                    원문 사이트 방문하기
                                </Button>
                            </a>
                            <p className="text-center text-gray-400 mt-4 text-base">
                                자세한 모집 요강 및 접수는 공식 홈페이지를 확인하세요.
                            </p>
                        </section>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
