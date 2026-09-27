import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTutorial } from '../tutorial/TutorialContext';
import {
  Shield,
  Sparkles,
  Building,
  Users,
  CheckSquare,
  Square,
  ArrowRight,
  Network,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  AlertCircle,
  Ticket,
  HelpCircle
} from 'lucide-react';
import { REAL_MUMBAI_LOCATIONS, LocationItem } from '../data/mumbaiLocations';
import { EVENT_TYPE_PRESETS, EventTypePreset } from '../data/eventTypePresets';

const INITIALIZATION_SEQUENCE = [
  "INITIALIZING EVENTTWIN",
  "LOADING REAL LOCATIONS",
  "MAPPING HOTELS",
  "MAPPING TRANSIT",
  "MAPPING VENUE",
  "BUILDING ROAD NETWORK",
  "LOADING SIMULATION ENGINE",
  "AI PREDICTION ENGINE READY",
  "EVENTTWIN ONLINE"
];

export interface CustomFacilityInput {
  id: string;
  name: string;
  category: 'Hotel' | 'Transit' | 'Parking';
  address: string;
  capacity: number;
}

export const OnboardingPage: React.FC = () => {
  const { user, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const { startTutorial } = useTutorial();

  // Step 1: Basic Details
  const [eventName, setEventName] = useState('Mumbai Global Mega-Concert & Expo 2026');
  const [eventDate, setEventDate] = useState('2026-10-15');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('22:00');

  // Step 2: Expected Visitors
  const [visitorMode, setVisitorMode] = useState<'exact' | 'range'>('exact');
  const [exactVisitors, setExactVisitors] = useState(500000);
  const [minVisitors, setMinVisitors] = useState(300000);
  const [maxVisitors, setMaxVisitors] = useState(700000);

  // Step 3: Venue Selection
  const [venueMode, setVenueMode] = useState<'verified' | 'custom'>('verified');
  const verifiedVenues = REAL_MUMBAI_LOCATIONS.filter((l) => l.category === 'Venue');
  const [selectedVerifiedVenueId, setSelectedVerifiedVenueId] = useState<string>(
    verifiedVenues[0]?.id || 'jwcc_bkc'
  );
  const [customVenueName, setCustomVenueName] = useState('');
  const [customVenueAddress, setCustomVenueAddress] = useState('');
  const [customVenueCapacity, setCustomVenueCapacity] = useState(50000);

  // Step 4: Event Type
  const [selectedEventType, setSelectedEventType] = useState<string>('Mega Event');

  // Step 5: Relevant Facilities
  const defaultFacilities = REAL_MUMBAI_LOCATIONS.filter((l) => l.category !== 'Venue').map(
    (l) => l.id
  );
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>(defaultFacilities);
  const [customFacilities, setCustomFacilities] = useState<CustomFacilityInput[]>([]);
  const [showAddCustomFacility, setShowAddCustomFacility] = useState(false);
  const [newFacName, setNewFacName] = useState('');
  const [newFacCategory, setNewFacCategory] = useState<'Hotel' | 'Transit' | 'Parking'>('Hotel');
  const [newFacAddress, setNewFacAddress] = useState('');
  const [newFacCapacity, setNewFacCapacity] = useState(500);

  // Step 6: Ticketing Status
  const [ticketingStatus, setTicketingStatus] = useState<'ticketed' | 'free_estimated' | 'walk_in'>(
    'ticketed'
  );

  // UI State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Toggle Facility Selection
  const toggleFacility = (id: string) => {
    setSelectedFacilityIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Add Custom Facility
  const handleAddCustomFacility = () => {
    if (!newFacName.trim()) return;
    const newFacility: CustomFacilityInput = {
      id: `custom_fac_${Date.now()}`,
      name: newFacName.trim(),
      category: newFacCategory,
      address: newFacAddress.trim() || 'Mumbai Precinct',
      capacity: Number(newFacCapacity) || 500
    };
    setCustomFacilities((prev) => [...prev, newFacility]);
    setNewFacName('');
    setNewFacAddress('');
    setNewFacCapacity(500);
    setShowAddCustomFacility(false);
  };

  // Remove Custom Facility
  const handleRemoveCustomFacility = (id: string) => {
    setCustomFacilities((prev) => prev.filter((f) => f.id !== id));
  };

  // Validate inputs before submitting
  const validateForm = (): boolean => {
    if (!eventName.trim()) {
      setValidationError('Event name is required.');
      return false;
    }
    if (!eventDate || !startTime || !endTime) {
      setValidationError('Event date, start time, and end time are required.');
      return false;
    }
    if (visitorMode === 'exact') {
      if (!exactVisitors || exactVisitors <= 0) {
        setValidationError('Total expected visitors must be greater than 0.');
        return false;
      }
    } else {
      if (!minVisitors || !maxVisitors || minVisitors <= 0 || maxVisitors < minVisitors) {
        setValidationError('Valid visitor min and max range is required (max must be >= min).');
        return false;
      }
    }
    if (venueMode === 'custom') {
      if (!customVenueName.trim() || !customVenueCapacity || customVenueCapacity <= 0) {
        setValidationError('Custom venue name and valid capacity are required.');
        return false;
      }
    }
    if (selectedFacilityIds.length === 0 && customFacilities.length === 0) {
      setValidationError('Select at least one hotel, transit, or parking facility.');
      return false;
    }
    setValidationError(null);
    return true;
  };

  // Handle Form Submit & Sequence
  const handleBuildDigitalTwin = async () => {
    if (!validateForm()) return;

    setIsInitializing(true);

    // Compute effective visitors
    const totalVisitors =
      visitorMode === 'exact' ? exactVisitors : Math.round((minVisitors + maxVisitors) / 2);

    // Compute venue details
    let venuePayload;
    if (venueMode === 'verified') {
      const v = verifiedVenues.find((v) => v.id === selectedVerifiedVenueId) || verifiedVenues[0];
      venuePayload = {
        isCustom: false,
        id: v.id,
        name: v.name,
        address: v.real.address,
        capacity: v.simulated.capacity
      };
    } else {
      venuePayload = {
        isCustom: true,
        id: `custom_venue_${Date.now()}`,
        name: customVenueName.trim(),
        address: customVenueAddress.trim() || 'BKC, Mumbai',
        capacity: Number(customVenueCapacity)
      };
    }

    const eventConfigPayload = {
      userId: user?.id || 'user_1',
      eventName: eventName.trim(),
      eventDate,
      startTime,
      endTime,
      visitorInputMode: visitorMode,
      totalVisitors,
      visitorRange: visitorMode === 'range' ? { min: minVisitors, max: maxVisitors } : null,
      venue: venuePayload,
      eventType: selectedEventType,
      eventTypePreset: EVENT_TYPE_PRESETS[selectedEventType] || EVENT_TYPE_PRESETS['Mega Event'],
      facilityIds: selectedFacilityIds,
      customFacilities,
      ticketingStatus
    };

    // Send payload to backend
    try {
      await fetch('/api/event-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventConfigPayload)
      });
    } catch (err) {
      console.warn('Failed to persist event config to backend:', err);
    }

    // Run 9-stage high-tech sequence animation
    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < INITIALIZATION_SEQUENCE.length) {
        setStepIndex(current);
      } else {
        clearInterval(interval);
        completeOnboarding();
        
        // If it's a real Firebase user (e.g. has a uid), automatically start the guided tour
        // which will navigate them to the command center directly.
        if (user && (user as any).uid) {
          startTutorial();
        } else {
          navigate('/dashboard');
        }
      }
    }, 450);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 relative overflow-hidden">
      {/* 3D Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-60 mix-blend-screen"
      >
        <source src="/bg-video.mp4" type="video/mp4" />
      </video>

      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-indigo-600/30 via-cyan-600/15 to-transparent blur-3xl pointer-events-none z-0" />

      {/* Main Container */}
      <div className="w-full max-w-2xl glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative z-10 my-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20 shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Build Event-Specific Digital Twin</h1>
            <p className="text-xs text-slate-400">by Ghost Protocol • Configure actual parameters driving canonical simulation state</p>
          </div>
        </div>

        {validationError && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {isInitializing ? (
          /* High-Tech Loading Sequence */
          <div className="py-14 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-6 relative">
              <Network className="w-10 h-10 text-cyan-400 animate-pulse" />
              <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400 border-t-transparent animate-spin" />
            </div>

            <div className="text-base font-mono font-bold text-cyan-300 tracking-wider mb-2">
              {INITIALIZATION_SEQUENCE[stepIndex]}
            </div>

            <div className="w-72 bg-slate-900 rounded-full h-1.5 overflow-hidden mt-4 border border-slate-800">
              <div
                className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full transition-all duration-300"
                style={{ width: `${((stepIndex + 1) / INITIALIZATION_SEQUENCE.length) * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 font-mono mt-3">
              Initializing canonical state for {eventName}...
            </span>
          </div>
        ) : (
          /* Step-by-Step Configuration Form */
          <div className="flex flex-col gap-6">
            {/* Step 1: Event Name & Timeline */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Event Details & Timeline
              </label>
              <div>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Event Name (e.g. Mumbai Global Mega-Concert 2026)"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-mono">Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-mono">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-mono">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Expected Total Visitors */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Expected Total Visitors
                </label>
                <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setVisitorMode('exact')}
                    className={`px-2.5 py-1 rounded font-semibold transition ${
                      visitorMode === 'exact' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Exact Number
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitorMode('range')}
                    className={`px-2.5 py-1 rounded font-semibold transition ${
                      visitorMode === 'range' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Min / Max Range
                  </button>
                </div>
              </div>

              {visitorMode === 'exact' ? (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Baseline Visitor Scale</span>
                    <span className="font-mono font-bold text-cyan-300 bg-cyan-950/50 px-2.5 py-0.5 rounded border border-cyan-500/30">
                      {exactVisitors.toLocaleString()} visitors
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50000}
                    max={1000000}
                    step={25000}
                    value={exactVisitors}
                    onChange={(e) => setExactVisitors(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                    <span>50K</span>
                    <span>500K</span>
                    <span>1M</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-mono">Min Expected Visitors</label>
                    <input
                      type="number"
                      value={minVisitors}
                      onChange={(e) => setMinVisitors(Number(e.target.value))}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-mono">Max Expected Visitors</label>
                    <input
                      type="number"
                      value={maxVisitors}
                      onChange={(e) => setMaxVisitors(Number(e.target.value))}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Venue Selection (Zone A) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  3. Primary Venue Selection (Zone A)
                </label>
                <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setVenueMode('verified')}
                    className={`px-2.5 py-1 rounded font-semibold transition ${
                      venueMode === 'verified' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Verified Location
                  </button>
                  <button
                    type="button"
                    onClick={() => setVenueMode('custom')}
                    className={`px-2.5 py-1 rounded font-semibold transition ${
                      venueMode === 'custom' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Custom Venue
                  </button>
                </div>
              </div>

              {venueMode === 'verified' ? (
                <div className="space-y-2 text-xs">
                  {verifiedVenues.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVerifiedVenueId(v.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        selectedVerifiedVenueId === v.id
                          ? 'bg-indigo-950/40 border-indigo-500/60 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div>
                        <strong className="block text-slate-200">{v.name}</strong>
                        <span className="text-[11px] text-slate-400">{v.real.address}</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        Cap: {v.simulated.capacity.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-mono">Custom Venue Name</label>
                    <input
                      type="text"
                      value={customVenueName}
                      onChange={(e) => setCustomVenueName(e.target.value)}
                      placeholder="e.g. Wankhede Stadium / NESCO Exhibition Center"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-mono">Address / Precinct</label>
                      <input
                        type="text"
                        value={customVenueAddress}
                        onChange={(e) => setCustomVenueAddress(e.target.value)}
                        placeholder="Address in Mumbai"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-mono">Capacity</label>
                      <input
                        type="number"
                        value={customVenueCapacity}
                        onChange={(e) => setCustomVenueCapacity(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Event Type & Preset Shape */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                4. Event Type & Stress Weight Profile
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {Object.keys(EVENT_TYPE_PRESETS).map((typeKey) => {
                  const preset = EVENT_TYPE_PRESETS[typeKey];
                  const isSelected = selectedEventType === typeKey;
                  return (
                    <button
                      key={typeKey}
                      type="button"
                      onClick={() => setSelectedEventType(typeKey)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-100'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-bold block text-[11.5px]">{preset.label}</span>
                      <span className="text-[9.5px] font-mono text-cyan-300 mt-1 uppercase">
                        {preset.shape}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10.5px] text-slate-400 italic">
                "{EVENT_TYPE_PRESETS[selectedEventType]?.description}"
              </p>
            </div>

            {/* Step 5: Relevant Facilities */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  5. Active Facility Registry ({selectedFacilityIds.length + customFacilities.length} selected)
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCustomFacility(!showAddCustomFacility)}
                  className="text-xs font-mono text-cyan-400 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Facility</span>
                </button>
              </div>

              {/* Verified Locations List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {REAL_MUMBAI_LOCATIONS.filter((l) => l.category !== 'Venue').map((item) => {
                  const isChecked = selectedFacilityIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleFacility(item.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer select-none transition ${
                        isChecked
                          ? 'bg-slate-900 border-indigo-500/40 text-slate-200'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-500'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="font-semibold block truncate text-[11px]">{item.name}</span>
                        <span className="text-[9.5px] text-slate-500 font-mono">
                          {item.category} • Cap: {item.simulated.capacity.toLocaleString()}
                        </span>
                      </div>
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Custom Facilities Added */}
              {customFacilities.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-mono text-purple-300 font-bold uppercase">Custom Facilities Added:</span>
                  <div className="space-y-1">
                    {customFacilities.map((cf) => (
                      <div
                        key={cf.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-purple-950/20 border border-purple-500/30 text-xs"
                      >
                        <div>
                          <strong className="text-purple-200 text-[11px]">{cf.name}</strong>
                          <span className="text-[10px] text-slate-400 block">{cf.category} • {cf.address} (Cap: {cf.capacity})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomFacility(cf.id)}
                          className="p-1 text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Custom Facility Sub-Form */}
              {showAddCustomFacility && (
                <div className="p-3 bg-slate-950 border border-cyan-500/40 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-cyan-300 text-[11px] uppercase tracking-wider">Add Custom Facility</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Facility Name"
                      value={newFacName}
                      onChange={(e) => setNewFacName(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                    />
                    <select
                      value={newFacCategory}
                      onChange={(e) => setNewFacCategory(e.target.value as any)}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                    >
                      <option value="Hotel">Hotel</option>
                      <option value="Transit">Transit</option>
                      <option value="Parking">Parking</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Capacity"
                      value={newFacCapacity}
                      onChange={(e) => setNewFacCapacity(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Address / Location details"
                    value={newFacAddress}
                    onChange={(e) => setNewFacAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddCustomFacility(false)}
                      className="px-3 py-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCustomFacility}
                      className="px-3 py-1 rounded bg-cyan-600 text-white font-bold"
                    >
                      Add Facility
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 6: Ticketing Status */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                6. Ticketing & Demand Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'ticketed', label: 'Ticketed Event', sub: 'Fixed ticket count' },
                  { id: 'free_estimated', label: 'Free & Estimated', sub: 'Estimated range' },
                  { id: 'walk_in', label: 'Open Walk-in', sub: 'Live variable inflow' }
                ].map((t) => {
                  const isSelected = ticketingStatus === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTicketingStatus(t.id as any)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-100'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <strong className="block text-[11.5px]">{t.label}</strong>
                      <span className="text-[10px] text-slate-500 block">{t.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleBuildDigitalTwin}
              className="w-full mt-3 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 transition cursor-pointer uppercase tracking-wider"
            >
              <Sparkles className="w-4 h-4" />
              <span>INITIALIZE EVENT-SPECIFIC DIGITAL TWIN</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
