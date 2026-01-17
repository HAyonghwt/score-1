'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { addSampleCompetitions } from '@/lib/addSampleCompetitions';
import { Competition } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, MapPin, Calendar, Clock, ChevronRight, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function CompetitionsPage() {
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Add sample data if empty
        addSampleCompetitions();

        const q = query(collection(db, 'competitions'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const docs: Competition[] = [];
            querySnapshot.forEach((doc) => {
                docs.push({ id: doc.id, ...doc.data() } as Competition);
            });
            setCompetitions(docs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getStatusBadge = (status: Competition['status']) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-lg py-1 px-3">모집중</Badge>;
            case 'closed':
                return <Badge variant="secondary" className="text-lg py-1 px-3">마감</Badge>;
            case 'upcoming':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-lg py-1 px-3">예정</Badge>;
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-lg min-h-screen bg-background">
            <header className="flex items-center gap-4 my-6">
                <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="w-12 h-12">
                    <ArrowLeft className="w-8 h-8" />
                </Button>
                <h1 className="text-3xl font-bold">대회 소식</h1>
            </header>

            <main className="space-y-6">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : competitions.length === 0 ? (
                    <Card className="text-center p-12 border-dashed">
                        <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <CardTitle className="text-2xl">등록된 대회가 없습니다</CardTitle>
                        <CardDescription className="text-lg mt-2">새로운 대회 소식을 기다려주세요.</CardDescription>
                    </Card>
                ) : (
                    competitions.map((comp) => (
                        <Card
                            key={comp.id}
                            className="cursor-pointer hover:border-primary transition-all active:scale-[0.98]"
                            onClick={() => router.push(`/competitions/${comp.id}`)}
                        >
                            <CardHeader className="p-5 pb-2">
                                <div className="flex justify-between items-start mb-2">
                                    {getStatusBadge(comp.status)}
                                    <div className="text-muted-foreground flex items-center gap-1 text-base">
                                        <Clock className="w-4 h-4" />
                                        {format(new Date(comp.createdAt), 'MM/dd')}
                                    </div>
                                </div>
                                <CardTitle className="text-2xl font-bold leading-tight break-keep">
                                    {comp.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 pt-2 space-y-3">
                                <div className="flex items-start gap-2 text-lg text-gray-600">
                                    <MapPin className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                                    <span className="line-clamp-1">{comp.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-lg text-gray-600">
                                    <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                                    <span>대회일: {format(new Date(comp.eventDate), 'yyyy년 MM월 dd일')}</span>
                                </div>
                                <div className="pt-2 flex justify-end">
                                    <div className="flex items-center text-primary font-bold text-lg">
                                        자세히 보기 <ChevronRight className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </main>
        </div>
    );
}
