import { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import Grid from '@mui/material/Grid';

interface TripFormProps {
  onSubmit: (data: any) => void;
  loading: boolean;
}

export default function TripForm({ onSubmit, loading }: TripFormProps) {
  const [currentLocation, setCurrentLocation] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [cycleHours, setCycleHours] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      current_location: currentLocation,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation,
      current_cycle_hours: cycleHours,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Current Location"
            value={currentLocation}
            onChange={e => setCurrentLocation(e.target.value)}
            required
            fullWidth
            autoFocus
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Pickup Location"
            value={pickupLocation}
            onChange={e => setPickupLocation(e.target.value)}
            required
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Dropoff Location"
            value={dropoffLocation}
            onChange={e => setDropoffLocation(e.target.value)}
            required
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Current Cycle Used (hrs)"
            type="number"
            value={cycleHours}
            onChange={e => setCycleHours(Number(e.target.value))}
            required
            fullWidth
            inputProps={{ min: 0, max: 70 }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ mt: 1 }}
          >
            {loading ? 'Planning...' : 'Plan Trip'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
