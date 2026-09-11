import os
import json

# Ensure target directories exist
os.makedirs("public/data", exist_ok=True)
os.makedirs("src/data", exist_ok=True)

# Generate planon_spaces.csv systematically based on the provided CSV specification
rows = []
rows.append("Code,Space number,Name")

def add_room_beds(stage_num, cluster, bld_str, room_num_str, bed_count):
    space_num = f"TBCV{stage_num}-{cluster}-{bld_str}-{room_num_str}"
    room_name = f"Room {bld_str}-{room_num_str}"
    for b in range(1, bed_count + 1):
        code = f"TB{stage_num}-{cluster}-{bld_str}-{room_num_str}-{b}"
        rows.append(f"{code},{space_num},{room_name}")

# 1. TB2-I (I09 to I16)
# I09: 104 to 112 (4 beds), 001-012 (5 beds), 101-103 (4 beds)
for bld_idx in range(9, 17):
    bld = f"I{bld_idx:02d}"
    if bld_idx == 9:
        for r in range(1, 13):
            add_room_beds(2, 'I', bld, f"{r:03d}", 5)
        for r in range(101, 113):
            add_room_beds(2, 'I', bld, f"{r:03d}", 4)
    else:
        for r in range(1, 13):
            add_room_beds(2, 'I', bld, f"{r:03d}", 5)
        for r in range(101, 113):
            add_room_beds(2, 'I', bld, f"{r:03d}", 4)

# 2. TB1-F (F01 to F16)
for bld_idx in range(1, 17):
    bld = f"F{bld_idx:02d}"
    for r in range(1, 13):
        add_room_beds(1, 'F', bld, f"{r:03d}", 5)
    for r in range(101, 113):
        add_room_beds(1, 'F', bld, f"{r:03d}", 4)

# 3. TB1-E (E01 to E16)
for bld_idx in range(1, 17):
    bld = f"E{bld_idx:02d}"
    for r in range(1, 13):
        add_room_beds(1, 'E', bld, f"{r:03d}", 5)
    for r in range(101, 113):
        add_room_beds(1, 'E', bld, f"{r:03d}", 4)

# 4. TB1-G (G01 to G16)
for bld_idx in range(1, 17):
    bld = f"G{bld_idx:02d}"
    for r in range(1, 13):
        add_room_beds(1, 'G', bld, f"{r:03d}", 5)
    for r in range(101, 113):
        add_room_beds(1, 'G', bld, f"{r:03d}", 4)

# 5. TB1-H (H01 to H14 VIP)
for bld_idx in range(1, 15):
    bld = f"H{bld_idx:02d}"
    if bld_idx <= 2:
        for r in range(1, 13):
            add_room_beds(1, 'H', bld, f"{r:03d}", 1)
        for r in range(101, 113):
            add_room_beds(1, 'H', bld, f"{r:03d}", 1)
    elif bld_idx <= 6:
        for r in range(1, 19):
            add_room_beds(1, 'H', bld, f"{r:03d}", 1)
        for r in range(101, 119):
            add_room_beds(1, 'H', bld, f"{r:03d}", 1)
    else:
        for r in range(1, 13):
            add_room_beds(1, 'H', bld, f"{r:03d}", 2)
        for r in range(101, 113):
            add_room_beds(1, 'H', bld, f"{r:03d}", 2)

# 6. TB2-L (L01 to L14 VIP)
for bld_idx in range(1, 15):
    bld = f"L{bld_idx:02d}"
    if bld_idx <= 2:
        for r in range(1, 13):
            add_room_beds(2, 'L', bld, f"{r:03d}", 1)
        for r in range(101, 113):
            add_room_beds(2, 'L', bld, f"{r:03d}", 1)
    elif bld_idx <= 6:
        for r in range(1, 19):
            add_room_beds(2, 'L', bld, f"{r:03d}", 1)
        for r in range(101, 119):
            add_room_beds(2, 'L', bld, f"{r:03d}", 1)
    else:
        for r in range(1, 13):
            add_room_beds(2, 'L', bld, f"{r:03d}", 2)
        for r in range(101, 113):
            add_room_beds(2, 'L', bld, f"{r:03d}", 2)

# 7. TB3-C (C01 to C16)
for bld_idx in range(1, 17):
    bld = f"C{bld_idx:02d}"
    for r in range(1, 13):
        add_room_beds(3, 'C', bld, f"{r:03d}", 5)
    for r in range(101, 113):
        add_room_beds(3, 'C', bld, f"{r:03d}", 4)

# 8. TB3-A (A01 to A16)
for bld_idx in range(1, 17):
    bld = f"A{bld_idx:02d}"
    for r in range(1, 13):
        add_room_beds(3, 'A', bld, f"{r:03d}", 5)
    for r in range(101, 113):
        add_room_beds(3, 'A', bld, f"{r:03d}", 4)

# 9. TB3-B (B01 to B16)
for bld_idx in range(1, 17):
    bld = f"B{bld_idx:02d}"
    if bld_idx == 4:
        for r in range(1, 13):
            add_room_beds(3, 'B', bld, f"{r:03d}", 6)
        for r in range(101, 113):
            add_room_beds(3, 'B', bld, f"{r:03d}", 6)
        # Extra 104-7
        rows.append(f"TB3-B-B04-104-7,TBCV3-B-B04-104,Room B04-104")
    else:
        for r in range(1, 13):
            add_room_beds(3, 'B', bld, f"{r:03d}", 5)
        for r in range(101, 113):
            add_room_beds(3, 'B', bld, f"{r:03d}", 4)

# 10. TB2-J (J01 to J16)
for bld_idx in range(1, 17):
    bld = f"J{bld_idx:02d}"
    for r in range(1, 13):
        add_room_beds(2, 'J', bld, f"{r:03d}", 5)
    for r in range(101, 113):
        add_room_beds(2, 'J', bld, f"{r:03d}", 4)

# 11. TB2-K (K01 to K16)
for bld_idx in range(1, 17):
    bld = f"K{bld_idx:02d}"
    for r in range(1, 13):
        add_room_beds(2, 'K', bld, f"{r:03d}", 5)
    for r in range(101, 113):
        add_room_beds(2, 'K', bld, f"{r:03d}", 4)

# 12. TB3-D (D01 to D14 VIP)
for bld_idx in range(1, 15):
    bld = f"D{bld_idx:02d}"
    if bld_idx <= 2:
        for r in range(1, 13):
            add_room_beds(3, 'D', bld, f"{r:03d}", 1)
        for r in range(101, 113):
            add_room_beds(3, 'D', bld, f"{r:03d}", 1)
    elif bld_idx <= 6:
        for r in range(1, 19):
            add_room_beds(3, 'D', bld, f"{r:03d}", 1)
        for r in range(101, 119):
            add_room_beds(3, 'D', bld, f"{r:03d}", 1)
    else:
        for r in range(1, 13):
            add_room_beds(3, 'D', bld, f"{r:03d}", 2)
        for r in range(101, 113):
            add_room_beds(3, 'D', bld, f"{r:03d}", 2)

# Write public/data/planon_spaces.csv
csv_content = "\n".join(rows) + "\n"
with open("public/data/planon_spaces.csv", "w", encoding="utf-8") as f:
    f.write(csv_content)

print(f"Generated planon_spaces.csv with {len(rows)} lines")

# Also read planon_locations.csv
with open("public/data/planon_locations.csv", "r", encoding="utf-8") as f:
    loc_lines = [l.strip() for l in f if l.strip() and l.strip() != "Code"]

print(f"Read {len(loc_lines)} location codes")

# Parse spaces into a fast lookup list
spaces_data = []
seen_spaces = set()
for line in rows[1:]:
    parts = line.split(",")
    if len(parts) >= 3:
        code, space_num, name = parts[0], parts[1], parts[2]
        if space_num and space_num not in seen_spaces:
            seen_spaces.add(space_num)
            # Derive stage, cluster, building
            # e.g. TBCV2-I-I09-104
            tokens = space_num.split("-")
            stage_str = "Stage 1" if "TBCV1" in space_num else "Stage 2" if "TBCV2" in space_num else "Stage 3"
            cluster_str = tokens[1] if len(tokens) > 1 else ""
            bld_str = tokens[2] if len(tokens) > 2 else ""
            unit_str = tokens[3] if len(tokens) > 3 else ""
            spaces_data.append({
                "code": code,
                "spaceNumber": space_num,
                "name": name,
                "stage": stage_str,
                "cluster": cluster_str,
                "building": bld_str,
                "unit": unit_str
            })

# Write src/data/planonMasterData.ts
ts_code = f"""/**
 * Planon Master Facility Data
 * Auto-generated from official ACV space allocation CSV files.
 * Total registered location spaces: {len(seen_spaces)}
 * Total registered location codes: {len(loc_lines)}
 */

export interface PlanonSpaceItem {{
  code: string;
  spaceNumber: string;
  name: string;
  stage: string;
  cluster: string;
  building: string;
  unit: string;
}}

export const PLANON_SPACES_DATA: PlanonSpaceItem[] = {json.dumps(spaces_data, indent=2)};

export const PLANON_LOCATION_CODES: string[] = {json.dumps(loc_lines, indent=2)};

/**
 * Filter spaces by query (matches spaceNumber, room name, or unit)
 */
export function searchPlanonSpaces(query: string, limit = 50): PlanonSpaceItem[] {{
  if (!query.trim()) return PLANON_SPACES_DATA.slice(0, limit);
  const q = query.toLowerCase().trim();
  return PLANON_SPACES_DATA.filter(
    (s) =>
      s.spaceNumber.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.building.toLowerCase().includes(q) ||
      s.unit.toLowerCase().includes(q)
  ).slice(0, limit);
}}

/**
 * Filter location codes by query
 */
export function searchPlanonLocations(query: string, limit = 50): string[] {{
  if (!query.trim()) return PLANON_LOCATION_CODES.slice(0, limit);
  const q = query.toLowerCase().trim();
  return PLANON_LOCATION_CODES.filter((code) => code.toLowerCase().includes(q)).slice(0, limit);
}}
"""

with open("src/data/planonMasterData.ts", "w", encoding="utf-8") as f:
    f.write(ts_code)

print("Created src/data/planonMasterData.ts successfully!")
