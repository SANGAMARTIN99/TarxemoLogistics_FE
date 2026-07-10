import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gsap } from 'gsap';
import { User, Shield, CreditCard, Send, RefreshCw, Phone, Calendar, Award } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { GET_ME } from '../../api/queries';
import { UPDATE_DRIVER_PROFILE } from '../../api/mutations';
import toast from 'react-hot-toast';

const DriverProfile: React.FC = () => {
  const { user, setUser } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const [profileForm, setProfileForm] = useState({
    licenseClass: '',
    licenseNumber: '',
    yearsExperience: '',
    phone: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  const { refetch } = useQuery(GET_ME, {
    onCompleted: (data) => {
      if (data?.me) {
        setUser(data.me);
      }
    }
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        licenseClass: user.driverProfile?.licenseClass || 'CLASS A',
        licenseNumber: user.driverProfile?.licenseNumber || '',
        yearsExperience: String(user.driverProfile?.experienceYears || '0'),
        phone: user.phone || '',
      });
    }
  }, [user]);

  const [updateProfile, { loading: profileSubmitting }] = useMutation(UPDATE_DRIVER_PROFILE, {
    onCompleted: (res) => {
      if (res.updateDriverProfile) {
        toast.success('Driver profile updated successfully.');
        setIsEditing(false);
        refetch();
      } else {
        toast.error('Failed to update credentials.');
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Error occurred while updating profile.');
    }
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!profileForm.licenseClass.trim()) {
      errors.licenseClass = 'License designation is required.';
    }
    if (!profileForm.licenseNumber.trim()) {
      errors.licenseNumber = 'Permit credential number is required.';
    }
    const exp = parseInt(profileForm.yearsExperience);
    if (!profileForm.yearsExperience) {
      errors.yearsExperience = 'Years of experience is required.';
    } else if (isNaN(exp) || exp < 0) {
      errors.yearsExperience = 'Invalid years of experience.';
    }
    if (!profileForm.phone.trim()) {
      errors.phone = 'Phone number is required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    updateProfile({
      variables: {
        input: {
          licenseClass: profileForm.licenseClass.trim().toUpperCase(),
          licenseNumber: profileForm.licenseNumber.trim(),
          experienceYears: parseInt(profileForm.yearsExperience),
        }
      }
    });
  };

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    }
  }, []);

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-text)] tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
              <User size={20} className="text-orange-500" />
            </div>
            Driver Profile
          </h1>
          <p className="text-[var(--color-text-muted)] text-xs mt-1 ml-[52px]">
            Manage your carrier permit details and credentials
          </p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] hover:border-orange-500/30 transition-all"
        >
          {isEditing ? 'Cancel' : 'Edit Credentials'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info card */}
        <div className="glass border border-[var(--color-border)] rounded-2xl p-6 space-y-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-orange-500 flex items-center justify-center text-3xl font-black text-white mx-auto shadow-lg">
            {user?.firstName?.[0] || 'U'}
          </div>
          <div>
            <h3 className="font-bold text-[var(--color-text)] text-base">{user?.firstName} {user?.lastName}</h3>
            <p className="text-[var(--color-text-muted)] text-[10px] uppercase font-bold tracking-wider mt-1">{user?.role}</p>
          </div>
          <div className="border-t border-[var(--color-border)] pt-4 space-y-3 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">License Class</span>
              <span className="font-bold text-[var(--color-text)]">{user?.driverProfile?.licenseClass || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Experience</span>
              <span className="font-bold text-[var(--color-text)]">{user?.driverProfile?.experienceYears || '0'} Years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Status</span>
              <span className="font-bold text-emerald-400 uppercase">{user?.driverProfile?.status || 'ACTIVE'}</span>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="md:col-span-2 glass border border-[var(--color-border)] rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-1">License Class</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profileForm.licenseClass}
                  onChange={(e) => setProfileForm({ ...profileForm, licenseClass: e.target.value })}
                  placeholder="e.g. CLASS A"
                  className="input-field text-xs disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]"
                />
                {formErrors.licenseClass && (
                  <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.licenseClass}</span>
                )}
              </div>

              <div>
                <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-1">Years of Experience</label>
                <input
                  type="number"
                  disabled={!isEditing}
                  value={profileForm.yearsExperience}
                  onChange={(e) => setProfileForm({ ...profileForm, yearsExperience: e.target.value })}
                  placeholder="e.g. 5"
                  className="input-field text-xs disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]"
                />
                {formErrors.yearsExperience && (
                  <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.yearsExperience}</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-1">Permit Number</label>
              <input
                type="text"
                disabled={!isEditing}
                value={profileForm.licenseNumber}
                onChange={(e) => setProfileForm({ ...profileForm, licenseNumber: e.target.value })}
                placeholder="e.g. DL-9836471"
                className="input-field text-xs disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]"
              />
              {formErrors.licenseNumber && (
                <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.licenseNumber}</span>
              )}
            </div>

            <div>
              <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-1">Phone Number</label>
              <input
                type="text"
                disabled={!isEditing}
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="e.g. +254 712 345 678"
                className="input-field text-xs disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]"
              />
              {formErrors.phone && (
                <span className="text-[9px] text-red-400 mt-1 block font-semibold">{formErrors.phone}</span>
              )}
            </div>

            {isEditing && (
              <button
                type="submit"
                disabled={profileSubmitting}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
              >
                {profileSubmitting ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Save Profile</span>
                    <Send size={12} />
                  </>
                )}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default DriverProfile;
