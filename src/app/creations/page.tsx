'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import pb from '@/lib/pocketbase';
import type { Creation, Volunteer } from '@/lib/pocketbase';

interface CreationWithVolunteer extends Creation {
  volunteer_name?: string;
  volunteer_photo?: string;
}

export default function PublicCreationsPage() {
  const router = useRouter();
  const [creations, setCreations] = useState<CreationWithVolunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [volunteerId, setVolunteerId] = useState<string | null>(null);

  // Check if user is logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data.volunteerId) {
          setVolunteerId(data.volunteerId);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
      }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    async function fetchCreations() {
      try {
        // Fetch main board creations (public gallery shows main board only)
        let records;
        try {
          records = await pb.collection('creations').getList<Creation>(1, 50, {
            filter: 'board = "main"',
            sort: '-created',
            expand: 'volunteer'
          });
        } catch {
          // Fallback: fetch all and filter client-side
          records = await pb.collection('creations').getList<Creation>(1, 50, {
            sort: '-created',
            expand: 'volunteer'
          });
          records.items = records.items.filter((c: Creation) => !c.board || c.board === 'main');
        }

        const withVolunteerInfo: CreationWithVolunteer[] = records.items.map(creation => {
          const expanded = creation as any;
          const volunteerData = expanded.expand?.volunteer;
          return {
            ...creation,
            volunteer_name: volunteerData?.username || 'Anonymous',
            volunteer_photo: volunteerData?.profile_photo
          };
        });

        setCreations(withVolunteerInfo);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching creations:', err);
        setLoading(false);
      }
    }

    fetchCreations();

    // Subscribe to real-time updates (filtered by board)
    pb.collection('creations').subscribe<Creation>('*', (e) => {
      // Only process main board creations
      if (e.record.board && e.record.board !== 'main') return;
      
      if (e.action === 'create') {
        // Fetch the new creation with volunteer info
        pb.collection('creations').getOne<Creation>(e.record.id, { expand: 'volunteer' })
          .then((creation) => {
            // Double-check board filter
            if (creation.board && creation.board !== 'main') return;
            
            const expanded = creation as any;
            const volunteerData = expanded.expand?.volunteer;
            const withInfo: CreationWithVolunteer = {
              ...creation,
              volunteer_name: volunteerData?.username || 'Anonymous',
              volunteer_photo: volunteerData?.profile_photo
            };
            setCreations(prev => [withInfo, ...prev]);
          });
      } else if (e.action === 'delete') {
        setCreations(prev => prev.filter(c => c.id !== e.record.id));
      }
    });

    return () => {
      pb.collection('creations').unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-xl">Loading creations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-secondary to-accent text-primary-content">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">🎨 Community Creations</h1>
            <p className="text-xl mb-6">
              Amazing projects made by volunteers at Chico Fab Lab
            </p>
            <button
              onClick={() => {
                if (volunteerId) {
                  router.push(`/volunteer/tasks?id=${volunteerId}`);
                } else {
                  router.push('/');
                }
              }}
              className="btn btn-outline transition-colors font-semibold"
            >
              ← {volunteerId ? 'Back to Dashboard' : 'Back to Home'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {creations.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">🎨</div>
            <p className="text-gray-500 text-2xl mb-2">No creations shared yet</p>
            <p className="text-gray-400 text-lg">
              Be the first to share your makerspace project!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {creations.map((creation) => (
              <div
                key={creation.id}
                onClick={() => router.push(`/creations/${creation.id}`)}
                className="card bg-base-100 shadow-xl cursor-pointer hover:shadow-2xl transition-all transform hover:-translate-y-1"
              >
                {/* Image */}
                {creation.photos && creation.photos.length > 0 ? (
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    <img
                      src={pb.files.getURL(creation, creation.photos[0])}
                      alt={creation.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    <span className="text-7xl">🎨</span>
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{creation.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{creation.description}</p>

                  {/* Creator Info */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 overflow-hidden flex-shrink-0">
                      {creation.volunteer_photo ? (
                        <img
                          src={pb.files.getURL({ id: creation.volunteer, collectionName: 'volunteers' }, creation.volunteer_photo)}
                          alt={creation.volunteer_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">
                          👤
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{creation.volunteer_name}</p>
                      <p className="text-xs text-gray-500">{new Date(creation.created).toLocaleDateString()}</p>
                    </div>
                    {creation.photos && creation.photos.length > 1 && (
                      <span className="text-sm text-purple-600 font-medium">
                        📷 {creation.photos.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


