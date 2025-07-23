# Salesforce Data Requirements for QBR Navigator

## Overview
This document outlines all data requirements needed from the Salesforce team to implement real data integration for the QBR Navigator partner management tool. The data will replace the current dummy data and enable production-ready partner analytics.

---

## 🏢 Partner Master Data

### Partner Information
**Source**: Salesforce Partner Account Records
**Update Frequency**: Real-time sync or daily batch

| Field | Salesforce Field | Data Type | Required | Notes |
|-------|------------------|-----------|----------|--------|
| Partner ID | `Account.Id` | String | Yes | Primary key for partner identification |
| Partner Name | `Account.Name` | String | Yes | Company name |
| Partner Tier | `Account.Partner_Tier__c` | Picklist | Yes | Strategic/Select/Registered |
| Partner Segment | `Account.Partner_Segment__c` | Picklist | Yes | Focus/Assist |
| Region | `Account.BillingCountry` or `Account.Region__c` | String | Yes | Geographic region |
| Partner Manager | `Account.Partner_Manager__c` | Lookup(User) | Yes | Internal partner manager |
| Account Manager | `Account.Owner` | Lookup(User) | Yes | Account owner/manager |
| Partner Status | `Account.Partner_Status__c` | Picklist | Yes | Active/Inactive/Onboarding |
| Join Date | `Account.Partner_Start_Date__c` | Date | Yes | Partnership start date |
| Contract End Date | `Account.Contract_End_Date__c` | Date | No | For risk assessment |

---

## 💰 Revenue & Financial Data

### Revenue Metrics
**Source**: Salesforce Opportunity Records + Custom Revenue Objects
**Historical Period**: 8 quarters minimum (2 years)
**Update Frequency**: Daily

| Metric | Salesforce Source | Calculation | Historical Data Needed |
|--------|-------------------|-------------|------------------------|
| **Current Quarter Revenue** | `Opportunity.Amount` where `CloseDate` in current quarter and `StageName` = 'Closed Won' and `Partner__c` = Partner ID | SUM(Amount) | Last 8 quarters |
| **Previous Quarter Revenue** | Same as above for previous quarter | SUM(Amount) | Last 8 quarters |
| **YTD Revenue** | Current year closed won opportunities | SUM(Amount) | Current year + previous year |
| **Revenue Target** | `Account.Revenue_Target__c` or `Territory.Revenue_Target__c` | Direct field | Current + last 4 quarters |
| **Revenue Growth (QoQ)** | ((Current - Previous) / Previous) * 100 | Calculated | Quarterly data for trending |
| **Revenue Attainment** | (Actual / Target) * 100 | Calculated | Quarterly targets vs actuals |

### Data Requirements:
```sql
-- Revenue data query example
SELECT 
    Account.Id as PartnerID,
    Account.Name as PartnerName,
    Opportunity.Amount,
    Opportunity.CloseDate,
    Opportunity.StageName,
    DATEPART(quarter, Opportunity.CloseDate) as Quarter,
    DATEPART(year, Opportunity.CloseDate) as Year
FROM Opportunity 
INNER JOIN Account ON Opportunity.Partner__c = Account.Id
WHERE Opportunity.CloseDate >= '2022-01-01'
AND Opportunity.StageName = 'Closed Won'
```

---

## 🎯 Pipeline & Sales Data

### Pipeline Metrics
**Source**: Salesforce Opportunity Records
**Historical Period**: 12 months minimum
**Update Frequency**: Daily

| Metric | Salesforce Source | Calculation | Data Needed |
|--------|-------------------|-------------|-------------|
| **Pipeline Count** | `Opportunity.Id` where `IsClosed` = false | COUNT(Id) | Current snapshot |
| **Pipeline Value** | `Opportunity.Amount` where `IsClosed` = false | SUM(Amount) | Current + 12 months trend |
| **Pipeline Coverage** | Pipeline Value / Revenue Target * 100 | Calculated | Current quarter target |
| **Average Deal Size** | Pipeline Value / Pipeline Count | Calculated | Last 4 quarters for trending |
| **Pipeline Conversion Rate** | (Closed Won / Total Opportunities) * 100 | Historical calculation | Last 12 months |
| **Sales Velocity** | Days from creation to close | AVG(CloseDate - CreatedDate) | Last 12 months |

### Required Fields:
- `Opportunity.Id`
- `Opportunity.Amount` 
- `Opportunity.StageName`
- `Opportunity.CloseDate`
- `Opportunity.CreatedDate`
- `Opportunity.IsClosed`
- `Opportunity.IsWon`
- `Opportunity.Partner__c` (Partner relationship)

---

## 📝 Deal Registration Data

### Deal Registration Funnel
**Source**: Custom Deal Registration Object or Opportunity Records
**Historical Period**: 12 months
**Update Frequency**: Daily

| Metric | Salesforce Source | Field/Calculation | Historical Data |
|--------|-------------------|-------------------|-----------------|
| **Deals Submitted** | `Deal_Registration__c.Status__c` = 'Submitted' | COUNT(Id) | Monthly totals for 12 months |
| **Deals Approved** | `Deal_Registration__c.Status__c` = 'Approved' | COUNT(Id) | Monthly totals for 12 months |
| **Deals Won** | `Deal_Registration__c.Status__c` = 'Won' | COUNT(Id) | Monthly totals for 12 months |
| **Win Rate** | (Won / Submitted) * 100 | Calculated | Quarterly win rates |
| **Approval Rate** | (Approved / Submitted) * 100 | Calculated | Monthly approval rates |

### Required Deal Registration Fields:
- `Deal_Registration__c.Id`
- `Deal_Registration__c.Partner__c`
- `Deal_Registration__c.Status__c`
- `Deal_Registration__c.Submitted_Date__c`
- `Deal_Registration__c.Approved_Date__c`
- `Deal_Registration__c.Won_Date__c`
- `Deal_Registration__c.Opportunity__c` (if linked)

---

## 🎓 Partner Engagement & Training Data

### Training & Certification Metrics
**Source**: Partner Portal/LMS Integration or Custom Objects
**Historical Period**: 12 months
**Update Frequency**: Weekly

| Metric | Data Source | Field | Historical Requirements |
|--------|-------------|--------|------------------------|
| **Portal Logins (30d)** | `Partner_Activity__c` | Login events | Daily login data for 12 months |
| **Trainings Completed** | `Training_Completion__c` | Completion records | All training completions |
| **Active Certifications** | `Certification__c` where `Status__c` = 'Active' | COUNT(Id) | Current + certification history |
| **Training Completion Rate** | (Completed / Required) * 100 | Calculated from training assignments | Monthly rates for 12 months |
| **Last Activity Date** | `Partner_Activity__c.LastLoginDate__c` | MAX(Activity_Date__c) | Most recent activity |
| **Event Participation** | `Event_Attendance__c` | Attendance records | 12 months of event data |

### Required Training Data Fields:
- `Training_Completion__c.Partner__c`
- `Training_Completion__c.Training_Name__c`
- `Training_Completion__c.Completion_Date__c`
- `Training_Completion__c.Status__c`
- `Certification__c.Partner__c`
- `Certification__c.Certification_Name__c`
- `Certification__c.Issue_Date__c`
- `Certification__c.Expiry_Date__c`
- `Partner_Activity__c.Partner__c`
- `Partner_Activity__c.Activity_Date__c`
- `Partner_Activity__c.Activity_Type__c`

---

## 💵 Marketing Development Fund (MDF) Data

### MDF Utilization Metrics
**Source**: MDF Management System or Custom Salesforce Objects
**Historical Period**: 12 months
**Update Frequency**: Weekly

| Metric | Data Source | Calculation | Historical Data |
|--------|-------------|-------------|-----------------|
| **MDF Allocation** | `MDF_Budget__c.Allocated_Amount__c` | Direct field | Quarterly allocations |
| **MDF Utilized** | `MDF_Request__c.Approved_Amount__c` where `Status__c` = 'Approved' | SUM(Amount) | Monthly utilization |
| **MDF Utilization Rate** | (Utilized / Allocated) * 100 | Calculated | Monthly rates for 12 months |
| **MDF Requests Submitted** | `MDF_Request__c` | COUNT(Id) | Monthly request volumes |
| **MDF Approval Rate** | (Approved Requests / Total Requests) * 100 | Calculated | Monthly approval rates |

### Required MDF Fields:
- `MDF_Budget__c.Partner__c`
- `MDF_Budget__c.Allocated_Amount__c`
- `MDF_Budget__c.Budget_Period__c`
- `MDF_Request__c.Partner__c`
- `MDF_Request__c.Requested_Amount__c`
- `MDF_Request__c.Approved_Amount__c`
- `MDF_Request__c.Status__c`
- `MDF_Request__c.Request_Date__c`
- `MDF_Request__c.Approval_Date__c`

---

## 📞 Customer Satisfaction & Support Data

### Delivery & Support Metrics
**Source**: Service Cloud Cases + Customer Satisfaction Surveys
**Historical Period**: 12 months
**Update Frequency**: Daily

| Metric | Data Source | Field/Calculation | Historical Requirements |
|--------|-------------|-------------------|------------------------|
| **Customer Satisfaction Score** | `Survey_Response__c.CSAT_Score__c` | AVG(Score) per partner | Monthly CSAT scores |
| **Average Time to Go-Live** | `Implementation__c.Go_Live_Date__c - Created_Date__c` | AVG(Days) | All implementations |
| **Support Tickets** | `Case.Id` where `Account.Partner__c` = Partner | COUNT(Id) | Monthly ticket volumes |
| **Escalations** | `Case.Id` where `Priority` = 'High' or `Escalated__c` = true | COUNT(Id) | Monthly escalation counts |
| **First Call Resolution** | `Case.Resolution_Method__c` = 'First Call' | (FCR Cases / Total Cases) * 100 | Monthly FCR rates |

### Required Support Data Fields:
- `Case.Id`
- `Case.AccountId`
- `Case.Priority`
- `Case.Status`
- `Case.CreatedDate`
- `Case.ClosedDate`
- `Case.Escalated__c`
- `Survey_Response__c.Partner__c`
- `Survey_Response__c.CSAT_Score__c`
- `Survey_Response__c.Survey_Date__c`
- `Implementation__c.Partner__c`
- `Implementation__c.Go_Live_Date__c`
- `Implementation__c.Project_Start_Date__c`

---

## 📊 Health Score Calculation Data

### Health Score Components
**Source**: Calculated from multiple data sources
**Update Frequency**: Daily calculation

| Component | Weight | Data Sources | Calculation Method |
|-----------|--------|--------------|-------------------|
| **Revenue Performance** | 30% | Revenue vs Target | (Revenue Attainment / 100) * 30 |
| **Pipeline Health** | 25% | Pipeline Coverage + Conversion | Combined pipeline metrics |
| **Engagement Score** | 20% | Training + Portal Activity | Engagement metrics average |
| **Customer Satisfaction** | 15% | CSAT Scores | CSAT average |
| **Deal Velocity** | 10% | Win Rate + Sales Cycle | Deal performance metrics |

### Health Score Formula:
```
Health Score = (
    (Revenue_Performance * 0.30) +
    (Pipeline_Health * 0.25) +
    (Engagement_Score * 0.20) +
    (Customer_Satisfaction * 0.15) +
    (Deal_Velocity * 0.10)
)
```

---

## 🔄 Data Integration Requirements

### API Requirements
1. **Salesforce REST API Access**: Read access to all objects mentioned above
2. **Real-time Webhooks**: For critical data updates (revenue, deals)
3. **Bulk Data API**: For historical data loading
4. **OAuth 2.0 Authentication**: Secure API access

### Data Sync Strategy
- **Real-time**: Partner info, opportunities, cases
- **Daily Batch**: Revenue calculations, pipeline metrics
- **Weekly Batch**: Training data, MDF utilization
- **Monthly Batch**: Historical trending data

### Data Storage Requirements
- **Database**: PostgreSQL (via Supabase)
- **Data Retention**: 24+ months for trending analysis
- **Backup Strategy**: Daily incremental, weekly full backups

---

## 📋 Implementation Checklist

### Phase 1: Core Data (Week 1-2)
- [ ] Partner master data sync
- [ ] Revenue and opportunity data
- [ ] Basic pipeline metrics
- [ ] Health score calculation

### Phase 2: Engagement Data (Week 3-4)
- [ ] Training and certification data
- [ ] Portal activity tracking
- [ ] MDF utilization metrics
- [ ] Deal registration funnel

### Phase 3: Advanced Analytics (Week 5-6)
- [ ] Customer satisfaction integration
- [ ] Support metrics
- [ ] Historical trending data
- [ ] Benchmarking calculations

### Phase 4: Optimization (Week 7-8)
- [ ] Real-time data sync
- [ ] Performance optimization
- [ ] Data validation and quality checks
- [ ] Automated reporting

---

## 🔧 Technical Specifications

### Data Format Requirements
- **Date Format**: ISO 8601 (YYYY-MM-DD)
- **Currency**: USD with 2 decimal places
- **Text Encoding**: UTF-8
- **API Response**: JSON format
- **Null Handling**: Explicit null values, not empty strings

### Performance Requirements
- **API Response Time**: < 2 seconds for individual partner data
- **Bulk Data Load**: < 30 minutes for complete historical sync
- **Real-time Updates**: < 5 seconds from Salesforce to QBR Navigator
- **Dashboard Load Time**: < 3 seconds for complete partner QBR

---

## 📞 Next Steps

1. **Salesforce Team Review**: Validate all data sources exist and are accessible
2. **Custom Field Creation**: Create any missing custom fields identified above
3. **API Access Setup**: Provide connected app credentials and permissions
4. **Data Quality Assessment**: Review data completeness and accuracy
5. **Integration Testing**: Start with one partner for proof of concept
6. **Go-Live Planning**: Gradual rollout to all partners

---

## 📧 Contact Information

**Development Team**: [Your Team Contact]
**Salesforce Admin**: [SF Admin Contact]
**Project Manager**: [PM Contact]

---

*This document should be reviewed and approved by both Salesforce administration and development teams before implementation begins.*