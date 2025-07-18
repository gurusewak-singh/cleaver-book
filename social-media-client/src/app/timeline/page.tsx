'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { RefreshCw, Search, Bell, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useSearchStore } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function TimelinePage() {
  return (
    <ProtectedRoute>
      <TimelineContent />
    </ProtectedRoute>
  );
}

function TimelineContent() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, logout } = useAuth();

  const fetchTimeline = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/posts/timeline');
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Timeline</h1>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold whitespace-nowrap">Timeline</h1>
        <div className="flex-grow flex justify-end items-center gap-2">
          {/* ✅ UPDATED: Search is now a direct link */}
          <Link href="/users" passHref>
            <Button
              variant="outline"
              size="icon"
              aria-label="Search users"
              className="cursor-pointer"
            >
              <Search className="h-4 w-4" />
            </Button>
          </Link>

          <Button
            variant="outline"
            size="icon"
            onClick={fetchTimeline}
            aria-label="Refresh timeline"
            className="cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href="/notifications" passHref>
            <Button
              variant="outline"
              size="icon"
              aria-label="Notifications"
              className="cursor-pointer"
            >
              <Bell className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/create-post" passHref>
            <Button className="cursor-pointer">Create Post</Button>
          </Link>

          {/* --- PROFILE DROPDOWN + LOGOUT DIALOG --- */}
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-10 w-10 cursor-pointer"
                >
                  <div className="flex items-center justify-center h-full w-full bg-muted rounded-full">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-red-500 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Are you sure you want to log out?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  You will be returned to the login page.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => logout()} className="cursor-pointer">
                  Log Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* --- POST LIST --- */}
      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {posts.length > 0 ? (
          posts.map((post) => (
            <motion.div key={post._id} variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                  <CardDescription>by {post.author.username}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{post.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold">Your timeline is empty.</h2>
            <p className="text-muted-foreground mt-2">
              Find some interesting people to follow to see their posts here!
            </p>
            <Link href="/users" passHref>
              <Button variant="link" className="mt-4">
                Find Users
              </Button>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
