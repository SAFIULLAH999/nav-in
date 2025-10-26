'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Shield, Plus, X, ExternalLink, CheckCircle } from 'lucide-react';

interface Certification {
  id: string;
  name: string;
  issuingOrg: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
  isVerified: boolean;
  media?: string;
}

interface License {
  id: string;
  name: string;
  issuingAuthority: string;
  licenseNumber: string;
  issueDate: string;
  expiryDate?: string;
  isActive: boolean;
  description?: string;
  verificationUrl?: string;
}

export default function CertificationsLicenses() {
  const [activeTab, setActiveTab] = useState<'certifications' | 'licenses'>('certifications');
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [certsRes, licensesRes] = await Promise.all([
        fetch('/api/certifications/certifications'),
        fetch('/api/certifications/licenses')
      ]);
      const certsData = await certsRes.json();
      const licensesData = await licensesRes.json();
      setCertifications(certsData);
      setLicenses(licensesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: 'certification' | 'license', id: string) => {
    if (!confirm('Are you sure you want to delete this?')) return;

    try {
      const endpoint = type === 'certification' 
        ? `/api/certifications/certifications/${id}`
        : `/api/certifications/licenses/${id}`;
      
      const response = await fetch(endpoint, { method: 'DELETE' });
      
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Tabs */}
      <div className="border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('certifications')}
            className={`flex-1 px-6 py-4 font-medium transition ${
              activeTab === 'certifications'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Award className="inline-block w-5 h-5 mr-2" />
            Certifications ({certifications.length})
          </button>
          <button
            onClick={() => setActiveTab('licenses')}
            className={`flex-1 px-6 py-4 font-medium transition ${
              activeTab === 'licenses'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="inline-block w-5 h-5 mr-2" />
            Licenses ({licenses.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {activeTab === 'certifications' ? 'Certifications' : 'Professional Licenses'}
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Add {activeTab === 'certifications' ? 'Certification' : 'License'}
          </button>
        </div>

        {activeTab === 'certifications' ? (
          <CertificationsList 
            certifications={certifications} 
            onDelete={(id) => handleDelete('certification', id)}
          />
        ) : (
          <LicensesList 
            licenses={licenses}
            onDelete={(id) => handleDelete('license', id)}
          />
        )}
      </div>

      {showAddModal && (
        <AddCertificationModal
          type={activeTab}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}

function CertificationsList({ 
  certifications, 
  onDelete 
}: { 
  certifications: Certification[]; 
  onDelete: (id: string) => void;
}) {
  if (certifications.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No certifications added yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {certifications.map((cert) => (
        <motion.div
          key={cert.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border rounded-lg p-4 hover:shadow-md transition"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-lg">{cert.name}</h3>
                {cert.isVerified && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
              <p className="text-gray-700 font-medium">{cert.issuingOrg}</p>
              <p className="text-sm text-gray-600 mt-1">
                Issued {new Date(cert.issueDate).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
                {cert.expiryDate && ` · Expires ${new Date(cert.expiryDate).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}`}
              </p>
              {cert.credentialId && (
                <p className="text-sm text-gray-600 mt-1">
                  Credential ID: {cert.credentialId}
                </p>
              )}
              {cert.description && (
                <p className="text-gray-700 mt-2">{cert.description}</p>
              )}
              {cert.credentialUrl && (
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm mt-2"
                >
                  View credential <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <button
              onClick={() => onDelete(cert.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function LicensesList({ 
  licenses, 
  onDelete 
}: { 
  licenses: License[]; 
  onDelete: (id: string) => void;
}) {
  if (licenses.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No licenses added yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {licenses.map((license) => (
        <motion.div
          key={license.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border rounded-lg p-4 hover:shadow-md transition"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-lg">{license.name}</h3>
                {license.isActive ? (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    Expired
                  </span>
                )}
              </div>
              <p className="text-gray-700 font-medium">{license.issuingAuthority}</p>
              <p className="text-sm text-gray-600 mt-1">
                License Number: {license.licenseNumber}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Issued {new Date(license.issueDate).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
                {license.expiryDate && ` · Expires ${new Date(license.expiryDate).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}`}
              </p>
              {license.description && (
                <p className="text-gray-700 mt-2">{license.description}</p>
              )}
              {license.verificationUrl && (
                <a
                  href={license.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm mt-2"
                >
                  Verify license <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <button
              onClick={() => onDelete(license.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AddCertificationModal({ 
  type, 
  onClose, 
  onSuccess 
}: { 
  type: 'certifications' | 'licenses';
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = type === 'certifications'
        ? '/api/certifications/certifications'
        : '/api/certifications/licenses';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        alert('Failed to add');
      }
    } catch (error) {
      console.error('Error adding:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-xl font-bold mb-4">
          Add {type === 'certifications' ? 'Certification' : 'License'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form fields would go here - simplified for brevity */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
