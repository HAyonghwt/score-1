'use client';

import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function NotificationManager() {
    const { toast } = useToast();

    useEffect(() => {
        if (typeof window === 'undefined' || !messaging) return;

        const requestPermission = async () => {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted' && messaging) {
                    console.log('Notification permission granted.');

                    try {
                        // ⚠️ 중요: 아래 vapidKey는 예시입니다. Firebase Console -> Project Settings -> Cloud Messaging -> Web configuration에서 생성한 실제 키로 교체해야 합니다.
                        const vapidKey = 'BBoxO-8bhPjPtaCBWHMWOlVY7QsQH2gK2MQgyUom8Rr9sWsnYyb_i5twpQ5jMX-GytW5UVzbxW1cGpl_bjo6Erk';


                        const token = await getToken(messaging, { vapidKey });
                        console.log('FCM Token:', token);
                    } catch (error) {
                        console.warn('FCM 토큰 발급 실패 (VAPID Key 문제일 가능성이 높음):', error);
                    }
                }
            } catch (error) {
                console.error('An error occurred while retrieving token:', error);
            }
        };

        requestPermission();

        // Handle foreground messages
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);
            if (payload.notification) {
                toast({
                    title: payload.notification.title,
                    description: payload.notification.body,
                });
            }
        });

        return () => unsubscribe();
    }, [toast]);

    return null; // This component doesn't render anything
}
