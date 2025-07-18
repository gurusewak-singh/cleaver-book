'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsContent />
    </ProtectedRoute>
  );
}

function NotificationsContent() {
  const [requests, setRequests] = useState<any[]>([]);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await api.get('/auth/profile');
      setRequests(response.data.receivedFollowRequests || []);
    } catch (error) {
      console.error("Failed to fetch follow requests", error);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAccept = async (userId: string) => {
    try {
      await api.post(`/users/${userId}/accept-follow`);
      toast.success("Follow request accepted!");
      setRequests(prev => prev.filter(req => req._id !== userId)); // triggers exit animation
    } catch (error) {
      toast.error("Failed to accept request.");
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Follow Requests</h1>
      <div className="space-y-4">
        <AnimatePresence>
          {requests.length > 0 ? (
            requests.map((requestUser) => (
              <motion.div
                key={requestUser._id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -300, transition: { duration: 0.5 } }}
              >
                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <p><strong>{requestUser.username}</strong> wants to follow you.</p>
                    <div className="flex gap-2">
                      <Button onClick={() => handleAccept(requestUser._id)} className="cursor-pointer">
                        Accept
                      </Button>
                      {/* <Button variant="outline">Decline</Button> */}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center border-2 border-dashed rounded-lg p-12"
            >
              <h2 className="text-xl font-semibold text-muted-foreground">All Caught Up!</h2>
              <p className="mt-2 text-muted-foreground">You have no new follow requests.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
