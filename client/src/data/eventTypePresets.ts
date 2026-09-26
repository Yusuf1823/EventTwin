/**
 * EVENT TYPE PRESETS & COMPONENT WEIGHT PROFILES
 * 
 * Defines how different event types (Concert, Conference, Sports, Religious Gathering, etc.)
 * affect the default zone spatial shape (point-based vs route-based) and the component weight
 * profile for the Central Stress Index formula in simulationEngine.js.
 * 
 * ADJUSTABLE CONFIGURATION:
 * Weights MUST sum to 1.0 (100%) for proper normalization.
 */

export interface EventTypePreset {
  id: string;
  label: string;
  shape: 'point-based' | 'route-based';
  description: string;
  weights: {
    mobilityWeight: number;        // Traffic & expressway congestion
    venueWeight: number;           // Turnstile & hall crowding
    parkingWeight: number;         // Bay occupancy
    hotelWeight: number;           // Hotel room occupancy
    demandImbalanceWeight: number; // Disparity between Zone A and Zone C
  };
}

export const EVENT_TYPE_PRESETS: Record<string, EventTypePreset> = {
  'Concert': {
    id: 'Concert',
    label: 'Concert / Live Show',
    shape: 'point-based',
    description: 'Concentrated arrival/egress waves centered on venue turnstiles and local parking.',
    weights: {
      mobilityWeight: 0.25,
      venueWeight: 0.35,
      parkingWeight: 0.20,
      hotelWeight: 0.10,
      demandImbalanceWeight: 0.10
    }
  },
  'Conference': {
    id: 'Conference',
    label: 'Conference / Summit',
    shape: 'point-based',
    description: 'High hotel occupancy & steady day-long transit flow.',
    weights: {
      mobilityWeight: 0.20,
      venueWeight: 0.25,
      parkingWeight: 0.15,
      hotelWeight: 0.30,
      demandImbalanceWeight: 0.10
    }
  },
  'Sports': {
    id: 'Sports',
    label: 'Sports Tournament',
    shape: 'point-based',
    description: 'Heavy transit and stadium ingress/egress surge.',
    weights: {
      mobilityWeight: 0.30,
      venueWeight: 0.30,
      parkingWeight: 0.20,
      hotelWeight: 0.10,
      demandImbalanceWeight: 0.10
    }
  },
  'Religious Gathering': {
    id: 'Religious Gathering',
    label: 'Religious Gathering / Procession',
    shape: 'route-based',
    description: 'Linear arterial movement along roads and pedestrian corridors.',
    weights: {
      mobilityWeight: 0.40,
      venueWeight: 0.15,
      parkingWeight: 0.15,
      hotelWeight: 0.10,
      demandImbalanceWeight: 0.20
    }
  },
  'Mega Event': {
    id: 'Mega Event',
    label: 'Global Mega Event / Expo',
    shape: 'point-based',
    description: 'Balanced mega-scale demand across all municipal infrastructure sectors.',
    weights: {
      mobilityWeight: 0.30,
      venueWeight: 0.25,
      parkingWeight: 0.20,
      hotelWeight: 0.15,
      demandImbalanceWeight: 0.10
    }
  },
  'Festival': {
    id: 'Festival',
    label: 'City Festival / Carnival',
    shape: 'route-based',
    description: 'Distributed precinct-wide crowds and transit corridor movement.',
    weights: {
      mobilityWeight: 0.35,
      venueWeight: 0.20,
      parkingWeight: 0.20,
      hotelWeight: 0.15,
      demandImbalanceWeight: 0.10
    }
  }
};
