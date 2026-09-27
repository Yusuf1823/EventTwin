/**
 * EVENTTWIN LIVE WEATHER SERVICE
 * Fetches real-time weather data from Open-Meteo API (free, no API key required)
 * for Jio World Convention Centre, BKC, Mumbai.
 * 
 * Provides:
 *  - Current temperature, humidity, precipitation, rain, wind speed, weather code
 *  - Hourly forecast for next 48 hours
 *  - Derived operational impact parameters for the simulation engine
 */

// BKC / JWCC coordinates
const BKC_LAT = 19.0638;
const BKC_LON = 72.8682;

// WMO Weather Code interpretation
const WMO_CODES = {
  0: { label: 'Clear Sky', severity: 'none', icon: '☀️' },
  1: { label: 'Mainly Clear', severity: 'none', icon: '🌤️' },
  2: { label: 'Partly Cloudy', severity: 'none', icon: '⛅' },
  3: { label: 'Overcast', severity: 'low', icon: '☁️' },
  45: { label: 'Fog', severity: 'low', icon: '🌫️' },
  48: { label: 'Depositing Rime Fog', severity: 'low', icon: '🌫️' },
  51: { label: 'Light Drizzle', severity: 'low', icon: '🌦️' },
  53: { label: 'Moderate Drizzle', severity: 'moderate', icon: '🌦️' },
  55: { label: 'Dense Drizzle', severity: 'moderate', icon: '🌧️' },
  61: { label: 'Slight Rain', severity: 'moderate', icon: '🌧️' },
  63: { label: 'Moderate Rain', severity: 'high', icon: '🌧️' },
  65: { label: 'Heavy Rain', severity: 'critical', icon: '🌧️' },
  71: { label: 'Slight Snowfall', severity: 'moderate', icon: '🌨️' },
  73: { label: 'Moderate Snowfall', severity: 'high', icon: '🌨️' },
  75: { label: 'Heavy Snowfall', severity: 'critical', icon: '🌨️' },
  80: { label: 'Slight Rain Showers', severity: 'moderate', icon: '🌦️' },
  81: { label: 'Moderate Rain Showers', severity: 'high', icon: '🌧️' },
  82: { label: 'Violent Rain Showers', severity: 'critical', icon: '⛈️' },
  95: { label: 'Thunderstorm', severity: 'critical', icon: '⛈️' },
  96: { label: 'Thunderstorm with Slight Hail', severity: 'critical', icon: '⛈️' },
  99: { label: 'Thunderstorm with Heavy Hail', severity: 'critical', icon: '⛈️' }
};

function getWeatherInfo(code) {
  return WMO_CODES[code] || { label: 'Unknown', severity: 'none', icon: '❓' };
}

/**
 * Calculate operational impact percentages from raw weather data.
 * These feed directly into the simulation engine's ripple effect chain.
 */
function calculateWeatherImpact(current) {
  const { temperature_2m, precipitation, rain, wind_speed_10m, weather_code, relative_humidity_2m } = current;
  
  // --- Rain Impact (0-50%) ---
  // Light rain (<2mm/hr) = 5-10%, Moderate (2-7mm) = 15-25%, Heavy (7-15mm) = 30-40%, Extreme (>15mm) = 40-50%
  let rainImpactPct = 0;
  const rainRate = rain || precipitation || 0;
  if (rainRate > 0) {
    rainImpactPct = Math.min(50, Math.round(rainRate * 3.5));
    if (rainRate < 1) rainImpactPct = Math.max(rainImpactPct, 5);
  }

  // --- Wind Impact ---
  // High winds (>40 km/h) affect shuttle operations and outdoor queues
  let windImpactPct = 0;
  if (wind_speed_10m > 40) {
    windImpactPct = Math.min(30, Math.round((wind_speed_10m - 40) * 1.5));
  }

  // --- Temperature Impact ---
  // Extreme heat (>38°C) increases hotel AC demand, reduces walking tolerance
  // Extreme cold (<15°C) increases indoor crowding
  let temperatureImpactPct = 0;
  if (temperature_2m > 38) {
    temperatureImpactPct = Math.min(25, Math.round((temperature_2m - 38) * 5));
  } else if (temperature_2m < 15) {
    temperatureImpactPct = Math.min(15, Math.round((15 - temperature_2m) * 3));
  }

  // --- Visibility / Fog Impact ---
  let visibilityImpactPct = 0;
  const info = getWeatherInfo(weather_code);
  if (info.severity === 'low' && (weather_code === 45 || weather_code === 48)) {
    visibilityImpactPct = 10;
  }

  // --- Humidity discomfort (above 85% with temp > 32°C) ---
  let humidityDiscomfortPct = 0;
  if (relative_humidity_2m > 85 && temperature_2m > 32) {
    humidityDiscomfortPct = Math.min(15, Math.round((relative_humidity_2m - 85) * 0.8));
  }

  // --- Overall Composite Weather Stress ---
  // Rain is the primary driver; wind, temperature, visibility are secondary
  const compositeImpact = Math.min(50, Math.round(
    rainImpactPct * 0.55 +
    windImpactPct * 0.15 +
    temperatureImpactPct * 0.15 +
    visibilityImpactPct * 0.05 +
    humidityDiscomfortPct * 0.10
  ));

  // --- Waterlogging Risk (Mumbai-specific) ---
  // Rainfall > 10mm/hr in Mumbai BKC low-lying areas triggers waterlogging
  let waterloggingRisk = 'NONE';
  if (rainRate > 20) waterloggingRisk = 'CRITICAL';
  else if (rainRate > 10) waterloggingRisk = 'HIGH';
  else if (rainRate > 5) waterloggingRisk = 'MODERATE';
  else if (rainRate > 2) waterloggingRisk = 'LOW';

  // --- Monsoon Alert Level ---
  let monsoonAlert = 'CLEAR';
  if (weather_code >= 95) monsoonAlert = 'RED ALERT';
  else if (weather_code >= 80 || rainRate > 10) monsoonAlert = 'ORANGE ALERT';
  else if (weather_code >= 61 || rainRate > 3) monsoonAlert = 'YELLOW ALERT';
  else if (weather_code >= 51) monsoonAlert = 'GREEN ADVISORY';

  return {
    rainImpactPct,
    windImpactPct,
    temperatureImpactPct,
    visibilityImpactPct,
    humidityDiscomfortPct,
    compositeImpact,
    waterloggingRisk,
    monsoonAlert,
    
    // Direct simulation engine parameters
    simulationParams: {
      rainImpactPct: Math.round(rainImpactPct),
      temperatureStressPct: temperatureImpactPct,
      windDisruptionPct: windImpactPct
    }
  };
}

// In-memory cache to avoid hammering the API
let weatherCache = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch live weather from Open-Meteo API.
 * Returns structured weather data with operational impact analysis.
 */
export async function fetchLiveWeather() {
  const now = Date.now();
  
  // Return cached data if fresh enough
  if (weatherCache && (now - lastFetchTime) < CACHE_DURATION_MS) {
    return { ...weatherCache, cached: true };
  }

  const url = `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${BKC_LAT}&longitude=${BKC_LON}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m` +
    `&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,rain,weather_code,wind_speed_10m` +
    `&forecast_days=2` +
    `&timezone=Asia%2FKolkata`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo API HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    const current = data.current;
    const weatherInfo = getWeatherInfo(current.weather_code);
    const impact = calculateWeatherImpact(current);

    // Extract next 12 hours of hourly forecast
    const hourlyForecast = [];
    const currentHourIndex = data.hourly.time.findIndex(t => new Date(t) >= new Date());
    const startIdx = Math.max(0, currentHourIndex);
    for (let i = startIdx; i < Math.min(startIdx + 12, data.hourly.time.length); i++) {
      const hourInfo = getWeatherInfo(data.hourly.weather_code[i]);
      hourlyForecast.push({
        time: data.hourly.time[i],
        temperature: data.hourly.temperature_2m[i],
        humidity: data.hourly.relative_humidity_2m[i],
        precipitationProbability: data.hourly.precipitation_probability[i],
        precipitation: data.hourly.precipitation[i],
        rain: data.hourly.rain[i],
        weatherCode: data.hourly.weather_code[i],
        weatherLabel: hourInfo.label,
        weatherIcon: hourInfo.icon,
        severity: hourInfo.severity,
        windSpeed: data.hourly.wind_speed_10m[i]
      });
    }

    // Find worst upcoming weather in next 6 hours
    const next6h = hourlyForecast.slice(0, 6);
    const maxUpcomingRain = Math.max(...next6h.map(h => h.rain || 0));
    const maxUpcomingPrecipProb = Math.max(...next6h.map(h => h.precipitationProbability || 0));
    const worstUpcomingCode = Math.max(...next6h.map(h => h.weatherCode || 0));
    const worstUpcomingInfo = getWeatherInfo(worstUpcomingCode);

    const result = {
      source: 'Open-Meteo API (Live)',
      isLive: true,
      cached: false,
      fetchedAt: new Date().toISOString(),
      location: {
        name: 'Jio World Convention Centre, BKC, Mumbai',
        latitude: BKC_LAT,
        longitude: BKC_LON
      },
      current: {
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        precipitation: current.precipitation,
        rain: current.rain,
        weatherCode: current.weather_code,
        weatherLabel: weatherInfo.label,
        weatherIcon: weatherInfo.icon,
        severity: weatherInfo.severity,
        windSpeed: current.wind_speed_10m,
        windDirection: current.wind_direction_10m,
        windGusts: current.wind_gusts_10m
      },
      impact,
      hourlyForecast,
      upcomingRisk: {
        maxRainNext6h: maxUpcomingRain,
        maxPrecipProbNext6h: maxUpcomingPrecipProb,
        worstCondition: worstUpcomingInfo.label,
        worstSeverity: worstUpcomingInfo.severity,
        worstIcon: worstUpcomingInfo.icon,
        deteriorating: maxUpcomingRain > (current.rain || 0)
      }
    };

    // Cache the result
    weatherCache = result;
    lastFetchTime = now;

    return result;
  } catch (err) {
    console.error('[WeatherService] Failed to fetch live weather:', err.message);

    // If we have stale cache, return it with warning
    if (weatherCache) {
      return { ...weatherCache, cached: true, stale: true, error: err.message };
    }

    // Return safe fallback (clear weather, no impact)
    return {
      source: 'Fallback (API Unavailable)',
      isLive: false,
      cached: false,
      error: err.message,
      fetchedAt: new Date().toISOString(),
      location: { name: 'BKC, Mumbai', latitude: BKC_LAT, longitude: BKC_LON },
      current: {
        temperature: 32,
        feelsLike: 35,
        humidity: 72,
        precipitation: 0,
        rain: 0,
        weatherCode: 2,
        weatherLabel: 'Partly Cloudy',
        weatherIcon: '⛅',
        severity: 'none',
        windSpeed: 12,
        windDirection: 220,
        windGusts: 18
      },
      impact: calculateWeatherImpact({
        temperature_2m: 32,
        relative_humidity_2m: 72,
        precipitation: 0,
        rain: 0,
        weather_code: 2,
        wind_speed_10m: 12
      }),
      hourlyForecast: [],
      upcomingRisk: {
        maxRainNext6h: 0,
        maxPrecipProbNext6h: 0,
        worstCondition: 'Partly Cloudy',
        worstSeverity: 'none',
        worstIcon: '⛅',
        deteriorating: false
      }
    };
  }
}

/**
 * Force refresh the weather cache
 */
export function invalidateWeatherCache() {
  weatherCache = null;
  lastFetchTime = 0;
}
