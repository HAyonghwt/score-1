'use client';

import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, functions } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';

export default function NotificationManager() {
    const { toast } = useToast();

    useEffect(() => {
        if (typeof window === 'undefined' || !messaging) return;

        const syncSubscription = async () => {
            try {
                // Default to true if not set
                const notificationsEnabled = localStorage.getItem('notifications_enabled') !== 'false';

                if (notificationsEnabled) {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted' && messaging) {
                        const vapidKey = 'BBoxO-8bhPjPtaCBWHMWOlVY7QsQH2gK2MQgyUom8Rr9sWsnYyb_i5twpQ5jMX-GytW5UVzbxW1cGpl_bjo6Erk';
                        const token = await getToken(messaging, { vapidKey });

                        const subscribe = httpsCallable(functions, 'subscribeToTopic');
                        await subscribe({ token, topic: 'competitions' });
                        console.log('FCM Subscription synced (ON)');
                    }
                }
            } catch (error: any) {
                console.warn('FCM sync subscription failed details:', {
                    code: error.code,
                    message: error.message,
                    details: error.details
                });
            }
        };

        syncSubscription();

        // Handle foreground messages
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);

            // Check if notifications are enabled in localStorage
            // Default to true if not set
            const notificationsEnabled = localStorage.getItem('notifications_enabled') !== 'false';

            if (payload.notification && notificationsEnabled) {
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
