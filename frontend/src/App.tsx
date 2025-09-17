import { useState } from 'react';
import { Container, Typography, Box, Paper, Alert, CircularProgress } from '@mui/material';
import TripForm from './TripForm';
import MapView from './MapView';
import ELDLogSheet from './ELDLogSheet';
import './App.css';

function App() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlanTrip = async (tripData: any) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/plan-trip/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to plan trip');
      }
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6fa', py: 5 }}>
      <Container maxWidth="md">
        <Paper elevation={4} sx={{ p: 4, mb: 4 }}>
          <Typography variant="h3" align="center" gutterBottom fontWeight={700} color="primary">
            Truck Trip Planner & ELD Log Visualizer
          </Typography>
          <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
            Enter your trip details below to view your route, required stops, and daily ELD log sheets.
          </Typography>
          <TripForm onSubmit={handlePlanTrip} loading={loading} />
          {loading && (
            <Box display="flex" justifyContent="center" mt={2}><CircularProgress /></Box>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          )}
        </Paper>
        {result && (
          <>
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom color="primary">Route Map & Stops</Typography>
              <MapView route={result.route} stops={result.stops} />
            </Paper>
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom color="primary">Daily ELD Log Sheets</Typography>
              <ELDLogSheet logs={result.eld_logs} />
            </Paper>
          </>
        )}
      </Container>
    </Box>
  );
}

export default App;
