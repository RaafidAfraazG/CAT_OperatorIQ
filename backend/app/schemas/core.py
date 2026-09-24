from pydantic import BaseModel, ConfigDict
from typing import Any

class Site(BaseModel):
    site_id: Any = None
    site_name: Any = None
    site_type: Any = None
    location_region: Any = None
    terrain_type: Any = None
    elevation_m: Any = None
    average_slope_percent: Any = None
    ground_type: Any = None
    model_config = ConfigDict(from_attributes=True)

class Operator(BaseModel):
    operator_id: Any = None
    operator_name: Any = None
    experience_years: Any = None
    skill_level: Any = None
    certification_level: Any = None
    training_score: Any = None
    safety_score: Any = None
    average_productivity_score: Any = None
    model_config = ConfigDict(from_attributes=True)

class Machine(BaseModel):
    machine_id: Any = None
    machine_type: Any = None
    machine_model: Any = None
    manufacturer: Any = None
    manufacturing_year: Any = None
    machine_age_years: Any = None
    engine_type: Any = None
    rated_power_kw: Any = None
    fuel_capacity_l: Any = None
    operating_weight_kg: Any = None
    site_id: Any = None
    status: Any = None
    model_config = ConfigDict(from_attributes=True)

class Task(BaseModel):
    task_id: Any = None
    machine_id: Any = None
    operator_id: Any = None
    site_id: Any = None
    task_type: Any = None
    task_status: Any = None
    scheduled_start: Any = None
    scheduled_end: Any = None
    target_quantity: Any = None
    quantity_unit: Any = None
    estimated_duration_min: Any = None
    actual_duration_min: Any = None
    task_efficiency: Any = None
    model_config = ConfigDict(from_attributes=True)

class TaskHistory(BaseModel):
    task_id: Any = None
    source_task_id: Any = None
    machine_type: Any = None
    machine_model: Any = None
    task_type: Any = None
    operator_skill_level: Any = None
    operator_experience_years: Any = None
    material_type: Any = None
    material_density: Any = None
    target_quantity: Any = None
    terrain_type: Any = None
    terrain_slope_percent: Any = None
    soil_moisture: Any = None
    weather_condition: Any = None
    temperature_c: Any = None
    rainfall_mm: Any = None
    visibility_m: Any = None
    distance_m: Any = None
    machine_age_years: Any = None
    idle_ratio: Any = None
    average_engine_load: Any = None
    average_rpm: Any = None
    estimated_duration_min: Any = None
    actual_duration_min: Any = None
    model_config = ConfigDict(from_attributes=True)

class Telemetry(BaseModel):
    telemetry_id: Any = None
    timestamp: Any = None
    machine_id: Any = None
    operator_id: Any = None
    task_id: Any = None
    site_id: Any = None
    engine_on: Any = None
    engine_rpm: Any = None
    engine_load_percent: Any = None
    engine_hours: Any = None
    machine_speed_kmh: Any = None
    fuel_level_percent: Any = None
    fuel_rate_lph: Any = None
    fuel_used_l: Any = None
    hydraulic_pressure_bar: Any = None
    coolant_temperature_c: Any = None
    operating_state: Any = None
    idle_duration_min: Any = None
    load_cycles: Any = None
    bucket_or_attachment_load_percent: Any = None
    seatbelt_status: Any = None
    nearest_person_distance_m: Any = None
    nearest_vehicle_distance_m: Any = None
    nearest_obstacle_distance_m: Any = None
    model_config = ConfigDict(from_attributes=True)

class SafetyEvent(BaseModel):
    event_id: Any = None
    timestamp: Any = None
    machine_id: Any = None
    operator_id: Any = None
    task_id: Any = None
    site_id: Any = None
    event_type: Any = None
    severity: Any = None
    machine_speed_kmh: Any = None
    machine_state: Any = None
    distance_to_person_m: Any = None
    distance_to_vehicle_m: Any = None
    distance_to_obstacle_m: Any = None
    seatbelt_status: Any = None
    duration_seconds: Any = None
    resolved: Any = None
    model_config = ConfigDict(from_attributes=True)

class Incident(BaseModel):
    incident_id: Any = None
    timestamp: Any = None
    machine_id: Any = None
    operator_id: Any = None
    task_id: Any = None
    site_id: Any = None
    incident_type: Any = None
    severity: Any = None
    description: Any = None
    location_zone: Any = None
    injury_occurred: Any = None
    machine_damage: Any = None
    resolved: Any = None
    operator_reported: Any = None
    model_config = ConfigDict(from_attributes=True)

class FuelUsage(BaseModel):
    fuel_record_id: Any = None
    timestamp: Any = None
    machine_id: Any = None
    operator_id: Any = None
    task_id: Any = None
    fuel_start_l: Any = None
    fuel_end_l: Any = None
    fuel_used_l: Any = None
    fuel_rate_lph: Any = None
    operating_hours: Any = None
    idle_hours: Any = None
    idle_fuel_l: Any = None
    working_fuel_l: Any = None
    fuel_efficiency_l_per_hour: Any = None
    expected_fuel_rate_lph: Any = None
    fuel_deviation_percent: Any = None
    model_config = ConfigDict(from_attributes=True)

class OperatorBehavior(BaseModel):
    behavior_id: Any = None
    timestamp: Any = None
    operator_id: Any = None
    machine_id: Any = None
    task_id: Any = None
    idle_ratio: Any = None
    average_rpm: Any = None
    max_rpm: Any = None
    average_speed: Any = None
    hard_braking_count: Any = None
    rapid_acceleration_count: Any = None
    reverse_count: Any = None
    seatbelt_violation_count: Any = None
    proximity_event_count: Any = None
    fuel_efficiency: Any = None
    task_efficiency: Any = None
    behavior_score: Any = None
    model_config = ConfigDict(from_attributes=True)

class Environment(BaseModel):
    env_id: Any = None
    timestamp: Any = None
    site_id: Any = None
    temperature_c: Any = None
    humidity_percent: Any = None
    rainfall_mm: Any = None
    wind_speed_kmh: Any = None
    weather_condition: Any = None
    visibility_m: Any = None
    soil_moisture_percent: Any = None
    soil_type: Any = None
    terrain_slope_percent: Any = None
    ground_condition: Any = None
    dust_level: Any = None
    model_config = ConfigDict(from_attributes=True)

class TrainingModule(BaseModel):
    training_id: Any = None
    title: Any = None
    category: Any = None
    difficulty: Any = None
    duration_min: Any = None
    description: Any = None
    trigger_condition: Any = None
    model_config = ConfigDict(from_attributes=True)

class TrainingProgress(BaseModel):
    progress_id: Any = None
    operator_id: Any = None
    training_id: Any = None
    assigned_date: Any = None
    completion_date: Any = None
    status: Any = None
    score: Any = None
    reason_recommended: Any = None
    model_config = ConfigDict(from_attributes=True)

class DailyTask(BaseModel):
    daily_task_id: Any = None
    date: Any = None
    operator_id: Any = None
    machine_id: Any = None
    task_id: Any = None
    priority: Any = None
    scheduled_start: Any = None
    scheduled_end: Any = None
    task_type: Any = None
    location_zone: Any = None
    target_quantity: Any = None
    status: Any = None
    model_config = ConfigDict(from_attributes=True)

class Alert(BaseModel):
    alert_id: Any = None
    timestamp: Any = None
    machine_id: Any = None
    operator_id: Any = None
    task_id: Any = None
    alert_type: Any = None
    severity: Any = None
    source: Any = None
    message: Any = None
    recommended_action: Any = None
    resolved: Any = None
    model_config = ConfigDict(from_attributes=True)

class DashboardSummary(BaseModel):
    active_machines: int
    active_operators: int
    pending_tasks: int
    active_alerts: int
