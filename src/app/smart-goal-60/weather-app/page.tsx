'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function WeatherApp() {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWeather = async () => {
    if (!city.trim()) return;
    setLoading(true);
    setError('');
    setWeatherData(null);

    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
      );
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        setError('City not found. Please try again.');
        setLoading(false);
        return;
      }
      const { latitude, longitude, name, country, elevation, timezone } = geoData.results[0];

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,precipitation,weathercode,windspeed_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,windspeed_10m_max&timezone=auto&forecast_days=7`
      );
      const data = await weatherRes.json();

      setWeatherData({
        city: name,
        country: country,
        elevation: elevation,
        current: data.current_weather,
        hourly: data.hourly,
        daily: data.daily,
      });
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') fetchWeather();
  };

  const getWeatherIcon = (code: number): string => {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 49) return '🌫️';
    if (code <= 59) return '🌧️';
    if (code <= 69) return '❄️';
    if (code <= 79) return '🌨️';
    if (code <= 99) return '🌦️';
    return '🌤️';
  };

  const formatTime = (time: string) => {
    return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString([], { weekday: 'short' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadcrumbLink}>Home</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <Link href="/smart-goal-60" className={styles.breadcrumbLink}>Frontend Mini‑Challenges</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <span className={styles.breadcrumbCurrent}>Weather</span>
      </div>

      <h1 className={styles.title}>Weather</h1>
      <p className={styles.subtitle}>Current weather for any city.</p>

      <div className={styles.search}>
        <input
          type="text"
          className={styles.input}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search for a city…"
        />
        <button className={styles.button} onClick={fetchWeather} disabled={loading}>
          {loading ? '…' : '→'}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {weatherData && (
        <>
          <div className={styles.location}>
            <span className={styles.cityName}>📍{weatherData.city}</span>
            <span className={styles.countryName}>{weatherData.country}</span>
            <span className={styles.elevation}>⛰️ {weatherData.elevation}m</span>
          </div>

          <div className={styles.current}>
            <div className={styles.currentMain}>
              <span className={styles.currentIcon}>{getWeatherIcon(weatherData.current.weathercode)}</span>
              <div>
                <span className={styles.currentTemp}>{Math.round(weatherData.current.temperature)}°C</span>
                <span className={styles.currentDesc}>Clear sky</span>
              </div>
            </div>
            <div className={styles.currentDetails}>
              <span>💨 {weatherData.current.windspeed} km/h</span>
              <span>🕐 {formatTime(weatherData.current.time)}</span>
            </div>
          </div>

          {/* Hourly */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Hourly</h3>
            <div className={styles.hourlyScroll}>
              {weatherData.hourly.time.slice(0, 24).map((time: string, index: number) => {
                const temp = Math.round(weatherData.hourly.temperature_2m[index]);
                const humidity = weatherData.hourly.relativehumidity_2m[index];
                const code = weatherData.hourly.weathercode?.[index] || 0;
                return (
                  <div key={index} className={styles.hourlyItem}>
                    <span className={styles.hourlyTime}>{formatTime(time)}</span>
                    <span className={styles.hourlyIcon}>{getWeatherIcon(code)}</span>
                    <span className={styles.hourlyTemp}>{temp}°</span>
                    <span className={styles.hourlyDetail}>💧{humidity}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>7-Day</h3>
            <div className={styles.dailyList}>
              {weatherData.daily.time.map((date: string, index: number) => {
                const max = Math.round(weatherData.daily.temperature_2m_max[index]);
                const min = Math.round(weatherData.daily.temperature_2m_min[index]);
                const code = weatherData.daily.weathercode[index];
                const rain = weatherData.daily.precipitation_sum[index];
                const wind = weatherData.daily.windspeed_10m_max[index];
                const range = max - min;
                const minBar = 20; // fixed left offset for bar
                const barWidth = Math.max(40, range * 6); // scale
                return (
                  <div key={index} className={styles.dailyItem}>
                    <span className={styles.dailyDate}>{formatDate(date)}</span>
                    <span className={styles.dailyIcon}>{getWeatherIcon(code)}</span>
                    <div className={styles.tempBarWrapper}>
                      <span className={styles.tempMin}>{min}°</span>
                      <div className={styles.tempBarTrack}>
                        <div
                          className={styles.tempBarFill}
                          style={{
                            width: `${range * 6}px`,
                            background: `linear-gradient(to right, #6b7a6e, #a8c4a0)`,
                          }}
                        />
                      </div>
                      <span className={styles.tempMax}>{max}°</span>
                    </div>
                    <span className={styles.dailyRain}>🌧️{rain}mm</span>
                    <span className={styles.dailyWind}>💨{wind}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {!weatherData && !loading && !error && (
        <p className={styles.empty}>Enter a city to see the weather forecast.</p>
      )}
    </div>
  );
}