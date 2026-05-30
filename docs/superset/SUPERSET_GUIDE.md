# GovRecover360 - Apache Superset Guide

## Overview

Apache Superset provides analytics dashboards, ad-hoc queries, and visualizations for the GovRecover360 platform. It connects directly to the GovRecover PostgreSQL database to provide real-time insights into disaster relief operations.

**Access**: http://localhost:8088  
**Credentials**: admin / admin (configurable via `SUPERSET_ADMIN_PASSWORD` in `.env`)

---

## Connecting to PostgreSQL Datasource

1. Log in to Superset at http://localhost:8088
2. Navigate to **Data** -> **Databases** -> **+ Database**
3. Enter the following connection details:
   - **Database Name**: `GovRecover360`
   - **SQLAlchemy URI**: `postgresql://govrecover:govrecover_2026@postgres:5432/govrecover`
   - **Expose in SQL Lab**: Checked
4. Click **Test Connection** to verify
5. Click **Save**

Note: The hostname is `postgres` (Docker service name), not `localhost`, because Superset runs inside the Docker network.

---

## Creating Datasets

1. Navigate to **Data** -> **Datasets** -> **+ Dataset**
2. Select the `GovRecover360` database
3. Choose a table from the schema (e.g., `households`, `relief_applications`, `payment_requests`)
4. Click **Create Dataset and Create Chart**

Recommended datasets to create:

| Dataset Name | Table | Description |
|---|---|---|
| Households | households | Affected household records |
| Relief Applications | relief_applications | Relief application lifecycle |
| Payments | payment_requests | Payment request records |
| Inventory | inventory_items | Warehouse stock levels |
| Dispatch Orders | dispatch_orders | Aid dispatch tracking |
| Damage Assessments | damage_assessments | Property damage data |
| Audit Logs | audit_logs | System activity logs |
| NGOs | ngo_partner_assignments | NGO task assignments |
| Disaster Events | disaster_events | Disaster event records |
| GIS Locations | gis_locations | Shelter and facility data |

---

## SQL Lab Queries

Open **SQL Lab** and run the following queries:

### 1. Total Applications by Status

```sql
SELECT
  status,
  COUNT(*) AS application_count
FROM relief_applications
GROUP BY status
ORDER BY application_count DESC;
```

**Chart Type**: Pie Chart or Bar Chart  
**Purpose**: Overview of application pipeline health

### 2. Beneficiaries by District

```sql
SELECT
  h.district,
  COUNT(DISTINCT h.id) AS total_households,
  SUM(h.family_size) AS total_affected_population,
  COUNT(DISTINCT ra.id) AS total_applications
FROM households h
LEFT JOIN relief_applications ra ON ra.household_id = h.id
GROUP BY h.district
ORDER BY total_households DESC;
```

**Chart Type**: Bar Chart or Geo Map  
**Purpose**: Geographic distribution of affected population

### 3. Relief Amount by Disaster Event

```sql
SELECT
  de.name AS disaster_event,
  COUNT(ra.id) AS total_applications,
  SUM(pr.amount) AS total_relief_amount,
  AVG(pr.amount) AS avg_relief_per_household
FROM disaster_events de
LEFT JOIN relief_applications ra ON ra.disaster_event_id = de.id
LEFT JOIN payment_requests pr ON pr.relief_application_id = ra.id
GROUP BY de.name;
```

**Chart Type**: Bar Chart or Table  
**Purpose**: Financial impact by disaster event

### 4. Stock Level by Warehouse

```sql
SELECT
  w.name AS warehouse,
  i.category,
  SUM(i.quantity_available) AS total_quantity,
  SUM(i.reorder_level) AS reorder_threshold
FROM warehouses w
JOIN inventory_items i ON i.warehouse_id = w.id
GROUP BY w.name, i.category
ORDER BY w.name, i.category;
```

**Chart Type**: Stacked Bar Chart  
**Purpose**: Inventory distribution across warehouses

### 5. Dispatch Completion Percentage

```sql
SELECT
  status,
  COUNT(*) AS order_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS percentage
FROM dispatch_orders
GROUP BY status
ORDER BY order_count DESC;
```

**Chart Type**: Donut Chart or Big Number  
**Purpose**: Dispatch pipeline completion rate

### 6. Verification Pending Aging

```sql
SELECT
  ra.id AS application_id,
  h.head_full_name,
  h.district,
  ra.status,
  ra.submitted_at,
  EXTRACT(DAY FROM NOW() - ra.submitted_at) AS days_pending
FROM relief_applications ra
JOIN households h ON h.id = ra.household_id
WHERE ra.status IN ('SUBMITTED', 'UNDER_VERIFICATION')
ORDER BY days_pending DESC;
```

**Chart Type**: Table or Bar Chart (days pending)  
**Purpose**: Identify bottlenecks in verification process

### 7. Payment Approved vs Pending Counts

```sql
SELECT
  CASE
    WHEN status = 'PAYMENT_APPROVED' THEN 'Approved'
    WHEN status = 'PENDING' THEN 'Pending'
    ELSE 'Other'
  END AS payment_status,
  COUNT(*) AS count,
  SUM(amount) AS total_amount
FROM payment_requests
GROUP BY payment_status
ORDER BY count DESC;
```

**Chart Type**: Bar Chart or Big Number with Trendline  
**Purpose**: Payment processing status overview

### 8. NGO Delivery Performance

```sql
SELECT
  u.full_name AS ngo_name,
  COUNT(npa.id) AS total_assignments,
  SUM(CASE WHEN npa.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
  ROUND(
    100.0 * SUM(CASE WHEN npa.status = 'COMPLETED' THEN 1 ELSE 0 END) / COUNT(npa.id),
    1
  ) AS completion_rate
FROM ngo_partner_assignments npa
JOIN users u ON u.id = npa.ngo_user_id
GROUP BY u.full_name
ORDER BY completion_rate DESC;
```

**Chart Type**: Bar Chart or Table  
**Purpose**: NGO partner performance tracking

### 9. Damage Level Distribution

```sql
SELECT
  damage_level,
  COUNT(*) AS household_count
FROM households
WHERE damage_level IS NOT NULL
GROUP BY damage_level
ORDER BY
  CASE damage_level
    WHEN 'MINOR' THEN 1
    WHEN 'MODERATE' THEN 2
    WHEN 'SEVERE' THEN 3
    WHEN 'TOTAL' THEN 4
    ELSE 5
  END;
```

**Chart Type**: Pie Chart or Funnel Chart  
**Purpose**: Severity of damage across affected households

### 10. Daily Registrations Trend

```sql
SELECT
  DATE(created_at) AS registration_date,
  COUNT(*) AS households_registered,
  COUNT(DISTINCT district) AS districts_covered
FROM households
GROUP BY DATE(created_at)
ORDER BY registration_date;
```

**Chart Type**: Line Chart  
**Purpose**: Registration velocity and coverage over time

---

## Dashboard Creation Guide

### Creating a New Dashboard

1. Navigate to **Dashboards** -> **+ Dashboard**
2. Name: `GovRecover360 - Disaster Relief Operations`
3. Click **Create**

### Adding Charts to the Dashboard

1. Click **Edit Dashboard** -> **+ Charts** -> **Add Existing Charts**
2. Select the charts created from the queries above
3. Arrange them in a logical layout:
   - Top row: Summary metrics (Big Number charts)
   - Middle left: Geographic distribution (Map / Bar)
   - Middle right: Pipeline status (Pie / Donut)
   - Bottom: Detailed tables and trend lines

### Recommended Dashboard Layout

```
+--------------------------------------------------+
|  Total Apps  |  Total HH  |  Total Payments      |
|  (Big Num)   |  (Big Num) |  (Big Num)           |
+--------------------------------------------------+
|  Apps by Status       |  Beneficiaries by Dist   |
|  (Pie Chart)          |  (Bar/Map)               |
+--------------------------------------------------+
|  Damage Distribution  |  Daily Registrations     |
|  (Pie/Funnel)         |  (Line Chart)            |
+--------------------------------------------------+
|  Verification Aging   |  NGO Performance         |
|  (Table/Bar)          |  (Table)                 |
+--------------------------------------------------+
|  Inventory by Warehouse                           |
|  (Stacked Bar)                                   |
+--------------------------------------------------+
```

6. Set **Auto-refresh interval** to 60 seconds for live data
7. Click **Publish** to make the dashboard available to other users

### Sharing Dashboards

1. Open the dashboard
2. Click **Share** -> **Share Dashboard**
3. Copy the URL or embed code
4. Set appropriate permissions for viewer roles

---

## Setting Up Scheduled Reports

Superset supports email reports in certain configurations:

1. Navigate to **Dashboards** -> select a dashboard
2. Click **Edit** -> **Schedule email report**
3. Configure:
   - **Recipients**: Comma-separated email addresses
   - **Schedule**: Choose frequency (Daily, Weekly, Monthly)
   - **Format**: PDF or Screenshot
4. Click **Save**

Note: Email reports require SMTP configuration in `superset_config.py`:

```python
EMAIL_NOTIFICIONS = True
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_STARTTLS = True
SMTP_USER = "your-email@gmail.com"
SMTP_PASSWORD = "your-app-password"
SMTP_MAIL_FROM = "noreply@govrecover.gov"
```

If SMTP is not configured, scheduled reports will not be sent.
