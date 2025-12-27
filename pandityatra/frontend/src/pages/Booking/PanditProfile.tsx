import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPandit, fetchPanditServices } from '@/lib/api';
import type { Pandit, Puja } from '@/lib/api';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { motion } from 'framer-motion';
import AnimatedCard from '@/components/ui/AnimatedCard';
import { fadeInUp, containerStagger, subtleHover } from '@/components/ui/motion-variants';

// PanditProfile Component
const PanditProfile: React.FC = () => {
  const { id } = useParams();
  const pid = Number(id);
  const navigate = useNavigate();

  const [pandit, setPandit] = useState<Pandit | null>(null);
  const [services, setServices] = useState<Puja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pid) return;
    setLoading(true);
    Promise.all([fetchPandit(pid), fetchPanditServices(pid)])
      .then(([p, s]) => {
        setPandit(p);
        setServices(s || []);
        setError(null);
      })
      .catch((err: any) => setError(err?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [pid]);

  // Render loading, error, or pandit profile

  if (loading) return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!pandit) return <div className="p-8 text-center">Pandit not found</div>;

  return (
    <motion.div className="container mx-auto p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="lg:col-span-1" variants={fadeInUp}>
          <AnimatedCard>
            <CardHeader>
              {/* 🚨 Fix: Access full_name from nested user_details */}
              <CardTitle>{pandit.user_details?.full_name || 'Pandit'}</CardTitle>
              <CardDescription>{pandit.expertise}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Language: {pandit.language}</p>
              <p className="mb-2">Rating: {pandit.rating} / 5</p>
              <p className="text-muted-foreground italic">{pandit.bio}</p>
              <div className="mt-4">
                <Button onClick={() => navigate('/booking')}>Book a Puja</Button>
              </div>
            </CardContent>
          </AnimatedCard>
        </motion.div>

        <motion.div className="lg:col-span-2" variants={containerStagger}>
          <h2 className="text-2xl font-semibold mb-4">Services</h2>
          <div className="space-y-4">
            {services.length === 0 && <div className="text-muted-foreground">No services listed.</div>}
            {services.map((s) => (
              <motion.div key={s.id} variants={fadeInUp} whileHover={subtleHover}>
                <AnimatedCard className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">{s.name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">₹{s.base_price}</div>
                      <div className="text-sm text-muted-foreground">{s.description || 'No description'}</div>
                      <div className="mt-2">
                        <Button variant="outline" onClick={() => navigate('/booking?pandit=' + pid + '&service=' + s.id)}>Book</Button>
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PanditProfile;
