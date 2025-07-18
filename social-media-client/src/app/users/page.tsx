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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

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

          <Button variant="outline" size="icon" onClick={handleCloseSearch} className="cursor-pointer h-11 w-11 md:h-10 md:w-10">
            <X className="h-5 w-5 md:h-4 md:w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={fetchAllUserData} className="cursor-pointer h-11 w-11 md:h-10 md:w-10">
            <RefreshCw className="h-5 w-5 md:h-4 md:w-4" />
          </Button>
        </div>
      </div>

      {/* --- USER LIST --- */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {filteredUsers.map((user) => {
            const isFollowing = following.has(user._id);
            const isPending = sentRequests.has(user._id);
            const hasRequestedToFollowMe = receivedRequests.has(user._id);

            let status: 'not_following' | 'following' | 'pending' | 'respond' = 'not_following';
            let buttonText = 'Follow';
            let actionHandler: () => void = () => handleUserAction(user._id, status as any);

            if (isFollowing) {
              status = 'following';
              buttonText = 'Following';
            } else if (isPending) {
              status = 'pending';
              buttonText = 'Pending';
            } else if (hasRequestedToFollowMe) {
              status = 'respond';
              buttonText = 'Accept';
              actionHandler = () => handleAcceptRequest(user._id);
            }

            return (
              <motion.div 
                key={user._id} 
                variants={itemVariants}
                layout
              >
                {/* We make the Card itself a button for the primary action */}
                <button
                  className="w-full text-left rounded-lg"
                  onClick={actionHandler}
                  aria-label={`${buttonText} ${user.username}`}
                >
                  <Card className="transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg">
                    <CardHeader className="flex-row items-center justify-between pb-2">
                      <CardTitle>{user.username}</CardTitle>
                      {/* We can show the button state as a visual indicator, not the primary action target */}
                      <div 
                        className={`px-3 py-1 text-xs rounded-full
                          ${isFollowing ? 'bg-secondary text-secondary-foreground' : ''}
                          ${isPending ? 'bg-muted text-muted-foreground' : ''}
                          ${hasRequestedToFollowMe ? 'bg-primary text-primary-foreground' : ''}
                          ${!isFollowing && !isPending && !hasRequestedToFollowMe ? 'bg-primary text-primary-foreground' : ''}
                        `}
                      >
                        {buttonText}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Click card to {buttonText.toLowerCase()}</p>
                    </CardContent>
                  </Card>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}