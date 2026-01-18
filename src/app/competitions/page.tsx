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
import { Trophy, MapPin, Calendar, Clock, ChevronRight, ArrowLeft, Bell, BellOff } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { messaging, functions } from '@/lib/firebase';
import { getToken } from 'firebase/messaging';
import { httpsCallable } from 'firebase/functions';

// Helper function to safely parse dates (handles both ISO strings and Firebase Timestamps)
const safeDate = (dateVal: any) => {
    if (!dateVal) return new Date();
    if (dateVal.toDate && typeof dateVal.toDate === 'function') return dateVal.toDate();
    const parsed = new Date(dateVal);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
};

export default function CompetitionsPage() {
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [loading, setLoading] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        // Load notification preference
        const savedPreference = localStorage.getItem('notifications_enabled');
        if (savedPreference !== null) {
            setNotificationsEnabled(savedPreference === 'true');
        }
    }, []);

    const handleNotificationToggle = async (checked: boolean) => {
        setNotificationsEnabled(checked);
        localStorage.setItem('notifications_enabled', String(checked));

        if (checked) {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted' && messaging) {
                    const vapidKey = 'BBoxO-8bhPjPtaCBWHMWOlVY7QsQH2gK2MQgyUom8Rr9sWsnYyb_i5twpQ5jMX-GytW5UVzbxW1cGpl_bjo6Erk';
                    const token = await getToken(messaging, { vapidKey });

                    const subscribe = httpsCallable(functions, 'subscribeToTopic');
                    await subscribe({ token, topic: 'competitions' });
                }
            } catch (error) {
                console.error("Subscription error:", error);
            }
        } else {
            try {
                if (messaging) {
                    const vapidKey = 'BBoxO-8bhPjPtaCBWHMWOlVY7QsQH2gK2MQgyUom8Rr9sWsnYyb_i5twpQ5jMX-GytW5UVzbxW1cGpl_bjo6Erk';
                    const token = await getToken(messaging, { vapidKey });

                    const unsubscribe = httpsCallable(functions, 'unsubscribeFromTopic');
                    await unsubscribe({ token, topic: 'competitions' });
                }
            } catch (error) {
                console.error("Unsubscription error:", error);
            }
        }

        toast({
            title: checked ? "알림이 켜졌습니다" : "알림이 꺼졌습니다",
            description: checked ? "새로운 대회 소식을 실시간으로 알려드립니다." : "새로운 대회 소식 알림을 받지 않습니다.",
            duration: 2000,
        });
    };

    useEffect(() => {
        // Add sample data if empty
        addSampleCompetitions();

        const q = query(collection(db, 'competitions'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const docs: Competition[] = [];
            const now = new Date();
            const currentYearStr = String(now.getFullYear());
            const lastYearStr = String(now.getFullYear() - 1);
            const blacklist = ["용어", "후기", "결과", "방법", "정리", "팁", "리뷰", "종료", "시상", "참가자수", "참가기", "이야기", "개최", "사진"];

            querySnapshot.forEach((doc) => {
                const data = doc.data() as any; // Use any to access potentially mismatched fields
                const title = data.title || "";

                // [필터링 로직]
                // 1. 과거 연도 필터링
                if (title.includes(lastYearStr) && !title.includes(currentYearStr)) {
                    return;
                }

                // 2. 블랙리스트 키워드 필터링 (정보성/뉴스성 글 제외)
                if (blacklist.some(word => title.includes(word))) {
                    return;
                }

                // 3. 종료된 대회 필터링
                if (data.eventDate) {
                    const eventDate = new Date(data.eventDate);
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    if (eventDate < today && !isNaN(eventDate.getTime())) {
                        return;
                    }
                }

                // Normalize sourceUrl (handle existing 'link' field)
                const normalizedDoc = {
                    id: doc.id,
                    ...data,
                    sourceUrl: data.sourceUrl || data.link
                } as Competition;

                docs.push(normalizedDoc);
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
            <header className="flex items-center justify-between my-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="w-12 h-12">
                        <ArrowLeft className="w-8 h-8" />
                    </Button>
                    <h1 className="text-3xl font-bold">대회 소식</h1>
                </div>
                <div className="flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded-full border border-border">
                    {notificationsEnabled ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
                    <Switch
                        id="notifications"
                        checked={notificationsEnabled}
                        onCheckedChange={handleNotificationToggle}
                        className="data-[state=checked]:bg-primary"
                    />
                    <Label htmlFor="notifications" className="text-sm font-bold cursor-pointer">알림</Label>
                </div>
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
                                        {format(safeDate(comp.createdAt), 'MM/dd')}
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
                                    <span>대회일: {comp.eventDate ? format(safeDate(comp.eventDate), 'yyyy년 MM월 dd일') : '상세정보 확인'}</span>
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
