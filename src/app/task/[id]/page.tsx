'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import pb from '@/lib/pocketbase';
import type { Task, Volunteer } from '@/lib/pocketbase';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [creator, setCreator] = useState<Volunteer | null>(null);
  const [completedBy, setCompletedBy] = useState<Array<{ name: string; minutes: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);

  // Check if user is logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        
        if (data.isAuthenticated && data.volunteerId) {
          // Fetch volunteer info
          const volunteer = await pb.collection('volunteers').getOne(data.volunteerId);
          setCurrentUser({
            id: data.volunteerId,
            name: volunteer.username || volunteer.email || 'User',
          });
        }
      } catch (err) {
        console.error('Error checking auth:', err);
      }
    }
    
    checkAuth();
  }, []);

  // Fetch task details
  useEffect(() => {
    async function fetchTask() {
      try {
        const record = await pb.collection('tasks').getOne<Task>(taskId);
        setTask(record);

        // Fetch creator info if available
        if (record.created_by) {
          try {
            const creatorRecord = await pb.collection('volunteers').getOne<Volunteer>(record.created_by);
            setCreator(creatorRecord);
          } catch (err) {
            console.warn('Could not fetch creator:', err);
          }
        }

        // If task is completed, fetch completion records
        if (record.status === 'completed') {
          try {
            const completions = await pb.collection('completions').getList(1, 50, {
              filter: `task = "${taskId}"`,
              expand: 'volunteer',
            });

            const completedByData = completions.items.map((completion: any) => {
              const volunteer = completion.expand?.volunteer;
              return {
                name: volunteer?.username || volunteer?.email || 'Unknown',
                minutes: completion.actual_minutes || 0,
              };
            });

            setCompletedBy(completedByData);
          } catch (err) {
            console.warn('Could not fetch completion records:', err);
          }
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching task:', err);
        setError('Task not found');
        setLoading(false);
      }
    }

    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  const getZoneColor = (zone: string) => {
    const colors: Record<string, string> = {
      Woodshop: 'badge-warning',
      '3D Printing': 'badge-secondary',
      Electronics: 'badge-info',
      'Laser Cutting': 'badge-error',
      CNC: 'badge-success',
      General: 'badge-neutral',
      Admin: 'badge-primary',
    };
    return colors[zone] || colors.General;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="badge badge-success">🟢 Open</span>;
      case 'in_progress':
        return <span className="badge badge-info">🔵 In Progress</span>;
      case 'completed':
        return <span className="badge badge-neutral">✅ Completed</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const handleClaimTask = () => {
    if (currentUser) {
      router.push(`/volunteer/track?taskId=${taskId}&volunteerId=${currentUser.id}`);
    } else {
      router.push(`/auth/discord?callbackUrl=/task/${taskId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-2xl">Loading task...</div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="card bg-base-100 shadow-2xl max-w-md">
          <div className="card-body text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold mb-2">Task Not Found</h1>
            <p className="text-base-content/80 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="btn btn-primary"
            >
              Back to Tasks
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Top Navigation Bar */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <button
            onClick={() => router.push('/')}
            className="btn btn-ghost"
          >
            ← Back to Tasks
          </button>
        </div>
        <div className="flex-none">
          {currentUser ? (
            <button
              onClick={() => router.push(`/volunteer?id=${currentUser.id}`)}
              className="btn btn-primary"
            >
              👤 {currentUser.name}
            </button>
          ) : (
            <button
              onClick={() => router.push('/auth/discord')}
              className="btn btn-primary"
            >
              Login
            </button>
          )}
        </div>
      </div>

      {/* Task Details */}
      <div className="container mx-auto px-4 py-8">
        <div className="card bg-base-100 shadow-2xl">
          <div className="card-body">
          {/* Task Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-lg font-mono font-bold">#{task.task_number}</span>
                <span className={`badge ${getZoneColor(task.zone)}`}>
                  {task.zone}
                </span>
                {getStatusBadge(task.status)}
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                {task.title}
              </h1>
              
              {creator && task.created && (
                <div className="text-base-content/80 text-sm space-y-1">
                  <p>
                    👤 Created by <span className="font-semibold">{creator.username || creator.email}</span>
                  </p>
                  <p>
                    📅 {new Date(task.created).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Task Image */}
          {task.image && (
            <div className="mb-6 rounded-xl overflow-hidden">
              <img
                src={pb.files.getURL(task, task.image)}
                alt={task.title}
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}

          {/* Task Details */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-3">📝 Description</h2>
              <p className="text-lg whitespace-pre-wrap">
                {task.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">Estimated Time</div>
                  <div className="stat-value text-2xl">
                    ⏱️ {task.estimated_minutes} min
                  </div>
                  <div className="stat-desc">
                    ≈ {Math.round(task.estimated_minutes / 60 * 10) / 10} hours
                  </div>
                </div>
              </div>

              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">Zone</div>
                  <div className="stat-value text-2xl">
                    🏷️ {task.zone}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {task.status === 'open' && (
            <div className="mt-8 pt-6 border-t border-base-300">
              <button
                onClick={handleClaimTask}
                className="btn btn-primary btn-lg w-full sm:w-auto"
              >
                {currentUser ? '🎯 Claim & Start This Task' : '🔐 Login to Claim Task'}
              </button>
              <p className="text-base-content/80 text-sm mt-3">
                {currentUser 
                  ? 'Start tracking your time and earn credit for completing this task'
                  : 'Login with Discord to claim tasks and track your contributions'
                }
              </p>
            </div>
          )}

          {task.status === 'in_progress' && (
            <div className="mt-8 pt-6 border-t border-base-300">
              <div className="alert alert-info">
                <p className="text-center">
                  🔵 This task is currently being worked on
                </p>
              </div>
            </div>
          )}

          {task.status === 'completed' && (
            <div className="mt-8 pt-6 border-t border-base-300">
              <div className="alert alert-success">
                <div className="w-full">
                  <p className="text-center text-xl font-bold mb-4">
                    ✅ This task has been completed
                  </p>
                  {completedBy.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-semibold mb-3">👥 Completed by:</h3>
                      <div className="space-y-2">
                        {completedBy.map((person, index) => (
                          <div 
                            key={index}
                            className="bg-base-100/50 rounded-lg p-3 flex items-center justify-between"
                          >
                            <span className="font-medium">{person.name}</span>
                            <span className="text-base-content/80 text-sm">
                              {person.minutes} min ({Math.round(person.minutes / 60 * 10) / 10}h)
                            </span>
                          </div>
                        ))}
                      </div>
                      {completedBy.length > 1 && (
                        <div className="mt-3 pt-3 border-t border-base-300/50">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">Total Time:</span>
                            <span className="font-bold text-lg">
                              {completedBy.reduce((sum, p) => sum + p.minutes, 0)} min
                              ({Math.round(completedBy.reduce((sum, p) => sum + p.minutes, 0) / 60 * 10) / 10}h)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

