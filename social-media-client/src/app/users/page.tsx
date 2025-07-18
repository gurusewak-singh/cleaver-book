'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchStore } from '@/lib/store';
import ProtectedRoute from '@/components/ProtectedRoute';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function UsersPage() {
  return (
    <ProtectedRoute>
      <UsersContent />
    </ProtectedRoute>
  );
}

function UsersContent() {
  const [users, setUsers] = useState<any[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [receivedRequests, setReceivedRequests] = useState<Set<string>>(new Set());

  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const { user: currentUser } = useAuth();
  const router = useRouter();

  const {
    searchTerm,
    setSearchTerm,
    clearSearchTerm,
  } = useSearchStore();

  useEffect(() => {
    setIsSearchVisible(true);
  }, []);

  const fetchAllUserData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [profileRes, usersRes] = await Promise.all([
        api.get('/auth/profile'),
        api.get('/users'),
      ]);

      setFollowing(new Set(profileRes.data.following || []));
      setSentRequests(new Set(profileRes.data.sentFollowRequests || []));
      setReceivedRequests(new Set(profileRes.data.receivedFollowRequests.map((u: any) => u._id) || []));

      setUsers(usersRes.data.filter((u: any) => u._id !== currentUser.id));
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchAllUserData();
  }, [fetchAllUserData]);

  const handleCloseSearch = () => {
    setIsSearchVisible(false);
    clearSearchTerm();
    setTimeout(() => {
      router.push('/timeline');
    }, 300);
  };

  const handleUserAction = async (
    targetUserId: string,
    status: 'not_following' | 'following' | 'pending'
  ) => {
    const originalFollowing = new Set(following);
    const originalSentRequests = new Set(sentRequests);

    if (status === 'not_following') {
      setSentRequests(prev => new Set(prev).add(targetUserId));
      try {
        await api.post(`/users/${targetUserId}/request-follow`);
      } catch (error) {
        setSentRequests(originalSentRequests);
        toast.error('Failed to send request.');
      }
    } else if (status === 'following') {
      const newSet = new Set(following);
      newSet.delete(targetUserId);
      setFollowing(newSet);
      try {
        await api.delete(`/users/${targetUserId}/unfollow`);
      } catch (error) {
        setFollowing(originalFollowing);
        toast.error('Failed to unfollow.');
      }
    } else if (status === 'pending') {
      const newSet = new Set(sentRequests);
      newSet.delete(targetUserId);
      setSentRequests(newSet);
      try {
        await api.delete(`/users/${targetUserId}/cancel-follow`);
      } catch (error) {
        setSentRequests(originalSentRequests);
        toast.error('Failed to cancel request.');
      }
    }
  };

  const handleAcceptRequest = async (targetUserId: string) => {
    try {
      await api.post(`/users/${targetUserId}/accept-follow`);
      setReceivedRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetUserId);
        return newSet;
      });
      setFollowing(prev => new Set(prev).add(targetUserId));
      toast.success("Request accepted!");
    } catch (error) {
      toast.error("Failed to accept request.");
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold whitespace-nowrap">Find Users</h1>
        <div className="flex-grow flex justify-end items-center gap-2">
          <AnimatePresence>
            {isSearchVisible && (
              <motion.div
                key="search-bar"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <Input
                  placeholder="Search for users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Button variant="outline" size="icon" onClick={handleCloseSearch} className="cursor-pointer">
            <X className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={fetchAllUserData} className="cursor-pointer">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* --- USER LIST --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const isFollowing = following.has(user._id);
          const isPending = sentRequests.has(user._id);
          const hasRequestedToFollowMe = receivedRequests.has(user._id);

          let status: 'not_following' | 'following' | 'pending' | 'respond' = 'not_following';
          let buttonText = 'Follow';
          let buttonVariant: 'default' | 'secondary' | 'outline' = 'default';
          let actionHandler: () => void = () => handleUserAction(user._id, status as any);

          if (isFollowing) {
            status = 'following';
            buttonText = 'Following';
            buttonVariant = 'secondary';
          } else if (isPending) {
            status = 'pending';
            buttonText = 'Pending';
            buttonVariant = 'outline';
          } else if (hasRequestedToFollowMe) {
            status = 'respond';
            buttonText = 'Accept';
            buttonVariant = 'default';
            actionHandler = () => handleAcceptRequest(user._id);
          }

          return (
            <Card key={user._id}>
              <CardHeader>
                <CardTitle>{user.username}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant={buttonVariant} onClick={actionHandler} className="cursor-pointer">
                  {buttonText}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
