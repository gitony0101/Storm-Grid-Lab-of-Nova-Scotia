#!/usr/bin/env python3
"""Validate model weight profiles and community assignments for HarbourGuard StormGrid v2.

Reads:
  - public/data/model_weight_profiles.json
  - public/data/community_model_profiles.json
  - public/data/hrm_community_features.json

Prints PASS/FAIL for each check and a summary.
Exit code 0 if all pass, 1 if any fail.
"""

import json
import os
import sys

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PROFILES_PATH = os.path.join(REPO_ROOT, "public", "data", "model_weight_profiles.json")
COMMUNITY_PATH = os.path.join(REPO_ROOT, "public", "data", "community_model_profiles.json")
FEATURES_PATH = os.path.join(REPO_ROOT, "public", "data", "hrm_community_features.json")

REQUIRED_PROFILES = {"default", "urban_load", "tree_suburban", "coastal", "lowland"}

EXPECTED_COMMUNITIES = {
    "Bedford", "Beechville", "Lower Sackville", "Dartmouth",
    "Downtown Halifax", "Clayton Park", "Timberlea", "Cole Harbour",
    "Spryfield", "Eastern Passage", "Fall River", "Hammonds Plains",
    "Sambro", "Tantallon", "Musquodoboit Harbour",
}

SUM_TOLERANCE = 0.001
HISTORICAL_PRIOR_MAX = 0.30


def _load_json(path):
    with open(path, "r") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Checks
# ---------------------------------------------------------------------------

def check_profile_definitions(profiles_data, results):
    """1. All required profiles exist (default, urban_load, tree_suburban, coastal, lowland)."""
    defined = set(profiles_data.get("profiles", {}).keys())
    missing = REQUIRED_PROFILES - defined
    if missing:
        results["FAIL"].append(
            f"Check 1: Missing required profiles: {', '.join(sorted(missing))}"
        )
    else:
        results["PASS"].append("Check 1: All required profiles defined")


def check_weights_numeric(profiles_data, results):
    """2. All weights are numeric."""
    errors = []
    for name, weights in profiles_data.get("profiles", {}).items():
        for key, val in weights.items():
            if not isinstance(val, (int, float)):
                errors.append(f"{name}.{key} = {val!r} (type {type(val).__name__})")
    if errors:
        results["FAIL"].append(f"Check 2: Non-numeric weights found: {'; '.join(errors)}")
    else:
        results["PASS"].append("Check 2: All weights are numeric")


def check_weights_range(profiles_data, results):
    """3. All weights are between 0 and 1."""
    errors = []
    for name, weights in profiles_data.get("profiles", {}).items():
        for key, val in weights.items():
            if not (0 <= val <= 1):
                errors.append(f"{name}.{key} = {val}")
    if errors:
        results["FAIL"].append(f"Check 3: Weights outside [0, 1]: {'; '.join(errors)}")
    else:
        results["PASS"].append("Check 3: All weights in range [0, 1]")


def check_weights_sum(profiles_data, results):
    """4. Weights sum to 1.0 within tolerance."""
    errors = []
    for name, weights in profiles_data.get("profiles", {}).items():
        total = sum(v for v in weights.values() if isinstance(v, (int, float)))
        if abs(total - 1.0) > SUM_TOLERANCE:
            errors.append(f"{name} sums to {total:.6f} (delta {abs(total - 1.0):.6f})")
    if errors:
        results["FAIL"].append(f"Check 4: Profile weight sums outside tolerance: {'; '.join(errors)}")
    else:
        results["PASS"].append("Check 4: All profile weights sum to 1.0 ± {tol}".format(tol=SUM_TOLERANCE))


def check_historical_prior_max(profiles_data, results):
    """5. historical_prior <= 0.30 for every profile."""
    violations = []
    for name, weights in profiles_data.get("profiles", {}).items():
        val = weights.get("historical_prior")
        if val is not None and val > HISTORICAL_PRIOR_MAX:
            violations.append(f"{name}: historical_prior = {val}")
    if violations:
        results["FAIL"].append(f"Check 5: historical_prior exceeds {HISTORICAL_PRIOR_MAX}: {'; '.join(violations)}")
    else:
        results["PASS"].append(f"Check 5: All historical_prior <= {HISTORICAL_PRIOR_MAX}")


def check_community_hazard_vs_prior(profiles_data, results):
    """6. community_hazard >= historical_prior for every profile."""
    violations = []
    for name, weights in profiles_data.get("profiles", {}).items():
        ch = weights.get("community_hazard", 0)
        hp = weights.get("historical_prior", 0)
        if ch < hp:
            violations.append(f"{name}: community_hazard ({ch}) < historical_prior ({hp})")
    if violations:
        results["FAIL"].append(f"Check 6: community_hazard < historical_prior: {'; '.join(violations)}")
    else:
        results["PASS"].append("Check 6: community_hazard >= historical_prior for all profiles")


def check_wind_tree_vs_rain(profiles_data, results):
    """7. wind_tree >= rain_lowland for every profile."""
    violations = []
    for name, weights in profiles_data.get("profiles", {}).items():
        wt = weights.get("wind_tree", 0)
        rl = weights.get("rain_lowland", 0)
        if wt < rl:
            violations.append(f"{name}: wind_tree ({wt}) < rain_lowland ({rl})")
    if violations:
        results["FAIL"].append(f"Check 7: wind_tree < rain_lowland: {'; '.join(violations)}")
    else:
        results["PASS"].append("Check 7: wind_tree >= rain_lowland for all profiles")


def check_community_assignments(community_data, profiles_data, results):
    """8. All 15 HRM communities have profile assignments."""
    assigned = set(community_data.get("profiles", {}).keys())
    missing = EXPECTED_COMMUNITIES - assigned
    extra = assigned - EXPECTED_COMMUNITIES
    if missing:
        results["FAIL"].append(f"Check 8: Communities missing assignments: {', '.join(sorted(missing))}")
    else:
        results["PASS"].append(f"Check 8: All {len(EXPECTED_COMMUNITIES)} HRM communities have profile assignments")
    if extra:
        results["WARN"].append(f"Extra communities in assignments (not in expected list): {', '.join(sorted(extra))}")


def check_invalid_profile_refs(community_data, profiles_data, results):
    """9. No invalid profile_id references."""
    valid_ids = set(profiles_data.get("profiles", {}).keys())
    invalid_refs = []
    for community, info in community_data.get("profiles", {}).items():
        pid = info.get("profile_id")
        if pid not in valid_ids:
            invalid_refs.append(f"{community} -> '{pid}'")
    if invalid_refs:
        results["FAIL"].append(f"Check 9: Invalid profile_id references: {'; '.join(invalid_refs)}")
    else:
        results["PASS"].append("Check 9: All profile_id references are valid")


def check_model_version(profiles_data, results):
    """10. model_version exists."""
    if profiles_data.get("model_version"):
        results["PASS"].append(f"Check 10: model_version present: '{profiles_data['model_version']}'")
    else:
        results["FAIL"].append("Check 10: model_version is missing or empty")


def check_limitation_text(features_data, results):
    """11. Limitation text is present in hrm_community_features.json."""
    metadata = features_data.get("metadata", {})
    limitation = metadata.get("limitation", "")
    expected_limitation = "Community centroid proxy, not official polygon boundary."
    if expected_limitation in limitation:
        results["PASS"].append(f"Check 11: Limitation text present in metadata")
    else:
        results["FAIL"].append(
            f"Check 11: Limitation text missing or altered. "
            f"Expected: '{expected_limitation}', Got: '{limitation}'"
        )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    results = {"PASS": [], "FAIL": [], "WARN": []}

    # Load data
    try:
        profiles_data = _load_json(PROFILES_PATH)
    except Exception as e:
        print(f"ERROR: Cannot load {PROFILES_PATH}: {e}")
        sys.exit(1)

    try:
        community_data = _load_json(COMMUNITY_PATH)
    except Exception as e:
        print(f"ERROR: Cannot load {COMMUNITY_PATH}: {e}")
        sys.exit(1)

    try:
        features_data = _load_json(FEATURES_PATH)
    except Exception as e:
        print(f"ERROR: Cannot load {FEATURES_PATH}: {e}")
        sys.exit(1)

    # Run checks
    check_profile_definitions(profiles_data, results)
    check_weights_numeric(profiles_data, results)
    check_weights_range(profiles_data, results)
    check_weights_sum(profiles_data, results)
    check_historical_prior_max(profiles_data, results)
    check_community_hazard_vs_prior(profiles_data, results)
    check_wind_tree_vs_rain(profiles_data, results)
    check_community_assignments(community_data, profiles_data, results)
    check_invalid_profile_refs(community_data, profiles_data, results)
    check_model_version(profiles_data, results)
    check_limitation_text(features_data, results)

    # Report
    print("=" * 64)
    print("  HarbourGuard StormGrid v2  --  Model Weights QA Report")
    print("=" * 64)
    print()

    for status in ["FAIL", "WARN", "PASS"]:
        tag = f"[{status}]"
        for msg in results.get(status, []):
            print(f"  {tag}  {msg}")

    print()
    n_pass = len(results["PASS"])
    n_fail = len(results["FAIL"])
    n_warn = len(results["WARN"])
    print(f"  Summary: {n_pass} passed, {n_fail} failed, {n_warn} warning(s)")

    if n_fail:
        print("  >>> RESULT: FAIL")
        sys.exit(1)
    else:
        print("  >>> RESULT: ALL CHECKS PASSED")
        sys.exit(0)


if __name__ == "__main__":
    main()
