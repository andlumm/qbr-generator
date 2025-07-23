# Source Data Requirements for Partner Metrics Calculation

## Overview

This document outlines the source data needed to calculate partner metrics instead of storing pre-calculated values. All metrics should be computed from transactional source data to ensure accuracy and auditability.

## Current State vs. Target State

### Current State (What You Found)
- **Revenue Growth**: Randomly generated number
- **Attainment**: Simple calculation but from dummy revenue data
- **Health Score**: Random number between 70-100
- **Pipeline Coverage**: Random calculation
- **Training Completion**: Random percentage
- **Customer Satisfaction**: Random number between 3.5-5.0

### Target State (Real Calculations)
All metrics calculated from actual source data with clear business logic.

---

## Required Source Data Tables

### 1. Opportunities (Sales Data)
**Purpose**: Calculate revenue, pipeline, and sales velocity metrics

```sql
CREATE TABLE opportunities (
  id VARCHAR PRIMARY KEY,
  partner_id VARCHAR REFERENCES partners(id),
  opportunity_name VARCHAR,
  amount DECIMAL(10,2),
  stage VARCHAR, -- 'Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'
  close_date DATE,
  created_date DATE,
  is_closed BOOLEAN,
  is_won BOOLEAN,
  days_to_close INTEGER, -- Calculated field
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Metrics Calculated**:
- Current Quarter Revenue = SUM(amount) WHERE is_won = true AND close_date IN current_quarter
- Revenue Growth = ((Current - Previous) / Previous) * 100
- Pipeline Value = SUM(amount) WHERE is_closed = false
- Pipeline Coverage = (Pipeline Value / Revenue Target) * 100
- Conversion Rate = (COUNT(won) / COUNT(closed)) * 100

### 2. Deal Registrations
**Purpose**: Track partner-sourced opportunities

```sql
CREATE TABLE deal_registrations (
  id VARCHAR PRIMARY KEY,
  partner_id VARCHAR REFERENCES partners(id),
  opportunity_id VARCHAR REFERENCES opportunities(id),
  status VARCHAR, -- 'submitted', 'approved', 'rejected', 'won', 'lost'
  submitted_date DATE,
  approved_date DATE,
  amount DECIMAL(10,2),
  created_at TIMESTAMP
);
```

**Metrics Calculated**:
- Deals Submitted = COUNT(*) WHERE submitted_date IN quarter
- Win Rate = (COUNT(won) / COUNT(submitted)) * 100
- Approval Rate = (COUNT(approved) / COUNT(submitted)) * 100

### 3. Training Records
**Purpose**: Track partner enablement and competency

```sql
CREATE TABLE training_records (
  id VARCHAR PRIMARY KEY,
  partner_id VARCHAR REFERENCES partners(id),
  user_id VARCHAR,
  course_id VARCHAR,
  course_name VARCHAR,
  is_required BOOLEAN,
  assigned_date DATE,
  completed_date DATE,
  score DECIMAL(3,1),
  created_at TIMESTAMP
);
```

**Metrics Calculated**:
- Training Completion Rate = (COUNT(completed required) / COUNT(all required)) * 100
- Average Score = AVG(score) WHERE completed_date IS NOT NULL

### 4. Portal Activity
**Purpose**: Measure partner engagement

```sql
CREATE TABLE portal_activity (
  id VARCHAR PRIMARY KEY,
  partner_id VARCHAR REFERENCES partners(id),
  user_id VARCHAR,
  activity_type VARCHAR, -- 'login', 'download', 'training_access', 'deal_submission'
  activity_date TIMESTAMP,
  session_duration_minutes INTEGER
);
```

**Metrics Calculated**:
- Portal Logins (30d) = COUNT(*) WHERE activity_type = 'login' AND activity_date > NOW() - 30 days
- Last Activity Date = MAX(activity_date)
- Engagement Score = Weighted combination of different activities

### 5. Certifications
**Purpose**: Track partner technical competency

```sql
CREATE TABLE certifications (
  id VARCHAR PRIMARY KEY,
  partner_id VARCHAR REFERENCES partners(id),
  user_id VARCHAR,
  certification_name VARCHAR,
  certification_level VARCHAR, -- 'Associate', 'Professional', 'Expert'
  issue_date DATE,
  expiry_date DATE,
  is_active BOOLEAN,
  created_at TIMESTAMP
);
```

**Metrics Calculated**:
- Active Certifications = COUNT(*) WHERE is_active = true AND expiry_date > NOW()
- Certification Coverage = Types of certifications held

### 6. MDF (Marketing Development Fund) Requests
**Purpose**: Track marketing investment and utilization

```sql
CREATE TABLE mdf_requests (
  id VARCHAR PRIMARY KEY,
  partner_id VARCHAR REFERENCES partners(id),
  fiscal_quarter VARCHAR,
  requested_amount DECIMAL(10,2),
  approved_amount DECIMAL(10,2),
  spent_amount DECIMAL(10,2),
  status VARCHAR, -- 'draft', 'submitted', 'approved', 'rejected', 'completed'
  request_date DATE,
  campaign_type VARCHAR,
  roi_reported DECIMAL(10,2),
  created_at TIMESTAMP
);
```

**Metrics Calculated**:
- MDF Utilization = (SUM(spent_amount) / MDF Allocation) * 100
- MDF ROI = SUM(roi_reported) / SUM(spent_amount)

### 7. Customer Surveys
**Purpose**: Measure partner service quality

```sql
CREATE TABLE customer_surveys (
  id VARCHAR PRIMARY KEY,
  partner_id VARCHAR REFERENCES partners(id),
  customer_id VARCHAR,
  project_id VARCHAR,
  survey_type VARCHAR, -- 'implementation', 'support', 'quarterly'
  overall_score DECIMAL(2,1), -- 1.0 to 5.0
  nps_score INTEGER, -- -100 to 100
  survey_date DATE,
  response_date DATE,
  created_at TIMESTAMP
);
```

**Metrics Calculated**:
- CSAT Score = AVG(overall_score) WHERE survey_date IN quarter
- NPS = Standard NPS calculation
- Response Rate = (COUNT(responded) / COUNT(sent)) * 100

### 8. Support Tickets
**Purpose**: Track partner support quality and customer issues

```sql
CREATE TABLE support_tickets (
  id VARCHAR PRIMARY KEY,
  partner_id VARCHAR REFERENCES partners(id),
  customer_id VARCHAR,
  ticket_number VARCHAR,
  priority VARCHAR, -- 'low', 'medium', 'high', 'critical'
  status VARCHAR, -- 'open', 'in_progress', 'resolved', 'closed'
  is_escalated BOOLEAN,
  escalation_reason VARCHAR,
  created_date TIMESTAMP,
  resolved_date TIMESTAMP,
  closed_date TIMESTAMP,
  first_response_time_hours DECIMAL(5,2),
  resolution_time_hours DECIMAL(5,2),
  first_call_resolution BOOLEAN
);
```

**Metrics Calculated**:
- Support Tickets = COUNT(*) WHERE created_date IN quarter
- Escalation Rate = (COUNT(escalated) / COUNT(*)) * 100
- FCR Rate = (COUNT(first_call_resolution) / COUNT(*)) * 100
- Avg Resolution Time = AVG(resolution_time_hours)

### 9. Implementations
**Purpose**: Track delivery efficiency

```sql
CREATE TABLE implementations (
  id VARCHAR PRIMARY KEY,
  partner_id VARCHAR REFERENCES partners(id),
  customer_id VARCHAR,
  project_name VARCHAR,
  project_type VARCHAR, -- 'standard', 'enterprise', 'complex'
  planned_start_date DATE,
  actual_start_date DATE,
  planned_go_live_date DATE,
  actual_go_live_date DATE,
  status VARCHAR, -- 'planning', 'in_progress', 'completed', 'delayed'
  health_status VARCHAR, -- 'green', 'yellow', 'red'
  created_at TIMESTAMP
);
```

**Metrics Calculated**:
- Avg Time to Go-Live = AVG(actual_go_live_date - actual_start_date) WHERE status = 'completed'
- On-Time Delivery Rate = (COUNT(on_time) / COUNT(completed)) * 100
- Project Success Rate = (COUNT(health_status = 'green') / COUNT(*)) * 100

### 10. Revenue Targets
**Purpose**: Store partner-specific targets for attainment calculations

```sql
CREATE TABLE revenue_targets (
  id VARCHAR PRIMARY KEY,
  partner_id VARCHAR REFERENCES partners(id),
  fiscal_year INTEGER,
  fiscal_quarter VARCHAR,
  revenue_target DECIMAL(10,2),
  mdf_allocation DECIMAL(10,2),
  created_at TIMESTAMP,
  created_by VARCHAR
);
```

---

## Calculation Logic Examples

### Revenue Growth Calculation
```sql
-- Current Quarter Revenue
WITH current_quarter AS (
  SELECT SUM(amount) as revenue
  FROM opportunities
  WHERE partner_id = :partner_id
    AND is_won = true
    AND close_date BETWEEN :quarter_start AND :quarter_end
),
-- Previous Quarter Revenue
previous_quarter AS (
  SELECT SUM(amount) as revenue
  FROM opportunities
  WHERE partner_id = :partner_id
    AND is_won = true
    AND close_date BETWEEN :prev_quarter_start AND :prev_quarter_end
)
SELECT 
  current.revenue as current_revenue,
  previous.revenue as previous_revenue,
  ((current.revenue - previous.revenue) / previous.revenue * 100) as growth_rate
FROM current_quarter current, previous_quarter previous;
```

### Health Score Calculation
```javascript
function calculateHealthScore(metrics) {
  // Weight each component
  const components = {
    revenueAttainment: {
      value: Math.min(metrics.revenue.attainment, 150) / 1.5,
      weight: 0.30
    },
    pipelineHealth: {
      value: (
        Math.min(metrics.pipeline.coverage, 300) / 3 * 0.5 +
        Math.min(metrics.pipeline.conversion, 50) * 2 * 0.5
      ),
      weight: 0.25
    },
    engagement: {
      value: (
        metrics.training.completionRate * 0.5 +
        Math.min(metrics.portal.loginFrequency / 30 * 100, 100) * 0.5
      ),
      weight: 0.20
    },
    customerSatisfaction: {
      value: (metrics.csat.score / 5) * 100,
      weight: 0.15
    },
    salesVelocity: {
      value: (
        Math.min(metrics.deals.winRate, 40) * 2.5 * 0.5 +
        Math.max(0, 100 - metrics.sales.avgDaysToClose) * 0.5
      ),
      weight: 0.10
    }
  }
  
  // Calculate weighted score
  let healthScore = 0
  for (const component of Object.values(components)) {
    healthScore += component.value * component.weight
  }
  
  return Math.round(Math.min(100, Math.max(0, healthScore)))
}
```

### Risk Level Determination
```javascript
function calculateRiskLevel(metrics) {
  const riskFactors = []
  
  // Check risk conditions
  if (metrics.healthScore < 55) riskFactors.push('low_health_score')
  if (metrics.revenue.growth < -10) riskFactors.push('declining_revenue')
  if (metrics.csat.score < 3.5) riskFactors.push('poor_satisfaction')
  if (metrics.pipeline.coverage < 100) riskFactors.push('insufficient_pipeline')
  if (metrics.training.completionRate < 70) riskFactors.push('low_enablement')
  if (metrics.portal.daysSinceLastLogin > 30) riskFactors.push('disengaged')
  
  // Determine risk level
  if (riskFactors.length >= 3 || metrics.healthScore < 40) return 'High'
  if (riskFactors.length >= 1 || metrics.healthScore < 70) return 'Medium'
  return 'Low'
}
```

---

## Implementation Approach

### Phase 1: Core Revenue & Pipeline (Week 1)
- [ ] Create opportunities table and import historical data
- [ ] Implement revenue calculation functions
- [ ] Create pipeline analytics
- [ ] Build revenue target management

### Phase 2: Partner Engagement (Week 2)
- [ ] Set up training records tracking
- [ ] Implement portal activity logging
- [ ] Create certification management
- [ ] Build engagement scoring

### Phase 3: Customer Success (Week 3)
- [ ] Implement survey system
- [ ] Create support ticket tracking
- [ ] Build implementation tracking
- [ ] Calculate delivery metrics

### Phase 4: Advanced Analytics (Week 4)
- [ ] Implement health score algorithm
- [ ] Create risk assessment logic
- [ ] Build predictive models
- [ ] Set up automated alerts

---

## Data Quality Requirements

1. **Opportunities**: Must have accurate close dates and amounts
2. **Training Records**: Need completion tracking with timestamps
3. **Portal Activity**: Requires user-level tracking for accuracy
4. **Surveys**: Need consistent scoring methodology (1-5 scale)
5. **Support Tickets**: Must track escalations and resolution times

---

## Notes for Implementation

1. All calculations should be **idempotent** - running them multiple times produces the same result
2. Consider **caching** calculated metrics for performance (invalidate on source data change)
3. Implement **audit logging** for all calculations for troubleshooting
4. Create **data quality dashboards** to monitor source data completeness
5. Build **reconciliation reports** to verify calculations against manual checks

This approach ensures that all metrics are:
- **Auditable**: Can trace any metric back to source data
- **Accurate**: Based on real business transactions
- **Consistent**: Same calculation logic applied everywhere
- **Real-time**: Can be recalculated as source data changes