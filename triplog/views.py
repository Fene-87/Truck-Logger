from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import requests
from datetime import datetime, timedelta
import math

# Create your views here.

class PlanTripView(APIView):
    def post(self, request):
        """
        Receives: current_location, pickup_location, dropoff_location, current_cycle_hours
        Returns: route, stops, ELD log sheets 
        """
        data = request.data
        locations = [
            (data.get('current_location'), 'Start'),
            (data.get('pickup_location'), 'Pickup'),
            (data.get('dropoff_location'), 'Dropoff'),
        ]
        geocoded = []
        for loc, label in locations:
            coords = self.geocode_location(loc)
            if coords:
                geocoded.append({"lat": coords[0], "lng": coords[1], "label": label, "address": loc})
            else:
                return Response({"error": f"Could not geocode {label} location: {loc}"}, status=400)

        # Route using OSRM (public demo server)
        route_coords, total_distance_km, total_duration_h = self.route_osrm(geocoded)

        # Calculate stops: rest every 8h, fuel every 1609km (~1000mi)
        stops = self.calculate_stops(route_coords, total_distance_km, total_duration_h)

        # Generate ELD logs for the trip
        eld_logs = self.generate_eld_logs_hos(total_distance_km, stops)

        return Response({
            "route": [{"lat": lat, "lng": lng, "label": "Route"} for lat, lng in route_coords],
            "stops": stops,
            "eld_logs": eld_logs
        }, status=status.HTTP_200_OK)

    def geocode_location(self, location):
        if not location:
            return None
        url = "https://nominatim.openstreetmap.org/search"
        params = {'q': location, 'format': 'json', 'limit': 1}
        try:
            resp = requests.get(url, params=params, headers={'User-Agent': 'eld-log-demo'})
            resp.raise_for_status()
            results = resp.json()
            if results:
                return float(results[0]['lat']), float(results[0]['lon'])
        except Exception:
            pass
        return None

    def route_osrm(self, geocoded):
        coords_str = ';'.join(f"{p['lng']},{p['lat']}" for p in geocoded)
        url = f"http://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=geojson"
        try:
            resp = requests.get(url)
            resp.raise_for_status()
            data = resp.json()
            route = data['routes'][0]
            geometry = route['geometry']['coordinates']  # [lng, lat]
            coords = [(lat, lng) for lng, lat in geometry]
            distance_km = route['distance'] / 1000
            duration_h = route['duration'] / 3600
            return coords, distance_km, duration_h
        except Exception:
            # fallback: just connect points
            coords = [(p['lat'], p['lng']) for p in geocoded]
            return coords, 0, 0

    def calculate_stops(self, route_coords, total_distance_km, total_duration_h):
        stops = []
        # Rest stop every 8 hours
        rest_interval_h = 8
        # Fuel stop every 1609 km (~1000 mi)
        fuel_interval_km = 1609
        num_rests = int(total_duration_h // rest_interval_h)
        num_fuels = int(total_distance_km // fuel_interval_km)
        for i in range(1, num_rests + 1):
            idx = int(i * rest_interval_h / total_duration_h * (len(route_coords) - 1))
            lat, lng = route_coords[idx]
            stops.append({"lat": lat, "lng": lng, "type": "rest", "duration_min": 30})
        for i in range(1, num_fuels + 1):
            idx = int(i * fuel_interval_km / total_distance_km * (len(route_coords) - 1))
            lat, lng = route_coords[idx]
            stops.append({"lat": lat, "lng": lng, "type": "fuel", "duration_min": 60})
        return stops

    def generate_eld_logs_hos(self, total_distance_km, stops):
        logs = []
        avg_speed_kmh = 95  # 60 mph
        max_drive_per_day = 11
        max_on_duty_per_day = 14
        break_after_hours = 8
        min_break_min = 30
        off_duty_min = 600  # 10 hours off duty in minutes
        pickup_drop_min = 60  # 1 hour on duty for pickup/drop
        cycle_limit_h = 70
        distance_left = total_distance_km
        cycle_hours_used = 0
        cur_date = datetime.now()
        day_num = 1
        while distance_left > 0 and cycle_hours_used < cycle_limit_h:
            day_log = {"date": cur_date.strftime('%Y-%m-%d'), "statuses": [], "summary": {}}
            statuses = []
            time = 6.0
            on_duty = 1.0  # Pre-trip
            statuses.append({"start": "06:00", "end": "07:00", "status": "On Duty", "desc": "Pre-trip inspection"})
            time += 1.0
            # Driving
            drive_hours = min(max_drive_per_day, (cycle_limit_h - cycle_hours_used), distance_left / avg_speed_kmh)
            on_duty += drive_hours
            drive_km = min(avg_speed_kmh * drive_hours, distance_left)
            # Insert break after 8h if needed
            had_break = False
            if drive_hours > break_after_hours:
                first_leg = break_after_hours
                second_leg = drive_hours - break_after_hours
                statuses.append({"start": f"{int(time):02d}:00", "end": f"{int(time+first_leg):02d}:00", "status": "Driving", "desc": "Driving (before break)"})
                time += first_leg
                statuses.append({"start": f"{int(time):02d}:00", "end": f"{int(time):02d}:30", "status": "Break", "desc": "30-min break (HOS)"})
                time += 0.5
                had_break = True
                statuses.append({"start": f"{int(time):02d}:30", "end": f"{int(time+second_leg):02d}:30", "status": "Driving", "desc": "Driving (after break)"})
                time += second_leg
            else:
                statuses.append({"start": f"{int(time):02d}:00", "end": f"{int(time+drive_hours):02d}:00", "status": "Driving", "desc": "Driving"})
                time += drive_hours
            # Post-trip on duty
            statuses.append({"start": f"{int(time):02d}:00", "end": f"{int(time+1):02d}:00", "status": "On Duty", "desc": "Post-trip inspection"})
            on_duty += 1.0
            time += 1.0
            # Off Duty
            off_duty_start = int(time)
            statuses.append({"start": f"{off_duty_start:02d}:00", "end": "22:00", "status": "Off Duty", "desc": "Off duty/rest"})
            # Summary
            day_log["summary"] = {
                "miles_driven": round(drive_km * 0.621371, 1),
                "driving_hours": round(drive_hours, 2),
                "on_duty_hours": round(on_duty, 2),
                "break_minutes": min_break_min if had_break else 0,
                "off_duty_hours": 22 - (6 + on_duty + (0.5 if had_break else 0)),
                "hos_notes": f"Max {max_drive_per_day}h driving, {max_on_duty_per_day}h on duty, 30min break after 8h, 10h off duty, 70h/8d cycle"
            }
            day_log["statuses"] = statuses
            logs.append(day_log)
            distance_left -= drive_km
            cycle_hours_used += drive_hours + on_duty
            cur_date += timedelta(days=1)
            day_num += 1
        return logs
