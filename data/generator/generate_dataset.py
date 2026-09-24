#!/usr/bin/env python3
"""
OperatorIQ Synthetic Dataset Generator
=======================================
Generates a reproducible, relational, multi-machine construction telematics
dataset for the OperatorIQ hackathon project.

Run:
    python3 generate_dataset.py

Output:
    data/*.csv  (15 relational CSV files)

All data is 100% synthetic. Any resemblance to real equipment model numbers
is for realism only (e.g. "EX-320D" style naming), not real product data.
"""

import os
import math
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# ----------------------------------------------------------------------------
# REPRODUCIBILITY
# ----------------------------------------------------------------------------
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
RNG = np.random.default_rng(SEED)

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "generated")
os.makedirs(OUT_DIR, exist_ok=True)


SIM_START = datetime(2025, 1, 1, 0, 0, 0)
SIM_END = datetime(2025, 9, 30, 0, 0, 0)
SIM_DAYS = (SIM_END - SIM_START).days

def rand_choice(options, p=None, size=None):
    return RNG.choice(options, p=p, size=size)

def clip(x, lo, hi):
    return max(lo, min(hi, x))

def missingify(series, rate=0.02, protect=False):
    """Randomly null out `rate` fraction of a pandas Series (unless protected)."""
    if protect:
        return series
    s = series.copy()
    mask = RNG.random(len(s)) < rate
    s = s.astype(object)
    s[mask] = np.nan
    return s

# ============================================================================
# 1. MACHINES
# ============================================================================
print("Generating machines.csv ...")

MACHINE_TYPES = [
    "EXCAVATOR", "WHEEL_LOADER", "DOZER", "MOTOR_GRADER",
    "ARTICULATED_HAULER", "BACKHOE_LOADER", "COMPACTOR",
]

# Synthetic model families per type -> (model_prefix, power_kw_range, fuel_cap_l_range,
#                                        weight_kg_range, typical_life_years)
MACHINE_TYPE_PROFILE = {
    "EXCAVATOR":            dict(prefix="EX",  power=(90, 350),  fuel=(300, 750),  weight=(18000, 90000)),
    "WHEEL_LOADER":         dict(prefix="WL",  power=(100, 330), fuel=(250, 600),  weight=(12000, 45000)),
    "DOZER":                dict(prefix="DZ",  power=(105, 400), fuel=(350, 900),  weight=(16000, 70000)),
    "MOTOR_GRADER":         dict(prefix="MG",  power=(93, 220),  fuel=(300, 500),  weight=(13000, 26000)),
    "ARTICULATED_HAULER":   dict(prefix="AH",  power=(230, 470), fuel=(400, 750),  weight=(20000, 46000)),
    "BACKHOE_LOADER":       dict(prefix="BL",  power=(70, 130),  fuel=(150, 260),  weight=(7000, 14000)),
    "COMPACTOR":            dict(prefix="CP",  power=(70, 240),  fuel=(200, 450),  weight=(9000, 24000)),
}

MANUFACTURERS = ["CatCo", "CatCo", "CatCo", "CatCo", "TerraForge", "IronPeak"]  # CatCo dominant (synthetic brand)
ENGINE_TYPES = ["DIESEL_TIER4F", "DIESEL_TIER4I", "DIESEL_STAGEV", "DIESEL_TIER3"]

N_MACHINES = 42
N_SITES = 15

# site ids assigned later, reserve list now
site_ids = [f"ST{str(i+1).zfill(3)}" for i in range(N_SITES)]

machines = []
for i in range(N_MACHINES):
    mtype = MACHINE_TYPES[i % len(MACHINE_TYPES)] if i < len(MACHINE_TYPES) else rand_choice(MACHINE_TYPES)
    prof = MACHINE_TYPE_PROFILE[mtype]
    machine_id = f"M{str(i+1).zfill(4)}"
    model_num = rand_choice([120, 140, 160, 220, 226, 320, 336, 349, 390, 950, 972, 986])
    model_suffix = rand_choice(["", "D", "D2", "GC", "XE"])
    machine_model = f"{prof['prefix']}-{model_num}{model_suffix}"
    manufacturing_year = int(rand_choice(range(2011, 2025)))
    machine_age_years = round((SIM_START.year - manufacturing_year) + RNG.uniform(-0.3, 0.7), 1)
    machine_age_years = max(0.2, machine_age_years)
    engine_type = rand_choice(ENGINE_TYPES, p=[0.35, 0.25, 0.25, 0.15])
    rated_power_kw = round(RNG.uniform(*prof["power"]), 1)
    fuel_capacity_l = round(RNG.uniform(*prof["fuel"]), 0)
    operating_weight_kg = int(RNG.uniform(*prof["weight"]))
    site_id = rand_choice(site_ids)
    status = rand_choice(["ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "MAINTENANCE", "IDLE_FLEET"], p=[0.55,0.15,0.1,0.1,0.06,0.04])

    machines.append(dict(
        machine_id=machine_id,
        machine_type=mtype,
        machine_model=machine_model,
        manufacturer=rand_choice(MANUFACTURERS),
        manufacturing_year=manufacturing_year,
        machine_age_years=machine_age_years,
        engine_type=engine_type,
        rated_power_kw=rated_power_kw,
        fuel_capacity_l=fuel_capacity_l,
        operating_weight_kg=operating_weight_kg,
        site_id=site_id,
        status=status,
    ))

machines_df = pd.DataFrame(machines)
MACHINE_TYPE_OF = dict(zip(machines_df.machine_id, machines_df.machine_type))
MACHINE_SITE_OF = dict(zip(machines_df.machine_id, machines_df.site_id))
MACHINE_AGE_OF = dict(zip(machines_df.machine_id, machines_df.machine_age_years))
MACHINE_FUELCAP_OF = dict(zip(machines_df.machine_id, machines_df.fuel_capacity_l))
MACHINE_POWER_OF = dict(zip(machines_df.machine_id, machines_df.rated_power_kw))

# ============================================================================
# 2. OPERATORS
# ============================================================================
print("Generating operators.csv ...")

FIRST_NAMES = ["Arjun","Priya","Wei","Maria","John","Fatima","Carlos","Aiko","Liam","Sofia",
               "Noah","Chidi","Elena","Ravi","Grace","Diego","Mei","Ahmed","Olivia","Lucas",
               "Ana","Ivan","Nadia","Sam","Tariq","Yuki","Ben","Isabella","Omar","Zara",
               "Kwame","Mila","Josh","Priyanka","Hassan","Emma","Rahul","Lena","Marco","Aisha",
               "Tom","Nina","Victor","Chloe","Amit","Sara","Leo","Farida","Daniel","Ines"]
LAST_NAMES = ["Nair","Silva","Chen","Gonzalez","Smith","Khan","Rossi","Tanaka","Murphy","Costa",
              "Adeyemi","Ivanov","Kumar","Wong","Torres","Mensah","Popov","Reyes","Haddad","Novak"]

SKILL_LEVELS = ["BEGINNER", "INTERMEDIATE", "EXPERT"]
N_OPERATORS = 55

operators = []
used_names = set()
for i in range(N_OPERATORS):
    operator_id = f"OP{str(i+1).zfill(4)}"
    while True:
        nm = f"{rand_choice(FIRST_NAMES)} {rand_choice(LAST_NAMES)}"
        if nm not in used_names:
            used_names.add(nm)
            break
    skill = rand_choice(SKILL_LEVELS, p=[0.30, 0.45, 0.25])
    if skill == "BEGINNER":
        experience_years = round(RNG.uniform(0.2, 2.5), 1)
        certification_level = rand_choice(["BASIC", "BASIC", "STANDARD"])
        training_score = round(RNG.normal(62, 10), 1)
        safety_score = round(RNG.normal(72, 10), 1)
        productivity = round(RNG.normal(60, 10), 1)
    elif skill == "INTERMEDIATE":
        experience_years = round(RNG.uniform(2, 8), 1)
        certification_level = rand_choice(["STANDARD", "STANDARD", "ADVANCED"])
        training_score = round(RNG.normal(75, 8), 1)
        safety_score = round(RNG.normal(80, 8), 1)
        productivity = round(RNG.normal(75, 8), 1)
    else:
        experience_years = round(RNG.uniform(7, 25), 1)
        certification_level = rand_choice(["ADVANCED", "ADVANCED", "MASTER"])
        training_score = round(RNG.normal(88, 6), 1)
        safety_score = round(RNG.normal(90, 6), 1)
        productivity = round(RNG.normal(88, 6), 1)

    # small noise + realistic bounds; not every expert is perfect
    training_score = clip(training_score + RNG.normal(0, 3), 30, 100)
    safety_score = clip(safety_score + RNG.normal(0, 3), 30, 100)
    productivity = clip(productivity + RNG.normal(0, 4), 25, 100)

    operators.append(dict(
        operator_id=operator_id,
        operator_name=nm,
        experience_years=experience_years,
        skill_level=skill,
        certification_level=certification_level,
        training_score=round(training_score, 1),
        safety_score=round(safety_score, 1),
        average_productivity_score=round(productivity, 1),
    ))

operators_df = pd.DataFrame(operators)
OPERATOR_SKILL_OF = dict(zip(operators_df.operator_id, operators_df.skill_level))
OPERATOR_EXP_OF = dict(zip(operators_df.operator_id, operators_df.experience_years))
OPERATOR_SAFETY_OF = dict(zip(operators_df.operator_id, operators_df.safety_score))
OPERATOR_PROD_OF = dict(zip(operators_df.operator_id, operators_df.average_productivity_score))

# Latent behavioral traits per operator (not written to operators.csv directly,
# but drive telemetry / idle / safety patterns consistently across files so
# "some operators have recurring behavior patterns").
OPERATOR_IDLE_BIAS = {}
OPERATOR_HARSH_BIAS = {}
OPERATOR_SEATBELT_RISK = {}
OPERATOR_PROXIMITY_RISK = {}
OPERATOR_RPM_BIAS = {}
for op in operators_df.itertuples():
    skill = op.skill_level
    base_idle = {"BEGINNER": 0.22, "INTERMEDIATE": 0.14, "EXPERT": 0.09}[skill]
    OPERATOR_IDLE_BIAS[op.operator_id] = clip(RNG.normal(base_idle, 0.05), 0.02, 0.55)
    base_harsh = {"BEGINNER": 0.10, "INTERMEDIATE": 0.05, "EXPERT": 0.02}[skill]
    OPERATOR_HARSH_BIAS[op.operator_id] = clip(RNG.normal(base_harsh, 0.03), 0.0, 0.35)
    base_seatbelt = {"BEGINNER": 0.0075, "INTERMEDIATE": 0.0035, "EXPERT": 0.0012}[skill]
    OPERATOR_SEATBELT_RISK[op.operator_id] = clip(RNG.normal(base_seatbelt, 0.003), 0.0, 0.04)
    base_prox = {"BEGINNER": 0.006, "INTERMEDIATE": 0.003, "EXPERT": 0.0012}[skill]
    OPERATOR_PROXIMITY_RISK[op.operator_id] = clip(RNG.normal(base_prox, 0.0025), 0.0, 0.035)
    OPERATOR_RPM_BIAS[op.operator_id] = clip(RNG.normal(1.0, 0.08), 0.8, 1.25)
# A handful of operators are flagged as "high RPM / high fuel" outlier profile
_hi_rpm_ops = RNG.choice(operators_df.operator_id, size=max(3, N_OPERATORS // 12), replace=False)
for oid in _hi_rpm_ops:
    OPERATOR_RPM_BIAS[oid] = clip(OPERATOR_RPM_BIAS[oid] * RNG.uniform(1.15, 1.3), 0.8, 1.5)

# ============================================================================
# 3. SITES
# ============================================================================
print("Generating sites.csv ...")

SITE_TYPES = ["Road Construction", "Mining", "Urban Construction", "Quarry", "Infrastructure", "Earthmoving"]
REGIONS = ["North Valley", "East Ridge", "South Basin", "West Plains", "Central Highlands",
           "Coastal Flats", "River Delta", "Highland Pass"]
TERRAIN_TYPES = ["FLAT", "ROLLING", "HILLY", "MOUNTAINOUS", "UNEVEN"]
GROUND_TYPES = ["CLAY", "SANDY", "ROCKY", "LOAMY", "GRAVEL", "MIXED"]

sites = []
for i, sid in enumerate(site_ids):
    stype = SITE_TYPES[i % len(SITE_TYPES)] if i < len(SITE_TYPES) else rand_choice(SITE_TYPES)
    terrain = rand_choice(TERRAIN_TYPES)
    if terrain in ("MOUNTAINOUS", "HILLY"):
        slope = round(RNG.uniform(8, 30), 1)
        elevation = round(RNG.uniform(400, 2200), 0)
    elif terrain == "ROLLING":
        slope = round(RNG.uniform(3, 10), 1)
        elevation = round(RNG.uniform(100, 800), 0)
    else:
        slope = round(RNG.uniform(0, 4), 1)
        elevation = round(RNG.uniform(5, 300), 0)

    sites.append(dict(
        site_id=sid,
        site_name=f"{rand_choice(REGIONS)} {stype.split()[0]} Site {i+1}",
        site_type=stype,
        location_region=rand_choice(REGIONS),
        terrain_type=terrain,
        elevation_m=elevation,
        average_slope_percent=slope,
        ground_type=rand_choice(GROUND_TYPES),
    ))

sites_df = pd.DataFrame(sites)
SITE_TERRAIN_OF = dict(zip(sites_df.site_id, sites_df.terrain_type))
SITE_SLOPE_OF = dict(zip(sites_df.site_id, sites_df.average_slope_percent))
SITE_TYPE_OF = dict(zip(sites_df.site_id, sites_df.site_type))
SITE_GROUND_OF = dict(zip(sites_df.site_id, sites_df.ground_type))

print(f"  machines={len(machines_df)}  operators={len(operators_df)}  sites={len(sites_df)}")

machines_df.to_csv(os.path.join(OUT_DIR, "machines.csv"), index=False)
operators_df.to_csv(os.path.join(OUT_DIR, "operators.csv"), index=False)
sites_df.to_csv(os.path.join(OUT_DIR, "sites.csv"), index=False)

# ============================================================================
# 4. ENVIRONMENT  (per site, 3 readings/day across the simulation period)
# ============================================================================
print("Generating environment.csv ...")

WEATHER_CONDITIONS = ["SUNNY", "CLOUDY", "RAINY", "WINDY", "STORM", "FOG"]
GROUND_CONDITIONS = ["DRY", "NORMAL", "WET", "MUDDY", "LOOSE", "COMPACT"]

# Regional base climate bias per site (some sites are wetter/drier/hotter)
site_climate_bias = {
    sid: dict(
        rain_bias=RNG.uniform(0.05, 0.30),
        temp_base=RNG.uniform(14, 34),
        wind_base=RNG.uniform(5, 18),
    )
    for sid in site_ids
}

env_rows = []
READING_HOURS = [6, 13, 19]  # morning / midday / evening

for day_offset in range(SIM_DAYS):
    day = SIM_START + timedelta(days=day_offset)
    for sid in site_ids:
        bias = site_climate_bias[sid]
        # Determine the "weather regime" for this site-day (markov-ish persistence)
        roll = RNG.random()
        if roll < bias["rain_bias"] * 0.6:
            day_weather = rand_choice(["RAINY", "STORM"], p=[0.8, 0.2])
        elif roll < bias["rain_bias"]:
            day_weather = "FOG"
        else:
            day_weather = rand_choice(["SUNNY", "CLOUDY", "WINDY"], p=[0.5, 0.35, 0.15])

        for hr in READING_HOURS:
            ts = day.replace(hour=hr)
            weather = day_weather
            # slight per-reading drift
            if RNG.random() < 0.12:
                weather = rand_choice(WEATHER_CONDITIONS)

            temp = bias["temp_base"] + (2.5 if hr == 13 else (-2.0 if hr == 6 else 0.5)) + RNG.normal(0, 2.5)
            if weather == "STORM":
                temp -= RNG.uniform(1, 4)
            humidity = clip(RNG.normal(55, 15) + (25 if weather in ("RAINY", "STORM", "FOG") else 0), 10, 100)

            if weather == "STORM":
                rainfall = round(RNG.uniform(8, 35), 1)
                wind = round(bias["wind_base"] + RNG.uniform(15, 40), 1)
                visibility = round(RNG.uniform(50, 400), 0)
            elif weather == "RAINY":
                rainfall = round(RNG.uniform(1, 15), 1)
                wind = round(bias["wind_base"] + RNG.uniform(0, 10), 1)
                visibility = round(RNG.uniform(300, 2000), 0)
            elif weather == "FOG":
                rainfall = round(RNG.uniform(0, 1), 1)
                wind = round(max(0, bias["wind_base"] - RNG.uniform(0, 5)), 1)
                visibility = round(RNG.uniform(40, 300), 0)
            elif weather == "WINDY":
                rainfall = 0.0
                wind = round(bias["wind_base"] + RNG.uniform(15, 30), 1)
                visibility = round(RNG.uniform(3000, 9000), 0)
            else:  # SUNNY / CLOUDY
                rainfall = 0.0
                wind = round(max(0, bias["wind_base"] + RNG.normal(0, 4)), 1)
                visibility = round(RNG.uniform(4000, 10000), 0)

            # soil moisture responds to rainfall (with site ground-type sensitivity) + slow memory
            ground_type = SITE_GROUND_OF[sid]
            moisture_retention = {"CLAY": 1.3, "LOAMY": 1.1, "MIXED": 1.0, "SANDY": 0.7, "GRAVEL": 0.6, "ROCKY": 0.5}[ground_type]
            soil_moisture = clip(12 + rainfall * 2.2 * moisture_retention + RNG.normal(0, 5), 3, 95)

            if soil_moisture > 60:
                ground_condition = rand_choice(["MUDDY", "WET"], p=[0.55, 0.45])
            elif soil_moisture > 38:
                ground_condition = rand_choice(["WET", "NORMAL"], p=[0.5, 0.5])
            elif soil_moisture < 12:
                ground_condition = rand_choice(["DRY", "LOOSE"], p=[0.6, 0.4])
            else:
                ground_condition = rand_choice(["NORMAL", "COMPACT"], p=[0.7, 0.3])

            if weather in ("SUNNY", "WINDY") and soil_moisture < 20:
                dust_level = rand_choice(["MEDIUM", "HIGH"], p=[0.5, 0.5]) if wind > 15 else rand_choice(["LOW", "MEDIUM"])
            elif weather in ("RAINY", "STORM", "FOG"):
                dust_level = "LOW"
            else:
                dust_level = rand_choice(["LOW", "MEDIUM"], p=[0.7, 0.3])

            env_rows.append(dict(
                timestamp=ts,
                site_id=sid,
                temperature_c=round(temp, 1),
                humidity_percent=round(humidity, 1),
                rainfall_mm=rainfall,
                wind_speed_kmh=wind,
                weather_condition=weather,
                visibility_m=visibility,
                soil_moisture_percent=round(soil_moisture, 1),
                soil_type=ground_type,
                terrain_slope_percent=SITE_SLOPE_OF[sid],
                ground_condition=ground_condition,
                dust_level=dust_level,
            ))

environment_df = pd.DataFrame(env_rows)
# small missing-data noise on non-critical numeric fields
for col in ["humidity_percent", "wind_speed_kmh", "dust_level"]:
    environment_df[col] = missingify(environment_df[col], rate=0.015)

environment_df.to_csv(os.path.join(OUT_DIR, "environment.csv"), index=False)
print(f"  environment rows={len(environment_df)}")

# Fast lookup: nearest environment reading for a given site + timestamp
env_lookup_df = environment_df.dropna(subset=["timestamp"]).copy()
env_lookup_df["timestamp"] = pd.to_datetime(env_lookup_df["timestamp"])
env_lookup_df = env_lookup_df.sort_values(["site_id", "timestamp"])
env_by_site = {sid: g.reset_index(drop=True) for sid, g in env_lookup_df.groupby("site_id")}

def env_at(site_id, ts):
    """Return the environment row closest in time (same site) to ts."""
    g = env_by_site.get(site_id)
    if g is None or len(g) == 0:
        return None
    idx = g["timestamp"].searchsorted(ts)
    idx = min(idx, len(g) - 1)
    if idx > 0 and abs((g["timestamp"].iloc[idx] - ts).total_seconds()) > abs((g["timestamp"].iloc[idx-1] - ts).total_seconds()):
        idx = idx - 1
    return g.iloc[idx]

# ============================================================================
# SHARED TASK-DURATION MODEL
# Used by both tasks.csv and task_history.csv so relationships are consistent.
# ============================================================================

TASK_TYPES = ["Earth Excavation", "Trenching", "Material Loading", "Grading",
              "Hauling", "Demolition", "Soil Compaction", "Road Preparation",
              "Material Stockpiling"]

# task_type -> (quantity_unit, base_rate_units_per_min, best_machine_types)
TASK_PROFILE = {
    "Earth Excavation":    dict(unit="m3",   rate=2.6,  best=["EXCAVATOR"]),
    "Trenching":           dict(unit="m",    rate=1.3,  best=["EXCAVATOR", "BACKHOE_LOADER"]),
    "Material Loading":    dict(unit="tons", rate=3.2,  best=["WHEEL_LOADER", "EXCAVATOR"]),
    "Grading":             dict(unit="m2",   rate=16.0, best=["MOTOR_GRADER"]),
    "Hauling":             dict(unit="tons", rate=2.2,  best=["ARTICULATED_HAULER"]),
    "Demolition":          dict(unit="m3",   rate=1.9,  best=["EXCAVATOR", "DOZER"]),
    "Soil Compaction":     dict(unit="m2",   rate=21.0, best=["COMPACTOR"]),
    "Road Preparation":    dict(unit="m2",   rate=10.5, best=["MOTOR_GRADER", "COMPACTOR", "DOZER"]),
    "Material Stockpiling":dict(unit="tons", rate=3.6,  best=["WHEEL_LOADER", "DOZER"]),
}

MATERIAL_TYPES = ["TOPSOIL", "CLAY", "SAND", "GRAVEL", "ROCK_FILL", "ASPHALT_MILLINGS", "CRUSHED_STONE"]
MATERIAL_DENSITY = {  # tons per m3 (approx, synthetic)
    "TOPSOIL": 1.3, "CLAY": 1.6, "SAND": 1.5, "GRAVEL": 1.8,
    "ROCK_FILL": 2.2, "ASPHALT_MILLINGS": 1.4, "CRUSHED_STONE": 1.7,
}


def skill_multiplier(skill, experience_years):
    base = {"BEGINNER": 0.78, "INTERMEDIATE": 0.95, "EXPERT": 1.12}[skill]
    exp_bonus = clip(experience_years / 40.0, 0, 0.12)
    return base + exp_bonus


def simulate_task(machine_type, task_type, skill, experience_years, terrain_slope,
                   soil_moisture, weather, rainfall, visibility, machine_age,
                   idle_ratio, distance_m, material_type):
    """Returns (target_quantity, quantity_unit, estimated_duration_min, actual_duration_min,
    task_efficiency) with realistic, non-linear, noisy relationships."""
    prof = TASK_PROFILE[task_type]
    unit = prof["unit"]

    # quantity scale varies by unit type
    if unit == "m3":
        target_quantity = round(RNG.uniform(80, 1400), 1)
    elif unit == "m":
        target_quantity = round(RNG.uniform(40, 600), 1)
    elif unit == "m2":
        target_quantity = round(RNG.uniform(300, 6000), 1)
    else:  # tons
        target_quantity = round(RNG.uniform(100, 2500), 1)

    # --- effective production rate ---
    rate = prof["rate"]
    type_match = 1.25 if machine_type in prof["best"] else RNG.uniform(0.55, 0.80)
    sk_mult = skill_multiplier(skill, experience_years)
    age_penalty = clip(1.0 - (machine_age - 3) * 0.008, 0.75, 1.05) if machine_age > 3 else 1.0
    slope_penalty = clip(1.0 - terrain_slope * 0.012, 0.55, 1.0)
    moisture_penalty = clip(1.0 - max(0, soil_moisture - 35) * 0.006, 0.6, 1.0)
    weather_penalty = {"SUNNY": 1.0, "CLOUDY": 0.98, "WINDY": 0.93,
                        "RAINY": 0.82, "FOG": 0.85, "STORM": 0.55}[weather]
    visibility_penalty = clip(0.75 + visibility / 12000.0, 0.75, 1.0)
    density = MATERIAL_DENSITY.get(material_type, 1.5)
    density_penalty = clip(1.15 - (density - 1.3) * 0.10, 0.85, 1.15)
    distance_penalty = 1.0
    if task_type in ("Hauling", "Material Stockpiling"):
        distance_penalty = clip(1.0 - (distance_m - 200) / 8000.0, 0.55, 1.05)

    effective_rate = (rate * type_match * sk_mult * age_penalty * slope_penalty *
                       moisture_penalty * weather_penalty * visibility_penalty *
                       density_penalty * distance_penalty)
    effective_rate = max(effective_rate, rate * 0.15)

    estimated_duration_min = round(target_quantity / (rate * type_match * sk_mult) * RNG.uniform(0.97, 1.05), 1)
    estimated_duration_min = max(estimated_duration_min, 10.0)

    # actual duration additionally penalised by idle time (non-working minutes stack on top)
    core_actual = target_quantity / effective_rate
    idle_inflation = core_actual * idle_ratio * RNG.uniform(0.5, 1.3)
    noise = RNG.normal(1.0, 0.08)
    actual_duration_min = round(max(core_actual + idle_inflation, 8.0) * noise, 1)
    actual_duration_min = max(actual_duration_min, 8.0)

    task_efficiency = round(clip(estimated_duration_min / actual_duration_min, 0.15, 1.6), 3)

    return target_quantity, unit, estimated_duration_min, actual_duration_min, task_efficiency

# ============================================================================
# 5. TASKS
# ============================================================================
print("Generating tasks.csv ...")

N_TASKS = 850
TASK_STATUS_POOL = ["COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "IN_PROGRESS",
                     "DELAYED", "CANCELLED", "SCHEDULED"]

machine_ids = machines_df.machine_id.tolist()
operator_ids = operators_df.operator_id.tolist()

tasks = []
task_env_cache = {}  # task_id -> env row used, for reuse by telemetry/fuel later

for i in range(N_TASKS):
    task_id = f"T{str(i+1).zfill(5)}"
    machine_id = rand_choice(machine_ids)
    mtype = MACHINE_TYPE_OF[machine_id]
    site_id = MACHINE_SITE_OF[machine_id]
    operator_id = rand_choice(operator_ids)

    # bias task_type towards ones the machine is good at, ~70% of the time
    if RNG.random() < 0.7:
        candidates = [t for t, p in TASK_PROFILE.items() if mtype in p["best"]]
        task_type = rand_choice(candidates) if candidates else rand_choice(TASK_TYPES)
    else:
        task_type = rand_choice(TASK_TYPES)

    day_offset = int(RNG.integers(0, SIM_DAYS))
    start_hour = int(RNG.integers(6, 16))
    scheduled_start = SIM_START + timedelta(days=day_offset, hours=start_hour, minutes=int(RNG.integers(0, 60)))

    env_row = env_at(site_id, scheduled_start)
    weather = env_row["weather_condition"] if env_row is not None else "SUNNY"
    soil_moisture = env_row["soil_moisture_percent"] if env_row is not None else 20.0
    rainfall = env_row["rainfall_mm"] if env_row is not None else 0.0
    visibility = env_row["visibility_m"] if env_row is not None else 8000.0
    slope = SITE_SLOPE_OF[site_id]

    skill = OPERATOR_SKILL_OF[operator_id]
    experience = OPERATOR_EXP_OF[operator_id]
    machine_age = MACHINE_AGE_OF[machine_id]
    idle_ratio = clip(RNG.normal(OPERATOR_IDLE_BIAS[operator_id], 0.04), 0.01, 0.7)
    distance_m = round(RNG.uniform(80, 3500), 0)
    material_type = rand_choice(MATERIAL_TYPES)

    target_quantity, unit, est_dur, act_dur, efficiency = simulate_task(
        mtype, task_type, skill, experience, slope, soil_moisture, weather,
        rainfall, visibility, machine_age, idle_ratio, distance_m, material_type,
    )

    scheduled_end = scheduled_start + timedelta(minutes=est_dur)
    status = rand_choice(TASK_STATUS_POOL)

    if status in ("SCHEDULED", "CANCELLED"):
        actual_duration_min = np.nan
    elif status == "IN_PROGRESS":
        actual_duration_min = round(act_dur * RNG.uniform(0.2, 0.7), 1)  # partial so far
    else:
        actual_duration_min = act_dur

    tasks.append(dict(
        task_id=task_id,
        machine_id=machine_id,
        operator_id=operator_id,
        site_id=site_id,
        task_type=task_type,
        task_status=status,
        scheduled_start=scheduled_start,
        scheduled_end=scheduled_end,
        target_quantity=target_quantity,
        quantity_unit=unit,
        estimated_duration_min=est_dur,
        actual_duration_min=actual_duration_min,
        task_efficiency=efficiency if status == "COMPLETED" else np.nan,
    ))

    task_env_cache[task_id] = dict(weather=weather, soil_moisture=soil_moisture, rainfall=rainfall,
                                    visibility=visibility, slope=slope, idle_ratio=idle_ratio,
                                    distance_m=distance_m, material_type=material_type,
                                    machine_id=machine_id, operator_id=operator_id, site_id=site_id,
                                    machine_type=mtype, task_type=task_type, status=status,
                                    scheduled_start=scheduled_start,
                                    duration_min=(act_dur if status in ("COMPLETED", "DELAYED") else est_dur))

tasks_df = pd.DataFrame(tasks)
tasks_df.to_csv(os.path.join(OUT_DIR, "tasks.csv"), index=False)
print(f"  tasks={len(tasks_df)}")

# ============================================================================
# 6. TASK_HISTORY  (dedicated ML training table for duration prediction)
# ============================================================================
print("Generating task_history.csv ...")

N_TASK_HISTORY = 3500
th_rows = []
for i in range(N_TASK_HISTORY):
    # ~40% reuse a real task's context (grounded), ~60% fresh synthetic combos (volume + coverage)
    if i < len(tasks_df) and RNG.random() < 0.4:
        row = task_env_cache[tasks_df.task_id.iloc[i]]
        source_task_id = tasks_df.task_id.iloc[i]
        machine_id = row["machine_id"]
        mtype = row["machine_type"]
        task_type = row["task_type"]
        operator_id = row["operator_id"]
        site_id = row["site_id"]
        slope = row["slope"]
        soil_moisture = row["soil_moisture"]
        weather = row["weather"]
        rainfall = row["rainfall"]
        visibility = row["visibility"]
        idle_ratio = row["idle_ratio"]
        distance_m = row["distance_m"]
        material_type = row["material_type"]
        task_id = f"TH{str(i+1).zfill(5)}"
    else:
        source_task_id = np.nan
        machine_id = rand_choice(machine_ids)
        mtype = MACHINE_TYPE_OF[machine_id]
        operator_id = rand_choice(operator_ids)
        site_id = MACHINE_SITE_OF[machine_id]
        if RNG.random() < 0.7:
            candidates = [t for t, p in TASK_PROFILE.items() if mtype in p["best"]]
            task_type = rand_choice(candidates) if candidates else rand_choice(TASK_TYPES)
        else:
            task_type = rand_choice(TASK_TYPES)
        slope = clip(RNG.normal(SITE_SLOPE_OF[site_id], 3), 0, 32)
        weather = rand_choice(WEATHER_CONDITIONS, p=[0.38, 0.24, 0.16, 0.12, 0.05, 0.05])
        rainfall = {"SUNNY":0,"CLOUDY":0,"WINDY":0,"RAINY":RNG.uniform(1,15),
                    "STORM":RNG.uniform(8,35),"FOG":RNG.uniform(0,1)}[weather]
        soil_moisture = clip(12 + rainfall * 2.0 + RNG.normal(0, 8), 3, 95)
        visibility = {"SUNNY":RNG.uniform(5000,10000),"CLOUDY":RNG.uniform(3000,9000),
                      "WINDY":RNG.uniform(3000,9000),"RAINY":RNG.uniform(300,2000),
                      "STORM":RNG.uniform(50,400),"FOG":RNG.uniform(40,300)}[weather]
        idle_ratio = clip(RNG.normal(OPERATOR_IDLE_BIAS[operator_id], 0.05), 0.01, 0.7)
        distance_m = round(RNG.uniform(80, 3500), 0)
        material_type = rand_choice(MATERIAL_TYPES)
        task_id = f"TH{str(i+1).zfill(5)}"

    skill = OPERATOR_SKILL_OF[operator_id]
    experience = OPERATOR_EXP_OF[operator_id]
    machine_age = MACHINE_AGE_OF[machine_id]
    temp_c = round(RNG.normal(24, 7) - (0 if weather != "STORM" else 3), 1)

    avg_load = clip(RNG.normal(55, 18) + (10 if task_type in ("Earth Excavation","Demolition") else 0), 8, 100)
    avg_rpm = clip(RNG.normal(1550, 220) * OPERATOR_RPM_BIAS[operator_id], 600, 2400)

    target_quantity, unit, est_dur, act_dur, efficiency = simulate_task(
        mtype, task_type, skill, experience, slope, soil_moisture, weather,
        rainfall, visibility, machine_age, idle_ratio, distance_m, material_type,
    )

    th_rows.append(dict(
        task_id=task_id,
        source_task_id=source_task_id,
        machine_type=mtype,
        machine_model=machines_df.loc[machines_df.machine_id == machine_id, "machine_model"].values[0],
        task_type=task_type,
        operator_skill_level=skill,
        operator_experience_years=experience,
        material_type=material_type,
        material_density=MATERIAL_DENSITY[material_type],
        target_quantity=target_quantity,
        terrain_type=SITE_TERRAIN_OF[site_id],
        terrain_slope_percent=round(slope, 1),
        soil_moisture=round(soil_moisture, 1),
        weather_condition=weather,
        temperature_c=temp_c,
        rainfall_mm=round(rainfall, 1),
        visibility_m=round(visibility, 0),
        distance_m=distance_m,
        machine_age_years=machine_age,
        idle_ratio=round(idle_ratio, 3),
        average_engine_load=round(avg_load, 1),
        average_rpm=round(avg_rpm, 0),
        estimated_duration_min=est_dur,
        actual_duration_min=act_dur,
    ))

task_history_df = pd.DataFrame(th_rows)
# light missingness on non-critical numeric fields
for col in ["temperature_c", "visibility_m", "average_engine_load"]:
    task_history_df[col] = missingify(task_history_df[col], rate=0.02)
task_history_df.to_csv(os.path.join(OUT_DIR, "task_history.csv"), index=False)
print(f"  task_history={len(task_history_df)}")

# ============================================================================
# 7. TELEMETRY  (1-minute interval time series, generated per completed/active task)
# ============================================================================
print("Generating telemetry.csv (this is the big one) ...")

OPERATING_STATES = ["WORKING", "IDLE", "TRAVELING", "LOADING", "DIGGING",
                     "DUMPING", "REVERSING", "WAITING", "MAINTENANCE", "OFF"]

# per machine-type state weightings while "active" on a task (excludes OFF/MAINTENANCE which are edge states)
STATE_WEIGHTS = {
    "EXCAVATOR":          dict(WORKING=0.10, DIGGING=0.32, LOADING=0.12, DUMPING=0.10, IDLE=0.14, TRAVELING=0.08, REVERSING=0.06, WAITING=0.08),
    "WHEEL_LOADER":       dict(WORKING=0.10, LOADING=0.30, DUMPING=0.12, IDLE=0.14, TRAVELING=0.16, REVERSING=0.10, WAITING=0.08),
    "DOZER":              dict(WORKING=0.34, IDLE=0.14, TRAVELING=0.20, REVERSING=0.12, WAITING=0.10, DUMPING=0.10),
    "MOTOR_GRADER":       dict(WORKING=0.42, IDLE=0.12, TRAVELING=0.28, REVERSING=0.08, WAITING=0.10),
    "ARTICULATED_HAULER": dict(WORKING=0.06, TRAVELING=0.44, LOADING=0.12, DUMPING=0.12, IDLE=0.10, REVERSING=0.08, WAITING=0.08),
    "BACKHOE_LOADER":     dict(WORKING=0.14, DIGGING=0.24, LOADING=0.16, DUMPING=0.10, IDLE=0.16, TRAVELING=0.10, REVERSING=0.06, WAITING=0.04),
    "COMPACTOR":          dict(WORKING=0.50, IDLE=0.12, TRAVELING=0.24, REVERSING=0.06, WAITING=0.08),
}

# machine-type baseline telemetry ranges
TYPE_TELEM_PROFILE = {
    "EXCAVATOR":          dict(rpm=(1400,2100), speed_max=8,  hyd=(180,340), lph=(8,32)),
    "WHEEL_LOADER":       dict(rpm=(1500,2300), speed_max=25, hyd=(120,260), lph=(9,30)),
    "DOZER":              dict(rpm=(1400,2000), speed_max=12, hyd=(150,300), lph=(12,38)),
    "MOTOR_GRADER":       dict(rpm=(1500,2200), speed_max=22, hyd=(100,220), lph=(7,22)),
    "ARTICULATED_HAULER": dict(rpm=(1500,2200), speed_max=48, hyd=(100,200), lph=(14,42)),
    "BACKHOE_LOADER":     dict(rpm=(1500,2400), speed_max=20, hyd=(140,260), lph=(5,16)),
    "COMPACTOR":          dict(rpm=(1600,2300), speed_max=14, hyd=(90,180),  lph=(6,18)),
}

telemetry_rows = []
fuel_usage_rows = []
safety_rows = []
incidents_rows = []
behavior_accum = []  # per (task, minute-bucket) collected then aggregated later

EVENT_TYPES_SAFETY = ["SEATBELT_VIOLATION", "PERSON_PROXIMITY", "VEHICLE_PROXIMITY",
                       "OBSTACLE_PROXIMITY", "OVERSPEED", "UNSAFE_REVERSING",
                       "HARSH_BRAKING", "RAPID_ACCELERATION"]

safety_event_counter = 0
incident_counter = 0

active_statuses = {"COMPLETED", "DELAYED", "IN_PROGRESS"}
active_tasks = tasks_df[tasks_df.task_status.isin(active_statuses)].copy()

for row in active_tasks.itertuples():
    task_id = row.task_id
    machine_id = row.machine_id
    operator_id = row.operator_id
    site_id = row.site_id
    mtype = MACHINE_TYPE_OF[machine_id]
    ctx = task_env_cache[task_id]
    duration_min = max(int(round(ctx["duration_min"])), 12)
    duration_min = min(duration_min, 240)  # cap simulated series length (one shift segment) for file-size sanity
    start_ts = ctx["scheduled_start"]

    weights = STATE_WEIGHTS[mtype]
    states_pool = list(weights.keys())
    probs = np.array(list(weights.values()))
    probs = probs / probs.sum()

    prof = TYPE_TELEM_PROFILE[mtype]
    idle_ratio = ctx["idle_ratio"]
    rpm_bias = OPERATOR_RPM_BIAS[operator_id]
    harsh_bias = OPERATOR_HARSH_BIAS[operator_id]
    seatbelt_risk = OPERATOR_SEATBELT_RISK[operator_id]
    proximity_risk = OPERATOR_PROXIMITY_RISK[operator_id]

    fuel_capacity = MACHINE_FUELCAP_OF[machine_id]
    engine_hours_start = round(RNG.uniform(300, 14000), 1)
    fuel_level = RNG.uniform(55, 100)
    engine_hours = engine_hours_start
    idle_accum_min = 0.0
    load_cycles = 0

    # running counters for operator_behavior aggregation
    rpm_list, speed_list = [], []
    hard_brake_ct = rapid_accel_ct = reverse_ct = seatbelt_ct = prox_ct = 0
    fuel_used_total = 0.0
    idle_fuel_total = 0.0
    working_fuel_total = 0.0

    prev_state = "WAITING"
    prev_speed = 0.0
    minutes = np.arange(duration_min)

    # markov-ish state sequence: mostly sample from weights but persist briefly
    state_seq = []
    cur = rand_choice(states_pool, p=probs)
    for m in minutes:
        if RNG.random() > 0.35:  # persistence
            state_seq.append(cur)
        else:
            cur = rand_choice(states_pool, p=probs)
            state_seq.append(cur)
    # occasionally inject idle-heavy operators with extra IDLE runs
    if RNG.random() < min(0.9, idle_ratio * 2.2):
        n_extra_idle = int(duration_min * idle_ratio * RNG.uniform(0.3, 0.7))
        idx_positions = RNG.choice(duration_min, size=min(n_extra_idle, duration_min), replace=False)
        for p in idx_positions:
            state_seq[p] = "IDLE"
    # bookend with WAITING/OFF at very start/end occasionally
    if duration_min > 5:
        state_seq[0] = "WAITING"

    for m_i, state in enumerate(state_seq):
        ts = start_ts + timedelta(minutes=int(m_i))
        engine_on = state != "OFF"
        env_row = env_at(site_id, ts)

        if state == "OFF":
            rpm = 0
            speed = 0.0
            load_pct = 0
            hyd = 0
            coolant = round(RNG.uniform(15, 30), 1)
            lph = 0.0
        elif state in ("IDLE", "WAITING", "MAINTENANCE"):
            rpm = round(clip(RNG.normal(750, 90), 550, 1100) * (1.0 if state != "MAINTENANCE" else 0.0))
            speed = 0.0
            load_pct = round(RNG.uniform(2, 15), 1)
            hyd = round(RNG.uniform(20, 60), 1)
            coolant = round(clip(RNG.normal(78, 6), 55, 98), 1)
            lph = round(RNG.uniform(*prof["lph"]) * 0.18 * rpm_bias, 2)
            idle_accum_min += 1
        else:
            rpm_lo, rpm_hi = prof["rpm"]
            rpm = round(clip(RNG.normal((rpm_lo + rpm_hi) / 2, (rpm_hi - rpm_lo) / 5), rpm_lo * 0.7, rpm_hi) * rpm_bias)
            if state == "TRAVELING":
                speed = round(clip(RNG.normal(prof["speed_max"] * 0.55, prof["speed_max"] * 0.2), 1, prof["speed_max"] * 1.15), 1)
            elif state == "REVERSING":
                speed = round(clip(RNG.normal(4, 2), 0.5, 12), 1)
                reverse_ct += 1
            else:
                speed = round(RNG.uniform(0, 3), 1)
            load_pct = round(clip(RNG.normal(60, 18), 10, 100), 1)
            hyd_lo, hyd_hi = prof["hyd"]
            hyd = round(clip(RNG.normal((hyd_lo + hyd_hi) / 2, (hyd_hi - hyd_lo) / 5), hyd_lo * 0.6, hyd_hi * 1.1), 1)
            coolant = round(clip(RNG.normal(88, 6), 60, 112), 1)
            lph = round(RNG.uniform(*prof["lph"]) * (0.6 + load_pct / 180.0) * rpm_bias, 2)
            if state in ("DIGGING", "LOADING", "DUMPING"):
                load_cycles += 1 if RNG.random() < 0.4 else 0

        # harsh event flags (rare, biased by operator)
        harsh_brake = 1 if (state in ("TRAVELING", "REVERSING") and RNG.random() < 0.0012 * (1 + harsh_bias * 8)) else 0
        rapid_accel = 1 if (state in ("TRAVELING", "WORKING") and RNG.random() < 0.0012 * (1 + harsh_bias * 8)) else 0
        hard_brake_ct += harsh_brake
        rapid_accel_ct += rapid_accel

        fuel_used_step = lph / 60.0
        fuel_used_total += fuel_used_step
        if state in ("IDLE", "WAITING"):
            idle_fuel_total += fuel_used_step
        else:
            working_fuel_total += fuel_used_step
        fuel_level = clip(fuel_level - (fuel_used_step / fuel_capacity * 100), 2, 100)
        engine_hours += 1 / 60.0

        bucket_load = 0
        if state in ("DIGGING", "LOADING", "DUMPING"):
            bucket_load = round(clip(RNG.normal(70, 20), 5, 100), 1)

        seatbelt_status = "FASTENED"
        moving = state not in ("IDLE", "WAITING", "OFF", "MAINTENANCE")

        # baseline (normally-safe) nearest-object distances; only monitored while engine is on
        if engine_on:
            nearest_person_distance_m = round(clip(RNG.normal(22, 10), 3, 60), 1)
            nearest_vehicle_distance_m = round(clip(RNG.normal(28, 12), 3, 70), 1)
            nearest_obstacle_distance_m = round(clip(RNG.normal(18, 9), 2, 55), 1)
        else:
            nearest_person_distance_m = np.nan
            nearest_vehicle_distance_m = np.nan
            nearest_obstacle_distance_m = np.nan

        if moving and RNG.random() < seatbelt_risk:
            seatbelt_status = "UNFASTENED"
            seatbelt_ct += 1
            safety_event_counter += 1
            sev = rand_choice(["LOW", "MEDIUM", "HIGH"], p=[0.5, 0.35, 0.15])
            safety_rows.append(dict(
                event_id=f"SE{str(safety_event_counter).zfill(6)}", timestamp=ts, machine_id=machine_id,
                operator_id=operator_id, task_id=task_id, site_id=site_id, event_type="SEATBELT_VIOLATION",
                severity=sev, machine_speed_kmh=speed, machine_state=state, distance_to_person_m=np.nan,
                distance_to_vehicle_m=np.nan, distance_to_obstacle_m=np.nan, seatbelt_status=seatbelt_status,
                duration_seconds=int(RNG.integers(10, 180)), resolved=rand_choice([True, False], p=[0.75, 0.25]),
            ))

        # proximity events (rare, biased by operator + more likely in WORKING/DIGGING/REVERSING near other equipment)
        if moving and RNG.random() < proximity_risk:
            prox_ct += 1
            safety_event_counter += 1
            etype = rand_choice(["PERSON_PROXIMITY", "VEHICLE_PROXIMITY", "OBSTACLE_PROXIMITY"], p=[0.45, 0.3, 0.25])
            dist = round(RNG.uniform(0.8, 9.0), 1)
            # telemetry's nearest-object reading for this minute must reflect the hazard
            if etype == "PERSON_PROXIMITY":
                nearest_person_distance_m = dist
            elif etype == "VEHICLE_PROXIMITY":
                nearest_vehicle_distance_m = dist
            else:
                nearest_obstacle_distance_m = dist
            if dist <= 1.5 and state == "REVERSING":
                sev = "CRITICAL"
            elif dist <= 2.5 and moving:
                sev = "HIGH"
            elif dist <= 5:
                sev = "MEDIUM"
            else:
                sev = "LOW"
            safety_rows.append(dict(
                event_id=f"SE{str(safety_event_counter).zfill(6)}", timestamp=ts, machine_id=machine_id,
                operator_id=operator_id, task_id=task_id, site_id=site_id, event_type=etype, severity=sev,
                machine_speed_kmh=speed, machine_state=state,
                distance_to_person_m=dist if etype == "PERSON_PROXIMITY" else np.nan,
                distance_to_vehicle_m=dist if etype == "VEHICLE_PROXIMITY" else np.nan,
                distance_to_obstacle_m=dist if etype == "OBSTACLE_PROXIMITY" else np.nan,
                seatbelt_status=seatbelt_status, duration_seconds=int(RNG.integers(3, 60)),
                resolved=rand_choice([True, False], p=[0.85, 0.15]),
            ))
            if sev == "CRITICAL" and RNG.random() < 0.35:
                incident_counter += 1
                incidents_rows.append(dict(
                    incident_id=f"INC{str(incident_counter).zfill(5)}", timestamp=ts, machine_id=machine_id,
                    operator_id=operator_id, task_id=task_id, site_id=site_id,
                    incident_type="NEAR_MISS_PROXIMITY", severity="HIGH",
                    description=f"Near-miss: {etype.replace('_',' ').title()} at {dist}m while {state.lower()}.",
                    location_zone=f"ZONE-{rand_choice(['A','B','C','D'])}", injury_occurred=False,
                    machine_damage=False, resolved=rand_choice([True, False], p=[0.7, 0.3]),
                    operator_reported=rand_choice([True, False], p=[0.6, 0.4]),
                ))

        # overspeed
        if state == "TRAVELING" and speed > prof["speed_max"] * 1.05 and RNG.random() < 0.3:
            safety_event_counter += 1
            safety_rows.append(dict(
                event_id=f"SE{str(safety_event_counter).zfill(6)}", timestamp=ts, machine_id=machine_id,
                operator_id=operator_id, task_id=task_id, site_id=site_id, event_type="OVERSPEED",
                severity=rand_choice(["MEDIUM","HIGH"], p=[0.7,0.3]), machine_speed_kmh=speed, machine_state=state,
                distance_to_person_m=np.nan, distance_to_vehicle_m=np.nan, distance_to_obstacle_m=np.nan,
                seatbelt_status=seatbelt_status, duration_seconds=int(RNG.integers(5,40)),
                resolved=rand_choice([True, False], p=[0.8,0.2]),
            ))

        if harsh_brake:
            safety_event_counter += 1
            safety_rows.append(dict(
                event_id=f"SE{str(safety_event_counter).zfill(6)}", timestamp=ts, machine_id=machine_id,
                operator_id=operator_id, task_id=task_id, site_id=site_id, event_type="HARSH_BRAKING",
                severity="LOW", machine_speed_kmh=speed, machine_state=state, distance_to_person_m=np.nan,
                distance_to_vehicle_m=np.nan, distance_to_obstacle_m=np.nan, seatbelt_status=seatbelt_status,
                duration_seconds=int(RNG.integers(2,10)), resolved=True,
            ))
        if state == "REVERSING" and RNG.random() < 0.004 * (1 + harsh_bias * 6):
            safety_event_counter += 1
            safety_rows.append(dict(
                event_id=f"SE{str(safety_event_counter).zfill(6)}", timestamp=ts, machine_id=machine_id,
                operator_id=operator_id, task_id=task_id, site_id=site_id, event_type="UNSAFE_REVERSING",
                severity=rand_choice(["LOW","MEDIUM","HIGH"], p=[0.5,0.35,0.15]), machine_speed_kmh=speed,
                machine_state=state, distance_to_person_m=np.nan, distance_to_vehicle_m=np.nan,
                distance_to_obstacle_m=np.nan, seatbelt_status=seatbelt_status,
                duration_seconds=int(RNG.integers(3,25)), resolved=rand_choice([True, False], p=[0.8,0.2]),
            ))

        rpm_list.append(rpm)
        speed_list.append(speed)

        telemetry_rows.append(dict(
            timestamp=ts, machine_id=machine_id, operator_id=operator_id, task_id=task_id, site_id=site_id,
            engine_on=engine_on, engine_rpm=rpm, engine_load_percent=load_pct, engine_hours=round(engine_hours, 2),
            machine_speed_kmh=speed, fuel_level_percent=round(fuel_level, 1), fuel_rate_lph=lph,
            fuel_used_l=round(fuel_used_total, 2), hydraulic_pressure_bar=hyd, coolant_temperature_c=coolant,
            operating_state=state, idle_duration_min=round(idle_accum_min, 1), load_cycles=load_cycles,
            bucket_or_attachment_load_percent=bucket_load,
            seatbelt_status=seatbelt_status,
            nearest_person_distance_m=nearest_person_distance_m,
            nearest_vehicle_distance_m=nearest_vehicle_distance_m,
            nearest_obstacle_distance_m=nearest_obstacle_distance_m,
        ))

    # ---- per-task fuel_usage.csv summary rows (hourly buckets if long, else one row) ----
    total_minutes = duration_min
    BUCKET_MIN = 12
    n_hour_buckets = max(1, math.ceil(total_minutes / BUCKET_MIN))
    for b in range(n_hour_buckets):
        b_start = b * BUCKET_MIN
        b_end = min((b + 1) * BUCKET_MIN, total_minutes)
        frac = (b_end - b_start) / total_minutes
        f_start = fuel_capacity * (RNG.uniform(0.55,1.0)) if b == 0 else None
        f_used_bucket = fuel_used_total * frac
        idle_fuel_bucket = idle_fuel_total * frac
        working_fuel_bucket = working_fuel_total * frac
        operating_hours = (b_end - b_start) / 60.0
        idle_hours = operating_hours * idle_ratio * RNG.uniform(0.7, 1.3)
        idle_hours = min(idle_hours, operating_hours)
        mtype_lph = TYPE_TELEM_PROFILE[mtype]["lph"]
        expected_rate = (mtype_lph[0] + mtype_lph[1]) / 2
        actual_rate = f_used_bucket / max(operating_hours, 0.01)
        deviation = round(((actual_rate - expected_rate) / expected_rate) * 100, 1) if expected_rate else 0.0
        fuel_usage_rows.append(dict(
            timestamp=start_ts + timedelta(minutes=b_start), machine_id=machine_id, operator_id=operator_id,
            task_id=task_id, fuel_start_l=round(fuel_capacity * RNG.uniform(0.5, 1.0), 1) if b == 0 else np.nan,
            fuel_end_l=np.nan, fuel_used_l=round(f_used_bucket, 2), fuel_rate_lph=round(actual_rate, 2),
            operating_hours=round(operating_hours, 2), idle_hours=round(idle_hours, 2),
            idle_fuel_l=round(idle_fuel_bucket, 2), working_fuel_l=round(working_fuel_bucket, 2),
            fuel_efficiency_l_per_hour=round(actual_rate, 2), expected_fuel_rate_lph=round(expected_rate, 2),
            fuel_deviation_percent=deviation,
        ))

    behavior_accum.append(dict(
        timestamp=start_ts, operator_id=operator_id, machine_id=machine_id, task_id=task_id,
        idle_ratio=round(idle_accum_min / max(total_minutes,1), 3),
        average_rpm=round(float(np.mean(rpm_list)) if rpm_list else 0, 0),
        max_rpm=round(float(np.max(rpm_list)) if rpm_list else 0, 0),
        average_speed=round(float(np.mean(speed_list)) if speed_list else 0, 1),
        hard_braking_count=hard_brake_ct, rapid_acceleration_count=rapid_accel_ct,
        reverse_count=reverse_ct, seatbelt_violation_count=seatbelt_ct, proximity_event_count=prox_ct,
        fuel_efficiency=round(fuel_used_total / max(total_minutes/60,0.01), 2),
        task_efficiency=ctx.get("efficiency", np.nan),
    ))

telemetry_df = pd.DataFrame(telemetry_rows)
# small missing-data noise on non-critical telemetry fields (not on IDs/timestamp)
for col in ["hydraulic_pressure_bar", "coolant_temperature_c", "bucket_or_attachment_load_percent", "engine_load_percent"]:
    telemetry_df[col] = missingify(telemetry_df[col], rate=0.02)
telemetry_df.to_csv(os.path.join(OUT_DIR, "telemetry.csv"), index=False)
print(f"  telemetry={len(telemetry_df)}")

fuel_usage_df = pd.DataFrame(fuel_usage_rows)
fuel_usage_df.to_csv(os.path.join(OUT_DIR, "fuel_usage.csv"), index=False)
print(f"  fuel_usage={len(fuel_usage_df)}")

safety_events_df = pd.DataFrame(safety_rows)
safety_events_df.to_csv(os.path.join(OUT_DIR, "safety_events.csv"), index=False)
print(f"  safety_events={len(safety_events_df)}")

# ============================================================================
# 8. INCIDENTS  (near misses already seeded from CRITICAL proximity events;
#    top up with independent mechanical/environmental/unsafe-operation incidents)
# ============================================================================
print("Generating incidents.csv ...")

INCIDENT_TYPES = ["NEAR_MISS_PROXIMITY", "EQUIPMENT_DAMAGE", "UNSAFE_OPERATION",
                   "MECHANICAL_OBSERVATION", "ENVIRONMENTAL_HAZARD", "COLLISION_MINOR"]
ZONES = ["ZONE-A", "ZONE-B", "ZONE-C", "ZONE-D"]

DESC_TEMPLATES = {
    "EQUIPMENT_DAMAGE": "Minor {part} damage reported during {task} operation.",
    "UNSAFE_OPERATION": "Operator observed operating {machine} outside standard procedure during {task}.",
    "MECHANICAL_OBSERVATION": "{part} showing early wear signs; flagged for maintenance review.",
    "ENVIRONMENTAL_HAZARD": "Hazardous ground/weather condition ({cond}) reported at site during {task}.",
    "COLLISION_MINOR": "Minor contact between {machine} and site obstacle while {task}.",
}
PARTS = ["hydraulic hose", "bucket linkage", "track", "tire", "boom cylinder", "blade edge"]

target_incidents_total = 220
n_extra = max(0, target_incidents_total - len(incidents_rows))
for i in range(n_extra):
    row = active_tasks.sample(1, random_state=int(RNG.integers(0, 1_000_000))).iloc[0]
    task_id = row.task_id
    ctx = task_env_cache[task_id]
    machine_id = ctx["machine_id"]
    operator_id = ctx["operator_id"]
    site_id = ctx["site_id"]
    itype = rand_choice(INCIDENT_TYPES, p=[0.28, 0.18, 0.18, 0.18, 0.12, 0.06])
    ts = ctx["scheduled_start"] + timedelta(minutes=int(RNG.integers(0, max(int(ctx["duration_min"]), 15))))
    severity = rand_choice(["LOW", "MEDIUM", "HIGH", "CRITICAL"], p=[0.45, 0.32, 0.18, 0.05])
    injury = bool(RNG.random() < 0.03) if severity in ("HIGH", "CRITICAL") else False
    damage = bool(RNG.random() < (0.5 if itype in ("EQUIPMENT_DAMAGE", "COLLISION_MINOR") else 0.05))
    template = DESC_TEMPLATES.get(itype, "Incident reported: {task}.")
    desc = template.format(part=rand_choice(PARTS), task=ctx["task_type"].lower(),
                            machine=MACHINE_TYPE_OF[machine_id].replace("_"," ").title(),
                            cond=ctx["weather"].lower())
    incident_counter += 1
    incidents_rows.append(dict(
        incident_id=f"INC{str(incident_counter).zfill(5)}", timestamp=ts, machine_id=machine_id,
        operator_id=operator_id, task_id=task_id, site_id=site_id, incident_type=itype, severity=severity,
        description=desc, location_zone=rand_choice(ZONES), injury_occurred=injury, machine_damage=damage,
        resolved=rand_choice([True, False], p=[0.75, 0.25]),
        operator_reported=rand_choice([True, False], p=[0.55, 0.45]),
    ))

incidents_df = pd.DataFrame(incidents_rows).sort_values("timestamp").reset_index(drop=True)
incidents_df.to_csv(os.path.join(OUT_DIR, "incidents.csv"), index=False)
print(f"  incidents={len(incidents_df)}")

# ============================================================================
# 9. OPERATOR_BEHAVIOR
# ============================================================================
print("Generating operator_behavior.csv ...")

behavior_rows = []
for rec in behavior_accum:
    score = 100.0
    score -= rec["idle_ratio"] * 60
    score -= rec["hard_braking_count"] * 3
    score -= rec["rapid_acceleration_count"] * 3
    score -= rec["seatbelt_violation_count"] * 8
    score -= rec["proximity_event_count"] * 10
    score -= max(0, rec["reverse_count"] - 5) * 1.0
    score = clip(score + RNG.normal(0, 4), 5, 100)
    behavior_rows.append({**rec, "behavior_score": round(score, 1)})

# add extra daily aggregated behavior rows (operator x day, independent of single-task detail)
# so the table has enough volume to profile operators across many shifts.
n_extra_behavior = max(0, 5200 - len(behavior_rows))
for i in range(n_extra_behavior):
    operator_id = rand_choice(operator_ids)
    machine_id = rand_choice(machine_ids)
    mtype = MACHINE_TYPE_OF[machine_id]
    prof = TYPE_TELEM_PROFILE[mtype]
    day_offset = int(RNG.integers(0, SIM_DAYS))
    ts = SIM_START + timedelta(days=day_offset, hours=int(RNG.integers(6, 16)))
    idle_ratio = clip(RNG.normal(OPERATOR_IDLE_BIAS[operator_id], 0.05), 0.01, 0.7)
    rpm_bias = OPERATOR_RPM_BIAS[operator_id]
    avg_rpm = clip(RNG.normal((prof["rpm"][0]+prof["rpm"][1])/2, 150) * rpm_bias, 500, 2500)
    max_rpm = clip(avg_rpm + RNG.uniform(100, 400), avg_rpm, 2600)
    avg_speed = round(RNG.uniform(1, prof["speed_max"] * 0.6), 1)
    harsh_bias = OPERATOR_HARSH_BIAS[operator_id]
    hard_brake_ct = int(RNG.poisson(0.6 * (1 + harsh_bias * 5)))
    rapid_accel_ct = int(RNG.poisson(0.6 * (1 + harsh_bias * 5)))
    reverse_ct = int(RNG.poisson(6))
    seatbelt_ct = int(RNG.poisson(OPERATOR_SEATBELT_RISK[operator_id] * 100))
    prox_ct = int(RNG.poisson(OPERATOR_PROXIMITY_RISK[operator_id] * 100))
    fuel_eff = round(RNG.uniform(*prof["lph"]) * (0.7 + idle_ratio * 0.5), 2)
    task_eff = round(clip(RNG.normal(OPERATOR_PROD_OF[operator_id] / 100, 0.1), 0.3, 1.5), 3)

    score = 100.0
    score -= idle_ratio * 60
    score -= hard_brake_ct * 3
    score -= rapid_accel_ct * 3
    score -= seatbelt_ct * 8
    score -= prox_ct * 10
    score -= max(0, reverse_ct - 5) * 1.0
    score = clip(score + RNG.normal(0, 4), 5, 100)

    behavior_rows.append(dict(
        timestamp=ts, operator_id=operator_id, machine_id=machine_id, task_id=np.nan,
        idle_ratio=round(idle_ratio, 3), average_rpm=round(avg_rpm, 0), max_rpm=round(max_rpm, 0),
        average_speed=avg_speed, hard_braking_count=hard_brake_ct, rapid_acceleration_count=rapid_accel_ct,
        reverse_count=reverse_ct, seatbelt_violation_count=seatbelt_ct, proximity_event_count=prox_ct,
        fuel_efficiency=fuel_eff, task_efficiency=task_eff, behavior_score=round(score, 1),
    ))

operator_behavior_df = pd.DataFrame(behavior_rows).sort_values("timestamp").reset_index(drop=True)
operator_behavior_df.to_csv(os.path.join(OUT_DIR, "operator_behavior.csv"), index=False)
print(f"  operator_behavior={len(operator_behavior_df)}")

# ============================================================================
# 10. TRAINING_MODULES
# ============================================================================
print("Generating training_modules.csv ...")

training_catalog = [
    ("SAFETY", "Operating Near Ground Personnel", "INTERMEDIATE", 30, "Recognizing and maintaining safe clearance from ground crew.", "Repeated PERSON_PROXIMITY events"),
    ("SAFETY", "Seatbelt Compliance Essentials", "BEGINNER", 15, "Why and when seatbelt use is mandatory during operation.", "SEATBELT_VIOLATION events"),
    ("SAFETY", "Safe Reversing Practices", "INTERMEDIATE", 25, "Blind-spot awareness and spotter protocols while reversing.", "UNSAFE_REVERSING events / high reverse_count"),
    ("SAFETY", "Vehicle Proximity Awareness", "INTERMEDIATE", 20, "Maintaining safe distance from other site vehicles.", "Repeated VEHICLE_PROXIMITY events"),
    ("SAFETY", "Obstacle Awareness on Active Sites", "BEGINNER", 20, "Identifying and avoiding fixed/temporary site obstacles.", "OBSTACLE_PROXIMITY events"),
    ("SAFETY", "Incident Reporting Procedures", "BEGINNER", 15, "How and when to log near-misses and incidents.", "Low operator_reported rate on incidents"),
    ("SAFETY", "Harsh Braking & Overspeed Prevention", "INTERMEDIATE", 20, "Techniques to reduce harsh braking and overspeed events.", "HARSH_BRAKING / OVERSPEED events"),
    ("SAFETY", "Critical Severity Response Protocol", "ADVANCED", 30, "Immediate actions following a CRITICAL safety event.", "Any CRITICAL severity event"),
    ("FUEL_EFFICIENCY", "Fuel-Efficient Machine Operation", "INTERMEDIATE", 25, "Throttle and load management to reduce fuel burn.", "fuel_deviation_percent consistently above baseline"),
    ("FUEL_EFFICIENCY", "Understanding Fuel Deviation Alerts", "BEGINNER", 15, "Interpreting HIGH_FUEL_CONSUMPTION alerts.", "HIGH_FUEL_CONSUMPTION alerts"),
    ("FUEL_EFFICIENCY", "Load Matching for Fuel Savings", "ADVANCED", 30, "Matching engine load to task demand.", "High average_engine_load with low task_efficiency"),
    ("IDLE_MANAGEMENT", "Reducing Excessive Idle Time", "BEGINNER", 20, "Practical habits to cut unnecessary idling.", "High idle_ratio"),
    ("IDLE_MANAGEMENT", "Auto Idle-Shutdown Features", "BEGINNER", 10, "Using built-in idle-shutdown to save fuel.", "High idle_duration_min trend"),
    ("IDLE_MANAGEMENT", "Idle Time & Engine Wear", "INTERMEDIATE", 20, "How prolonged idling affects component life.", "High idle_ratio with rising coolant_temperature_c"),
    ("PROXIMITY_AWARENESS", "Proximity Detection System Overview", "BEGINNER", 15, "How the onboard proximity system works.", "New operator onboarding"),
    ("PROXIMITY_AWARENESS", "Working in Congested Site Zones", "INTERMEDIATE", 25, "Operating safely in high-traffic work zones.", "Repeated proximity events in ZONE with high traffic"),
    ("PROXIMITY_AWARENESS", "Spotter Communication Protocol", "INTERMEDIATE", 20, "Coordinating with ground spotters effectively.", "Proximity events during REVERSING"),
    ("MACHINE_OPERATION", "Excavator Digging Cycle Optimization", "INTERMEDIATE", 30, "Optimizing bucket fill and cycle time.", "Low task_efficiency on Earth Excavation / Trenching"),
    ("MACHINE_OPERATION", "Wheel Loader Load & Carry Technique", "INTERMEDIATE", 25, "Efficient loading and carrying technique.", "Low task_efficiency on Material Loading"),
    ("MACHINE_OPERATION", "Grader Blade Control Fundamentals", "ADVANCED", 30, "Precision blade control for grading tasks.", "Low task_efficiency on Grading"),
    ("MACHINE_OPERATION", "Hauler Payload & Cycle Management", "INTERMEDIATE", 25, "Managing payload and cycle time for hauling.", "Low task_efficiency on Hauling"),
    ("MACHINE_OPERATION", "New Operator Machine Familiarization", "BEGINNER", 40, "General controls and instrumentation walkthrough.", "New operator onboarding / BEGINNER skill_level"),
    ("ENVIRONMENTAL_AWARENESS", "Working in Wet Ground Conditions", "INTERMEDIATE", 20, "Adjusting technique for muddy/wet ground.", "Tasks with high soil_moisture / WET ground_condition"),
    ("ENVIRONMENTAL_AWARENESS", "Low Visibility Operating Procedures", "ADVANCED", 25, "Operating safely in fog/heavy rain.", "Tasks completed under low visibility_m"),
    ("ENVIRONMENTAL_AWARENESS", "Dust Control Best Practices", "BEGINNER", 15, "Reducing dust exposure and visibility impact.", "High dust_level readings at site"),
    ("ENVIRONMENTAL_AWARENESS", "Cold & Heat Weather Operation", "INTERMEDIATE", 20, "Machine and operator considerations in extreme temperature.", "Extreme temperature_c readings"),
    ("TASK_EFFICIENCY", "Task Planning & Time Estimation", "INTERMEDIATE", 25, "Improving estimate-to-actual duration accuracy.", "task_efficiency consistently below baseline"),
    ("TASK_EFFICIENCY", "Reading AI Task Delay Alerts", "BEGINNER", 15, "Responding to TASK_DELAY alerts effectively.", "TASK_DELAY alerts"),
]

training_rows = []
for i, (cat, title, diff, dur, desc, trig) in enumerate(training_catalog):
    training_rows.append(dict(
        training_id=f"TRN{str(i+1).zfill(3)}", title=title, category=cat, difficulty=diff,
        duration_min=dur, description=desc, trigger_condition=trig,
    ))
training_modules_df = pd.DataFrame(training_rows)
training_modules_df.to_csv(os.path.join(OUT_DIR, "training_modules.csv"), index=False)
print(f"  training_modules={len(training_modules_df)}")

TRAIN_BY_CATEGORY = training_modules_df.groupby("category")["training_id"].apply(list).to_dict()

# ============================================================================
# 11. TRAINING_PROGRESS  (linked to operator_behavior signals)
# ============================================================================
print("Generating training_progress.csv ...")

def pick_training_for_operator(op_row):
    """Choose a training id + reason based on the operator's latent risk profile."""
    reasons = []
    if OPERATOR_IDLE_BIAS[op_row.operator_id] > 0.18:
        reasons.append(("IDLE_MANAGEMENT", "High idle ratio relative to peer baseline"))
    if OPERATOR_SEATBELT_RISK[op_row.operator_id] > 0.003:
        reasons.append(("SAFETY", "Seatbelt violations detected in recent shifts"))
    if OPERATOR_PROXIMITY_RISK[op_row.operator_id] > 0.003:
        reasons.append(("PROXIMITY_AWARENESS", "Repeated proximity events flagged by system"))
    if OPERATOR_RPM_BIAS[op_row.operator_id] > 1.12:
        reasons.append(("FUEL_EFFICIENCY", "Engine RPM / fuel consumption above expected range"))
    if op_row.skill_level == "BEGINNER":
        reasons.append(("MACHINE_OPERATION", "New operator onboarding"))
    if op_row.average_productivity_score < 65:
        reasons.append(("TASK_EFFICIENCY", "Task efficiency below site baseline"))
    if not reasons:
        reasons.append((rand_choice(list(TRAIN_BY_CATEGORY.keys())), "Periodic refresher recommended"))
    return reasons

STATUS_POOL_TRAIN = ["COMPLETED", "COMPLETED", "COMPLETED", "IN_PROGRESS", "ASSIGNED", "OVERDUE"]

training_progress_rows = []
for op_row in operators_df.itertuples():
    reasons = pick_training_for_operator(op_row)
    n_assignments = max(1, len(reasons)) + int(RNG.integers(0, 3))
    for k in range(n_assignments):
        if k < len(reasons):
            cat, reason = reasons[k]
        else:
            cat = rand_choice(list(TRAIN_BY_CATEGORY.keys()))
            reason = "Periodic refresher recommended"
        training_id = rand_choice(TRAIN_BY_CATEGORY[cat])
        assigned_offset = int(RNG.integers(0, SIM_DAYS - 5))
        assigned_date = SIM_START + timedelta(days=assigned_offset)
        status = rand_choice(STATUS_POOL_TRAIN)
        dur = int(training_modules_df.loc[training_modules_df.training_id == training_id, "duration_min"].values[0])
        if status == "COMPLETED":
            completion_date = assigned_date + timedelta(days=int(RNG.integers(1, 21)))
            score = round(clip(RNG.normal(op_row.training_score, 8), 30, 100), 1)
        elif status == "IN_PROGRESS":
            completion_date = np.nan
            score = np.nan
        elif status == "OVERDUE":
            completion_date = np.nan
            score = np.nan
        else:  # ASSIGNED
            completion_date = np.nan
            score = np.nan

        training_progress_rows.append(dict(
            operator_id=op_row.operator_id, training_id=training_id, assigned_date=assigned_date,
            completion_date=completion_date, status=status, score=score, reason_recommended=reason,
        ))

# top up volume to 550+
while len(training_progress_rows) < 560:
    op_row = operators_df.sample(1, random_state=int(RNG.integers(0, 1_000_000))).iloc[0]
    cat = rand_choice(list(TRAIN_BY_CATEGORY.keys()))
    training_id = rand_choice(TRAIN_BY_CATEGORY[cat])
    assigned_offset = int(RNG.integers(0, SIM_DAYS - 5))
    assigned_date = SIM_START + timedelta(days=assigned_offset)
    status = rand_choice(STATUS_POOL_TRAIN)
    completion_date = assigned_date + timedelta(days=int(RNG.integers(1, 21))) if status == "COMPLETED" else np.nan
    score = round(clip(RNG.normal(op_row.training_score, 8), 30, 100), 1) if status == "COMPLETED" else np.nan
    training_progress_rows.append(dict(
        operator_id=op_row.operator_id, training_id=training_id, assigned_date=assigned_date,
        completion_date=completion_date, status=status, score=score,
        reason_recommended="Periodic refresher recommended",
    ))

training_progress_df = pd.DataFrame(training_progress_rows)
training_progress_df.to_csv(os.path.join(OUT_DIR, "training_progress.csv"), index=False)
print(f"  training_progress={len(training_progress_df)}")

# ============================================================================
# 12. DAILY_TASKS  (dashboard-facing view; includes tasks.csv rows + extra
#     lightweight day-level scheduling rows for dashboard volume/realism)
# ============================================================================
print("Generating daily_tasks.csv ...")

DAILY_STATUS = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "COMPLETED", "DELAYED", "CANCELLED"]
PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"]

daily_rows = []
for row in tasks_df.itertuples():
    daily_rows.append(dict(
        date=pd.Timestamp(row.scheduled_start).date(), operator_id=row.operator_id, machine_id=row.machine_id,
        task_id=row.task_id, priority=rand_choice(PRIORITIES, p=[0.3,0.4,0.22,0.08]),
        scheduled_start=row.scheduled_start, scheduled_end=row.scheduled_end, task_type=row.task_type,
        location_zone=rand_choice(ZONES), target_quantity=row.target_quantity, status=row.task_status,
    ))

# extra dashboard-only scheduling rows (future/short-notice assignments not in tasks.csv)
n_extra_daily = max(0, 1050 - len(daily_rows))
for i in range(n_extra_daily):
    machine_id = rand_choice(machine_ids)
    operator_id = rand_choice(operator_ids)
    mtype = MACHINE_TYPE_OF[machine_id]
    task_type = rand_choice(TASK_TYPES)
    day_offset = int(RNG.integers(0, SIM_DAYS))
    start_hour = int(RNG.integers(6, 16))
    sched_start = SIM_START + timedelta(days=day_offset, hours=start_hour)
    sched_end = sched_start + timedelta(minutes=int(RNG.uniform(60, 360)))
    daily_rows.append(dict(
        date=sched_start.date(), operator_id=operator_id, machine_id=machine_id,
        task_id=f"DT{str(i+1).zfill(5)}", priority=rand_choice(PRIORITIES, p=[0.3,0.4,0.22,0.08]),
        scheduled_start=sched_start, scheduled_end=sched_end, task_type=task_type,
        location_zone=rand_choice(ZONES), target_quantity=round(RNG.uniform(100, 2000), 1),
        status=rand_choice(DAILY_STATUS),
    ))

daily_tasks_df = pd.DataFrame(daily_rows).sort_values("date").reset_index(drop=True)
daily_tasks_df.to_csv(os.path.join(OUT_DIR, "daily_tasks.csv"), index=False)
print(f"  daily_tasks={len(daily_tasks_df)}")

# ============================================================================
# 13. ALERTS  (normalized alerts derived from safety_events, fuel_usage,
#     operator_behavior, and task delay signals)
# ============================================================================
print("Generating alerts.csv ...")

alert_rows = []
alert_counter = 0

SAFETY_TO_ALERT = {
    "SEATBELT_VIOLATION": ("SEATBELT", "Seatbelt not fastened while machine is moving.", "Review seatbelt compliance training with operator."),
    "PERSON_PROXIMITY": ("PROXIMITY", "Worker detected within the machine operating zone.", "Pause operation and confirm clear zone before resuming."),
    "VEHICLE_PROXIMITY": ("PROXIMITY", "Site vehicle detected within unsafe operating distance.", "Coordinate with vehicle operator and increase clearance."),
    "OBSTACLE_PROXIMITY": ("PROXIMITY", "Obstacle detected within the machine operating zone.", "Reassess path and clear or route around obstacle."),
    "OVERSPEED": ("UNUSUAL_BEHAVIOR", "Machine speed exceeded safe operating threshold.", "Coach operator on speed limits for this machine type."),
    "UNSAFE_REVERSING": ("PROXIMITY", "Unsafe reversing maneuver detected.", "Reinforce spotter protocol for reversing operations."),
    "HARSH_BRAKING": ("UNUSUAL_BEHAVIOR", "Harsh braking event detected.", "Review braking technique with operator."),
    "RAPID_ACCELERATION": ("UNUSUAL_BEHAVIOR", "Rapid acceleration event detected.", "Review throttle control technique with operator."),
}

for ev in safety_rows:
    if RNG.random() < 0.55:  # not every raw safety reading escalates to a dashboard alert
        alert_counter += 1
        atype, msg, action = SAFETY_TO_ALERT[ev["event_type"]]
        alert_rows.append(dict(
            alert_id=f"AL{str(alert_counter).zfill(6)}", timestamp=ev["timestamp"], machine_id=ev["machine_id"],
            operator_id=ev["operator_id"], task_id=ev["task_id"], alert_type=atype, severity=ev["severity"],
            source="safety_events", message=msg, recommended_action=action, resolved=ev["resolved"],
        ))

# HIGH_FUEL_CONSUMPTION alerts from fuel_usage deviation
for fu in fuel_usage_rows:
    if fu["fuel_deviation_percent"] is not None and fu["fuel_deviation_percent"] > 25 and RNG.random() < 0.6:
        alert_counter += 1
        sev = "HIGH" if fu["fuel_deviation_percent"] > 45 else "MEDIUM"
        alert_rows.append(dict(
            alert_id=f"AL{str(alert_counter).zfill(6)}", timestamp=fu["timestamp"], machine_id=fu["machine_id"],
            operator_id=fu["operator_id"], task_id=fu["task_id"], alert_type="HIGH_FUEL_CONSUMPTION", severity=sev,
            source="fuel_usage", message="Fuel consumption is higher than expected for this task.",
            recommended_action="Check for excessive idling or engine load; review with operator.",
            resolved=rand_choice([True, False], p=[0.6, 0.4]),
        ))

# HIGH_IDLE + UNUSUAL_BEHAVIOR alerts from operator_behavior
for rec in behavior_rows:
    if rec["idle_ratio"] > 0.30 and RNG.random() < 0.5:
        alert_counter += 1
        alert_rows.append(dict(
            alert_id=f"AL{str(alert_counter).zfill(6)}", timestamp=rec["timestamp"], machine_id=rec["machine_id"],
            operator_id=rec["operator_id"], task_id=rec.get("task_id"), alert_type="HIGH_IDLE",
            severity="MEDIUM" if rec["idle_ratio"] < 0.45 else "HIGH", source="operator_behavior",
            message="Idle ratio is significantly above operator baseline.",
            recommended_action="Recommend IDLE_MANAGEMENT training module.",
            resolved=rand_choice([True, False], p=[0.55, 0.45]),
        ))
    if rec["behavior_score"] < 55 and RNG.random() < 0.5:
        alert_counter += 1
        alert_rows.append(dict(
            alert_id=f"AL{str(alert_counter).zfill(6)}", timestamp=rec["timestamp"], machine_id=rec["machine_id"],
            operator_id=rec["operator_id"], task_id=rec.get("task_id"), alert_type="UNUSUAL_BEHAVIOR",
            severity="MEDIUM" if rec["behavior_score"] > 35 else "HIGH", source="operator_behavior",
            message="Operator behavior pattern deviates from established baseline.",
            recommended_action="Review recent shift telemetry and consider targeted training.",
            resolved=rand_choice([True, False], p=[0.5, 0.5]),
        ))

# TASK_DELAY alerts from tasks running long
for row in tasks_df.itertuples():
    if row.task_status == "DELAYED" or (pd.notna(row.actual_duration_min) and pd.notna(row.estimated_duration_min)
                                         and row.actual_duration_min > row.estimated_duration_min * 1.25):
        if RNG.random() < 0.7:
            alert_counter += 1
            alert_rows.append(dict(
                alert_id=f"AL{str(alert_counter).zfill(6)}", timestamp=row.scheduled_end, machine_id=row.machine_id,
                operator_id=row.operator_id, task_id=row.task_id, alert_type="TASK_DELAY", severity="MEDIUM",
                source="tasks", message="Task completion is trending beyond predicted duration.",
                recommended_action="Reassess task plan; check environmental and machine factors.",
                resolved=rand_choice([True, False], p=[0.6, 0.4]),
            ))

# ENVIRONMENTAL_RISK alerts from environment.csv extremes
env_sample = environment_df[(environment_df.weather_condition.isin(["STORM", "FOG"])) |
                             (environment_df.visibility_m < 300)]
env_sample = env_sample.sample(min(len(env_sample), 120), random_state=SEED)
for er in env_sample.itertuples():
    alert_counter += 1
    site_machines = machines_df[machines_df.site_id == er.site_id].machine_id.tolist()
    if not site_machines:
        continue
    mid = rand_choice(site_machines)
    alert_rows.append(dict(
        alert_id=f"AL{str(alert_counter).zfill(6)}", timestamp=er.timestamp, machine_id=mid,
        operator_id=np.nan, task_id=np.nan, alert_type="ENVIRONMENTAL_RISK",
        severity="HIGH" if er.weather_condition == "STORM" else "MEDIUM", source="environment",
        message=f"Hazardous environmental conditions ({er.weather_condition.lower()}, visibility {er.visibility_m:.0f}m).",
        recommended_action="Consider pausing operations until conditions improve.",
        resolved=rand_choice([True, False], p=[0.65, 0.35]),
    ))

alerts_df = pd.DataFrame(alert_rows).sort_values("timestamp").reset_index(drop=True)
alerts_df.to_csv(os.path.join(OUT_DIR, "alerts.csv"), index=False)
print(f"  alerts={len(alerts_df)}")

# ============================================================================
# FINAL VALIDATION
# ============================================================================
print("\nRunning final validation checks ...")

checks_passed = True

def check(label, condition):
    global checks_passed
    status = "PASSED" if condition else "FAILED"
    if not condition:
        checks_passed = False
    print(f"  [{status}] {label}")

files = ["machines.csv", "operators.csv", "sites.csv", "tasks.csv", "task_history.csv",
         "telemetry.csv", "safety_events.csv", "incidents.csv", "environment.csv",
         "fuel_usage.csv", "operator_behavior.csv", "training_modules.csv",
         "training_progress.csv", "daily_tasks.csv", "alerts.csv"]
check("All 15 CSV files created", all(os.path.exists(os.path.join(OUT_DIR, f)) for f in files))

check("No duplicate machine_id", machines_df.machine_id.is_unique)
check("No duplicate operator_id", operators_df.operator_id.is_unique)
check("No duplicate site_id", sites_df.site_id.is_unique)
check("No duplicate task_id in tasks.csv", tasks_df.task_id.is_unique)
check("No duplicate event_id in safety_events.csv", safety_events_df.event_id.is_unique)
check("No duplicate incident_id in incidents.csv", incidents_df.incident_id.is_unique)
check("No duplicate alert_id in alerts.csv", alerts_df.alert_id.is_unique)

check("tasks.machine_id all exist in machines.csv", tasks_df.machine_id.isin(machines_df.machine_id).all())
check("tasks.operator_id all exist in operators.csv", tasks_df.operator_id.isin(operators_df.operator_id).all())
check("tasks.site_id all exist in sites.csv", tasks_df.site_id.isin(sites_df.site_id).all())
check("telemetry.machine_id all exist in machines.csv", telemetry_df.machine_id.isin(machines_df.machine_id).all())
check("telemetry.task_id all exist in tasks.csv", telemetry_df.task_id.isin(tasks_df.task_id).all())
check("safety_events.machine_id all exist in machines.csv", safety_events_df.machine_id.isin(machines_df.machine_id).all())
check("fuel_usage.machine_id all exist in machines.csv", fuel_usage_df.machine_id.isin(machines_df.machine_id).all())
check("training_progress.operator_id all exist in operators.csv", training_progress_df.operator_id.isin(operators_df.operator_id).all())
check("training_progress.training_id all exist in training_modules.csv", training_progress_df.training_id.isin(training_modules_df.training_id).all())

check("No negative fuel_used_l in telemetry", (telemetry_df.fuel_used_l.dropna() >= 0).all())
check("No negative fuel_rate_lph in telemetry", (telemetry_df.fuel_rate_lph.dropna() >= 0).all())
check("Engine hours non-decreasing within each task", telemetry_df.sort_values(["task_id","timestamp"]).groupby("task_id")["engine_hours"].apply(lambda s: (s.diff().dropna() >= 0).all()).all())
check("Actual task duration positive (completed tasks)", (tasks_df.loc[tasks_df.task_status=="COMPLETED","actual_duration_min"].dropna() > 0).all())
check("Completed tasks have actual_duration_min populated", tasks_df.loc[tasks_df.task_status=="COMPLETED","actual_duration_min"].notna().all())
check("Scheduled/cancelled tasks may lack actual duration (expected)", tasks_df.loc[tasks_df.task_status.isin(["SCHEDULED","CANCELLED"]),"actual_duration_min"].isna().all())
check("No impossible machine speed for IDLE/WAITING/OFF states", (telemetry_df.loc[telemetry_df.operating_state.isin(["IDLE","WAITING","OFF"]), "machine_speed_kmh"] == 0).all())
check("Multiple machine types present", machines_df.machine_type.nunique() >= 5)
check("Multiple environments (site types) present", sites_df.site_type.nunique() >= 5)
check("Task duration has meaningful variation (std > 0)", tasks_df.actual_duration_min.dropna().std() > 0)
check("Fuel consumption has meaningful variation (std > 0)", fuel_usage_df.fuel_used_l.std() > 0)

anomaly_share = operator_behavior_df.behavior_score.lt(55).mean()
check(f"Anomaly share within 3-20% (actual {anomaly_share:.1%})", 0.03 <= anomaly_share <= 0.20)
check("Safety events are not unrealistically frequent (<2% of telemetry rows)", len(safety_events_df) / len(telemetry_df) < 0.02)

# ---- new-field checks (seatbelt/proximity telemetry columns + task_history.source_task_id) ----
check("telemetry.seatbelt_status values valid (FASTENED/UNFASTENED)",
      telemetry_df.seatbelt_status.isin(["FASTENED", "UNFASTENED"]).all())

def _dist_null_matches_engine_state(col):
    on_ok = telemetry_df.loc[telemetry_df.engine_on, col].notna().all()
    off_ok = telemetry_df.loc[~telemetry_df.engine_on, col].isna().all()
    return on_ok and off_ok

check("nearest_person_distance_m populated iff engine_on", _dist_null_matches_engine_state("nearest_person_distance_m"))
check("nearest_vehicle_distance_m populated iff engine_on", _dist_null_matches_engine_state("nearest_vehicle_distance_m"))
check("nearest_obstacle_distance_m populated iff engine_on", _dist_null_matches_engine_state("nearest_obstacle_distance_m"))
check("Nearest-object distances are non-negative", ((telemetry_df.nearest_person_distance_m.dropna() >= 0).all()
      and (telemetry_df.nearest_vehicle_distance_m.dropna() >= 0).all()
      and (telemetry_df.nearest_obstacle_distance_m.dropna() >= 0).all()))

seatbelt_events = safety_events_df[safety_events_df.event_type == "SEATBELT_VIOLATION"]
sb_merged = seatbelt_events.merge(telemetry_df, on=["machine_id", "task_id", "timestamp"], how="left", suffixes=("_evt", ""))
check("Telemetry seatbelt_status matches every SEATBELT_VIOLATION safety event",
      len(sb_merged) > 0 and (sb_merged["seatbelt_status"] == "UNFASTENED").all())

prox_events = safety_events_df[safety_events_df.event_type.isin(
    ["PERSON_PROXIMITY", "VEHICLE_PROXIMITY", "OBSTACLE_PROXIMITY"])]
prox_merged = prox_events.merge(telemetry_df, on=["machine_id", "task_id", "timestamp"], how="left", suffixes=("_evt", ""))

def _prox_dist_matches(r):
    if r.event_type == "PERSON_PROXIMITY":
        return abs(r.distance_to_person_m - r.nearest_person_distance_m) < 1e-6
    elif r.event_type == "VEHICLE_PROXIMITY":
        return abs(r.distance_to_vehicle_m - r.nearest_vehicle_distance_m) < 1e-6
    else:
        return abs(r.distance_to_obstacle_m - r.nearest_obstacle_distance_m) < 1e-6

prox_match_ok = len(prox_merged) > 0 and prox_merged.apply(_prox_dist_matches, axis=1).all()
check("telemetry nearest_*_distance_m matches every proximity safety event's distance", prox_match_ok)

check("task_history.source_task_id resolves to tasks.csv when non-null",
      task_history_df.source_task_id.dropna().isin(tasks_df.task_id).all())
check("task_history.source_task_id populated for ~grounded subset (>0 non-null)",
      task_history_df.source_task_id.notna().sum() > 0)
check("task_history.task_id unchanged in meaning (still unique TH##### ids)",
      task_history_df.task_id.is_unique and task_history_df.task_id.str.startswith("TH").all())

print(f"\nDataset validation: {'PASSED' if checks_passed else 'FAILED'}")

# ============================================================================
# FINAL SUMMARY
# ============================================================================
print("\nOperatorIQ Synthetic Dataset")
print("=" * 40)
print(f"Machines: {len(machines_df)}")
print(f"Operators: {len(operators_df)}")
print(f"Sites: {len(sites_df)}")
print(f"Tasks: {len(tasks_df)}")
print(f"Task History Records: {len(task_history_df)}")
print(f"Telemetry Records: {len(telemetry_df)}")
print(f"Safety Events: {len(safety_events_df)}")
print(f"Incidents: {len(incidents_df)}")
print(f"Environment Records: {len(environment_df)}")
print(f"Fuel Usage Records: {len(fuel_usage_df)}")
print(f"Operator Behavior Records: {len(operator_behavior_df)}")
print(f"Training Modules: {len(training_modules_df)}")
print(f"Training Progress Records: {len(training_progress_df)}")
print(f"Daily Tasks: {len(daily_tasks_df)}")
print(f"Alerts: {len(alerts_df)}")
print("\nMachine Types:")
for t in sorted(machines_df.machine_type.unique()):
    print(f"- {t}")
print("\nEnvironments (Site Types):")
for t in sorted(sites_df.site_type.unique()):
    print(f"- {t}")
print(f"\nDataset validation: {'PASSED' if checks_passed else 'FAILED'}")
