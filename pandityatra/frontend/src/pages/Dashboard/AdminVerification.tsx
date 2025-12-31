import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, FileText, Phone, Mail } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

interface PendingPandit {
  id: number;
  full_name: string;
  phone_number: string;
  email: string;
  expertise: string;
  language: string;
  experience_years: number;
  bio: string;
  verification_status: string;
  certification_file_url: string;
  date_joined: string;
}

const AdminVerificationDashboard: React.FC = () => {
  const [pandits, setPandits] = useState<PendingPandit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedPandit, setSelectedPandit] = useState<PendingPandit | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPendingPandits();
  }, []);

  const fetchPendingPandits = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        'http://localhost:8000/api/pandits/pending/',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      setPandits(response.data.results || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load pending pandits');
      setPandits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePandit = async (panditId: number) => {
    try {
      setActionLoading(panditId);
      const token = localStorage.getItem('access_token');
      await axios.post(
        `http://localhost:8000/api/pandits/${panditId}/verify/`,
        { notes: 'Approved by admin' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      setSuccessMessage('Pandit approved successfully!');
      fetchPendingPandits();
      setSelectedPandit(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to approve pandit');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectPandit = async (panditId: number) => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(panditId);
      const token = localStorage.getItem('access_token');
      await axios.post(
        `http://localhost:8000/api/pandits/${panditId}/reject/`,
        { reason: rejectReason },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      setSuccessMessage('Pandit rejected successfully!');
      fetchPendingPandits();
      setSelectedPandit(null);
      setRejectReason('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reject pandit');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pandit Verification</h1>
        <p className="text-gray-600">Review and approve pending pandit registrations</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {pandits.length === 0 ? (
          <Card>
            <CardContent className="pt-12 text-center">
              <p className="text-gray-500 text-lg">No pending pandits for verification</p>
            </CardContent>
          </Card>
        ) : (
          pandits.map((pandit) => (
            <motion.div
              key={pandit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{pandit.full_name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{pandit.expertise}</p>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {pandit.verification_status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Contact Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gray-600" />
                        <span className="text-sm">{pandit.phone_number}</span>
                      </div>
                      {pandit.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-gray-600" />
                          <span className="text-sm">{pandit.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Experience Info */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Language</p>
                        <p className="text-sm text-gray-600">{pandit.language}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Experience</p>
                        <p className="text-sm text-gray-600">{pandit.experience_years} years</p>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {pandit.bio && (
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Bio</p>
                      <p className="text-sm text-gray-600">{pandit.bio}</p>
                    </div>
                  )}

                  {/* Certification File */}
                  {pandit.certification_file_url && (
                    <div className="mb-6">
                      <a
                        href={pandit.certification_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                      >
                        <FileText className="h-4 w-4" />
                        View Certification
                      </a>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApprovePandit(pandit.id)}
                      disabled={actionLoading === pandit.id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading === pandit.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => setSelectedPandit(pandit)}
                      variant="outline"
                      className="flex-1 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Rejection Modal */}
      {selectedPandit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg max-w-md w-full p-6"
          >
            <h3 className="text-lg font-semibold mb-4">
              Reject {selectedPandit.full_name}?
            </h3>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide reason for rejection..."
              className="w-full h-24 border border-gray-200 rounded-lg p-3 text-sm mb-4 focus:ring-2 focus:ring-orange-500"
            />
            
            <div className="flex gap-3">
              <Button
                onClick={() => setSelectedPandit(null)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleRejectPandit(selectedPandit.id)}
                disabled={!rejectReason.trim() || actionLoading === selectedPandit.id}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {actionLoading === selectedPandit.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Reject'
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminVerificationDashboard;
